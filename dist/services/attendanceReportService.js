"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceReportService = void 0;
const baseService_1 = require("./baseService");
const errorHandler_1 = require("../middleware/errorHandler");
class AttendanceReportService extends baseService_1.BaseService {
    async generateAttendanceReport(reportQuery, userId, userRole) {
        const startDate = new Date(reportQuery.startDate);
        const endDate = new Date(reportQuery.endDate);
        if (startDate > endDate) {
            throw new errorHandler_1.AppError('Start date cannot be after end date', 400);
        }
        let whereClause = 'WHERE a.date BETWEEN $1 AND $2';
        const queryParams = [reportQuery.startDate, reportQuery.endDate];
        whereClause = this.addAuthorizationFilters(whereClause, queryParams, userId, userRole);
        whereClause = this.addOptionalFilters(whereClause, queryParams, reportQuery);
        let reportData = [];
        let summary = {};
        switch (reportQuery.groupBy) {
            case 'student':
                reportData = await this.generateStudentAttendanceReport(whereClause, queryParams, reportQuery);
                break;
            case 'class':
                reportData = await this.generateClassAttendanceReport(whereClause, queryParams, reportQuery);
                break;
            case 'date':
                reportData = await this.generateDateAttendanceReport(whereClause, queryParams, reportQuery);
                break;
            case 'subject':
                reportData = await this.generateSubjectAttendanceReport(whereClause, queryParams, reportQuery);
                break;
            default:
                reportData = await this.generateStudentAttendanceReport(whereClause, queryParams, reportQuery);
        }
        summary = await this.calculateAttendanceSummary(whereClause, queryParams);
        if (reportQuery.minAttendancePercentage && reportQuery.groupBy === 'student') {
            reportData = reportData.filter((item) => item.attendancePercentage >= reportQuery.minAttendancePercentage);
        }
        const reportMetadata = {
            reportId: `ATT_${Date.now()}`,
            reportType: 'attendance',
            title: `Attendance Report - ${reportQuery.groupBy} wise`,
            description: `Attendance report from ${reportQuery.startDate} to ${reportQuery.endDate}`,
            generatedBy: userId,
            generatedAt: new Date().toISOString(),
            parameters: reportQuery,
            format: reportQuery.format || 'json',
        };
        const reportSummary = {
            totalRecords: reportData.length,
            dateRange: {
                startDate: reportQuery.startDate,
                endDate: reportQuery.endDate,
            },
            filters: {
                classId: reportQuery.classId,
                studentId: reportQuery.studentId,
                subjectId: reportQuery.subjectId,
                status: reportQuery.status,
                groupBy: reportQuery.groupBy,
            },
            aggregations: summary,
        };
        return {
            metadata: reportMetadata,
            summary: reportSummary,
            data: reportData,
        };
    }
    async getAttendanceTrends(filters, userId, userRole) {
        const { startDate, endDate, classId, studentId, period } = filters;
        if (!startDate || !endDate) {
            throw new errorHandler_1.AppError('Start date and end date are required', 400);
        }
        let whereClause = 'WHERE a.date BETWEEN $1 AND $2';
        const queryParams = [startDate, endDate];
        whereClause = this.addAuthorizationFilters(whereClause, queryParams, userId, userRole);
        if (classId) {
            whereClause += ` AND a.class_id = $${queryParams.length + 1}`;
            queryParams.push(classId);
        }
        if (studentId) {
            whereClause += ` AND a.student_id = $${queryParams.length + 1}`;
            queryParams.push(studentId);
        }
        const periodGrouping = period === 'weekly' ?
            "DATE_TRUNC('week', a.date)" :
            period === 'monthly' ?
                "DATE_TRUNC('month', a.date)" :
                "a.date";
        const trendsResult = await this.executeQuery(`SELECT 
         ${periodGrouping} as period,
         COUNT(*) as total_records,
         COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
         COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
         COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
         COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_count,
         ROUND(
           (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
           2
         ) as attendance_percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN classes c ON a.class_id = c.id
       ${whereClause}
       GROUP BY ${periodGrouping}
       ORDER BY period`, queryParams);
        const [lowAttendanceResult, dayPatternsResult] = await Promise.all([
            this.getLowAttendanceAlerts(whereClause, queryParams),
            this.getDayPatterns(whereClause, queryParams)
        ]);
        return {
            trends: trendsResult.rows.map((row) => ({
                period: row.period,
                totalRecords: parseInt(row.total_records),
                presentCount: parseInt(row.present_count),
                absentCount: parseInt(row.absent_count),
                lateCount: parseInt(row.late_count),
                excusedCount: parseInt(row.excused_count),
                attendancePercentage: parseFloat(row.attendance_percentage),
            })),
            lowAttendanceAlerts: lowAttendanceResult,
            dayPatterns: dayPatternsResult,
        };
    }
    async getAttendanceStatistics(period, userId, userRole) {
        const { startDate, endDate } = this.calculateDateRange(period);
        let whereClause = 'WHERE a.date BETWEEN $1 AND $2';
        const queryParams = [startDate, endDate];
        whereClause = this.addAuthorizationFilters(whereClause, queryParams, userId, userRole);
        const [statsResult, classStatsResult, recentActivitiesResult] = await Promise.all([
            this.getOverallStats(whereClause, queryParams),
            this.getClassStats(whereClause, queryParams),
            this.getRecentActivities(whereClause, queryParams)
        ]);
        const stats = statsResult.rows[0];
        return {
            period: period,
            dateRange: { startDate, endDate },
            overview: {
                totalStudents: parseInt(stats.total_students),
                totalClasses: parseInt(stats.total_classes),
                totalRecords: parseInt(stats.total_records),
                presentCount: parseInt(stats.present_count),
                absentCount: parseInt(stats.absent_count),
                lateCount: parseInt(stats.late_count),
                excusedCount: parseInt(stats.excused_count),
                overallAttendancePercentage: parseFloat(stats.overall_attendance_percentage),
            },
            topPerformingClasses: classStatsResult.rows.map((row) => ({
                classId: row.class_id,
                className: row.class_name,
                grade: row.grade,
                section: row.section,
                attendancePercentage: parseFloat(row.attendance_percentage),
            })),
            recentActivities: recentActivitiesResult.rows.map((row) => ({
                date: row.date,
                status: row.status,
                studentNumber: row.student_number,
                studentName: `${row.first_name} ${row.last_name}`,
                className: row.class_name,
                markedAt: row.marked_at,
            })),
        };
    }
    async exportAttendanceData(format, reportQuery, userId, userRole) {
        if (!['csv', 'json', 'excel'].includes(format)) {
            throw new errorHandler_1.AppError('Invalid export format. Supported formats: csv, json, excel', 400);
        }
        const exportData = await this.generateSimpleAttendanceExport(reportQuery, userId, userRole);
        if (format === 'json') {
            return {
                data: exportData,
                exportInfo: {
                    format: 'json',
                    recordCount: exportData.length,
                    generatedAt: new Date().toISOString(),
                },
            };
        }
        else {
            const csvData = this.convertToCSV(exportData);
            return {
                csvData,
                filename: `attendance_report_${Date.now()}.${format === 'excel' ? 'xls' : 'csv'}`,
                mimeType: format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv',
            };
        }
    }
    addAuthorizationFilters(whereClause, queryParams, userId, userRole) {
        if (userRole === 'teacher') {
            whereClause += ` AND (c.teacher_id = $${queryParams.length + 1} OR EXISTS (
        SELECT 1 FROM class_subjects cs 
        WHERE cs.class_id = c.id AND cs.teacher_id = $${queryParams.length + 1}
      ))`;
            queryParams.push(userId);
        }
        else if (userRole === 'student') {
            whereClause += ` AND s.user_id = $${queryParams.length + 1}`;
            queryParams.push(userId);
        }
        else if (userRole === 'parent') {
            whereClause += ` AND EXISTS (
        SELECT 1 FROM student_parents sp 
        WHERE sp.student_id = s.id AND sp.parent_user_id = $${queryParams.length + 1}
      )`;
            queryParams.push(userId);
        }
        return whereClause;
    }
    addOptionalFilters(whereClause, queryParams, reportQuery) {
        if (reportQuery.classId) {
            whereClause += ` AND a.class_id = $${queryParams.length + 1}`;
            queryParams.push(reportQuery.classId);
        }
        if (reportQuery.studentId) {
            whereClause += ` AND a.student_id = $${queryParams.length + 1}`;
            queryParams.push(reportQuery.studentId);
        }
        if (reportQuery.subjectId) {
            whereClause += ` AND a.subject_id = $${queryParams.length + 1}`;
            queryParams.push(reportQuery.subjectId);
        }
        if (reportQuery.status) {
            whereClause += ` AND a.status = $${queryParams.length + 1}`;
            queryParams.push(reportQuery.status);
        }
        if (!reportQuery.includeInactive) {
            whereClause += ' AND s.is_active = true AND c.is_active = true';
        }
        return whereClause;
    }
    async generateStudentAttendanceReport(whereClause, queryParams, reportQuery) {
        const result = await this.executeQuery(`SELECT 
         s.id as student_id,
         s.student_id as student_number,
         u.first_name,
         u.last_name,
         c.name as class_name,
         c.grade,
         c.section,
         COUNT(*) as total_days,
         COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
         COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
         COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
         COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_days,
         ROUND(
           (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
           2
         ) as attendance_percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON a.class_id = c.id
       ${whereClause}
       GROUP BY s.id, s.student_id, u.first_name, u.last_name, c.name, c.grade, c.section
       ORDER BY u.first_name, u.last_name`, queryParams);
        return result.rows.map((row) => ({
            studentId: row.student_id,
            studentNumber: row.student_number,
            studentName: `${row.first_name} ${row.last_name}`,
            className: row.class_name,
            grade: row.grade,
            section: row.section,
            totalDays: parseInt(row.total_days),
            presentDays: parseInt(row.present_days),
            absentDays: parseInt(row.absent_days),
            lateDays: parseInt(row.late_days),
            excusedDays: parseInt(row.excused_days),
            attendancePercentage: parseFloat(row.attendance_percentage),
        }));
    }
    async generateClassAttendanceReport(whereClause, queryParams, reportQuery) {
        const result = await this.executeQuery(`SELECT 
         c.id as class_id,
         c.name as class_name,
         c.grade,
         c.section,
         COUNT(DISTINCT s.id) as total_students,
         COUNT(*) as total_records,
         COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
         COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
         COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
         COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_count,
         ROUND(
           (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
           2
         ) as attendance_percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN classes c ON a.class_id = c.id
       ${whereClause}
       GROUP BY c.id, c.name, c.grade, c.section
       ORDER BY c.grade, c.section`, queryParams);
        return result.rows.map((row) => ({
            classId: row.class_id,
            className: row.class_name,
            grade: row.grade,
            section: row.section,
            totalStudents: parseInt(row.total_students),
            totalRecords: parseInt(row.total_records),
            presentCount: parseInt(row.present_count),
            absentCount: parseInt(row.absent_count),
            lateCount: parseInt(row.late_count),
            excusedCount: parseInt(row.excused_count),
            attendancePercentage: parseFloat(row.attendance_percentage),
        }));
    }
    async generateDateAttendanceReport(whereClause, queryParams, reportQuery) {
        const result = await this.executeQuery(`SELECT 
         a.date,
         COUNT(DISTINCT s.id) as total_students,
         COUNT(*) as total_records,
         COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
         COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
         COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
         COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_count,
         ROUND(
           (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
           2
         ) as attendance_percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN classes c ON a.class_id = c.id
       ${whereClause}
       GROUP BY a.date
       ORDER BY a.date`, queryParams);
        return result.rows.map((row) => ({
            date: row.date,
            totalStudents: parseInt(row.total_students),
            totalRecords: parseInt(row.total_records),
            presentCount: parseInt(row.present_count),
            absentCount: parseInt(row.absent_count),
            lateCount: parseInt(row.late_count),
            excusedCount: parseInt(row.excused_count),
            attendancePercentage: parseFloat(row.attendance_percentage),
        }));
    }
    async generateSubjectAttendanceReport(whereClause, queryParams, reportQuery) {
        const result = await this.executeQuery(`SELECT 
         COALESCE(subj.id, 'general') as subject_id,
         COALESCE(subj.name, 'General Class') as subject_name,
         COALESCE(subj.code, 'GEN') as subject_code,
         COUNT(DISTINCT s.id) as total_students,
         COUNT(*) as total_records,
         COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
         COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
         COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
         COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_count,
         ROUND(
           (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
           2
         ) as attendance_percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN classes c ON a.class_id = c.id
       LEFT JOIN subjects subj ON a.subject_id = subj.id
       ${whereClause}
       GROUP BY subj.id, subj.name, subj.code
       ORDER BY subj.name NULLS FIRST`, queryParams);
        return result.rows.map((row) => ({
            subjectId: row.subject_id,
            subjectName: row.subject_name,
            subjectCode: row.subject_code,
            totalStudents: parseInt(row.total_students),
            totalRecords: parseInt(row.total_records),
            presentCount: parseInt(row.present_count),
            absentCount: parseInt(row.absent_count),
            lateCount: parseInt(row.late_count),
            excusedCount: parseInt(row.excused_count),
            attendancePercentage: parseFloat(row.attendance_percentage),
        }));
    }
    async calculateAttendanceSummary(whereClause, queryParams) {
        const result = await this.executeQuery(`SELECT 
         COUNT(DISTINCT s.id) as total_students,
         COUNT(DISTINCT c.id) as total_classes,
         COUNT(DISTINCT a.date) as total_days,
         COUNT(*) as total_records,
         COUNT(CASE WHEN a.status = 'present' THEN 1 END) as total_present,
         COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as total_absent,
         COUNT(CASE WHEN a.status = 'late' THEN 1 END) as total_late,
         COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as total_excused,
         ROUND(
           (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
           2
         ) as overall_attendance_percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN classes c ON a.class_id = c.id
       ${whereClause}`, queryParams);
        const summary = result.rows[0];
        return {
            totalStudents: parseInt(summary.total_students),
            totalClasses: parseInt(summary.total_classes),
            totalDays: parseInt(summary.total_days),
            totalRecords: parseInt(summary.total_records),
            totalPresent: parseInt(summary.total_present),
            totalAbsent: parseInt(summary.total_absent),
            totalLate: parseInt(summary.total_late),
            totalExcused: parseInt(summary.total_excused),
            overallAttendancePercentage: parseFloat(summary.overall_attendance_percentage),
        };
    }
    calculateDateRange(period) {
        const today = new Date();
        let startDate;
        let endDate;
        switch (period) {
            case 'today':
                startDate = endDate = today.toISOString().split('T')[0];
                break;
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                startDate = weekStart.toISOString().split('T')[0];
                endDate = today.toISOString().split('T')[0];
                break;
            case 'month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                endDate = today.toISOString().split('T')[0];
                break;
            case 'semester':
                startDate = new Date(today.getFullYear(), today.getMonth() < 6 ? 0 : 6, 1).toISOString().split('T')[0];
                endDate = today.toISOString().split('T')[0];
                break;
            default:
                startDate = endDate = today.toISOString().split('T')[0];
        }
        return { startDate, endDate };
    }
    async getLowAttendanceAlerts(whereClause, queryParams) {
        const result = await this.executeQuery(`SELECT 
         s.id as student_id,
         s.student_id as student_number,
         u.first_name,
         u.last_name,
         c.name as class_name,
         ROUND(
           (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
           2
         ) as attendance_percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON a.class_id = c.id
       ${whereClause}
       GROUP BY s.id, s.student_id, u.first_name, u.last_name, c.name
       HAVING ROUND(
         (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
         2
       ) < 75
       ORDER BY attendance_percentage ASC`, queryParams);
        return result.rows.map((row) => ({
            studentId: row.student_id,
            studentNumber: row.student_number,
            studentName: `${row.first_name} ${row.last_name}`,
            className: row.class_name,
            attendancePercentage: parseFloat(row.attendance_percentage),
        }));
    }
    async getDayPatterns(whereClause, queryParams) {
        const result = await this.executeQuery(`SELECT 
         EXTRACT(DOW FROM a.date) as day_of_week,
         CASE EXTRACT(DOW FROM a.date)
           WHEN 0 THEN 'Sunday'
           WHEN 1 THEN 'Monday'
           WHEN 2 THEN 'Tuesday'
           WHEN 3 THEN 'Wednesday'
           WHEN 4 THEN 'Thursday'
           WHEN 5 THEN 'Friday'
           WHEN 6 THEN 'Saturday'
         END as day_name,
         COUNT(*) as total_records,
         COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
         ROUND(
           (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
           2
         ) as attendance_percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN classes c ON a.class_id = c.id
       ${whereClause}
       GROUP BY EXTRACT(DOW FROM a.date)
       ORDER BY day_of_week`, queryParams);
        return result.rows.map((row) => ({
            dayOfWeek: parseInt(row.day_of_week),
            dayName: row.day_name,
            totalRecords: parseInt(row.total_records),
            presentCount: parseInt(row.present_count),
            attendancePercentage: parseFloat(row.attendance_percentage),
        }));
    }
    async getOverallStats(whereClause, queryParams) {
        return await this.executeQuery(`SELECT 
         COUNT(DISTINCT s.id) as total_students,
         COUNT(DISTINCT c.id) as total_classes,
         COUNT(*) as total_records,
         COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
         COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
         COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
         COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_count,
         ROUND(
           (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
           2
         ) as overall_attendance_percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN classes c ON a.class_id = c.id
       ${whereClause}`, queryParams);
    }
    async getClassStats(whereClause, queryParams) {
        return await this.executeQuery(`SELECT 
         c.id as class_id,
         c.name as class_name,
         c.grade,
         c.section,
         COUNT(*) as total_records,
         ROUND(
           (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
           2
         ) as attendance_percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN classes c ON a.class_id = c.id
       ${whereClause}
       GROUP BY c.id, c.name, c.grade, c.section
       ORDER BY attendance_percentage DESC
       LIMIT 5`, queryParams);
    }
    async getRecentActivities(whereClause, queryParams) {
        return await this.executeQuery(`SELECT 
         a.date,
         a.status,
         s.student_id as student_number,
         u.first_name,
         u.last_name,
         c.name as class_name,
         a.created_at as marked_at
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON a.class_id = c.id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT 10`, queryParams);
    }
    async generateSimpleAttendanceExport(reportQuery, userId, userRole) {
        let whereClause = 'WHERE 1=1';
        const queryParams = [];
        if (reportQuery.startDate && reportQuery.endDate) {
            whereClause += ` AND a.date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
            queryParams.push(reportQuery.startDate, reportQuery.endDate);
        }
        whereClause = this.addAuthorizationFilters(whereClause, queryParams, userId, userRole);
        const result = await this.executeQuery(`SELECT 
         a.date,
         s.student_id as student_number,
         u.first_name,
         u.last_name,
         c.name as class_name,
         c.grade,
         c.section,
         COALESCE(subj.name, 'General') as subject_name,
         a.status,
         a.remarks,
         a.created_at as marked_at
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON a.class_id = c.id
       LEFT JOIN subjects subj ON a.subject_id = subj.id
       ${whereClause}
       ORDER BY a.date DESC, u.first_name, u.last_name`, queryParams);
        return result.rows.map((row) => ({
            date: row.date,
            studentNumber: row.student_number,
            studentName: `${row.first_name} ${row.last_name}`,
            className: row.class_name,
            grade: row.grade,
            section: row.section,
            subjectName: row.subject_name,
            status: row.status,
            remarks: row.remarks,
            markedAt: row.marked_at,
        }));
    }
    convertToCSV(data) {
        if (data.length === 0)
            return '';
        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        const csvRows = data.map(row => headers.map(header => {
            const value = row[header];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(','));
        return [csvHeaders, ...csvRows].join('\n');
    }
}
exports.AttendanceReportService = AttendanceReportService;
//# sourceMappingURL=attendanceReportService.js.map
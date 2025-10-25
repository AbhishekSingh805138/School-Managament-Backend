"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDashboardReport = exports.generateEnrollmentReport = exports.generateFinancialReport = exports.generateAcademicReport = exports.generateAttendanceReport = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const report_1 = require("../types/report");
exports.generateAttendanceReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const reportQuery = report_1.AttendanceReportQuerySchema.parse(req.query);
    const userId = req.user.id;
    const userRole = req.user.role;
    let authClause = '';
    const authParams = [];
    if (userRole === 'teacher') {
        authClause = ` AND (c.teacher_id = $${authParams.length + 1} OR EXISTS (
      SELECT 1 FROM class_subjects cs 
      WHERE cs.class_id = c.id AND cs.teacher_id = $${authParams.length + 1}
    ))`;
        authParams.push(userId, userId);
    }
    else if (userRole === 'student') {
        authClause = ` AND s.user_id = $${authParams.length + 1}`;
        authParams.push(userId);
    }
    else if (userRole === 'parent') {
        authClause = ` AND EXISTS (
      SELECT 1 FROM student_parents sp 
      WHERE sp.student_id = s.id AND sp.parent_user_id = $${authParams.length + 1}
    )`;
        authParams.push(userId);
    }
    let whereClause = `WHERE a.date BETWEEN $${authParams.length + 1} AND $${authParams.length + 2}`;
    const queryParams = [...authParams, reportQuery.startDate, reportQuery.endDate];
    if (reportQuery.classId) {
        whereClause += ` AND a.class_id = $${queryParams.length + 1}`;
        queryParams.push(reportQuery.classId);
    }
    if (reportQuery.studentId) {
        whereClause += ` AND a.student_id = $${queryParams.length + 1}`;
        queryParams.push(reportQuery.studentId);
    }
    if (reportQuery.status) {
        whereClause += ` AND a.status = $${queryParams.length + 1}`;
        queryParams.push(reportQuery.status);
    }
    whereClause += authClause;
    let reportData = [];
    let summary = {};
    switch (reportQuery.groupBy) {
        case 'student':
            reportData = await generateStudentAttendanceReport(whereClause, queryParams, reportQuery);
            break;
        case 'class':
            reportData = await generateClassAttendanceReport(whereClause, queryParams, reportQuery);
            break;
        case 'date':
            reportData = await generateDateAttendanceReport(whereClause, queryParams, reportQuery);
            break;
        default:
            reportData = await generateStudentAttendanceReport(whereClause, queryParams, reportQuery);
    }
    summary = await calculateAttendanceSummary(whereClause, queryParams);
    const reportResponse = formatReportResponse('attendance', 'Attendance Report', reportQuery, reportData, summary, userId);
    res.json({
        success: true,
        data: reportResponse
    });
});
exports.generateAcademicReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const reportQuery = report_1.AcademicReportQuerySchema.parse(req.query);
    const userId = req.user.id;
    const userRole = req.user.role;
    let authClause = '';
    const authParams = [];
    if (userRole === 'teacher') {
        authClause = ` AND EXISTS (
      SELECT 1 FROM class_subjects cs 
      JOIN students st ON st.class_id = cs.class_id
      WHERE st.id = g.student_id AND cs.teacher_id = $${authParams.length + 1}
    )`;
        authParams.push(userId);
    }
    else if (userRole === 'student') {
        authClause = ` AND s.user_id = $${authParams.length + 1}`;
        authParams.push(userId);
    }
    else if (userRole === 'parent') {
        authClause = ` AND EXISTS (
      SELECT 1 FROM student_parents sp 
      WHERE sp.student_id = s.id AND sp.parent_user_id = $${authParams.length + 1}
    )`;
        authParams.push(userId);
    }
    let whereClause = `WHERE g.semester_id = $${authParams.length + 1}`;
    const queryParams = [...authParams, reportQuery.semesterId];
    if (reportQuery.classId) {
        whereClause += ` AND s.class_id = $${queryParams.length + 1}`;
        queryParams.push(reportQuery.classId);
    }
    if (reportQuery.subjectId) {
        whereClause += ` AND g.subject_id = $${queryParams.length + 1}`;
        queryParams.push(reportQuery.subjectId);
    }
    if (reportQuery.assessmentTypeId) {
        whereClause += ` AND g.assessment_type_id = $${queryParams.length + 1}`;
        queryParams.push(reportQuery.assessmentTypeId);
    }
    if (reportQuery.minPercentage !== undefined) {
        whereClause += ` AND g.percentage >= $${queryParams.length + 1}`;
        queryParams.push(reportQuery.minPercentage);
    }
    if (reportQuery.gradeLetter) {
        whereClause += ` AND g.grade_letter = $${queryParams.length + 1}`;
        queryParams.push(reportQuery.gradeLetter);
    }
    whereClause += authClause;
    let reportData = [];
    let summary = {};
    switch (reportQuery.groupBy) {
        case 'student':
            reportData = await generateStudentAcademicReport(whereClause, queryParams, reportQuery);
            break;
        case 'subject':
            reportData = await generateSubjectAcademicReport(whereClause, queryParams, reportQuery);
            break;
        case 'class':
            reportData = await generateClassAcademicReport(whereClause, queryParams, reportQuery);
            break;
        default:
            reportData = await generateStudentAcademicReport(whereClause, queryParams, reportQuery);
    }
    summary = await calculateAcademicSummary(whereClause, queryParams);
    const reportResponse = formatReportResponse('academic', 'Academic Performance Report', reportQuery, reportData, summary, userId);
    res.json({
        success: true,
        data: reportResponse
    });
});
exports.generateFinancialReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const reportQuery = report_1.FinancialReportQuerySchema.parse(req.query);
    const userId = req.user.id;
    const userRole = req.user.role;
    let authClause = '';
    const authParams = [];
    if (userRole === 'teacher') {
        authClause = ` AND EXISTS (
      SELECT 1 FROM class_subjects cs 
      JOIN students st ON st.class_id = cs.class_id
      WHERE st.id = sf.student_id AND cs.teacher_id = $${authParams.length + 1}
    )`;
        authParams.push(userId);
    }
    else if (userRole === 'student') {
        authClause = ` AND s.user_id = $${authParams.length + 1}`;
        authParams.push(userId);
    }
    else if (userRole === 'parent') {
        authClause = ` AND EXISTS (
      SELECT 1 FROM student_parents sp 
      WHERE sp.student_id = s.id AND sp.parent_user_id = $${authParams.length + 1}
    )`;
        authParams.push(userId);
    }
    let whereClause = `WHERE sf.created_at BETWEEN $${authParams.length + 1} AND $${authParams.length + 2}`;
    const queryParams = [...authParams, reportQuery.startDate, reportQuery.endDate];
    if (reportQuery.classId) {
        whereClause += ` AND s.class_id = $${queryParams.length + 1}`;
        queryParams.push(reportQuery.classId);
    }
    if (reportQuery.feeCategoryId) {
        whereClause += ` AND sf.fee_category_id = $${queryParams.length + 1}`;
        queryParams.push(reportQuery.feeCategoryId);
    }
    if (reportQuery.status) {
        whereClause += ` AND sf.status = $${queryParams.length + 1}`;
        queryParams.push(reportQuery.status);
    }
    if (reportQuery.paymentMethod) {
        whereClause += ` AND EXISTS (
      SELECT 1 FROM payments p 
      WHERE p.student_fee_id = sf.id AND p.payment_method = $${queryParams.length + 1}
    )`;
        queryParams.push(reportQuery.paymentMethod);
    }
    whereClause += authClause;
    let reportData = [];
    let summary = {};
    switch (reportQuery.groupBy) {
        case 'student':
            reportData = await generateStudentFinancialReport(whereClause, queryParams, reportQuery);
            break;
        case 'class':
            reportData = await generateClassFinancialReport(whereClause, queryParams, reportQuery);
            break;
        case 'category':
            reportData = await generateCategoryFinancialReport(whereClause, queryParams, reportQuery);
            break;
        default:
            reportData = await generateStudentFinancialReport(whereClause, queryParams, reportQuery);
    }
    summary = await calculateFinancialSummary(whereClause, queryParams);
    const reportResponse = formatReportResponse('financial', 'Financial Report', reportQuery, reportData, summary, userId);
    res.json({
        success: true,
        data: reportResponse
    });
});
exports.generateEnrollmentReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const reportQuery = report_1.EnrollmentReportQuerySchema.parse(req.query);
    const userId = req.user.id;
    const userRole = req.user.role;
    if (!['admin', 'staff'].includes(userRole)) {
        throw new errorHandler_1.AppError('You are not authorized to access enrollment reports', 403);
    }
    let whereClause = `WHERE s.created_at BETWEEN $1 AND $2`;
    const queryParams = [reportQuery.startDate, reportQuery.endDate];
    if (reportQuery.classId) {
        whereClause += ` AND s.class_id = $${queryParams.length + 1}`;
        queryParams.push(reportQuery.classId);
    }
    if (reportQuery.academicYearId) {
        whereClause += ` AND c.academic_year_id = $${queryParams.length + 1}`;
        queryParams.push(reportQuery.academicYearId);
    }
    if (!reportQuery.includeInactive) {
        whereClause += ` AND s.is_active = true`;
    }
    let reportData = [];
    let summary = {};
    switch (reportQuery.groupBy) {
        case 'class':
            reportData = await generateClassEnrollmentReport(whereClause, queryParams, reportQuery);
            break;
        case 'grade':
            reportData = await generateGradeEnrollmentReport(whereClause, queryParams, reportQuery);
            break;
        case 'month':
            reportData = await generateMonthlyEnrollmentReport(whereClause, queryParams, reportQuery);
            break;
        default:
            reportData = await generateClassEnrollmentReport(whereClause, queryParams, reportQuery);
    }
    summary = await calculateEnrollmentSummary(whereClause, queryParams);
    const reportResponse = formatReportResponse('enrollment', 'Enrollment Report', reportQuery, reportData, summary, userId);
    res.json({
        success: true,
        data: reportResponse
    });
});
exports.generateDashboardReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userRole = req.user.role;
    if (userRole !== 'admin') {
        throw new errorHandler_1.AppError('Only administrators can access dashboard reports', 403);
    }
    const overviewStats = await (0, connection_1.query)(`
    SELECT 
      (SELECT COUNT(*) FROM students WHERE is_active = true) as total_students,
      (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND is_active = true) as total_teachers,
      (SELECT COUNT(*) FROM classes WHERE is_active = true) as total_classes,
      (SELECT COUNT(*) FROM staff WHERE is_active = true) as total_staff,
      (SELECT name FROM academic_years WHERE is_active = true ORDER BY start_date DESC LIMIT 1) as active_academic_year,
      (SELECT name FROM semesters WHERE is_active = true ORDER BY start_date DESC LIMIT 1) as current_semester
  `);
    const attendanceStats = await (0, connection_1.query)(`
    SELECT 
      ROUND(
        (COUNT(CASE WHEN status = 'present' THEN 1 END)::decimal / NULLIF(COUNT(*), 0)) * 100, 
        2
      ) as today_attendance,
      ROUND(
        (SELECT COUNT(CASE WHEN status = 'present' THEN 1 END)::decimal / NULLIF(COUNT(*), 0) * 100
         FROM attendance 
         WHERE date >= CURRENT_DATE - INTERVAL '7 days'), 
        2
      ) as weekly_average,
      ROUND(
        (SELECT COUNT(CASE WHEN status = 'present' THEN 1 END)::decimal / NULLIF(COUNT(*), 0) * 100
         FROM attendance 
         WHERE date >= CURRENT_DATE - INTERVAL '30 days'), 
        2
      ) as monthly_average,
      (SELECT COUNT(DISTINCT student_id) 
       FROM attendance 
       WHERE date >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY student_id
       HAVING (COUNT(CASE WHEN status = 'present' THEN 1 END)::decimal / COUNT(*)) < 0.75
      ) as low_attendance_students
    FROM attendance 
    WHERE date = CURRENT_DATE
  `);
    const academicStats = await (0, connection_1.query)(`
    SELECT 
      (SELECT mode() WITHIN GROUP (ORDER BY grade_letter) FROM grades WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as average_grade,
      (SELECT c.name || ' (' || c.grade || '-' || c.section || ')'
       FROM classes c
       JOIN students s ON c.id = s.class_id
       JOIN grades g ON s.id = g.student_id
       WHERE g.created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY c.id, c.name, c.grade, c.section
       ORDER BY AVG(g.percentage) DESC
       LIMIT 1
      ) as top_performing_class,
      (SELECT COUNT(DISTINCT g.student_id)
       FROM grades g
       WHERE g.percentage < 60 AND g.created_at >= CURRENT_DATE - INTERVAL '30 days'
      ) as students_needing_attention,
      (SELECT COUNT(*) FROM grades WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as recent_assessments
  `);
    const financialStats = await (0, connection_1.query)(`
    SELECT 
      COALESCE(SUM(p.amount), 0) as total_fees_collected,
      COALESCE(SUM(CASE WHEN sf.status IN ('pending', 'partial') THEN sf.total_amount - COALESCE(paid.amount, 0) END), 0) as pending_fees,
      COALESCE(SUM(CASE WHEN sf.status = 'overdue' THEN sf.total_amount - COALESCE(paid.amount, 0) END), 0) as overdue_fees,
      ROUND(
        (SUM(COALESCE(p.amount, 0)) / NULLIF(SUM(sf.total_amount), 0)) * 100, 
        2
      ) as collection_percentage
    FROM student_fees sf
    LEFT JOIN (
      SELECT student_fee_id, SUM(amount) as amount
      FROM payments
      GROUP BY student_fee_id
    ) p ON sf.id = p.student_fee_id
    LEFT JOIN (
      SELECT student_fee_id, SUM(amount) as amount
      FROM payments
      GROUP BY student_fee_id
    ) paid ON sf.id = paid.student_fee_id
    WHERE sf.created_at >= CURRENT_DATE - INTERVAL '1 year'
  `);
    const recentEnrollments = await (0, connection_1.query)(`
    SELECT 
      u.first_name || ' ' || u.last_name as student_name,
      c.name || ' (' || c.grade || '-' || c.section || ')' as class_name,
      s.created_at as enrollment_date
    FROM students s
    JOIN users u ON s.user_id = u.id
    JOIN classes c ON s.class_id = c.id
    WHERE s.created_at >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY s.created_at DESC
    LIMIT 5
  `);
    const recentPayments = await (0, connection_1.query)(`
    SELECT 
      u.first_name || ' ' || u.last_name as student_name,
      p.amount,
      p.payment_date
    FROM payments p
    JOIN student_fees sf ON p.student_fee_id = sf.id
    JOIN students s ON sf.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE p.payment_date >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY p.payment_date DESC
    LIMIT 5
  `);
    const overview = overviewStats.rows[0];
    const attendance = attendanceStats.rows[0];
    const academic = academicStats.rows[0];
    const financial = financialStats.rows[0];
    const dashboardData = {
        overview: {
            totalStudents: parseInt(overview.total_students) || 0,
            totalTeachers: parseInt(overview.total_teachers) || 0,
            totalClasses: parseInt(overview.total_classes) || 0,
            totalStaff: parseInt(overview.total_staff) || 0,
            activeAcademicYear: overview.active_academic_year || 'Not Set',
            currentSemester: overview.current_semester || 'Not Set',
        },
        attendance: {
            todayAttendance: parseFloat(attendance.today_attendance) || 0,
            weeklyAverage: parseFloat(attendance.weekly_average) || 0,
            monthlyAverage: parseFloat(attendance.monthly_average) || 0,
            lowAttendanceStudents: parseInt(attendance.low_attendance_students) || 0,
        },
        academic: {
            averageGrade: academic.average_grade || 'N/A',
            topPerformingClass: academic.top_performing_class || 'N/A',
            studentsNeedingAttention: parseInt(academic.students_needing_attention) || 0,
            recentAssessments: parseInt(academic.recent_assessments) || 0,
        },
        financial: {
            totalFeesCollected: parseFloat(financial.total_fees_collected) || 0,
            pendingFees: parseFloat(financial.pending_fees) || 0,
            overdueFees: parseFloat(financial.overdue_fees) || 0,
            collectionPercentage: parseFloat(financial.collection_percentage) || 0,
        },
        recent: {
            newEnrollments: recentEnrollments.rows.map((row) => ({
                studentName: row.student_name,
                className: row.class_name,
                enrollmentDate: row.enrollment_date.toISOString().split('T')[0],
            })),
            recentPayments: recentPayments.rows.map((row) => ({
                studentName: row.student_name,
                amount: parseFloat(row.amount),
                paymentDate: row.payment_date.toISOString().split('T')[0],
            })),
            upcomingEvents: [],
        },
    };
    res.json({
        success: true,
        data: dashboardData
    });
});
async function generateStudentAttendanceReport(whereClause, queryParams, reportQuery) {
    const result = await (0, connection_1.query)(`SELECT 
       s.id as student_id,
       s.student_id as student_number,
       u.first_name,
       u.last_name,
       c.name as class_name,
       c.grade,
       c.section,
       COUNT(a.id) as total_days,
       COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
       COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
       COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
       ROUND(
         (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::decimal / NULLIF(COUNT(a.id), 0)) * 100, 
         2
       ) as attendance_percentage
     FROM attendance a
     JOIN students s ON a.student_id = s.id
     JOIN users u ON s.user_id = u.id
     JOIN classes c ON s.class_id = c.id
     ${whereClause}
     GROUP BY s.id, s.student_id, u.first_name, u.last_name, c.name, c.grade, c.section
     ORDER BY u.first_name, u.last_name`, queryParams);
    return result.rows.map((row) => ({
        studentId: row.student_id,
        studentNumber: row.student_number,
        studentName: `${row.first_name} ${row.last_name}`,
        className: `${row.class_name} (${row.grade}-${row.section})`,
        totalDays: parseInt(row.total_days),
        presentDays: parseInt(row.present_days),
        absentDays: parseInt(row.absent_days),
        lateDays: parseInt(row.late_days),
        attendancePercentage: parseFloat(row.attendance_percentage) || 0,
    }));
}
async function generateClassAttendanceReport(whereClause, queryParams, reportQuery) {
    const result = await (0, connection_1.query)(`SELECT 
       c.id as class_id,
       c.name as class_name,
       c.grade,
       c.section,
       COUNT(DISTINCT s.id) as total_students,
       COUNT(a.id) as total_attendance_records,
       COUNT(CASE WHEN a.status = 'present' THEN 1 END) as total_present,
       COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as total_absent,
       ROUND(
         (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::decimal / NULLIF(COUNT(a.id), 0)) * 100, 
         2
       ) as class_attendance_percentage
     FROM attendance a
     JOIN students s ON a.student_id = s.id
     JOIN classes c ON s.class_id = c.id
     ${whereClause}
     GROUP BY c.id, c.name, c.grade, c.section
     ORDER BY c.grade, c.section`, queryParams);
    return result.rows.map((row) => ({
        classId: row.class_id,
        className: row.class_name,
        grade: row.grade,
        section: row.section,
        totalStudents: parseInt(row.total_students),
        totalAttendanceRecords: parseInt(row.total_attendance_records),
        totalPresent: parseInt(row.total_present),
        totalAbsent: parseInt(row.total_absent),
        attendancePercentage: parseFloat(row.class_attendance_percentage) || 0,
    }));
}
async function generateDateAttendanceReport(whereClause, queryParams, reportQuery) {
    const result = await (0, connection_1.query)(`SELECT 
       a.date,
       COUNT(a.id) as total_records,
       COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
       COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
       COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
       COUNT(DISTINCT a.student_id) as unique_students,
       ROUND(
         (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::decimal / NULLIF(COUNT(a.id), 0)) * 100, 
         2
       ) as daily_attendance_percentage
     FROM attendance a
     JOIN students s ON a.student_id = s.id
     JOIN classes c ON s.class_id = c.id
     ${whereClause}
     GROUP BY a.date
     ORDER BY a.date`, queryParams);
    return result.rows.map((row) => ({
        date: row.date,
        totalRecords: parseInt(row.total_records),
        presentCount: parseInt(row.present_count),
        absentCount: parseInt(row.absent_count),
        lateCount: parseInt(row.late_count),
        uniqueStudents: parseInt(row.unique_students),
        attendancePercentage: parseFloat(row.daily_attendance_percentage) || 0,
    }));
}
async function calculateAttendanceSummary(whereClause, queryParams) {
    const result = await (0, connection_1.query)(`SELECT 
       COUNT(DISTINCT s.id) as total_students,
       COUNT(a.id) as total_records,
       COUNT(CASE WHEN a.status = 'present' THEN 1 END) as total_present,
       COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as total_absent,
       COUNT(CASE WHEN a.status = 'late' THEN 1 END) as total_late,
       ROUND(
         (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::decimal / NULLIF(COUNT(a.id), 0)) * 100, 
         2
       ) as overall_attendance_percentage
     FROM attendance a
     JOIN students s ON a.student_id = s.id
     JOIN classes c ON s.class_id = c.id
     ${whereClause}`, queryParams);
    const summary = result.rows[0];
    return {
        totalStudents: parseInt(summary.total_students),
        totalRecords: parseInt(summary.total_records),
        totalPresent: parseInt(summary.total_present),
        totalAbsent: parseInt(summary.total_absent),
        totalLate: parseInt(summary.total_late),
        overallAttendancePercentage: parseFloat(summary.overall_attendance_percentage) || 0,
    };
}
async function generateStudentAcademicReport(whereClause, queryParams, reportQuery) {
    const result = await (0, connection_1.query)(`SELECT 
       s.id as student_id,
       s.student_id as student_number,
       u.first_name,
       u.last_name,
       c.name as class_name,
       sub.name as subject_name,
       AVG(g.percentage) as average_percentage,
       COUNT(g.id) as total_assessments,
       mode() WITHIN GROUP (ORDER BY g.grade_letter) as most_common_grade
     FROM grades g
     JOIN students s ON g.student_id = s.id
     JOIN users u ON s.user_id = u.id
     JOIN classes c ON s.class_id = c.id
     JOIN subjects sub ON g.subject_id = sub.id
     ${whereClause}
     GROUP BY s.id, s.student_id, u.first_name, u.last_name, c.name, sub.name
     ORDER BY u.first_name, u.last_name`, queryParams);
    return result.rows.map((row) => ({
        studentId: row.student_id,
        studentNumber: row.student_number,
        studentName: `${row.first_name} ${row.last_name}`,
        className: row.class_name,
        subjectName: row.subject_name,
        averagePercentage: parseFloat(row.average_percentage) || 0,
        totalAssessments: parseInt(row.total_assessments),
        mostCommonGrade: row.most_common_grade,
    }));
}
async function generateSubjectAcademicReport(whereClause, queryParams, reportQuery) {
    const result = await (0, connection_1.query)(`SELECT 
       sub.id as subject_id,
       sub.name as subject_name,
       sub.code as subject_code,
       COUNT(DISTINCT g.student_id) as total_students,
       AVG(g.percentage) as average_percentage,
       COUNT(g.id) as total_assessments
     FROM grades g
     JOIN students s ON g.student_id = s.id
     JOIN subjects sub ON g.subject_id = sub.id
     ${whereClause}
     GROUP BY sub.id, sub.name, sub.code
     ORDER BY sub.name`, queryParams);
    return result.rows.map((row) => ({
        subjectId: row.subject_id,
        subjectName: row.subject_name,
        subjectCode: row.subject_code,
        totalStudents: parseInt(row.total_students),
        averagePercentage: parseFloat(row.average_percentage) || 0,
        totalAssessments: parseInt(row.total_assessments),
    }));
}
async function generateClassAcademicReport(whereClause, queryParams, reportQuery) {
    const result = await (0, connection_1.query)(`SELECT 
       c.id as class_id,
       c.name as class_name,
       c.grade,
       c.section,
       COUNT(DISTINCT g.student_id) as total_students,
       AVG(g.percentage) as average_percentage,
       COUNT(g.id) as total_assessments
     FROM grades g
     JOIN students s ON g.student_id = s.id
     JOIN classes c ON s.class_id = c.id
     ${whereClause}
     GROUP BY c.id, c.name, c.grade, c.section
     ORDER BY c.grade, c.section`, queryParams);
    return result.rows.map((row) => ({
        classId: row.class_id,
        className: row.class_name,
        grade: row.grade,
        section: row.section,
        totalStudents: parseInt(row.total_students),
        averagePercentage: parseFloat(row.average_percentage) || 0,
        totalAssessments: parseInt(row.total_assessments),
    }));
}
async function calculateAcademicSummary(whereClause, queryParams) {
    const result = await (0, connection_1.query)(`SELECT 
       COUNT(DISTINCT s.id) as total_students,
       COUNT(g.id) as total_assessments,
       AVG(g.percentage) as overall_average,
       COUNT(CASE WHEN g.percentage >= 90 THEN 1 END) as excellent_grades,
       COUNT(CASE WHEN g.percentage < 60 THEN 1 END) as failing_grades
     FROM grades g
     JOIN students s ON g.student_id = s.id
     JOIN classes c ON s.class_id = c.id
     ${whereClause}`, queryParams);
    const summary = result.rows[0];
    return {
        totalStudents: parseInt(summary.total_students),
        totalAssessments: parseInt(summary.total_assessments),
        overallAverage: parseFloat(summary.overall_average) || 0,
        excellentGrades: parseInt(summary.excellent_grades),
        failingGrades: parseInt(summary.failing_grades),
    };
}
async function generateStudentFinancialReport(whereClause, queryParams, reportQuery) {
    const result = await (0, connection_1.query)(`SELECT 
       s.id as student_id,
       s.student_id as student_number,
       u.first_name,
       u.last_name,
       c.name as class_name,
       SUM(sf.amount) as total_fees,
       SUM(COALESCE(p.amount, 0)) as total_paid,
       SUM(sf.amount) - SUM(COALESCE(p.amount, 0)) as outstanding_amount
     FROM student_fees sf
     JOIN students s ON sf.student_id = s.id
     JOIN users u ON s.user_id = u.id
     JOIN classes c ON s.class_id = c.id
     LEFT JOIN payments p ON sf.id = p.student_fee_id
     ${whereClause}
     GROUP BY s.id, s.student_id, u.first_name, u.last_name, c.name
     ORDER BY u.first_name, u.last_name`, queryParams);
    return result.rows.map((row) => ({
        studentId: row.student_id,
        studentNumber: row.student_number,
        studentName: `${row.first_name} ${row.last_name}`,
        className: row.class_name,
        totalFees: parseFloat(row.total_fees) || 0,
        totalPaid: parseFloat(row.total_paid) || 0,
        outstandingAmount: parseFloat(row.outstanding_amount) || 0,
    }));
}
async function generateClassFinancialReport(whereClause, queryParams, reportQuery) {
    const result = await (0, connection_1.query)(`SELECT 
       c.id as class_id,
       c.name as class_name,
       c.grade,
       c.section,
       COUNT(DISTINCT s.id) as total_students,
       SUM(sf.amount) as total_fees,
       SUM(COALESCE(p.amount, 0)) as total_collected
     FROM student_fees sf
     JOIN students s ON sf.student_id = s.id
     JOIN classes c ON s.class_id = c.id
     LEFT JOIN payments p ON sf.id = p.student_fee_id
     ${whereClause}
     GROUP BY c.id, c.name, c.grade, c.section
     ORDER BY c.grade, c.section`, queryParams);
    return result.rows.map((row) => ({
        classId: row.class_id,
        className: row.class_name,
        grade: row.grade,
        section: row.section,
        totalStudents: parseInt(row.total_students),
        totalFees: parseFloat(row.total_fees) || 0,
        totalCollected: parseFloat(row.total_collected) || 0,
        collectionPercentage: row.total_fees > 0 ? (parseFloat(row.total_collected) / parseFloat(row.total_fees)) * 100 : 0,
    }));
}
async function generateCategoryFinancialReport(whereClause, queryParams, reportQuery) {
    const result = await (0, connection_1.query)(`SELECT 
       fc.id as category_id,
       fc.name as category_name,
       COUNT(DISTINCT sf.student_id) as total_students,
       SUM(sf.amount) as total_fees,
       SUM(COALESCE(p.amount, 0)) as total_collected
     FROM student_fees sf
     JOIN students s ON sf.student_id = s.id
     JOIN fee_categories fc ON sf.fee_category_id = fc.id
     LEFT JOIN payments p ON sf.id = p.student_fee_id
     ${whereClause}
     GROUP BY fc.id, fc.name
     ORDER BY fc.name`, queryParams);
    return result.rows.map((row) => ({
        categoryId: row.category_id,
        categoryName: row.category_name,
        totalStudents: parseInt(row.total_students),
        totalFees: parseFloat(row.total_fees) || 0,
        totalCollected: parseFloat(row.total_collected) || 0,
        collectionPercentage: row.total_fees > 0 ? (parseFloat(row.total_collected) / parseFloat(row.total_fees)) * 100 : 0,
    }));
}
async function calculateFinancialSummary(whereClause, queryParams) {
    const result = await (0, connection_1.query)(`SELECT 
       COUNT(DISTINCT s.id) as total_students,
       SUM(sf.amount) as total_fees,
       SUM(COALESCE(p.amount, 0)) as total_collected,
       COUNT(DISTINCT sf.id) as total_fee_records
     FROM student_fees sf
     JOIN students s ON sf.student_id = s.id
     JOIN classes c ON s.class_id = c.id
     LEFT JOIN payments p ON sf.id = p.student_fee_id
     ${whereClause}`, queryParams);
    const summary = result.rows[0];
    return {
        totalStudents: parseInt(summary.total_students),
        totalFees: parseFloat(summary.total_fees) || 0,
        totalCollected: parseFloat(summary.total_collected) || 0,
        outstandingAmount: (parseFloat(summary.total_fees) || 0) - (parseFloat(summary.total_collected) || 0),
        collectionPercentage: summary.total_fees > 0 ? (parseFloat(summary.total_collected) / parseFloat(summary.total_fees)) * 100 : 0,
        totalFeeRecords: parseInt(summary.total_fee_records),
    };
}
async function generateClassEnrollmentReport(whereClause, queryParams, reportQuery) {
    const result = await (0, connection_1.query)(`SELECT 
       c.id as class_id,
       c.name as class_name,
       c.grade,
       c.section,
       c.capacity,
       COUNT(s.id) as enrolled_students,
       c.capacity - COUNT(s.id) as available_spots
     FROM students s
     JOIN classes c ON s.class_id = c.id
     ${whereClause}
     GROUP BY c.id, c.name, c.grade, c.section, c.capacity
     ORDER BY c.grade, c.section`, queryParams);
    return result.rows.map((row) => ({
        classId: row.class_id,
        className: row.class_name,
        grade: row.grade,
        section: row.section,
        capacity: parseInt(row.capacity),
        enrolledStudents: parseInt(row.enrolled_students),
        availableSpots: parseInt(row.available_spots),
        utilizationPercentage: row.capacity > 0 ? (parseInt(row.enrolled_students) / parseInt(row.capacity)) * 100 : 0,
    }));
}
async function generateGradeEnrollmentReport(whereClause, queryParams, reportQuery) {
    const result = await (0, connection_1.query)(`SELECT 
       c.grade,
       COUNT(DISTINCT c.id) as total_classes,
       SUM(c.capacity) as total_capacity,
       COUNT(s.id) as total_enrolled
     FROM students s
     JOIN classes c ON s.class_id = c.id
     ${whereClause}
     GROUP BY c.grade
     ORDER BY c.grade`, queryParams);
    return result.rows.map((row) => ({
        grade: row.grade,
        totalClasses: parseInt(row.total_classes),
        totalCapacity: parseInt(row.total_capacity),
        totalEnrolled: parseInt(row.total_enrolled),
        utilizationPercentage: row.total_capacity > 0 ? (parseInt(row.total_enrolled) / parseInt(row.total_capacity)) * 100 : 0,
    }));
}
async function generateMonthlyEnrollmentReport(whereClause, queryParams, reportQuery) {
    const result = await (0, connection_1.query)(`SELECT 
       DATE_TRUNC('month', s.created_at) as enrollment_month,
       COUNT(s.id) as new_enrollments,
       COUNT(DISTINCT s.class_id) as classes_affected
     FROM students s
     JOIN classes c ON s.class_id = c.id
     ${whereClause}
     GROUP BY DATE_TRUNC('month', s.created_at)
     ORDER BY enrollment_month`, queryParams);
    return result.rows.map((row) => ({
        enrollmentMonth: row.enrollment_month.toISOString().slice(0, 7),
        newEnrollments: parseInt(row.new_enrollments),
        classesAffected: parseInt(row.classes_affected),
    }));
}
async function calculateEnrollmentSummary(whereClause, queryParams) {
    const result = await (0, connection_1.query)(`SELECT 
       COUNT(s.id) as total_students,
       COUNT(DISTINCT c.id) as total_classes,
       SUM(c.capacity) as total_capacity,
       AVG(c.capacity) as average_class_capacity
     FROM students s
     JOIN classes c ON s.class_id = c.id
     ${whereClause}`, queryParams);
    const summary = result.rows[0];
    return {
        totalStudents: parseInt(summary.total_students),
        totalClasses: parseInt(summary.total_classes),
        totalCapacity: parseInt(summary.total_capacity),
        averageClassCapacity: parseFloat(summary.average_class_capacity) || 0,
        overallUtilization: summary.total_capacity > 0 ? (parseInt(summary.total_students) / parseInt(summary.total_capacity)) * 100 : 0,
    };
}
function formatReportResponse(reportType, title, queryParams, data, summary, generatedBy) {
    return {
        metadata: {
            reportId: `${reportType}-${Date.now()}`,
            reportType,
            title,
            generatedBy,
            generatedAt: new Date().toISOString(),
            parameters: queryParams,
            format: 'json'
        },
        summary: {
            totalRecords: data.length,
            dateRange: {
                startDate: queryParams.startDate || new Date().toISOString().split('T')[0],
                endDate: queryParams.endDate || new Date().toISOString().split('T')[0]
            },
            filters: queryParams,
            aggregations: summary
        },
        data
    };
}
//# sourceMappingURL=reportController.js.map
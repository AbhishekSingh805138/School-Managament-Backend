"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const baseService_1 = require("./baseService");
const errorHandler_1 = require("../middleware/errorHandler");
const pagination_1 = require("../utils/pagination");
class AttendanceService extends baseService_1.BaseService {
    async markAttendance(attendanceData, markedBy) {
        const studentExists = await this.executeQuery(`SELECT s.id, s.student_id, s.class_id, u.first_name, u.last_name 
       FROM students s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.id = $1 AND s.is_active = true AND u.is_active = true`, [attendanceData.studentId]);
        if (studentExists.rows.length === 0) {
            throw new errorHandler_1.AppError('Student not found or inactive', 404);
        }
        const classExists = await this.executeQuery('SELECT id, name, grade, section FROM classes WHERE id = $1 AND is_active = true', [attendanceData.classId]);
        if (classExists.rows.length === 0) {
            throw new errorHandler_1.AppError('Class not found or inactive', 404);
        }
        if (attendanceData.subjectId) {
            const subjectExists = await this.executeQuery('SELECT id, name, code FROM subjects WHERE id = $1 AND is_active = true', [attendanceData.subjectId]);
            if (subjectExists.rows.length === 0) {
                throw new errorHandler_1.AppError('Subject not found or inactive', 404);
            }
        }
        const existingAttendance = await this.executeQuery('SELECT id FROM attendance WHERE student_id = $1 AND class_id = $2 AND date = $3 AND subject_id IS NOT DISTINCT FROM $4', [attendanceData.studentId, attendanceData.classId, attendanceData.date, attendanceData.subjectId || null]);
        if (existingAttendance.rows.length > 0) {
            throw new errorHandler_1.AppError('Attendance already marked for this student, class, and date', 409);
        }
        const result = await this.executeQuery(`INSERT INTO attendance (student_id, class_id, subject_id, date, status, marked_by, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, student_id, class_id, subject_id, date, status, marked_by, remarks, created_at, updated_at`, [
            attendanceData.studentId,
            attendanceData.classId,
            attendanceData.subjectId || null,
            attendanceData.date,
            attendanceData.status,
            markedBy,
            attendanceData.remarks || null
        ]);
        const attendance = result.rows[0];
        const student = studentExists.rows[0];
        const classInfo = classExists.rows[0];
        return {
            ...this.transformAttendanceResponse(attendance),
            student: {
                id: student.id,
                studentId: student.student_id,
                name: `${student.first_name} ${student.last_name}`,
            },
            class: {
                id: classInfo.id,
                name: classInfo.name,
                grade: classInfo.grade,
                section: classInfo.section,
            },
        };
    }
    async markBulkAttendance(bulkData, markedBy) {
        const classExists = await this.executeQuery('SELECT id, name, grade, section FROM classes WHERE id = $1 AND is_active = true', [bulkData.classId]);
        if (classExists.rows.length === 0) {
            throw new errorHandler_1.AppError('Class not found or inactive', 404);
        }
        if (bulkData.subjectId) {
            const subjectExists = await this.executeQuery('SELECT id, name, code FROM subjects WHERE id = $1 AND is_active = true', [bulkData.subjectId]);
            if (subjectExists.rows.length === 0) {
                throw new errorHandler_1.AppError('Subject not found or inactive', 404);
            }
        }
        return await this.executeTransaction(async (client) => {
            const attendanceRecords = [];
            for (const record of bulkData.attendance) {
                const studentExists = await client.query(`SELECT s.id, s.student_id, u.first_name, u.last_name 
           FROM students s 
           JOIN users u ON s.user_id = u.id 
           WHERE s.id = $1 AND s.is_active = true AND u.is_active = true`, [record.studentId]);
                if (studentExists.rows.length === 0) {
                    throw new errorHandler_1.AppError(`Student with ID ${record.studentId} not found or inactive`, 404);
                }
                const existingAttendance = await client.query('SELECT id FROM attendance WHERE student_id = $1 AND class_id = $2 AND date = $3 AND subject_id IS NOT DISTINCT FROM $4', [record.studentId, bulkData.classId, bulkData.date, bulkData.subjectId || null]);
                if (existingAttendance.rows.length > 0) {
                    throw new errorHandler_1.AppError(`Attendance already marked for student ${studentExists.rows[0].student_id}`, 409);
                }
                const result = await client.query(`INSERT INTO attendance (student_id, class_id, subject_id, date, status, marked_by, remarks)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, student_id, class_id, subject_id, date, status, marked_by, remarks, created_at, updated_at`, [
                    record.studentId,
                    bulkData.classId,
                    bulkData.subjectId || null,
                    bulkData.date,
                    record.status,
                    markedBy,
                    record.remarks || null
                ]);
                const attendance = result.rows[0];
                const student = studentExists.rows[0];
                attendanceRecords.push({
                    ...this.transformAttendanceResponse(attendance),
                    student: {
                        id: student.id,
                        studentId: student.student_id,
                        name: `${student.first_name} ${student.last_name}`,
                    },
                });
            }
            return {
                classId: bulkData.classId,
                date: bulkData.date,
                subjectId: bulkData.subjectId,
                totalRecords: attendanceRecords.length,
                records: attendanceRecords,
            };
        });
    }
    async getAttendance(req) {
        const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'date');
        const { studentId, classId, subjectId, date, status, startDate, endDate } = req.query;
        let whereClause = 'WHERE 1=1';
        const queryParams = [];
        if (studentId) {
            whereClause += ` AND a.student_id = $${queryParams.length + 1}`;
            queryParams.push(studentId);
        }
        if (classId) {
            whereClause += ` AND a.class_id = $${queryParams.length + 1}`;
            queryParams.push(classId);
        }
        if (subjectId) {
            whereClause += ` AND a.subject_id = $${queryParams.length + 1}`;
            queryParams.push(subjectId);
        }
        if (date) {
            whereClause += ` AND a.date = $${queryParams.length + 1}`;
            queryParams.push(date);
        }
        if (status) {
            whereClause += ` AND a.status = $${queryParams.length + 1}`;
            queryParams.push(status);
        }
        if (startDate && endDate) {
            whereClause += ` AND a.date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
            queryParams.push(startDate, endDate);
        }
        const countResult = await this.executeQuery(`SELECT COUNT(*) FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN classes c ON a.class_id = c.id
       ${whereClause}`, queryParams);
        const total = parseInt(countResult.rows[0].count);
        const result = await this.executeQuery(`SELECT a.id, a.student_id, a.class_id, a.subject_id, a.date, a.status, a.marked_by, a.remarks, a.created_at, a.updated_at,
              s.student_id as student_number, u.first_name, u.last_name,
              c.name as class_name, c.grade, c.section,
              sub.name as subject_name, sub.code as subject_code,
              marker.first_name as marker_first_name, marker.last_name as marker_last_name
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON a.class_id = c.id
       LEFT JOIN subjects sub ON a.subject_id = sub.id
       LEFT JOIN users marker ON a.marked_by = marker.id
       ${whereClause}
       ORDER BY a.${sortBy} ${sortOrder}
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`, [...queryParams, limit, offset]);
        const attendance = result.rows.map((record) => ({
            ...this.transformAttendanceResponse(record),
            student: {
                id: record.student_id,
                studentId: record.student_number,
                name: `${record.first_name} ${record.last_name}`,
            },
            class: {
                id: record.class_id,
                name: record.class_name,
                grade: record.grade,
                section: record.section,
            },
            subject: record.subject_name ? {
                id: record.subject_id,
                name: record.subject_name,
                code: record.subject_code,
            } : null,
            markedBy: record.marker_first_name ? {
                name: `${record.marker_first_name} ${record.marker_last_name}`,
            } : null,
        }));
        return {
            attendance,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getAttendanceById(id) {
        const attendance = await this.checkEntityExists('attendance', id);
        const result = await this.executeQuery(`SELECT a.id, a.student_id, a.class_id, a.subject_id, a.date, a.status, a.marked_by, a.remarks, a.created_at, a.updated_at,
              s.student_id as student_number, u.first_name, u.last_name,
              c.name as class_name, c.grade, c.section,
              sub.name as subject_name, sub.code as subject_code,
              marker.first_name as marker_first_name, marker.last_name as marker_last_name
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON a.class_id = c.id
       LEFT JOIN subjects sub ON a.subject_id = sub.id
       LEFT JOIN users marker ON a.marked_by = marker.id
       WHERE a.id = $1`, [attendance.id]);
        const record = result.rows[0];
        return {
            ...this.transformAttendanceResponse(record),
            student: {
                id: record.student_id,
                studentId: record.student_number,
                name: `${record.first_name} ${record.last_name}`,
            },
            class: {
                id: record.class_id,
                name: record.class_name,
                grade: record.grade,
                section: record.section,
            },
            subject: record.subject_name ? {
                id: record.subject_id,
                name: record.subject_name,
                code: record.subject_code,
            } : null,
            markedBy: record.marker_first_name ? {
                name: `${record.marker_first_name} ${record.marker_last_name}`,
            } : null,
        };
    }
    async updateAttendance(id, updateData) {
        const existingAttendance = await this.checkEntityExists('attendance', id);
        const actualAttendanceId = existingAttendance.id;
        const { query: updateQuery, values } = this.buildUpdateQuery('attendance', updateData);
        values.push(actualAttendanceId);
        const result = await this.executeQuery(updateQuery, values);
        return this.transformAttendanceResponse(result.rows[0]);
    }
    async deleteAttendance(id) {
        const existingAttendance = await this.checkEntityExists('attendance', id);
        const actualAttendanceId = existingAttendance.id;
        await this.executeQuery('DELETE FROM attendance WHERE id = $1', [actualAttendanceId]);
        return { success: true };
    }
    async getStudentAttendanceSummary(studentId, startDate, endDate) {
        let whereClause = 'WHERE a.student_id = $1';
        const queryParams = [studentId];
        if (startDate && endDate) {
            whereClause += ` AND a.date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
            queryParams.push(startDate, endDate);
        }
        const result = await this.executeQuery(`SELECT 
         COUNT(*) as total_days,
         COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
         COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
         COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
         COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_days
       FROM attendance a
       ${whereClause}`, queryParams);
        const summary = result.rows[0];
        const totalDays = parseInt(summary.total_days);
        const presentDays = parseInt(summary.present_days);
        const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
        return {
            totalDays,
            presentDays: presentDays,
            absentDays: parseInt(summary.absent_days),
            lateDays: parseInt(summary.late_days),
            excusedDays: parseInt(summary.excused_days),
            attendancePercentage,
        };
    }
    transformAttendanceResponse(attendance) {
        return {
            id: attendance.id,
            studentId: attendance.student_id,
            classId: attendance.class_id,
            subjectId: attendance.subject_id,
            date: attendance.date,
            status: attendance.status,
            markedBy: attendance.marked_by,
            remarks: attendance.remarks,
            createdAt: attendance.created_at,
            updatedAt: attendance.updated_at,
        };
    }
}
exports.AttendanceService = AttendanceService;
//# sourceMappingURL=attendanceService.js.map
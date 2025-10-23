"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAttendance = exports.getStudentAttendanceSummary = exports.getClassAttendance = exports.getAttendanceById = exports.updateAttendance = exports.getAttendanceRecords = exports.markBulkAttendance = exports.markAttendance = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const pagination_1 = require("../utils/pagination");
exports.markAttendance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const attendanceData = req.body;
    const markedBy = req.user.id;
    const studentExists = await (0, connection_1.query)(`SELECT s.id, s.student_id, s.class_id, u.first_name, u.last_name 
     FROM students s 
     JOIN users u ON s.user_id = u.id 
     WHERE s.id = $1 AND s.is_active = true AND u.is_active = true`, [attendanceData.studentId]);
    if (studentExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Student not found or inactive', 404);
    }
    const classExists = await (0, connection_1.query)('SELECT id, name, grade, section FROM classes WHERE id = $1 AND is_active = true', [attendanceData.classId]);
    if (classExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Class not found or inactive', 404);
    }
    if (attendanceData.subjectId) {
        const subjectExists = await (0, connection_1.query)('SELECT id, name, code FROM subjects WHERE id = $1 AND is_active = true', [attendanceData.subjectId]);
        if (subjectExists.rows.length === 0) {
            throw new errorHandler_1.AppError('Subject not found or inactive', 404);
        }
    }
    const teacherAuthorization = await (0, connection_1.query)(`SELECT 1 FROM classes c 
     WHERE c.id = $1 AND c.teacher_id = $2
     UNION
     SELECT 1 FROM class_subjects cs 
     WHERE cs.class_id = $1 AND cs.teacher_id = $2`, [attendanceData.classId, markedBy]);
    const userRole = req.user.role;
    if (userRole !== 'admin' && teacherAuthorization.rows.length === 0) {
        throw new errorHandler_1.AppError('You are not authorized to mark attendance for this class', 403);
    }
    const existingAttendance = await (0, connection_1.query)(`SELECT id FROM attendance 
     WHERE student_id = $1 AND date = $2 AND (subject_id = $3 OR (subject_id IS NULL AND $3 IS NULL))`, [attendanceData.studentId, attendanceData.date, attendanceData.subjectId || null]);
    if (existingAttendance.rows.length > 0) {
        throw new errorHandler_1.AppError('Attendance already marked for this student on this date', 409);
    }
    const seqIdResult = await (0, connection_1.query)('SELECT generate_sequential_id($1) as next_id', ['attendance']);
    const sequentialId = seqIdResult.rows[0].next_id;
    const result = await (0, connection_1.query)(`INSERT INTO attendance (student_id, class_id, subject_id, date, status, marked_by, remarks, alt_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, alt_id, student_id, class_id, subject_id, date, status, marked_by, marked_at, remarks, created_at, updated_at`, [
        attendanceData.studentId,
        attendanceData.classId,
        attendanceData.subjectId || null,
        attendanceData.date,
        attendanceData.status,
        markedBy,
        attendanceData.remarks || null,
        sequentialId.toString()
    ]);
    const attendance = result.rows[0];
    const student = studentExists.rows[0];
    const classInfo = classExists.rows[0];
    res.status(201).json({
        success: true,
        message: 'Attendance marked successfully',
        data: {
            id: attendance.id,
            altId: attendance.alt_id,
            studentId: attendance.student_id,
            classId: attendance.class_id,
            subjectId: attendance.subject_id,
            date: attendance.date,
            status: attendance.status,
            markedBy: attendance.marked_by,
            markedAt: attendance.marked_at,
            remarks: attendance.remarks,
            createdAt: attendance.created_at,
            updatedAt: attendance.updated_at,
            student: {
                studentId: student.student_id,
                user: {
                    firstName: student.first_name,
                    lastName: student.last_name,
                },
            },
            class: {
                name: classInfo.name,
                grade: classInfo.grade,
                section: classInfo.section,
            },
        },
    });
});
exports.markBulkAttendance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const bulkData = req.body;
    const markedBy = req.user.id;
    const classExists = await (0, connection_1.query)('SELECT id, name, grade, section FROM classes WHERE id = $1 AND is_active = true', [bulkData.classId]);
    if (classExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Class not found or inactive', 404);
    }
    if (bulkData.subjectId) {
        const subjectExists = await (0, connection_1.query)('SELECT id, name, code FROM subjects WHERE id = $1 AND is_active = true', [bulkData.subjectId]);
        if (subjectExists.rows.length === 0) {
            throw new errorHandler_1.AppError('Subject not found or inactive', 404);
        }
    }
    const teacherAuthorization = await (0, connection_1.query)(`SELECT 1 FROM classes c 
     WHERE c.id = $1 AND c.teacher_id = $2
     UNION
     SELECT 1 FROM class_subjects cs 
     WHERE cs.class_id = $1 AND cs.teacher_id = $2`, [bulkData.classId, markedBy]);
    const userRole = req.user.role;
    if (userRole !== 'admin' && teacherAuthorization.rows.length === 0) {
        throw new errorHandler_1.AppError('You are not authorized to mark attendance for this class', 403);
    }
    const studentIds = bulkData.attendance.map(item => item.studentId);
    const studentsValidation = await (0, connection_1.query)(`SELECT s.id, s.student_id, u.first_name, u.last_name 
     FROM students s 
     JOIN users u ON s.user_id = u.id 
     WHERE s.id = ANY($1) AND s.class_id = $2 AND s.is_active = true AND u.is_active = true`, [studentIds, bulkData.classId]);
    if (studentsValidation.rows.length !== studentIds.length) {
        throw new errorHandler_1.AppError('Some students are not found or not enrolled in this class', 400);
    }
    const existingAttendance = await (0, connection_1.query)(`SELECT student_id FROM attendance 
     WHERE student_id = ANY($1) AND date = $2 AND (subject_id = $3 OR (subject_id IS NULL AND $3 IS NULL))`, [studentIds, bulkData.date, bulkData.subjectId || null]);
    if (existingAttendance.rows.length > 0) {
        const existingStudentIds = existingAttendance.rows.map((row) => row.student_id);
        throw new errorHandler_1.AppError(`Attendance already marked for some students: ${existingStudentIds.join(', ')}`, 409);
    }
    const client = await (0, connection_1.getClient)();
    try {
        await client.query('BEGIN');
        const attendanceRecords = [];
        for (const attendanceItem of bulkData.attendance) {
            const seqIdResult = await client.query('SELECT generate_sequential_id($1) as next_id', ['attendance']);
            const sequentialId = seqIdResult.rows[0].next_id;
            const result = await client.query(`INSERT INTO attendance (student_id, class_id, subject_id, date, status, marked_by, remarks, alt_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, alt_id, student_id, class_id, subject_id, date, status, marked_by, marked_at, remarks, created_at, updated_at`, [
                attendanceItem.studentId,
                bulkData.classId,
                bulkData.subjectId || null,
                bulkData.date,
                attendanceItem.status,
                markedBy,
                attendanceItem.remarks || null,
                sequentialId.toString()
            ]);
            attendanceRecords.push(result.rows[0]);
        }
        await client.query('COMMIT');
        const classInfo = classExists.rows[0];
        res.status(201).json({
            success: true,
            message: `Bulk attendance marked successfully for ${attendanceRecords.length} students`,
            data: {
                classId: bulkData.classId,
                date: bulkData.date,
                subjectId: bulkData.subjectId,
                totalRecords: attendanceRecords.length,
                class: {
                    name: classInfo.name,
                    grade: classInfo.grade,
                    section: classInfo.section,
                },
                summary: {
                    present: attendanceRecords.filter(r => r.status === 'present').length,
                    absent: attendanceRecords.filter(r => r.status === 'absent').length,
                    late: attendanceRecords.filter(r => r.status === 'late').length,
                    excused: attendanceRecords.filter(r => r.status === 'excused').length,
                },
            },
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
});
exports.getAttendanceRecords = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'date');
    const queryParams = req.query;
    let whereClause = 'WHERE 1=1';
    const sqlParams = [];
    if (queryParams.studentId) {
        whereClause += ` AND a.student_id = $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.studentId);
    }
    if (queryParams.classId) {
        whereClause += ` AND a.class_id = $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.classId);
    }
    if (queryParams.subjectId) {
        whereClause += ` AND a.subject_id = $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.subjectId);
    }
    if (queryParams.startDate) {
        whereClause += ` AND a.date >= $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.startDate);
    }
    if (queryParams.endDate) {
        whereClause += ` AND a.date <= $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.endDate);
    }
    if (queryParams.status) {
        whereClause += ` AND a.status = $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.status);
    }
    const userRole = req.user.role;
    const userId = req.user.id;
    if (userRole === 'student') {
        whereClause += ` AND s.user_id = $${sqlParams.length + 1}`;
        sqlParams.push(userId);
    }
    else if (userRole === 'parent') {
        whereClause += ` AND EXISTS (
      SELECT 1 FROM student_parents sp 
      WHERE sp.student_id = s.id AND sp.parent_user_id = $${sqlParams.length + 1}
    )`;
        sqlParams.push(userId);
    }
    else if (userRole === 'teacher') {
        whereClause += ` AND (c.teacher_id = $${sqlParams.length + 1} OR EXISTS (
      SELECT 1 FROM class_subjects cs 
      WHERE cs.class_id = c.id AND cs.teacher_id = $${sqlParams.length + 1}
    ))`;
        sqlParams.push(userId);
    }
    const countResult = await (0, connection_1.query)(`SELECT COUNT(*) FROM attendance a
     JOIN students s ON a.student_id = s.id
     JOIN classes c ON a.class_id = c.id
     ${whereClause}`, sqlParams);
    const total = parseInt(countResult.rows[0].count);
    const result = await (0, connection_1.query)(`SELECT a.id, a.alt_id, a.student_id, a.class_id, a.subject_id, a.date, a.status, 
            a.marked_by, a.marked_at, a.remarks, a.created_at, a.updated_at,
            s.student_id as student_number, su.first_name as student_first_name, su.last_name as student_last_name,
            c.name as class_name, c.grade, c.section,
            subj.name as subject_name, subj.code as subject_code,
            mu.first_name as marked_by_first_name, mu.last_name as marked_by_last_name
     FROM attendance a
     JOIN students s ON a.student_id = s.id
     JOIN users su ON s.user_id = su.id
     JOIN classes c ON a.class_id = c.id
     LEFT JOIN subjects subj ON a.subject_id = subj.id
     JOIN users mu ON a.marked_by = mu.id
     ${whereClause}
     ORDER BY a.${sortBy} ${sortOrder}
     LIMIT $${sqlParams.length + 1} OFFSET $${sqlParams.length + 2}`, [...sqlParams, limit, offset]);
    const attendanceRecords = result.rows.map((record) => ({
        id: record.id,
        altId: record.alt_id,
        studentId: record.student_id,
        classId: record.class_id,
        subjectId: record.subject_id,
        date: record.date,
        status: record.status,
        markedBy: record.marked_by,
        markedAt: record.marked_at,
        remarks: record.remarks,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        student: {
            studentId: record.student_number,
            user: {
                firstName: record.student_first_name,
                lastName: record.student_last_name,
            },
        },
        class: {
            name: record.class_name,
            grade: record.grade,
            section: record.section,
        },
        subject: record.subject_name ? {
            name: record.subject_name,
            code: record.subject_code,
        } : null,
        markedByUser: {
            firstName: record.marked_by_first_name,
            lastName: record.marked_by_last_name,
        },
    }));
    res.json({
        success: true,
        data: attendanceRecords,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
});
exports.updateAttendance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    const existingAttendance = await (0, connection_1.query)(`SELECT a.id, a.student_id, a.class_id, a.marked_by, a.marked_at, a.date,
            c.teacher_id, s.student_id as student_number
     FROM attendance a
     JOIN classes c ON a.class_id = c.id
     JOIN students s ON a.student_id = s.id
     WHERE a.id = $1`, [id]);
    if (existingAttendance.rows.length === 0) {
        throw new errorHandler_1.AppError('Attendance record not found', 404);
    }
    const attendance = existingAttendance.rows[0];
    const canUpdate = userRole === 'admin' ||
        attendance.marked_by === userId ||
        attendance.teacher_id === userId ||
        await (0, connection_1.query)('SELECT 1 FROM class_subjects WHERE class_id = $1 AND teacher_id = $2', [attendance.class_id, userId]).then(result => result.rows.length > 0);
    if (!canUpdate) {
        throw new errorHandler_1.AppError('You are not authorized to update this attendance record', 403);
    }
    const markedAt = new Date(attendance.marked_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - markedAt.getTime()) / (1000 * 60 * 60);
    if (userRole !== 'admin' && hoursDiff > 24) {
        throw new errorHandler_1.AppError('Attendance can only be updated within 24 hours of marking', 400);
    }
    const result = await (0, connection_1.query)(`UPDATE attendance 
     SET status = $1, remarks = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING id, alt_id, student_id, class_id, subject_id, date, status, marked_by, marked_at, remarks, created_at, updated_at`, [updateData.status, updateData.remarks || null, id]);
    const updatedAttendance = result.rows[0];
    res.json({
        success: true,
        message: 'Attendance updated successfully',
        data: {
            id: updatedAttendance.id,
            altId: updatedAttendance.alt_id,
            studentId: updatedAttendance.student_id,
            classId: updatedAttendance.class_id,
            subjectId: updatedAttendance.subject_id,
            date: updatedAttendance.date,
            status: updatedAttendance.status,
            markedBy: updatedAttendance.marked_by,
            markedAt: updatedAttendance.marked_at,
            remarks: updatedAttendance.remarks,
            createdAt: updatedAttendance.created_at,
            updatedAt: updatedAttendance.updated_at,
        },
    });
});
exports.getAttendanceById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    let authorizationClause = '';
    const queryParams = [id];
    if (userRole === 'student') {
        authorizationClause = 'AND s.user_id = $2';
        queryParams.push(userId);
    }
    else if (userRole === 'parent') {
        authorizationClause = `AND EXISTS (
      SELECT 1 FROM student_parents sp 
      WHERE sp.student_id = s.id AND sp.parent_user_id = $2
    )`;
        queryParams.push(userId);
    }
    else if (userRole === 'teacher') {
        authorizationClause = `AND (c.teacher_id = $2 OR EXISTS (
      SELECT 1 FROM class_subjects cs 
      WHERE cs.class_id = c.id AND cs.teacher_id = $2
    ))`;
        queryParams.push(userId);
    }
    const result = await (0, connection_1.query)(`SELECT a.id, a.alt_id, a.student_id, a.class_id, a.subject_id, a.date, a.status, 
            a.marked_by, a.marked_at, a.remarks, a.created_at, a.updated_at,
            s.student_id as student_number, su.first_name as student_first_name, su.last_name as student_last_name,
            c.name as class_name, c.grade, c.section,
            subj.name as subject_name, subj.code as subject_code,
            mu.first_name as marked_by_first_name, mu.last_name as marked_by_last_name
     FROM attendance a
     JOIN students s ON a.student_id = s.id
     JOIN users su ON s.user_id = su.id
     JOIN classes c ON a.class_id = c.id
     LEFT JOIN subjects subj ON a.subject_id = subj.id
     JOIN users mu ON a.marked_by = mu.id
     WHERE a.id = $1 ${authorizationClause}`, queryParams);
    if (result.rows.length === 0) {
        throw new errorHandler_1.AppError('Attendance record not found or access denied', 404);
    }
    const record = result.rows[0];
    res.json({
        success: true,
        data: {
            id: record.id,
            altId: record.alt_id,
            studentId: record.student_id,
            classId: record.class_id,
            subjectId: record.subject_id,
            date: record.date,
            status: record.status,
            markedBy: record.marked_by,
            markedAt: record.marked_at,
            remarks: record.remarks,
            createdAt: record.created_at,
            updatedAt: record.updated_at,
            student: {
                studentId: record.student_number,
                user: {
                    firstName: record.student_first_name,
                    lastName: record.student_last_name,
                },
            },
            class: {
                name: record.class_name,
                grade: record.grade,
                section: record.section,
            },
            subject: record.subject_name ? {
                name: record.subject_name,
                code: record.subject_code,
            } : null,
            markedByUser: {
                firstName: record.marked_by_first_name,
                lastName: record.marked_by_last_name,
            },
        },
    });
});
exports.getClassAttendance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { classId } = req.params;
    const { date, subjectId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    if (!date) {
        throw new errorHandler_1.AppError('Date parameter is required', 400);
    }
    const classExists = await (0, connection_1.query)('SELECT id, name, grade, section, teacher_id FROM classes WHERE id = $1 AND is_active = true', [classId]);
    if (classExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Class not found or inactive', 404);
    }
    const classInfo = classExists.rows[0];
    if (userRole === 'teacher') {
        const hasAccess = classInfo.teacher_id === userId ||
            await (0, connection_1.query)('SELECT 1 FROM class_subjects WHERE class_id = $1 AND teacher_id = $2', [classId, userId]).then(result => result.rows.length > 0);
        if (!hasAccess) {
            throw new errorHandler_1.AppError('You are not authorized to view this class attendance', 403);
        }
    }
    const studentsResult = await (0, connection_1.query)(`SELECT s.id, s.student_id, u.first_name, u.last_name
     FROM students s
     JOIN users u ON s.user_id = u.id
     WHERE s.class_id = $1 AND s.is_active = true AND u.is_active = true
     ORDER BY u.first_name, u.last_name`, [classId]);
    let attendanceQuery = `
    SELECT a.student_id, a.status, a.remarks, a.marked_at
    FROM attendance a
    WHERE a.class_id = $1 AND a.date = $2
  `;
    const attendanceParams = [classId, date];
    if (subjectId) {
        attendanceQuery += ' AND a.subject_id = $3';
        attendanceParams.push(subjectId);
    }
    else {
        attendanceQuery += ' AND a.subject_id IS NULL';
    }
    const attendanceResult = await (0, connection_1.query)(attendanceQuery, attendanceParams);
    const attendanceMap = new Map();
    attendanceResult.rows.forEach((record) => {
        attendanceMap.set(record.student_id, {
            status: record.status,
            remarks: record.remarks,
            markedAt: record.marked_at,
        });
    });
    const classAttendance = studentsResult.rows.map((student) => {
        const attendance = attendanceMap.get(student.id);
        return {
            studentId: student.id,
            studentNumber: student.student_id,
            studentName: `${student.first_name} ${student.last_name}`,
            status: attendance?.status || null,
            remarks: attendance?.remarks || null,
            markedAt: attendance?.markedAt || null,
        };
    });
    const totalStudents = classAttendance.length;
    const markedCount = classAttendance.filter((s) => s.status !== null).length;
    const presentCount = classAttendance.filter((s) => s.status === 'present').length;
    const absentCount = classAttendance.filter((s) => s.status === 'absent').length;
    const lateCount = classAttendance.filter((s) => s.status === 'late').length;
    const excusedCount = classAttendance.filter((s) => s.status === 'excused').length;
    res.json({
        success: true,
        data: {
            classId: classId,
            date: date,
            subjectId: subjectId || null,
            class: {
                name: classInfo.name,
                grade: classInfo.grade,
                section: classInfo.section,
            },
            students: classAttendance,
            summary: {
                totalStudents,
                markedCount,
                unmarkedCount: totalStudents - markedCount,
                presentCount,
                absentCount,
                lateCount,
                excusedCount,
                attendancePercentage: markedCount > 0 ? Math.round((presentCount / markedCount) * 100) : 0,
            },
        },
    });
});
exports.getStudentAttendanceSummary = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    const studentExists = await (0, connection_1.query)(`SELECT s.id, s.student_id, s.user_id, u.first_name, u.last_name, c.name as class_name, c.grade, c.section
     FROM students s
     JOIN users u ON s.user_id = u.id
     JOIN classes c ON s.class_id = c.id
     WHERE s.id = $1 AND s.is_active = true AND u.is_active = true`, [studentId]);
    if (studentExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Student not found or inactive', 404);
    }
    const student = studentExists.rows[0];
    if (userRole === 'student' && student.user_id !== userId) {
        throw new errorHandler_1.AppError('You can only view your own attendance', 403);
    }
    else if (userRole === 'parent') {
        const parentAccess = await (0, connection_1.query)('SELECT 1 FROM student_parents WHERE student_id = $1 AND parent_user_id = $2', [studentId, userId]);
        if (parentAccess.rows.length === 0) {
            throw new errorHandler_1.AppError('You can only view your child\'s attendance', 403);
        }
    }
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);
    const summaryStartDate = startDate || defaultStartDate.toISOString().split('T')[0];
    const summaryEndDate = endDate || new Date().toISOString().split('T')[0];
    const summaryResult = await (0, connection_1.query)('SELECT calculate_attendance_percentage($1, $2, $3) as attendance_percentage', [studentId, summaryStartDate, summaryEndDate]);
    const detailsResult = await (0, connection_1.query)(`SELECT 
       COUNT(*) as total_days,
       COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
       COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
       COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days,
       COUNT(CASE WHEN status = 'excused' THEN 1 END) as excused_days
     FROM attendance
     WHERE student_id = $1 AND date BETWEEN $2 AND $3`, [studentId, summaryStartDate, summaryEndDate]);
    const details = detailsResult.rows[0];
    const attendancePercentage = parseFloat(summaryResult.rows[0].attendance_percentage) || 0;
    res.json({
        success: true,
        data: {
            studentId: studentId,
            student: {
                studentNumber: student.student_id,
                name: `${student.first_name} ${student.last_name}`,
                class: {
                    name: student.class_name,
                    grade: student.grade,
                    section: student.section,
                },
            },
            period: {
                startDate: summaryStartDate,
                endDate: summaryEndDate,
            },
            summary: {
                totalDays: parseInt(details.total_days),
                presentDays: parseInt(details.present_days),
                absentDays: parseInt(details.absent_days),
                lateDays: parseInt(details.late_days),
                excusedDays: parseInt(details.excused_days),
                attendancePercentage: attendancePercentage,
            },
        },
    });
});
exports.deleteAttendance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const existingAttendance = await (0, connection_1.query)(`SELECT a.id, a.marked_by, a.marked_at, c.teacher_id
     FROM attendance a
     JOIN classes c ON a.class_id = c.id
     WHERE a.id = $1`, [id]);
    if (existingAttendance.rows.length === 0) {
        throw new errorHandler_1.AppError('Attendance record not found', 404);
    }
    const attendance = existingAttendance.rows[0];
    if (userRole !== 'admin' && attendance.marked_by !== userId) {
        throw new errorHandler_1.AppError('You are not authorized to delete this attendance record', 403);
    }
    if (userRole !== 'admin') {
        const markedAt = new Date(attendance.marked_at);
        const now = new Date();
        const hoursDiff = (now.getTime() - markedAt.getTime()) / (1000 * 60 * 60);
        if (hoursDiff > 24) {
            throw new errorHandler_1.AppError('Attendance can only be deleted within 24 hours of marking', 400);
        }
    }
    await (0, connection_1.query)('DELETE FROM attendance WHERE id = $1', [id]);
    res.json({
        success: true,
        message: 'Attendance record deleted successfully',
    });
});
//# sourceMappingURL=attendanceController.js.map
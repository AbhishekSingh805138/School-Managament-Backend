"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentService = void 0;
const baseService_1 = require("./baseService");
const errorHandler_1 = require("../middleware/errorHandler");
const pagination_1 = require("../utils/pagination");
const auth_1 = require("../utils/auth");
class StudentService extends baseService_1.BaseService {
    async createStudent(studentData) {
        return await this.executeTransaction(async (client) => {
            const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [studentData.email]);
            if (existingUser.rows.length > 0) {
                throw new errorHandler_1.AppError('User with this email already exists', 409);
            }
            const existingStudentId = await client.query('SELECT id FROM students WHERE student_id = $1', [studentData.studentId]);
            if (existingStudentId.rows.length > 0) {
                throw new errorHandler_1.AppError('Student with this ID already exists', 409);
            }
            const classResult = await client.query('SELECT id, capacity, current_enrollment FROM classes WHERE id = $1 AND is_active = true', [studentData.classId]);
            if (classResult.rows.length === 0) {
                throw new errorHandler_1.AppError('Class not found or inactive', 404);
            }
            const classInfo = classResult.rows[0];
            if (classInfo.current_enrollment >= classInfo.capacity) {
                throw new errorHandler_1.AppError('Class is at full capacity', 409);
            }
            const password = studentData.password || this.generateDefaultPassword(studentData.studentId);
            const passwordHash = await (0, auth_1.hashPassword)(password);
            const userSequentialId = await this.generateSequentialId('users');
            const userResult = await client.query(`INSERT INTO users (first_name, last_name, email, password_hash, role, phone, date_of_birth, address, alt_id)
         VALUES ($1, $2, $3, $4, 'student', $5, $6, $7, $8)
         RETURNING id, first_name, last_name, email, phone, date_of_birth, address, is_active, created_at, updated_at`, [
                studentData.firstName,
                studentData.lastName,
                studentData.email,
                passwordHash,
                studentData.phone || null,
                studentData.dateOfBirth || null,
                studentData.address || null,
                userSequentialId
            ]);
            const user = userResult.rows[0];
            const studentSequentialId = await this.generateSequentialId('students');
            const studentResult = await client.query(`INSERT INTO students (user_id, student_id, class_id, enrollment_date, guardian_name, guardian_phone, guardian_email, emergency_contact, medical_info, alt_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, alt_id, user_id, student_id, class_id, enrollment_date, guardian_name, guardian_phone, guardian_email, emergency_contact, medical_info, is_active, created_at, updated_at`, [
                user.id,
                studentData.studentId,
                studentData.classId,
                studentData.enrollmentDate,
                studentData.guardianName,
                studentData.guardianPhone,
                studentData.guardianEmail || null,
                studentData.emergencyContact,
                studentData.medicalInfo || null,
                studentSequentialId
            ]);
            const student = studentResult.rows[0];
            await client.query('UPDATE classes SET current_enrollment = current_enrollment + 1 WHERE id = $1', [studentData.classId]);
            await client.query(`INSERT INTO student_class_history (student_id, class_id, academic_year_id, start_date)
         VALUES ($1, $2, (SELECT academic_year_id FROM classes WHERE id = $2), $3)`, [student.id, studentData.classId, studentData.enrollmentDate]);
            return {
                ...this.transformStudentResponse(student),
                user: this.transformUserResponse(user),
                temporaryPassword: studentData.password ? undefined : password,
            };
        });
    }
    async getStudents(req) {
        const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'first_name');
        const { isActive, search, classId, grade } = req.query;
        let whereClause = "WHERE u.role = 'student'";
        const queryParams = [];
        if (isActive !== undefined) {
            whereClause += ` AND s.is_active = $${queryParams.length + 1}`;
            queryParams.push(isActive === 'true');
        }
        if (search) {
            whereClause += ` AND (u.first_name ILIKE $${queryParams.length + 1} OR u.last_name ILIKE $${queryParams.length + 1} OR u.email ILIKE $${queryParams.length + 1} OR s.student_id ILIKE $${queryParams.length + 1})`;
            queryParams.push(`%${search}%`);
        }
        if (classId) {
            whereClause += ` AND s.class_id = $${queryParams.length + 1}`;
            queryParams.push(classId);
        }
        if (grade) {
            whereClause += ` AND c.grade = $${queryParams.length + 1}`;
            queryParams.push(grade);
        }
        const countResult = await this.executeQuery(`SELECT COUNT(*) FROM students s
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON s.class_id = c.id
       ${whereClause}`, queryParams);
        const total = parseInt(countResult.rows[0].count);
        const result = await this.executeQuery(`SELECT s.id, s.alt_id, s.user_id, s.student_id, s.class_id, s.enrollment_date, 
              s.guardian_name, s.guardian_phone, s.guardian_email, s.emergency_contact, 
              s.medical_info, s.is_active, s.created_at, s.updated_at,
              u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.address,
              c.name as class_name, c.grade, c.section,
              ay.name as academic_year_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON s.class_id = c.id
       JOIN academic_years ay ON c.academic_year_id = ay.id
       ${whereClause}
       ORDER BY u.${sortBy} ${sortOrder}
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`, [...queryParams, limit, offset]);
        const students = result.rows.map((student) => ({
            ...this.transformStudentResponse(student),
            user: this.transformUserResponse(student),
            class: {
                id: student.class_id,
                name: student.class_name,
                grade: student.grade,
                section: student.section,
                academicYear: student.academic_year_name,
            },
        }));
        return {
            students,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getStudentById(id) {
        const isUUID = this.validateUUID(id);
        let result;
        if (isUUID) {
            result = await this.executeQuery(`SELECT s.id, s.alt_id, s.user_id, s.student_id, s.class_id, s.enrollment_date, 
                s.guardian_name, s.guardian_phone, s.guardian_email, s.emergency_contact, 
                s.medical_info, s.is_active, s.created_at, s.updated_at,
                u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.address,
                c.name as class_name, c.grade, c.section,
                ay.name as academic_year_name
         FROM students s
         JOIN users u ON s.user_id = u.id
         JOIN classes c ON s.class_id = c.id
         JOIN academic_years ay ON c.academic_year_id = ay.id
         WHERE s.id = $1`, [id]);
        }
        else {
            result = await this.executeQuery(`SELECT s.id, s.alt_id, s.user_id, s.student_id, s.class_id, s.enrollment_date, 
                s.guardian_name, s.guardian_phone, s.guardian_email, s.emergency_contact, 
                s.medical_info, s.is_active, s.created_at, s.updated_at,
                u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.address,
                c.name as class_name, c.grade, c.section,
                ay.name as academic_year_name
         FROM students s
         JOIN users u ON s.user_id = u.id
         JOIN classes c ON s.class_id = c.id
         JOIN academic_years ay ON c.academic_year_id = ay.id
         WHERE s.alt_id = $1 OR s.student_id = $1`, [id]);
        }
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('Student not found', 404);
        }
        const student = result.rows[0];
        const attendanceResult = await this.executeQuery(`SELECT 
         COUNT(*) as total_days,
         COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
         COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
         COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days
       FROM attendance 
       WHERE student_id = $1`, [student.id]);
        const attendance = attendanceResult.rows[0];
        const attendancePercentage = attendance.total_days > 0
            ? Math.round((attendance.present_days / attendance.total_days) * 100)
            : 0;
        return {
            ...this.transformStudentResponse(student),
            user: this.transformUserResponse(student),
            class: {
                id: student.class_id,
                name: student.class_name,
                grade: student.grade,
                section: student.section,
                academicYear: student.academic_year_name,
            },
            attendanceSummary: {
                totalDays: parseInt(attendance.total_days),
                presentDays: parseInt(attendance.present_days),
                absentDays: parseInt(attendance.absent_days),
                lateDays: parseInt(attendance.late_days),
                attendancePercentage,
            },
        };
    }
    async updateStudent(id, updateData) {
        const existingStudent = await this.checkEntityExists('students', id, 'alt_id');
        const studentId = existingStudent.id;
        const userId = existingStudent.user_id;
        return await this.executeTransaction(async (client) => {
            const userUpdateData = {};
            if (updateData.firstName)
                userUpdateData.firstName = updateData.firstName;
            if (updateData.lastName)
                userUpdateData.lastName = updateData.lastName;
            if (updateData.phone !== undefined)
                userUpdateData.phone = updateData.phone;
            if (updateData.dateOfBirth !== undefined)
                userUpdateData.dateOfBirth = updateData.dateOfBirth;
            if (updateData.address !== undefined)
                userUpdateData.address = updateData.address;
            if (Object.keys(userUpdateData).length > 0) {
                const { query: userUpdateQuery, values: userValues } = this.buildUpdateQuery('users', userUpdateData);
                userValues.push(userId);
                await client.query(userUpdateQuery, userValues);
            }
            const studentUpdateData = {};
            if (updateData.guardianName)
                studentUpdateData.guardianName = updateData.guardianName;
            if (updateData.guardianPhone)
                studentUpdateData.guardianPhone = updateData.guardianPhone;
            if (updateData.guardianEmail !== undefined)
                studentUpdateData.guardianEmail = updateData.guardianEmail;
            if (updateData.emergencyContact)
                studentUpdateData.emergencyContact = updateData.emergencyContact;
            if (updateData.medicalInfo !== undefined)
                studentUpdateData.medicalInfo = updateData.medicalInfo;
            if (updateData.classId && updateData.classId !== existingStudent.class_id) {
                const newClassResult = await client.query('SELECT id, capacity, current_enrollment FROM classes WHERE id = $1 AND is_active = true', [updateData.classId]);
                if (newClassResult.rows.length === 0) {
                    throw new errorHandler_1.AppError('New class not found or inactive', 404);
                }
                const newClass = newClassResult.rows[0];
                if (newClass.current_enrollment >= newClass.capacity) {
                    throw new errorHandler_1.AppError('New class is at full capacity', 409);
                }
                await client.query('UPDATE classes SET current_enrollment = current_enrollment - 1 WHERE id = $1', [existingStudent.class_id]);
                await client.query('UPDATE classes SET current_enrollment = current_enrollment + 1 WHERE id = $1', [updateData.classId]);
                await client.query('UPDATE student_class_history SET end_date = CURRENT_DATE WHERE student_id = $1 AND end_date IS NULL', [studentId]);
                await client.query(`INSERT INTO student_class_history (student_id, class_id, academic_year_id, start_date)
           VALUES ($1, $2, (SELECT academic_year_id FROM classes WHERE id = $2), CURRENT_DATE)`, [studentId, updateData.classId]);
                studentUpdateData.classId = updateData.classId;
            }
            if (Object.keys(studentUpdateData).length === 0 && Object.keys(userUpdateData).length === 0) {
                throw new errorHandler_1.AppError('No fields to update', 400);
            }
            let studentResult;
            if (Object.keys(studentUpdateData).length > 0) {
                const { query: studentUpdateQuery, values: studentValues } = this.buildUpdateQuery('students', studentUpdateData);
                studentValues.push(studentId);
                studentResult = await client.query(studentUpdateQuery, studentValues);
            }
            else {
                studentResult = await client.query(`SELECT id, alt_id, user_id, student_id, class_id, enrollment_date, guardian_name, guardian_phone, guardian_email, emergency_contact, medical_info, is_active, created_at, updated_at
           FROM students WHERE id = $1`, [studentId]);
            }
            const userResult = await client.query(`SELECT first_name, last_name, email, phone, date_of_birth, address
         FROM users WHERE id = $1`, [userId]);
            const student = studentResult.rows[0];
            const user = userResult.rows[0];
            return {
                ...this.transformStudentResponse(student),
                user: this.transformUserResponse(user),
            };
        });
    }
    async deleteStudent(id) {
        const existingStudent = await this.checkEntityExists('students', id, 'alt_id');
        const studentId = existingStudent.id;
        const userId = existingStudent.user_id;
        return await this.executeTransaction(async (client) => {
            await client.query('UPDATE students SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [studentId]);
            await client.query('UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [userId]);
            await client.query('UPDATE classes SET current_enrollment = current_enrollment - 1 WHERE id = $1', [existingStudent.class_id]);
            await client.query('UPDATE student_class_history SET end_date = CURRENT_DATE WHERE student_id = $1 AND end_date IS NULL', [studentId]);
            return { success: true };
        });
    }
    generateDefaultPassword(studentId) {
        return `student${studentId}`;
    }
    transformStudentResponse(student) {
        return {
            id: student.id,
            altId: student.alt_id,
            userId: student.user_id,
            studentId: student.student_id,
            classId: student.class_id,
            enrollmentDate: student.enrollment_date,
            guardianName: student.guardian_name,
            guardianPhone: student.guardian_phone,
            guardianEmail: student.guardian_email,
            emergencyContact: student.emergency_contact,
            medicalInfo: student.medical_info,
            isActive: student.is_active,
            createdAt: student.created_at,
            updatedAt: student.updated_at,
        };
    }
    transformUserResponse(user) {
        return {
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            phone: user.phone,
            dateOfBirth: user.date_of_birth,
            address: user.address,
        };
    }
}
exports.StudentService = StudentService;
//# sourceMappingURL=studentService.js.map
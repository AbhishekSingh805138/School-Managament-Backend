"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classService = exports.ClassService = void 0;
const baseService_1 = require("./baseService");
const errorHandler_1 = require("../middleware/errorHandler");
const pagination_1 = require("../utils/pagination");
class ClassService extends baseService_1.BaseService {
    async createClass(classData) {
        return await this.executeTransaction(async (client) => {
            const academicYearExists = await client.query('SELECT id, name FROM academic_years WHERE id = $1', [classData.academicYearId]);
            if (academicYearExists.rows.length === 0) {
                throw new errorHandler_1.AppError('Academic year not found', 404);
            }
            if (classData.teacherId) {
                const teacherExists = await client.query('SELECT id FROM users WHERE id = $1 AND role = \'teacher\' AND is_active = true', [classData.teacherId]);
                if (teacherExists.rows.length === 0) {
                    throw new errorHandler_1.AppError('Teacher not found or inactive', 404);
                }
                const existingAssignment = await client.query('SELECT id, name, grade, section FROM classes WHERE teacher_id = $1 AND is_active = true', [classData.teacherId]);
                if (existingAssignment.rows.length > 0) {
                    const existingClass = existingAssignment.rows[0];
                    throw new errorHandler_1.AppError(`Teacher is already assigned as main teacher to class ${existingClass.grade}-${existingClass.section}`, 409);
                }
            }
            const existingClass = await client.query('SELECT id FROM classes WHERE grade = $1 AND section = $2 AND academic_year_id = $3', [classData.grade, classData.section, classData.academicYearId]);
            if (existingClass.rows.length > 0) {
                throw new errorHandler_1.AppError('Class with this grade and section already exists for this academic year', 409);
            }
            const sequentialId = await this.generateSequentialId('classes');
            const result = await client.query(`INSERT INTO classes (name, grade, section, teacher_id, capacity, room, description, academic_year_id, current_enrollment, alt_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9)
         RETURNING id, alt_id, name, grade, section, teacher_id, capacity, room, description, academic_year_id, current_enrollment, is_active, created_at, updated_at`, [
                classData.name,
                classData.grade,
                classData.section,
                classData.teacherId || null,
                classData.capacity,
                classData.room || null,
                classData.description || null,
                classData.academicYearId,
                sequentialId
            ]);
            const newClass = result.rows[0];
            const academicYear = academicYearExists.rows[0];
            let teacher = null;
            if (newClass.teacher_id) {
                const teacherResult = await client.query('SELECT first_name, last_name FROM users WHERE id = $1', [newClass.teacher_id]);
                if (teacherResult.rows.length > 0) {
                    const teacherInfo = teacherResult.rows[0];
                    teacher = {
                        id: newClass.teacher_id,
                        name: `${teacherInfo.first_name} ${teacherInfo.last_name}`,
                    };
                }
            }
            return {
                ...this.transformClassResponse(newClass),
                academicYear: {
                    id: academicYear.id,
                    name: academicYear.name,
                },
                teacher,
            };
        });
    }
    async getClasses(req) {
        const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'grade');
        const { isActive, academicYearId, grade, teacherId } = req.query;
        let whereClause = 'WHERE 1=1';
        const queryParams = [];
        if (isActive !== undefined) {
            whereClause += ` AND c.is_active = $${queryParams.length + 1}`;
            queryParams.push(isActive === 'true');
        }
        if (academicYearId) {
            whereClause += ` AND c.academic_year_id = $${queryParams.length + 1}`;
            queryParams.push(academicYearId);
        }
        if (grade) {
            whereClause += ` AND c.grade = $${queryParams.length + 1}`;
            queryParams.push(grade);
        }
        if (teacherId) {
            whereClause += ` AND c.teacher_id = $${queryParams.length + 1}`;
            queryParams.push(teacherId);
        }
        const countResult = await this.executeQuery(`SELECT COUNT(*) FROM classes c
       JOIN academic_years ay ON c.academic_year_id = ay.id
       ${whereClause}`, queryParams);
        const total = parseInt(countResult.rows[0].count);
        const result = await this.executeQuery(`SELECT c.id, c.alt_id, c.name, c.grade, c.section, c.teacher_id, c.capacity, c.room, 
              c.description, c.academic_year_id, c.current_enrollment, c.is_active, c.created_at, c.updated_at,
              ay.name as academic_year_name,
              u.first_name as teacher_first_name, u.last_name as teacher_last_name
       FROM classes c
       JOIN academic_years ay ON c.academic_year_id = ay.id
       LEFT JOIN users u ON c.teacher_id = u.id
       ${whereClause}
       ORDER BY c.${sortBy} ${sortOrder}, c.section
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`, [...queryParams, limit, offset]);
        const classes = result.rows.map((cls) => ({
            ...this.transformClassResponse(cls),
            academicYear: {
                id: cls.academic_year_id,
                name: cls.academic_year_name,
            },
            teacher: cls.teacher_first_name ? {
                id: cls.teacher_id,
                name: `${cls.teacher_first_name} ${cls.teacher_last_name}`,
            } : null,
        }));
        return {
            classes,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getClassById(id) {
        const classInfo = await this.checkEntityExists('classes', id, 'alt_id');
        const academicYearResult = await this.executeQuery('SELECT id, name FROM academic_years WHERE id = $1', [classInfo.academic_year_id]);
        let teacher = null;
        if (classInfo.teacher_id) {
            const teacherResult = await this.executeQuery('SELECT first_name, last_name FROM users WHERE id = $1', [classInfo.teacher_id]);
            if (teacherResult.rows.length > 0) {
                const teacherInfo = teacherResult.rows[0];
                teacher = {
                    id: classInfo.teacher_id,
                    name: `${teacherInfo.first_name} ${teacherInfo.last_name}`,
                };
            }
        }
        const studentsResult = await this.executeQuery(`SELECT s.id, s.student_id, u.first_name, u.last_name, s.enrollment_date
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.class_id = $1 AND s.is_active = true
       ORDER BY u.first_name, u.last_name`, [classInfo.id]);
        const subjectsResult = await this.executeQuery(`SELECT cs.id as assignment_id, s.id, s.name, s.code, s.credit_hours,
              u.first_name as teacher_first_name, u.last_name as teacher_last_name
       FROM class_subjects cs
       JOIN subjects s ON cs.subject_id = s.id
       LEFT JOIN users u ON cs.teacher_id = u.id
       WHERE cs.class_id = $1 AND s.is_active = true
       ORDER BY s.name`, [classInfo.id]);
        return {
            ...this.transformClassResponse(classInfo),
            academicYear: {
                id: academicYearResult.rows[0].id,
                name: academicYearResult.rows[0].name,
            },
            teacher,
            students: studentsResult.rows.map((student) => ({
                id: student.id,
                studentId: student.student_id,
                name: `${student.first_name} ${student.last_name}`,
                enrollmentDate: student.enrollment_date,
            })),
            subjects: subjectsResult.rows.map((subject) => ({
                assignmentId: subject.assignment_id,
                id: subject.id,
                name: subject.name,
                code: subject.code,
                creditHours: subject.credit_hours,
                teacher: subject.teacher_first_name ? {
                    name: `${subject.teacher_first_name} ${subject.teacher_last_name}`,
                } : null,
            })),
        };
    }
    async updateClass(id, updateData) {
        const existingClass = await this.checkEntityExists('classes', id, 'alt_id');
        const actualClassId = existingClass.id;
        return await this.executeTransaction(async (client) => {
            if (updateData.teacherId !== undefined) {
                if (updateData.teacherId) {
                    const teacherExists = await client.query('SELECT id FROM users WHERE id = $1 AND role = \'teacher\' AND is_active = true', [updateData.teacherId]);
                    if (teacherExists.rows.length === 0) {
                        throw new errorHandler_1.AppError('Teacher not found or inactive', 404);
                    }
                    const existingAssignment = await client.query('SELECT id, name, grade, section FROM classes WHERE teacher_id = $1 AND is_active = true AND id != $2', [updateData.teacherId, actualClassId]);
                    if (existingAssignment.rows.length > 0) {
                        const existingClass = existingAssignment.rows[0];
                        throw new errorHandler_1.AppError(`Teacher is already assigned as main teacher to class ${existingClass.grade}-${existingClass.section}`, 409);
                    }
                }
            }
            if ((updateData.grade || updateData.section) &&
                (updateData.grade !== existingClass.grade || updateData.section !== existingClass.section)) {
                const newGrade = updateData.grade || existingClass.grade;
                const newSection = updateData.section || existingClass.section;
                const conflictCheck = await client.query('SELECT id FROM classes WHERE grade = $1 AND section = $2 AND academic_year_id = $3 AND id != $4', [newGrade, newSection, existingClass.academic_year_id, actualClassId]);
                if (conflictCheck.rows.length > 0) {
                    throw new errorHandler_1.AppError('Class with this grade and section already exists for this academic year', 409);
                }
            }
            const { query: updateQuery, values } = this.buildUpdateQuery('classes', updateData);
            values.push(actualClassId);
            const result = await client.query(updateQuery, values);
            return this.transformClassResponse(result.rows[0]);
        });
    }
    async deleteClass(id) {
        const existingClass = await this.checkEntityExists('classes', id, 'alt_id');
        const actualClassId = existingClass.id;
        const dependenciesCheck = await this.executeQuery(`SELECT 
         (SELECT COUNT(*) FROM students WHERE class_id = $1 AND is_active = true) as active_students,
         (SELECT COUNT(*) FROM class_subjects WHERE class_id = $1) as subject_assignments,
         (SELECT COUNT(*) FROM attendance WHERE class_id = $1) as attendance_records`, [actualClassId]);
        const dependencies = dependenciesCheck.rows[0];
        const activeStudents = parseInt(dependencies.active_students);
        if (activeStudents > 0) {
            throw new errorHandler_1.AppError(`Cannot delete class. It has ${activeStudents} active students. Please transfer students first.`, 409);
        }
        await this.executeQuery('UPDATE classes SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [actualClassId]);
        return { success: true };
    }
    async assignSubjectToClass(classId, subjectId, teacherId) {
        const classInfo = await this.checkEntityExists('classes', classId, 'alt_id');
        const actualClassId = classInfo.id;
        return await this.executeTransaction(async (client) => {
            const subjectExists = await client.query('SELECT id, name FROM subjects WHERE id = $1 AND is_active = true', [subjectId]);
            if (subjectExists.rows.length === 0) {
                throw new errorHandler_1.AppError('Subject not found or inactive', 404);
            }
            if (teacherId) {
                const teacherExists = await client.query('SELECT id FROM users WHERE id = $1 AND role = \'teacher\' AND is_active = true', [teacherId]);
                if (teacherExists.rows.length === 0) {
                    throw new errorHandler_1.AppError('Teacher not found or inactive', 404);
                }
            }
            const existingAssignment = await client.query('SELECT id FROM class_subjects WHERE class_id = $1 AND subject_id = $2', [actualClassId, subjectId]);
            if (existingAssignment.rows.length > 0) {
                throw new errorHandler_1.AppError('Subject is already assigned to this class', 409);
            }
            const result = await client.query(`INSERT INTO class_subjects (class_id, subject_id, teacher_id, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING id, class_id, subject_id, teacher_id, created_at, updated_at`, [actualClassId, subjectId, teacherId || null]);
            const assignment = result.rows[0];
            const subject = subjectExists.rows[0];
            return {
                id: assignment.id,
                classId: assignment.class_id,
                subjectId: assignment.subject_id,
                teacherId: assignment.teacher_id,
                subject: {
                    id: subject.id,
                    name: subject.name
                },
                createdAt: assignment.created_at,
                updatedAt: assignment.updated_at
            };
        });
    }
    async removeSubjectFromClass(classId, subjectId) {
        const classInfo = await this.checkEntityExists('classes', classId, 'alt_id');
        const actualClassId = classInfo.id;
        const assignmentExists = await this.executeQuery('SELECT id FROM class_subjects WHERE class_id = $1 AND subject_id = $2', [actualClassId, subjectId]);
        if (assignmentExists.rows.length === 0) {
            throw new errorHandler_1.AppError('Subject is not assigned to this class', 404);
        }
        const gradesCheck = await this.executeQuery('SELECT COUNT(*) as count FROM grades WHERE class_id = $1 AND subject_id = $2', [actualClassId, subjectId]);
        if (parseInt(gradesCheck.rows[0].count) > 0) {
            throw new errorHandler_1.AppError('Cannot remove subject. It has associated grade records.', 409);
        }
        await this.executeQuery('DELETE FROM class_subjects WHERE class_id = $1 AND subject_id = $2', [actualClassId, subjectId]);
        return { success: true };
    }
    async getClassStatistics(classId) {
        const classInfo = await this.checkEntityExists('classes', classId, 'alt_id');
        const actualClassId = classInfo.id;
        const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM students WHERE class_id = $1 AND is_active = true) as total_students,
        (SELECT COUNT(*) FROM class_subjects WHERE class_id = $1) as total_subjects,
        (SELECT COUNT(DISTINCT teacher_id) FROM class_subjects WHERE class_id = $1 AND teacher_id IS NOT NULL) as subject_teachers,
        (SELECT COUNT(*) FROM attendance WHERE class_id = $1) as total_attendance_records,
        (SELECT COUNT(*) FROM grades WHERE class_id = $1) as total_grades,
        (SELECT AVG(marks_obtained::float / total_marks * 100) 
         FROM grades 
         WHERE class_id = $1 AND total_marks > 0) as average_percentage
    `;
        const statsResult = await this.executeQuery(statsQuery, [actualClassId]);
        const stats = statsResult.rows[0];
        return {
            class: this.transformClassResponse(classInfo),
            stats: {
                totalStudents: parseInt(stats.total_students) || 0,
                totalSubjects: parseInt(stats.total_subjects) || 0,
                subjectTeachers: parseInt(stats.subject_teachers) || 0,
                totalAttendanceRecords: parseInt(stats.total_attendance_records) || 0,
                totalGrades: parseInt(stats.total_grades) || 0,
                averagePercentage: stats.average_percentage ? parseFloat(stats.average_percentage).toFixed(2) : null,
                currentEnrollment: classInfo.current_enrollment,
                capacity: classInfo.capacity,
                occupancyRate: ((classInfo.current_enrollment / classInfo.capacity) * 100).toFixed(2)
            }
        };
    }
    async enrollStudentToClass(classId, studentId) {
        const classInfo = await this.checkEntityExists('classes', classId, 'alt_id');
        const actualClassId = classInfo.id;
        return await this.executeTransaction(async (client) => {
            const studentExists = await client.query('SELECT id, user_id FROM students WHERE id = $1 AND is_active = true', [studentId]);
            if (studentExists.rows.length === 0) {
                throw new errorHandler_1.AppError('Student not found or inactive', 404);
            }
            const student = studentExists.rows[0];
            const existingEnrollment = await client.query('SELECT class_id FROM students WHERE id = $1 AND class_id IS NOT NULL', [studentId]);
            if (existingEnrollment.rows.length > 0) {
                throw new errorHandler_1.AppError('Student is already enrolled in a class', 409);
            }
            if (classInfo.current_enrollment >= classInfo.capacity) {
                throw new errorHandler_1.AppError('Class is at full capacity', 409);
            }
            await client.query('UPDATE students SET class_id = $1, enrollment_date = NOW(), updated_at = NOW() WHERE id = $2', [actualClassId, studentId]);
            await client.query('UPDATE classes SET current_enrollment = current_enrollment + 1, updated_at = NOW() WHERE id = $1', [actualClassId]);
            const studentInfo = await client.query('SELECT u.first_name, u.last_name FROM users u WHERE u.id = $1', [student.user_id]);
            return {
                studentId: studentId,
                classId: actualClassId,
                studentName: `${studentInfo.rows[0].first_name} ${studentInfo.rows[0].last_name}`,
                enrollmentDate: new Date()
            };
        });
    }
    async bulkEnrollStudentsToClass(classId, studentIds) {
        const classInfo = await this.checkEntityExists('classes', classId, 'alt_id');
        const actualClassId = classInfo.id;
        return await this.executeTransaction(async (client) => {
            const results = [];
            const errors = [];
            const availableSpots = classInfo.capacity - classInfo.current_enrollment;
            if (studentIds.length > availableSpots) {
                throw new errorHandler_1.AppError(`Class has only ${availableSpots} available spots, but ${studentIds.length} students requested`, 409);
            }
            for (const studentId of studentIds) {
                try {
                    const studentExists = await client.query('SELECT id, user_id FROM students WHERE id = $1 AND is_active = true', [studentId]);
                    if (studentExists.rows.length === 0) {
                        errors.push({ studentId, error: 'Student not found or inactive' });
                        continue;
                    }
                    const student = studentExists.rows[0];
                    const existingEnrollment = await client.query('SELECT class_id FROM students WHERE id = $1 AND class_id IS NOT NULL', [studentId]);
                    if (existingEnrollment.rows.length > 0) {
                        errors.push({ studentId, error: 'Student is already enrolled in a class' });
                        continue;
                    }
                    await client.query('UPDATE students SET class_id = $1, enrollment_date = NOW(), updated_at = NOW() WHERE id = $2', [actualClassId, studentId]);
                    const studentInfo = await client.query('SELECT u.first_name, u.last_name FROM users u WHERE u.id = $1', [student.user_id]);
                    results.push({
                        studentId: studentId,
                        studentName: `${studentInfo.rows[0].first_name} ${studentInfo.rows[0].last_name}`,
                        enrollmentDate: new Date()
                    });
                }
                catch (error) {
                    errors.push({ studentId, error: error.message });
                }
            }
            if (results.length > 0) {
                await client.query('UPDATE classes SET current_enrollment = current_enrollment + $1, updated_at = NOW() WHERE id = $2', [results.length, actualClassId]);
            }
            return {
                classId: actualClassId,
                successfulEnrollments: results,
                errors: errors,
                totalEnrolled: results.length,
                totalErrors: errors.length
            };
        });
    }
    async transferStudent(studentId, targetClassId) {
        return await this.executeTransaction(async (client) => {
            const studentExists = await client.query('SELECT id, class_id, user_id FROM students WHERE id = $1 AND is_active = true', [studentId]);
            if (studentExists.rows.length === 0) {
                throw new errorHandler_1.AppError('Student not found or inactive', 404);
            }
            const student = studentExists.rows[0];
            const currentClassId = student.class_id;
            if (!currentClassId) {
                throw new errorHandler_1.AppError('Student is not currently enrolled in any class', 400);
            }
            const targetClassExists = await this.checkEntityExists('classes', targetClassId, 'alt_id');
            const actualTargetClassId = targetClassExists.id;
            if (currentClassId === actualTargetClassId) {
                throw new errorHandler_1.AppError('Student is already in the target class', 400);
            }
            if (targetClassExists.current_enrollment >= targetClassExists.capacity) {
                throw new errorHandler_1.AppError('Target class is at full capacity', 409);
            }
            await client.query('UPDATE students SET class_id = $1, updated_at = NOW() WHERE id = $2', [actualTargetClassId, studentId]);
            await client.query('UPDATE classes SET current_enrollment = current_enrollment - 1, updated_at = NOW() WHERE id = $1', [currentClassId]);
            await client.query('UPDATE classes SET current_enrollment = current_enrollment + 1, updated_at = NOW() WHERE id = $1', [actualTargetClassId]);
            const studentInfo = await client.query('SELECT u.first_name, u.last_name FROM users u WHERE u.id = $1', [student.user_id]);
            const currentClassInfo = await client.query('SELECT name, grade, section FROM classes WHERE id = $1', [currentClassId]);
            const targetClassInfo = await client.query('SELECT name, grade, section FROM classes WHERE id = $1', [actualTargetClassId]);
            return {
                studentId: studentId,
                studentName: `${studentInfo.rows[0].first_name} ${studentInfo.rows[0].last_name}`,
                fromClass: {
                    id: currentClassId,
                    name: currentClassInfo.rows[0].name,
                    grade: currentClassInfo.rows[0].grade,
                    section: currentClassInfo.rows[0].section
                },
                toClass: {
                    id: actualTargetClassId,
                    name: targetClassInfo.rows[0].name,
                    grade: targetClassInfo.rows[0].grade,
                    section: targetClassInfo.rows[0].section
                },
                transferDate: new Date()
            };
        });
    }
    async getClassStudents(classId) {
        const classInfo = await this.checkEntityExists('classes', classId, 'alt_id');
        const actualClassId = classInfo.id;
        const studentsResult = await this.executeQuery(`SELECT s.id, s.student_id, s.enrollment_date, s.is_active,
              u.first_name, u.last_name, u.email, u.phone
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.class_id = $1
       ORDER BY u.first_name, u.last_name`, [actualClassId]);
        return {
            class: this.transformClassResponse(classInfo),
            students: studentsResult.rows.map((student) => ({
                id: student.id,
                studentId: student.student_id,
                name: `${student.first_name} ${student.last_name}`,
                email: student.email,
                phone: student.phone,
                enrollmentDate: student.enrollment_date,
                isActive: student.is_active
            })),
            totalStudents: studentsResult.rows.length
        };
    }
    async getClassSubjects(classId) {
        const classInfo = await this.checkEntityExists('classes', classId, 'alt_id');
        const actualClassId = classInfo.id;
        const subjectsResult = await this.executeQuery(`SELECT cs.id as assignment_id, cs.teacher_id,
              s.id, s.name, s.code, s.credit_hours, s.description,
              u.first_name as teacher_first_name, u.last_name as teacher_last_name
       FROM class_subjects cs
       JOIN subjects s ON cs.subject_id = s.id
       LEFT JOIN users u ON cs.teacher_id = u.id
       WHERE cs.class_id = $1 AND s.is_active = true
       ORDER BY s.name`, [actualClassId]);
        return {
            class: this.transformClassResponse(classInfo),
            subjects: subjectsResult.rows.map((subject) => ({
                assignmentId: subject.assignment_id,
                id: subject.id,
                name: subject.name,
                code: subject.code,
                creditHours: subject.credit_hours,
                description: subject.description,
                teacher: subject.teacher_first_name ? {
                    id: subject.teacher_id,
                    name: `${subject.teacher_first_name} ${subject.teacher_last_name}`
                } : null
            })),
            totalSubjects: subjectsResult.rows.length
        };
    }
    transformClassResponse(classInfo) {
        return {
            id: classInfo.id,
            altId: classInfo.alt_id,
            name: classInfo.name,
            grade: classInfo.grade,
            section: classInfo.section,
            teacherId: classInfo.teacher_id,
            capacity: classInfo.capacity,
            room: classInfo.room,
            description: classInfo.description,
            academicYearId: classInfo.academic_year_id,
            currentEnrollment: classInfo.current_enrollment,
            isActive: classInfo.is_active,
            createdAt: classInfo.created_at,
            updatedAt: classInfo.updated_at,
        };
    }
}
exports.ClassService = ClassService;
exports.classService = new ClassService();
//# sourceMappingURL=classService.js.map
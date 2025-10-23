"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOptimalTeacherSuggestions = exports.getAllTeacherAssignments = exports.checkAssignmentConflicts = exports.getTeacherWorkload = exports.removeTeacherFromClassSubject = exports.assignTeacherToClassSubject = exports.removeTeacherFromClass = exports.assignTeacherToClass = exports.removeTeacherFromSubject = exports.assignTeacherToSubject = exports.deleteTeacher = exports.updateTeacher = exports.getTeacherById = exports.getTeachers = exports.createTeacher = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const pagination_1 = require("../utils/pagination");
const auth_1 = require("../utils/auth");
exports.createTeacher = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const teacherData = req.body;
    const existingUser = await (0, connection_1.query)('SELECT id FROM users WHERE email = $1', [teacherData.email]);
    if (existingUser.rows.length > 0) {
        throw new errorHandler_1.AppError('User with this email already exists', 409);
    }
    const existingEmployee = await (0, connection_1.query)('SELECT id FROM teachers WHERE employee_id = $1', [teacherData.employeeId]);
    if (existingEmployee.rows.length > 0) {
        throw new errorHandler_1.AppError('Teacher with this employee ID already exists', 409);
    }
    const client = await (0, connection_1.getClient)();
    try {
        await client.query('BEGIN');
        const passwordHash = await (0, auth_1.hashPassword)(teacherData.password);
        const userSeqIdResult = await client.query('SELECT generate_sequential_id($1) as next_id', ['users']);
        const userSequentialId = userSeqIdResult.rows[0].next_id;
        const userResult = await client.query(`INSERT INTO users (first_name, last_name, email, password_hash, role, phone, date_of_birth, address, alt_id)
       VALUES ($1, $2, $3, $4, 'teacher', $5, $6, $7, $8)
       RETURNING id, first_name, last_name, email, phone, date_of_birth, address, is_active, created_at, updated_at`, [
            teacherData.firstName,
            teacherData.lastName,
            teacherData.email,
            passwordHash,
            teacherData.phone || null,
            teacherData.dateOfBirth || null,
            teacherData.address || null,
            userSequentialId.toString()
        ]);
        const user = userResult.rows[0];
        const teacherSeqIdResult = await client.query('SELECT generate_sequential_id($1) as next_id', ['teachers']);
        const teacherSequentialId = teacherSeqIdResult.rows[0].next_id;
        const teacherResult = await client.query(`INSERT INTO teachers (user_id, employee_id, qualification, experience_years, specialization, joining_date, salary, alt_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, alt_id, user_id, employee_id, qualification, experience_years, specialization, joining_date, salary, is_active, created_at, updated_at`, [
            user.id,
            teacherData.employeeId,
            teacherData.qualification || null,
            teacherData.experienceYears || 0,
            teacherData.specialization || null,
            teacherData.joiningDate,
            teacherData.salary || null,
            teacherSequentialId.toString()
        ]);
        const teacher = teacherResult.rows[0];
        await client.query('COMMIT');
        res.status(201).json({
            success: true,
            message: 'Teacher profile created successfully',
            data: {
                id: teacher.id,
                altId: teacher.alt_id,
                userId: teacher.user_id,
                employeeId: teacher.employee_id,
                qualification: teacher.qualification,
                experienceYears: teacher.experience_years,
                specialization: teacher.specialization,
                joiningDate: teacher.joining_date,
                salary: teacher.salary,
                isActive: teacher.is_active,
                createdAt: teacher.created_at,
                updatedAt: teacher.updated_at,
                user: {
                    firstName: user.first_name,
                    lastName: user.last_name,
                    email: user.email,
                    phone: user.phone,
                    dateOfBirth: user.date_of_birth,
                    address: user.address,
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
exports.getTeachers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'first_name');
    const { isActive, search, specialization } = req.query;
    let whereClause = "WHERE u.role = 'teacher'";
    const queryParams = [];
    if (isActive !== undefined) {
        whereClause += ` AND t.is_active = $${queryParams.length + 1}`;
        queryParams.push(isActive === 'true');
    }
    if (search) {
        whereClause += ` AND (u.first_name ILIKE $${queryParams.length + 1} OR u.last_name ILIKE $${queryParams.length + 1} OR u.email ILIKE $${queryParams.length + 1} OR t.employee_id ILIKE $${queryParams.length + 1})`;
        queryParams.push(`%${search}%`);
    }
    if (specialization) {
        whereClause += ` AND t.specialization ILIKE $${queryParams.length + 1}`;
        queryParams.push(`%${specialization}%`);
    }
    const countResult = await (0, connection_1.query)(`SELECT COUNT(*) FROM teachers t
     JOIN users u ON t.user_id = u.id
     ${whereClause}`, queryParams);
    const total = parseInt(countResult.rows[0].count);
    const result = await (0, connection_1.query)(`SELECT t.id, t.alt_id, t.user_id, t.employee_id, t.qualification, t.experience_years, 
            t.specialization, t.joining_date, t.salary, t.is_active, t.created_at, t.updated_at,
            u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.address
     FROM teachers t
     JOIN users u ON t.user_id = u.id
     ${whereClause}
     ORDER BY u.${sortBy} ${sortOrder}
     LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`, [...queryParams, limit, offset]);
    const teachers = result.rows.map((teacher) => ({
        id: teacher.id,
        altId: teacher.alt_id,
        userId: teacher.user_id,
        employeeId: teacher.employee_id,
        qualification: teacher.qualification,
        experienceYears: teacher.experience_years,
        specialization: teacher.specialization,
        joiningDate: teacher.joining_date,
        salary: teacher.salary,
        isActive: teacher.is_active,
        createdAt: teacher.created_at,
        updatedAt: teacher.updated_at,
        user: {
            firstName: teacher.first_name,
            lastName: teacher.last_name,
            email: teacher.email,
            phone: teacher.phone,
            dateOfBirth: teacher.date_of_birth,
            address: teacher.address,
        },
    }));
    res.json({
        success: true,
        data: teachers,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
});
exports.getTeacherById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(id);
    let result;
    if (isUUID) {
        result = await (0, connection_1.query)(`SELECT t.id, t.alt_id, t.user_id, t.employee_id, t.qualification, t.experience_years, 
              t.specialization, t.joining_date, t.salary, t.is_active, t.created_at, t.updated_at,
              u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.address
       FROM teachers t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`, [id]);
    }
    else {
        result = await (0, connection_1.query)(`SELECT t.id, t.alt_id, t.user_id, t.employee_id, t.qualification, t.experience_years, 
              t.specialization, t.joining_date, t.salary, t.is_active, t.created_at, t.updated_at,
              u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.address
       FROM teachers t
       JOIN users u ON t.user_id = u.id
       WHERE t.alt_id = $1 OR t.employee_id = $1`, [id]);
    }
    if (result.rows.length === 0) {
        throw new errorHandler_1.AppError('Teacher not found', 404);
    }
    const teacher = result.rows[0];
    const subjectsResult = await (0, connection_1.query)(`SELECT s.id, s.name, s.code, s.description, s.credit_hours
     FROM teacher_subjects ts
     JOIN subjects s ON ts.subject_id = s.id
     WHERE ts.teacher_id = $1 AND s.is_active = true
     ORDER BY s.name`, [teacher.id]);
    const classesResult = await (0, connection_1.query)(`SELECT c.id, c.name, c.grade, c.section, c.capacity, c.room,
            ay.name as academic_year_name
     FROM classes c
     JOIN academic_years ay ON c.academic_year_id = ay.id
     WHERE c.teacher_id = $1 AND c.is_active = true
     ORDER BY c.grade, c.section`, [teacher.id]);
    res.json({
        success: true,
        data: {
            id: teacher.id,
            altId: teacher.alt_id,
            userId: teacher.user_id,
            employeeId: teacher.employee_id,
            qualification: teacher.qualification,
            experienceYears: teacher.experience_years,
            specialization: teacher.specialization,
            joiningDate: teacher.joining_date,
            salary: teacher.salary,
            isActive: teacher.is_active,
            createdAt: teacher.created_at,
            updatedAt: teacher.updated_at,
            user: {
                firstName: teacher.first_name,
                lastName: teacher.last_name,
                email: teacher.email,
                phone: teacher.phone,
                dateOfBirth: teacher.date_of_birth,
                address: teacher.address,
            },
            subjects: subjectsResult.rows.map((subject) => ({
                id: subject.id,
                name: subject.name,
                code: subject.code,
                description: subject.description,
                creditHours: subject.credit_hours,
            })),
            classes: classesResult.rows.map((cls) => ({
                id: cls.id,
                name: cls.name,
                grade: cls.grade,
                section: cls.section,
                capacity: cls.capacity,
                room: cls.room,
                academicYearName: cls.academic_year_name,
            })),
        },
    });
});
exports.updateTeacher = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(id);
    let existingTeacher;
    if (isUUID) {
        existingTeacher = await (0, connection_1.query)('SELECT id, user_id FROM teachers WHERE id = $1', [id]);
    }
    else {
        existingTeacher = await (0, connection_1.query)('SELECT id, user_id FROM teachers WHERE alt_id = $1 OR employee_id = $1', [id]);
    }
    if (existingTeacher.rows.length === 0) {
        throw new errorHandler_1.AppError('Teacher not found', 404);
    }
    const teacherId = existingTeacher.rows[0].id;
    const userId = existingTeacher.rows[0].user_id;
    const client = await (0, connection_1.getClient)();
    try {
        await client.query('BEGIN');
        const userUpdateFields = [];
        const userValues = [];
        let userParamCount = 1;
        if (updateData.firstName) {
            userUpdateFields.push(`first_name = $${userParamCount++}`);
            userValues.push(updateData.firstName);
        }
        if (updateData.lastName) {
            userUpdateFields.push(`last_name = $${userParamCount++}`);
            userValues.push(updateData.lastName);
        }
        if (updateData.phone !== undefined) {
            userUpdateFields.push(`phone = $${userParamCount++}`);
            userValues.push(updateData.phone);
        }
        if (updateData.dateOfBirth !== undefined) {
            userUpdateFields.push(`date_of_birth = $${userParamCount++}`);
            userValues.push(updateData.dateOfBirth);
        }
        if (updateData.address !== undefined) {
            userUpdateFields.push(`address = $${userParamCount++}`);
            userValues.push(updateData.address);
        }
        if (userUpdateFields.length > 0) {
            userValues.push(userId);
            await client.query(`UPDATE users SET ${userUpdateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${userParamCount}`, userValues);
        }
        const teacherUpdateFields = [];
        const teacherValues = [];
        let teacherParamCount = 1;
        if (updateData.qualification !== undefined) {
            teacherUpdateFields.push(`qualification = $${teacherParamCount++}`);
            teacherValues.push(updateData.qualification);
        }
        if (updateData.experienceYears !== undefined) {
            teacherUpdateFields.push(`experience_years = $${teacherParamCount++}`);
            teacherValues.push(updateData.experienceYears);
        }
        if (updateData.specialization !== undefined) {
            teacherUpdateFields.push(`specialization = $${teacherParamCount++}`);
            teacherValues.push(updateData.specialization);
        }
        if (updateData.salary !== undefined) {
            teacherUpdateFields.push(`salary = $${teacherParamCount++}`);
            teacherValues.push(updateData.salary);
        }
        if (teacherUpdateFields.length === 0 && userUpdateFields.length === 0) {
            throw new errorHandler_1.AppError('No fields to update', 400);
        }
        let teacherResult;
        if (teacherUpdateFields.length > 0) {
            teacherValues.push(teacherId);
            teacherResult = await client.query(`UPDATE teachers SET ${teacherUpdateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${teacherParamCount}
         RETURNING id, alt_id, user_id, employee_id, qualification, experience_years, specialization, joining_date, salary, is_active, created_at, updated_at`, teacherValues);
        }
        else {
            teacherResult = await client.query(`SELECT id, alt_id, user_id, employee_id, qualification, experience_years, specialization, joining_date, salary, is_active, created_at, updated_at
         FROM teachers WHERE id = $1`, [teacherId]);
        }
        const userResult = await client.query(`SELECT first_name, last_name, email, phone, date_of_birth, address
       FROM users WHERE id = $1`, [userId]);
        await client.query('COMMIT');
        const teacher = teacherResult.rows[0];
        const user = userResult.rows[0];
        res.json({
            success: true,
            message: 'Teacher profile updated successfully',
            data: {
                id: teacher.id,
                altId: teacher.alt_id,
                userId: teacher.user_id,
                employeeId: teacher.employee_id,
                qualification: teacher.qualification,
                experienceYears: teacher.experience_years,
                specialization: teacher.specialization,
                joiningDate: teacher.joining_date,
                salary: teacher.salary,
                isActive: teacher.is_active,
                createdAt: teacher.created_at,
                updatedAt: teacher.updated_at,
                user: {
                    firstName: user.first_name,
                    lastName: user.last_name,
                    email: user.email,
                    phone: user.phone,
                    dateOfBirth: user.date_of_birth,
                    address: user.address,
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
exports.deleteTeacher = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(id);
    let existingTeacher;
    if (isUUID) {
        existingTeacher = await (0, connection_1.query)('SELECT id, user_id, employee_id FROM teachers WHERE id = $1', [id]);
    }
    else {
        existingTeacher = await (0, connection_1.query)('SELECT id, user_id, employee_id FROM teachers WHERE alt_id = $1 OR employee_id = $1', [id]);
    }
    if (existingTeacher.rows.length === 0) {
        throw new errorHandler_1.AppError('Teacher not found', 404);
    }
    const teacherId = existingTeacher.rows[0].id;
    const userId = existingTeacher.rows[0].user_id;
    const assignmentsCheck = await (0, connection_1.query)(`SELECT 
       (SELECT COUNT(*) FROM classes WHERE teacher_id = $1 AND is_active = true) as active_classes_count`, [teacherId]);
    const activeClasses = parseInt(assignmentsCheck.rows[0].active_classes_count);
    if (activeClasses > 0) {
        throw new errorHandler_1.AppError(`Cannot deactivate teacher. They have ${activeClasses} active class assignments. Please reassign classes first.`, 409);
    }
    const client = await (0, connection_1.getClient)();
    try {
        await client.query('BEGIN');
        await client.query('UPDATE teachers SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [teacherId]);
        await client.query('UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [userId]);
        await client.query('COMMIT');
        res.json({
            success: true,
            message: 'Teacher deactivated successfully',
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
exports.assignTeacherToSubject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { teacherId, subjectId } = req.body;
    const teacherExists = await (0, connection_1.query)(`SELECT t.id, u.first_name, u.last_name 
     FROM teachers t 
     JOIN users u ON t.user_id = u.id 
     WHERE t.id = $1 AND t.is_active = true AND u.is_active = true`, [teacherId]);
    if (teacherExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Teacher not found or inactive', 404);
    }
    const subjectExists = await (0, connection_1.query)('SELECT id, name, code FROM subjects WHERE id = $1 AND is_active = true', [subjectId]);
    if (subjectExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Subject not found or inactive', 404);
    }
    const existingAssignment = await (0, connection_1.query)('SELECT id FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2', [teacherId, subjectId]);
    if (existingAssignment.rows.length > 0) {
        throw new errorHandler_1.AppError('Teacher is already assigned to this subject', 409);
    }
    const result = await (0, connection_1.query)(`INSERT INTO teacher_subjects (teacher_id, subject_id)
     VALUES ($1, $2)
     RETURNING id, teacher_id, subject_id, created_at`, [teacherId, subjectId]);
    const assignment = result.rows[0];
    const teacher = teacherExists.rows[0];
    const subject = subjectExists.rows[0];
    res.status(201).json({
        success: true,
        message: 'Teacher assigned to subject successfully',
        data: {
            id: assignment.id,
            teacherId: assignment.teacher_id,
            subjectId: assignment.subject_id,
            createdAt: assignment.created_at,
            teacher: {
                name: `${teacher.first_name} ${teacher.last_name}`,
            },
            subject: {
                name: subject.name,
                code: subject.code,
            },
        },
    });
});
exports.removeTeacherFromSubject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { teacherId, subjectId } = req.params;
    const existingAssignment = await (0, connection_1.query)('SELECT id FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2', [teacherId, subjectId]);
    if (existingAssignment.rows.length === 0) {
        throw new errorHandler_1.AppError('Teacher assignment to subject not found', 404);
    }
    const activeTeaching = await (0, connection_1.query)(`SELECT COUNT(*) as count FROM class_subjects cs
     JOIN classes c ON cs.class_id = c.id
     WHERE cs.teacher_id = (SELECT user_id FROM teachers WHERE id = $1)
     AND cs.subject_id = $2 AND c.is_active = true`, [teacherId, subjectId]);
    if (parseInt(activeTeaching.rows[0].count) > 0) {
        throw new errorHandler_1.AppError('Cannot remove subject assignment. Teacher is currently teaching this subject in active classes.', 409);
    }
    await (0, connection_1.query)('DELETE FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2', [teacherId, subjectId]);
    res.json({
        success: true,
        message: 'Teacher removed from subject successfully',
    });
});
exports.assignTeacherToClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { teacherId, classId } = req.body;
    const teacherExists = await (0, connection_1.query)(`SELECT t.id, t.user_id, u.first_name, u.last_name 
     FROM teachers t 
     JOIN users u ON t.user_id = u.id 
     WHERE t.id = $1 AND t.is_active = true AND u.is_active = true`, [teacherId]);
    if (teacherExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Teacher not found or inactive', 404);
    }
    const classExists = await (0, connection_1.query)('SELECT id, name, grade, section, teacher_id FROM classes WHERE id = $1 AND is_active = true', [classId]);
    if (classExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Class not found or inactive', 404);
    }
    const currentClass = classExists.rows[0];
    const teacher = teacherExists.rows[0];
    const existingClassAssignment = await (0, connection_1.query)('SELECT id, name, grade, section FROM classes WHERE teacher_id = $1 AND is_active = true AND id != $2', [teacher.user_id, classId]);
    if (existingClassAssignment.rows.length > 0) {
        const existingClass = existingClassAssignment.rows[0];
        throw new errorHandler_1.AppError(`Teacher is already assigned as main teacher to class ${existingClass.grade}-${existingClass.section}. A teacher can only be main teacher for one class.`, 409);
    }
    const result = await (0, connection_1.query)(`UPDATE classes SET teacher_id = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, name, grade, section, teacher_id, updated_at`, [teacher.user_id, classId]);
    const updatedClass = result.rows[0];
    res.json({
        success: true,
        message: 'Teacher assigned to class successfully',
        data: {
            classId: updatedClass.id,
            className: updatedClass.name,
            grade: updatedClass.grade,
            section: updatedClass.section,
            teacherId: teacherId,
            teacherName: `${teacher.first_name} ${teacher.last_name}`,
            updatedAt: updatedClass.updated_at,
        },
    });
});
exports.removeTeacherFromClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { classId } = req.params;
    const classExists = await (0, connection_1.query)('SELECT id, name, grade, section, teacher_id FROM classes WHERE id = $1 AND is_active = true', [classId]);
    if (classExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Class not found or inactive', 404);
    }
    const currentClass = classExists.rows[0];
    if (!currentClass.teacher_id) {
        throw new errorHandler_1.AppError('No teacher is currently assigned to this class', 400);
    }
    await (0, connection_1.query)(`UPDATE classes SET teacher_id = NULL, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`, [classId]);
    res.json({
        success: true,
        message: 'Teacher removed from class successfully',
    });
});
exports.assignTeacherToClassSubject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { teacherId, classId, subjectId } = req.body;
    const teacherExists = await (0, connection_1.query)(`SELECT t.id, t.user_id, u.first_name, u.last_name 
     FROM teachers t 
     JOIN users u ON t.user_id = u.id 
     WHERE t.id = $1 AND t.is_active = true AND u.is_active = true`, [teacherId]);
    if (teacherExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Teacher not found or inactive', 404);
    }
    const classExists = await (0, connection_1.query)('SELECT id, name, grade, section FROM classes WHERE id = $1 AND is_active = true', [classId]);
    if (classExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Class not found or inactive', 404);
    }
    const subjectExists = await (0, connection_1.query)('SELECT id, name, code FROM subjects WHERE id = $1 AND is_active = true', [subjectId]);
    if (subjectExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Subject not found or inactive', 404);
    }
    const teacherSubjectQualification = await (0, connection_1.query)('SELECT id FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2', [teacherId, subjectId]);
    if (teacherSubjectQualification.rows.length === 0) {
        throw new errorHandler_1.AppError('Teacher is not qualified for this subject. Please assign the subject to teacher first.', 400);
    }
    const currentWorkload = await (0, connection_1.query)(`SELECT COUNT(*) as current_assignments
     FROM class_subjects cs
     JOIN classes c ON cs.class_id = c.id
     WHERE cs.teacher_id = $1 AND c.is_active = true`, [teacherExists.rows[0].user_id]);
    const maxAssignmentsPerTeacher = 8;
    if (parseInt(currentWorkload.rows[0].current_assignments) >= maxAssignmentsPerTeacher) {
        throw new errorHandler_1.AppError(`Teacher has reached maximum workload limit of ${maxAssignmentsPerTeacher} class-subject assignments`, 409);
    }
    const conflictCheck = await (0, connection_1.query)(`SELECT c.grade, c.section, s.name as subject_name
     FROM class_subjects cs
     JOIN classes c ON cs.class_id = c.id
     JOIN subjects s ON cs.subject_id = s.id
     WHERE cs.teacher_id = $1 AND c.grade = $2 AND c.is_active = true`, [teacherExists.rows[0].user_id, classExists.rows[0].grade]);
    if (conflictCheck.rows.length >= 3) {
        throw new errorHandler_1.AppError(`Teacher is already assigned to ${conflictCheck.rows.length} sections in grade ${classExists.rows[0].grade}. Maximum 3 sections per grade allowed.`, 409);
    }
    const classSubjectExists = await (0, connection_1.query)('SELECT id, teacher_id FROM class_subjects WHERE class_id = $1 AND subject_id = $2', [classId, subjectId]);
    const teacher = teacherExists.rows[0];
    const classInfo = classExists.rows[0];
    const subject = subjectExists.rows[0];
    if (classSubjectExists.rows.length > 0) {
        const currentAssignment = classSubjectExists.rows[0];
        if (currentAssignment.teacher_id === teacher.user_id) {
            throw new errorHandler_1.AppError('Teacher is already assigned to teach this subject in this class', 409);
        }
        const result = await (0, connection_1.query)(`UPDATE class_subjects SET teacher_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE class_id = $2 AND subject_id = $3
       RETURNING id, class_id, subject_id, teacher_id, updated_at`, [teacher.user_id, classId, subjectId]);
        const assignment = result.rows[0];
        res.json({
            success: true,
            message: 'Teacher assignment updated for class subject successfully',
            data: {
                id: assignment.id,
                classId: assignment.class_id,
                subjectId: assignment.subject_id,
                teacherId: teacherId,
                updatedAt: assignment.updated_at,
                class: {
                    name: classInfo.name,
                    grade: classInfo.grade,
                    section: classInfo.section,
                },
                subject: {
                    name: subject.name,
                    code: subject.code,
                },
                teacher: {
                    name: `${teacher.first_name} ${teacher.last_name}`,
                },
            },
        });
    }
    else {
        const result = await (0, connection_1.query)(`INSERT INTO class_subjects (class_id, subject_id, teacher_id)
       VALUES ($1, $2, $3)
       RETURNING id, class_id, subject_id, teacher_id, created_at`, [classId, subjectId, teacher.user_id]);
        const assignment = result.rows[0];
        res.status(201).json({
            success: true,
            message: 'Teacher assigned to class subject successfully',
            data: {
                id: assignment.id,
                classId: assignment.class_id,
                subjectId: assignment.subject_id,
                teacherId: teacherId,
                createdAt: assignment.created_at,
                class: {
                    name: classInfo.name,
                    grade: classInfo.grade,
                    section: classInfo.section,
                },
                subject: {
                    name: subject.name,
                    code: subject.code,
                },
                teacher: {
                    name: `${teacher.first_name} ${teacher.last_name}`,
                },
            },
        });
    }
});
exports.removeTeacherFromClassSubject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { classId, subjectId } = req.params;
    const existingAssignment = await (0, connection_1.query)('SELECT id FROM class_subjects WHERE class_id = $1 AND subject_id = $2', [classId, subjectId]);
    if (existingAssignment.rows.length === 0) {
        throw new errorHandler_1.AppError('Class subject assignment not found', 404);
    }
    await (0, connection_1.query)(`UPDATE class_subjects SET teacher_id = NULL, updated_at = CURRENT_TIMESTAMP
     WHERE class_id = $1 AND subject_id = $2`, [classId, subjectId]);
    res.json({
        success: true,
        message: 'Teacher removed from class subject successfully',
    });
});
exports.getTeacherWorkload = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const teacherExists = await (0, connection_1.query)(`SELECT t.id, t.user_id, u.first_name, u.last_name, t.employee_id
     FROM teachers t 
     JOIN users u ON t.user_id = u.id 
     WHERE t.id = $1 AND t.is_active = true AND u.is_active = true`, [id]);
    if (teacherExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Teacher not found or inactive', 404);
    }
    const teacher = teacherExists.rows[0];
    const mainClassResult = await (0, connection_1.query)(`SELECT c.id, c.name, c.grade, c.section, c.capacity, c.current_enrollment,
            ay.name as academic_year_name
     FROM classes c
     JOIN academic_years ay ON c.academic_year_id = ay.id
     WHERE c.teacher_id = $1 AND c.is_active = true`, [teacher.user_id]);
    const specializationsResult = await (0, connection_1.query)(`SELECT s.id, s.name, s.code, s.credit_hours
     FROM teacher_subjects ts
     JOIN subjects s ON ts.subject_id = s.id
     WHERE ts.teacher_id = $1 AND s.is_active = true
     ORDER BY s.name`, [teacher.id]);
    const teachingAssignmentsResult = await (0, connection_1.query)(`SELECT cs.id, c.id as class_id, c.name as class_name, c.grade, c.section,
            s.id as subject_id, s.name as subject_name, s.code as subject_code, s.credit_hours,
            c.current_enrollment as student_count,
            ay.name as academic_year_name,
            cs.created_at as assignment_date
     FROM class_subjects cs
     JOIN classes c ON cs.class_id = c.id
     JOIN subjects s ON cs.subject_id = s.id
     JOIN academic_years ay ON c.academic_year_id = ay.id
     WHERE cs.teacher_id = $1 AND c.is_active = true AND s.is_active = true
     ORDER BY c.grade, c.section, s.name`, [teacher.user_id]);
    const totalClasses = new Set();
    const totalSubjects = new Set();
    const gradeDistribution = {};
    let totalStudents = 0;
    let totalCreditHours = 0;
    let weeklyHours = 0;
    if (mainClassResult.rows.length > 0) {
        const mainClass = mainClassResult.rows[0];
        totalClasses.add(mainClass.id);
        totalStudents += mainClass.current_enrollment || 0;
        gradeDistribution[mainClass.grade] = (gradeDistribution[mainClass.grade] || 0) + 1;
        weeklyHours += 5;
    }
    teachingAssignmentsResult.rows.forEach((assignment) => {
        totalClasses.add(assignment.class_id);
        totalSubjects.add(assignment.subject_id);
        totalCreditHours += assignment.credit_hours || 0;
        gradeDistribution[assignment.grade] = (gradeDistribution[assignment.grade] || 0) + 1;
        weeklyHours += (assignment.credit_hours || 3);
    });
    const uniqueStudentsResult = await (0, connection_1.query)(`SELECT COUNT(DISTINCT s.id) as unique_students
     FROM students s
     JOIN classes c ON s.class_id = c.id
     WHERE (c.teacher_id = $1 OR EXISTS (
       SELECT 1 FROM class_subjects cs 
       WHERE cs.class_id = c.id AND cs.teacher_id = $1
     )) AND c.is_active = true AND s.is_active = true`, [teacher.user_id]);
    const uniqueStudents = parseInt(uniqueStudentsResult.rows[0].unique_students) || 0;
    const maxRecommendedHours = 25;
    const workloadIntensity = Math.min((weeklyHours / maxRecommendedHours) * 100, 100);
    let workloadStatus = 'normal';
    if (weeklyHours > 30) {
        workloadStatus = 'overloaded';
    }
    else if (weeklyHours > 25) {
        workloadStatus = 'high';
    }
    else if (weeklyHours < 15) {
        workloadStatus = 'light';
    }
    const conflictAnalysis = await (0, connection_1.query)(`SELECT c.grade, COUNT(*) as sections_count
     FROM class_subjects cs
     JOIN classes c ON cs.class_id = c.id
     WHERE cs.teacher_id = $1 AND c.is_active = true
     GROUP BY c.grade
     HAVING COUNT(*) > 2`, [teacher.user_id]);
    const potentialConflicts = conflictAnalysis.rows.map((conflict) => ({
        grade: conflict.grade,
        sectionsCount: parseInt(conflict.sections_count),
        issue: `Teaching ${conflict.sections_count} sections in grade ${conflict.grade} may cause scheduling conflicts`
    }));
    res.json({
        success: true,
        data: {
            teacher: {
                id: teacher.id,
                name: `${teacher.first_name} ${teacher.last_name}`,
                employeeId: teacher.employee_id,
            },
            workloadSummary: {
                totalClasses: totalClasses.size,
                totalSubjects: totalSubjects.size,
                totalStudents: uniqueStudents,
                totalCreditHours: totalCreditHours,
                weeklyHours: weeklyHours,
                workloadIntensity: Math.round(workloadIntensity),
                workloadStatus: workloadStatus,
                isMainClassTeacher: mainClassResult.rows.length > 0,
                gradeDistribution: gradeDistribution,
            },
            scheduleAnalysis: {
                potentialConflicts: potentialConflicts,
                recommendedMaxHours: maxRecommendedHours,
                currentUtilization: `${Math.round((weeklyHours / maxRecommendedHours) * 100)}%`,
                canTakeMoreAssignments: weeklyHours < maxRecommendedHours,
                availableHours: Math.max(0, maxRecommendedHours - weeklyHours),
            },
            mainClass: mainClassResult.rows.length > 0 ? {
                id: mainClassResult.rows[0].id,
                name: mainClassResult.rows[0].name,
                grade: mainClassResult.rows[0].grade,
                section: mainClassResult.rows[0].section,
                capacity: mainClassResult.rows[0].capacity,
                currentEnrollment: mainClassResult.rows[0].current_enrollment,
                academicYear: mainClassResult.rows[0].academic_year_name,
            } : null,
            specializations: specializationsResult.rows.map((spec) => ({
                id: spec.id,
                name: spec.name,
                code: spec.code,
                creditHours: spec.credit_hours,
            })),
            teachingAssignments: teachingAssignmentsResult.rows.map((assignment) => ({
                id: assignment.id,
                assignmentDate: assignment.assignment_date,
                class: {
                    id: assignment.class_id,
                    name: assignment.class_name,
                    grade: assignment.grade,
                    section: assignment.section,
                    studentCount: assignment.student_count,
                    academicYear: assignment.academic_year_name,
                },
                subject: {
                    id: assignment.subject_id,
                    name: assignment.subject_name,
                    code: assignment.subject_code,
                    creditHours: assignment.credit_hours,
                },
            })),
        },
    });
});
exports.checkAssignmentConflicts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { teacherId, classId, subjectId } = req.body;
    const teacherExists = await (0, connection_1.query)(`SELECT t.id, t.user_id, u.first_name, u.last_name 
     FROM teachers t 
     JOIN users u ON t.user_id = u.id 
     WHERE t.id = $1 AND t.is_active = true AND u.is_active = true`, [teacherId]);
    if (teacherExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Teacher not found or inactive', 404);
    }
    const classExists = await (0, connection_1.query)('SELECT id, name, grade, section FROM classes WHERE id = $1 AND is_active = true', [classId]);
    if (classExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Class not found or inactive', 404);
    }
    const subjectExists = await (0, connection_1.query)('SELECT id, name, code FROM subjects WHERE id = $1 AND is_active = true', [subjectId]);
    if (subjectExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Subject not found or inactive', 404);
    }
    const teacher = teacherExists.rows[0];
    const classInfo = classExists.rows[0];
    const subject = subjectExists.rows[0];
    const conflicts = [];
    const warnings = [];
    const qualification = await (0, connection_1.query)('SELECT id FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2', [teacherId, subjectId]);
    if (qualification.rows.length === 0) {
        conflicts.push({
            type: 'qualification',
            message: 'Teacher is not qualified for this subject',
            severity: 'error'
        });
    }
    const currentWorkload = await (0, connection_1.query)(`SELECT COUNT(*) as current_assignments,
            SUM(s.credit_hours) as total_hours
     FROM class_subjects cs
     JOIN classes c ON cs.class_id = c.id
     JOIN subjects s ON cs.subject_id = s.id
     WHERE cs.teacher_id = $1 AND c.is_active = true`, [teacher.user_id]);
    const currentAssignments = parseInt(currentWorkload.rows[0].current_assignments);
    const currentHours = parseInt(currentWorkload.rows[0].total_hours) || 0;
    const newSubjectHours = parseInt(subjectExists.rows[0].credit_hours) || 3;
    if (currentAssignments >= 8) {
        conflicts.push({
            type: 'workload',
            message: `Teacher has reached maximum assignment limit (${currentAssignments}/8)`,
            severity: 'error'
        });
    }
    else if (currentAssignments >= 6) {
        warnings.push({
            type: 'workload',
            message: `Teacher has high workload (${currentAssignments}/8 assignments)`,
            severity: 'warning'
        });
    }
    if (currentHours + newSubjectHours > 25) {
        conflicts.push({
            type: 'hours',
            message: `Assignment would exceed recommended weekly hours (${currentHours + newSubjectHours}/25)`,
            severity: 'error'
        });
    }
    else if (currentHours + newSubjectHours > 20) {
        warnings.push({
            type: 'hours',
            message: `Assignment would result in high weekly hours (${currentHours + newSubjectHours}/25)`,
            severity: 'warning'
        });
    }
    const gradeConflicts = await (0, connection_1.query)(`SELECT COUNT(*) as same_grade_count
     FROM class_subjects cs
     JOIN classes c ON cs.class_id = c.id
     WHERE cs.teacher_id = $1 AND c.grade = $2 AND c.is_active = true`, [teacher.user_id, classInfo.grade]);
    const sameGradeCount = parseInt(gradeConflicts.rows[0].same_grade_count);
    if (sameGradeCount >= 3) {
        conflicts.push({
            type: 'schedule',
            message: `Teacher already teaches ${sameGradeCount} sections in grade ${classInfo.grade} (max 3 recommended)`,
            severity: 'error'
        });
    }
    else if (sameGradeCount >= 2) {
        warnings.push({
            type: 'schedule',
            message: `Teacher already teaches ${sameGradeCount} sections in grade ${classInfo.grade}`,
            severity: 'warning'
        });
    }
    const existingAssignment = await (0, connection_1.query)('SELECT id FROM class_subjects WHERE class_id = $1 AND subject_id = $2', [classId, subjectId]);
    if (existingAssignment.rows.length > 0) {
        warnings.push({
            type: 'existing',
            message: 'This class-subject combination already has a teacher assigned',
            severity: 'info'
        });
    }
    const canAssign = conflicts.length === 0;
    res.json({
        success: true,
        data: {
            canAssign,
            conflicts,
            warnings,
            assignment: {
                teacher: {
                    id: teacher.id,
                    name: `${teacher.first_name} ${teacher.last_name}`,
                },
                class: {
                    id: classInfo.id,
                    name: classInfo.name,
                    grade: classInfo.grade,
                    section: classInfo.section,
                },
                subject: {
                    id: subject.id,
                    name: subject.name,
                    code: subject.code,
                },
            },
            workloadImpact: {
                currentAssignments,
                newTotalAssignments: currentAssignments + 1,
                currentHours,
                newTotalHours: currentHours + newSubjectHours,
                utilizationPercentage: Math.round(((currentHours + newSubjectHours) / 25) * 100),
            },
        },
    });
});
exports.getAllTeacherAssignments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'first_name');
    const { academicYearId, subjectId, classId } = req.query;
    let whereClause = "WHERE t.is_active = true AND u.is_active = true";
    const queryParams = [];
    if (academicYearId) {
        whereClause += ` AND (c.academic_year_id = $${queryParams.length + 1} OR cs_c.academic_year_id = $${queryParams.length + 1})`;
        queryParams.push(academicYearId);
    }
    if (subjectId) {
        whereClause += ` AND (ts.subject_id = $${queryParams.length + 1} OR cs.subject_id = $${queryParams.length + 1})`;
        queryParams.push(subjectId);
    }
    if (classId) {
        whereClause += ` AND (c.id = $${queryParams.length + 1} OR cs.class_id = $${queryParams.length + 1})`;
        queryParams.push(classId);
    }
    const countResult = await (0, connection_1.query)(`SELECT COUNT(DISTINCT t.id) FROM teachers t
     JOIN users u ON t.user_id = u.id
     LEFT JOIN classes c ON c.teacher_id = u.id AND c.is_active = true
     LEFT JOIN teacher_subjects ts ON ts.teacher_id = t.id
     LEFT JOIN class_subjects cs ON cs.teacher_id = u.id
     LEFT JOIN classes cs_c ON cs.class_id = cs_c.id AND cs_c.is_active = true
     ${whereClause}`, queryParams);
    const total = parseInt(countResult.rows[0].count);
    const result = await (0, connection_1.query)(`SELECT DISTINCT t.id, t.employee_id, u.first_name, u.last_name,
            COUNT(DISTINCT c.id) as main_classes,
            COUNT(DISTINCT ts.subject_id) as specializations,
            COUNT(DISTINCT cs.id) as teaching_assignments
     FROM teachers t
     JOIN users u ON t.user_id = u.id
     LEFT JOIN classes c ON c.teacher_id = u.id AND c.is_active = true
     LEFT JOIN teacher_subjects ts ON ts.teacher_id = t.id
     LEFT JOIN class_subjects cs ON cs.teacher_id = u.id
     LEFT JOIN classes cs_c ON cs.class_id = cs_c.id AND cs_c.is_active = true
     ${whereClause}
     GROUP BY t.id, t.employee_id, u.first_name, u.last_name
     ORDER BY u.${sortBy} ${sortOrder}
     LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`, [...queryParams, limit, offset]);
    const teachers = result.rows.map((teacher) => ({
        id: teacher.id,
        employeeId: teacher.employee_id,
        name: `${teacher.first_name} ${teacher.last_name}`,
        workloadSummary: {
            mainClasses: parseInt(teacher.main_classes),
            specializations: parseInt(teacher.specializations),
            teachingAssignments: parseInt(teacher.teaching_assignments),
        },
    }));
    res.json({
        success: true,
        data: teachers,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
});
exports.getOptimalTeacherSuggestions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { classId, subjectId } = req.params;
    const classExists = await (0, connection_1.query)('SELECT id, name, grade, section FROM classes WHERE id = $1 AND is_active = true', [classId]);
    if (classExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Class not found or inactive', 404);
    }
    const subjectExists = await (0, connection_1.query)('SELECT id, name, code, credit_hours FROM subjects WHERE id = $1 AND is_active = true', [subjectId]);
    if (subjectExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Subject not found or inactive', 404);
    }
    const classInfo = classExists.rows[0];
    const subject = subjectExists.rows[0];
    const qualifiedTeachers = await (0, connection_1.query)(`SELECT t.id, t.user_id, t.employee_id, u.first_name, u.last_name,
            COUNT(cs.id) as current_assignments,
            COALESCE(SUM(s.credit_hours), 0) as current_hours,
            COUNT(CASE WHEN c.grade = $3 THEN 1 END) as same_grade_assignments,
            (CASE WHEN EXISTS(SELECT 1 FROM classes WHERE teacher_id = t.user_id AND is_active = true) 
             THEN 1 ELSE 0 END) as is_main_teacher
     FROM teachers t
     JOIN users u ON t.user_id = u.id
     JOIN teacher_subjects ts ON ts.teacher_id = t.id
     LEFT JOIN class_subjects cs ON cs.teacher_id = t.user_id
     LEFT JOIN classes c ON cs.class_id = c.id AND c.is_active = true
     LEFT JOIN subjects s ON cs.subject_id = s.id
     WHERE ts.subject_id = $1 AND t.is_active = true AND u.is_active = true
     GROUP BY t.id, t.user_id, t.employee_id, u.first_name, u.last_name
     ORDER BY current_assignments ASC, current_hours ASC`, [subjectId, classId, classInfo.grade]);
    const suggestions = qualifiedTeachers.rows.map((teacher) => {
        const currentAssignments = parseInt(teacher.current_assignments);
        const currentHours = parseInt(teacher.current_hours);
        const sameGradeAssignments = parseInt(teacher.same_grade_assignments);
        const newTotalHours = currentHours + (parseInt(subject.credit_hours) || 3);
        let score = 100;
        if (currentAssignments >= 6)
            score -= 30;
        else if (currentAssignments >= 4)
            score -= 15;
        if (newTotalHours > 25)
            score -= 40;
        else if (newTotalHours > 20)
            score -= 20;
        if (sameGradeAssignments >= 2)
            score -= 25;
        else if (sameGradeAssignments >= 1)
            score -= 10;
        if (currentAssignments === 0)
            score += 10;
        let recommendation = 'excellent';
        if (score < 50)
            recommendation = 'not_recommended';
        else if (score < 70)
            recommendation = 'caution';
        else if (score < 85)
            recommendation = 'good';
        const conflicts = [];
        if (currentAssignments >= 8)
            conflicts.push('Maximum assignments reached');
        if (newTotalHours > 25)
            conflicts.push('Would exceed recommended hours');
        if (sameGradeAssignments >= 3)
            conflicts.push('Too many sections in same grade');
        return {
            teacher: {
                id: teacher.id,
                employeeId: teacher.employee_id,
                name: `${teacher.first_name} ${teacher.last_name}`,
                isMainTeacher: teacher.is_main_teacher === 1,
            },
            suitabilityScore: Math.max(0, score),
            recommendation,
            currentWorkload: {
                assignments: currentAssignments,
                hours: currentHours,
                sameGradeAssignments: sameGradeAssignments,
            },
            projectedWorkload: {
                assignments: currentAssignments + 1,
                hours: newTotalHours,
                utilizationPercentage: Math.round((newTotalHours / 25) * 100),
            },
            conflicts,
            canAssign: conflicts.length === 0,
        };
    });
    suggestions.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    res.json({
        success: true,
        data: {
            assignment: {
                class: {
                    id: classInfo.id,
                    name: classInfo.name,
                    grade: classInfo.grade,
                    section: classInfo.section,
                },
                subject: {
                    id: subject.id,
                    name: subject.name,
                    code: subject.code,
                    creditHours: subject.credit_hours,
                },
            },
            suggestions,
            summary: {
                totalQualifiedTeachers: suggestions.length,
                excellentCandidates: suggestions.filter((s) => s.recommendation === 'excellent').length,
                goodCandidates: suggestions.filter((s) => s.recommendation === 'good').length,
                cautionCandidates: suggestions.filter((s) => s.recommendation === 'caution').length,
                notRecommended: suggestions.filter((s) => s.recommendation === 'not_recommended').length,
            },
        },
    });
});
//# sourceMappingURL=teacherController.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubjectStatistics = exports.toggleSubjectStatus = exports.deleteSubject = exports.updateSubject = exports.getSubjectById = exports.getSubjects = exports.createSubject = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const pagination_1 = require("../utils/pagination");
exports.createSubject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const subjectData = req.body;
    const existingSubject = await (0, connection_1.query)('SELECT id FROM subjects WHERE code = $1', [subjectData.code]);
    if (existingSubject.rows.length > 0) {
        throw new errorHandler_1.AppError('Subject with this code already exists', 409);
    }
    const seqIdResult = await (0, connection_1.query)('SELECT generate_sequential_id($1) as next_id', ['subjects']);
    const sequentialId = seqIdResult.rows[0].next_id;
    const result = await (0, connection_1.query)(`INSERT INTO subjects (name, code, description, credit_hours, alt_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, alt_id, name, code, description, credit_hours, is_active, created_at, updated_at`, [
        subjectData.name,
        subjectData.code,
        subjectData.description || null,
        subjectData.creditHours || 1,
        sequentialId.toString()
    ]);
    const subject = result.rows[0];
    res.status(201).json({
        success: true,
        message: 'Subject created successfully',
        data: {
            id: subject.id,
            altId: subject.alt_id,
            name: subject.name,
            code: subject.code,
            description: subject.description,
            creditHours: subject.credit_hours,
            isActive: subject.is_active,
            createdAt: subject.created_at,
            updatedAt: subject.updated_at,
        },
    });
});
exports.getSubjects = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'name');
    const { isActive, search } = req.query;
    let whereClause = '';
    const queryParams = [];
    if (isActive !== undefined) {
        whereClause = 'WHERE is_active = $1';
        queryParams.push(isActive === 'true');
    }
    if (search) {
        whereClause += whereClause ? ' AND ' : 'WHERE ';
        whereClause += `(name ILIKE $${queryParams.length + 1} OR code ILIKE $${queryParams.length + 1} OR description ILIKE $${queryParams.length + 1})`;
        queryParams.push(`%${search}%`);
    }
    const countResult = await (0, connection_1.query)(`SELECT COUNT(*) FROM subjects ${whereClause}`, queryParams);
    const total = parseInt(countResult.rows[0].count);
    const result = await (0, connection_1.query)(`SELECT id, alt_id, name, code, description, credit_hours, is_active, created_at, updated_at
     FROM subjects 
     ${whereClause}
     ORDER BY ${sortBy} ${sortOrder}
     LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`, [...queryParams, limit, offset]);
    const subjects = result.rows.map((subject) => ({
        id: subject.id,
        altId: subject.alt_id,
        name: subject.name,
        code: subject.code,
        description: subject.description,
        creditHours: subject.credit_hours,
        isActive: subject.is_active,
        createdAt: subject.created_at,
        updatedAt: subject.updated_at,
    }));
    res.json({
        success: true,
        data: subjects,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
});
exports.getSubjectById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(id);
    let result;
    if (isUUID) {
        result = await (0, connection_1.query)(`SELECT id, alt_id, name, code, description, credit_hours, is_active, created_at, updated_at
       FROM subjects WHERE id = $1`, [id]);
    }
    else {
        result = await (0, connection_1.query)(`SELECT id, alt_id, name, code, description, credit_hours, is_active, created_at, updated_at
       FROM subjects WHERE alt_id = $1 OR id::text = $1 OR code = $1`, [id]);
    }
    if (result.rows.length === 0) {
        throw new errorHandler_1.AppError('Subject not found', 404);
    }
    const subject = result.rows[0];
    const classesResult = await (0, connection_1.query)(`SELECT c.id, c.name, c.grade, c.section, 
            u.first_name, u.last_name
     FROM class_subjects cs
     JOIN classes c ON cs.class_id = c.id
     JOIN users u ON cs.teacher_id = u.id
     WHERE cs.subject_id = $1 AND c.is_active = true
     ORDER BY c.grade, c.section`, [subject.id]);
    const classes = classesResult.rows.map((cls) => ({
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        section: cls.section,
        teacher: {
            firstName: cls.first_name,
            lastName: cls.last_name,
        },
    }));
    const teachersResult = await (0, connection_1.query)(`SELECT t.id, t.employee_id, u.first_name, u.last_name, u.email
     FROM teacher_subjects ts
     JOIN teachers t ON ts.teacher_id = t.id
     JOIN users u ON t.user_id = u.id
     WHERE ts.subject_id = $1 AND t.is_active = true AND u.is_active = true
     ORDER BY u.first_name, u.last_name`, [subject.id]);
    const teachers = teachersResult.rows.map((teacher) => ({
        id: teacher.id,
        employeeId: teacher.employee_id,
        firstName: teacher.first_name,
        lastName: teacher.last_name,
        email: teacher.email,
    }));
    res.json({
        success: true,
        data: {
            id: subject.id,
            altId: subject.alt_id,
            name: subject.name,
            code: subject.code,
            description: subject.description,
            creditHours: subject.credit_hours,
            isActive: subject.is_active,
            createdAt: subject.created_at,
            updatedAt: subject.updated_at,
            classes,
            teachers,
        },
    });
});
exports.updateSubject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(id);
    let existingSubject;
    if (isUUID) {
        existingSubject = await (0, connection_1.query)('SELECT id FROM subjects WHERE id = $1', [id]);
    }
    else {
        existingSubject = await (0, connection_1.query)('SELECT id FROM subjects WHERE alt_id = $1 OR id::text = $1 OR code = $1', [id]);
    }
    if (existingSubject.rows.length === 0) {
        throw new errorHandler_1.AppError('Subject not found', 404);
    }
    const actualSubjectId = existingSubject.rows[0].id;
    if (updateData.code) {
        const codeConflict = await (0, connection_1.query)('SELECT id FROM subjects WHERE code = $1 AND id != $2', [updateData.code, actualSubjectId]);
        if (codeConflict.rows.length > 0) {
            throw new errorHandler_1.AppError('Subject with this code already exists', 409);
        }
    }
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    if (updateData.name) {
        updateFields.push(`name = $${paramCount++}`);
        values.push(updateData.name);
    }
    if (updateData.code) {
        updateFields.push(`code = $${paramCount++}`);
        values.push(updateData.code);
    }
    if (updateData.description !== undefined) {
        updateFields.push(`description = $${paramCount++}`);
        values.push(updateData.description);
    }
    if (updateData.creditHours) {
        updateFields.push(`credit_hours = $${paramCount++}`);
        values.push(updateData.creditHours);
    }
    if (updateFields.length === 0) {
        throw new errorHandler_1.AppError('No fields to update', 400);
    }
    values.push(actualSubjectId);
    const result = await (0, connection_1.query)(`UPDATE subjects SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING id, alt_id, name, code, description, credit_hours, is_active, created_at, updated_at`, values);
    const subject = result.rows[0];
    res.json({
        success: true,
        message: 'Subject updated successfully',
        data: {
            id: subject.id,
            altId: subject.alt_id,
            name: subject.name,
            code: subject.code,
            description: subject.description,
            creditHours: subject.credit_hours,
            isActive: subject.is_active,
            createdAt: subject.created_at,
            updatedAt: subject.updated_at,
        },
    });
});
exports.deleteSubject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(id);
    let subject;
    if (isUUID) {
        subject = await (0, connection_1.query)('SELECT id, name FROM subjects WHERE id = $1', [id]);
    }
    else {
        subject = await (0, connection_1.query)('SELECT id, name FROM subjects WHERE alt_id = $1 OR id::text = $1 OR code = $1', [id]);
    }
    if (subject.rows.length === 0) {
        throw new errorHandler_1.AppError('Subject not found', 404);
    }
    const actualSubjectId = subject.rows[0].id;
    const dependenciesCheck = await (0, connection_1.query)(`SELECT 
       (SELECT COUNT(*) FROM class_subjects WHERE subject_id = $1) as class_subjects_count,
       (SELECT COUNT(*) FROM teacher_subjects WHERE subject_id = $1) as teacher_subjects_count,
       (SELECT COUNT(*) FROM grades WHERE subject_id = $1) as grades_count`, [actualSubjectId]);
    const dependencies = dependenciesCheck.rows[0];
    const totalDependencies = parseInt(dependencies.class_subjects_count) +
        parseInt(dependencies.teacher_subjects_count) +
        parseInt(dependencies.grades_count);
    if (totalDependencies > 0) {
        await (0, connection_1.query)('UPDATE subjects SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [actualSubjectId]);
        res.json({
            success: true,
            message: 'Subject deactivated successfully (has associated data)',
        });
    }
    else {
        await (0, connection_1.query)('DELETE FROM subjects WHERE id = $1', [actualSubjectId]);
        res.json({
            success: true,
            message: 'Subject deleted successfully',
        });
    }
});
exports.toggleSubjectStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(id);
    let existingSubject;
    if (isUUID) {
        existingSubject = await (0, connection_1.query)('SELECT id FROM subjects WHERE id = $1', [id]);
    }
    else {
        existingSubject = await (0, connection_1.query)('SELECT id FROM subjects WHERE alt_id = $1 OR id::text = $1 OR code = $1', [id]);
    }
    if (existingSubject.rows.length === 0) {
        throw new errorHandler_1.AppError('Subject not found', 404);
    }
    const actualSubjectId = existingSubject.rows[0].id;
    const result = await (0, connection_1.query)(`UPDATE subjects SET is_active = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, alt_id, name, code, description, credit_hours, is_active, created_at, updated_at`, [isActive, actualSubjectId]);
    const subject = result.rows[0];
    res.json({
        success: true,
        message: `Subject ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
            id: subject.id,
            altId: subject.alt_id,
            name: subject.name,
            code: subject.code,
            description: subject.description,
            creditHours: subject.credit_hours,
            isActive: subject.is_active,
            createdAt: subject.created_at,
            updatedAt: subject.updated_at,
        },
    });
});
exports.getSubjectStatistics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(id);
    let subject;
    if (isUUID) {
        subject = await (0, connection_1.query)('SELECT id, name FROM subjects WHERE id = $1', [id]);
    }
    else {
        subject = await (0, connection_1.query)('SELECT id, name FROM subjects WHERE alt_id = $1 OR id::text = $1 OR code = $1', [id]);
    }
    if (subject.rows.length === 0) {
        throw new errorHandler_1.AppError('Subject not found', 404);
    }
    const actualSubjectId = subject.rows[0].id;
    const statsResult = await (0, connection_1.query)(`SELECT 
       (SELECT COUNT(*) FROM class_subjects WHERE subject_id = $1) as total_classes,
       (SELECT COUNT(DISTINCT cs.teacher_id) FROM class_subjects cs WHERE cs.subject_id = $1) as total_teachers,
       (SELECT COUNT(DISTINCT s.id) FROM class_subjects cs 
        JOIN classes c ON cs.class_id = c.id 
        JOIN students s ON s.class_id = c.id 
        WHERE cs.subject_id = $1 AND s.is_active = true) as total_students,
       (SELECT COUNT(*) FROM grades WHERE subject_id = $1) as total_grades,
       (SELECT ROUND(AVG(percentage), 2) FROM grades WHERE subject_id = $1) as average_percentage`, [actualSubjectId]);
    const stats = statsResult.rows[0];
    res.json({
        success: true,
        data: {
            subjectId: actualSubjectId,
            subjectName: subject.rows[0].name,
            totalClasses: parseInt(stats.total_classes),
            totalTeachers: parseInt(stats.total_teachers),
            totalStudents: parseInt(stats.total_students),
            totalGrades: parseInt(stats.total_grades),
            averagePercentage: parseFloat(stats.average_percentage) || 0,
        },
    });
});
//# sourceMappingURL=subjectController.js.map
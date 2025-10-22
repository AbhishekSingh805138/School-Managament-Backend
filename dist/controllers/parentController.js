"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParentDashboard = exports.removeParentStudentRelationship = exports.updateParentStudentRelationship = exports.linkParentToStudent = exports.updateParent = exports.getParentById = exports.getParents = exports.createParent = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../utils/auth");
const pagination_1 = require("../utils/pagination");
exports.createParent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const parentData = req.body;
    const existingUser = await (0, connection_1.query)('SELECT id FROM users WHERE email = $1', [parentData.email]);
    if (existingUser.rows.length > 0) {
        throw new errorHandler_1.AppError('User with this email already exists', 409);
    }
    const passwordHash = await (0, auth_1.hashPassword)(parentData.password);
    const seqIdResult = await (0, connection_1.query)('SELECT generate_sequential_id($1) as next_id', ['users']);
    const sequentialId = seqIdResult.rows[0].next_id;
    const result = await (0, connection_1.query)(`INSERT INTO users (first_name, last_name, email, password_hash, role, phone, address, alt_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, alt_id, first_name, last_name, email, role, phone, address, is_active, created_at, updated_at`, [
        parentData.firstName,
        parentData.lastName,
        parentData.email,
        passwordHash,
        'parent',
        parentData.phone || null,
        parentData.address || null,
        sequentialId.toString(),
    ]);
    const parent = result.rows[0];
    res.status(201).json({
        success: true,
        message: 'Parent account created successfully',
        data: {
            id: parent.id,
            firstName: parent.first_name,
            lastName: parent.last_name,
            email: parent.email,
            phone: parent.phone,
            address: parent.address,
            isActive: parent.is_active,
            createdAt: parent.created_at,
            updatedAt: parent.updated_at,
        },
    });
});
exports.getParents = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'firstName');
    const queryParams = req.query;
    let whereClause = "WHERE u.role = 'parent'";
    const values = [];
    if (queryParams.search) {
        whereClause += ` AND (u.first_name ILIKE $${values.length + 1} OR u.last_name ILIKE $${values.length + 1} OR u.email ILIKE $${values.length + 1} OR u.phone ILIKE $${values.length + 1})`;
        values.push(`%${queryParams.search}%`);
    }
    if (queryParams.hasChildren !== undefined) {
        if (queryParams.hasChildren) {
            whereClause += ` AND EXISTS (SELECT 1 FROM student_parents sp WHERE sp.parent_user_id = u.id)`;
        }
        else {
            whereClause += ` AND NOT EXISTS (SELECT 1 FROM student_parents sp WHERE sp.parent_user_id = u.id)`;
        }
    }
    if (queryParams.relationshipType) {
        whereClause += ` AND EXISTS (SELECT 1 FROM student_parents sp WHERE sp.parent_user_id = u.id AND sp.relationship_type = $${values.length + 1})`;
        values.push(queryParams.relationshipType);
    }
    const countResult = await (0, connection_1.query)(`SELECT COUNT(*) FROM users u ${whereClause}`, values);
    const total = parseInt(countResult.rows[0].count);
    const result = await (0, connection_1.query)(`SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.address, 
            u.is_active, u.created_at, u.updated_at,
            COUNT(sp.id) as children_count
     FROM users u
     LEFT JOIN student_parents sp ON u.id = sp.parent_user_id
     ${whereClause}
     GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.address, 
              u.is_active, u.created_at, u.updated_at
     ORDER BY u.${sortBy} ${sortOrder}
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, limit, offset]);
    const parents = result.rows.map((parent) => ({
        id: parent.id,
        firstName: parent.first_name,
        lastName: parent.last_name,
        email: parent.email,
        phone: parent.phone,
        address: parent.address,
        isActive: parent.is_active,
        createdAt: parent.created_at,
        updatedAt: parent.updated_at,
        childrenCount: parseInt(parent.children_count),
    }));
    res.json({
        success: true,
        data: parents,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
});
exports.getParentById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(id);
    let result;
    if (isUUID) {
        result = await (0, connection_1.query)(`SELECT id, first_name, last_name, email, phone, address, is_active, created_at, updated_at
       FROM users WHERE id = $1 AND role = 'parent'`, [id]);
    }
    else {
        result = await (0, connection_1.query)(`SELECT id, first_name, last_name, email, phone, address, is_active, created_at, updated_at
       FROM users WHERE (alt_id = $1 OR id::text = $1) AND role = 'parent'`, [id]);
    }
    if (result.rows.length === 0) {
        throw new errorHandler_1.AppError('Parent not found', 404);
    }
    const parent = result.rows[0];
    const childrenResult = await (0, connection_1.query)(`SELECT sp.id, sp.relationship_type, sp.is_primary,
            s.id as student_id, s.student_id as student_number, s.enrollment_date,
            u.first_name, u.last_name,
            c.name as class_name, c.grade, c.section
     FROM student_parents sp
     JOIN students s ON sp.student_id = s.id
     JOIN users u ON s.user_id = u.id
     JOIN classes c ON s.class_id = c.id
     WHERE sp.parent_user_id = $1 AND s.is_active = true
     ORDER BY sp.is_primary DESC, u.first_name`, [parent.id]);
    const children = childrenResult.rows.map((child) => ({
        relationshipId: child.id,
        studentId: child.student_id,
        studentNumber: child.student_number,
        studentName: `${child.first_name} ${child.last_name}`,
        className: `${child.class_name} (${child.grade}-${child.section})`,
        relationshipType: child.relationship_type,
        isPrimary: child.is_primary,
        enrollmentDate: child.enrollment_date,
    }));
    res.json({
        success: true,
        data: {
            id: parent.id,
            firstName: parent.first_name,
            lastName: parent.last_name,
            email: parent.email,
            phone: parent.phone,
            address: parent.address,
            isActive: parent.is_active,
            createdAt: parent.created_at,
            updatedAt: parent.updated_at,
            children,
        },
    });
});
exports.updateParent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(id);
    let existingParent;
    if (isUUID) {
        existingParent = await (0, connection_1.query)("SELECT id FROM users WHERE id = $1 AND role = 'parent'", [id]);
    }
    else {
        existingParent = await (0, connection_1.query)("SELECT id FROM users WHERE (alt_id = $1 OR id::text = $1) AND role = 'parent'", [id]);
    }
    if (existingParent.rows.length === 0) {
        throw new errorHandler_1.AppError('Parent not found', 404);
    }
    const actualParentId = existingParent.rows[0].id;
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    if (updateData.firstName) {
        updateFields.push(`first_name = $${paramCount++}`);
        values.push(updateData.firstName);
    }
    if (updateData.lastName) {
        updateFields.push(`last_name = $${paramCount++}`);
        values.push(updateData.lastName);
    }
    if (updateData.phone !== undefined) {
        updateFields.push(`phone = $${paramCount++}`);
        values.push(updateData.phone);
    }
    if (updateData.address !== undefined) {
        updateFields.push(`address = $${paramCount++}`);
        values.push(updateData.address);
    }
    if (updateFields.length === 0) {
        throw new errorHandler_1.AppError('No fields to update', 400);
    }
    values.push(actualParentId);
    const result = await (0, connection_1.query)(`UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING id, first_name, last_name, email, phone, address, is_active, created_at, updated_at`, values);
    const parent = result.rows[0];
    res.json({
        success: true,
        message: 'Parent updated successfully',
        data: {
            id: parent.id,
            firstName: parent.first_name,
            lastName: parent.last_name,
            email: parent.email,
            phone: parent.phone,
            address: parent.address,
            isActive: parent.is_active,
            createdAt: parent.created_at,
            updatedAt: parent.updated_at,
        },
    });
});
exports.linkParentToStudent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const linkData = req.body;
    const studentExists = await (0, connection_1.query)('SELECT id FROM students WHERE id = $1 AND is_active = true', [linkData.studentId]);
    if (studentExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Student not found or inactive', 404);
    }
    const parentExists = await (0, connection_1.query)("SELECT id FROM users WHERE id = $1 AND role = 'parent' AND is_active = true", [linkData.parentUserId]);
    if (parentExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Parent not found or inactive', 404);
    }
    const existingRelationship = await (0, connection_1.query)('SELECT id FROM student_parents WHERE student_id = $1 AND parent_user_id = $2', [linkData.studentId, linkData.parentUserId]);
    if (existingRelationship.rows.length > 0) {
        throw new errorHandler_1.AppError('Parent is already linked to this student', 409);
    }
    if (linkData.isPrimary) {
        await (0, connection_1.query)('UPDATE student_parents SET is_primary = false WHERE student_id = $1', [linkData.studentId]);
    }
    const result = await (0, connection_1.query)(`INSERT INTO student_parents (student_id, parent_user_id, relationship_type, is_primary)
     VALUES ($1, $2, $3, $4)
     RETURNING id, student_id, parent_user_id, relationship_type, is_primary, created_at, updated_at`, [
        linkData.studentId,
        linkData.parentUserId,
        linkData.relationshipType,
        linkData.isPrimary || false,
    ]);
    const relationship = result.rows[0];
    const relatedDataResult = await (0, connection_1.query)(`SELECT s.student_id as student_number,
            su.first_name as student_first_name, su.last_name as student_last_name,
            c.name as class_name, c.grade, c.section,
            pu.first_name as parent_first_name, pu.last_name as parent_last_name, pu.email
     FROM student_parents sp
     JOIN students s ON sp.student_id = s.id
     JOIN users su ON s.user_id = su.id
     JOIN classes c ON s.class_id = c.id
     JOIN users pu ON sp.parent_user_id = pu.id
     WHERE sp.id = $1`, [relationship.id]);
    const relatedData = relatedDataResult.rows[0];
    res.status(201).json({
        success: true,
        message: 'Parent linked to student successfully',
        data: {
            id: relationship.id,
            studentId: relationship.student_id,
            parentUserId: relationship.parent_user_id,
            relationshipType: relationship.relationship_type,
            isPrimary: relationship.is_primary,
            createdAt: relationship.created_at,
            updatedAt: relationship.updated_at,
            student: {
                studentId: relatedData.student_number,
                name: `${relatedData.student_first_name} ${relatedData.student_last_name}`,
                class: `${relatedData.class_name} (${relatedData.grade}-${relatedData.section})`,
            },
            parent: {
                name: `${relatedData.parent_first_name} ${relatedData.parent_last_name}`,
                email: relatedData.email,
            },
        },
    });
});
exports.updateParentStudentRelationship = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { relationshipId } = req.params;
    const updateData = req.body;
    const existingRelationship = await (0, connection_1.query)('SELECT id, student_id FROM student_parents WHERE id = $1', [relationshipId]);
    if (existingRelationship.rows.length === 0) {
        throw new errorHandler_1.AppError('Parent-student relationship not found', 404);
    }
    const studentId = existingRelationship.rows[0].student_id;
    if (updateData.isPrimary) {
        await (0, connection_1.query)('UPDATE student_parents SET is_primary = false WHERE student_id = $1 AND id != $2', [studentId, relationshipId]);
    }
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    if (updateData.relationshipType) {
        updateFields.push(`relationship_type = $${paramCount++}`);
        values.push(updateData.relationshipType);
    }
    if (updateData.isPrimary !== undefined) {
        updateFields.push(`is_primary = $${paramCount++}`);
        values.push(updateData.isPrimary);
    }
    if (updateFields.length === 0) {
        throw new errorHandler_1.AppError('No fields to update', 400);
    }
    values.push(relationshipId);
    const result = await (0, connection_1.query)(`UPDATE student_parents SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING id, student_id, parent_user_id, relationship_type, is_primary, created_at, updated_at`, values);
    const relationship = result.rows[0];
    res.json({
        success: true,
        message: 'Parent-student relationship updated successfully',
        data: {
            id: relationship.id,
            studentId: relationship.student_id,
            parentUserId: relationship.parent_user_id,
            relationshipType: relationship.relationship_type,
            isPrimary: relationship.is_primary,
            createdAt: relationship.created_at,
            updatedAt: relationship.updated_at,
        },
    });
});
exports.removeParentStudentRelationship = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { relationshipId } = req.params;
    const existingRelationship = await (0, connection_1.query)('SELECT id FROM student_parents WHERE id = $1', [relationshipId]);
    if (existingRelationship.rows.length === 0) {
        throw new errorHandler_1.AppError('Parent-student relationship not found', 404);
    }
    await (0, connection_1.query)('DELETE FROM student_parents WHERE id = $1', [relationshipId]);
    res.json({
        success: true,
        message: 'Parent-student relationship removed successfully',
    });
});
exports.getParentDashboard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const parentId = req.user?.id;
    if (!parentId) {
        throw new errorHandler_1.AppError('Parent ID not found in request', 400);
    }
    const childrenResult = await (0, connection_1.query)(`SELECT sp.id as relationship_id, sp.relationship_type, sp.is_primary,
            s.id as student_id, s.student_id as student_number,
            u.first_name, u.last_name,
            c.name as class_name, c.grade, c.section
     FROM student_parents sp
     JOIN students s ON sp.student_id = s.id
     JOIN users u ON s.user_id = u.id
     JOIN classes c ON s.class_id = c.id
     WHERE sp.parent_user_id = $1 AND s.is_active = true
     ORDER BY sp.is_primary DESC, u.first_name`, [parentId]);
    const children = [];
    for (const child of childrenResult.rows) {
        const attendanceResult = await (0, connection_1.query)(`SELECT 
         COUNT(*) as total_days,
         SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) as present_days
       FROM attendance 
       WHERE student_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'`, [child.student_id]);
        const attendance = attendanceResult.rows[0];
        const attendancePercentage = attendance.total_days > 0
            ? Math.round((attendance.present_days / attendance.total_days) * 100)
            : 0;
        const gradesResult = await (0, connection_1.query)(`SELECT s.name as subject_name, at.name as assessment_type, 
              g.percentage, g.grade_letter, g.created_at
       FROM grades g
       JOIN subjects s ON g.subject_id = s.id
       JOIN assessment_types at ON g.assessment_type_id = at.id
       WHERE g.student_id = $1
       ORDER BY g.created_at DESC
       LIMIT 3`, [child.student_id]);
        const recentGrades = gradesResult.rows.map((grade) => ({
            subjectName: grade.subject_name,
            assessmentType: grade.assessment_type,
            percentage: parseFloat(grade.percentage),
            gradeLetter: grade.grade_letter,
            date: grade.created_at,
        }));
        const feeResult = await (0, connection_1.query)(`SELECT 
         COALESCE(SUM(sf.total_amount), 0) as total_due,
         COALESCE(SUM(CASE WHEN sf.due_date < CURRENT_DATE AND sf.status IN ('pending', 'partial') THEN sf.total_amount ELSE 0 END), 0) as overdue,
         MIN(CASE WHEN sf.status IN ('pending', 'partial') THEN sf.due_date END) as next_due_date
       FROM student_fees sf
       WHERE sf.student_id = $1 AND sf.status IN ('pending', 'partial')`, [child.student_id]);
        const feeStatus = feeResult.rows[0];
        children.push({
            studentId: child.student_id,
            studentName: `${child.first_name} ${child.last_name}`,
            studentIdNumber: child.student_number,
            className: `${child.class_name} (${child.grade}-${child.section})`,
            relationshipType: child.relationship_type,
            isPrimary: child.is_primary,
            recentAttendance: {
                percentage: attendancePercentage,
                lastWeekPresent: parseInt(attendance.present_days),
                lastWeekTotal: parseInt(attendance.total_days),
            },
            recentGrades,
            feeStatus: {
                totalDue: parseFloat(feeStatus.total_due),
                overdue: parseFloat(feeStatus.overdue),
                nextDueDate: feeStatus.next_due_date,
            },
        });
    }
    res.json({
        success: true,
        data: {
            parentId,
            children,
        },
    });
});
//# sourceMappingURL=parentController.js.map
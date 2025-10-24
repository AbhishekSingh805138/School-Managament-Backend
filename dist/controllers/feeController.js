"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDueDates = exports.updateStudentFee = exports.getStudentFeeById = exports.getStudentFees = exports.assignFeesToClass = exports.assignFeesToStudents = exports.deleteFeeCategory = exports.updateFeeCategory = exports.getFeeCategoryById = exports.getFeeCategories = exports.createFeeCategory = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const pagination_1 = require("../utils/pagination");
exports.createFeeCategory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const feeCategoryData = req.body;
    const academicYearExists = await (0, connection_1.query)('SELECT id, name FROM academic_years WHERE id = $1 AND is_active = true', [feeCategoryData.academicYearId]);
    if (academicYearExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Academic year not found or inactive', 404);
    }
    const existingCategory = await (0, connection_1.query)('SELECT id FROM fee_categories WHERE name = $1 AND academic_year_id = $2', [feeCategoryData.name, feeCategoryData.academicYearId]);
    if (existingCategory.rows.length > 0) {
        throw new errorHandler_1.AppError('Fee category with this name already exists for the academic year', 409);
    }
    const seqIdResult = await (0, connection_1.query)('SELECT generate_sequential_id($1) as next_id', ['fee_categories']);
    const sequentialId = seqIdResult.rows[0].next_id;
    const result = await (0, connection_1.query)(`INSERT INTO fee_categories (name, description, amount, frequency, is_mandatory, academic_year_id, alt_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, alt_id, name, description, amount, frequency, is_mandatory, academic_year_id, is_active, created_at, updated_at`, [
        feeCategoryData.name,
        feeCategoryData.description || null,
        feeCategoryData.amount,
        feeCategoryData.frequency,
        feeCategoryData.isMandatory ?? true,
        feeCategoryData.academicYearId,
        sequentialId.toString()
    ]);
    const feeCategory = result.rows[0];
    const academicYear = academicYearExists.rows[0];
    res.status(201).json({
        success: true,
        message: 'Fee category created successfully',
        data: {
            id: feeCategory.id,
            altId: feeCategory.alt_id,
            name: feeCategory.name,
            description: feeCategory.description,
            amount: parseFloat(feeCategory.amount),
            frequency: feeCategory.frequency,
            isMandatory: feeCategory.is_mandatory,
            academicYearId: feeCategory.academic_year_id,
            isActive: feeCategory.is_active,
            createdAt: feeCategory.created_at,
            updatedAt: feeCategory.updated_at,
            academicYear: {
                name: academicYear.name,
            },
        },
    });
});
exports.getFeeCategories = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'name');
    const { academicYearId, frequency, isActive, isMandatory } = req.query;
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    if (academicYearId) {
        whereClause += ` AND fc.academic_year_id = $${queryParams.length + 1}`;
        queryParams.push(academicYearId);
    }
    if (frequency) {
        whereClause += ` AND fc.frequency = $${queryParams.length + 1}`;
        queryParams.push(frequency);
    }
    if (isActive !== undefined) {
        whereClause += ` AND fc.is_active = $${queryParams.length + 1}`;
        queryParams.push(isActive === 'true');
    }
    if (isMandatory !== undefined) {
        whereClause += ` AND fc.is_mandatory = $${queryParams.length + 1}`;
        queryParams.push(isMandatory === 'true');
    }
    const countResult = await (0, connection_1.query)(`SELECT COUNT(*) FROM fee_categories fc ${whereClause}`, queryParams);
    const total = parseInt(countResult.rows[0].count);
    const result = await (0, connection_1.query)(`SELECT fc.id, fc.alt_id, fc.name, fc.description, fc.amount, fc.frequency, 
            fc.is_mandatory, fc.academic_year_id, fc.is_active, fc.created_at, fc.updated_at,
            ay.name as academic_year_name, ay.start_date, ay.end_date
     FROM fee_categories fc
     JOIN academic_years ay ON fc.academic_year_id = ay.id
     ${whereClause}
     ORDER BY fc.${sortBy} ${sortOrder}
     LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`, [...queryParams, limit, offset]);
    const feeCategories = result.rows.map((category) => ({
        id: category.id,
        altId: category.alt_id,
        name: category.name,
        description: category.description,
        amount: parseFloat(category.amount),
        frequency: category.frequency,
        isMandatory: category.is_mandatory,
        academicYearId: category.academic_year_id,
        isActive: category.is_active,
        createdAt: category.created_at,
        updatedAt: category.updated_at,
        academicYear: {
            name: category.academic_year_name,
            startDate: category.start_date,
            endDate: category.end_date,
        },
    }));
    res.json({
        success: true,
        data: feeCategories,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
});
exports.getFeeCategoryById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const result = await (0, connection_1.query)(`SELECT fc.id, fc.alt_id, fc.name, fc.description, fc.amount, fc.frequency, 
            fc.is_mandatory, fc.academic_year_id, fc.is_active, fc.created_at, fc.updated_at,
            ay.name as academic_year_name, ay.start_date, ay.end_date
     FROM fee_categories fc
     JOIN academic_years ay ON fc.academic_year_id = ay.id
     WHERE fc.id = $1`, [id]);
    if (result.rows.length === 0) {
        throw new errorHandler_1.AppError('Fee category not found', 404);
    }
    const category = result.rows[0];
    const assignedStudentsResult = await (0, connection_1.query)('SELECT COUNT(*) as assigned_count FROM student_fees WHERE fee_category_id = $1', [id]);
    res.json({
        success: true,
        data: {
            id: category.id,
            altId: category.alt_id,
            name: category.name,
            description: category.description,
            amount: parseFloat(category.amount),
            frequency: category.frequency,
            isMandatory: category.is_mandatory,
            academicYearId: category.academic_year_id,
            isActive: category.is_active,
            createdAt: category.created_at,
            updatedAt: category.updated_at,
            academicYear: {
                name: category.academic_year_name,
                startDate: category.start_date,
                endDate: category.end_date,
            },
            assignedStudentsCount: parseInt(assignedStudentsResult.rows[0].assigned_count),
        },
    });
});
exports.updateFeeCategory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const existingCategory = await (0, connection_1.query)('SELECT id, academic_year_id FROM fee_categories WHERE id = $1', [id]);
    if (existingCategory.rows.length === 0) {
        throw new errorHandler_1.AppError('Fee category not found', 404);
    }
    if (updateData.name) {
        const nameExists = await (0, connection_1.query)('SELECT id FROM fee_categories WHERE name = $1 AND academic_year_id = $2 AND id != $3', [updateData.name, existingCategory.rows[0].academic_year_id, id]);
        if (nameExists.rows.length > 0) {
            throw new errorHandler_1.AppError('Fee category with this name already exists for the academic year', 409);
        }
    }
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;
    if (updateData.name !== undefined) {
        updateFields.push(`name = $${paramCount++}`);
        updateValues.push(updateData.name);
    }
    if (updateData.description !== undefined) {
        updateFields.push(`description = $${paramCount++}`);
        updateValues.push(updateData.description);
    }
    if (updateData.amount !== undefined) {
        updateFields.push(`amount = $${paramCount++}`);
        updateValues.push(updateData.amount);
    }
    if (updateData.frequency !== undefined) {
        updateFields.push(`frequency = $${paramCount++}`);
        updateValues.push(updateData.frequency);
    }
    if (updateData.isMandatory !== undefined) {
        updateFields.push(`is_mandatory = $${paramCount++}`);
        updateValues.push(updateData.isMandatory);
    }
    if (updateFields.length === 0) {
        throw new errorHandler_1.AppError('No fields to update', 400);
    }
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);
    const result = await (0, connection_1.query)(`UPDATE fee_categories 
     SET ${updateFields.join(', ')}
     WHERE id = $${paramCount}
     RETURNING id, alt_id, name, description, amount, frequency, is_mandatory, academic_year_id, is_active, created_at, updated_at`, updateValues);
    const updatedCategory = result.rows[0];
    res.json({
        success: true,
        message: 'Fee category updated successfully',
        data: {
            id: updatedCategory.id,
            altId: updatedCategory.alt_id,
            name: updatedCategory.name,
            description: updatedCategory.description,
            amount: parseFloat(updatedCategory.amount),
            frequency: updatedCategory.frequency,
            isMandatory: updatedCategory.is_mandatory,
            academicYearId: updatedCategory.academic_year_id,
            isActive: updatedCategory.is_active,
            createdAt: updatedCategory.created_at,
            updatedAt: updatedCategory.updated_at,
        },
    });
});
exports.deleteFeeCategory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const existingCategory = await (0, connection_1.query)('SELECT id FROM fee_categories WHERE id = $1', [id]);
    if (existingCategory.rows.length === 0) {
        throw new errorHandler_1.AppError('Fee category not found', 404);
    }
    const associatedFees = await (0, connection_1.query)('SELECT COUNT(*) as count FROM student_fees WHERE fee_category_id = $1', [id]);
    const feeCount = parseInt(associatedFees.rows[0].count);
    if (feeCount > 0) {
        throw new errorHandler_1.AppError(`Cannot delete fee category. It has ${feeCount} associated student fees. Please deactivate instead.`, 409);
    }
    await (0, connection_1.query)('DELETE FROM fee_categories WHERE id = $1', [id]);
    res.json({
        success: true,
        message: 'Fee category deleted successfully',
    });
});
exports.assignFeesToStudents = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const assignmentData = req.body;
    const feeCategoryExists = await (0, connection_1.query)('SELECT id, name, amount FROM fee_categories WHERE id = $1 AND is_active = true', [assignmentData.feeCategoryId]);
    if (feeCategoryExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Fee category not found or inactive', 404);
    }
    const studentsValidation = await (0, connection_1.query)(`SELECT s.id, s.student_id, u.first_name, u.last_name 
     FROM students s 
     JOIN users u ON s.user_id = u.id 
     WHERE s.id = ANY($1) AND s.is_active = true AND u.is_active = true`, [assignmentData.studentIds]);
    if (studentsValidation.rows.length !== assignmentData.studentIds.length) {
        throw new errorHandler_1.AppError('Some students are not found or inactive', 400);
    }
    const existingAssignments = await (0, connection_1.query)('SELECT student_id FROM student_fees WHERE student_id = ANY($1) AND fee_category_id = $2', [assignmentData.studentIds, assignmentData.feeCategoryId]);
    if (existingAssignments.rows.length > 0) {
        const existingStudentIds = existingAssignments.rows.map((row) => row.student_id);
        throw new errorHandler_1.AppError(`Some students already have this fee assigned: ${existingStudentIds.join(', ')}`, 409);
    }
    const client = await (0, connection_1.getClient)();
    const feeCategory = feeCategoryExists.rows[0];
    const assignedFees = [];
    try {
        await client.query('BEGIN');
        for (const studentId of assignmentData.studentIds) {
            const seqIdResult = await client.query('SELECT generate_sequential_id($1) as next_id', ['student_fees']);
            const sequentialId = seqIdResult.rows[0].next_id;
            const result = await client.query(`INSERT INTO student_fees (student_id, fee_category_id, amount, due_date, discount_amount, alt_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, alt_id, student_id, fee_category_id, amount, due_date, status, discount_amount, total_amount, created_at, updated_at`, [
                studentId,
                assignmentData.feeCategoryId,
                feeCategory.amount,
                assignmentData.dueDate,
                assignmentData.discountAmount || 0,
                sequentialId.toString()
            ]);
            assignedFees.push(result.rows[0]);
        }
        await client.query('COMMIT');
        res.status(201).json({
            success: true,
            message: `Fees assigned successfully to ${assignedFees.length} students`,
            data: {
                feeCategoryId: assignmentData.feeCategoryId,
                feeCategoryName: feeCategory.name,
                assignedCount: assignedFees.length,
                totalAmount: assignedFees.reduce((sum, fee) => sum + parseFloat(fee.total_amount), 0),
                dueDate: assignmentData.dueDate,
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
exports.assignFeesToClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const assignmentData = req.body;
    const feeCategoryExists = await (0, connection_1.query)('SELECT id, name, amount FROM fee_categories WHERE id = $1 AND is_active = true', [assignmentData.feeCategoryId]);
    if (feeCategoryExists.rows.length === 0) {
        throw new errorHandler_1.AppError('Fee category not found or inactive', 404);
    }
    const classStudents = await (0, connection_1.query)(`SELECT s.id, s.student_id, u.first_name, u.last_name, c.name as class_name
     FROM students s 
     JOIN users u ON s.user_id = u.id 
     JOIN classes c ON s.class_id = c.id
     WHERE s.class_id = $1 AND s.is_active = true AND u.is_active = true AND c.is_active = true`, [assignmentData.classId]);
    if (classStudents.rows.length === 0) {
        throw new errorHandler_1.AppError('No active students found in this class', 404);
    }
    const studentIds = classStudents.rows.map((student) => student.id);
    const existingAssignments = await (0, connection_1.query)('SELECT student_id FROM student_fees WHERE student_id = ANY($1) AND fee_category_id = $2', [studentIds, assignmentData.feeCategoryId]);
    if (existingAssignments.rows.length > 0) {
        const existingCount = existingAssignments.rows.length;
        throw new errorHandler_1.AppError(`${existingCount} students in this class already have this fee assigned`, 409);
    }
    const client = await (0, connection_1.getClient)();
    const feeCategory = feeCategoryExists.rows[0];
    const assignedFees = [];
    try {
        await client.query('BEGIN');
        for (const studentId of studentIds) {
            const seqIdResult = await client.query('SELECT generate_sequential_id($1) as next_id', ['student_fees']);
            const sequentialId = seqIdResult.rows[0].next_id;
            const result = await client.query(`INSERT INTO student_fees (student_id, fee_category_id, amount, due_date, discount_amount, alt_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, alt_id, student_id, fee_category_id, amount, due_date, status, discount_amount, total_amount, created_at, updated_at`, [
                studentId,
                assignmentData.feeCategoryId,
                feeCategory.amount,
                assignmentData.dueDate,
                assignmentData.discountAmount || 0,
                sequentialId.toString()
            ]);
            assignedFees.push(result.rows[0]);
        }
        await client.query('COMMIT');
        const className = classStudents.rows[0].class_name;
        res.status(201).json({
            success: true,
            message: `Fees assigned successfully to all students in ${className}`,
            data: {
                classId: assignmentData.classId,
                className: className,
                feeCategoryId: assignmentData.feeCategoryId,
                feeCategoryName: feeCategory.name,
                assignedCount: assignedFees.length,
                totalAmount: assignedFees.reduce((sum, fee) => sum + parseFloat(fee.total_amount), 0),
                dueDate: assignmentData.dueDate,
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
exports.getStudentFees = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'due_date');
    const queryParams = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    let whereClause = 'WHERE 1=1';
    const sqlParams = [];
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
    if (queryParams.studentId) {
        whereClause += ` AND sf.student_id = $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.studentId);
    }
    if (queryParams.classId) {
        whereClause += ` AND s.class_id = $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.classId);
    }
    if (queryParams.feeCategoryId) {
        whereClause += ` AND sf.fee_category_id = $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.feeCategoryId);
    }
    if (queryParams.status) {
        whereClause += ` AND sf.status = $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.status);
    }
    if (queryParams.startDate) {
        whereClause += ` AND sf.due_date >= $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.startDate);
    }
    if (queryParams.endDate) {
        whereClause += ` AND sf.due_date <= $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.endDate);
    }
    await (0, connection_1.query)(`UPDATE student_fees 
     SET status = 'overdue', updated_at = CURRENT_TIMESTAMP
     WHERE status = 'pending' AND due_date < CURRENT_DATE`);
    const countResult = await (0, connection_1.query)(`SELECT COUNT(*) FROM student_fees sf
     JOIN students s ON sf.student_id = s.id
     JOIN fee_categories fc ON sf.fee_category_id = fc.id
     ${whereClause}`, sqlParams);
    const total = parseInt(countResult.rows[0].count);
    const result = await (0, connection_1.query)(`SELECT sf.id, sf.alt_id, sf.student_id, sf.fee_category_id, sf.amount, sf.due_date, 
            sf.status, sf.discount_amount, sf.total_amount, sf.created_at, sf.updated_at,
            s.student_id as student_number, su.first_name as student_first_name, su.last_name as student_last_name,
            fc.name as fee_category_name, fc.frequency,
            c.name as class_name, c.grade, c.section,
            COALESCE(SUM(p.amount), 0) as paid_amount
     FROM student_fees sf
     JOIN students s ON sf.student_id = s.id
     JOIN users su ON s.user_id = su.id
     JOIN fee_categories fc ON sf.fee_category_id = fc.id
     JOIN classes c ON s.class_id = c.id
     LEFT JOIN payments p ON sf.id = p.student_fee_id
     ${whereClause}
     GROUP BY sf.id, sf.alt_id, sf.student_id, sf.fee_category_id, sf.amount, sf.due_date, 
              sf.status, sf.discount_amount, sf.total_amount, sf.created_at, sf.updated_at,
              s.student_id, su.first_name, su.last_name, fc.name, fc.frequency,
              c.name, c.grade, c.section
     ORDER BY sf.${sortBy} ${sortOrder}
     LIMIT $${sqlParams.length + 1} OFFSET $${sqlParams.length + 2}`, [...sqlParams, limit, offset]);
    const studentFees = result.rows.map((fee) => ({
        id: fee.id,
        altId: fee.alt_id,
        studentId: fee.student_id,
        feeCategoryId: fee.fee_category_id,
        amount: parseFloat(fee.amount),
        dueDate: fee.due_date,
        status: fee.status,
        discountAmount: parseFloat(fee.discount_amount),
        totalAmount: parseFloat(fee.total_amount),
        paidAmount: parseFloat(fee.paid_amount),
        pendingAmount: parseFloat(fee.total_amount) - parseFloat(fee.paid_amount),
        createdAt: fee.created_at,
        updatedAt: fee.updated_at,
        student: {
            studentId: fee.student_number,
            user: {
                firstName: fee.student_first_name,
                lastName: fee.student_last_name,
            },
            class: {
                name: fee.class_name,
                grade: fee.grade,
                section: fee.section,
            },
        },
        feeCategory: {
            name: fee.fee_category_name,
            frequency: fee.frequency,
        },
    }));
    res.json({
        success: true,
        data: studentFees,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
});
exports.getStudentFeeById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    const result = await (0, connection_1.query)(`SELECT sf.id, sf.alt_id, sf.student_id, sf.fee_category_id, sf.amount, sf.due_date, 
            sf.status, sf.discount_amount, sf.total_amount, sf.created_at, sf.updated_at,
            s.student_id as student_number, su.first_name as student_first_name, su.last_name as student_last_name,
            fc.name as fee_category_name, fc.frequency, fc.description,
            c.name as class_name, c.grade, c.section,
            COALESCE(SUM(p.amount), 0) as paid_amount
     FROM student_fees sf
     JOIN students s ON sf.student_id = s.id
     JOIN users su ON s.user_id = su.id
     JOIN fee_categories fc ON sf.fee_category_id = fc.id
     JOIN classes c ON s.class_id = c.id
     LEFT JOIN payments p ON sf.id = p.student_fee_id
     WHERE sf.id = $1 ${authorizationClause}
     GROUP BY sf.id, sf.alt_id, sf.student_id, sf.fee_category_id, sf.amount, sf.due_date, 
              sf.status, sf.discount_amount, sf.total_amount, sf.created_at, sf.updated_at,
              s.student_id, su.first_name, su.last_name, fc.name, fc.frequency, fc.description,
              c.name, c.grade, c.section`, queryParams);
    if (result.rows.length === 0) {
        throw new errorHandler_1.AppError('Student fee not found or access denied', 404);
    }
    const fee = result.rows[0];
    const paymentsResult = await (0, connection_1.query)(`SELECT p.id, p.amount, p.payment_date, p.payment_method, p.receipt_number, p.remarks,
            u.first_name as processed_by_first_name, u.last_name as processed_by_last_name
     FROM payments p
     JOIN users u ON p.processed_by = u.id
     WHERE p.student_fee_id = $1
     ORDER BY p.payment_date DESC`, [id]);
    res.json({
        success: true,
        data: {
            id: fee.id,
            altId: fee.alt_id,
            studentId: fee.student_id,
            feeCategoryId: fee.fee_category_id,
            amount: parseFloat(fee.amount),
            dueDate: fee.due_date,
            status: fee.status,
            discountAmount: parseFloat(fee.discount_amount),
            totalAmount: parseFloat(fee.total_amount),
            paidAmount: parseFloat(fee.paid_amount),
            pendingAmount: parseFloat(fee.total_amount) - parseFloat(fee.paid_amount),
            createdAt: fee.created_at,
            updatedAt: fee.updated_at,
            student: {
                studentId: fee.student_number,
                user: {
                    firstName: fee.student_first_name,
                    lastName: fee.student_last_name,
                },
                class: {
                    name: fee.class_name,
                    grade: fee.grade,
                    section: fee.section,
                },
            },
            feeCategory: {
                name: fee.fee_category_name,
                frequency: fee.frequency,
                description: fee.description,
            },
            payments: paymentsResult.rows.map((payment) => ({
                id: payment.id,
                amount: parseFloat(payment.amount),
                paymentDate: payment.payment_date,
                paymentMethod: payment.payment_method,
                receiptNumber: payment.receipt_number,
                remarks: payment.remarks,
                processedBy: `${payment.processed_by_first_name} ${payment.processed_by_last_name}`,
            })),
        },
    });
});
exports.updateStudentFee = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const existingFee = await (0, connection_1.query)('SELECT id, amount, discount_amount FROM student_fees WHERE id = $1', [id]);
    if (existingFee.rows.length === 0) {
        throw new errorHandler_1.AppError('Student fee not found', 404);
    }
    if (updateData.discountAmount !== undefined && updateData.amount !== undefined) {
        if (updateData.discountAmount > updateData.amount) {
            throw new errorHandler_1.AppError('Discount amount cannot exceed fee amount', 400);
        }
    }
    else if (updateData.discountAmount !== undefined) {
        const currentAmount = parseFloat(existingFee.rows[0].amount);
        if (updateData.discountAmount > currentAmount) {
            throw new errorHandler_1.AppError('Discount amount cannot exceed current fee amount', 400);
        }
    }
    else if (updateData.amount !== undefined) {
        const currentDiscount = parseFloat(existingFee.rows[0].discount_amount);
        if (currentDiscount > updateData.amount) {
            throw new errorHandler_1.AppError('Current discount amount exceeds new fee amount', 400);
        }
    }
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;
    if (updateData.amount !== undefined) {
        updateFields.push(`amount = $${paramCount++}`);
        updateValues.push(updateData.amount);
    }
    if (updateData.dueDate !== undefined) {
        updateFields.push(`due_date = $${paramCount++}`);
        updateValues.push(updateData.dueDate);
    }
    if (updateData.discountAmount !== undefined) {
        updateFields.push(`discount_amount = $${paramCount++}`);
        updateValues.push(updateData.discountAmount);
    }
    if (updateData.status !== undefined) {
        updateFields.push(`status = $${paramCount++}`);
        updateValues.push(updateData.status);
    }
    if (updateFields.length === 0) {
        throw new errorHandler_1.AppError('No fields to update', 400);
    }
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);
    const result = await (0, connection_1.query)(`UPDATE student_fees 
     SET ${updateFields.join(', ')}
     WHERE id = $${paramCount}
     RETURNING id, alt_id, student_id, fee_category_id, amount, due_date, status, discount_amount, total_amount, created_at, updated_at`, updateValues);
    const updatedFee = result.rows[0];
    res.json({
        success: true,
        message: 'Student fee updated successfully',
        data: {
            id: updatedFee.id,
            altId: updatedFee.alt_id,
            studentId: updatedFee.student_id,
            feeCategoryId: updatedFee.fee_category_id,
            amount: parseFloat(updatedFee.amount),
            dueDate: updatedFee.due_date,
            status: updatedFee.status,
            discountAmount: parseFloat(updatedFee.discount_amount),
            totalAmount: parseFloat(updatedFee.total_amount),
            createdAt: updatedFee.created_at,
            updatedAt: updatedFee.updated_at,
        },
    });
});
const calculateDueDates = (startDate, frequency, academicYearEnd) => {
    const dueDates = [];
    let currentDate = new Date(startDate);
    switch (frequency) {
        case 'monthly':
            while (currentDate <= academicYearEnd) {
                dueDates.push(new Date(currentDate));
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
            break;
        case 'quarterly':
            while (currentDate <= academicYearEnd) {
                dueDates.push(new Date(currentDate));
                currentDate.setMonth(currentDate.getMonth() + 3);
            }
            break;
        case 'semester':
            dueDates.push(new Date(currentDate));
            currentDate.setMonth(currentDate.getMonth() + 6);
            if (currentDate <= academicYearEnd) {
                dueDates.push(new Date(currentDate));
            }
            break;
        case 'annual':
        case 'one-time':
            dueDates.push(new Date(currentDate));
            break;
    }
    return dueDates;
};
exports.calculateDueDates = calculateDueDates;
//# sourceMappingURL=feeController.js.map
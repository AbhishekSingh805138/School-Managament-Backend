"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaffSummary = exports.reactivateStaff = exports.deactivateStaff = exports.updateStaff = exports.getStaffById = exports.getStaff = exports.createStaff = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const staff_1 = require("../types/staff");
const pagination_1 = require("../utils/pagination");
const bcrypt_1 = __importDefault(require("bcrypt"));
exports.createStaff = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const staffData = staff_1.CreateStaffSchema.parse(req.body);
    const userRole = req.user.role;
    if (userRole !== 'admin') {
        throw new errorHandler_1.AppError('Only administrators can create staff members', 403);
    }
    const client = await (0, connection_1.getClient)();
    try {
        await client.query('BEGIN');
        const emailCheck = await client.query('SELECT id FROM users WHERE email = $1', [staffData.email]);
        if (emailCheck.rows.length > 0) {
            throw new errorHandler_1.AppError('Email already exists', 409);
        }
        const employeeIdCheck = await client.query('SELECT id FROM staff WHERE employee_id = $1', [staffData.employeeId]);
        if (employeeIdCheck.rows.length > 0) {
            throw new errorHandler_1.AppError('Employee ID already exists', 409);
        }
        const hashedPassword = await bcrypt_1.default.hash(staffData.password, 10);
        const userIdResult = await client.query('SELECT nextval(\'users_id_seq\') as id');
        const userSequentialId = userIdResult.rows[0].id;
        const userResult = await client.query(`INSERT INTO users (
         id, first_name, last_name, email, password_hash, role, phone, 
         date_of_birth, address, is_active
       ) VALUES ($1, $2, $3, $4, $5, 'staff', $6, $7, $8, true)
       RETURNING *`, [
            userSequentialId,
            staffData.firstName,
            staffData.lastName,
            staffData.email,
            hashedPassword,
            staffData.phone || null,
            staffData.dateOfBirth || null,
            staffData.address || null
        ]);
        const user = userResult.rows[0];
        const staffIdResult = await client.query('SELECT nextval(\'staff_id_seq\') as id');
        const staffSequentialId = staffIdResult.rows[0].id;
        const staffResult = await client.query(`INSERT INTO staff (
         id, user_id, employee_id, department, position, joining_date, 
         salary, responsibilities, is_active
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`, [
            staffSequentialId,
            user.id,
            staffData.employeeId,
            staffData.department,
            staffData.position,
            staffData.joiningDate,
            staffData.salary || null,
            staffData.responsibilities || null
        ]);
        await client.query('COMMIT');
        const completeStaff = await getStaffWithUser(staffResult.rows[0].id);
        res.status(201).json({
            success: true,
            data: completeStaff,
            message: 'Staff member created successfully'
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
exports.getStaff = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const queryParams = staff_1.StaffQuerySchema.parse(req.query);
    const userRole = req.user.role;
    const { offset, limit, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req);
    let whereClause = 'WHERE s.is_active = true';
    const sqlParams = [];
    if (userRole === 'staff') {
        whereClause += ` AND u.id = $${sqlParams.length + 1}`;
        sqlParams.push(req.user.id);
    }
    if (queryParams.department) {
        whereClause += ` AND s.department = $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.department);
    }
    if (queryParams.position) {
        whereClause += ` AND s.position = $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.position);
    }
    if (queryParams.isActive !== undefined) {
        whereClause = whereClause.replace('s.is_active = true', `s.is_active = $${sqlParams.length + 1}`);
        sqlParams.push(queryParams.isActive);
    }
    if (queryParams.joiningDateFrom) {
        whereClause += ` AND s.joining_date >= $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.joiningDateFrom);
    }
    if (queryParams.joiningDateTo) {
        whereClause += ` AND s.joining_date <= $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.joiningDateTo);
    }
    if (queryParams.search) {
        whereClause += ` AND (
      u.first_name ILIKE $${sqlParams.length + 1} OR 
      u.last_name ILIKE $${sqlParams.length + 1} OR 
      u.email ILIKE $${sqlParams.length + 1} OR 
      s.employee_id ILIKE $${sqlParams.length + 1}
    )`;
        sqlParams.push(`%${queryParams.search}%`);
    }
    const countResult = await (0, connection_1.query)(`SELECT COUNT(*) as total
     FROM staff s
     JOIN users u ON s.user_id = u.id
     ${whereClause}`, sqlParams);
    const total = parseInt(countResult.rows[0].total);
    const result = await (0, connection_1.query)(`SELECT 
       s.*,
       u.first_name,
       u.last_name,
       u.email,
       u.phone,
       u.date_of_birth,
       u.address
     FROM staff s
     JOIN users u ON s.user_id = u.id
     ${whereClause}
     ORDER BY ${getSortColumn(sortBy)} ${sortOrder}
     LIMIT $${sqlParams.length + 1} OFFSET $${sqlParams.length + 2}`, [...sqlParams, limit, offset]);
    const staff = result.rows.map(formatStaffResponse);
    res.json({
        success: true,
        data: staff,
        pagination: {
            page: queryParams.page,
            limit: queryParams.limit,
            total,
            pages: Math.ceil(total / queryParams.limit)
        }
    });
});
exports.getStaffById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const staff = await getStaffWithUser(parseInt(id));
    if (!staff) {
        throw new errorHandler_1.AppError('Staff member not found', 404);
    }
    if (userRole === 'staff' && staff.userId !== userId) {
        throw new errorHandler_1.AppError('You can only view your own profile', 403);
    }
    res.json({
        success: true,
        data: staff
    });
});
exports.updateStaff = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = staff_1.UpdateStaffSchema.parse(req.body);
    const userId = req.user.id;
    const userRole = req.user.role;
    const existingStaff = await (0, connection_1.query)('SELECT s.*, u.id as user_id FROM staff s JOIN users u ON s.user_id = u.id WHERE s.id = $1', [id]);
    if (existingStaff.rows.length === 0) {
        throw new errorHandler_1.AppError('Staff member not found', 404);
    }
    const staff = existingStaff.rows[0];
    if (userRole === 'staff' && staff.user_id !== userId) {
        throw new errorHandler_1.AppError('You can only update your own profile', 403);
    }
    const client = await (0, connection_1.getClient)();
    try {
        await client.query('BEGIN');
        const userUpdateFields = [];
        const userUpdateValues = [];
        let userParamIndex = 1;
        if (updateData.firstName !== undefined) {
            userUpdateFields.push(`first_name = $${userParamIndex++}`);
            userUpdateValues.push(updateData.firstName);
        }
        if (updateData.lastName !== undefined) {
            userUpdateFields.push(`last_name = $${userParamIndex++}`);
            userUpdateValues.push(updateData.lastName);
        }
        if (updateData.phone !== undefined) {
            userUpdateFields.push(`phone = $${userParamIndex++}`);
            userUpdateValues.push(updateData.phone);
        }
        if (updateData.dateOfBirth !== undefined) {
            userUpdateFields.push(`date_of_birth = $${userParamIndex++}`);
            userUpdateValues.push(updateData.dateOfBirth);
        }
        if (updateData.address !== undefined) {
            userUpdateFields.push(`address = $${userParamIndex++}`);
            userUpdateValues.push(updateData.address);
        }
        if (userUpdateFields.length > 0) {
            userUpdateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            userUpdateValues.push(staff.user_id);
            await client.query(`UPDATE users 
         SET ${userUpdateFields.join(', ')}
         WHERE id = $${userParamIndex}`, userUpdateValues);
        }
        const staffUpdateFields = [];
        const staffUpdateValues = [];
        let staffParamIndex = 1;
        if (updateData.department !== undefined) {
            staffUpdateFields.push(`department = $${staffParamIndex++}`);
            staffUpdateValues.push(updateData.department);
        }
        if (updateData.position !== undefined) {
            staffUpdateFields.push(`position = $${staffParamIndex++}`);
            staffUpdateValues.push(updateData.position);
        }
        if (updateData.salary !== undefined) {
            staffUpdateFields.push(`salary = $${staffParamIndex++}`);
            staffUpdateValues.push(updateData.salary);
        }
        if (updateData.responsibilities !== undefined) {
            staffUpdateFields.push(`responsibilities = $${staffParamIndex++}`);
            staffUpdateValues.push(updateData.responsibilities);
        }
        if (staffUpdateFields.length > 0) {
            staffUpdateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            staffUpdateValues.push(id);
            await client.query(`UPDATE staff 
         SET ${staffUpdateFields.join(', ')}
         WHERE id = $${staffParamIndex}`, staffUpdateValues);
        }
        await client.query('COMMIT');
        const updatedStaff = await getStaffWithUser(parseInt(id));
        res.json({
            success: true,
            data: updatedStaff,
            message: 'Staff member updated successfully'
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
exports.deactivateStaff = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userRole = req.user.role;
    if (userRole !== 'admin') {
        throw new errorHandler_1.AppError('Only administrators can deactivate staff members', 403);
    }
    const existingStaff = await (0, connection_1.query)('SELECT * FROM staff WHERE id = $1', [id]);
    if (existingStaff.rows.length === 0) {
        throw new errorHandler_1.AppError('Staff member not found', 404);
    }
    const client = await (0, connection_1.getClient)();
    try {
        await client.query('BEGIN');
        await client.query('UPDATE staff SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
        await client.query('UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [existingStaff.rows[0].user_id]);
        await client.query('COMMIT');
        res.json({
            success: true,
            message: 'Staff member deactivated successfully'
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
exports.reactivateStaff = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userRole = req.user.role;
    if (userRole !== 'admin') {
        throw new errorHandler_1.AppError('Only administrators can reactivate staff members', 403);
    }
    const existingStaff = await (0, connection_1.query)('SELECT * FROM staff WHERE id = $1 AND is_active = false', [id]);
    if (existingStaff.rows.length === 0) {
        throw new errorHandler_1.AppError('Staff member not found or already active', 404);
    }
    const client = await (0, connection_1.getClient)();
    try {
        await client.query('BEGIN');
        await client.query('UPDATE staff SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
        await client.query('UPDATE users SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [existingStaff.rows[0].user_id]);
        await client.query('COMMIT');
        const updatedStaff = await getStaffWithUser(parseInt(id));
        res.json({
            success: true,
            data: updatedStaff,
            message: 'Staff member reactivated successfully'
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
exports.getStaffSummary = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userRole = req.user.role;
    if (userRole !== 'admin') {
        throw new errorHandler_1.AppError('Only administrators can view staff summary', 403);
    }
    const overallStats = await (0, connection_1.query)(`SELECT 
       COUNT(*) as total_staff,
       COUNT(CASE WHEN is_active = true THEN 1 END) as active_staff,
       COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_staff
     FROM staff`);
    const departmentStats = await (0, connection_1.query)(`SELECT 
       department,
       COUNT(*) as total_staff,
       COUNT(CASE WHEN is_active = true THEN 1 END) as active_staff,
       json_agg(
         json_build_object(
           'position', position,
           'count', position_count
         )
       ) as positions
     FROM (
       SELECT 
         department,
         position,
         is_active,
         COUNT(*) OVER (PARTITION BY department, position) as position_count
       FROM staff
     ) dept_pos
     GROUP BY department
     ORDER BY department`);
    const recentJoinings = await (0, connection_1.query)(`SELECT 
       s.id,
       u.first_name || ' ' || u.last_name as name,
       s.department,
       s.position,
       s.joining_date
     FROM staff s
     JOIN users u ON s.user_id = u.id
     WHERE s.joining_date >= CURRENT_DATE - INTERVAL '30 days'
     ORDER BY s.joining_date DESC
     LIMIT 10`);
    const stats = overallStats.rows[0];
    const summary = {
        totalStaff: parseInt(stats.total_staff),
        activeStaff: parseInt(stats.active_staff),
        inactiveStaff: parseInt(stats.inactive_staff),
        departmentBreakdown: departmentStats.rows.map((row) => ({
            department: row.department,
            totalStaff: parseInt(row.total_staff),
            activeStaff: parseInt(row.active_staff),
            positions: row.positions || []
        })),
        recentJoinings: recentJoinings.rows.map((row) => ({
            staffId: row.id.toString(),
            name: row.name,
            department: row.department,
            position: row.position,
            joiningDate: row.joining_date
        }))
    };
    res.json({
        success: true,
        data: summary
    });
});
async function getStaffWithUser(staffId) {
    const result = await (0, connection_1.query)(`SELECT 
       s.*,
       u.first_name,
       u.last_name,
       u.email,
       u.phone,
       u.date_of_birth,
       u.address
     FROM staff s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = $1`, [staffId]);
    if (result.rows.length === 0) {
        return null;
    }
    return formatStaffResponse(result.rows[0]);
}
function formatStaffResponse(row) {
    return {
        id: row.id.toString(),
        altId: null,
        userId: row.user_id.toString(),
        employeeId: row.employee_id,
        department: row.department,
        position: row.position,
        joiningDate: row.joining_date,
        salary: row.salary ? parseFloat(row.salary) : null,
        responsibilities: row.responsibilities,
        isActive: row.is_active,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        user: {
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            phone: row.phone,
            dateOfBirth: row.date_of_birth,
            address: row.address,
        },
    };
}
function getSortColumn(sortBy) {
    const columnMap = {
        firstName: 'u.first_name',
        lastName: 'u.last_name',
        employeeId: 's.employee_id',
        department: 's.department',
        position: 's.position',
        joiningDate: 's.joining_date',
    };
    return columnMap[sortBy] || 'u.first_name';
}
//# sourceMappingURL=staffController.js.map
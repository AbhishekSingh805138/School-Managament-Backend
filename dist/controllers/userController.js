"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUserById = exports.getUsers = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
exports.getUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    console.log('Get users request received');
    const { page, limit, sortBy = 'created_at', sortOrder } = req.query;
    const offset = (page - 1) * limit;
    const countResult = await (0, connection_1.query)('SELECT COUNT(*) FROM users WHERE is_active = true');
    const total = parseInt(countResult.rows[0].count);
    const result = await (0, connection_1.query)(`SELECT id, first_name, last_name, email, role, phone, date_of_birth, address, is_active, created_at, updated_at
     FROM users 
     WHERE is_active = true
     ORDER BY ${sortBy} ${sortOrder}
     LIMIT $1 OFFSET $2`, [limit, offset]);
    const users = result.rows.map((user) => ({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        address: user.address,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
    }));
    res.json({
        success: true,
        data: users,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
});
exports.getUserById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    console.log('Get user by ID request received');
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(id);
    let result;
    if (isUUID) {
        result = await (0, connection_1.query)('SELECT id, first_name, last_name, email, role, phone, date_of_birth, address, is_active, created_at, updated_at FROM users WHERE id = $1', [id]);
    }
    else {
        result = await (0, connection_1.query)('SELECT id, first_name, last_name, email, role, phone, date_of_birth, address, is_active, created_at, updated_at FROM users WHERE alt_id = $1 OR id::text = $1', [id]);
    }
    if (result.rows.length === 0) {
        throw new errorHandler_1.AppError('User not found', 404);
    }
    const user = result.rows[0];
    res.json({
        success: true,
        data: {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            dateOfBirth: user.date_of_birth,
            address: user.address,
            isActive: user.is_active,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
        },
    });
});
exports.updateUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    console.log('Update user request received');
    const { id } = req.params;
    const updateData = req.body;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(id);
    let existingUser;
    if (isUUID) {
        existingUser = await (0, connection_1.query)('SELECT id FROM users WHERE id = $1', [id]);
    }
    else {
        existingUser = await (0, connection_1.query)('SELECT id FROM users WHERE alt_id = $1 OR id::text = $1', [id]);
    }
    if (existingUser.rows.length === 0) {
        throw new errorHandler_1.AppError('User not found', 404);
    }
    const actualUserId = existingUser.rows[0].id;
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
    if (updateData.email) {
        updateFields.push(`email = $${paramCount++}`);
        values.push(updateData.email);
    }
    if (updateData.role) {
        updateFields.push(`role = $${paramCount++}`);
        values.push(updateData.role);
    }
    if (updateData.phone !== undefined) {
        updateFields.push(`phone = $${paramCount++}`);
        values.push(updateData.phone);
    }
    if (updateData.dateOfBirth !== undefined) {
        updateFields.push(`date_of_birth = $${paramCount++}`);
        values.push(updateData.dateOfBirth);
    }
    if (updateData.address !== undefined) {
        updateFields.push(`address = $${paramCount++}`);
        values.push(updateData.address);
    }
    if (updateFields.length === 0) {
        throw new errorHandler_1.AppError('No fields to update', 400);
    }
    values.push(actualUserId);
    const result = await (0, connection_1.query)(`UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING id, first_name, last_name, email, role, phone, date_of_birth, address, is_active, created_at, updated_at`, values);
    const user = result.rows[0];
    res.json({
        success: true,
        message: 'User updated successfully',
        data: {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            dateOfBirth: user.date_of_birth,
            address: user.address,
            isActive: user.is_active,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
        },
    });
});
exports.deleteUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    console.log('Delete user request received');
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(id);
    let result;
    if (isUUID) {
        result = await (0, connection_1.query)('UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id', [id]);
    }
    else {
        result = await (0, connection_1.query)('UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE alt_id = $1 OR id::text = $1 RETURNING id', [id]);
    }
    if (result.rows.length === 0) {
        throw new errorHandler_1.AppError('User not found', 404);
    }
    res.json({
        success: true,
        message: 'User deleted successfully',
    });
});
//# sourceMappingURL=userController.js.map
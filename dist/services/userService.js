"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const baseService_1 = require("./baseService");
const errorHandler_1 = require("../middleware/errorHandler");
const pagination_1 = require("../utils/pagination");
const auth_1 = require("../utils/auth");
class UserService extends baseService_1.BaseService {
    async createUser(userData) {
        const existing = await this.executeQuery('SELECT 1 FROM users WHERE email = $1', [userData.email]);
        if (existing.rows.length > 0) {
            throw new errorHandler_1.AppError('User with this email already exists', 409);
        }
        const passwordHash = await (0, auth_1.hashPassword)(userData.password);
        const sequentialId = await this.generateSequentialId('users');
        const result = await this.executeQuery(`INSERT INTO users (first_name, last_name, email, password_hash, role, phone, date_of_birth, address, alt_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, first_name, last_name, email, role, phone, date_of_birth, address, is_active, created_at, updated_at`, [
            userData.firstName,
            userData.lastName,
            userData.email,
            passwordHash,
            userData.role,
            userData.phone || null,
            userData.dateOfBirth || null,
            userData.address || null,
            sequentialId,
        ]);
        return this.transformUserResponse(result.rows[0]);
    }
    async getUsers(req) {
        const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'created_at');
        const countResult = await this.executeQuery('SELECT COUNT(*) FROM users WHERE is_active = true');
        const total = parseInt(countResult.rows[0].count);
        const result = await this.executeQuery(`SELECT id, first_name, last_name, email, role, phone, date_of_birth, address, is_active, created_at, updated_at
       FROM users 
       WHERE is_active = true
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $1 OFFSET $2`, [limit, offset]);
        const users = result.rows.map((user) => this.transformUserResponse(user));
        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getUserById(id) {
        const user = await this.checkEntityExists('users', id, 'alt_id');
        return this.transformUserResponse(user);
    }
    async updateUser(id, updateData) {
        const existingUser = await this.checkEntityExists('users', id, 'alt_id');
        const actualUserId = existingUser.id;
        const { query: updateQuery, values } = this.buildUpdateQuery('users', updateData);
        values.push(actualUserId);
        const result = await this.executeQuery(updateQuery, values);
        return this.transformUserResponse(result.rows[0]);
    }
    async deleteUser(id) {
        const isUUID = this.validateUUID(id);
        let result;
        if (isUUID) {
            result = await this.executeQuery('UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id', [id]);
        }
        else {
            result = await this.executeQuery('UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE alt_id = $1 OR id::text = $1 RETURNING id', [id]);
        }
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        return { success: true };
    }
    transformUserResponse(user) {
        return {
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
        };
    }
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map
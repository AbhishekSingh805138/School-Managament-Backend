"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const baseService_1 = require("./baseService");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../utils/auth");
class AuthService extends baseService_1.BaseService {
    async register(userData) {
        const existingUser = await this.executeQuery('SELECT id FROM users WHERE email = $1', [userData.email]);
        if (existingUser.rows.length > 0) {
            throw new errorHandler_1.AppError('User with this email already exists', 409);
        }
        const passwordHash = await (0, auth_1.hashPassword)(userData.password);
        const sequentialId = await this.generateSequentialId('users');
        const result = await this.executeQuery(`INSERT INTO users (first_name, last_name, email, password_hash, role, phone, date_of_birth, address, alt_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, alt_id, first_name, last_name, email, role, phone, date_of_birth, address, is_active, created_at, updated_at`, [
            userData.firstName,
            userData.lastName,
            userData.email,
            passwordHash,
            userData.role || 'student',
            userData.phone || null,
            userData.dateOfBirth || null,
            userData.address || null,
            sequentialId
        ]);
        const user = result.rows[0];
        const token = (0, auth_1.generateToken)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        return {
            user: this.transformUserResponse(user),
            token,
        };
    }
    async login(loginData) {
        const result = await this.executeQuery('SELECT id, first_name, last_name, email, password_hash, role, is_active FROM users WHERE email = $1', [loginData.email]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('Invalid email or password', 401);
        }
        const user = result.rows[0];
        if (!user.is_active) {
            throw new errorHandler_1.AppError('Account is deactivated. Please contact administrator.', 401);
        }
        const isPasswordValid = await (0, auth_1.comparePassword)(loginData.password, user.password_hash);
        if (!isPasswordValid) {
            throw new errorHandler_1.AppError('Invalid email or password', 401);
        }
        const token = (0, auth_1.generateToken)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        return {
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                role: user.role,
            },
            token,
        };
    }
    async getCurrentUser(userId) {
        const result = await this.executeQuery('SELECT id, first_name, last_name, email, role, phone, date_of_birth, address, is_active, created_at, updated_at FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        return this.transformUserResponse(result.rows[0]);
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
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map
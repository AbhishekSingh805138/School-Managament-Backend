"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const baseService_1 = require("./baseService");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../utils/auth");
const rateLimitService_1 = require("./rateLimitService");
class AuthService extends baseService_1.BaseService {
    constructor() {
        super();
        this.rateLimitService = new rateLimitService_1.RateLimitService();
    }
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
        const tokens = (0, auth_1.generateTokens)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        await this.storeRefreshToken(user.id, tokens.refreshToken);
        return {
            user: this.transformUserResponse(user),
            token: tokens.accessToken,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
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
        const tokens = (0, auth_1.generateTokens)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        await this.storeRefreshToken(user.id, tokens.refreshToken);
        return {
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                role: user.role,
            },
            token: tokens.accessToken,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }
    async getCurrentUser(userId) {
        const result = await this.executeQuery('SELECT id, first_name, last_name, email, role, phone, date_of_birth, address, is_active, created_at, updated_at FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        return this.transformUserResponse(result.rows[0]);
    }
    async storeRefreshToken(userId, refreshToken) {
        await this.executeQuery('UPDATE refresh_tokens SET is_active = false WHERE user_id = $1', [userId]);
        await this.executeQuery(`INSERT INTO refresh_tokens (user_id, token, expires_at, is_active)
       VALUES ($1, $2, NOW() + INTERVAL '7 days', true)`, [userId, refreshToken]);
    }
    async refreshToken(refreshToken) {
        try {
            const decoded = (0, auth_1.verifyToken)(refreshToken);
            const tokenResult = await this.executeQuery(`SELECT rt.id, rt.user_id, u.email, u.role, u.is_active
         FROM refresh_tokens rt
         JOIN users u ON rt.user_id = u.id
         WHERE rt.token = $1 AND rt.is_active = true AND rt.expires_at > NOW()`, [refreshToken]);
            if (tokenResult.rows.length === 0) {
                throw new errorHandler_1.AppError('Invalid or expired refresh token', 401);
            }
            const tokenData = tokenResult.rows[0];
            if (!tokenData.is_active) {
                throw new errorHandler_1.AppError('User account is deactivated', 401);
            }
            const tokens = (0, auth_1.generateTokens)({
                id: tokenData.user_id,
                email: tokenData.email,
                role: tokenData.role,
            });
            await this.executeTransaction(async (client) => {
                await client.query('UPDATE refresh_tokens SET is_active = false WHERE token = $1', [refreshToken]);
                await client.query(`INSERT INTO refresh_tokens (user_id, token, expires_at, is_active)
           VALUES ($1, $2, NOW() + INTERVAL '7 days', true)`, [tokenData.user_id, tokens.refreshToken]);
            });
            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            };
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError) {
                throw error;
            }
            throw new errorHandler_1.AppError('Invalid refresh token', 401);
        }
    }
    async logout(refreshToken) {
        await this.executeQuery('UPDATE refresh_tokens SET is_active = false WHERE token = $1', [refreshToken]);
        return { success: true };
    }
    async logoutAll(userId) {
        await this.executeQuery('UPDATE refresh_tokens SET is_active = false WHERE user_id = $1', [userId]);
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
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map
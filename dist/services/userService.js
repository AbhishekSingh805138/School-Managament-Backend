"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const baseService_1 = require("./baseService");
const errorHandler_1 = require("../middleware/errorHandler");
const pagination_1 = require("../utils/pagination");
const auth_1 = require("../utils/auth");
const cacheService_1 = __importStar(require("./cacheService"));
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
        await cacheService_1.default.delPattern(`${cacheService_1.CacheKeys.USER_SESSION}*`);
        return this.transformUserResponse(result.rows[0]);
    }
    async getUsers(req) {
        const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'created_at');
        const cacheKey = `users:list:${page}:${limit}:${sortBy}:${sortOrder}`;
        return await cacheService_1.default.cacheQuery(cacheKey, async () => {
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
        }, cacheService_1.CacheTTL.FIVE_MINUTES);
    }
    async getUserById(id) {
        const cacheKey = `${cacheService_1.CacheKeys.USER_SESSION}:${id}`;
        return await cacheService_1.default.cacheQuery(cacheKey, async () => {
            const user = await this.checkEntityExists('users', id, 'alt_id');
            return this.transformUserResponse(user);
        }, cacheService_1.CacheTTL.TEN_MINUTES);
    }
    async updateUser(id, updateData) {
        const existingUser = await this.checkEntityExists('users', id, 'alt_id');
        const actualUserId = existingUser.id;
        const { query: updateQuery, values } = this.buildUpdateQuery('users', updateData);
        values.push(actualUserId);
        const result = await this.executeQuery(updateQuery, values);
        await cacheService_1.default.delPattern(`${cacheService_1.CacheKeys.USER_SESSION}*`);
        await cacheService_1.default.delPattern('users:list*');
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
        await cacheService_1.default.delPattern(`${cacheService_1.CacheKeys.USER_SESSION}*`);
        await cacheService_1.default.delPattern('users:list*');
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
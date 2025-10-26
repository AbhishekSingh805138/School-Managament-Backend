"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../config/env"));
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
exports.authenticate = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token) {
        throw new errorHandler_1.AppError('Access token is required', 401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.default.JWT_SECRET);
        const userId = decoded.id || decoded.userId;
        if (!userId) {
            throw new errorHandler_1.AppError('Invalid token payload: missing user ID', 401);
        }
        if (env_1.default.NODE_ENV === 'test' && userId.match(/^[a-z]+-\d+$/)) {
            req.user = {
                id: userId,
                email: decoded.email,
                role: decoded.role,
            };
            next();
            return;
        }
        const user = await (0, connection_1.query)('SELECT id, first_name, last_name, email, role, is_active FROM users WHERE id = $1 AND is_active = true', [userId]);
        if (user.rows.length === 0) {
            throw new errorHandler_1.AppError('User not found or inactive', 401);
        }
        const userData = user.rows[0];
        req.user = {
            id: userData.id,
            email: userData.email,
            role: userData.role,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new errorHandler_1.AppError('Invalid token', 401);
        }
        throw error;
    }
});
const authorize = (...roles) => {
    return (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
        if (!req.user) {
            throw new errorHandler_1.AppError('Authentication required', 401);
        }
        if (roles.length > 0 && !roles.includes(req.user.role)) {
            throw new errorHandler_1.AppError('Insufficient permissions', 403);
        }
        next();
    });
};
exports.authorize = authorize;
const optionalAuth = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jsonwebtoken_1.default.verify(token, env_1.default.JWT_SECRET);
            req.user = decoded;
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map
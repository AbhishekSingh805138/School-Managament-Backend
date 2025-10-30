"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitLogger = exports.bulkOperationRateLimit = exports.reportRateLimit = exports.searchRateLimit = exports.createCustomRateLimit = exports.speedLimiter = exports.adminRateLimit = exports.fileUploadRateLimit = exports.registrationRateLimit = exports.passwordResetRateLimit = exports.authRateLimit = exports.generalRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_slow_down_1 = __importDefault(require("express-slow-down"));
const env_1 = __importDefault(require("../config/env"));
const auditLogger_1 = require("./auditLogger");
const getRateLimitConfig = () => {
    const isProduction = env_1.default.NODE_ENV === 'production';
    const isTest = env_1.default.NODE_ENV === 'test';
    return {
        windowMs: isProduction ? env_1.default.RATE_LIMIT_WINDOW_MS : 60000,
        maxRequests: isProduction ? env_1.default.RATE_LIMIT_MAX_REQUESTS : 1000,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
        skip: () => false,
    };
};
const rateLimitHandler = (req, res) => {
    const config = getRateLimitConfig();
    auditLogger_1.auditSecurity.rateLimitExceeded(req, 'general');
    res.status(429).json({
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(config.windowMs / 1000),
        limit: config.maxRequests,
        windowMs: config.windowMs,
        ip: req.ip,
        timestamp: new Date().toISOString(),
    });
};
exports.generalRateLimit = (0, express_rate_limit_1.default)({
    windowMs: getRateLimitConfig().windowMs,
    max: getRateLimitConfig().maxRequests,
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    skip: getRateLimitConfig().skip,
});
exports.authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: env_1.default.NODE_ENV === 'production' ? 5 : 100,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many authentication attempts from this IP, please try again later.',
            error: 'AUTH_RATE_LIMIT_EXCEEDED',
            retryAfter: 900,
            limit: env_1.default.NODE_ENV === 'production' ? 5 : 100,
            windowMs: 15 * 60 * 1000,
            ip: req.ip,
            timestamp: new Date().toISOString(),
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: env_1.default.NODE_ENV === 'test' ? () => true : () => false,
});
exports.passwordResetRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: env_1.default.NODE_ENV === 'production' ? 3 : 50,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many password reset attempts from this IP, please try again later.',
            error: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
            retryAfter: 3600,
            limit: env_1.default.NODE_ENV === 'production' ? 3 : 50,
            windowMs: 60 * 60 * 1000,
            ip: req.ip,
            timestamp: new Date().toISOString(),
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: env_1.default.NODE_ENV === 'test' ? () => true : () => false,
});
exports.registrationRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: env_1.default.NODE_ENV === 'production' ? 10 : 100,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many registration attempts from this IP, please try again later.',
            error: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
            retryAfter: 3600,
            limit: env_1.default.NODE_ENV === 'production' ? 10 : 100,
            windowMs: 60 * 60 * 1000,
            ip: req.ip,
            timestamp: new Date().toISOString(),
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: env_1.default.NODE_ENV === 'test' ? () => true : () => false,
});
exports.fileUploadRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: env_1.default.NODE_ENV === 'production' ? 20 : 200,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many file upload attempts from this IP, please try again later.',
            error: 'FILE_UPLOAD_RATE_LIMIT_EXCEEDED',
            retryAfter: 900,
            limit: env_1.default.NODE_ENV === 'production' ? 20 : 200,
            windowMs: 15 * 60 * 1000,
            ip: req.ip,
            timestamp: new Date().toISOString(),
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: env_1.default.NODE_ENV === 'test' ? () => true : () => false,
});
exports.adminRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000,
    max: env_1.default.NODE_ENV === 'production' ? 100 : 1000,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many admin operations from this IP, please try again later.',
            error: 'ADMIN_RATE_LIMIT_EXCEEDED',
            retryAfter: 300,
            limit: env_1.default.NODE_ENV === 'production' ? 100 : 1000,
            windowMs: 5 * 60 * 1000,
            ip: req.ip,
            timestamp: new Date().toISOString(),
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: env_1.default.NODE_ENV === 'test' ? () => true : () => false,
});
exports.speedLimiter = (0, express_slow_down_1.default)({
    windowMs: 15 * 60 * 1000,
    delayAfter: env_1.default.NODE_ENV === 'production' ? 50 : 500,
    delayMs: 500,
    maxDelayMs: 20000,
    skip: env_1.default.NODE_ENV === 'test' ? () => true : () => false,
});
const createCustomRateLimit = (options) => {
    return (0, express_rate_limit_1.default)({
        windowMs: options.windowMs,
        max: options.max,
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                message: options.message,
                error: options.errorCode || 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil(options.windowMs / 1000),
                limit: options.max,
                windowMs: options.windowMs,
                ip: req.ip,
                timestamp: new Date().toISOString(),
            });
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: env_1.default.NODE_ENV === 'test' ? () => true : () => false,
    });
};
exports.createCustomRateLimit = createCustomRateLimit;
exports.searchRateLimit = (0, exports.createCustomRateLimit)({
    windowMs: 1 * 60 * 1000,
    max: env_1.default.NODE_ENV === 'production' ? 30 : 300,
    message: 'Too many search requests from this IP, please try again later.',
    errorCode: 'SEARCH_RATE_LIMIT_EXCEEDED',
});
exports.reportRateLimit = (0, exports.createCustomRateLimit)({
    windowMs: 10 * 60 * 1000,
    max: env_1.default.NODE_ENV === 'production' ? 10 : 100,
    message: 'Too many report generation requests from this IP, please try again later.',
    errorCode: 'REPORT_RATE_LIMIT_EXCEEDED',
});
exports.bulkOperationRateLimit = (0, exports.createCustomRateLimit)({
    windowMs: 30 * 60 * 1000,
    max: env_1.default.NODE_ENV === 'production' ? 5 : 50,
    message: 'Too many bulk operations from this IP, please try again later.',
    errorCode: 'BULK_OPERATION_RATE_LIMIT_EXCEEDED',
});
const rateLimitLogger = (req, res, next) => {
    const originalSend = res.send;
    res.send = function (data) {
        if (res.statusCode === 429) {
            console.warn('Rate limit exceeded:', {
                ip: req.ip,
                method: req.method,
                url: req.url,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString(),
                headers: req.headers,
            });
        }
        return originalSend.call(this, data);
    };
    next();
};
exports.rateLimitLogger = rateLimitLogger;
//# sourceMappingURL=rateLimiting.js.map
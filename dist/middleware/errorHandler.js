"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = exports.AuthError = exports.AppError = void 0;
const zod_1 = require("zod");
const env_1 = __importDefault(require("../config/env"));
class AppError extends Error {
    constructor(message, statusCode = 500, errorCode, context) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.errorCode = errorCode;
        this.context = context;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class AuthError extends AppError {
    constructor(message, statusCode = 401, errorCode, context) {
        super(message, statusCode, errorCode, context);
        this.attemptCount = context?.attemptCount;
        this.lockoutTime = context?.lockoutTime;
        this.ipAddress = context?.ipAddress;
        this.userAgent = context?.userAgent;
        this.remainingAttempts = context?.remainingAttempts;
    }
}
exports.AuthError = AuthError;
const logSecurityEvent = (event, details, req) => {
    const logData = {
        timestamp: new Date().toISOString(),
        event,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method,
        ...details,
    };
    if (env_1.default.NODE_ENV === 'production') {
        console.log('🔒 SECURITY EVENT:', JSON.stringify(logData));
    }
    else {
        console.warn('🔒 Security Event:', logData);
    }
};
const errorHandler = (error, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal server error';
    let details = undefined;
    let errorCode = undefined;
    if (error instanceof AuthError) {
        statusCode = error.statusCode;
        message = error.message;
        errorCode = error.errorCode;
        logSecurityEvent('AUTH_FAILURE', {
            errorCode: error.errorCode,
            message: error.message,
            attemptCount: error.attemptCount,
            lockoutTime: error.lockoutTime,
            context: error.context,
        }, req);
        if (error.attemptCount && error.attemptCount > 3) {
            details = {
                attemptCount: error.attemptCount,
                lockoutTime: error.lockoutTime,
                message: 'Multiple failed attempts detected. Account may be temporarily locked.',
            };
        }
    }
    else if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
        errorCode = error.errorCode;
        if (statusCode === 401 || statusCode === 403) {
            logSecurityEvent('AUTH_ERROR', {
                errorCode: error.errorCode,
                message: error.message,
                context: error.context,
            }, req);
        }
    }
    else if (error instanceof zod_1.ZodError) {
        statusCode = 400;
        message = 'Validation error';
        errorCode = 'VALIDATION_ERROR';
        details = error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
        }));
    }
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid authentication token';
        errorCode = 'INVALID_TOKEN';
        logSecurityEvent('INVALID_TOKEN', {
            error: error.message,
        }, req);
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication token has expired';
        errorCode = 'TOKEN_EXPIRED';
        logSecurityEvent('TOKEN_EXPIRED', {
            error: error.message,
        }, req);
    }
    else if (error.message.includes('duplicate key value')) {
        statusCode = 409;
        message = 'Resource already exists';
        errorCode = 'DUPLICATE_RESOURCE';
    }
    else if (error.message.includes('foreign key constraint')) {
        statusCode = 400;
        message = 'Invalid reference to related resource';
        errorCode = 'INVALID_REFERENCE';
    }
    else if (error.message.includes('connection')) {
        statusCode = 503;
        message = 'Service temporarily unavailable';
        errorCode = 'SERVICE_UNAVAILABLE';
    }
    if (env_1.default.NODE_ENV === 'development') {
        console.error('❌ Error:', {
            message: error.message,
            stack: error.stack,
            statusCode,
            errorCode,
        });
    }
    else {
        console.error('❌ Error:', {
            message: statusCode >= 500 ? 'Internal server error' : message,
            statusCode,
            errorCode,
            timestamp: new Date().toISOString(),
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
        });
    }
    const sanitizedMessage = env_1.default.NODE_ENV === 'production' && statusCode >= 500
        ? 'Internal server error'
        : message;
    res.status(statusCode).json({
        success: false,
        message: sanitizedMessage,
        ...(errorCode && { errorCode }),
        ...(details && { details }),
        ...(env_1.default.NODE_ENV === 'development' && { stack: error.stack }),
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
};
exports.notFoundHandler = notFoundHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map
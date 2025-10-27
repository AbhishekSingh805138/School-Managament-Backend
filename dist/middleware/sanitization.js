"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateContentType = exports.addSecurityHeaders = exports.sanitizeTeacher = exports.sanitizeClass = exports.sanitizeSubject = exports.sanitizeSemester = exports.sanitizeAcademicYear = exports.sanitizeUser = exports.createEntitySanitizer = exports.sanitizeInputs = void 0;
const sanitization_1 = require("../utils/sanitization");
const sanitizeInputs = (req, res, next) => {
    try {
        if (req.body && typeof req.body === 'object') {
            req.body = (0, sanitization_1.sanitizeObject)(req.body);
        }
        if (req.query && typeof req.query === 'object') {
            req.query = (0, sanitization_1.sanitizeObject)(req.query);
        }
        if (req.params && typeof req.params === 'object') {
            req.params = (0, sanitization_1.sanitizeObject)(req.params);
        }
        next();
    }
    catch (error) {
        console.error('Error in input sanitization middleware:', error);
        next();
    }
};
exports.sanitizeInputs = sanitizeInputs;
const createEntitySanitizer = (entityType) => {
    return (req, res, next) => {
        try {
            if (req.body && typeof req.body === 'object') {
                const fieldDefinitions = sanitization_1.FIELD_DEFINITIONS[entityType];
                req.body = (0, sanitization_1.sanitizeRequestBody)(req.body, fieldDefinitions);
            }
            if (req.query && typeof req.query === 'object') {
                req.query = (0, sanitization_1.sanitizeObject)(req.query);
            }
            if (req.params && typeof req.params === 'object') {
                req.params = (0, sanitization_1.sanitizeObject)(req.params);
            }
            next();
        }
        catch (error) {
            console.error(`Error in ${entityType} sanitization middleware:`, error);
            next();
        }
    };
};
exports.createEntitySanitizer = createEntitySanitizer;
exports.sanitizeUser = (0, exports.createEntitySanitizer)('user');
exports.sanitizeAcademicYear = (0, exports.createEntitySanitizer)('academicYear');
exports.sanitizeSemester = (0, exports.createEntitySanitizer)('semester');
exports.sanitizeSubject = (0, exports.createEntitySanitizer)('subject');
exports.sanitizeClass = (0, exports.createEntitySanitizer)('class');
exports.sanitizeTeacher = (0, exports.createEntitySanitizer)('teacher');
const addSecurityHeaders = (req, res, next) => {
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';");
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
};
exports.addSecurityHeaders = addSecurityHeaders;
const validateContentType = (req, res, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('application/json')) {
            return res.status(400).json({
                success: false,
                message: 'Content-Type must be application/json',
            });
        }
    }
    return next();
};
exports.validateContentType = validateContentType;
//# sourceMappingURL=sanitization.js.map
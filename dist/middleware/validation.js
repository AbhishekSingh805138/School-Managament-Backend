"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validateBody = exports.validate = void 0;
const zod_1 = require("zod");
const validate = (schema) => {
    return (req, res, next) => {
        try {
            const validatedData = schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            if (validatedData.body) {
                req.body = validatedData.body;
            }
            if (validatedData.query) {
                Object.keys(req.query).forEach(key => delete req.query[key]);
                Object.assign(req.query, validatedData.query);
            }
            if (validatedData.params) {
                Object.keys(req.params).forEach(key => delete req.params[key]);
                Object.assign(req.params, validatedData.params);
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errorMessages = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errorMessages,
                });
                return;
            }
            next(error);
        }
    };
};
exports.validate = validate;
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            console.log('Validating body:', req.body);
            req.body = schema.parse(req.body);
            console.log('Validation passed');
            next();
        }
        catch (error) {
            console.log('Validation error:', error);
            if (error instanceof zod_1.ZodError) {
                console.log('Zod errors:', error.errors);
                const errorMessages = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errorMessages,
                });
                return;
            }
            next(error);
        }
    };
};
exports.validateBody = validateBody;
const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            const validatedQuery = schema.parse(req.query);
            Object.keys(req.query).forEach(key => delete req.query[key]);
            Object.assign(req.query, validatedQuery);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errorMessages = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                res.status(400).json({
                    success: false,
                    message: 'Query validation failed',
                    errors: errorMessages,
                });
                return;
            }
            next(error);
        }
    };
};
exports.validateQuery = validateQuery;
const validateParams = (schema) => {
    return (req, res, next) => {
        try {
            const validatedParams = schema.parse(req.params);
            Object.keys(req.params).forEach(key => delete req.params[key]);
            Object.assign(req.params, validatedParams);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errorMessages = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                res.status(400).json({
                    success: false,
                    message: 'Parameter validation failed',
                    errors: errorMessages,
                });
                return;
            }
            next(error);
        }
    };
};
exports.validateParams = validateParams;
//# sourceMappingURL=validation.js.map
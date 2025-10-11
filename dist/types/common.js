"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginatedResponseSchema = exports.ErrorResponseSchema = exports.SuccessResponseSchema = exports.PhoneSchema = exports.EmailSchema = exports.DateSchema = exports.PaginationSchema = exports.IdSchema = void 0;
const zod_1 = require("zod");
exports.IdSchema = zod_1.z.string().min(1, 'ID is required').refine((id) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isNumber = /^\d+$/.test(id);
    return uuidRegex.test(id) || isNumber || id.length > 0;
}, 'Invalid ID format');
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.string().optional().default('1').transform(Number),
    limit: zod_1.z.string().optional().default('10').transform(Number),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('asc'),
});
exports.DateSchema = zod_1.z.string().refine((date) => {
    return !isNaN(Date.parse(date));
}, 'Invalid date format');
exports.EmailSchema = zod_1.z.string().email('Invalid email format');
exports.PhoneSchema = zod_1.z.string().min(10, 'Phone number must be at least 10 characters');
exports.SuccessResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean().default(true),
    message: zod_1.z.string(),
    data: zod_1.z.any().optional(),
});
exports.ErrorResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean().default(false),
    message: zod_1.z.string(),
    error: zod_1.z.string().optional(),
    details: zod_1.z.any().optional(),
});
exports.PaginatedResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean().default(true),
    data: zod_1.z.array(zod_1.z.any()),
    pagination: zod_1.z.object({
        page: zod_1.z.number(),
        limit: zod_1.z.number(),
        total: zod_1.z.number(),
        totalPages: zod_1.z.number(),
    }),
});
//# sourceMappingURL=common.js.map
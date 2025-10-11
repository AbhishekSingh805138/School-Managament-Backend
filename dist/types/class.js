"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassResponseSchema = exports.UpdateClassSchema = exports.CreateClassSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.CreateClassSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Class name is required'),
    grade: zod_1.z.string().min(1, 'Grade is required'),
    section: zod_1.z.string().min(1, 'Section is required'),
    teacherId: common_1.IdSchema,
    capacity: zod_1.z.number().min(1, 'Capacity must be at least 1'),
    room: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
});
exports.UpdateClassSchema = exports.CreateClassSchema.partial();
exports.ClassResponseSchema = zod_1.z.object({
    id: common_1.IdSchema,
    name: zod_1.z.string(),
    grade: zod_1.z.string(),
    section: zod_1.z.string(),
    teacherId: common_1.IdSchema,
    capacity: zod_1.z.number(),
    currentEnrollment: zod_1.z.number(),
    room: zod_1.z.string().nullable(),
    description: zod_1.z.string().nullable(),
    isActive: zod_1.z.boolean(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    teacher: zod_1.z.object({
        firstName: zod_1.z.string(),
        lastName: zod_1.z.string(),
        email: zod_1.z.string(),
    }).optional(),
});
//# sourceMappingURL=class.js.map
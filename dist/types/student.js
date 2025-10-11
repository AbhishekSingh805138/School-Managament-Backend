"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentResponseSchema = exports.UpdateStudentSchema = exports.CreateStudentSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.CreateStudentSchema = zod_1.z.object({
    userId: common_1.IdSchema,
    studentId: zod_1.z.string().min(1, 'Student ID is required'),
    classId: common_1.IdSchema,
    enrollmentDate: common_1.DateSchema,
    guardianName: zod_1.z.string().min(2, 'Guardian name must be at least 2 characters'),
    guardianPhone: zod_1.z.string().min(10, 'Guardian phone must be at least 10 characters'),
    guardianEmail: zod_1.z.string().email('Invalid guardian email').optional(),
    emergencyContact: zod_1.z.string().min(10, 'Emergency contact is required'),
    medicalInfo: zod_1.z.string().optional(),
});
exports.UpdateStudentSchema = exports.CreateStudentSchema.partial().omit({ userId: true });
exports.StudentResponseSchema = zod_1.z.object({
    id: common_1.IdSchema,
    userId: common_1.IdSchema,
    studentId: zod_1.z.string(),
    classId: common_1.IdSchema,
    enrollmentDate: zod_1.z.string(),
    guardianName: zod_1.z.string(),
    guardianPhone: zod_1.z.string(),
    guardianEmail: zod_1.z.string().nullable(),
    emergencyContact: zod_1.z.string(),
    medicalInfo: zod_1.z.string().nullable(),
    isActive: zod_1.z.boolean(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    user: zod_1.z.object({
        firstName: zod_1.z.string(),
        lastName: zod_1.z.string(),
        email: zod_1.z.string(),
        phone: zod_1.z.string().nullable(),
    }).optional(),
    class: zod_1.z.object({
        name: zod_1.z.string(),
        grade: zod_1.z.string(),
    }).optional(),
});
//# sourceMappingURL=student.js.map
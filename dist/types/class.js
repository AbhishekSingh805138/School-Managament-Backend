"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassEnrollmentHistoryQuerySchema = exports.ClassEnrollmentHistorySchema = exports.ClassTeacherAssignmentSchema = exports.UpdateClassTeacherSchema = exports.ClassRosterQuerySchema = exports.TransferStudentSchema = exports.BulkEnrollStudentsSchema = exports.EnrollStudentSchema = exports.ClassResponseSchema = exports.UpdateClassSchema = exports.CreateClassSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.CreateClassSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Class name is required'),
    grade: zod_1.z.string().min(1, 'Grade is required'),
    section: zod_1.z.string().min(1, 'Section is required'),
    teacherId: common_1.IdSchema,
    capacity: zod_1.z.number().min(1, 'Capacity must be at least 1'),
    academicYearId: common_1.IdSchema,
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
    academicYearId: common_1.IdSchema,
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
    academicYear: zod_1.z.object({
        name: zod_1.z.string(),
        startDate: zod_1.z.string(),
        endDate: zod_1.z.string(),
    }).optional(),
});
exports.EnrollStudentSchema = zod_1.z.object({
    studentId: common_1.IdSchema,
    enrollmentDate: zod_1.z.string().datetime().optional(),
});
exports.BulkEnrollStudentsSchema = zod_1.z.object({
    studentIds: zod_1.z.array(common_1.IdSchema).min(1, 'At least one student ID is required'),
    enrollmentDate: zod_1.z.string().datetime().optional(),
});
exports.TransferStudentSchema = zod_1.z.object({
    studentId: common_1.IdSchema,
    newClassId: common_1.IdSchema,
    transferDate: zod_1.z.string().datetime().optional(),
    reason: zod_1.z.string().optional(),
});
exports.ClassRosterQuerySchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
    enrollmentDateFrom: zod_1.z.string().datetime().optional(),
    enrollmentDateTo: zod_1.z.string().datetime().optional(),
    sortBy: zod_1.z.enum(['firstName', 'lastName', 'studentId', 'enrollmentDate']).optional().default('firstName'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('asc'),
});
exports.UpdateClassTeacherSchema = zod_1.z.object({
    teacherId: common_1.IdSchema,
});
exports.ClassTeacherAssignmentSchema = zod_1.z.object({
    teacherId: common_1.IdSchema,
    firstName: zod_1.z.string(),
    lastName: zod_1.z.string(),
    email: zod_1.z.string(),
    subjectsCount: zod_1.z.number().optional(),
    subjects: zod_1.z.array(zod_1.z.string()).optional(),
    isClassTeacher: zod_1.z.boolean().optional(),
});
exports.ClassEnrollmentHistorySchema = zod_1.z.object({
    id: common_1.IdSchema,
    studentId: common_1.IdSchema,
    studentNumber: zod_1.z.string(),
    studentName: zod_1.z.string(),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string().nullable(),
    isCurrentlyEnrolled: zod_1.z.boolean(),
    academicYear: zod_1.z.object({
        name: zod_1.z.string(),
        startDate: zod_1.z.string(),
        endDate: zod_1.z.string(),
    }),
});
exports.ClassEnrollmentHistoryQuerySchema = zod_1.z.object({
    academicYearId: common_1.IdSchema.optional(),
});
//# sourceMappingURL=class.js.map
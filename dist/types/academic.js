"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassSubjectResponseSchema = exports.CreateClassSubjectSchema = exports.SubjectResponseSchema = exports.UpdateSubjectSchema = exports.CreateSubjectSchema = exports.SemesterResponseSchema = exports.UpdateSemesterSchema = exports.CreateSemesterSchema = exports.AcademicYearResponseSchema = exports.UpdateAcademicYearSchema = exports.CreateAcademicYearSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
const BaseAcademicYearSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Academic year name is required'),
    startDate: common_1.DateSchema,
    endDate: common_1.DateSchema,
    isActive: zod_1.z.boolean().optional().default(false),
});
exports.CreateAcademicYearSchema = BaseAcademicYearSchema.refine((data) => {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    return endDate > startDate;
}, {
    message: 'End date must be after start date',
    path: ['endDate'],
});
exports.UpdateAcademicYearSchema = BaseAcademicYearSchema.partial().refine((data) => {
    if (data.startDate && data.endDate) {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        return endDate > startDate;
    }
    return true;
}, {
    message: 'End date must be after start date',
    path: ['endDate'],
});
exports.AcademicYearResponseSchema = zod_1.z.object({
    id: common_1.IdSchema,
    altId: zod_1.z.string().nullable(),
    name: zod_1.z.string(),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string(),
    isActive: zod_1.z.boolean(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
const BaseSemesterSchema = zod_1.z.object({
    academicYearId: common_1.IdSchema,
    name: zod_1.z.string().min(1, 'Semester name is required'),
    startDate: common_1.DateSchema,
    endDate: common_1.DateSchema,
    isActive: zod_1.z.boolean().optional().default(false),
});
exports.CreateSemesterSchema = BaseSemesterSchema.refine((data) => {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    return endDate > startDate;
}, {
    message: 'End date must be after start date',
    path: ['endDate'],
});
exports.UpdateSemesterSchema = BaseSemesterSchema.omit({ academicYearId: true }).partial().refine((data) => {
    if (data.startDate && data.endDate) {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        return endDate > startDate;
    }
    return true;
}, {
    message: 'End date must be after start date',
    path: ['endDate'],
});
exports.SemesterResponseSchema = zod_1.z.object({
    id: common_1.IdSchema,
    altId: zod_1.z.string().nullable(),
    academicYearId: common_1.IdSchema,
    name: zod_1.z.string(),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string(),
    isActive: zod_1.z.boolean(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    academicYear: zod_1.z.object({
        name: zod_1.z.string(),
        startDate: zod_1.z.string(),
        endDate: zod_1.z.string(),
    }).optional(),
});
exports.CreateSubjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Subject name is required'),
    code: zod_1.z.string().min(1, 'Subject code is required').max(20, 'Subject code must be at most 20 characters'),
    description: zod_1.z.string().optional(),
    creditHours: zod_1.z.number().min(1, 'Credit hours must be at least 1').optional().default(1),
});
exports.UpdateSubjectSchema = exports.CreateSubjectSchema.partial();
exports.SubjectResponseSchema = zod_1.z.object({
    id: common_1.IdSchema,
    altId: zod_1.z.string().nullable(),
    name: zod_1.z.string(),
    code: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    creditHours: zod_1.z.number(),
    isActive: zod_1.z.boolean(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.CreateClassSubjectSchema = zod_1.z.object({
    classId: common_1.IdSchema,
    subjectId: common_1.IdSchema,
    teacherId: common_1.IdSchema,
});
exports.ClassSubjectResponseSchema = zod_1.z.object({
    id: common_1.IdSchema,
    classId: common_1.IdSchema,
    subjectId: common_1.IdSchema,
    teacherId: common_1.IdSchema,
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    class: zod_1.z.object({
        name: zod_1.z.string(),
        grade: zod_1.z.string(),
        section: zod_1.z.string(),
    }).optional(),
    subject: zod_1.z.object({
        name: zod_1.z.string(),
        code: zod_1.z.string(),
    }).optional(),
    teacher: zod_1.z.object({
        firstName: zod_1.z.string(),
        lastName: zod_1.z.string(),
        email: zod_1.z.string(),
    }).optional(),
});
//# sourceMappingURL=academic.js.map
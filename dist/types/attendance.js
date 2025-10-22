"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceReportSchema = exports.AttendanceReportItemSchema = exports.ClassAttendanceSummarySchema = exports.StudentAttendanceSummarySchema = exports.AttendanceQuerySchema = exports.CreateBulkAttendanceSchema = exports.BulkAttendanceItemSchema = exports.AttendanceResponseSchema = exports.UpdateAttendanceSchema = exports.CreateAttendanceSchema = exports.AttendanceStatusSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.AttendanceStatusSchema = zod_1.z.enum(['present', 'absent', 'late', 'excused']);
exports.CreateAttendanceSchema = zod_1.z.object({
    studentId: common_1.IdSchema,
    classId: common_1.IdSchema,
    subjectId: common_1.IdSchema.optional(),
    date: common_1.DateSchema,
    status: exports.AttendanceStatusSchema,
    remarks: zod_1.z.string().optional(),
});
exports.UpdateAttendanceSchema = zod_1.z.object({
    status: exports.AttendanceStatusSchema,
    remarks: zod_1.z.string().optional(),
});
exports.AttendanceResponseSchema = zod_1.z.object({
    id: common_1.IdSchema,
    altId: zod_1.z.string().nullable(),
    studentId: common_1.IdSchema,
    classId: common_1.IdSchema,
    subjectId: common_1.IdSchema.nullable(),
    date: zod_1.z.string(),
    status: exports.AttendanceStatusSchema,
    markedBy: common_1.IdSchema,
    markedAt: zod_1.z.string(),
    remarks: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    student: zod_1.z.object({
        studentId: zod_1.z.string(),
        user: zod_1.z.object({
            firstName: zod_1.z.string(),
            lastName: zod_1.z.string(),
        }),
    }).optional(),
    class: zod_1.z.object({
        name: zod_1.z.string(),
        grade: zod_1.z.string(),
        section: zod_1.z.string(),
    }).optional(),
    subject: zod_1.z.object({
        name: zod_1.z.string(),
        code: zod_1.z.string(),
    }).optional(),
    markedByUser: zod_1.z.object({
        firstName: zod_1.z.string(),
        lastName: zod_1.z.string(),
    }).optional(),
});
exports.BulkAttendanceItemSchema = zod_1.z.object({
    studentId: common_1.IdSchema,
    status: exports.AttendanceStatusSchema,
    remarks: zod_1.z.string().optional(),
});
exports.CreateBulkAttendanceSchema = zod_1.z.object({
    classId: common_1.IdSchema,
    subjectId: common_1.IdSchema.optional(),
    date: common_1.DateSchema,
    attendance: zod_1.z.array(exports.BulkAttendanceItemSchema).min(1, 'At least one attendance record is required'),
});
exports.AttendanceQuerySchema = zod_1.z.object({
    studentId: common_1.IdSchema.optional(),
    classId: common_1.IdSchema.optional(),
    subjectId: common_1.IdSchema.optional(),
    startDate: common_1.DateSchema.optional(),
    endDate: common_1.DateSchema.optional(),
    status: exports.AttendanceStatusSchema.optional(),
    page: zod_1.z.string().optional().default('1').transform(Number),
    limit: zod_1.z.string().optional().default('10').transform(Number),
});
exports.StudentAttendanceSummarySchema = zod_1.z.object({
    studentId: common_1.IdSchema,
    totalDays: zod_1.z.number(),
    presentDays: zod_1.z.number(),
    absentDays: zod_1.z.number(),
    lateDays: zod_1.z.number(),
    excusedDays: zod_1.z.number(),
    attendancePercentage: zod_1.z.number(),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string(),
});
exports.ClassAttendanceSummarySchema = zod_1.z.object({
    classId: common_1.IdSchema,
    date: zod_1.z.string(),
    totalStudents: zod_1.z.number(),
    presentCount: zod_1.z.number(),
    absentCount: zod_1.z.number(),
    lateCount: zod_1.z.number(),
    excusedCount: zod_1.z.number(),
    attendancePercentage: zod_1.z.number(),
});
exports.AttendanceReportItemSchema = zod_1.z.object({
    studentId: common_1.IdSchema,
    studentName: zod_1.z.string(),
    className: zod_1.z.string(),
    totalDays: zod_1.z.number(),
    presentDays: zod_1.z.number(),
    absentDays: zod_1.z.number(),
    lateDays: zod_1.z.number(),
    excusedDays: zod_1.z.number(),
    attendancePercentage: zod_1.z.number(),
});
exports.AttendanceReportSchema = zod_1.z.object({
    reportType: zod_1.z.string(),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string(),
    generatedAt: zod_1.z.string(),
    data: zod_1.z.array(exports.AttendanceReportItemSchema),
    summary: zod_1.z.object({
        totalStudents: zod_1.z.number(),
        averageAttendance: zod_1.z.number(),
        totalDays: zod_1.z.number(),
    }),
});
//# sourceMappingURL=attendance.js.map
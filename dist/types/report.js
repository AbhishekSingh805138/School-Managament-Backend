"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportQuerySchema = exports.DashboardReportSchema = exports.ReportHistorySchema = exports.ScheduledReportResponseSchema = exports.UpdateScheduledReportSchema = exports.CreateScheduledReportSchema = exports.ReportResponseSchema = exports.ReportSummarySchema = exports.ReportMetadataSchema = exports.TeacherWorkloadReportQuerySchema = exports.EnrollmentReportQuerySchema = exports.FinancialReportQuerySchema = exports.AcademicReportQuerySchema = exports.AttendanceReportQuerySchema = exports.BaseReportQuerySchema = exports.ReportFrequencySchema = exports.ReportFormatSchema = exports.ReportTypeSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.ReportTypeSchema = zod_1.z.enum([
    'attendance',
    'academic',
    'financial',
    'enrollment',
    'teacher_workload',
    'class_performance',
    'fee_collection',
    'student_progress',
    'custom'
]);
exports.ReportFormatSchema = zod_1.z.enum(['json', 'csv', 'pdf', 'excel']);
exports.ReportFrequencySchema = zod_1.z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'semester', 'annual', 'custom']);
exports.BaseReportQuerySchema = zod_1.z.object({
    reportType: exports.ReportTypeSchema,
    startDate: common_1.DateSchema,
    endDate: common_1.DateSchema,
    format: exports.ReportFormatSchema.optional().default('json'),
    includeInactive: zod_1.z.boolean().optional().default(false),
});
exports.AttendanceReportQuerySchema = exports.BaseReportQuerySchema.extend({
    reportType: zod_1.z.literal('attendance'),
    classId: common_1.IdSchema.optional(),
    studentId: common_1.IdSchema.optional(),
    subjectId: common_1.IdSchema.optional(),
    status: zod_1.z.enum(['present', 'absent', 'late', 'excused']).optional(),
    groupBy: zod_1.z.enum(['student', 'class', 'date', 'subject']).optional().default('student'),
    minAttendancePercentage: zod_1.z.number().min(0).max(100).optional(),
});
exports.AcademicReportQuerySchema = exports.BaseReportQuerySchema.extend({
    reportType: zod_1.z.literal('academic'),
    classId: common_1.IdSchema.optional(),
    subjectId: common_1.IdSchema.optional(),
    semesterId: common_1.IdSchema,
    assessmentTypeId: common_1.IdSchema.optional(),
    groupBy: zod_1.z.enum(['student', 'subject', 'class', 'assessment']).optional().default('student'),
    minPercentage: zod_1.z.number().min(0).max(100).optional(),
    gradeLetter: zod_1.z.enum(['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']).optional(),
});
exports.FinancialReportQuerySchema = exports.BaseReportQuerySchema.extend({
    reportType: zod_1.z.literal('financial'),
    classId: common_1.IdSchema.optional(),
    feeCategoryId: common_1.IdSchema.optional(),
    paymentMethod: zod_1.z.enum(['cash', 'card', 'bank_transfer', 'cheque', 'online', 'upi']).optional(),
    status: zod_1.z.enum(['pending', 'partial', 'paid', 'overdue', 'waived']).optional(),
    groupBy: zod_1.z.enum(['student', 'class', 'category', 'date', 'method']).optional().default('student'),
});
exports.EnrollmentReportQuerySchema = exports.BaseReportQuerySchema.extend({
    reportType: zod_1.z.literal('enrollment'),
    classId: common_1.IdSchema.optional(),
    academicYearId: common_1.IdSchema.optional(),
    groupBy: zod_1.z.enum(['class', 'grade', 'month', 'academic_year']).optional().default('class'),
});
exports.TeacherWorkloadReportQuerySchema = exports.BaseReportQuerySchema.extend({
    reportType: zod_1.z.literal('teacher_workload'),
    teacherId: common_1.IdSchema.optional(),
    subjectId: common_1.IdSchema.optional(),
    groupBy: zod_1.z.enum(['teacher', 'subject', 'class']).optional().default('teacher'),
});
exports.ReportMetadataSchema = zod_1.z.object({
    reportId: common_1.IdSchema,
    reportType: exports.ReportTypeSchema,
    title: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    generatedBy: common_1.IdSchema,
    generatedAt: zod_1.z.string(),
    parameters: zod_1.z.record(zod_1.z.any()),
    format: exports.ReportFormatSchema,
    fileSize: zod_1.z.number().optional(),
    downloadUrl: zod_1.z.string().optional(),
});
exports.ReportSummarySchema = zod_1.z.object({
    totalRecords: zod_1.z.number(),
    dateRange: zod_1.z.object({
        startDate: zod_1.z.string(),
        endDate: zod_1.z.string(),
    }),
    filters: zod_1.z.record(zod_1.z.any()),
    aggregations: zod_1.z.record(zod_1.z.any()),
});
exports.ReportResponseSchema = zod_1.z.object({
    metadata: exports.ReportMetadataSchema,
    summary: exports.ReportSummarySchema,
    data: zod_1.z.array(zod_1.z.record(zod_1.z.any())),
    charts: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(['bar', 'line', 'pie', 'area', 'scatter']),
        title: zod_1.z.string(),
        data: zod_1.z.array(zod_1.z.record(zod_1.z.any())),
        config: zod_1.z.record(zod_1.z.any()).optional(),
    })).optional(),
});
exports.CreateScheduledReportSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Report name is required'),
    description: zod_1.z.string().optional(),
    reportType: exports.ReportTypeSchema,
    parameters: zod_1.z.record(zod_1.z.any()),
    frequency: exports.ReportFrequencySchema,
    format: exports.ReportFormatSchema,
    recipients: zod_1.z.array(zod_1.z.string().email()).min(1, 'At least one recipient is required'),
    isActive: zod_1.z.boolean().optional().default(true),
    nextRunDate: common_1.DateSchema.optional(),
});
exports.UpdateScheduledReportSchema = exports.CreateScheduledReportSchema.partial();
exports.ScheduledReportResponseSchema = zod_1.z.object({
    id: common_1.IdSchema,
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    reportType: exports.ReportTypeSchema,
    parameters: zod_1.z.record(zod_1.z.any()),
    frequency: exports.ReportFrequencySchema,
    format: exports.ReportFormatSchema,
    recipients: zod_1.z.array(zod_1.z.string()),
    isActive: zod_1.z.boolean(),
    nextRunDate: zod_1.z.string().nullable(),
    lastRunDate: zod_1.z.string().nullable(),
    createdBy: common_1.IdSchema,
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    createdByUser: zod_1.z.object({
        firstName: zod_1.z.string(),
        lastName: zod_1.z.string(),
    }).optional(),
});
exports.ReportHistorySchema = zod_1.z.object({
    id: common_1.IdSchema,
    scheduledReportId: common_1.IdSchema.optional(),
    reportType: exports.ReportTypeSchema,
    title: zod_1.z.string(),
    parameters: zod_1.z.record(zod_1.z.any()),
    format: exports.ReportFormatSchema,
    status: zod_1.z.enum(['pending', 'generating', 'completed', 'failed']),
    fileSize: zod_1.z.number().nullable(),
    downloadUrl: zod_1.z.string().nullable(),
    generatedBy: common_1.IdSchema,
    generatedAt: zod_1.z.string(),
    expiresAt: zod_1.z.string().optional(),
    error: zod_1.z.string().nullable(),
});
exports.DashboardReportSchema = zod_1.z.object({
    overview: zod_1.z.object({
        totalStudents: zod_1.z.number(),
        totalTeachers: zod_1.z.number(),
        totalClasses: zod_1.z.number(),
        totalStaff: zod_1.z.number(),
        activeAcademicYear: zod_1.z.string(),
        currentSemester: zod_1.z.string(),
    }),
    attendance: zod_1.z.object({
        todayAttendance: zod_1.z.number(),
        weeklyAverage: zod_1.z.number(),
        monthlyAverage: zod_1.z.number(),
        lowAttendanceStudents: zod_1.z.number(),
    }),
    academic: zod_1.z.object({
        averageGrade: zod_1.z.string(),
        topPerformingClass: zod_1.z.string(),
        studentsNeedingAttention: zod_1.z.number(),
        recentAssessments: zod_1.z.number(),
    }),
    financial: zod_1.z.object({
        totalFeesCollected: zod_1.z.number(),
        pendingFees: zod_1.z.number(),
        overdueFees: zod_1.z.number(),
        collectionPercentage: zod_1.z.number(),
    }),
    recent: zod_1.z.object({
        newEnrollments: zod_1.z.array(zod_1.z.object({
            studentName: zod_1.z.string(),
            className: zod_1.z.string(),
            enrollmentDate: zod_1.z.string(),
        })),
        recentPayments: zod_1.z.array(zod_1.z.object({
            studentName: zod_1.z.string(),
            amount: zod_1.z.number(),
            paymentDate: zod_1.z.string(),
        })),
        upcomingEvents: zod_1.z.array(zod_1.z.object({
            title: zod_1.z.string(),
            date: zod_1.z.string(),
            type: zod_1.z.string(),
        })),
    }),
});
exports.ReportQuerySchema = zod_1.z.object({
    reportType: exports.ReportTypeSchema.optional(),
    generatedBy: common_1.IdSchema.optional(),
    startDate: common_1.DateSchema.optional(),
    endDate: common_1.DateSchema.optional(),
    status: zod_1.z.enum(['pending', 'generating', 'completed', 'failed']).optional(),
    page: zod_1.z.string().optional().default('1').transform(Number),
    limit: zod_1.z.string().optional().default('10').transform(Number),
    sortBy: zod_1.z.enum(['generatedAt', 'reportType', 'title']).optional().default('generatedAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
//# sourceMappingURL=report.js.map
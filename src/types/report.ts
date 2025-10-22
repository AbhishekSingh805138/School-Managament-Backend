import { z } from 'zod';
import { IdSchema, DateSchema } from './common';

// Report type enum
export const ReportTypeSchema = z.enum([
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

// Report format enum
export const ReportFormatSchema = z.enum(['json', 'csv', 'pdf', 'excel']);

// Report frequency enum
export const ReportFrequencySchema = z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'semester', 'annual', 'custom']);

// Base report query schema
export const BaseReportQuerySchema = z.object({
  reportType: ReportTypeSchema,
  startDate: DateSchema,
  endDate: DateSchema,
  format: ReportFormatSchema.optional().default('json'),
  includeInactive: z.boolean().optional().default(false),
});

// Attendance report query
export const AttendanceReportQuerySchema = BaseReportQuerySchema.extend({
  reportType: z.literal('attendance'),
  classId: IdSchema.optional(),
  studentId: IdSchema.optional(),
  subjectId: IdSchema.optional(),
  status: z.enum(['present', 'absent', 'late', 'excused']).optional(),
  groupBy: z.enum(['student', 'class', 'date', 'subject']).optional().default('student'),
  minAttendancePercentage: z.number().min(0).max(100).optional(),
});

// Academic report query
export const AcademicReportQuerySchema = BaseReportQuerySchema.extend({
  reportType: z.literal('academic'),
  classId: IdSchema.optional(),
  subjectId: IdSchema.optional(),
  semesterId: IdSchema,
  assessmentTypeId: IdSchema.optional(),
  groupBy: z.enum(['student', 'subject', 'class', 'assessment']).optional().default('student'),
  minPercentage: z.number().min(0).max(100).optional(),
  gradeLetter: z.enum(['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']).optional(),
});

// Financial report query
export const FinancialReportQuerySchema = BaseReportQuerySchema.extend({
  reportType: z.literal('financial'),
  classId: IdSchema.optional(),
  feeCategoryId: IdSchema.optional(),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'cheque', 'online', 'upi']).optional(),
  status: z.enum(['pending', 'partial', 'paid', 'overdue', 'waived']).optional(),
  groupBy: z.enum(['student', 'class', 'category', 'date', 'method']).optional().default('student'),
});

// Enrollment report query
export const EnrollmentReportQuerySchema = BaseReportQuerySchema.extend({
  reportType: z.literal('enrollment'),
  classId: IdSchema.optional(),
  academicYearId: IdSchema.optional(),
  groupBy: z.enum(['class', 'grade', 'month', 'academic_year']).optional().default('class'),
});

// Teacher workload report query
export const TeacherWorkloadReportQuerySchema = BaseReportQuerySchema.extend({
  reportType: z.literal('teacher_workload'),
  teacherId: IdSchema.optional(),
  subjectId: IdSchema.optional(),
  groupBy: z.enum(['teacher', 'subject', 'class']).optional().default('teacher'),
});

// Report response schemas
export const ReportMetadataSchema = z.object({
  reportId: IdSchema,
  reportType: ReportTypeSchema,
  title: z.string(),
  description: z.string().optional(),
  generatedBy: IdSchema,
  generatedAt: z.string(),
  parameters: z.record(z.any()),
  format: ReportFormatSchema,
  fileSize: z.number().optional(),
  downloadUrl: z.string().optional(),
});

export const ReportSummarySchema = z.object({
  totalRecords: z.number(),
  dateRange: z.object({
    startDate: z.string(),
    endDate: z.string(),
  }),
  filters: z.record(z.any()),
  aggregations: z.record(z.any()),
});

export const ReportResponseSchema = z.object({
  metadata: ReportMetadataSchema,
  summary: ReportSummarySchema,
  data: z.array(z.record(z.any())),
  charts: z.array(z.object({
    type: z.enum(['bar', 'line', 'pie', 'area', 'scatter']),
    title: z.string(),
    data: z.array(z.record(z.any())),
    config: z.record(z.any()).optional(),
  })).optional(),
});

// Scheduled report schemas
export const CreateScheduledReportSchema = z.object({
  name: z.string().min(1, 'Report name is required'),
  description: z.string().optional(),
  reportType: ReportTypeSchema,
  parameters: z.record(z.any()),
  frequency: ReportFrequencySchema,
  format: ReportFormatSchema,
  recipients: z.array(z.string().email()).min(1, 'At least one recipient is required'),
  isActive: z.boolean().optional().default(true),
  nextRunDate: DateSchema.optional(),
});

export const UpdateScheduledReportSchema = CreateScheduledReportSchema.partial();

export const ScheduledReportResponseSchema = z.object({
  id: IdSchema,
  name: z.string(),
  description: z.string().nullable(),
  reportType: ReportTypeSchema,
  parameters: z.record(z.any()),
  frequency: ReportFrequencySchema,
  format: ReportFormatSchema,
  recipients: z.array(z.string()),
  isActive: z.boolean(),
  nextRunDate: z.string().nullable(),
  lastRunDate: z.string().nullable(),
  createdBy: IdSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  // Relations
  createdByUser: z.object({
    firstName: z.string(),
    lastName: z.string(),
  }).optional(),
});

// Report history schemas
export const ReportHistorySchema = z.object({
  id: IdSchema,
  scheduledReportId: IdSchema.optional(),
  reportType: ReportTypeSchema,
  title: z.string(),
  parameters: z.record(z.any()),
  format: ReportFormatSchema,
  status: z.enum(['pending', 'generating', 'completed', 'failed']),
  fileSize: z.number().nullable(),
  downloadUrl: z.string().nullable(),
  generatedBy: IdSchema,
  generatedAt: z.string(),
  expiresAt: z.string().optional(),
  error: z.string().nullable(),
});

// Dashboard report schemas
export const DashboardReportSchema = z.object({
  overview: z.object({
    totalStudents: z.number(),
    totalTeachers: z.number(),
    totalClasses: z.number(),
    totalStaff: z.number(),
    activeAcademicYear: z.string(),
    currentSemester: z.string(),
  }),
  attendance: z.object({
    todayAttendance: z.number(),
    weeklyAverage: z.number(),
    monthlyAverage: z.number(),
    lowAttendanceStudents: z.number(),
  }),
  academic: z.object({
    averageGrade: z.string(),
    topPerformingClass: z.string(),
    studentsNeedingAttention: z.number(),
    recentAssessments: z.number(),
  }),
  financial: z.object({
    totalFeesCollected: z.number(),
    pendingFees: z.number(),
    overdueFees: z.number(),
    collectionPercentage: z.number(),
  }),
  recent: z.object({
    newEnrollments: z.array(z.object({
      studentName: z.string(),
      className: z.string(),
      enrollmentDate: z.string(),
    })),
    recentPayments: z.array(z.object({
      studentName: z.string(),
      amount: z.number(),
      paymentDate: z.string(),
    })),
    upcomingEvents: z.array(z.object({
      title: z.string(),
      date: z.string(),
      type: z.string(),
    })),
  }),
});

// Report query schemas
export const ReportQuerySchema = z.object({
  reportType: ReportTypeSchema.optional(),
  generatedBy: IdSchema.optional(),
  startDate: DateSchema.optional(),
  endDate: DateSchema.optional(),
  status: z.enum(['pending', 'generating', 'completed', 'failed']).optional(),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  sortBy: z.enum(['generatedAt', 'reportType', 'title']).optional().default('generatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Types
export type ReportType = z.infer<typeof ReportTypeSchema>;
export type ReportFormat = z.infer<typeof ReportFormatSchema>;
export type ReportFrequency = z.infer<typeof ReportFrequencySchema>;

export type BaseReportQuery = z.infer<typeof BaseReportQuerySchema>;
export type AttendanceReportQuery = z.infer<typeof AttendanceReportQuerySchema>;
export type AcademicReportQuery = z.infer<typeof AcademicReportQuerySchema>;
export type FinancialReportQuery = z.infer<typeof FinancialReportQuerySchema>;
export type EnrollmentReportQuery = z.infer<typeof EnrollmentReportQuerySchema>;
export type TeacherWorkloadReportQuery = z.infer<typeof TeacherWorkloadReportQuerySchema>;

export type ReportMetadata = z.infer<typeof ReportMetadataSchema>;
export type ReportSummary = z.infer<typeof ReportSummarySchema>;
export type ReportResponse = z.infer<typeof ReportResponseSchema>;

export type CreateScheduledReport = z.infer<typeof CreateScheduledReportSchema>;
export type UpdateScheduledReport = z.infer<typeof UpdateScheduledReportSchema>;
export type ScheduledReportResponse = z.infer<typeof ScheduledReportResponseSchema>;

export type ReportHistory = z.infer<typeof ReportHistorySchema>;
export type DashboardReport = z.infer<typeof DashboardReportSchema>;
export type ReportQuery = z.infer<typeof ReportQuerySchema>;
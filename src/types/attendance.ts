import { z } from 'zod';
import { IdSchema, DateSchema } from './common';

// Attendance status enum
export const AttendanceStatusSchema = z.enum(['present', 'absent', 'late', 'excused']);

// Single attendance record schemas
export const CreateAttendanceSchema = z.object({
  studentId: IdSchema,
  classId: IdSchema,
  subjectId: IdSchema.optional(),
  date: DateSchema,
  status: AttendanceStatusSchema,
  remarks: z.string().optional(),
});

export const UpdateAttendanceSchema = z.object({
  status: AttendanceStatusSchema,
  remarks: z.string().optional(),
});

export const AttendanceResponseSchema = z.object({
  id: IdSchema,
  altId: z.string().nullable(),
  studentId: IdSchema,
  classId: IdSchema,
  subjectId: IdSchema.nullable(),
  date: z.string(),
  status: AttendanceStatusSchema,
  markedBy: IdSchema,
  markedAt: z.string(),
  remarks: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Relations
  student: z.object({
    studentId: z.string(),
    user: z.object({
      firstName: z.string(),
      lastName: z.string(),
    }),
  }).optional(),
  class: z.object({
    name: z.string(),
    grade: z.string(),
    section: z.string(),
  }).optional(),
  subject: z.object({
    name: z.string(),
    code: z.string(),
  }).optional(),
  markedByUser: z.object({
    firstName: z.string(),
    lastName: z.string(),
  }).optional(),
});

// Bulk attendance schemas
export const BulkAttendanceItemSchema = z.object({
  studentId: IdSchema,
  status: AttendanceStatusSchema,
  remarks: z.string().optional(),
});

export const CreateBulkAttendanceSchema = z.object({
  classId: IdSchema,
  subjectId: IdSchema.optional(),
  date: DateSchema,
  attendance: z.array(BulkAttendanceItemSchema).min(1, 'At least one attendance record is required'),
});

// Attendance query schemas
export const AttendanceQuerySchema = z.object({
  studentId: IdSchema.optional(),
  classId: IdSchema.optional(),
  subjectId: IdSchema.optional(),
  startDate: DateSchema.optional(),
  endDate: DateSchema.optional(),
  status: AttendanceStatusSchema.optional(),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
});

// Attendance summary schemas
export const StudentAttendanceSummarySchema = z.object({
  studentId: IdSchema,
  totalDays: z.number(),
  presentDays: z.number(),
  absentDays: z.number(),
  lateDays: z.number(),
  excusedDays: z.number(),
  attendancePercentage: z.number(),
  startDate: z.string(),
  endDate: z.string(),
});

export const ClassAttendanceSummarySchema = z.object({
  classId: IdSchema,
  date: z.string(),
  totalStudents: z.number(),
  presentCount: z.number(),
  absentCount: z.number(),
  lateCount: z.number(),
  excusedCount: z.number(),
  attendancePercentage: z.number(),
});

// Note: AttendanceReportQuerySchema is defined in report.ts to avoid conflicts

export const AttendanceReportItemSchema = z.object({
  studentId: IdSchema,
  studentName: z.string(),
  className: z.string(),
  totalDays: z.number(),
  presentDays: z.number(),
  absentDays: z.number(),
  lateDays: z.number(),
  excusedDays: z.number(),
  attendancePercentage: z.number(),
});

export const AttendanceReportSchema = z.object({
  reportType: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  generatedAt: z.string(),
  data: z.array(AttendanceReportItemSchema),
  summary: z.object({
    totalStudents: z.number(),
    averageAttendance: z.number(),
    totalDays: z.number(),
  }),
});

// Types
export type AttendanceStatus = z.infer<typeof AttendanceStatusSchema>;
export type CreateAttendance = z.infer<typeof CreateAttendanceSchema>;
export type UpdateAttendance = z.infer<typeof UpdateAttendanceSchema>;
export type AttendanceResponse = z.infer<typeof AttendanceResponseSchema>;

export type BulkAttendanceItem = z.infer<typeof BulkAttendanceItemSchema>;
export type CreateBulkAttendance = z.infer<typeof CreateBulkAttendanceSchema>;

export type AttendanceQuery = z.infer<typeof AttendanceQuerySchema>;
export type StudentAttendanceSummary = z.infer<typeof StudentAttendanceSummarySchema>;
export type ClassAttendanceSummary = z.infer<typeof ClassAttendanceSummarySchema>;

// Note: AttendanceReportQuery type is defined in report.ts to avoid conflicts
export type AttendanceReportItem = z.infer<typeof AttendanceReportItemSchema>;
export type AttendanceReport = z.infer<typeof AttendanceReportSchema>;
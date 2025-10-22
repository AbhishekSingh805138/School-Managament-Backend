import { z } from 'zod';
import { IdSchema } from './common';

// Class schemas
export const CreateClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  grade: z.string().min(1, 'Grade is required'),
  section: z.string().min(1, 'Section is required'),
  teacherId: IdSchema,
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  academicYearId: IdSchema,
  room: z.string().optional(),
  description: z.string().optional(),
});

export const UpdateClassSchema = CreateClassSchema.partial();

export const ClassResponseSchema = z.object({
  id: IdSchema,
  name: z.string(),
  grade: z.string(),
  section: z.string(),
  teacherId: IdSchema,
  capacity: z.number(),
  currentEnrollment: z.number(),
  academicYearId: IdSchema,
  room: z.string().nullable(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Relations
  teacher: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
  }).optional(),
  academicYear: z.object({
    name: z.string(),
    startDate: z.string(),
    endDate: z.string(),
  }).optional(),
});

// Student enrollment schemas
export const EnrollStudentSchema = z.object({
  studentId: IdSchema,
  enrollmentDate: z.string().datetime().optional(),
});

export const BulkEnrollStudentsSchema = z.object({
  studentIds: z.array(IdSchema).min(1, 'At least one student ID is required'),
  enrollmentDate: z.string().datetime().optional(),
});

export const TransferStudentSchema = z.object({
  studentId: IdSchema,
  newClassId: IdSchema,
  transferDate: z.string().datetime().optional(),
  reason: z.string().optional(),
});

export const ClassRosterQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  enrollmentDateFrom: z.string().datetime().optional(),
  enrollmentDateTo: z.string().datetime().optional(),
  sortBy: z.enum(['firstName', 'lastName', 'studentId', 'enrollmentDate']).optional().default('firstName'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// Class teacher assignment schemas
export const UpdateClassTeacherSchema = z.object({
  teacherId: IdSchema,
});

export const ClassTeacherAssignmentSchema = z.object({
  teacherId: IdSchema,
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  subjectsCount: z.number().optional(),
  subjects: z.array(z.string()).optional(),
  isClassTeacher: z.boolean().optional(),
});

// Class enrollment history schemas
export const ClassEnrollmentHistorySchema = z.object({
  id: IdSchema,
  studentId: IdSchema,
  studentNumber: z.string(),
  studentName: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  isCurrentlyEnrolled: z.boolean(),
  academicYear: z.object({
    name: z.string(),
    startDate: z.string(),
    endDate: z.string(),
  }),
});

export const ClassEnrollmentHistoryQuerySchema = z.object({
  academicYearId: IdSchema.optional(),
});

// Types
export type CreateClass = z.infer<typeof CreateClassSchema>;
export type UpdateClass = z.infer<typeof UpdateClassSchema>;
export type ClassResponse = z.infer<typeof ClassResponseSchema>;
export type EnrollStudent = z.infer<typeof EnrollStudentSchema>;
export type BulkEnrollStudents = z.infer<typeof BulkEnrollStudentsSchema>;
export type TransferStudent = z.infer<typeof TransferStudentSchema>;
export type ClassRosterQuery = z.infer<typeof ClassRosterQuerySchema>;
export type UpdateClassTeacher = z.infer<typeof UpdateClassTeacherSchema>;
export type ClassTeacherAssignment = z.infer<typeof ClassTeacherAssignmentSchema>;
export type ClassEnrollmentHistory = z.infer<typeof ClassEnrollmentHistorySchema>;
export type ClassEnrollmentHistoryQuery = z.infer<typeof ClassEnrollmentHistoryQuerySchema>;

import { z } from 'zod';
import { IdSchema, DateSchema } from './common';

// Student schemas
export const CreateStudentSchema = z.object({
  userId: IdSchema,
  studentId: z.string().min(1, 'Student ID is required'),
  classId: IdSchema,
  enrollmentDate: DateSchema,
  guardianName: z.string().min(2, 'Guardian name must be at least 2 characters'),
  guardianPhone: z.string().min(10, 'Guardian phone must be at least 10 characters'),
  guardianEmail: z.string().email('Invalid guardian email').optional(),
  emergencyContact: z.string().min(10, 'Emergency contact is required'),
  medicalInfo: z.string().optional(),
});

export const UpdateStudentSchema = CreateStudentSchema.partial().omit({ userId: true });

export const StudentResponseSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  studentId: z.string(),
  classId: IdSchema,
  enrollmentDate: z.string(),
  guardianName: z.string(),
  guardianPhone: z.string(),
  guardianEmail: z.string().nullable(),
  emergencyContact: z.string(),
  medicalInfo: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Relations
  user: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    phone: z.string().nullable(),
  }).optional(),
  class: z.object({
    name: z.string(),
    grade: z.string(),
  }).optional(),
});

// Types
export type CreateStudent = z.infer<typeof CreateStudentSchema>;
export type UpdateStudent = z.infer<typeof UpdateStudentSchema>;
export type StudentResponse = z.infer<typeof StudentResponseSchema>;

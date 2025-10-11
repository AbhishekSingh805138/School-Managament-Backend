import { z } from 'zod';
import { IdSchema } from './common';

// Class schemas
export const CreateClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  grade: z.string().min(1, 'Grade is required'),
  section: z.string().min(1, 'Section is required'),
  teacherId: IdSchema,
  capacity: z.number().min(1, 'Capacity must be at least 1'),
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
});

// Types
export type CreateClass = z.infer<typeof CreateClassSchema>;
export type UpdateClass = z.infer<typeof UpdateClassSchema>;
export type ClassResponse = z.infer<typeof ClassResponseSchema>;

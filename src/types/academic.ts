import { z } from 'zod';
import { IdSchema, DateSchema } from './common';

// Academic Year schemas
const BaseAcademicYearSchema = z.object({
  name: z.string().min(1, 'Academic year name is required'),
  startDate: DateSchema,
  endDate: DateSchema,
  isActive: z.boolean().optional().default(false),
});

export const CreateAcademicYearSchema = BaseAcademicYearSchema.refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate > startDate;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const UpdateAcademicYearSchema = BaseAcademicYearSchema.partial().refine((data) => {
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

export const AcademicYearResponseSchema = z.object({
  id: IdSchema,
  altId: z.string().nullable(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Semester schemas
const BaseSemesterSchema = z.object({
  academicYearId: IdSchema,
  name: z.string().min(1, 'Semester name is required'),
  startDate: DateSchema,
  endDate: DateSchema,
  isActive: z.boolean().optional().default(false),
});

export const CreateSemesterSchema = BaseSemesterSchema.refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate > startDate;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const UpdateSemesterSchema = BaseSemesterSchema.omit({ academicYearId: true }).partial().refine((data) => {
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

export const SemesterResponseSchema = z.object({
  id: IdSchema,
  altId: z.string().nullable(),
  academicYearId: IdSchema,
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Relations
  academicYear: z.object({
    name: z.string(),
    startDate: z.string(),
    endDate: z.string(),
  }).optional(),
});

// Subject schemas
export const CreateSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().min(1, 'Subject code is required').max(20, 'Subject code must be at most 20 characters'),
  description: z.string().optional(),
  creditHours: z.number().min(1, 'Credit hours must be at least 1').optional().default(1),
});

export const UpdateSubjectSchema = CreateSubjectSchema.partial();

export const SubjectResponseSchema = z.object({
  id: IdSchema,
  altId: z.string().nullable(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  creditHours: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Class-Subject assignment schemas
export const CreateClassSubjectSchema = z.object({
  classId: IdSchema,
  subjectId: IdSchema,
  teacherId: IdSchema,
});

export const ClassSubjectResponseSchema = z.object({
  id: IdSchema,
  classId: IdSchema,
  subjectId: IdSchema,
  teacherId: IdSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  // Relations
  class: z.object({
    name: z.string(),
    grade: z.string(),
    section: z.string(),
  }).optional(),
  subject: z.object({
    name: z.string(),
    code: z.string(),
  }).optional(),
  teacher: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
  }).optional(),
});

// Types
export type CreateAcademicYear = z.infer<typeof CreateAcademicYearSchema>;
export type UpdateAcademicYear = z.infer<typeof UpdateAcademicYearSchema>;
export type AcademicYearResponse = z.infer<typeof AcademicYearResponseSchema>;

export type CreateSemester = z.infer<typeof CreateSemesterSchema>;
export type UpdateSemester = z.infer<typeof UpdateSemesterSchema>;
export type SemesterResponse = z.infer<typeof SemesterResponseSchema>;

export type CreateSubject = z.infer<typeof CreateSubjectSchema>;
export type UpdateSubject = z.infer<typeof UpdateSubjectSchema>;
export type SubjectResponse = z.infer<typeof SubjectResponseSchema>;

export type CreateClassSubject = z.infer<typeof CreateClassSubjectSchema>;
export type ClassSubjectResponse = z.infer<typeof ClassSubjectResponseSchema>;
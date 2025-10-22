import { Router } from 'express';
import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentSummary,
  getStudentClassHistory,
  getStudentsByClass,
  bulkUpdateStudents,
} from '../controllers/studentController';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { 
  CreateStudentSchema, 
  UpdateStudentSchema,
  StudentQuerySchema
} from '../types/student';
import { IdSchema } from '../types/common';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create student (admin only)
router.post(
  '/',
  authorize('admin'),
  validateBody(CreateStudentSchema),
  createStudent
);

// Get all students
router.get(
  '/',
  authorize('admin', 'teacher'),
  validateQuery(StudentQuerySchema),
  getStudents
);

// Get student by ID
router.get(
  '/:id',
  validateParams(z.object({ id: IdSchema })),
  getStudentById
);

// Get student summary/dashboard
router.get(
  '/:id/summary',
  validateParams(z.object({ id: IdSchema })),
  getStudentSummary
);

// Get student class history
router.get(
  '/:id/class-history',
  authorize('admin', 'teacher'),
  validateParams(z.object({ id: IdSchema })),
  getStudentClassHistory
);

// Get students by class
router.get(
  '/class/:classId',
  authorize('admin', 'teacher'),
  validateParams(z.object({ classId: IdSchema })),
  validateQuery(z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('50'),
  })),
  getStudentsByClass
);

// Bulk update students (admin only)
router.patch(
  '/bulk-update',
  authorize('admin'),
  validateBody(z.object({
    studentIds: z.array(IdSchema).min(1, 'At least one student ID is required'),
    updateData: z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      classId: IdSchema.optional(),
      guardianName: z.string().optional(),
      guardianPhone: z.string().optional(),
    }).refine(data => Object.keys(data).length > 0, {
      message: 'At least one field to update is required',
    }),
  })),
  bulkUpdateStudents
);

// Update student (admin only)
router.put(
  '/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  validateBody(UpdateStudentSchema),
  updateStudent
);

// Delete student (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  deleteStudent
);

export default router;
import { Router } from 'express';
import {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  assignTeacherToSubject,
  removeTeacherFromSubject,
  assignTeacherToClass,
  removeTeacherFromClass,
  assignTeacherToClassSubject,
  removeTeacherFromClassSubject,
  getTeacherWorkload,
  getAllTeacherAssignments,
  checkAssignmentConflicts,
  getOptimalTeacherSuggestions,
} from '../controllers/teacherController';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { 
  CreateTeacherSchema, 
  UpdateTeacherSchema 
} from '../types/teacher';
import { PaginationSchema, IdSchema } from '../types/common';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create teacher (admin only)
router.post(
  '/',
  authorize('admin'),
  validateBody(CreateTeacherSchema),
  createTeacher
);

// Get all teachers
router.get(
  '/',
  validateQuery(PaginationSchema.extend({
    isActive: z.string().optional().transform(val => val === 'true'),
    search: z.string().optional(),
    specialization: z.string().optional(),
  })),
  getTeachers
);

// Teacher assignment routes (must come before /:id routes)

// Get all teacher assignments overview (admin only)
router.get(
  '/assignments',
  authorize('admin'),
  validateQuery(PaginationSchema.extend({
    academicYearId: IdSchema.optional(),
    subjectId: IdSchema.optional(),
    classId: IdSchema.optional(),
  })),
  getAllTeacherAssignments
);

// Get teacher by ID
router.get(
  '/:id',
  validateParams(z.object({ id: IdSchema })),
  getTeacherById
);

// Update teacher (admin only)
router.put(
  '/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  validateBody(UpdateTeacherSchema),
  updateTeacher
);

// Deactivate teacher (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  deleteTeacher
);

// Get teacher workload and schedule
router.get(
  '/:id/workload',
  validateParams(z.object({ id: IdSchema })),
  getTeacherWorkload
);

// Check assignment conflicts before assigning
router.post(
  '/check-conflicts',
  authorize('admin'),
  validateBody(z.object({
    teacherId: IdSchema,
    classId: IdSchema,
    subjectId: IdSchema,
  })),
  checkAssignmentConflicts
);

// Get optimal teacher suggestions for class-subject assignment
router.get(
  '/suggestions/:classId/:subjectId',
  authorize('admin'),
  validateParams(z.object({ 
    classId: IdSchema,
    subjectId: IdSchema,
  })),
  getOptimalTeacherSuggestions
);

// Subject assignment routes
router.post(
  '/assign-subject',
  authorize('admin'),
  validateBody(z.object({
    teacherId: IdSchema,
    subjectId: IdSchema,
  })),
  assignTeacherToSubject
);

router.delete(
  '/:teacherId/subjects/:subjectId',
  authorize('admin'),
  validateParams(z.object({ 
    teacherId: IdSchema,
    subjectId: IdSchema,
  })),
  removeTeacherFromSubject
);

// Class assignment routes (main class teacher)
router.post(
  '/assign-class',
  authorize('admin'),
  validateBody(z.object({
    teacherId: IdSchema,
    classId: IdSchema,
  })),
  assignTeacherToClass
);

router.delete(
  '/classes/:classId/teacher',
  authorize('admin'),
  validateParams(z.object({ classId: IdSchema })),
  removeTeacherFromClass
);

// Class-subject assignment routes (subject-specific teaching)
router.post(
  '/assign-class-subject',
  authorize('admin'),
  validateBody(z.object({
    teacherId: IdSchema,
    classId: IdSchema,
    subjectId: IdSchema,
  })),
  assignTeacherToClassSubject
);

router.delete(
  '/classes/:classId/subjects/:subjectId/teacher',
  authorize('admin'),
  validateParams(z.object({ 
    classId: IdSchema,
    subjectId: IdSchema,
  })),
  removeTeacherFromClassSubject
);

export default router;
import { Router } from 'express';
import {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  toggleSubjectStatus,
  getSubjectStatistics,
} from '../controllers/subjectController';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { 
  CreateSubjectSchema, 
  UpdateSubjectSchema 
} from '../types/academic';
import { PaginationSchema, IdSchema } from '../types/common';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create subject (admin only)
router.post(
  '/',
  authorize('admin'),
  validateBody(CreateSubjectSchema),
  createSubject
);

// Get all subjects
router.get(
  '/',
  validateQuery(PaginationSchema.extend({
    isActive: z.string().optional().transform(val => val === 'true'),
    search: z.string().optional(),
  })),
  getSubjects
);

// Get subject by ID
router.get(
  '/:id',
  validateParams(z.object({ id: IdSchema })),
  getSubjectById
);

// Get subject statistics
router.get(
  '/:id/statistics',
  authorize('admin', 'teacher'),
  validateParams(z.object({ id: IdSchema })),
  getSubjectStatistics
);

// Update subject (admin only)
router.put(
  '/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  validateBody(UpdateSubjectSchema),
  updateSubject
);

// Toggle subject status (admin only)
router.patch(
  '/:id/status',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  validateBody(z.object({
    isActive: z.boolean(),
  })),
  toggleSubjectStatus
);

// Delete subject (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  deleteSubject
);

export default router;
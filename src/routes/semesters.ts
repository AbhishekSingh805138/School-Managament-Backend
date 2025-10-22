import { Router } from 'express';
import {
  createSemester,
  getSemesters,
  getSemesterById,
  updateSemester,
  deleteSemester,
  getActiveSemester,
} from '../controllers/semesterController';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { 
  CreateSemesterSchema, 
  UpdateSemesterSchema 
} from '../types/academic';
import { PaginationSchema, IdSchema } from '../types/common';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create semester (admin only)
router.post(
  '/',
  authorize('admin'),
  validateBody(CreateSemesterSchema),
  createSemester
);

// Get all semesters
router.get(
  '/',
  validateQuery(PaginationSchema.extend({
    academicYearId: IdSchema.optional(),
    isActive: z.string().optional().transform(val => val === 'true'),
  })),
  getSemesters
);

// Get active semester
router.get(
  '/active',
  validateQuery(z.object({
    academicYearId: IdSchema.optional(),
  })),
  getActiveSemester
);

// Get semester by ID
router.get(
  '/:id',
  validateParams(z.object({ id: IdSchema })),
  getSemesterById
);

// Update semester (admin only)
router.put(
  '/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  validateBody(UpdateSemesterSchema),
  updateSemester
);

// Delete semester (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  deleteSemester
);

export default router;
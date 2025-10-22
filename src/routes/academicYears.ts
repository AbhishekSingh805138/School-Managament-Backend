import { Router } from 'express';
import {
  createAcademicYear,
  getAcademicYears,
  getAcademicYearById,
  updateAcademicYear,
  deleteAcademicYear,
  getActiveAcademicYear,
} from '../controllers/academicYearController';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { 
  CreateAcademicYearSchema, 
  UpdateAcademicYearSchema 
} from '../types/academic';
import { PaginationSchema, IdSchema } from '../types/common';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create academic year (admin only)
router.post(
  '/',
  authorize('admin'),
  validateBody(CreateAcademicYearSchema),
  createAcademicYear
);

// Get all academic years
router.get(
  '/',
  validateQuery(PaginationSchema.extend({
    isActive: z.string().optional().transform(val => val === 'true'),
  })),
  getAcademicYears
);

// Get active academic year
router.get(
  '/active',
  getActiveAcademicYear
);

// Get academic year by ID
router.get(
  '/:id',
  validateParams(z.object({ id: IdSchema })),
  getAcademicYearById
);

// Update academic year (admin only)
router.put(
  '/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  validateBody(UpdateAcademicYearSchema),
  updateAcademicYear
);

// Delete academic year (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  deleteAcademicYear
);

export default router;
import { Router } from 'express';
import {
  createGrade,
  getGrades,
  getGradeById,
  updateGrade,
  deleteGrade,
} from '../controllers/gradeController';
import { validateBody, validateQuery } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { 
  CreateGradeSchema,
  UpdateGradeSchema,
  GradeQuerySchema
} from '../types/grade';
import { IdSchema } from '../types/common';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create grade (teachers and admins only)
router.post(
  '/',
  authorize('admin', 'teacher'),
  validateBody(CreateGradeSchema),
  createGrade
);

// Get grades with filtering and pagination
router.get(
  '/',
  validateQuery(GradeQuerySchema),
  getGrades
);

// Get grade by ID
router.get(
  '/:id',
  getGradeById
);

// Update grade (teachers and admins only)
router.put(
  '/:id',
  authorize('admin', 'teacher'),
  validateBody(UpdateGradeSchema),
  updateGrade
);

// Delete grade (teachers and admins only)
router.delete(
  '/:id',
  authorize('admin', 'teacher'),
  deleteGrade
);

export default router;
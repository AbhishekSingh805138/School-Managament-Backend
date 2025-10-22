import { Router } from 'express';
import {
  createParent,
  getParents,
  getParentById,
  updateParent,
  linkParentToStudent,
  updateParentStudentRelationship,
  removeParentStudentRelationship,
  getParentDashboard,
} from '../controllers/parentController';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { 
  CreateParentSchema, 
  UpdateParentSchema,
  CreateStudentParentSchema,
  UpdateStudentParentSchema,
  ParentQuerySchema
} from '../types/parent';
import { IdSchema } from '../types/common';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create parent account (admin only)
router.post(
  '/',
  authorize('admin'),
  validateBody(CreateParentSchema),
  createParent
);

// Get all parents (admin and teachers only)
router.get(
  '/',
  authorize('admin', 'teacher'),
  validateQuery(ParentQuerySchema),
  getParents
);

// Get parent dashboard (parent only)
router.get(
  '/dashboard',
  authorize('parent'),
  getParentDashboard
);

// Get parent by ID
router.get(
  '/:id',
  authorize('admin', 'teacher'),
  validateParams(z.object({ id: IdSchema })),
  getParentById
);

// Update parent (admin only)
router.put(
  '/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  validateBody(UpdateParentSchema),
  updateParent
);

// Link parent to student (admin only)
router.post(
  '/link-student',
  authorize('admin'),
  validateBody(CreateStudentParentSchema),
  linkParentToStudent
);

// Update parent-student relationship (admin only)
router.put(
  '/relationships/:relationshipId',
  authorize('admin'),
  validateParams(z.object({ relationshipId: IdSchema })),
  validateBody(UpdateStudentParentSchema),
  updateParentStudentRelationship
);

// Remove parent-student relationship (admin only)
router.delete(
  '/relationships/:relationshipId',
  authorize('admin'),
  validateParams(z.object({ relationshipId: IdSchema })),
  removeParentStudentRelationship
);

export default router;
import { Router } from 'express';
import { getUsers, getUserById, updateUser, deleteUser } from '../controllers/userController';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { UpdateUserSchema } from '../types/user';
import { PaginationSchema } from '../types/common';
import { IdSchema } from '../types/common';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all users (admin only)
router.get(
  '/',
  authorize('admin'),
  validateQuery(PaginationSchema),
  getUsers
);

// Get user by ID
router.get(
  '/:id',
  validateParams(z.object({ id: IdSchema })),
  getUserById
);

// Update user
router.put(
  '/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  validateBody(UpdateUserSchema),
  updateUser
);

// Delete user (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  deleteUser
);

export default router;

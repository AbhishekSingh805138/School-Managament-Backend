import { Router } from 'express';
import { createUser, getUsers, getUserById, updateUser, deleteUser } from '../controllers/userController';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { CreateUserSchema, UpdateUserSchema } from '../types/user';
import { PaginationSchema } from '../types/common';
import { IdSchema } from '../types/common';
import { z } from 'zod';
import { sanitizeUser } from '../middleware/sanitization';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create user (admin only)
router.post(
  '/',
  authorize('admin'),
  sanitizeUser,
  validateBody(CreateUserSchema),
  createUser
);

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

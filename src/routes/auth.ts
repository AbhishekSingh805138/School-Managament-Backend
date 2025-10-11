import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { validateBody } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { CreateUserSchema, LoginSchema } from '../types/user';

const router = Router();

// Public routes
router.post('/register', validateBody(CreateUserSchema), register);
router.post('/login', validateBody(LoginSchema), login);

// Protected routes
router.get('/profile', authenticate, getProfile);

export default router;

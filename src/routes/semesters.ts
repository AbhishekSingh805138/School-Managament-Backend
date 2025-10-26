import { Router } from 'express';
import {
  createSemester,
  getSemesters,
  getSemesterById,
  updateSemester,
  deleteSemester,
  getCurrentSemester
} from '../controllers/semesterController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current active semester (public for authenticated users)
router.get('/current', getCurrentSemester);

// Get all semesters with filtering and pagination
router.get('/', getSemesters);

// Get semester by ID
router.get('/:id', getSemesterById);

// Create semester (admin only)
router.post('/', authorize('admin'), createSemester);

// Update semester (admin only)
router.put('/:id', authorize('admin'), updateSemester);

// Delete semester (admin only)
router.delete('/:id', authorize('admin'), deleteSemester);

export default router;
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
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all subjects with filtering and pagination
router.get('/', getSubjects);

// Get subject by ID
router.get('/:id', getSubjectById);

// Get subject statistics (admin and teachers only)
router.get('/:id/statistics', authorize('admin', 'teacher'), getSubjectStatistics);

// Create subject (admin only)
router.post('/', authorize('admin'), createSubject);

// Update subject (admin only)
router.put('/:id', authorize('admin'), updateSubject);

// Toggle subject status (admin only)
router.patch('/:id/status', authorize('admin'), toggleSubjectStatus);

// Delete subject (admin only)
router.delete('/:id', authorize('admin'), deleteSubject);

export default router;
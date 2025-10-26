import { Router } from 'express';
import {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
  assignSubjectToClass,
  removeSubjectFromClass,
  getClassStatistics,
  enrollStudentToClass,
  bulkEnrollStudentsToClass,
  transferStudent,
  getClassStudents,
  getClassSubjects,
} from '../controllers/classController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all classes with filtering and pagination
router.get('/', getClasses);

// Get class by ID
router.get('/:id', getClassById);

// Get class statistics (admin and teachers only)
router.get('/:id/statistics', authorize('admin', 'teacher'), getClassStatistics);

// Get class students (admin and teachers only)
router.get('/:id/students', authorize('admin', 'teacher'), getClassStudents);

// Get class subjects (admin and teachers only)
router.get('/:id/subjects', authorize('admin', 'teacher'), getClassSubjects);

// Create class (admin only)
router.post('/', authorize('admin'), createClass);

// Assign subject to class (admin only)
router.post('/:id/subjects', authorize('admin'), assignSubjectToClass);

// Enroll single student to class (admin only)
router.post('/:id/enroll', authorize('admin'), enrollStudentToClass);

// Bulk enroll students to class (admin only)
router.post('/:id/enroll/bulk', authorize('admin'), bulkEnrollStudentsToClass);

// Transfer student between classes (admin only)
router.post('/transfer', authorize('admin'), transferStudent);

// Update class (admin only)
router.put('/:id', authorize('admin'), updateClass);

// Remove subject from class (admin only)
router.delete('/:id/subjects/:subjectId', authorize('admin'), removeSubjectFromClass);

// Delete class (admin only)
router.delete('/:id', authorize('admin'), deleteClass);

export default router;
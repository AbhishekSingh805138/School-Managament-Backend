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
  getClassRoster,
  getClassStudents,
  getClassSubjects,
  getClassTeacherAssignments,
  updateClassTeacher,
  getClassEnrollmentHistory,
  validateClassCapacity,
  getClassCapacity,
} from '../controllers/classController';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { 
  CreateClassSchema, 
  UpdateClassSchema,
  EnrollStudentSchema,
  BulkEnrollStudentsSchema,
  TransferStudentSchema,
  ClassRosterQuerySchema,
  UpdateClassTeacherSchema,
  ClassEnrollmentHistoryQuerySchema
} from '../types/class';
import { CreateClassSubjectSchema } from '../types/academic';
import { PaginationSchema, IdSchema } from '../types/common';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create class (admin only)
router.post(
  '/',
  authorize('admin'),
  validateBody(CreateClassSchema),
  createClass
);

// Get all classes
router.get(
  '/',
  validateQuery(PaginationSchema.extend({
    academicYearId: IdSchema.optional(),
    grade: z.string().optional(),
    isActive: z.string().optional().transform(val => val === 'true'),
    search: z.string().optional(),
  })),
  getClasses
);

// Get class by ID
router.get(
  '/:id',
  validateParams(z.object({ id: IdSchema })),
  getClassById
);

// Get class statistics
router.get(
  '/:id/statistics',
  authorize('admin', 'teacher'),
  validateParams(z.object({ id: IdSchema })),
  getClassStatistics
);

// Update class (admin only)
router.put(
  '/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  validateBody(UpdateClassSchema),
  updateClass
);

// Delete class (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  deleteClass
);

// Assign subject to class (admin only)
router.post(
  '/:id/subjects',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  validateBody(CreateClassSubjectSchema.omit({ classId: true })),
  assignSubjectToClass
);

// Remove subject from class (admin only)
router.delete(
  '/:id/subjects/:subjectId',
  authorize('admin'),
  validateParams(z.object({ 
    id: IdSchema,
    subjectId: IdSchema,
  })),
  removeSubjectFromClass
);

// Get class students
router.get(
  '/:id/students',
  authorize('admin', 'teacher'),
  validateParams(z.object({ id: IdSchema })),
  getClassStudents
);

// Get class subjects
router.get(
  '/:id/subjects',
  authorize('admin', 'teacher'),
  validateParams(z.object({ id: IdSchema })),
  getClassSubjects
);

// Get class roster with filtering
router.get(
  '/:id/roster',
  authorize('admin', 'teacher'),
  validateParams(z.object({ id: IdSchema })),
  validateQuery(ClassRosterQuerySchema),
  getClassRoster
);

// Get class teacher assignments
router.get(
  '/:id/teachers',
  authorize('admin', 'teacher'),
  validateParams(z.object({ id: IdSchema })),
  getClassTeacherAssignments
);

// Update class teacher (admin only)
router.put(
  '/:id/teacher',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  validateBody(UpdateClassTeacherSchema),
  updateClassTeacher
);

// Get class enrollment history
router.get(
  '/:id/enrollment-history',
  authorize('admin', 'teacher'),
  validateParams(z.object({ id: IdSchema })),
  validateQuery(ClassEnrollmentHistoryQuerySchema),
  getClassEnrollmentHistory
);

// Validate class capacity constraints
router.get(
  '/:id/validate-capacity',
  authorize('admin', 'teacher'),
  validateParams(z.object({ id: IdSchema })),
  validateQuery(z.object({
    proposedEnrollment: z.string().optional().transform(val => val ? parseInt(val) : 0),
  })),
  validateClassCapacity
);

// Get class capacity information
router.get(
  '/:id/capacity',
  authorize('admin', 'teacher'),
  validateParams(z.object({ id: IdSchema })),
  getClassCapacity
);

// Enroll single student to class (admin only)
router.post(
  '/:id/enroll',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  validateBody(EnrollStudentSchema),
  enrollStudentToClass
);

// Bulk enroll students to class (admin only)
router.post(
  '/:id/enroll/bulk',
  authorize('admin'),
  validateParams(z.object({ id: IdSchema })),
  validateBody(BulkEnrollStudentsSchema),
  bulkEnrollStudentsToClass
);

// Transfer student between classes (admin only)
router.post(
  '/transfer',
  authorize('admin'),
  validateBody(TransferStudentSchema),
  transferStudent
);

export default router;
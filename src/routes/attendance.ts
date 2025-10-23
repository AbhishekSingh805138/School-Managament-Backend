import { Router } from 'express';
import {
  markAttendance,
  markBulkAttendance,
  getAttendanceRecords,
  updateAttendance,
  getAttendanceById,
  getClassAttendance,
  getStudentAttendanceSummary,
  deleteAttendance,
} from '../controllers/attendanceController';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { 
  CreateAttendanceSchema, 
  UpdateAttendanceSchema,
  CreateBulkAttendanceSchema,
  AttendanceQuerySchema
} from '../types/attendance';
import { IdSchema } from '../types/common';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Mark single attendance record
router.post(
  '/',
  authorize('admin', 'teacher'),
  validateBody(CreateAttendanceSchema),
  markAttendance
);

// Mark bulk attendance for a class
router.post(
  '/bulk',
  authorize('admin', 'teacher'),
  validateBody(CreateBulkAttendanceSchema),
  markBulkAttendance
);

// Get attendance records with filtering
router.get(
  '/',
  validateQuery(AttendanceQuerySchema),
  getAttendanceRecords
);

// Get attendance by ID
router.get(
  '/:id',
  validateParams(z.object({ id: IdSchema })),
  getAttendanceById
);

// Update attendance record
router.put(
  '/:id',
  authorize('admin', 'teacher'),
  validateParams(z.object({ id: IdSchema })),
  validateBody(UpdateAttendanceSchema),
  updateAttendance
);

// Delete attendance record
router.delete(
  '/:id',
  authorize('admin', 'teacher'),
  validateParams(z.object({ id: IdSchema })),
  deleteAttendance
);

// Get class attendance for a specific date
router.get(
  '/class/:classId',
  validateParams(z.object({ classId: IdSchema })),
  validateQuery(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    subjectId: IdSchema.optional(),
  })),
  getClassAttendance
);

// Get student attendance summary
router.get(
  '/student/:studentId/summary',
  validateParams(z.object({ studentId: IdSchema })),
  validateQuery(z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  })),
  getStudentAttendanceSummary
);

export default router;
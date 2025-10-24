import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AttendanceService } from '../services/attendanceService';

const attendanceService = new AttendanceService();

// Mark single attendance record
export const markAttendance = asyncHandler(async (req: Request, res: Response) => {
  const attendanceData = req.body;
  const markedBy = req.user!.id;
  const attendance = await attendanceService.markAttendance(attendanceData, markedBy);

  res.status(201).json({
    success: true,
    message: 'Attendance marked successfully',
    data: attendance,
  });
});

// Mark bulk attendance
export const markBulkAttendance = asyncHandler(async (req: Request, res: Response) => {
  const bulkData = req.body;
  const markedBy = req.user!.id;
  const result = await attendanceService.markBulkAttendance(bulkData, markedBy);

  res.status(201).json({
    success: true,
    message: 'Bulk attendance marked successfully',
    data: result,
  });
});

// Get attendance records
export const getAttendance = asyncHandler(async (req: Request, res: Response) => {
  const result = await attendanceService.getAttendance(req);

  res.json({
    success: true,
    data: result.attendance,
    pagination: result.pagination,
  });
});

// Get attendance by ID
export const getAttendanceById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const attendance = await attendanceService.getAttendanceById(id);

  res.json({
    success: true,
    data: attendance,
  });
});

// Update attendance
export const updateAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  const attendance = await attendanceService.updateAttendance(id, updateData);

  res.json({
    success: true,
    message: 'Attendance updated successfully',
    data: attendance,
  });
});

// Delete attendance
export const deleteAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await attendanceService.deleteAttendance(id);

  res.json({
    success: true,
    message: 'Attendance record deleted successfully',
  });
});

// Get student attendance summary
export const getStudentAttendanceSummary = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const { startDate, endDate } = req.query;
  const summary = await attendanceService.getStudentAttendanceSummary(
    studentId, 
    startDate as string, 
    endDate as string
  );

  res.json({
    success: true,
    data: summary,
  });
});

// Aliases for backward compatibility
export const getAttendanceRecords = getAttendance;
export const getClassAttendance = getAttendance;
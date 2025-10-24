import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { StudentService } from '../services/studentService';

const studentService = new StudentService();

// Create student with user account
export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const studentData = req.body;
  const student = await studentService.createStudent(studentData);

  res.status(201).json({
    success: true,
    message: 'Student created successfully',
    data: student,
  });
});

// Get all students
export const getStudents = asyncHandler(async (req: Request, res: Response) => {
  const result = await studentService.getStudents(req);

  res.json({
    success: true,
    data: result.students,
    pagination: result.pagination,
  });
});

// Get student by ID
export const getStudentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const student = await studentService.getStudentById(id);

  res.json({
    success: true,
    data: student,
  });
});

// Update student
export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  const student = await studentService.updateStudent(id, updateData);

  res.json({
    success: true,
    message: 'Student updated successfully',
    data: student,
  });
});

// Delete student (soft delete)
export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await studentService.deleteStudent(id);

  res.json({
    success: true,
    message: 'Student deactivated successfully',
  });
});

// Placeholder functions for missing exports
export const getStudentSummary = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const getStudentClassHistory = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const getStudentsByClass = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const bulkUpdateStudents = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});
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

// Get student summary/dashboard
export const getStudentSummary = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const summary = await studentService.getStudentSummary(id);

  res.json({
    success: true,
    data: summary,
  });
});

// Get student class history
export const getStudentClassHistory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const history = await studentService.getStudentClassHistory(id);

  res.json({
    success: true,
    data: history,
  });
});

// Get students by class
export const getStudentsByClass = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.params;
  const { page = '1', limit = '50' } = req.query;
  const result = await studentService.getStudentsByClass(classId, {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
  });

  res.json({
    success: true,
    data: result.students,
    pagination: result.pagination,
  });
});

// Bulk update students
export const bulkUpdateStudents = asyncHandler(async (req: Request, res: Response) => {
  const { studentIds, updateData } = req.body;
  const result = await studentService.bulkUpdateStudents(studentIds, updateData);

  res.json({
    success: true,
    message: `Successfully updated ${result.updatedCount} students`,
    data: result,
  });
});

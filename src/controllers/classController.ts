import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ClassService } from '../services/classService';

const classService = new ClassService();

// Create class
export const createClass = asyncHandler(async (req: Request, res: Response) => {
  const classData = req.body;
  const classInfo = await classService.createClass(classData);

  res.status(201).json({
    success: true,
    message: 'Class created successfully',
    data: classInfo,
  });
});

// Get all classes
export const getClasses = asyncHandler(async (req: Request, res: Response) => {
  const result = await classService.getClasses(req);

  res.json({
    success: true,
    data: result.classes,
    pagination: result.pagination,
  });
});

// Get class by ID
export const getClassById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const classInfo = await classService.getClassById(id);

  res.json({
    success: true,
    data: classInfo,
  });
});

// Update class
export const updateClass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  const classInfo = await classService.updateClass(id, updateData);

  res.json({
    success: true,
    message: 'Class updated successfully',
    data: classInfo,
  });
});

// Delete class (soft delete)
export const deleteClass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await classService.deleteClass(id);

  res.json({
    success: true,
    message: 'Class deleted successfully',
  });
});

// Placeholder functions for missing exports (to be implemented)
export const assignSubjectToClass = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const removeSubjectFromClass = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const getClassStatistics = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const enrollStudentToClass = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const bulkEnrollStudentsToClass = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const transferStudent = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const getClassRoster = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const getClassStudents = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const getClassSubjects = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const getClassTeacherAssignments = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const updateClassTeacher = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const getClassEnrollmentHistory = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const validateClassCapacity = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const getClassCapacity = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});
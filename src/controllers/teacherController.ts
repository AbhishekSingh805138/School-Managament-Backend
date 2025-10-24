import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { TeacherService } from '../services/teacherService';

const teacherService = new TeacherService();

// Create teacher profile
export const createTeacher = asyncHandler(async (req: Request, res: Response) => {
  const teacherData = req.body;
  const teacher = await teacherService.createTeacher(teacherData);

  res.status(201).json({
    success: true,
    message: 'Teacher profile created successfully',
    data: teacher,
  });
});

// Get all teachers
export const getTeachers = asyncHandler(async (req: Request, res: Response) => {
  const result = await teacherService.getTeachers(req);

  res.json({
    success: true,
    data: result.teachers,
    pagination: result.pagination,
  });
});

// Get teacher by ID
export const getTeacherById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const teacher = await teacherService.getTeacherById(id);

  res.json({
    success: true,
    data: teacher,
  });
});

// Update teacher profile
export const updateTeacher = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  const teacher = await teacherService.updateTeacher(id, updateData);

  res.json({
    success: true,
    message: 'Teacher profile updated successfully',
    data: teacher,
  });
});

// Deactivate teacher (soft delete)
export const deleteTeacher = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await teacherService.deleteTeacher(id);

  res.json({
    success: true,
    message: 'Teacher deactivated successfully',
  });
});

// Assign teacher to subject (specialization)
export const assignTeacherToSubject = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId, subjectId } = req.body;
  const assignment = await teacherService.assignTeacherToSubject(teacherId, subjectId);

  res.status(201).json({
    success: true,
    message: 'Teacher assigned to subject successfully',
    data: assignment,
  });
});

// Remove teacher from subject
export const removeTeacherFromSubject = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId, subjectId } = req.params;
  await teacherService.removeTeacherFromSubject(teacherId, subjectId);

  res.json({
    success: true,
    message: 'Teacher removed from subject successfully',
  });
});

// Assign teacher as main class teacher
export const assignTeacherToClass = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId, classId } = req.body;
  const assignment = await teacherService.assignTeacherToClass(teacherId, classId);

  res.json({
    success: true,
    message: 'Teacher assigned to class successfully',
    data: assignment,
  });
});

// Get teacher workload and schedule
export const getTeacherWorkload = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const workload = await teacherService.getTeacherWorkload(id);

  res.json({
    success: true,
    data: workload,
  });
});

// Placeholder functions for missing exports
export const removeTeacherFromClass = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const assignTeacherToClassSubject = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const removeTeacherFromClassSubject = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const getAllTeacherAssignments = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const checkAssignmentConflicts = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const getOptimalTeacherSuggestions = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});
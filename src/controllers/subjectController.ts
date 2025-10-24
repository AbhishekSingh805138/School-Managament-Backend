import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { SubjectService } from '../services/subjectService';

const subjectService = new SubjectService();

// Create subject
export const createSubject = asyncHandler(async (req: Request, res: Response) => {
  const subjectData = req.body;
  const subject = await subjectService.createSubject(subjectData);

  res.status(201).json({
    success: true,
    message: 'Subject created successfully',
    data: subject,
  });
});

// Get all subjects
export const getSubjects = asyncHandler(async (req: Request, res: Response) => {
  const result = await subjectService.getSubjects(req);

  res.json({
    success: true,
    data: result.subjects,
    pagination: result.pagination,
  });
});

// Get subject by ID
export const getSubjectById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const subject = await subjectService.getSubjectById(id);

  res.json({
    success: true,
    data: subject,
  });
});

// Update subject
export const updateSubject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  const subject = await subjectService.updateSubject(id, updateData);

  res.json({
    success: true,
    message: 'Subject updated successfully',
    data: subject,
  });
});

// Delete subject (soft delete)
export const deleteSubject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await subjectService.deleteSubject(id);

  res.json({
    success: true,
    message: 'Subject deleted successfully',
  });
});

// Placeholder functions for missing exports
export const toggleSubjectStatus = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const getSubjectStatistics = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});
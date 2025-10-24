import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ParentService } from '../services/parentService';

const parentService = new ParentService();

// Create parent account
export const createParent = asyncHandler(async (req: Request, res: Response) => {
  const parentData = req.body;
  const parent = await parentService.createParent(parentData);

  res.status(201).json({
    success: true,
    message: 'Parent account created successfully',
    data: parent,
  });
});

// Get all parents
export const getParents = asyncHandler(async (req: Request, res: Response) => {
  const result = await parentService.getParents(req);

  res.json({
    success: true,
    data: result.parents,
    pagination: result.pagination,
  });
});

// Get parent by ID
export const getParentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parent = await parentService.getParentById(id);

  res.json({
    success: true,
    data: parent,
  });
});

// Update parent
export const updateParent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  const parent = await parentService.updateParent(id, updateData);

  res.json({
    success: true,
    message: 'Parent updated successfully',
    data: parent,
  });
});

// Delete parent
export const deleteParent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await parentService.deleteParent(id);

  res.json({
    success: true,
    message: 'Parent deleted successfully',
  });
});

// Link student to parent
export const linkStudentToParent = asyncHandler(async (req: Request, res: Response) => {
  const linkData = req.body;
  const relationship = await parentService.linkStudentToParent(linkData);

  res.status(201).json({
    success: true,
    message: 'Student linked to parent successfully',
    data: relationship,
  });
});

// Unlink student from parent
export const unlinkStudentFromParent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, parentId } = req.params;
  await parentService.unlinkStudentFromParent(studentId, parentId);

  res.json({
    success: true,
    message: 'Student unlinked from parent successfully',
  });
});

// Get parent's children
export const getParentChildren = asyncHandler(async (req: Request, res: Response) => {
  const { parentId } = req.params;
  const result = await parentService.getParentChildren(parentId);

  res.json({
    success: true,
    data: result,
  });
});

// Aliases and placeholder functions for missing exports
export const linkParentToStudent = linkStudentToParent;

export const updateParentStudentRelationship = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const removeParentStudentRelationship = unlinkStudentFromParent;

export const getParentDashboard = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { FeeService } from '../services/feeService';

const feeService = new FeeService();

// Create fee category
export const createFeeCategory = asyncHandler(async (req: Request, res: Response) => {
  const feeCategoryData = req.body;
  const feeCategory = await feeService.createFeeCategory(feeCategoryData);

  res.status(201).json({
    success: true,
    message: 'Fee category created successfully',
    data: feeCategory,
  });
});

// Get all fee categories
export const getFeeCategories = asyncHandler(async (req: Request, res: Response) => {
  const result = await feeService.getFeeCategories(req);

  res.json({
    success: true,
    data: result.feeCategories,
    pagination: result.pagination,
  });
});

// Get fee category by ID
export const getFeeCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const feeCategory = await feeService.getFeeCategoryById(id);

  res.json({
    success: true,
    data: feeCategory,
  });
});

// Update fee category
export const updateFeeCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  const feeCategory = await feeService.updateFeeCategory(id, updateData);

  res.json({
    success: true,
    message: 'Fee category updated successfully',
    data: feeCategory,
  });
});

// Delete fee category
export const deleteFeeCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await feeService.deleteFeeCategory(id);

  res.json({
    success: true,
    message: 'Fee category deleted successfully',
  });
});

// Assign fees to students
export const assignFeesToStudents = asyncHandler(async (req: Request, res: Response) => {
  const assignmentData = req.body;
  const result = await feeService.assignFeesToStudents(assignmentData);

  res.status(201).json({
    success: true,
    message: 'Fees assigned to students successfully',
    data: result,
  });
});

// Get student fees
export const getStudentFees = asyncHandler(async (req: Request, res: Response) => {
  const result = await feeService.getStudentFees(req);

  res.json({
    success: true,
    data: result.studentFees,
    pagination: result.pagination,
  });
});

// Placeholder functions for missing exports
export const assignFeesToClass = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const getStudentFeeById = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const updateStudentFee = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});
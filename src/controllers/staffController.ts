import { Request, Response } from 'express';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import {
  CreateStaffSchema,
  UpdateStaffSchema,
  StaffQuerySchema
} from '../types/staff';
import { StaffService } from '../services/staffService';

const staffService = new StaffService();

// Create staff member
export const createStaff = asyncHandler(async (req: Request, res: Response) => {
  const staffData = CreateStaffSchema.parse(req.body);
  const userRole = req.user!.role;

  // Only admins can create staff members
  if (userRole !== 'admin') {
    throw new AppError('Only administrators can create staff members', 403);
  }

  const staff = await staffService.createStaff(staffData, parseInt(req.user!.id));

  res.status(201).json({
    success: true,
    data: staff,
    message: 'Staff member created successfully'
  });
});

// Get staff members with filtering and pagination
export const getStaff = asyncHandler(async (req: Request, res: Response) => {
  const queryParams = StaffQuerySchema.parse(req.query);
  const userRole = req.user!.role;

  const { staff, total } = await staffService.getStaff(queryParams, userRole, parseInt(req.user!.id));

  res.json({
    success: true,
    data: staff,
    pagination: {
      page: queryParams.page,
      limit: queryParams.limit,
      total,
      pages: Math.ceil(total / queryParams.limit)
    }
  });
});

// Get single staff member by ID
export const getStaffById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const staff = await staffService.getStaffById(parseInt(id), userRole, parseInt(userId));

  res.json({
    success: true,
    data: staff
  });
});

// Update staff member
export const updateStaff = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = UpdateStaffSchema.parse(req.body);
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const updatedStaff = await staffService.updateStaff(parseInt(id), updateData, userRole, parseInt(userId));

  res.json({
    success: true,
    data: updatedStaff,
    message: 'Staff member updated successfully'
  });
});

// Deactivate staff member
export const deactivateStaff = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userRole = req.user!.role;

  // Only admins can deactivate staff members
  if (userRole !== 'admin') {
    throw new AppError('Only administrators can deactivate staff members', 403);
  }

  await staffService.deactivateStaff(parseInt(id));

  res.json({
    success: true,
    message: 'Staff member deactivated successfully'
  });
});

// Reactivate staff member
export const reactivateStaff = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userRole = req.user!.role;

  // Only admins can reactivate staff members
  if (userRole !== 'admin') {
    throw new AppError('Only administrators can reactivate staff members', 403);
  }

  const updatedStaff = await staffService.reactivateStaff(parseInt(id));

  res.json({
    success: true,
    data: updatedStaff,
    message: 'Staff member reactivated successfully'
  });
});

// Get staff summary and statistics
export const getStaffSummary = asyncHandler(async (req: Request, res: Response) => {
  const userRole = req.user!.role;

  // Only admins can view staff summary
  if (userRole !== 'admin') {
    throw new AppError('Only administrators can view staff summary', 403);
  }

  const summary = await staffService.getStaffSummary();

  res.json({
    success: true,
    data: summary
  });
});
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { UserService } from '../services/userService';

const userService = new UserService();

// Get all users with pagination
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  console.log('Get users request received');
  const result = await userService.getUsers(req);

  res.json({
    success: true,
    data: result.users,
    pagination: result.pagination,
  });
});

// Get user by ID (supports both UUID and regular IDs)
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  console.log('Get user by ID request received');
  const { id } = req.params;
  console.log("Looking for user with ID:", req.params.id);
  
  const user = await userService.getUserById(id);

  res.json({
    success: true,
    data: user,
  });
});

// Update user (supports both UUID and regular IDs)
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  console.log('Update user request received');
  const { id } = req.params;
  const updateData = req.body;

  const user = await userService.updateUser(id, updateData);

  res.json({
    success: true,
    message: 'User updated successfully',
    data: user,
  });
});

// Delete user (soft delete) - supports both UUID and regular IDs
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  console.log('Delete user request received');
  const { id } = req.params;

  await userService.deleteUser(id);

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});
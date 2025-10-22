import { Request, Response } from 'express';
import { query } from '../database/connection';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { UpdateUser } from '../types/user';
import { Pagination } from '../types/common';
import { getPaginationParams } from '../utils/pagination';

// Get all users with pagination
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  console.log('Get users request received');
  const { page, limit, offset, sortBy, sortOrder } = getPaginationParams(req, 'created_at');

  // Get total count
  const countResult = await query('SELECT COUNT(*) FROM users WHERE is_active = true');
  const total = parseInt(countResult.rows[0].count);

  // Get users
  const result = await query(
    `SELECT id, first_name, last_name, email, role, phone, date_of_birth, address, is_active, created_at, updated_at
     FROM users 
     WHERE is_active = true
     ORDER BY ${sortBy} ${sortOrder}
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const users = result.rows.map((user: any) => ({
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    dateOfBirth: user.date_of_birth,
    address: user.address,
    isActive: user.is_active,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }));

  res.json({
    success: true,
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get user by ID (supports both UUID and regular IDs)
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  console.log('Get user by ID request received');
  const { id } = req.params;
console.log("Looking for user with ID:", req.params.id);
  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  let result;
  if (isUUID) {
    // Search by UUID in the main id column
    result = await query(
      'SELECT id, first_name, last_name, email, role, phone, date_of_birth, address, is_active, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
  } else {
    // Search by regular ID in alt_id column or try to cast id as UUID if it fails, search by alt_id
    result = await query(
      'SELECT id, first_name, last_name, email, role, phone, date_of_birth, address, is_active, created_at, updated_at FROM users WHERE alt_id = $1 OR id::text = $1',
      [id]
    );
  }
console.log("Query result:", result.rows);
  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = result.rows[0];

  res.json({
    success: true,
    data: {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      dateOfBirth: user.date_of_birth,
      address: user.address,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    },
  });
});

// Update user (supports both UUID and regular IDs)
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  console.log('Update user request received');
  const { id } = req.params;
  const updateData: UpdateUser = req.body;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if user exists
  let existingUser;
  if (isUUID) {
    existingUser = await query('SELECT id FROM users WHERE id = $1', [id]);
  } else {
    existingUser = await query('SELECT id FROM users WHERE alt_id = $1 OR id::text = $1', [id]);
  }

  if (existingUser.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const actualUserId = existingUser.rows[0].id;

  // Build update query dynamically
  const updateFields = [];
  const values = [];
  let paramCount = 1;

  if (updateData.firstName) {
    updateFields.push(`first_name = $${paramCount++}`);
    values.push(updateData.firstName);
  }
  if (updateData.lastName) {
    updateFields.push(`last_name = $${paramCount++}`);
    values.push(updateData.lastName);
  }
  if (updateData.email) {
    updateFields.push(`email = $${paramCount++}`);
    values.push(updateData.email);
  }
  if (updateData.role) {
    updateFields.push(`role = $${paramCount++}`);
    values.push(updateData.role);
  }
  if (updateData.phone !== undefined) {
    updateFields.push(`phone = $${paramCount++}`);
    values.push(updateData.phone);
  }
  if (updateData.dateOfBirth !== undefined) {
    updateFields.push(`date_of_birth = $${paramCount++}`);
    values.push(updateData.dateOfBirth);
  }
  if (updateData.address !== undefined) {
    updateFields.push(`address = $${paramCount++}`);
    values.push(updateData.address);
  }

  if (updateFields.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  values.push(actualUserId);

  const result = await query(
    `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING id, first_name, last_name, email, role, phone, date_of_birth, address, is_active, created_at, updated_at`,
    values
  );

  const user = result.rows[0];

  res.json({
    success: true,
    message: 'User updated successfully',
    data: {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      dateOfBirth: user.date_of_birth,
      address: user.address,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    },
  });
});

// Delete user (soft delete) - supports both UUID and regular IDs
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  console.log('Delete user request received');
  const { id } = req.params;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  let result;
  if (isUUID) {
    result = await query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
      [id]
    );
  } else {
    result = await query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE alt_id = $1 OR id::text = $1 RETURNING id',
      [id]
    );
  }

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});

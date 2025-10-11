import { Request, Response } from 'express';
import { query } from '../database/connection';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { CreateUser, Login } from '../types/user';

// Register user
export const register = asyncHandler(async (req: Request, res: Response) => {
  console.log('Register request received');
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  const userData: CreateUser = req.body;

  // Check if user already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1',
    [userData.email]
  );

  if (existingUser.rows.length > 0) {
    throw new AppError('User with this email already exists', 409);
  }

  // Hash password
  const passwordHash = await hashPassword(userData.password);

  // Generate sequential ID for alt_id
  const seqIdResult = await query('SELECT generate_sequential_id($1) as next_id', ['users']);
  const sequentialId = seqIdResult.rows[0].next_id;

  // Create user with both UUID and sequential ID
  const result = await query(
    `INSERT INTO users (first_name, last_name, email, password_hash, role, phone, date_of_birth, address, alt_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, alt_id, first_name, last_name, email, role, phone, date_of_birth, address, is_active, created_at, updated_at`,
    [
      userData.firstName,
      userData.lastName,
      userData.email,
      passwordHash,
      userData.role,
      userData.phone || null,
      userData.dateOfBirth || null,
      userData.address || null,
      sequentialId.toString(),
    ]
  );

  const user = result.rows[0];

  // Generate token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user.id,
        altId: user.alt_id,
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
      token,
    },
  });
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response) => {
  console.log('Login request received');
  const { email, password }: Login = req.body;

  // Find user
  const result = await query(
    'SELECT id, first_name, last_name, email, password_hash, role, phone, date_of_birth, address, is_active FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password', 401);
  }

  const user = result.rows[0];

  // Check if user is active
  if (!user.is_active) {
    throw new AppError('Account is deactivated', 401);
  }

  // Compare password
  const isPasswordValid = await comparePassword(password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        address: user.address,
        isActive: user.is_active,
      },
      token,
    },
  });
});

// Get current user profile
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  console.log('Get profile request received');
  const userId = req.user?.id;

  const result = await query(
    'SELECT id, first_name, last_name, email, role, phone, date_of_birth, address, is_active, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );

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

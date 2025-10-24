import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthService } from '../services/authService';

const authService = new AuthService();

// Register user
export const register = asyncHandler(async (req: Request, res: Response) => {
  console.log('Register request received');
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  
  const userData = req.body;
  const result = await authService.register(userData);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response) => {
  console.log('Login request received');
  
  const loginData = req.body;
  const result = await authService.login(loginData);

  res.json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

// Get current user profile
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await authService.getCurrentUser(userId);

  res.json({
    success: true,
    data: user,
  });
});

// Alias for backward compatibility
export const getProfile = getCurrentUser;
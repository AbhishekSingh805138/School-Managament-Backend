import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { AuthService } from '../services/authService';
import { auditAuth } from '../middleware/auditLogger';

const authService = new AuthService();

// Register user
export const register = asyncHandler(async (req: Request, res: Response) => {
  console.log('Register request received');
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  
  const userData = req.body;
  
  try {
    const result = await authService.register(userData);
    
    // Audit successful registration
    auditAuth.login(req, userData.email, true, {
      userId: result.user.id,
      role: result.user.role,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  } catch (error) {
    // Audit failed registration attempt
    auditAuth.failedAttempt(req, userData.email, error instanceof Error ? error.message : 'Registration failed');
    throw error;
  }
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response) => {
  console.log('Login request received');
  
  const loginData = req.body;
  
  try {
    const result = await authService.login(loginData);
    
    // Audit successful login
    auditAuth.login(req, loginData.email, true, {
      userId: result.user.id,
      role: result.user.role,
    });

    console.log('🎯 Login successful, generated token:', result.token.substring(0, 50) + '...');
    
    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    // Audit failed login attempt
    auditAuth.failedAttempt(req, loginData.email, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
});

// Get current user profile
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  console.log('📋 Profile request for user:', req.user!.id);
  const userId = req.user!.id;
  const user = await authService.getCurrentUser(userId);

  res.json({
    success: true,
    data: {
      user: user,
    },
  });
});

// Refresh access token
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  const result = await authService.refreshToken(refreshToken);

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: result,
  });
});

// Logout user
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  await authService.logout(refreshToken);

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// Logout from all devices
export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await authService.logoutAll(userId);

  res.json({
    success: true,
    message: 'Logged out from all devices successfully',
  });
});

// Alias for backward compatibility
export const getProfile = getCurrentUser;

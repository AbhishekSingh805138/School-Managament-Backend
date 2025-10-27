import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import { UserRole } from '../types/user';

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT access token (short-lived)
export const generateAccessToken = (payload: {
  id: string;
  email: string;
  role: UserRole;
}): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '15m', // Short-lived access token
  } as jwt.SignOptions);
};

// Generate JWT refresh token (long-lived)
export const generateRefreshToken = (payload: {
  id: string;
  email: string;
  role: UserRole;
}): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN, // Use the configured expiration for refresh token
  } as jwt.SignOptions);
};

// Generate both access and refresh tokens
export const generateTokens = (payload: {
  id: string;
  email: string;
  role: UserRole;
}) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

// Legacy function for backward compatibility
export const generateToken = (payload: {
  id: string;
  email: string;
  role: UserRole;
}): string => {
  return generateAccessToken(payload);
};

// Verify JWT token
export const verifyToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET);
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    jwt.verify(token, env.JWT_SECRET);
    return false;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return true;
    }
    throw error; // Re-throw other errors
  }
};

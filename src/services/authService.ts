import { BaseService } from './baseService';
import { AppError, AuthError } from '../middleware/errorHandler';
import { CreateUser, Login } from '../types/user';
import { hashPassword, comparePassword, generateTokens, verifyToken, isTokenExpired } from '../utils/auth';
import { RateLimitService } from './rateLimitService';

export class AuthService extends BaseService {
  private rateLimitService: RateLimitService;

  constructor() {
    super();
    this.rateLimitService = new RateLimitService();
  }
  async register(userData: CreateUser) {
    // Check if user already exists
    const existingUser = await this.executeQuery(
      'SELECT id FROM users WHERE email = $1',
      [userData.email]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password);

    // Generate sequential ID for alt_id
    const sequentialId = await this.generateSequentialId('users');

    // Create user
    const result = await this.executeQuery(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, phone, date_of_birth, address, alt_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, alt_id, first_name, last_name, email, role, phone, date_of_birth, address, is_active, created_at, updated_at`,
      [
        userData.firstName,
        userData.lastName,
        userData.email,
        passwordHash,
        userData.role || 'student',
        userData.phone || null,
        userData.dateOfBirth || null,
        userData.address || null,
        sequentialId
      ]
    );

    const user = result.rows[0];

    // Generate JWT tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token in database
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.transformUserResponse(user),
      token: tokens.accessToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(loginData: Login) {
    // Find user by email
    const result = await this.executeQuery(
      'SELECT id, first_name, last_name, email, password_hash, role, is_active FROM users WHERE email = $1',
      [loginData.email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      throw new AppError('Account is deactivated. Please contact administrator.', 401);
    }

    // Verify password
    const isPasswordValid = await comparePassword(loginData.password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate JWT tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token in database
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
      },
      token: tokens.accessToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async getCurrentUser(userId: string) {
    const result = await this.executeQuery(
      'SELECT id, first_name, last_name, email, role, phone, date_of_birth, address, is_active, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    return this.transformUserResponse(result.rows[0]);
  }

  // Store refresh token in database
  private async storeRefreshToken(userId: string, refreshToken: string) {
    // First, invalidate any existing refresh tokens for this user
    await this.executeQuery(
      'UPDATE refresh_tokens SET is_active = false WHERE user_id = $1',
      [userId]
    );

    // Store the new refresh token
    await this.executeQuery(
      `INSERT INTO refresh_tokens (user_id, token, expires_at, is_active)
       VALUES ($1, $2, NOW() + INTERVAL '7 days', true)`,
      [userId, refreshToken]
    );
  }

  // Refresh access token using refresh token
  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const decoded = verifyToken(refreshToken) as {
        id: string;
        email: string;
        role: string;
      };

      // Check if refresh token exists and is active in database
      const tokenResult = await this.executeQuery(
        `SELECT rt.id, rt.user_id, u.email, u.role, u.is_active
         FROM refresh_tokens rt
         JOIN users u ON rt.user_id = u.id
         WHERE rt.token = $1 AND rt.is_active = true AND rt.expires_at > NOW()`,
        [refreshToken]
      );

      if (tokenResult.rows.length === 0) {
        throw new AppError('Invalid or expired refresh token', 401);
      }

      const tokenData = tokenResult.rows[0];

      // Check if user is still active
      if (!tokenData.is_active) {
        throw new AppError('User account is deactivated', 401);
      }

      // Generate new tokens
      const tokens = generateTokens({
        id: tokenData.user_id,
        email: tokenData.email,
        role: tokenData.role,
      });

      // Store new refresh token and invalidate old one
      await this.executeTransaction(async (client) => {
        // Invalidate old refresh token
        await client.query(
          'UPDATE refresh_tokens SET is_active = false WHERE token = $1',
          [refreshToken]
        );

        // Store new refresh token
        await client.query(
          `INSERT INTO refresh_tokens (user_id, token, expires_at, is_active)
           VALUES ($1, $2, NOW() + INTERVAL '7 days', true)`,
          [tokenData.user_id, tokens.refreshToken]
        );
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Invalid refresh token', 401);
    }
  }

  // Logout - invalidate refresh token
  async logout(refreshToken: string) {
    await this.executeQuery(
      'UPDATE refresh_tokens SET is_active = false WHERE token = $1',
      [refreshToken]
    );

    return { success: true };
  }

  // Logout from all devices - invalidate all refresh tokens for user
  async logoutAll(userId: string) {
    await this.executeQuery(
      'UPDATE refresh_tokens SET is_active = false WHERE user_id = $1',
      [userId]
    );

    return { success: true };
  }

  private transformUserResponse(user: any) {
    return {
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
    };
  }
}
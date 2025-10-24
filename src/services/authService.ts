import { BaseService } from './baseService';
import { AppError } from '../middleware/errorHandler';
import { CreateUser, Login } from '../types/user';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';

export class AuthService extends BaseService {
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

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: this.transformUserResponse(user),
      token,
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

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
      },
      token,
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
import { BaseService } from './baseService';
import { AppError } from '../middleware/errorHandler';
import { CreateUser, UpdateUser } from '../types/user';
import { getPaginationParams } from '../utils/pagination';
import { hashPassword } from '../utils/auth';
import cacheService, { CacheKeys, CacheTTL } from './cacheService';

export class UserService extends BaseService {
  async createUser(userData: CreateUser) {
    // Check duplicate email
    const existing = await this.executeQuery('SELECT 1 FROM users WHERE email = $1', [userData.email]);
    if (existing.rows.length > 0) {
      throw new AppError('User with this email already exists', 409);
    }

    const passwordHash = await hashPassword(userData.password);
    const sequentialId = await this.generateSequentialId('users');

    const result = await this.executeQuery(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, phone, date_of_birth, address, alt_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, first_name, last_name, email, role, phone, date_of_birth, address, is_active, created_at, updated_at`,
      [
        userData.firstName,
        userData.lastName,
        userData.email,
        passwordHash,
        userData.role,
        userData.phone || null,
        userData.dateOfBirth || null,
        userData.address || null,
        sequentialId,
      ]
    );

    // Invalidate users cache after creation
    await cacheService.delPattern(`${CacheKeys.USER_SESSION}*`);

    return this.transformUserResponse(result.rows[0]);
  }

  async getUsers(req: any) {
    const { page, limit, offset, sortBy, sortOrder } = getPaginationParams(req, 'created_at');
    
    // Create cache key for this specific query
    const cacheKey = `users:list:${page}:${limit}:${sortBy}:${sortOrder}`;

    return await cacheService.cacheQuery(
      cacheKey,
      async () => {
        // Get total count
        const countResult = await this.executeQuery(
          'SELECT COUNT(*) FROM users WHERE is_active = true'
        );
        const total = parseInt(countResult.rows[0].count);

        // Get users
        const result = await this.executeQuery(
          `SELECT id, first_name, last_name, email, role, phone, date_of_birth, address, is_active, created_at, updated_at
           FROM users 
           WHERE is_active = true
           ORDER BY ${sortBy} ${sortOrder}
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        );

        const users = result.rows.map((user: any) => this.transformUserResponse(user));

        return {
          users,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      },
      CacheTTL.FIVE_MINUTES
    );
  }

  async getUserById(id: string) {
    const cacheKey = `${CacheKeys.USER_SESSION}:${id}`;
    
    return await cacheService.cacheQuery(
      cacheKey,
      async () => {
        const user = await this.checkEntityExists('users', id, 'alt_id');
        return this.transformUserResponse(user);
      },
      CacheTTL.TEN_MINUTES
    );
  }

  async updateUser(id: string, updateData: UpdateUser) {
    const existingUser = await this.checkEntityExists('users', id, 'alt_id');
    const actualUserId = existingUser.id;

    const { query: updateQuery, values } = this.buildUpdateQuery('users', updateData);
    values.push(actualUserId);

    const result = await this.executeQuery(updateQuery, values);
    
    // Invalidate user cache after update
    await cacheService.delPattern(`${CacheKeys.USER_SESSION}*`);
    await cacheService.delPattern('users:list*');
    
    return this.transformUserResponse(result.rows[0]);
  }

  async deleteUser(id: string) {
    const isUUID = this.validateUUID(id);
    
    let result;
    if (isUUID) {
      result = await this.executeQuery(
        'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
        [id]
      );
    } else {
      result = await this.executeQuery(
        'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE alt_id = $1 OR id::text = $1 RETURNING id',
        [id]
      );
    }

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    // Invalidate user cache after deletion
    await cacheService.delPattern(`${CacheKeys.USER_SESSION}*`);
    await cacheService.delPattern('users:list*');

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
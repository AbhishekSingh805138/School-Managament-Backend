import { BaseService } from './baseService';
import { AppError } from '../middleware/errorHandler';
import { UpdateUser } from '../types/user';
import { getPaginationParams } from '../utils/pagination';

export class UserService extends BaseService {
  async getUsers(req: any) {
    const { page, limit, offset, sortBy, sortOrder } = getPaginationParams(req, 'created_at');

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
  }

  async getUserById(id: string) {
    const user = await this.checkEntityExists('users', id, 'alt_id');
    return this.transformUserResponse(user);
  }

  async updateUser(id: string, updateData: UpdateUser) {
    const existingUser = await this.checkEntityExists('users', id, 'alt_id');
    const actualUserId = existingUser.id;

    const { query: updateQuery, values } = this.buildUpdateQuery('users', updateData);
    values.push(actualUserId);

    const result = await this.executeQuery(updateQuery, values);
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
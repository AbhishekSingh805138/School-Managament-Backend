import { BaseService } from './baseService';
import { AppError } from '../middleware/errorHandler';
import { CreateParent, UpdateParent, CreateStudentParent } from '../types/parent';
import { getPaginationParams } from '../utils/pagination';
import { hashPassword } from '../utils/auth';

export class ParentService extends BaseService {
  async createParent(parentData: CreateParent) {
    // Check if user with email already exists
    const existingUser = await this.executeQuery(
      'SELECT id FROM users WHERE email = $1',
      [parentData.email]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(parentData.password);

    // Generate sequential ID for alt_id
    const sequentialId = await this.generateSequentialId('users');

    // Create parent user account
    const result = await this.executeQuery(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, phone, address, alt_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, alt_id, first_name, last_name, email, role, phone, address, is_active, created_at, updated_at`,
      [
        parentData.firstName,
        parentData.lastName,
        parentData.email,
        passwordHash,
        'parent',
        parentData.phone || null,
        parentData.address || null,
        sequentialId
      ]
    );

    return this.transformParentResponse(result.rows[0]);
  }

  async getParents(req: any) {
    const { page, limit, offset, sortBy, sortOrder } = getPaginationParams(req, 'first_name');
    const { isActive, search } = req.query;

    let whereClause = "WHERE role = 'parent'";
    const queryParams: any[] = [];

    if (isActive !== undefined) {
      whereClause += ` AND is_active = $${queryParams.length + 1}`;
      queryParams.push(isActive === 'true');
    }

    if (search) {
      whereClause += ` AND (first_name ILIKE $${queryParams.length + 1} OR last_name ILIKE $${queryParams.length + 1} OR email ILIKE $${queryParams.length + 1})`;
      queryParams.push(`%${search}%`);
    }

    // Get total count
    const countResult = await this.executeQuery(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get parents
    const result = await this.executeQuery(
      `SELECT id, alt_id, first_name, last_name, email, role, phone, address, is_active, created_at, updated_at
       FROM users 
       ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      [...queryParams, limit, offset]
    );

    const parents = result.rows.map((parent: any) => this.transformParentResponse(parent));

    return {
      parents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getParentById(id: string) {
    const parent = await this.checkEntityExists('users', id, 'alt_id');

    if (parent.role !== 'parent') {
      throw new AppError('User is not a parent', 400);
    }

    // Get associated children
    const childrenResult = await this.executeQuery(
      `SELECT sp.id as relationship_id, sp.relationship_type, sp.is_primary,
              s.id as student_id, s.student_id as student_number, s.class_id,
              u.first_name, u.last_name,
              c.name as class_name, c.grade, c.section
       FROM student_parents sp
       JOIN students s ON sp.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON s.class_id = c.id
       WHERE sp.parent_user_id = $1 AND s.is_active = true
       ORDER BY u.first_name, u.last_name`,
      [parent.id]
    );

    const children = childrenResult.rows.map((child: any) => ({
      relationshipId: child.relationship_id,
      relationshipType: child.relationship_type,
      isPrimary: child.is_primary,
      student: {
        id: child.student_id,
        studentId: child.student_number,
        name: `${child.first_name} ${child.last_name}`,
        class: {
          id: child.class_id,
          name: child.class_name,
          grade: child.grade,
          section: child.section,
        },
      },
    }));

    return {
      ...this.transformParentResponse(parent),
      children,
    };
  }

  async updateParent(id: string, updateData: UpdateParent) {
    const existingParent = await this.checkEntityExists('users', id, 'alt_id');
    
    if (existingParent.role !== 'parent') {
      throw new AppError('User is not a parent', 400);
    }

    const actualParentId = existingParent.id;

    const { query: updateQuery, values } = this.buildUpdateQuery('users', updateData);
    values.push(actualParentId);

    const result = await this.executeQuery(updateQuery, values);
    return this.transformParentResponse(result.rows[0]);
  }

  async deleteParent(id: string) {
    const existingParent = await this.checkEntityExists('users', id, 'alt_id');
    
    if (existingParent.role !== 'parent') {
      throw new AppError('User is not a parent', 400);
    }

    const actualParentId = existingParent.id;

    // Check if parent has active children relationships
    const childrenCheck = await this.executeQuery(
      `SELECT COUNT(*) as children_count FROM student_parents sp
       JOIN students s ON sp.student_id = s.id
       WHERE sp.parent_user_id = $1 AND s.is_active = true`,
      [actualParentId]
    );

    const childrenCount = parseInt(childrenCheck.rows[0].children_count);

    if (childrenCount > 0) {
      throw new AppError(
        `Cannot delete parent. They have ${childrenCount} active children relationships. Please remove relationships first.`,
        409
      );
    }

    // Soft delete the parent
    await this.executeQuery(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [actualParentId]
    );

    return { success: true };
  }

  async linkStudentToParent(linkData: CreateStudentParent) {
    // Validate student exists and is active
    const studentExists = await this.executeQuery(
      `SELECT s.id, s.student_id, u.first_name, u.last_name
       FROM students s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.id = $1 AND s.is_active = true AND u.is_active = true`,
      [linkData.studentId]
    );

    if (studentExists.rows.length === 0) {
      throw new AppError('Student not found or inactive', 404);
    }

    // Validate parent exists and is active
    const parentExists = await this.executeQuery(
      'SELECT id, first_name, last_name FROM users WHERE id = $1 AND role = \'parent\' AND is_active = true',
      [linkData.parentUserId]
    );

    if (parentExists.rows.length === 0) {
      throw new AppError('Parent not found or inactive', 404);
    }

    // Check if relationship already exists
    const existingRelationship = await this.executeQuery(
      'SELECT id FROM student_parents WHERE student_id = $1 AND parent_user_id = $2',
      [linkData.studentId, linkData.parentUserId]
    );

    if (existingRelationship.rows.length > 0) {
      throw new AppError('Relationship between student and parent already exists', 409);
    }

    return await this.executeTransaction(async (client) => {
      // If setting as primary, remove primary status from other relationships for this student
      if (linkData.isPrimary) {
        await client.query(
          'UPDATE student_parents SET is_primary = false WHERE student_id = $1',
          [linkData.studentId]
        );
      }

      // Create relationship
      const result = await client.query(
        `INSERT INTO student_parents (student_id, parent_user_id, relationship_type, is_primary)
         VALUES ($1, $2, $3, $4)
         RETURNING id, student_id, parent_user_id, relationship_type, is_primary, created_at, updated_at`,
        [
          linkData.studentId,
          linkData.parentUserId,
          linkData.relationshipType,
          linkData.isPrimary || false
        ]
      );

      const relationship = result.rows[0];
      const student = studentExists.rows[0];
      const parent = parentExists.rows[0];

      return {
        id: relationship.id,
        studentId: relationship.student_id,
        parentUserId: relationship.parent_user_id,
        relationshipType: relationship.relationship_type,
        isPrimary: relationship.is_primary,
        createdAt: relationship.created_at,
        updatedAt: relationship.updated_at,
        student: {
          id: student.id,
          studentId: student.student_id,
          name: `${student.first_name} ${student.last_name}`,
        },
        parent: {
          id: parent.id,
          name: `${parent.first_name} ${parent.last_name}`,
        },
      };
    });
  }

  async unlinkStudentFromParent(studentId: string, parentUserId: string) {
    // Check if relationship exists
    const existingRelationship = await this.executeQuery(
      'SELECT id FROM student_parents WHERE student_id = $1 AND parent_user_id = $2',
      [studentId, parentUserId]
    );

    if (existingRelationship.rows.length === 0) {
      throw new AppError('Relationship between student and parent not found', 404);
    }

    // Remove relationship
    await this.executeQuery(
      'DELETE FROM student_parents WHERE student_id = $1 AND parent_user_id = $2',
      [studentId, parentUserId]
    );

    return { success: true };
  }

  async getParentChildren(parentId: string) {
    const parent = await this.checkEntityExists('users', parentId, 'alt_id');
    
    if (parent.role !== 'parent') {
      throw new AppError('User is not a parent', 400);
    }

    // Get children with detailed information
    const childrenResult = await this.executeQuery(
      `SELECT sp.id as relationship_id, sp.relationship_type, sp.is_primary,
              s.id as student_id, s.student_id as student_number, s.class_id, s.enrollment_date,
              u.first_name, u.last_name, u.email,
              c.name as class_name, c.grade, c.section,
              ay.name as academic_year_name
       FROM student_parents sp
       JOIN students s ON sp.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON s.class_id = c.id
       JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE sp.parent_user_id = $1 AND s.is_active = true
       ORDER BY u.first_name, u.last_name`,
      [parent.id]
    );

    const children = childrenResult.rows.map((child: any) => ({
      relationshipId: child.relationship_id,
      relationshipType: child.relationship_type,
      isPrimary: child.is_primary,
      student: {
        id: child.student_id,
        studentId: child.student_number,
        name: `${child.first_name} ${child.last_name}`,
        email: child.email,
        enrollmentDate: child.enrollment_date,
        class: {
          id: child.class_id,
          name: child.class_name,
          grade: child.grade,
          section: child.section,
          academicYear: child.academic_year_name,
        },
      },
    }));

    return {
      parent: this.transformParentResponse(parent),
      children,
      totalChildren: children.length,
    };
  }

  private transformParentResponse(parent: any) {
    return {
      id: parent.id,
      altId: parent.alt_id,
      firstName: parent.first_name,
      lastName: parent.last_name,
      email: parent.email,
      role: parent.role,
      phone: parent.phone,
      address: parent.address,
      isActive: parent.is_active,
      createdAt: parent.created_at,
      updatedAt: parent.updated_at,
    };
  }
}
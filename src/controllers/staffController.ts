import { Request, Response } from 'express';
import { query, getClient } from '../database/connection';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { 
  CreateStaffSchema,
  UpdateStaffSchema,
  StaffQuerySchema,
  StaffResponse,
  StaffSummary,
  DepartmentSummary
} from '../types/staff';
import { getPaginationParams } from '../utils/pagination';
import bcrypt from 'bcrypt';

// Create staff member
export const createStaff = asyncHandler(async (req: Request, res: Response) => {
  const staffData = CreateStaffSchema.parse(req.body);
  const userRole = req.user!.role;

  // Only admins can create staff members
  if (userRole !== 'admin') {
    throw new AppError('Only administrators can create staff members', 403);
  }

  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Check if email already exists
    const emailCheck = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [staffData.email]
    );

    if (emailCheck.rows.length > 0) {
      throw new AppError('Email already exists', 409);
    }

    // Check if employee ID already exists
    const employeeIdCheck = await client.query(
      'SELECT id FROM staff WHERE employee_id = $1',
      [staffData.employeeId]
    );

    if (employeeIdCheck.rows.length > 0) {
      throw new AppError('Employee ID already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(staffData.password, 10);

    // Generate sequential ID for user
    const userIdResult = await client.query('SELECT nextval(\'users_id_seq\') as id');
    const userSequentialId = userIdResult.rows[0].id;

    // Create user account
    const userResult = await client.query(
      `INSERT INTO users (
         id, first_name, last_name, email, password_hash, role, phone, 
         date_of_birth, address, is_active
       ) VALUES ($1, $2, $3, $4, $5, 'staff', $6, $7, $8, true)
       RETURNING *`,
      [
        userSequentialId,
        staffData.firstName,
        staffData.lastName,
        staffData.email,
        hashedPassword,
        staffData.phone || null,
        staffData.dateOfBirth || null,
        staffData.address || null
      ]
    );

    const user = userResult.rows[0];

    // Generate sequential ID for staff
    const staffIdResult = await client.query('SELECT nextval(\'staff_id_seq\') as id');
    const staffSequentialId = staffIdResult.rows[0].id;

    // Create staff profile
    const staffResult = await client.query(
      `INSERT INTO staff (
         id, user_id, employee_id, department, position, joining_date, 
         salary, responsibilities, is_active
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [
        staffSequentialId,
        user.id,
        staffData.employeeId,
        staffData.department,
        staffData.position,
        staffData.joiningDate,
        staffData.salary || null,
        staffData.responsibilities || null
      ]
    );

    await client.query('COMMIT');

    // Fetch complete staff data with user information
    const completeStaff = await getStaffWithUser(staffResult.rows[0].id);

    res.status(201).json({
      success: true,
      data: completeStaff,
      message: 'Staff member created successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// Get staff members with filtering and pagination
export const getStaff = asyncHandler(async (req: Request, res: Response) => {
  const queryParams = StaffQuerySchema.parse(req.query);
  const userRole = req.user!.role;
  const { offset, limit, sortBy, sortOrder } = getPaginationParams(req);

  // Build WHERE clause based on filters
  let whereClause = 'WHERE s.is_active = true';
  const sqlParams: any[] = [];

  // Add role-based authorization
  if (userRole === 'staff') {
    // Staff can only view their own profile
    whereClause += ` AND u.id = $${sqlParams.length + 1}`;
    sqlParams.push(req.user!.id);
  }

  // Add optional filters
  if (queryParams.department) {
    whereClause += ` AND s.department = $${sqlParams.length + 1}`;
    sqlParams.push(queryParams.department);
  }

  if (queryParams.position) {
    whereClause += ` AND s.position = $${sqlParams.length + 1}`;
    sqlParams.push(queryParams.position);
  }

  if (queryParams.isActive !== undefined) {
    whereClause = whereClause.replace('s.is_active = true', `s.is_active = $${sqlParams.length + 1}`);
    sqlParams.push(queryParams.isActive);
  }

  if (queryParams.joiningDateFrom) {
    whereClause += ` AND s.joining_date >= $${sqlParams.length + 1}`;
    sqlParams.push(queryParams.joiningDateFrom);
  }

  if (queryParams.joiningDateTo) {
    whereClause += ` AND s.joining_date <= $${sqlParams.length + 1}`;
    sqlParams.push(queryParams.joiningDateTo);
  }

  if (queryParams.search) {
    whereClause += ` AND (
      u.first_name ILIKE $${sqlParams.length + 1} OR 
      u.last_name ILIKE $${sqlParams.length + 1} OR 
      u.email ILIKE $${sqlParams.length + 1} OR 
      s.employee_id ILIKE $${sqlParams.length + 1}
    )`;
    sqlParams.push(`%${queryParams.search}%`);
  }

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total
     FROM staff s
     JOIN users u ON s.user_id = u.id
     ${whereClause}`,
    sqlParams
  );

  const total = parseInt(countResult.rows[0].total);

  // Get staff with user information
  const result = await query(
    `SELECT 
       s.*,
       u.first_name,
       u.last_name,
       u.email,
       u.phone,
       u.date_of_birth,
       u.address
     FROM staff s
     JOIN users u ON s.user_id = u.id
     ${whereClause}
     ORDER BY ${getSortColumn(sortBy)} ${sortOrder}
     LIMIT $${sqlParams.length + 1} OFFSET $${sqlParams.length + 2}`,
    [...sqlParams, limit, offset]
  );

  const staff = result.rows.map(formatStaffResponse);

  res.json({
    success: true,
    data: staff,
    pagination: {
      page: queryParams.page,
      limit: queryParams.limit,
      total,
      pages: Math.ceil(total / queryParams.limit)
    }
  });
});

// Get single staff member by ID
export const getStaffById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const staff = await getStaffWithUser(parseInt(id));

  if (!staff) {
    throw new AppError('Staff member not found', 404);
  }

  // Check authorization
  if (userRole === 'staff' && staff.userId !== userId) {
    throw new AppError('You can only view your own profile', 403);
  }

  res.json({
    success: true,
    data: staff
  });
});

// Update staff member
export const updateStaff = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = UpdateStaffSchema.parse(req.body);
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Get existing staff member
  const existingStaff = await query(
    'SELECT s.*, u.id as user_id FROM staff s JOIN users u ON s.user_id = u.id WHERE s.id = $1',
    [id]
  );

  if (existingStaff.rows.length === 0) {
    throw new AppError('Staff member not found', 404);
  }

  const staff = existingStaff.rows[0];

  // Check authorization
  if (userRole === 'staff' && staff.user_id !== userId) {
    throw new AppError('You can only update your own profile', 403);
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Update user information if provided
    const userUpdateFields: string[] = [];
    const userUpdateValues: any[] = [];
    let userParamIndex = 1;

    if (updateData.firstName !== undefined) {
      userUpdateFields.push(`first_name = $${userParamIndex++}`);
      userUpdateValues.push(updateData.firstName);
    }

    if (updateData.lastName !== undefined) {
      userUpdateFields.push(`last_name = $${userParamIndex++}`);
      userUpdateValues.push(updateData.lastName);
    }

    if (updateData.phone !== undefined) {
      userUpdateFields.push(`phone = $${userParamIndex++}`);
      userUpdateValues.push(updateData.phone);
    }

    if (updateData.dateOfBirth !== undefined) {
      userUpdateFields.push(`date_of_birth = $${userParamIndex++}`);
      userUpdateValues.push(updateData.dateOfBirth);
    }

    if (updateData.address !== undefined) {
      userUpdateFields.push(`address = $${userParamIndex++}`);
      userUpdateValues.push(updateData.address);
    }

    if (userUpdateFields.length > 0) {
      userUpdateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      userUpdateValues.push(staff.user_id);

      await client.query(
        `UPDATE users 
         SET ${userUpdateFields.join(', ')}
         WHERE id = $${userParamIndex}`,
        userUpdateValues
      );
    }

    // Update staff information if provided
    const staffUpdateFields: string[] = [];
    const staffUpdateValues: any[] = [];
    let staffParamIndex = 1;

    if (updateData.department !== undefined) {
      staffUpdateFields.push(`department = $${staffParamIndex++}`);
      staffUpdateValues.push(updateData.department);
    }

    if (updateData.position !== undefined) {
      staffUpdateFields.push(`position = $${staffParamIndex++}`);
      staffUpdateValues.push(updateData.position);
    }

    if (updateData.salary !== undefined) {
      staffUpdateFields.push(`salary = $${staffParamIndex++}`);
      staffUpdateValues.push(updateData.salary);
    }

    if (updateData.responsibilities !== undefined) {
      staffUpdateFields.push(`responsibilities = $${staffParamIndex++}`);
      staffUpdateValues.push(updateData.responsibilities);
    }

    if (staffUpdateFields.length > 0) {
      staffUpdateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      staffUpdateValues.push(id);

      await client.query(
        `UPDATE staff 
         SET ${staffUpdateFields.join(', ')}
         WHERE id = $${staffParamIndex}`,
        staffUpdateValues
      );
    }

    await client.query('COMMIT');

    // Fetch updated staff data
    const updatedStaff = await getStaffWithUser(parseInt(id));

    res.json({
      success: true,
      data: updatedStaff,
      message: 'Staff member updated successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// Deactivate staff member
export const deactivateStaff = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userRole = req.user!.role;

  // Only admins can deactivate staff members
  if (userRole !== 'admin') {
    throw new AppError('Only administrators can deactivate staff members', 403);
  }

  // Check if staff member exists
  const existingStaff = await query('SELECT * FROM staff WHERE id = $1', [id]);

  if (existingStaff.rows.length === 0) {
    throw new AppError('Staff member not found', 404);
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Deactivate staff profile
    await client.query(
      'UPDATE staff SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    // Deactivate user account
    await client.query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [existingStaff.rows[0].user_id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Staff member deactivated successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// Reactivate staff member
export const reactivateStaff = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userRole = req.user!.role;

  // Only admins can reactivate staff members
  if (userRole !== 'admin') {
    throw new AppError('Only administrators can reactivate staff members', 403);
  }

  // Check if staff member exists and is inactive
  const existingStaff = await query(
    'SELECT * FROM staff WHERE id = $1 AND is_active = false',
    [id]
  );

  if (existingStaff.rows.length === 0) {
    throw new AppError('Staff member not found or already active', 404);
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Reactivate staff profile
    await client.query(
      'UPDATE staff SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    // Reactivate user account
    await client.query(
      'UPDATE users SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [existingStaff.rows[0].user_id]
    );

    await client.query('COMMIT');

    // Fetch updated staff data
    const updatedStaff = await getStaffWithUser(parseInt(id));

    res.json({
      success: true,
      data: updatedStaff,
      message: 'Staff member reactivated successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// Get staff summary and statistics
export const getStaffSummary = asyncHandler(async (req: Request, res: Response) => {
  const userRole = req.user!.role;

  // Only admins can view staff summary
  if (userRole !== 'admin') {
    throw new AppError('Only administrators can view staff summary', 403);
  }

  // Get overall statistics
  const overallStats = await query(
    `SELECT 
       COUNT(*) as total_staff,
       COUNT(CASE WHEN is_active = true THEN 1 END) as active_staff,
       COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_staff
     FROM staff`
  );

  // Get department breakdown
  const departmentStats = await query(
    `SELECT 
       department,
       COUNT(*) as total_staff,
       COUNT(CASE WHEN is_active = true THEN 1 END) as active_staff,
       json_agg(
         json_build_object(
           'position', position,
           'count', position_count
         )
       ) as positions
     FROM (
       SELECT 
         department,
         position,
         is_active,
         COUNT(*) OVER (PARTITION BY department, position) as position_count
       FROM staff
     ) dept_pos
     GROUP BY department
     ORDER BY department`
  );

  // Get recent joinings (last 30 days)
  const recentJoinings = await query(
    `SELECT 
       s.id,
       u.first_name || ' ' || u.last_name as name,
       s.department,
       s.position,
       s.joining_date
     FROM staff s
     JOIN users u ON s.user_id = u.id
     WHERE s.joining_date >= CURRENT_DATE - INTERVAL '30 days'
     ORDER BY s.joining_date DESC
     LIMIT 10`
  );

  const stats = overallStats.rows[0];
  const summary: StaffSummary = {
    totalStaff: parseInt(stats.total_staff),
    activeStaff: parseInt(stats.active_staff),
    inactiveStaff: parseInt(stats.inactive_staff),
    departmentBreakdown: departmentStats.rows.map((row: any) => ({
      department: row.department,
      totalStaff: parseInt(row.total_staff),
      activeStaff: parseInt(row.active_staff),
      positions: row.positions || []
    })),
    recentJoinings: recentJoinings.rows.map((row: any) => ({
      staffId: row.id.toString(),
      name: row.name,
      department: row.department,
      position: row.position,
      joiningDate: row.joining_date
    }))
  };

  res.json({
    success: true,
    data: summary
  });
});

// Helper function to get staff with user information
async function getStaffWithUser(staffId: number): Promise<StaffResponse | null> {
  const result = await query(
    `SELECT 
       s.*,
       u.first_name,
       u.last_name,
       u.email,
       u.phone,
       u.date_of_birth,
       u.address
     FROM staff s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = $1`,
    [staffId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return formatStaffResponse(result.rows[0]);
}

// Helper function to format staff response
function formatStaffResponse(row: any): StaffResponse {
  return {
    id: row.id.toString(),
    altId: null,
    userId: row.user_id.toString(),
    employeeId: row.employee_id,
    department: row.department,
    position: row.position,
    joiningDate: row.joining_date,
    salary: row.salary ? parseFloat(row.salary) : null,
    responsibilities: row.responsibilities,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    user: {
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      dateOfBirth: row.date_of_birth,
      address: row.address,
    },
  };
}

// Helper function to get sort column
function getSortColumn(sortBy: string): string {
  const columnMap: Record<string, string> = {
    firstName: 'u.first_name',
    lastName: 'u.last_name',
    employeeId: 's.employee_id',
    department: 's.department',
    position: 's.position',
    joiningDate: 's.joining_date',
  };

  return columnMap[sortBy] || 'u.first_name';
}
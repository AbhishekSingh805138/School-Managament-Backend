import { Request, Response } from 'express';
import { query, getClient } from '../database/connection';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { hashPassword } from '../utils/auth';
import { 
  CreateParent, 
  UpdateParent,
  CreateStudentParent,
  UpdateStudentParent,
  ParentQuery
} from '../types/parent';
import { Pagination } from '../types/common';
import { getPaginationParams } from '../utils/pagination';

// Create parent account
export const createParent = asyncHandler(async (req: Request, res: Response) => {
  const parentData: CreateParent = req.body;

  // Check if user with email already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1',
    [parentData.email]
  );

  if (existingUser.rows.length > 0) {
    throw new AppError('User with this email already exists', 409);
  }

  // Hash password
  const passwordHash = await hashPassword(parentData.password);

  // Generate sequential ID for alt_id
  const seqIdResult = await query('SELECT generate_sequential_id($1) as next_id', ['users']);
  const sequentialId = seqIdResult.rows[0].next_id;

  // Create parent user account
  const result = await query(
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
      sequentialId.toString(),
    ]
  );

  const parent = result.rows[0];

  res.status(201).json({
    success: true,
    message: 'Parent account created successfully',
    data: {
      id: parent.id,
      firstName: parent.first_name,
      lastName: parent.last_name,
      email: parent.email,
      phone: parent.phone,
      address: parent.address,
      isActive: parent.is_active,
      createdAt: parent.created_at,
      updatedAt: parent.updated_at,
    },
  });
});

// Get all parents
export const getParents = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, offset, sortBy, sortOrder } = getPaginationParams(req, 'firstName');
  const queryParams = req.query as any as ParentQuery;
  let whereClause = "WHERE u.role = 'parent'";
  const values: any[] = [];

  if (queryParams.search) {
    whereClause += ` AND (u.first_name ILIKE $${values.length + 1} OR u.last_name ILIKE $${values.length + 1} OR u.email ILIKE $${values.length + 1} OR u.phone ILIKE $${values.length + 1})`;
    values.push(`%${queryParams.search}%`);
  }

  if (queryParams.hasChildren !== undefined) {
    if (queryParams.hasChildren) {
      whereClause += ` AND EXISTS (SELECT 1 FROM student_parents sp WHERE sp.parent_user_id = u.id)`;
    } else {
      whereClause += ` AND NOT EXISTS (SELECT 1 FROM student_parents sp WHERE sp.parent_user_id = u.id)`;
    }
  }

  if (queryParams.relationshipType) {
    whereClause += ` AND EXISTS (SELECT 1 FROM student_parents sp WHERE sp.parent_user_id = u.id AND sp.relationship_type = $${values.length + 1})`;
    values.push(queryParams.relationshipType);
  }

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) FROM users u ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count);

  // Get parents with children count
  const result = await query(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.address, 
            u.is_active, u.created_at, u.updated_at,
            COUNT(sp.id) as children_count
     FROM users u
     LEFT JOIN student_parents sp ON u.id = sp.parent_user_id
     ${whereClause}
     GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.address, 
              u.is_active, u.created_at, u.updated_at
     ORDER BY u.${sortBy} ${sortOrder}
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset]
  );

  const parents = result.rows.map((parent: any) => ({
    id: parent.id,
    firstName: parent.first_name,
    lastName: parent.last_name,
    email: parent.email,
    phone: parent.phone,
    address: parent.address,
    isActive: parent.is_active,
    createdAt: parent.created_at,
    updatedAt: parent.updated_at,
    childrenCount: parseInt(parent.children_count),
  }));

  res.json({
    success: true,
    data: parents,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get parent by ID
export const getParentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  let result;
  if (isUUID) {
    result = await query(
      `SELECT id, first_name, last_name, email, phone, address, is_active, created_at, updated_at
       FROM users WHERE id = $1 AND role = 'parent'`,
      [id]
    );
  } else {
    result = await query(
      `SELECT id, first_name, last_name, email, phone, address, is_active, created_at, updated_at
       FROM users WHERE (alt_id = $1 OR id::text = $1) AND role = 'parent'`,
      [id]
    );
  }

  if (result.rows.length === 0) {
    throw new AppError('Parent not found', 404);
  }

  const parent = result.rows[0];

  // Get children
  const childrenResult = await query(
    `SELECT sp.id, sp.relationship_type, sp.is_primary,
            s.id as student_id, s.student_id as student_number, s.enrollment_date,
            u.first_name, u.last_name,
            c.name as class_name, c.grade, c.section
     FROM student_parents sp
     JOIN students s ON sp.student_id = s.id
     JOIN users u ON s.user_id = u.id
     JOIN classes c ON s.class_id = c.id
     WHERE sp.parent_user_id = $1 AND s.is_active = true
     ORDER BY sp.is_primary DESC, u.first_name`,
    [parent.id]
  );

  const children = childrenResult.rows.map((child: any) => ({
    relationshipId: child.id,
    studentId: child.student_id,
    studentNumber: child.student_number,
    studentName: `${child.first_name} ${child.last_name}`,
    className: `${child.class_name} (${child.grade}-${child.section})`,
    relationshipType: child.relationship_type,
    isPrimary: child.is_primary,
    enrollmentDate: child.enrollment_date,
  }));

  res.json({
    success: true,
    data: {
      id: parent.id,
      firstName: parent.first_name,
      lastName: parent.last_name,
      email: parent.email,
      phone: parent.phone,
      address: parent.address,
      isActive: parent.is_active,
      createdAt: parent.created_at,
      updatedAt: parent.updated_at,
      children,
    },
  });
});

// Update parent
export const updateParent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: UpdateParent = req.body;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if parent exists
  let existingParent;
  if (isUUID) {
    existingParent = await query("SELECT id FROM users WHERE id = $1 AND role = 'parent'", [id]);
  } else {
    existingParent = await query("SELECT id FROM users WHERE (alt_id = $1 OR id::text = $1) AND role = 'parent'", [id]);
  }

  if (existingParent.rows.length === 0) {
    throw new AppError('Parent not found', 404);
  }

  const actualParentId = existingParent.rows[0].id;

  // Build update query dynamically
  const updateFields = [];
  const values = [];
  let paramCount = 1;

  if (updateData.firstName) {
    updateFields.push(`first_name = $${paramCount++}`);
    values.push(updateData.firstName);
  }
  if (updateData.lastName) {
    updateFields.push(`last_name = $${paramCount++}`);
    values.push(updateData.lastName);
  }
  if (updateData.phone !== undefined) {
    updateFields.push(`phone = $${paramCount++}`);
    values.push(updateData.phone);
  }
  if (updateData.address !== undefined) {
    updateFields.push(`address = $${paramCount++}`);
    values.push(updateData.address);
  }

  if (updateFields.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  values.push(actualParentId);

  const result = await query(
    `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING id, first_name, last_name, email, phone, address, is_active, created_at, updated_at`,
    values
  );

  const parent = result.rows[0];

  res.json({
    success: true,
    message: 'Parent updated successfully',
    data: {
      id: parent.id,
      firstName: parent.first_name,
      lastName: parent.last_name,
      email: parent.email,
      phone: parent.phone,
      address: parent.address,
      isActive: parent.is_active,
      createdAt: parent.created_at,
      updatedAt: parent.updated_at,
    },
  });
});

// Link parent to student
export const linkParentToStudent = asyncHandler(async (req: Request, res: Response) => {
  const linkData: CreateStudentParent = req.body;

  // Check if student exists
  const studentExists = await query(
    'SELECT id FROM students WHERE id = $1 AND is_active = true',
    [linkData.studentId]
  );

  if (studentExists.rows.length === 0) {
    throw new AppError('Student not found or inactive', 404);
  }

  // Check if parent exists
  const parentExists = await query(
    "SELECT id FROM users WHERE id = $1 AND role = 'parent' AND is_active = true",
    [linkData.parentUserId]
  );

  if (parentExists.rows.length === 0) {
    throw new AppError('Parent not found or inactive', 404);
  }

  // Check if relationship already exists
  const existingRelationship = await query(
    'SELECT id FROM student_parents WHERE student_id = $1 AND parent_user_id = $2',
    [linkData.studentId, linkData.parentUserId]
  );

  if (existingRelationship.rows.length > 0) {
    throw new AppError('Parent is already linked to this student', 409);
  }

  // If setting as primary, remove primary status from other parents of this student
  if (linkData.isPrimary) {
    await query(
      'UPDATE student_parents SET is_primary = false WHERE student_id = $1',
      [linkData.studentId]
    );
  }

  // Create relationship
  const result = await query(
    `INSERT INTO student_parents (student_id, parent_user_id, relationship_type, is_primary)
     VALUES ($1, $2, $3, $4)
     RETURNING id, student_id, parent_user_id, relationship_type, is_primary, created_at, updated_at`,
    [
      linkData.studentId,
      linkData.parentUserId,
      linkData.relationshipType,
      linkData.isPrimary || false,
    ]
  );

  const relationship = result.rows[0];

  // Get related data for response
  const relatedDataResult = await query(
    `SELECT s.student_id as student_number,
            su.first_name as student_first_name, su.last_name as student_last_name,
            c.name as class_name, c.grade, c.section,
            pu.first_name as parent_first_name, pu.last_name as parent_last_name, pu.email
     FROM student_parents sp
     JOIN students s ON sp.student_id = s.id
     JOIN users su ON s.user_id = su.id
     JOIN classes c ON s.class_id = c.id
     JOIN users pu ON sp.parent_user_id = pu.id
     WHERE sp.id = $1`,
    [relationship.id]
  );

  const relatedData = relatedDataResult.rows[0];

  res.status(201).json({
    success: true,
    message: 'Parent linked to student successfully',
    data: {
      id: relationship.id,
      studentId: relationship.student_id,
      parentUserId: relationship.parent_user_id,
      relationshipType: relationship.relationship_type,
      isPrimary: relationship.is_primary,
      createdAt: relationship.created_at,
      updatedAt: relationship.updated_at,
      student: {
        studentId: relatedData.student_number,
        name: `${relatedData.student_first_name} ${relatedData.student_last_name}`,
        class: `${relatedData.class_name} (${relatedData.grade}-${relatedData.section})`,
      },
      parent: {
        name: `${relatedData.parent_first_name} ${relatedData.parent_last_name}`,
        email: relatedData.email,
      },
    },
  });
});

// Update parent-student relationship
export const updateParentStudentRelationship = asyncHandler(async (req: Request, res: Response) => {
  const { relationshipId } = req.params;
  const updateData: UpdateStudentParent = req.body;

  // Check if relationship exists
  const existingRelationship = await query(
    'SELECT id, student_id FROM student_parents WHERE id = $1',
    [relationshipId]
  );

  if (existingRelationship.rows.length === 0) {
    throw new AppError('Parent-student relationship not found', 404);
  }

  const studentId = existingRelationship.rows[0].student_id;

  // If setting as primary, remove primary status from other parents of this student
  if (updateData.isPrimary) {
    await query(
      'UPDATE student_parents SET is_primary = false WHERE student_id = $1 AND id != $2',
      [studentId, relationshipId]
    );
  }

  // Build update query dynamically
  const updateFields = [];
  const values = [];
  let paramCount = 1;

  if (updateData.relationshipType) {
    updateFields.push(`relationship_type = $${paramCount++}`);
    values.push(updateData.relationshipType);
  }
  if (updateData.isPrimary !== undefined) {
    updateFields.push(`is_primary = $${paramCount++}`);
    values.push(updateData.isPrimary);
  }

  if (updateFields.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  values.push(relationshipId);

  const result = await query(
    `UPDATE student_parents SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING id, student_id, parent_user_id, relationship_type, is_primary, created_at, updated_at`,
    values
  );

  const relationship = result.rows[0];

  res.json({
    success: true,
    message: 'Parent-student relationship updated successfully',
    data: {
      id: relationship.id,
      studentId: relationship.student_id,
      parentUserId: relationship.parent_user_id,
      relationshipType: relationship.relationship_type,
      isPrimary: relationship.is_primary,
      createdAt: relationship.created_at,
      updatedAt: relationship.updated_at,
    },
  });
});

// Remove parent-student relationship
export const removeParentStudentRelationship = asyncHandler(async (req: Request, res: Response) => {
  const { relationshipId } = req.params;

  // Check if relationship exists
  const existingRelationship = await query(
    'SELECT id FROM student_parents WHERE id = $1',
    [relationshipId]
  );

  if (existingRelationship.rows.length === 0) {
    throw new AppError('Parent-student relationship not found', 404);
  }

  // Remove relationship
  await query('DELETE FROM student_parents WHERE id = $1', [relationshipId]);

  res.json({
    success: true,
    message: 'Parent-student relationship removed successfully',
  });
});

// Get parent dashboard
export const getParentDashboard = asyncHandler(async (req: Request, res: Response) => {
  const parentId = req.user?.id; // From authentication middleware

  if (!parentId) {
    throw new AppError('Parent ID not found in request', 400);
  }

  // Get parent's children with recent activity
  const childrenResult = await query(
    `SELECT sp.id as relationship_id, sp.relationship_type, sp.is_primary,
            s.id as student_id, s.student_id as student_number,
            u.first_name, u.last_name,
            c.name as class_name, c.grade, c.section
     FROM student_parents sp
     JOIN students s ON sp.student_id = s.id
     JOIN users u ON s.user_id = u.id
     JOIN classes c ON s.class_id = c.id
     WHERE sp.parent_user_id = $1 AND s.is_active = true
     ORDER BY sp.is_primary DESC, u.first_name`,
    [parentId]
  );

  const children = [];

  for (const child of childrenResult.rows) {
    // Get recent attendance
    const attendanceResult = await query(
      `SELECT 
         COUNT(*) as total_days,
         SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) as present_days
       FROM attendance 
       WHERE student_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'`,
      [child.student_id]
    );

    const attendance = attendanceResult.rows[0];
    const attendancePercentage = attendance.total_days > 0 
      ? Math.round((attendance.present_days / attendance.total_days) * 100) 
      : 0;

    // Get recent grades
    const gradesResult = await query(
      `SELECT s.name as subject_name, at.name as assessment_type, 
              g.percentage, g.grade_letter, g.created_at
       FROM grades g
       JOIN subjects s ON g.subject_id = s.id
       JOIN assessment_types at ON g.assessment_type_id = at.id
       WHERE g.student_id = $1
       ORDER BY g.created_at DESC
       LIMIT 3`,
      [child.student_id]
    );

    const recentGrades = gradesResult.rows.map((grade: any) => ({
      subjectName: grade.subject_name,
      assessmentType: grade.assessment_type,
      percentage: parseFloat(grade.percentage),
      gradeLetter: grade.grade_letter,
      date: grade.created_at,
    }));

    // Get fee status
    const feeResult = await query(
      `SELECT 
         COALESCE(SUM(sf.total_amount), 0) as total_due,
         COALESCE(SUM(CASE WHEN sf.due_date < CURRENT_DATE AND sf.status IN ('pending', 'partial') THEN sf.total_amount ELSE 0 END), 0) as overdue,
         MIN(CASE WHEN sf.status IN ('pending', 'partial') THEN sf.due_date END) as next_due_date
       FROM student_fees sf
       WHERE sf.student_id = $1 AND sf.status IN ('pending', 'partial')`,
      [child.student_id]
    );

    const feeStatus = feeResult.rows[0];

    children.push({
      studentId: child.student_id,
      studentName: `${child.first_name} ${child.last_name}`,
      studentIdNumber: child.student_number,
      className: `${child.class_name} (${child.grade}-${child.section})`,
      relationshipType: child.relationship_type,
      isPrimary: child.is_primary,
      recentAttendance: {
        percentage: attendancePercentage,
        lastWeekPresent: parseInt(attendance.present_days),
        lastWeekTotal: parseInt(attendance.total_days),
      },
      recentGrades,
      feeStatus: {
        totalDue: parseFloat(feeStatus.total_due),
        overdue: parseFloat(feeStatus.overdue),
        nextDueDate: feeStatus.next_due_date,
      },
    });
  }

  res.json({
    success: true,
    data: {
      parentId,
      children,
    },
  });
});
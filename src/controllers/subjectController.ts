import { Request, Response } from 'express';
import { query } from '../database/connection';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { 
  CreateSubject, 
  UpdateSubject 
} from '../types/academic';
import { Pagination } from '../types/common';
import { getPaginationParams } from '../utils/pagination';

// Create subject
export const createSubject = asyncHandler(async (req: Request, res: Response) => {
  const subjectData: CreateSubject = req.body;

  // Check if subject with same code already exists
  const existingSubject = await query(
    'SELECT id FROM subjects WHERE code = $1',
    [subjectData.code]
  );

  if (existingSubject.rows.length > 0) {
    throw new AppError('Subject with this code already exists', 409);
  }

  // Generate sequential ID for alt_id
  const seqIdResult = await query('SELECT generate_sequential_id($1) as next_id', ['subjects']);
  const sequentialId = seqIdResult.rows[0].next_id;

  // Create subject
  const result = await query(
    `INSERT INTO subjects (name, code, description, credit_hours, alt_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, alt_id, name, code, description, credit_hours, is_active, created_at, updated_at`,
    [
      subjectData.name,
      subjectData.code,
      subjectData.description || null,
      subjectData.creditHours || 1,
      sequentialId.toString()
    ]
  );

  const subject = result.rows[0];

  res.status(201).json({
    success: true,
    message: 'Subject created successfully',
    data: {
      id: subject.id,
      altId: subject.alt_id,
      name: subject.name,
      code: subject.code,
      description: subject.description,
      creditHours: subject.credit_hours,
      isActive: subject.is_active,
      createdAt: subject.created_at,
      updatedAt: subject.updated_at,
    },
  });
});

// Get all subjects
export const getSubjects = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, offset, sortBy, sortOrder } = getPaginationParams(req, 'name');
  const { isActive, search } = req.query;
  let whereClause = '';
  const queryParams: any[] = [];

  if (isActive !== undefined) {
    whereClause = 'WHERE is_active = $1';
    queryParams.push(isActive === 'true');
  }

  if (search) {
    whereClause += whereClause ? ' AND ' : 'WHERE ';
    whereClause += `(name ILIKE $${queryParams.length + 1} OR code ILIKE $${queryParams.length + 1} OR description ILIKE $${queryParams.length + 1})`;
    queryParams.push(`%${search}%`);
  }

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) FROM subjects ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].count);

  // Get subjects
  const result = await query(
    `SELECT id, alt_id, name, code, description, credit_hours, is_active, created_at, updated_at
     FROM subjects 
     ${whereClause}
     ORDER BY ${sortBy} ${sortOrder}
     LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
    [...queryParams, limit, offset]
  );

  const subjects = result.rows.map((subject: any) => ({
    id: subject.id,
    altId: subject.alt_id,
    name: subject.name,
    code: subject.code,
    description: subject.description,
    creditHours: subject.credit_hours,
    isActive: subject.is_active,
    createdAt: subject.created_at,
    updatedAt: subject.updated_at,
  }));

  res.json({
    success: true,
    data: subjects,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get subject by ID
export const getSubjectById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  let result;
  if (isUUID) {
    result = await query(
      `SELECT id, alt_id, name, code, description, credit_hours, is_active, created_at, updated_at
       FROM subjects WHERE id = $1`,
      [id]
    );
  } else {
    result = await query(
      `SELECT id, alt_id, name, code, description, credit_hours, is_active, created_at, updated_at
       FROM subjects WHERE alt_id = $1 OR id::text = $1 OR code = $1`,
      [id]
    );
  }

  if (result.rows.length === 0) {
    throw new AppError('Subject not found', 404);
  }

  const subject = result.rows[0];

  // Get classes teaching this subject
  const classesResult = await query(
    `SELECT c.id, c.name, c.grade, c.section, 
            u.first_name, u.last_name
     FROM class_subjects cs
     JOIN classes c ON cs.class_id = c.id
     JOIN users u ON cs.teacher_id = u.id
     WHERE cs.subject_id = $1 AND c.is_active = true
     ORDER BY c.grade, c.section`,
    [subject.id]
  );

  const classes = classesResult.rows.map((cls: any) => ({
    id: cls.id,
    name: cls.name,
    grade: cls.grade,
    section: cls.section,
    teacher: {
      firstName: cls.first_name,
      lastName: cls.last_name,
    },
  }));

  // Get teachers specialized in this subject
  const teachersResult = await query(
    `SELECT t.id, t.employee_id, u.first_name, u.last_name, u.email
     FROM teacher_subjects ts
     JOIN teachers t ON ts.teacher_id = t.id
     JOIN users u ON t.user_id = u.id
     WHERE ts.subject_id = $1 AND t.is_active = true AND u.is_active = true
     ORDER BY u.first_name, u.last_name`,
    [subject.id]
  );

  const teachers = teachersResult.rows.map((teacher: any) => ({
    id: teacher.id,
    employeeId: teacher.employee_id,
    firstName: teacher.first_name,
    lastName: teacher.last_name,
    email: teacher.email,
  }));

  res.json({
    success: true,
    data: {
      id: subject.id,
      altId: subject.alt_id,
      name: subject.name,
      code: subject.code,
      description: subject.description,
      creditHours: subject.credit_hours,
      isActive: subject.is_active,
      createdAt: subject.created_at,
      updatedAt: subject.updated_at,
      classes,
      teachers,
    },
  });
});

// Update subject
export const updateSubject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: UpdateSubject = req.body;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if subject exists
  let existingSubject;
  if (isUUID) {
    existingSubject = await query('SELECT id FROM subjects WHERE id = $1', [id]);
  } else {
    existingSubject = await query('SELECT id FROM subjects WHERE alt_id = $1 OR id::text = $1 OR code = $1', [id]);
  }

  if (existingSubject.rows.length === 0) {
    throw new AppError('Subject not found', 404);
  }

  const actualSubjectId = existingSubject.rows[0].id;

  // Check if code is being updated and if it conflicts with existing subjects
  if (updateData.code) {
    const codeConflict = await query(
      'SELECT id FROM subjects WHERE code = $1 AND id != $2',
      [updateData.code, actualSubjectId]
    );

    if (codeConflict.rows.length > 0) {
      throw new AppError('Subject with this code already exists', 409);
    }
  }

  // Build update query dynamically
  const updateFields = [];
  const values = [];
  let paramCount = 1;

  if (updateData.name) {
    updateFields.push(`name = $${paramCount++}`);
    values.push(updateData.name);
  }
  if (updateData.code) {
    updateFields.push(`code = $${paramCount++}`);
    values.push(updateData.code);
  }
  if (updateData.description !== undefined) {
    updateFields.push(`description = $${paramCount++}`);
    values.push(updateData.description);
  }
  if (updateData.creditHours) {
    updateFields.push(`credit_hours = $${paramCount++}`);
    values.push(updateData.creditHours);
  }

  if (updateFields.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  values.push(actualSubjectId);

  const result = await query(
    `UPDATE subjects SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING id, alt_id, name, code, description, credit_hours, is_active, created_at, updated_at`,
    values
  );

  const subject = result.rows[0];

  res.json({
    success: true,
    message: 'Subject updated successfully',
    data: {
      id: subject.id,
      altId: subject.alt_id,
      name: subject.name,
      code: subject.code,
      description: subject.description,
      creditHours: subject.credit_hours,
      isActive: subject.is_active,
      createdAt: subject.created_at,
      updatedAt: subject.updated_at,
    },
  });
});

// Delete subject (soft delete)
export const deleteSubject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if subject exists and has dependencies
  let subject;
  if (isUUID) {
    subject = await query('SELECT id, name FROM subjects WHERE id = $1', [id]);
  } else {
    subject = await query('SELECT id, name FROM subjects WHERE alt_id = $1 OR id::text = $1 OR code = $1', [id]);
  }

  if (subject.rows.length === 0) {
    throw new AppError('Subject not found', 404);
  }

  const actualSubjectId = subject.rows[0].id;

  // Check for dependencies
  const dependenciesCheck = await query(
    `SELECT 
       (SELECT COUNT(*) FROM class_subjects WHERE subject_id = $1) as class_subjects_count,
       (SELECT COUNT(*) FROM teacher_subjects WHERE subject_id = $1) as teacher_subjects_count,
       (SELECT COUNT(*) FROM grades WHERE subject_id = $1) as grades_count`,
    [actualSubjectId]
  );

  const dependencies = dependenciesCheck.rows[0];
  const totalDependencies = parseInt(dependencies.class_subjects_count) + 
                           parseInt(dependencies.teacher_subjects_count) + 
                           parseInt(dependencies.grades_count);

  if (totalDependencies > 0) {
    // Soft delete - deactivate instead of hard delete
    await query(
      'UPDATE subjects SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [actualSubjectId]
    );

    res.json({
      success: true,
      message: 'Subject deactivated successfully (has associated data)',
    });
  } else {
    // Hard delete if no dependencies
    await query('DELETE FROM subjects WHERE id = $1', [actualSubjectId]);

    res.json({
      success: true,
      message: 'Subject deleted successfully',
    });
  }
});

// Activate/Deactivate subject
export const toggleSubjectStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if subject exists
  let existingSubject;
  if (isUUID) {
    existingSubject = await query('SELECT id FROM subjects WHERE id = $1', [id]);
  } else {
    existingSubject = await query('SELECT id FROM subjects WHERE alt_id = $1 OR id::text = $1 OR code = $1', [id]);
  }

  if (existingSubject.rows.length === 0) {
    throw new AppError('Subject not found', 404);
  }

  const actualSubjectId = existingSubject.rows[0].id;

  const result = await query(
    `UPDATE subjects SET is_active = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, alt_id, name, code, description, credit_hours, is_active, created_at, updated_at`,
    [isActive, actualSubjectId]
  );

  const subject = result.rows[0];

  res.json({
    success: true,
    message: `Subject ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      id: subject.id,
      altId: subject.alt_id,
      name: subject.name,
      code: subject.code,
      description: subject.description,
      creditHours: subject.credit_hours,
      isActive: subject.is_active,
      createdAt: subject.created_at,
      updatedAt: subject.updated_at,
    },
  });
});

// Get subject statistics
export const getSubjectStatistics = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if subject exists
  let subject;
  if (isUUID) {
    subject = await query('SELECT id, name FROM subjects WHERE id = $1', [id]);
  } else {
    subject = await query('SELECT id, name FROM subjects WHERE alt_id = $1 OR id::text = $1 OR code = $1', [id]);
  }

  if (subject.rows.length === 0) {
    throw new AppError('Subject not found', 404);
  }

  const actualSubjectId = subject.rows[0].id;

  // Get statistics
  const statsResult = await query(
    `SELECT 
       (SELECT COUNT(*) FROM class_subjects WHERE subject_id = $1) as total_classes,
       (SELECT COUNT(DISTINCT cs.teacher_id) FROM class_subjects cs WHERE cs.subject_id = $1) as total_teachers,
       (SELECT COUNT(DISTINCT s.id) FROM class_subjects cs 
        JOIN classes c ON cs.class_id = c.id 
        JOIN students s ON s.class_id = c.id 
        WHERE cs.subject_id = $1 AND s.is_active = true) as total_students,
       (SELECT COUNT(*) FROM grades WHERE subject_id = $1) as total_grades,
       (SELECT ROUND(AVG(percentage), 2) FROM grades WHERE subject_id = $1) as average_percentage`,
    [actualSubjectId]
  );

  const stats = statsResult.rows[0];

  res.json({
    success: true,
    data: {
      subjectId: actualSubjectId,
      subjectName: subject.rows[0].name,
      totalClasses: parseInt(stats.total_classes),
      totalTeachers: parseInt(stats.total_teachers),
      totalStudents: parseInt(stats.total_students),
      totalGrades: parseInt(stats.total_grades),
      averagePercentage: parseFloat(stats.average_percentage) || 0,
    },
  });
});
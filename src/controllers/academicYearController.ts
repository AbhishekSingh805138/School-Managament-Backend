import { Request, Response } from 'express';
import { query, getClient } from '../database/connection';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { 
  CreateAcademicYear, 
  UpdateAcademicYear, 
  AcademicYearResponse 
} from '../types/academic';
import { Pagination } from '../types/common';
import { getPaginationParams } from '../utils/pagination';

// Create academic year
export const createAcademicYear = asyncHandler(async (req: Request, res: Response) => {
  const academicYearData: CreateAcademicYear = req.body;

  // Check if academic year with same name already exists
  const existingYear = await query(
    'SELECT id FROM academic_years WHERE name = $1',
    [academicYearData.name]
  );

  if (existingYear.rows.length > 0) {
    throw new AppError('Academic year with this name already exists', 409);
  }

  // If setting as active, deactivate other active years
  if (academicYearData.isActive) {
    await query('UPDATE academic_years SET is_active = false WHERE is_active = true');
  }

  // Generate sequential ID for alt_id
  const seqIdResult = await query('SELECT generate_sequential_id($1) as next_id', ['academic_years']);
  const sequentialId = seqIdResult.rows[0].next_id;

  // Create academic year
  const result = await query(
    `INSERT INTO academic_years (name, start_date, end_date, is_active, alt_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, alt_id, name, start_date, end_date, is_active, created_at, updated_at`,
    [
      academicYearData.name,
      academicYearData.startDate,
      academicYearData.endDate,
      academicYearData.isActive || false,
      sequentialId.toString()
    ]
  );

  const academicYear = result.rows[0];

  res.status(201).json({
    success: true,
    message: 'Academic year created successfully',
    data: {
      id: academicYear.id,
      altId: academicYear.alt_id,
      name: academicYear.name,
      startDate: academicYear.start_date,
      endDate: academicYear.end_date,
      isActive: academicYear.is_active,
      createdAt: academicYear.created_at,
      updatedAt: academicYear.updated_at,
    },
  });
});

// Get all academic years
export const getAcademicYears = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, offset, sortBy, sortOrder } = getPaginationParams(req, 'start_date');
  const { isActive } = req.query;
  let whereClause = '';
  const queryParams: any[] = [];

  if (isActive !== undefined) {
    whereClause = 'WHERE is_active = $1';
    queryParams.push(isActive === 'true');
  }

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) FROM academic_years ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].count);

  // Get academic years
  const result = await query(
    `SELECT id, alt_id, name, start_date, end_date, is_active, created_at, updated_at
     FROM academic_years 
     ${whereClause}
     ORDER BY ${sortBy} ${sortOrder}
     LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
    [...queryParams, limit, offset]
  );

  const academicYears = result.rows.map((year: any) => ({
    id: year.id,
    altId: year.alt_id,
    name: year.name,
    startDate: year.start_date,
    endDate: year.end_date,
    isActive: year.is_active,
    createdAt: year.created_at,
    updatedAt: year.updated_at,
  }));

  res.json({
    success: true,
    data: academicYears,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get academic year by ID
export const getAcademicYearById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  let result;
  if (isUUID) {
    result = await query(
      `SELECT id, alt_id, name, start_date, end_date, is_active, created_at, updated_at
       FROM academic_years WHERE id = $1`,
      [id]
    );
  } else {
    result = await query(
      `SELECT id, alt_id, name, start_date, end_date, is_active, created_at, updated_at
       FROM academic_years WHERE alt_id = $1 OR id::text = $1`,
      [id]
    );
  }

  if (result.rows.length === 0) {
    throw new AppError('Academic year not found', 404);
  }

  const academicYear = result.rows[0];

  // Get semesters for this academic year
  const semestersResult = await query(
    `SELECT id, alt_id, name, start_date, end_date, is_active, created_at, updated_at
     FROM semesters WHERE academic_year_id = $1 ORDER BY start_date`,
    [academicYear.id]
  );

  const semesters = semestersResult.rows.map((semester: any) => ({
    id: semester.id,
    altId: semester.alt_id,
    name: semester.name,
    startDate: semester.start_date,
    endDate: semester.end_date,
    isActive: semester.is_active,
    createdAt: semester.created_at,
    updatedAt: semester.updated_at,
  }));

  res.json({
    success: true,
    data: {
      id: academicYear.id,
      altId: academicYear.alt_id,
      name: academicYear.name,
      startDate: academicYear.start_date,
      endDate: academicYear.end_date,
      isActive: academicYear.is_active,
      createdAt: academicYear.created_at,
      updatedAt: academicYear.updated_at,
      semesters,
    },
  });
});

// Update academic year
export const updateAcademicYear = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: UpdateAcademicYear = req.body;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if academic year exists
  let existingYear;
  if (isUUID) {
    existingYear = await query('SELECT id FROM academic_years WHERE id = $1', [id]);
  } else {
    existingYear = await query('SELECT id FROM academic_years WHERE alt_id = $1 OR id::text = $1', [id]);
  }

  if (existingYear.rows.length === 0) {
    throw new AppError('Academic year not found', 404);
  }

  const actualYearId = existingYear.rows[0].id;

  // If setting as active, deactivate other active years
  if (updateData.isActive) {
    await query('UPDATE academic_years SET is_active = false WHERE is_active = true AND id != $1', [actualYearId]);
  }

  // Build update query dynamically
  const updateFields = [];
  const values = [];
  let paramCount = 1;

  if (updateData.name) {
    updateFields.push(`name = $${paramCount++}`);
    values.push(updateData.name);
  }
  if (updateData.startDate) {
    updateFields.push(`start_date = $${paramCount++}`);
    values.push(updateData.startDate);
  }
  if (updateData.endDate) {
    updateFields.push(`end_date = $${paramCount++}`);
    values.push(updateData.endDate);
  }
  if (updateData.isActive !== undefined) {
    updateFields.push(`is_active = $${paramCount++}`);
    values.push(updateData.isActive);
  }

  if (updateFields.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  values.push(actualYearId);

  const result = await query(
    `UPDATE academic_years SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING id, alt_id, name, start_date, end_date, is_active, created_at, updated_at`,
    values
  );

  const academicYear = result.rows[0];

  res.json({
    success: true,
    message: 'Academic year updated successfully',
    data: {
      id: academicYear.id,
      altId: academicYear.alt_id,
      name: academicYear.name,
      startDate: academicYear.start_date,
      endDate: academicYear.end_date,
      isActive: academicYear.is_active,
      createdAt: academicYear.created_at,
      updatedAt: academicYear.updated_at,
    },
  });
});

// Delete academic year (soft delete)
export const deleteAcademicYear = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if academic year exists and has dependencies
  let academicYear;
  if (isUUID) {
    academicYear = await query('SELECT id, name FROM academic_years WHERE id = $1', [id]);
  } else {
    academicYear = await query('SELECT id, name FROM academic_years WHERE alt_id = $1 OR id::text = $1', [id]);
  }

  if (academicYear.rows.length === 0) {
    throw new AppError('Academic year not found', 404);
  }

  const actualYearId = academicYear.rows[0].id;

  // Check for dependencies (classes, semesters, etc.)
  const dependenciesCheck = await query(
    `SELECT 
       (SELECT COUNT(*) FROM classes WHERE academic_year_id = $1) as classes_count,
       (SELECT COUNT(*) FROM semesters WHERE academic_year_id = $1) as semesters_count,
       (SELECT COUNT(*) FROM fee_categories WHERE academic_year_id = $1) as fee_categories_count`,
    [actualYearId]
  );

  const dependencies = dependenciesCheck.rows[0];
  const totalDependencies = parseInt(dependencies.classes_count) + 
                           parseInt(dependencies.semesters_count) + 
                           parseInt(dependencies.fee_categories_count);

  if (totalDependencies > 0) {
    throw new AppError(
      `Cannot delete academic year. It has ${dependencies.classes_count} classes, ${dependencies.semesters_count} semesters, and ${dependencies.fee_categories_count} fee categories associated with it.`,
      409
    );
  }

  // Delete the academic year
  await query('DELETE FROM academic_years WHERE id = $1', [actualYearId]);

  res.json({
    success: true,
    message: 'Academic year deleted successfully',
  });
});

// Get active academic year
export const getActiveAcademicYear = asyncHandler(async (req: Request, res: Response) => {
  const result = await query(
    `SELECT id, alt_id, name, start_date, end_date, is_active, created_at, updated_at
     FROM academic_years WHERE is_active = true LIMIT 1`
  );

  if (result.rows.length === 0) {
    throw new AppError('No active academic year found', 404);
  }

  const academicYear = result.rows[0];

  res.json({
    success: true,
    data: {
      id: academicYear.id,
      altId: academicYear.alt_id,
      name: academicYear.name,
      startDate: academicYear.start_date,
      endDate: academicYear.end_date,
      isActive: academicYear.is_active,
      createdAt: academicYear.created_at,
      updatedAt: academicYear.updated_at,
    },
  });
});
import { Request, Response } from 'express';
import { query } from '../database/connection';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { 
  CreateSemester, 
  UpdateSemester 
} from '../types/academic';
import { Pagination } from '../types/common';
import { getPaginationParams } from '../utils/pagination';

// Create semester
export const createSemester = asyncHandler(async (req: Request, res: Response) => {
  const semesterData: CreateSemester = req.body;

  // Check if academic year exists
  const academicYearExists = await query(
    'SELECT id, name, start_date, end_date FROM academic_years WHERE id = $1',
    [semesterData.academicYearId]
  );

  if (academicYearExists.rows.length === 0) {
    throw new AppError('Academic year not found', 404);
  }

  const academicYear = academicYearExists.rows[0];

  // Validate semester dates are within academic year
  const semesterStart = new Date(semesterData.startDate);
  const semesterEnd = new Date(semesterData.endDate);
  const yearStart = new Date(academicYear.start_date);
  const yearEnd = new Date(academicYear.end_date);

  if (semesterStart < yearStart || semesterEnd > yearEnd) {
    throw new AppError('Semester dates must be within the academic year dates', 400);
  }

  // Check if semester with same name already exists for this academic year
  const existingSemester = await query(
    'SELECT id FROM semesters WHERE academic_year_id = $1 AND name = $2',
    [semesterData.academicYearId, semesterData.name]
  );

  if (existingSemester.rows.length > 0) {
    throw new AppError('Semester with this name already exists for this academic year', 409);
  }

  // If setting as active, deactivate other active semesters for this academic year
  if (semesterData.isActive) {
    await query(
      'UPDATE semesters SET is_active = false WHERE academic_year_id = $1 AND is_active = true',
      [semesterData.academicYearId]
    );
  }

  // Generate sequential ID for alt_id
  const seqIdResult = await query('SELECT generate_sequential_id($1) as next_id', ['semesters']);
  const sequentialId = seqIdResult.rows[0].next_id;

  // Create semester
  const result = await query(
    `INSERT INTO semesters (academic_year_id, name, start_date, end_date, is_active, alt_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, alt_id, academic_year_id, name, start_date, end_date, is_active, created_at, updated_at`,
    [
      semesterData.academicYearId,
      semesterData.name,
      semesterData.startDate,
      semesterData.endDate,
      semesterData.isActive || false,
      sequentialId.toString()
    ]
  );

  const semester = result.rows[0];

  res.status(201).json({
    success: true,
    message: 'Semester created successfully',
    data: {
      id: semester.id,
      altId: semester.alt_id,
      academicYearId: semester.academic_year_id,
      name: semester.name,
      startDate: semester.start_date,
      endDate: semester.end_date,
      isActive: semester.is_active,
      createdAt: semester.created_at,
      updatedAt: semester.updated_at,
      academicYear: {
        name: academicYear.name,
        startDate: academicYear.start_date,
        endDate: academicYear.end_date,
      },
    },
  });
});

// Get all semesters
export const getSemesters = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, offset, sortBy, sortOrder } = getPaginationParams(req, 'start_date');
  const { academicYearId, isActive } = req.query;
  let whereClause = '';
  const queryParams: any[] = [];

  if (academicYearId) {
    whereClause = 'WHERE s.academic_year_id = $1';
    queryParams.push(academicYearId);
  }

  if (isActive !== undefined) {
    whereClause += whereClause ? ' AND ' : 'WHERE ';
    whereClause += `s.is_active = $${queryParams.length + 1}`;
    queryParams.push(isActive === 'true');
  }

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) FROM semesters s ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].count);

  // Get semesters with academic year info
  const result = await query(
    `SELECT s.id, s.alt_id, s.academic_year_id, s.name, s.start_date, s.end_date, 
            s.is_active, s.created_at, s.updated_at,
            ay.name as academic_year_name, ay.start_date as academic_year_start, 
            ay.end_date as academic_year_end
     FROM semesters s
     JOIN academic_years ay ON s.academic_year_id = ay.id
     ${whereClause}
     ORDER BY s.${sortBy} ${sortOrder}
     LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
    [...queryParams, limit, offset]
  );

  const semesters = result.rows.map((semester: any) => ({
    id: semester.id,
    altId: semester.alt_id,
    academicYearId: semester.academic_year_id,
    name: semester.name,
    startDate: semester.start_date,
    endDate: semester.end_date,
    isActive: semester.is_active,
    createdAt: semester.created_at,
    updatedAt: semester.updated_at,
    academicYear: {
      name: semester.academic_year_name,
      startDate: semester.academic_year_start,
      endDate: semester.academic_year_end,
    },
  }));

  res.json({
    success: true,
    data: semesters,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get semester by ID
export const getSemesterById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  let result;
  if (isUUID) {
    result = await query(
      `SELECT s.id, s.alt_id, s.academic_year_id, s.name, s.start_date, s.end_date, 
              s.is_active, s.created_at, s.updated_at,
              ay.name as academic_year_name, ay.start_date as academic_year_start, 
              ay.end_date as academic_year_end
       FROM semesters s
       JOIN academic_years ay ON s.academic_year_id = ay.id
       WHERE s.id = $1`,
      [id]
    );
  } else {
    result = await query(
      `SELECT s.id, s.alt_id, s.academic_year_id, s.name, s.start_date, s.end_date, 
              s.is_active, s.created_at, s.updated_at,
              ay.name as academic_year_name, ay.start_date as academic_year_start, 
              ay.end_date as academic_year_end
       FROM semesters s
       JOIN academic_years ay ON s.academic_year_id = ay.id
       WHERE s.alt_id = $1 OR s.id::text = $1`,
      [id]
    );
  }

  if (result.rows.length === 0) {
    throw new AppError('Semester not found', 404);
  }

  const semester = result.rows[0];

  res.json({
    success: true,
    data: {
      id: semester.id,
      altId: semester.alt_id,
      academicYearId: semester.academic_year_id,
      name: semester.name,
      startDate: semester.start_date,
      endDate: semester.end_date,
      isActive: semester.is_active,
      createdAt: semester.created_at,
      updatedAt: semester.updated_at,
      academicYear: {
        name: semester.academic_year_name,
        startDate: semester.academic_year_start,
        endDate: semester.academic_year_end,
      },
    },
  });
});

// Update semester
export const updateSemester = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: UpdateSemester = req.body;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if semester exists
  let existingSemester;
  if (isUUID) {
    existingSemester = await query(
      'SELECT id, academic_year_id FROM semesters WHERE id = $1',
      [id]
    );
  } else {
    existingSemester = await query(
      'SELECT id, academic_year_id FROM semesters WHERE alt_id = $1 OR id::text = $1',
      [id]
    );
  }

  if (existingSemester.rows.length === 0) {
    throw new AppError('Semester not found', 404);
  }

  const actualSemesterId = existingSemester.rows[0].id;
  const academicYearId = existingSemester.rows[0].academic_year_id;

  // If setting as active, deactivate other active semesters for this academic year
  if (updateData.isActive) {
    await query(
      'UPDATE semesters SET is_active = false WHERE academic_year_id = $1 AND is_active = true AND id != $2',
      [academicYearId, actualSemesterId]
    );
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

  values.push(actualSemesterId);

  const result = await query(
    `UPDATE semesters SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING id, alt_id, academic_year_id, name, start_date, end_date, is_active, created_at, updated_at`,
    values
  );

  const semester = result.rows[0];

  // Get academic year info
  const academicYearResult = await query(
    'SELECT name, start_date, end_date FROM academic_years WHERE id = $1',
    [semester.academic_year_id]
  );

  const academicYear = academicYearResult.rows[0];

  res.json({
    success: true,
    message: 'Semester updated successfully',
    data: {
      id: semester.id,
      altId: semester.alt_id,
      academicYearId: semester.academic_year_id,
      name: semester.name,
      startDate: semester.start_date,
      endDate: semester.end_date,
      isActive: semester.is_active,
      createdAt: semester.created_at,
      updatedAt: semester.updated_at,
      academicYear: {
        name: academicYear.name,
        startDate: academicYear.start_date,
        endDate: academicYear.end_date,
      },
    },
  });
});

// Delete semester
export const deleteSemester = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if semester exists and has dependencies
  let semester;
  if (isUUID) {
    semester = await query('SELECT id, name FROM semesters WHERE id = $1', [id]);
  } else {
    semester = await query('SELECT id, name FROM semesters WHERE alt_id = $1 OR id::text = $1', [id]);
  }

  if (semester.rows.length === 0) {
    throw new AppError('Semester not found', 404);
  }

  const actualSemesterId = semester.rows[0].id;

  // Check for dependencies (grades, report cards, etc.)
  const dependenciesCheck = await query(
    `SELECT 
       (SELECT COUNT(*) FROM grades WHERE semester_id = $1) as grades_count,
       (SELECT COUNT(*) FROM report_cards WHERE semester_id = $1) as report_cards_count`,
    [actualSemesterId]
  );

  const dependencies = dependenciesCheck.rows[0];
  const totalDependencies = parseInt(dependencies.grades_count) + 
                           parseInt(dependencies.report_cards_count);

  if (totalDependencies > 0) {
    throw new AppError(
      `Cannot delete semester. It has ${dependencies.grades_count} grades and ${dependencies.report_cards_count} report cards associated with it.`,
      409
    );
  }

  // Delete the semester
  await query('DELETE FROM semesters WHERE id = $1', [actualSemesterId]);

  res.json({
    success: true,
    message: 'Semester deleted successfully',
  });
});

// Get active semester
export const getActiveSemester = asyncHandler(async (req: Request, res: Response) => {
  const { academicYearId } = req.query;

  let whereClause = 'WHERE s.is_active = true';
  const queryParams: any[] = [];

  if (academicYearId) {
    whereClause += ' AND s.academic_year_id = $1';
    queryParams.push(academicYearId);
  }

  const result = await query(
    `SELECT s.id, s.alt_id, s.academic_year_id, s.name, s.start_date, s.end_date, 
            s.is_active, s.created_at, s.updated_at,
            ay.name as academic_year_name, ay.start_date as academic_year_start, 
            ay.end_date as academic_year_end
     FROM semesters s
     JOIN academic_years ay ON s.academic_year_id = ay.id
     ${whereClause}
     LIMIT 1`,
    queryParams
  );

  if (result.rows.length === 0) {
    throw new AppError('No active semester found', 404);
  }

  const semester = result.rows[0];

  res.json({
    success: true,
    data: {
      id: semester.id,
      altId: semester.alt_id,
      academicYearId: semester.academic_year_id,
      name: semester.name,
      startDate: semester.start_date,
      endDate: semester.end_date,
      isActive: semester.is_active,
      createdAt: semester.created_at,
      updatedAt: semester.updated_at,
      academicYear: {
        name: semester.academic_year_name,
        startDate: semester.academic_year_start,
        endDate: semester.academic_year_end,
      },
    },
  });
});
import { Request, Response } from 'express';
import { query } from '../database/connection';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { 
  CreateAssessmentTypeSchema,
  UpdateAssessmentTypeSchema,
  AssessmentTypeResponse
} from '../types/grade';
import { getPaginationParams } from '../utils/pagination';

// Create assessment type
export const createAssessmentType = asyncHandler(async (req: Request, res: Response) => {
  const assessmentData = CreateAssessmentTypeSchema.parse(req.body);
  const userRole = req.user!.role;

  // Only admins can create assessment types
  if (userRole !== 'admin') {
    throw new AppError('Only administrators can create assessment types', 403);
  }

  // Check if assessment type with same name already exists
  const existingCheck = await query(
    'SELECT id FROM assessment_types WHERE LOWER(name) = LOWER($1) AND is_active = true',
    [assessmentData.name]
  );

  if (existingCheck.rows.length > 0) {
    throw new AppError('Assessment type with this name already exists', 409);
  }

  // Generate sequential ID
  const idResult = await query('SELECT nextval(\'assessment_types_id_seq\') as id');
  const sequentialId = idResult.rows[0].id;

  // Insert assessment type
  const result = await query(
    `INSERT INTO assessment_types (id, name, description, weightage, is_active)
     VALUES ($1, $2, $3, $4, true)
     RETURNING *`,
    [sequentialId, assessmentData.name, assessmentData.description || null, assessmentData.weightage]
  );

  const assessmentType = formatAssessmentTypeResponse(result.rows[0]);

  res.status(201).json({
    success: true,
    data: assessmentType,
    message: 'Assessment type created successfully'
  });
});

// Get all assessment types
export const getAssessmentTypes = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '10', active = 'true' } = req.query;
  const { offset, limit: queryLimit } = getPaginationParams(req);

  let whereClause = 'WHERE 1=1';
  const queryParams: any[] = [];

  if (active === 'true') {
    whereClause += ' AND is_active = true';
  }

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM assessment_types ${whereClause}`,
    queryParams
  );

  const total = parseInt(countResult.rows[0].total);

  // Get assessment types
  const result = await query(
    `SELECT * FROM assessment_types 
     ${whereClause}
     ORDER BY name ASC
     LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
    [...queryParams, queryLimit, offset]
  );

  const assessmentTypes = result.rows.map(formatAssessmentTypeResponse);

  res.json({
    success: true,
    data: assessmentTypes,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
});

// Get assessment type by ID
export const getAssessmentTypeById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query('SELECT * FROM assessment_types WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Assessment type not found', 404);
  }

  const assessmentType = formatAssessmentTypeResponse(result.rows[0]);

  res.json({
    success: true,
    data: assessmentType
  });
});

// Update assessment type
export const updateAssessmentType = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = UpdateAssessmentTypeSchema.parse(req.body);
  const userRole = req.user!.role;

  // Only admins can update assessment types
  if (userRole !== 'admin') {
    throw new AppError('Only administrators can update assessment types', 403);
  }

  // Check if assessment type exists
  const existingResult = await query('SELECT * FROM assessment_types WHERE id = $1', [id]);

  if (existingResult.rows.length === 0) {
    throw new AppError('Assessment type not found', 404);
  }

  // Check for name conflicts if name is being updated
  if (updateData.name) {
    const nameCheck = await query(
      'SELECT id FROM assessment_types WHERE LOWER(name) = LOWER($1) AND id != $2 AND is_active = true',
      [updateData.name, id]
    );

    if (nameCheck.rows.length > 0) {
      throw new AppError('Assessment type with this name already exists', 409);
    }
  }

  // Build update query
  const updateFields: string[] = [];
  const updateValues: any[] = [];
  let paramIndex = 1;

  if (updateData.name !== undefined) {
    updateFields.push(`name = $${paramIndex++}`);
    updateValues.push(updateData.name);
  }

  if (updateData.description !== undefined) {
    updateFields.push(`description = $${paramIndex++}`);
    updateValues.push(updateData.description);
  }

  if (updateData.weightage !== undefined) {
    updateFields.push(`weightage = $${paramIndex++}`);
    updateValues.push(updateData.weightage);
  }

  if (updateFields.length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  updateValues.push(id);

  // Update assessment type
  const result = await query(
    `UPDATE assessment_types 
     SET ${updateFields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    updateValues
  );

  const assessmentType = formatAssessmentTypeResponse(result.rows[0]);

  res.json({
    success: true,
    data: assessmentType,
    message: 'Assessment type updated successfully'
  });
});

// Delete (deactivate) assessment type
export const deleteAssessmentType = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userRole = req.user!.role;

  // Only admins can delete assessment types
  if (userRole !== 'admin') {
    throw new AppError('Only administrators can delete assessment types', 403);
  }

  // Check if assessment type exists
  const existingResult = await query('SELECT * FROM assessment_types WHERE id = $1', [id]);

  if (existingResult.rows.length === 0) {
    throw new AppError('Assessment type not found', 404);
  }

  // Check if assessment type is being used in grades
  const usageCheck = await query(
    'SELECT COUNT(*) as count FROM grades WHERE assessment_type_id = $1',
    [id]
  );

  const usageCount = parseInt(usageCheck.rows[0].count);

  if (usageCount > 0) {
    // Soft delete - deactivate instead of hard delete
    await query(
      'UPDATE assessment_types SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: `Assessment type deactivated successfully. It was used in ${usageCount} grade(s).`
    });
  } else {
    // Hard delete if not used
    await query('DELETE FROM assessment_types WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Assessment type deleted successfully'
    });
  }
});

// Reactivate assessment type
export const reactivateAssessmentType = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userRole = req.user!.role;

  // Only admins can reactivate assessment types
  if (userRole !== 'admin') {
    throw new AppError('Only administrators can reactivate assessment types', 403);
  }

  // Check if assessment type exists and is inactive
  const existingResult = await query(
    'SELECT * FROM assessment_types WHERE id = $1 AND is_active = false',
    [id]
  );

  if (existingResult.rows.length === 0) {
    throw new AppError('Assessment type not found or already active', 404);
  }

  // Reactivate assessment type
  const result = await query(
    `UPDATE assessment_types 
     SET is_active = true, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  const assessmentType = formatAssessmentTypeResponse(result.rows[0]);

  res.json({
    success: true,
    data: assessmentType,
    message: 'Assessment type reactivated successfully'
  });
});

// Helper function to format assessment type response
function formatAssessmentTypeResponse(row: any): AssessmentTypeResponse {
  return {
    id: row.id.toString(),
    altId: null,
    name: row.name,
    description: row.description,
    weightage: parseFloat(row.weightage),
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
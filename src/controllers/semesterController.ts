import { Request, Response } from 'express';
import { z } from 'zod';
import { semesterService } from '../services/semesterService';
import { PaginationSchema, IdSchema } from '../types/common';

// Validation schemas
const CreateSemesterSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  academicYearId: z.string().uuid('Invalid academic year ID format'),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid start date format'
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid end date format'
  }),
  isActive: z.boolean().optional().default(false)
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start < end;
}, {
  message: 'Start date must be before end date',
  path: ['startDate']
});

const UpdateSemesterSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  academicYearId: z.string().uuid('Invalid academic year ID format').optional(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid start date format'
  }).optional(),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid end date format'
  }).optional(),
  isActive: z.boolean().optional()
}).refine((data) => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start < end;
  }
  return true;
}, {
  message: 'Start date must be before end date',
  path: ['startDate']
});

const SemesterQuerySchema = PaginationSchema.extend({
  academicYearId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional()
});

/**
 * Create a new semester
 */
export const createSemester = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = CreateSemesterSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const semester = await semesterService.createSemester(validationResult.data);

    return res.status(201).json({
      success: true,
      message: 'Semester created successfully',
      data: {
        semester
      }
    });
  } catch (error: any) {
    console.error('Create semester error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create semester',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get all semesters with pagination and filtering
 */
export const getSemesters = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const validationResult = SemesterQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const result = await semesterService.getSemesters({ query: validationResult.data });

    return res.status(200).json({
      success: true,
      message: 'Semesters retrieved successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Get semesters error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve semesters',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get semester by ID
 */
export const getSemesterById = async (req: Request, res: Response) => {
  try {
    // Validate ID parameter
    const validationResult = IdSchema.safeParse(req.params.id);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid semester ID format'
      });
    }

    const semester = await semesterService.getSemesterById(validationResult.data);

    return res.status(200).json({
      success: true,
      message: 'Semester retrieved successfully',
      data: {
        semester
      }
    });
  } catch (error: any) {
    console.error('Get semester by ID error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve semester',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update semester
 */
export const updateSemester = async (req: Request, res: Response) => {
  try {
    // Validate ID parameter
    const idValidation = IdSchema.safeParse(req.params.id);
    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid semester ID format'
      });
    }

    // Validate request body
    const bodyValidation = UpdateSemesterSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: bodyValidation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const semester = await semesterService.updateSemester(
      idValidation.data,
      bodyValidation.data
    );

    return res.status(200).json({
      success: true,
      message: 'Semester updated successfully',
      data: {
        semester
      }
    });
  } catch (error: any) {
    console.error('Update semester error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update semester',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Delete semester
 */
export const deleteSemester = async (req: Request, res: Response) => {
  try {
    // Validate ID parameter
    const validationResult = IdSchema.safeParse(req.params.id);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid semester ID format'
      });
    }

    await semesterService.deleteSemester(validationResult.data);

    return res.status(200).json({
      success: true,
      message: 'Semester deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete semester error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to delete semester',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get current active semester
 */
export const getCurrentSemester = async (req: Request, res: Response) => {
  try {
    const semester = await semesterService.getActiveSemester();

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'No active semester found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Current semester retrieved successfully',
      data: {
        semester
      }
    });
  } catch (error: any) {
    console.error('Get current semester error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve current semester',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};


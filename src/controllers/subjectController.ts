import { Request, Response } from 'express';
import { z } from 'zod';
import { subjectService } from '../services/subjectService';
import { PaginationSchema, IdSchema } from '../types/common';

// Validation schemas
const CreateSubjectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  code: z.string().trim().min(1, 'Code is required').max(20, 'Code must be less than 20 characters'),
  description: z.string().optional(),
  creditHours: z.number().min(1, 'Credit hours must be at least 1').optional().default(1)
});

const UpdateSubjectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  code: z.string().trim().min(1, 'Code is required').max(20, 'Code must be less than 20 characters').optional(),
  description: z.string().optional(),
  creditHours: z.number().min(1, 'Credit hours must be at least 1').optional()
});

const SubjectQuerySchema = PaginationSchema.extend({
  isActive: z.boolean().optional(),
  search: z.string().optional()
});

/**
 * Create a new subject
 */
export const createSubject = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = CreateSubjectSchema.safeParse(req.body);
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

    const subject = await subjectService.createSubject(validationResult.data);

    return res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: {
        subject
      }
    });
  } catch (error: any) {
    console.error('Create subject error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create subject',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get all subjects with pagination and filtering
 */
export const getSubjects = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const validationResult = SubjectQuerySchema.safeParse(req.query);
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

    const result = await subjectService.getSubjects({ query: validationResult.data });

    return res.status(200).json({
      success: true,
      message: 'Subjects retrieved successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Get subjects error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve subjects',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get subject by ID
 */
export const getSubjectById = async (req: Request, res: Response) => {
  try {
    // Validate ID parameter
    const validationResult = IdSchema.safeParse(req.params.id);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject ID format'
      });
    }

    const subject = await subjectService.getSubjectById(validationResult.data);

    return res.status(200).json({
      success: true,
      message: 'Subject retrieved successfully',
      data: {
        subject
      }
    });
  } catch (error: any) {
    console.error('Get subject by ID error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve subject',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update subject
 */
export const updateSubject = async (req: Request, res: Response) => {
  try {
    // Validate ID parameter
    const idValidation = IdSchema.safeParse(req.params.id);
    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject ID format'
      });
    }

    // Validate request body
    const bodyValidation = UpdateSubjectSchema.safeParse(req.body);
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

    const subject = await subjectService.updateSubject(
      idValidation.data,
      bodyValidation.data
    );

    return res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: {
        subject
      }
    });
  } catch (error: any) {
    console.error('Update subject error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update subject',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Delete subject (soft delete)
 */
export const deleteSubject = async (req: Request, res: Response) => {
  try {
    // Validate ID parameter
    const validationResult = IdSchema.safeParse(req.params.id);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject ID format'
      });
    }

    await subjectService.deleteSubject(validationResult.data);

    return res.status(200).json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete subject error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to delete subject',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Toggle subject status (activate/deactivate)
 */
export const toggleSubjectStatus = async (req: Request, res: Response) => {
  try {
    // Validate ID parameter
    const idValidation = IdSchema.safeParse(req.params.id);
    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject ID format'
      });
    }

    // Validate request body
    const bodyValidation = z.object({
      isActive: z.boolean()
    }).safeParse(req.body);
    
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

    const subject = await subjectService.toggleSubjectStatus(
      idValidation.data,
      bodyValidation.data.isActive
    );

    return res.status(200).json({
      success: true,
      message: `Subject ${bodyValidation.data.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        subject
      }
    });
  } catch (error: any) {
    console.error('Toggle subject status error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to toggle subject status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get subject statistics
 */
export const getSubjectStatistics = async (req: Request, res: Response) => {
  try {
    // Validate ID parameter
    const validationResult = IdSchema.safeParse(req.params.id);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject ID format'
      });
    }

    const result = await subjectService.getSubjectStatistics(validationResult.data);

    return res.status(200).json({
      success: true,
      message: 'Subject statistics retrieved successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Get subject statistics error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve subject statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
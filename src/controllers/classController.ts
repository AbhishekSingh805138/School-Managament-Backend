import { Request, Response } from 'express';
import { z } from 'zod';
import { classService } from '../services/classService';
import { PaginationSchema, IdSchema } from '../types/common';

// Validation schemas
const CreateClassSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  grade: z.string().trim().min(1, 'Grade is required').max(10, 'Grade must be less than 10 characters'),
  section: z.string().trim().min(1, 'Section is required').max(10, 'Section must be less than 10 characters'),
  teacherId: z.string().uuid('Invalid teacher ID format').optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(100, 'Capacity cannot exceed 100'),
  room: z.string().optional(),
  description: z.string().optional(),
  academicYearId: z.string().uuid('Invalid academic year ID format')
});

const UpdateClassSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  grade: z.string().trim().min(1, 'Grade is required').max(10, 'Grade must be less than 10 characters').optional(),
  section: z.string().trim().min(1, 'Section is required').max(10, 'Section must be less than 10 characters').optional(),
  teacherId: z.string().uuid('Invalid teacher ID format').optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(100, 'Capacity cannot exceed 100').optional(),
  room: z.string().optional(),
  description: z.string().optional()
});

const ClassQuerySchema = PaginationSchema.extend({
  isActive: z.boolean().optional(),
  academicYearId: z.string().uuid().optional(),
  grade: z.string().optional(),
  teacherId: z.string().uuid().optional()
});

const AssignSubjectSchema = z.object({
  subjectId: z.string().uuid('Invalid subject ID format'),
  teacherId: z.string().uuid('Invalid teacher ID format').optional()
});

const EnrollStudentSchema = z.object({
  studentId: z.string().uuid('Invalid student ID format')
});

const BulkEnrollSchema = z.object({
  studentIds: z.array(z.string().uuid('Invalid student ID format')).min(1, 'At least one student ID is required')
});

const TransferStudentSchema = z.object({
  studentId: z.string().uuid('Invalid student ID format'),
  targetClassId: z.string().uuid('Invalid target class ID format')
});

/**
 * Create a new class
 */
export const createClass = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = CreateClassSchema.safeParse(req.body);
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

    const classInfo = await classService.createClass(validationResult.data);

    return res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: {
        class: classInfo
      }
    });
  } catch (error: any) {
    console.error('Create class error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create class',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get all classes with pagination and filtering
 */
export const getClasses = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const validationResult = ClassQuerySchema.safeParse(req.query);
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

    const result = await classService.getClasses({ query: validationResult.data });

    return res.status(200).json({
      success: true,
      message: 'Classes retrieved successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Get classes error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve classes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get class by ID
 */
export const getClassById = async (req: Request, res: Response) => {
  try {
    // Validate ID parameter
    const validationResult = IdSchema.safeParse(req.params.id);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format'
      });
    }

    const classInfo = await classService.getClassById(validationResult.data);

    return res.status(200).json({
      success: true,
      message: 'Class retrieved successfully',
      data: {
        class: classInfo
      }
    });
  } catch (error: any) {
    console.error('Get class by ID error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve class',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update class
 */
export const updateClass = async (req: Request, res: Response) => {
  try {
    // Validate ID parameter
    const idValidation = IdSchema.safeParse(req.params.id);
    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format'
      });
    }

    // Validate request body
    const bodyValidation = UpdateClassSchema.safeParse(req.body);
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

    const classInfo = await classService.updateClass(
      idValidation.data,
      bodyValidation.data
    );

    return res.status(200).json({
      success: true,
      message: 'Class updated successfully',
      data: {
        class: classInfo
      }
    });
  } catch (error: any) {
    console.error('Update class error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update class',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Delete class (soft delete)
 */
export const deleteClass = async (req: Request, res: Response) => {
  try {
    // Validate ID parameter
    const validationResult = IdSchema.safeParse(req.params.id);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format'
      });
    }

    await classService.deleteClass(validationResult.data);

    return res.status(200).json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete class error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to delete class',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Assign subject to class
 */
export const assignSubjectToClass = async (req: Request, res: Response) => {
  try {
    // Validate ID parameter
    const idValidation = IdSchema.safeParse(req.params.id);
    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format'
      });
    }

    // Validate request body
    const bodyValidation = AssignSubjectSchema.safeParse(req.body);
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

    const result = await classService.assignSubjectToClass(
      idValidation.data,
      bodyValidation.data.subjectId,
      bodyValidation.data.teacherId
    );

    return res.status(201).json({
      success: true,
      message: 'Subject assigned to class successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Assign subject to class error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to assign subject to class',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Remove subject from class
 */
export const removeSubjectFromClass = async (req: Request, res: Response) => {
  try {
    // Validate class ID parameter
    const classIdValidation = IdSchema.safeParse(req.params.id);
    if (!classIdValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format'
      });
    }

    // Validate subject ID parameter
    const subjectIdValidation = IdSchema.safeParse(req.params.subjectId);
    if (!subjectIdValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject ID format'
      });
    }

    await classService.removeSubjectFromClass(
      classIdValidation.data,
      subjectIdValidation.data
    );

    return res.status(200).json({
      success: true,
      message: 'Subject removed from class successfully'
    });
  } catch (error: any) {
    console.error('Remove subject from class error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to remove subject from class',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get class statistics
 */
export const getClassStatistics = async (req: Request, res: Response) => {
  try {
    // Validate ID parameter
    const validationResult = IdSchema.safeParse(req.params.id);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format'
      });
    }

    const result = await classService.getClassStatistics(validationResult.data);

    return res.status(200).json({
      success: true,
      message: 'Class statistics retrieved successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Get class statistics error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve class statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Enroll student to class
 */
export const enrollStudentToClass = async (req: Request, res: Response) => {
  try {
    // Validate ID parameter
    const idValidation = IdSchema.safeParse(req.params.id);
    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format'
      });
    }

    // Validate request body
    const bodyValidation = EnrollStudentSchema.safeParse(req.body);
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

    const result = await classService.enrollStudentToClass(
      idValidation.data,
      bodyValidation.data.studentId
    );

    return res.status(201).json({
      success: true,
      message: 'Student enrolled to class successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Enroll student to class error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to enroll student to class',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Bulk enroll students to class
 */
export const bulkEnrollStudentsToClass = async (req: Request, res: Response) => {
  try {
    // Validate ID parameter
    const idValidation = IdSchema.safeParse(req.params.id);
    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format'
      });
    }

    // Validate request body
    const bodyValidation = BulkEnrollSchema.safeParse(req.body);
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

    const result = await classService.bulkEnrollStudentsToClass(
      idValidation.data,
      bodyValidation.data.studentIds
    );

    return res.status(201).json({
      success: true,
      message: 'Students enrolled to class successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Bulk enroll students to class error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to enroll students to class',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Transfer student between classes
 */
export const transferStudent = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const bodyValidation = TransferStudentSchema.safeParse(req.body);
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

    const result = await classService.transferStudent(
      bodyValidation.data.studentId,
      bodyValidation.data.targetClassId
    );

    return res.status(200).json({
      success: true,
      message: 'Student transferred successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Transfer student error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to transfer student',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get class students
 */
export const getClassStudents = async (req: Request, res: Response) => {
  try {
    // Validate ID parameter
    const validationResult = IdSchema.safeParse(req.params.id);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format'
      });
    }

    const result = await classService.getClassStudents(validationResult.data);

    return res.status(200).json({
      success: true,
      message: 'Class students retrieved successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Get class students error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve class students',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get class subjects
 */
export const getClassSubjects = async (req: Request, res: Response) => {
  try {
    // Validate ID parameter
    const validationResult = IdSchema.safeParse(req.params.id);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format'
      });
    }

    const result = await classService.getClassSubjects(validationResult.data);

    return res.status(200).json({
      success: true,
      message: 'Class subjects retrieved successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Get class subjects error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve class subjects',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClassSubjects = exports.getClassStudents = exports.transferStudent = exports.bulkEnrollStudentsToClass = exports.enrollStudentToClass = exports.getClassStatistics = exports.removeSubjectFromClass = exports.assignSubjectToClass = exports.deleteClass = exports.updateClass = exports.getClassById = exports.getClasses = exports.createClass = void 0;
const zod_1 = require("zod");
const classService_1 = require("../services/classService");
const common_1 = require("../types/common");
const CreateClassSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    grade: zod_1.z.string().trim().min(1, 'Grade is required').max(10, 'Grade must be less than 10 characters'),
    section: zod_1.z.string().trim().min(1, 'Section is required').max(10, 'Section must be less than 10 characters'),
    teacherId: zod_1.z.string().uuid('Invalid teacher ID format').optional(),
    capacity: zod_1.z.number().min(1, 'Capacity must be at least 1').max(100, 'Capacity cannot exceed 100'),
    room: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    academicYearId: zod_1.z.string().uuid('Invalid academic year ID format')
});
const UpdateClassSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
    grade: zod_1.z.string().trim().min(1, 'Grade is required').max(10, 'Grade must be less than 10 characters').optional(),
    section: zod_1.z.string().trim().min(1, 'Section is required').max(10, 'Section must be less than 10 characters').optional(),
    teacherId: zod_1.z.string().uuid('Invalid teacher ID format').optional(),
    capacity: zod_1.z.number().min(1, 'Capacity must be at least 1').max(100, 'Capacity cannot exceed 100').optional(),
    room: zod_1.z.string().optional(),
    description: zod_1.z.string().optional()
});
const ClassQuerySchema = common_1.PaginationSchema.extend({
    isActive: zod_1.z.boolean().optional(),
    academicYearId: zod_1.z.string().uuid().optional(),
    grade: zod_1.z.string().optional(),
    teacherId: zod_1.z.string().uuid().optional()
});
const AssignSubjectSchema = zod_1.z.object({
    subjectId: zod_1.z.string().uuid('Invalid subject ID format'),
    teacherId: zod_1.z.string().uuid('Invalid teacher ID format').optional()
});
const EnrollStudentSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid('Invalid student ID format')
});
const BulkEnrollSchema = zod_1.z.object({
    studentIds: zod_1.z.array(zod_1.z.string().uuid('Invalid student ID format')).min(1, 'At least one student ID is required')
});
const TransferStudentSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid('Invalid student ID format'),
    targetClassId: zod_1.z.string().uuid('Invalid target class ID format')
});
const createClass = async (req, res) => {
    try {
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
        const classInfo = await classService_1.classService.createClass(validationResult.data);
        return res.status(201).json({
            success: true,
            message: 'Class created successfully',
            data: {
                class: classInfo
            }
        });
    }
    catch (error) {
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
exports.createClass = createClass;
const getClasses = async (req, res) => {
    try {
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
        const result = await classService_1.classService.getClasses({ query: validationResult.data });
        return res.status(200).json({
            success: true,
            message: 'Classes retrieved successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Get classes error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve classes',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
exports.getClasses = getClasses;
const getClassById = async (req, res) => {
    try {
        const validationResult = common_1.IdSchema.safeParse(req.params.id);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
        const classInfo = await classService_1.classService.getClassById(validationResult.data);
        return res.status(200).json({
            success: true,
            message: 'Class retrieved successfully',
            data: {
                class: classInfo
            }
        });
    }
    catch (error) {
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
exports.getClassById = getClassById;
const updateClass = async (req, res) => {
    try {
        const idValidation = common_1.IdSchema.safeParse(req.params.id);
        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
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
        const classInfo = await classService_1.classService.updateClass(idValidation.data, bodyValidation.data);
        return res.status(200).json({
            success: true,
            message: 'Class updated successfully',
            data: {
                class: classInfo
            }
        });
    }
    catch (error) {
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
exports.updateClass = updateClass;
const deleteClass = async (req, res) => {
    try {
        const validationResult = common_1.IdSchema.safeParse(req.params.id);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
        await classService_1.classService.deleteClass(validationResult.data);
        return res.status(200).json({
            success: true,
            message: 'Class deleted successfully'
        });
    }
    catch (error) {
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
exports.deleteClass = deleteClass;
const assignSubjectToClass = async (req, res) => {
    try {
        const idValidation = common_1.IdSchema.safeParse(req.params.id);
        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
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
        const result = await classService_1.classService.assignSubjectToClass(idValidation.data, bodyValidation.data.subjectId, bodyValidation.data.teacherId);
        return res.status(201).json({
            success: true,
            message: 'Subject assigned to class successfully',
            data: result
        });
    }
    catch (error) {
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
exports.assignSubjectToClass = assignSubjectToClass;
const removeSubjectFromClass = async (req, res) => {
    try {
        const classIdValidation = common_1.IdSchema.safeParse(req.params.id);
        if (!classIdValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
        const subjectIdValidation = common_1.IdSchema.safeParse(req.params.subjectId);
        if (!subjectIdValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subject ID format'
            });
        }
        await classService_1.classService.removeSubjectFromClass(classIdValidation.data, subjectIdValidation.data);
        return res.status(200).json({
            success: true,
            message: 'Subject removed from class successfully'
        });
    }
    catch (error) {
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
exports.removeSubjectFromClass = removeSubjectFromClass;
const getClassStatistics = async (req, res) => {
    try {
        const validationResult = common_1.IdSchema.safeParse(req.params.id);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
        const result = await classService_1.classService.getClassStatistics(validationResult.data);
        return res.status(200).json({
            success: true,
            message: 'Class statistics retrieved successfully',
            data: result
        });
    }
    catch (error) {
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
exports.getClassStatistics = getClassStatistics;
const enrollStudentToClass = async (req, res) => {
    try {
        const idValidation = common_1.IdSchema.safeParse(req.params.id);
        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
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
        const result = await classService_1.classService.enrollStudentToClass(idValidation.data, bodyValidation.data.studentId);
        return res.status(201).json({
            success: true,
            message: 'Student enrolled to class successfully',
            data: result
        });
    }
    catch (error) {
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
exports.enrollStudentToClass = enrollStudentToClass;
const bulkEnrollStudentsToClass = async (req, res) => {
    try {
        const idValidation = common_1.IdSchema.safeParse(req.params.id);
        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
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
        const result = await classService_1.classService.bulkEnrollStudentsToClass(idValidation.data, bodyValidation.data.studentIds);
        return res.status(201).json({
            success: true,
            message: 'Students enrolled to class successfully',
            data: result
        });
    }
    catch (error) {
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
exports.bulkEnrollStudentsToClass = bulkEnrollStudentsToClass;
const transferStudent = async (req, res) => {
    try {
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
        const result = await classService_1.classService.transferStudent(bodyValidation.data.studentId, bodyValidation.data.targetClassId);
        return res.status(200).json({
            success: true,
            message: 'Student transferred successfully',
            data: result
        });
    }
    catch (error) {
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
exports.transferStudent = transferStudent;
const getClassStudents = async (req, res) => {
    try {
        const validationResult = common_1.IdSchema.safeParse(req.params.id);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
        const result = await classService_1.classService.getClassStudents(validationResult.data);
        return res.status(200).json({
            success: true,
            message: 'Class students retrieved successfully',
            data: result
        });
    }
    catch (error) {
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
exports.getClassStudents = getClassStudents;
const getClassSubjects = async (req, res) => {
    try {
        const validationResult = common_1.IdSchema.safeParse(req.params.id);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class ID format'
            });
        }
        const result = await classService_1.classService.getClassSubjects(validationResult.data);
        return res.status(200).json({
            success: true,
            message: 'Class subjects retrieved successfully',
            data: result
        });
    }
    catch (error) {
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
exports.getClassSubjects = getClassSubjects;
//# sourceMappingURL=classController.js.map
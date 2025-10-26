"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubjectStatistics = exports.toggleSubjectStatus = exports.deleteSubject = exports.updateSubject = exports.getSubjectById = exports.getSubjects = exports.createSubject = void 0;
const zod_1 = require("zod");
const subjectService_1 = require("../services/subjectService");
const common_1 = require("../types/common");
const CreateSubjectSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    code: zod_1.z.string().trim().min(1, 'Code is required').max(20, 'Code must be less than 20 characters'),
    description: zod_1.z.string().optional(),
    creditHours: zod_1.z.number().min(1, 'Credit hours must be at least 1').optional().default(1)
});
const UpdateSubjectSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
    code: zod_1.z.string().trim().min(1, 'Code is required').max(20, 'Code must be less than 20 characters').optional(),
    description: zod_1.z.string().optional(),
    creditHours: zod_1.z.number().min(1, 'Credit hours must be at least 1').optional()
});
const SubjectQuerySchema = common_1.PaginationSchema.extend({
    isActive: zod_1.z.boolean().optional(),
    search: zod_1.z.string().optional()
});
const createSubject = async (req, res) => {
    try {
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
        const subject = await subjectService_1.subjectService.createSubject(validationResult.data);
        return res.status(201).json({
            success: true,
            message: 'Subject created successfully',
            data: {
                subject
            }
        });
    }
    catch (error) {
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
exports.createSubject = createSubject;
const getSubjects = async (req, res) => {
    try {
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
        const result = await subjectService_1.subjectService.getSubjects({ query: validationResult.data });
        return res.status(200).json({
            success: true,
            message: 'Subjects retrieved successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Get subjects error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve subjects',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
exports.getSubjects = getSubjects;
const getSubjectById = async (req, res) => {
    try {
        const validationResult = common_1.IdSchema.safeParse(req.params.id);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subject ID format'
            });
        }
        const subject = await subjectService_1.subjectService.getSubjectById(validationResult.data);
        return res.status(200).json({
            success: true,
            message: 'Subject retrieved successfully',
            data: {
                subject
            }
        });
    }
    catch (error) {
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
exports.getSubjectById = getSubjectById;
const updateSubject = async (req, res) => {
    try {
        const idValidation = common_1.IdSchema.safeParse(req.params.id);
        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subject ID format'
            });
        }
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
        const subject = await subjectService_1.subjectService.updateSubject(idValidation.data, bodyValidation.data);
        return res.status(200).json({
            success: true,
            message: 'Subject updated successfully',
            data: {
                subject
            }
        });
    }
    catch (error) {
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
exports.updateSubject = updateSubject;
const deleteSubject = async (req, res) => {
    try {
        const validationResult = common_1.IdSchema.safeParse(req.params.id);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subject ID format'
            });
        }
        await subjectService_1.subjectService.deleteSubject(validationResult.data);
        return res.status(200).json({
            success: true,
            message: 'Subject deleted successfully'
        });
    }
    catch (error) {
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
exports.deleteSubject = deleteSubject;
const toggleSubjectStatus = async (req, res) => {
    try {
        const idValidation = common_1.IdSchema.safeParse(req.params.id);
        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subject ID format'
            });
        }
        const bodyValidation = zod_1.z.object({
            isActive: zod_1.z.boolean()
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
        const subject = await subjectService_1.subjectService.toggleSubjectStatus(idValidation.data, bodyValidation.data.isActive);
        return res.status(200).json({
            success: true,
            message: `Subject ${bodyValidation.data.isActive ? 'activated' : 'deactivated'} successfully`,
            data: {
                subject
            }
        });
    }
    catch (error) {
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
exports.toggleSubjectStatus = toggleSubjectStatus;
const getSubjectStatistics = async (req, res) => {
    try {
        const validationResult = common_1.IdSchema.safeParse(req.params.id);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subject ID format'
            });
        }
        const result = await subjectService_1.subjectService.getSubjectStatistics(validationResult.data);
        return res.status(200).json({
            success: true,
            message: 'Subject statistics retrieved successfully',
            data: result
        });
    }
    catch (error) {
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
exports.getSubjectStatistics = getSubjectStatistics;
//# sourceMappingURL=subjectController.js.map
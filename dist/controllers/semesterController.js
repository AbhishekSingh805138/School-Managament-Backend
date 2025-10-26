"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentSemester = exports.deleteSemester = exports.updateSemester = exports.getSemesterById = exports.getSemesters = exports.createSemester = void 0;
const zod_1 = require("zod");
const semesterService_1 = require("../services/semesterService");
const common_1 = require("../types/common");
const CreateSemesterSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    academicYearId: zod_1.z.string().uuid('Invalid academic year ID format'),
    startDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid start date format'
    }),
    endDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid end date format'
    }),
    isActive: zod_1.z.boolean().optional().default(false)
}).refine((data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start < end;
}, {
    message: 'Start date must be before end date',
    path: ['startDate']
});
const UpdateSemesterSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
    academicYearId: zod_1.z.string().uuid('Invalid academic year ID format').optional(),
    startDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid start date format'
    }).optional(),
    endDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid end date format'
    }).optional(),
    isActive: zod_1.z.boolean().optional()
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
const SemesterQuerySchema = common_1.PaginationSchema.extend({
    academicYearId: zod_1.z.string().uuid().optional(),
    isActive: zod_1.z.boolean().optional(),
    search: zod_1.z.string().optional()
});
const createSemester = async (req, res) => {
    try {
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
        const semester = await semesterService_1.semesterService.createSemester(validationResult.data);
        return res.status(201).json({
            success: true,
            message: 'Semester created successfully',
            data: {
                semester
            }
        });
    }
    catch (error) {
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
exports.createSemester = createSemester;
const getSemesters = async (req, res) => {
    try {
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
        const result = await semesterService_1.semesterService.getSemesters({ query: validationResult.data });
        return res.status(200).json({
            success: true,
            message: 'Semesters retrieved successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Get semesters error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve semesters',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
exports.getSemesters = getSemesters;
const getSemesterById = async (req, res) => {
    try {
        const validationResult = common_1.IdSchema.safeParse(req.params.id);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid semester ID format'
            });
        }
        const semester = await semesterService_1.semesterService.getSemesterById(validationResult.data);
        return res.status(200).json({
            success: true,
            message: 'Semester retrieved successfully',
            data: {
                semester
            }
        });
    }
    catch (error) {
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
exports.getSemesterById = getSemesterById;
const updateSemester = async (req, res) => {
    try {
        const idValidation = common_1.IdSchema.safeParse(req.params.id);
        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid semester ID format'
            });
        }
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
        const semester = await semesterService_1.semesterService.updateSemester(idValidation.data, bodyValidation.data);
        return res.status(200).json({
            success: true,
            message: 'Semester updated successfully',
            data: {
                semester
            }
        });
    }
    catch (error) {
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
exports.updateSemester = updateSemester;
const deleteSemester = async (req, res) => {
    try {
        const validationResult = common_1.IdSchema.safeParse(req.params.id);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid semester ID format'
            });
        }
        await semesterService_1.semesterService.deleteSemester(validationResult.data);
        return res.status(200).json({
            success: true,
            message: 'Semester deleted successfully'
        });
    }
    catch (error) {
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
exports.deleteSemester = deleteSemester;
const getCurrentSemester = async (req, res) => {
    try {
        const semester = await semesterService_1.semesterService.getActiveSemester();
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
    }
    catch (error) {
        console.error('Get current semester error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve current semester',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
exports.getCurrentSemester = getCurrentSemester;
//# sourceMappingURL=semesterController.js.map
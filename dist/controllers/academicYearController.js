"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveAcademicYear = exports.deleteAcademicYear = exports.updateAcademicYear = exports.getAcademicYearById = exports.getAcademicYears = exports.createAcademicYear = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const academicYearService_1 = require("../services/academicYearService");
const academicYearService = new academicYearService_1.AcademicYearService();
exports.createAcademicYear = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const academicYearData = req.body;
    const academicYear = await academicYearService.createAcademicYear(academicYearData);
    res.status(201).json({
        success: true,
        message: 'Academic year created successfully',
        data: academicYear,
    });
});
exports.getAcademicYears = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await academicYearService.getAcademicYears(req);
    res.json({
        success: true,
        data: result.academicYears,
        pagination: result.pagination,
    });
});
exports.getAcademicYearById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const academicYear = await academicYearService.getAcademicYearById(id);
    res.json({
        success: true,
        data: academicYear,
    });
});
exports.updateAcademicYear = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const academicYear = await academicYearService.updateAcademicYear(id, updateData);
    res.json({
        success: true,
        message: 'Academic year updated successfully',
        data: academicYear,
    });
});
exports.deleteAcademicYear = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await academicYearService.deleteAcademicYear(id);
    res.json({
        success: true,
        message: 'Academic year deleted successfully',
    });
});
exports.getActiveAcademicYear = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const academicYear = await academicYearService.getActiveAcademicYear();
    res.json({
        success: true,
        data: academicYear,
    });
});
//# sourceMappingURL=academicYearController.js.map
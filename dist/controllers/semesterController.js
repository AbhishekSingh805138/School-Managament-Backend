"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveSemester = exports.deleteSemester = exports.updateSemester = exports.getSemesterById = exports.getSemesters = exports.createSemester = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const semesterService_1 = require("../services/semesterService");
const semesterService = new semesterService_1.SemesterService();
exports.createSemester = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const semesterData = req.body;
    const semester = await semesterService.createSemester(semesterData);
    res.status(201).json({
        success: true,
        message: 'Semester created successfully',
        data: semester,
    });
});
exports.getSemesters = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await semesterService.getSemesters(req);
    res.json({
        success: true,
        data: result.semesters,
        pagination: result.pagination,
    });
});
exports.getSemesterById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const semester = await semesterService.getSemesterById(id);
    res.json({
        success: true,
        data: semester,
    });
});
exports.updateSemester = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const semester = await semesterService.updateSemester(id, updateData);
    res.json({
        success: true,
        message: 'Semester updated successfully',
        data: semester,
    });
});
exports.deleteSemester = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await semesterService.deleteSemester(id);
    res.json({
        success: true,
        message: 'Semester deleted successfully',
    });
});
exports.getActiveSemester = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { academicYearId } = req.query;
    const semester = await semesterService.getActiveSemester(academicYearId);
    res.json({
        success: true,
        data: semester,
    });
});
//# sourceMappingURL=semesterController.js.map
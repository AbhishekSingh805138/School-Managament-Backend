"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubjectStatistics = exports.toggleSubjectStatus = exports.deleteSubject = exports.updateSubject = exports.getSubjectById = exports.getSubjects = exports.createSubject = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const subjectService_1 = require("../services/subjectService");
const subjectService = new subjectService_1.SubjectService();
exports.createSubject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const subjectData = req.body;
    const subject = await subjectService.createSubject(subjectData);
    res.status(201).json({
        success: true,
        message: 'Subject created successfully',
        data: subject,
    });
});
exports.getSubjects = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await subjectService.getSubjects(req);
    res.json({
        success: true,
        data: result.subjects,
        pagination: result.pagination,
    });
});
exports.getSubjectById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const subject = await subjectService.getSubjectById(id);
    res.json({
        success: true,
        data: subject,
    });
});
exports.updateSubject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const subject = await subjectService.updateSubject(id, updateData);
    res.json({
        success: true,
        message: 'Subject updated successfully',
        data: subject,
    });
});
exports.deleteSubject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await subjectService.deleteSubject(id);
    res.json({
        success: true,
        message: 'Subject deleted successfully',
    });
});
exports.toggleSubjectStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.getSubjectStatistics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
//# sourceMappingURL=subjectController.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClassCapacity = exports.validateClassCapacity = exports.getClassEnrollmentHistory = exports.updateClassTeacher = exports.getClassTeacherAssignments = exports.getClassSubjects = exports.getClassStudents = exports.getClassRoster = exports.transferStudent = exports.bulkEnrollStudentsToClass = exports.enrollStudentToClass = exports.getClassStatistics = exports.removeSubjectFromClass = exports.assignSubjectToClass = exports.deleteClass = exports.updateClass = exports.getClassById = exports.getClasses = exports.createClass = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const classService_1 = require("../services/classService");
const classService = new classService_1.ClassService();
exports.createClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const classData = req.body;
    const classInfo = await classService.createClass(classData);
    res.status(201).json({
        success: true,
        message: 'Class created successfully',
        data: classInfo,
    });
});
exports.getClasses = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await classService.getClasses(req);
    res.json({
        success: true,
        data: result.classes,
        pagination: result.pagination,
    });
});
exports.getClassById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const classInfo = await classService.getClassById(id);
    res.json({
        success: true,
        data: classInfo,
    });
});
exports.updateClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const classInfo = await classService.updateClass(id, updateData);
    res.json({
        success: true,
        message: 'Class updated successfully',
        data: classInfo,
    });
});
exports.deleteClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await classService.deleteClass(id);
    res.json({
        success: true,
        message: 'Class deleted successfully',
    });
});
exports.assignSubjectToClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.removeSubjectFromClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.getClassStatistics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.enrollStudentToClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.bulkEnrollStudentsToClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.transferStudent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.getClassRoster = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.getClassStudents = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.getClassSubjects = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.getClassTeacherAssignments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.updateClassTeacher = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.getClassEnrollmentHistory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.validateClassCapacity = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.getClassCapacity = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
//# sourceMappingURL=classController.js.map
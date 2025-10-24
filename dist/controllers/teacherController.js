"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOptimalTeacherSuggestions = exports.checkAssignmentConflicts = exports.getAllTeacherAssignments = exports.removeTeacherFromClassSubject = exports.assignTeacherToClassSubject = exports.removeTeacherFromClass = exports.getTeacherWorkload = exports.assignTeacherToClass = exports.removeTeacherFromSubject = exports.assignTeacherToSubject = exports.deleteTeacher = exports.updateTeacher = exports.getTeacherById = exports.getTeachers = exports.createTeacher = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const teacherService_1 = require("../services/teacherService");
const teacherService = new teacherService_1.TeacherService();
exports.createTeacher = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const teacherData = req.body;
    const teacher = await teacherService.createTeacher(teacherData);
    res.status(201).json({
        success: true,
        message: 'Teacher profile created successfully',
        data: teacher,
    });
});
exports.getTeachers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await teacherService.getTeachers(req);
    res.json({
        success: true,
        data: result.teachers,
        pagination: result.pagination,
    });
});
exports.getTeacherById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const teacher = await teacherService.getTeacherById(id);
    res.json({
        success: true,
        data: teacher,
    });
});
exports.updateTeacher = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const teacher = await teacherService.updateTeacher(id, updateData);
    res.json({
        success: true,
        message: 'Teacher profile updated successfully',
        data: teacher,
    });
});
exports.deleteTeacher = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await teacherService.deleteTeacher(id);
    res.json({
        success: true,
        message: 'Teacher deactivated successfully',
    });
});
exports.assignTeacherToSubject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { teacherId, subjectId } = req.body;
    const assignment = await teacherService.assignTeacherToSubject(teacherId, subjectId);
    res.status(201).json({
        success: true,
        message: 'Teacher assigned to subject successfully',
        data: assignment,
    });
});
exports.removeTeacherFromSubject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { teacherId, subjectId } = req.params;
    await teacherService.removeTeacherFromSubject(teacherId, subjectId);
    res.json({
        success: true,
        message: 'Teacher removed from subject successfully',
    });
});
exports.assignTeacherToClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { teacherId, classId } = req.body;
    const assignment = await teacherService.assignTeacherToClass(teacherId, classId);
    res.json({
        success: true,
        message: 'Teacher assigned to class successfully',
        data: assignment,
    });
});
exports.getTeacherWorkload = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const workload = await teacherService.getTeacherWorkload(id);
    res.json({
        success: true,
        data: workload,
    });
});
exports.removeTeacherFromClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.assignTeacherToClassSubject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.removeTeacherFromClassSubject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.getAllTeacherAssignments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.checkAssignmentConflicts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.getOptimalTeacherSuggestions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
//# sourceMappingURL=teacherController.js.map
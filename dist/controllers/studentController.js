"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpdateStudents = exports.getStudentsByClass = exports.getStudentClassHistory = exports.getStudentSummary = exports.deleteStudent = exports.updateStudent = exports.getStudentById = exports.getStudents = exports.createStudent = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const studentService_1 = require("../services/studentService");
const studentService = new studentService_1.StudentService();
exports.createStudent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const studentData = req.body;
    const student = await studentService.createStudent(studentData);
    res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: student,
    });
});
exports.getStudents = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await studentService.getStudents(req);
    res.json({
        success: true,
        data: result.students,
        pagination: result.pagination,
    });
});
exports.getStudentById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const student = await studentService.getStudentById(id);
    res.json({
        success: true,
        data: student,
    });
});
exports.updateStudent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const student = await studentService.updateStudent(id, updateData);
    res.json({
        success: true,
        message: 'Student updated successfully',
        data: student,
    });
});
exports.deleteStudent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await studentService.deleteStudent(id);
    res.json({
        success: true,
        message: 'Student deactivated successfully',
    });
});
exports.getStudentSummary = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.getStudentClassHistory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.getStudentsByClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.bulkUpdateStudents = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
//# sourceMappingURL=studentController.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClassAttendance = exports.getAttendanceRecords = exports.getStudentAttendanceSummary = exports.deleteAttendance = exports.updateAttendance = exports.getAttendanceById = exports.getAttendance = exports.markBulkAttendance = exports.markAttendance = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const attendanceService_1 = require("../services/attendanceService");
const attendanceService = new attendanceService_1.AttendanceService();
exports.markAttendance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const attendanceData = req.body;
    const markedBy = req.user.id;
    const attendance = await attendanceService.markAttendance(attendanceData, markedBy);
    res.status(201).json({
        success: true,
        message: 'Attendance marked successfully',
        data: attendance,
    });
});
exports.markBulkAttendance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const bulkData = req.body;
    const markedBy = req.user.id;
    const result = await attendanceService.markBulkAttendance(bulkData, markedBy);
    res.status(201).json({
        success: true,
        message: 'Bulk attendance marked successfully',
        data: result,
    });
});
exports.getAttendance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await attendanceService.getAttendance(req);
    res.json({
        success: true,
        data: result.attendance,
        pagination: result.pagination,
    });
});
exports.getAttendanceById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const attendance = await attendanceService.getAttendanceById(id);
    res.json({
        success: true,
        data: attendance,
    });
});
exports.updateAttendance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const attendance = await attendanceService.updateAttendance(id, updateData);
    res.json({
        success: true,
        message: 'Attendance updated successfully',
        data: attendance,
    });
});
exports.deleteAttendance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await attendanceService.deleteAttendance(id);
    res.json({
        success: true,
        message: 'Attendance record deleted successfully',
    });
});
exports.getStudentAttendanceSummary = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;
    const summary = await attendanceService.getStudentAttendanceSummary(studentId, startDate, endDate);
    res.json({
        success: true,
        data: summary,
    });
});
exports.getAttendanceRecords = exports.getAttendance;
exports.getClassAttendance = exports.getAttendance;
//# sourceMappingURL=attendanceController.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportAttendanceData = exports.getAttendanceStatistics = exports.getAttendanceTrends = exports.generateAttendanceReport = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const attendanceReportService_1 = require("../services/attendanceReportService");
const attendanceReportService = new attendanceReportService_1.AttendanceReportService();
exports.generateAttendanceReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const reportQuery = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    const report = await attendanceReportService.generateAttendanceReport(reportQuery, userId, userRole);
    res.json({
        success: true,
        data: report,
    });
});
exports.getAttendanceTrends = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    const trends = await attendanceReportService.getAttendanceTrends(filters, userId, userRole);
    res.json({
        success: true,
        data: trends,
    });
});
exports.getAttendanceStatistics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { period = 'today' } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    const statistics = await attendanceReportService.getAttendanceStatistics(period, userId, userRole);
    res.json({
        success: true,
        data: statistics,
    });
});
exports.exportAttendanceData = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { format = 'csv', ...reportQuery } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    const exportResult = await attendanceReportService.exportAttendanceData(format, reportQuery, userId, userRole);
    if (format === 'json') {
        res.json({
            success: true,
            data: exportResult.data,
            exportInfo: exportResult.exportInfo,
        });
    }
    else {
        res.setHeader('Content-Type', exportResult.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
        res.send(exportResult.csvData);
    }
});
//# sourceMappingURL=attendanceReportController.js.map
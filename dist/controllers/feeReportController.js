"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportFeeReportData = exports.getPaymentAnalysisReport = exports.getFeeDefaultersReport = exports.getOutstandingDuesReport = exports.generateFeeCollectionReport = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const feeReportService_1 = require("../services/feeReportService");
const feeReportService = new feeReportService_1.FeeReportService();
exports.generateFeeCollectionReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const reportQuery = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    const report = await feeReportService.generateFeeCollectionReport(reportQuery, userId, userRole);
    res.json({
        success: true,
        data: report,
    });
});
exports.getOutstandingDuesReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    const report = await feeReportService.getOutstandingDuesReport(filters, userId, userRole);
    res.json({
        success: true,
        data: report,
    });
});
exports.getFeeDefaultersReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    const report = await feeReportService.getFeeDefaultersReport(filters, userId, userRole);
    res.json({
        success: true,
        data: report,
    });
});
exports.getPaymentAnalysisReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    const report = await feeReportService.getPaymentAnalysisReport(filters, userId, userRole);
    res.json({
        success: true,
        data: report,
    });
});
exports.exportFeeReportData = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { format = 'csv', reportType = 'collection', ...filters } = req.query;
    const userId = req.user.id;
    const exportResult = await feeReportService.exportFeeReportData(format, reportType, filters, userId);
    if (format === 'json') {
        res.json({
            success: true,
            data: exportResult.data,
            exportInfo: exportResult.exportInfo,
        });
    }
    else {
        res.setHeader('Content-Type', exportResult.mimeType || 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename || 'report.csv'}"`);
        res.send(exportResult.csvData);
    }
});
//# sourceMappingURL=feeReportController.js.map
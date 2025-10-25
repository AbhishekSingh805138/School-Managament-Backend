"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExportStatistics = exports.getReportHistory = exports.executeScheduledReport = exports.deleteScheduledReport = exports.updateScheduledReport = exports.getScheduledReportById = exports.getScheduledReports = exports.createScheduledReport = exports.emailReport = exports.downloadReport = exports.exportReport = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const reportExportService_1 = require("../services/reportExportService");
const scheduledReportService_1 = require("../services/scheduledReportService");
const report_1 = require("../types/report");
const pagination_1 = require("../utils/pagination");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
exports.exportReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { reportId } = req.params;
    const { format = 'pdf' } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    const exportFormat = report_1.ReportFormatSchema.parse(format);
    const reportData = await getReportData(reportId, userId, userRole);
    if (!reportData) {
        throw new errorHandler_1.AppError('Report not found or access denied', 404);
    }
    const exportResult = await reportExportService_1.reportExportService.exportReport(reportData, exportFormat);
    await logExportActivity(reportId, userId, exportFormat, exportResult.success);
    if (exportResult.success) {
        res.json({
            success: true,
            data: {
                downloadUrl: exportResult.downloadUrl,
                fileName: exportResult.fileName,
                fileSize: exportResult.fileSize,
                format: exportFormat,
            },
            message: 'Report exported successfully'
        });
    }
    else {
        throw new errorHandler_1.AppError('Export failed', 500);
    }
});
exports.downloadReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { fileName } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const hasAccess = await validateFileAccess(fileName, userId, userRole);
    if (!hasAccess) {
        throw new errorHandler_1.AppError('File not found or access denied', 404);
    }
    const filePath = path_1.default.join(process.cwd(), 'exports', fileName);
    try {
        await promises_1.default.access(filePath);
        const stats = await promises_1.default.stat(filePath);
        const mimeType = getMimeType(fileName);
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        const fileBuffer = await promises_1.default.readFile(filePath);
        res.send(fileBuffer);
    }
    catch (error) {
        throw new errorHandler_1.AppError('File not found', 404);
    }
});
exports.emailReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { reportId } = req.params;
    const { recipients, format = 'pdf', message } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        throw new errorHandler_1.AppError('Recipients are required', 400);
    }
    const exportFormat = report_1.ReportFormatSchema.parse(format);
    const reportData = await getReportData(reportId, userId, userRole);
    if (!reportData) {
        throw new errorHandler_1.AppError('Report not found or access denied', 404);
    }
    const exportResult = await reportExportService_1.reportExportService.exportReport(reportData, exportFormat);
    if (!exportResult.success) {
        throw new errorHandler_1.AppError('Failed to generate report for email', 500);
    }
    await reportExportService_1.reportExportService.emailReport(exportResult, recipients, reportData, message);
    await logEmailActivity(reportId, userId, recipients, exportFormat);
    res.json({
        success: true,
        message: `Report emailed successfully to ${recipients.length} recipient(s)`
    });
});
exports.createScheduledReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const reportData = report_1.CreateScheduledReportSchema.parse(req.body);
    const userId = req.user.id;
    const userRole = req.user.role;
    if (!['admin', 'staff'].includes(userRole)) {
        throw new errorHandler_1.AppError('Only administrators and staff can create scheduled reports', 403);
    }
    const scheduledReport = await scheduledReportService_1.scheduledReportService.createScheduledReport(reportData, userId);
    res.status(201).json({
        success: true,
        data: scheduledReport,
        message: 'Scheduled report created successfully'
    });
});
exports.getScheduledReports = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const queryParams = report_1.ReportQuerySchema.parse(req.query);
    const userId = req.user.id;
    const userRole = req.user.role;
    const filters = {
        reportType: queryParams.reportType,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        page: queryParams.page,
        limit: queryParams.limit,
    };
    const { reports, total } = await scheduledReportService_1.scheduledReportService.getScheduledReports(filters, userId, userRole);
    res.json({
        success: true,
        data: reports,
        pagination: {
            page: queryParams.page,
            limit: queryParams.limit,
            total,
            pages: Math.ceil(total / queryParams.limit)
        }
    });
});
exports.getScheduledReportById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const scheduledReport = await scheduledReportService_1.scheduledReportService.getScheduledReportById(id, userId, userRole);
    if (!scheduledReport) {
        throw new errorHandler_1.AppError('Scheduled report not found', 404);
    }
    res.json({
        success: true,
        data: scheduledReport
    });
});
exports.updateScheduledReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = report_1.UpdateScheduledReportSchema.parse(req.body);
    const userId = req.user.id;
    const userRole = req.user.role;
    const updatedReport = await scheduledReportService_1.scheduledReportService.updateScheduledReport(id, updateData, userId, userRole);
    res.json({
        success: true,
        data: updatedReport,
        message: 'Scheduled report updated successfully'
    });
});
exports.deleteScheduledReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    await scheduledReportService_1.scheduledReportService.deleteScheduledReport(id, userId, userRole);
    res.json({
        success: true,
        message: 'Scheduled report deleted successfully'
    });
});
exports.executeScheduledReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const exportResult = await scheduledReportService_1.scheduledReportService.executeScheduledReport(id, userId, userRole);
    res.json({
        success: true,
        data: {
            downloadUrl: exportResult.downloadUrl,
            fileName: exportResult.fileName,
            fileSize: exportResult.fileSize,
        },
        message: 'Scheduled report executed successfully'
    });
});
exports.getReportHistory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const queryParams = report_1.ReportQuerySchema.parse(req.query);
    const userId = req.user.id;
    const userRole = req.user.role;
    const { offset, limit } = (0, pagination_1.getPaginationParams)(req);
    let whereClause = 'WHERE 1=1';
    const sqlParams = [];
    if (userRole !== 'admin') {
        whereClause += ` AND rh.generated_by = $${sqlParams.length + 1}`;
        sqlParams.push(userId);
    }
    if (queryParams.reportType) {
        whereClause += ` AND rh.report_type = $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.reportType);
    }
    if (queryParams.status) {
        whereClause += ` AND rh.status = $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.status);
    }
    if (queryParams.startDate) {
        whereClause += ` AND rh.generated_at >= $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.startDate);
    }
    if (queryParams.endDate) {
        whereClause += ` AND rh.generated_at <= $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.endDate);
    }
    const countResult = await (0, connection_1.query)(`SELECT COUNT(*) as total FROM report_history rh ${whereClause}`, sqlParams);
    const total = parseInt(countResult.rows[0].total);
    const result = await (0, connection_1.query)(`SELECT 
       rh.*,
       u.first_name as generated_by_first_name,
       u.last_name as generated_by_last_name,
       sr.name as scheduled_report_name
     FROM report_history rh
     LEFT JOIN users u ON rh.generated_by = u.id
     LEFT JOIN scheduled_reports sr ON rh.scheduled_report_id = sr.id
     ${whereClause}
     ORDER BY rh.generated_at DESC
     LIMIT $${sqlParams.length + 1} OFFSET $${sqlParams.length + 2}`, [...sqlParams, limit, offset]);
    const reportHistory = result.rows.map((row) => ({
        id: row.id.toString(),
        scheduledReportId: row.scheduled_report_id?.toString() || null,
        scheduledReportName: row.scheduled_report_name || null,
        reportType: row.report_type,
        title: row.title,
        parameters: typeof row.parameters === 'string' ? JSON.parse(row.parameters) : row.parameters,
        format: row.format,
        status: row.status,
        fileSize: row.file_size,
        downloadUrl: row.download_url,
        generatedBy: row.generated_by?.toString() || 'system',
        generatedAt: row.generated_at.toISOString(),
        expiresAt: row.expires_at?.toISOString() || null,
        error: row.error,
        generatedByUser: row.generated_by_first_name ? {
            firstName: row.generated_by_first_name,
            lastName: row.generated_by_last_name,
        } : null,
    }));
    res.json({
        success: true,
        data: reportHistory,
        pagination: {
            page: queryParams.page,
            limit: queryParams.limit,
            total,
            pages: Math.ceil(total / queryParams.limit)
        }
    });
});
exports.getExportStatistics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    if (userRole !== 'admin') {
        throw new errorHandler_1.AppError('Only administrators can view export statistics', 403);
    }
    const stats = await (0, connection_1.query)(`
    SELECT 
      COUNT(*) as total_exports,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_exports,
      COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_exports,
      COUNT(CASE WHEN generated_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as exports_last_week,
      COUNT(CASE WHEN generated_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as exports_last_month,
      AVG(file_size) as average_file_size,
      SUM(file_size) as total_file_size,
      COUNT(DISTINCT report_type) as unique_report_types,
      mode() WITHIN GROUP (ORDER BY format) as most_popular_format,
      mode() WITHIN GROUP (ORDER BY report_type) as most_popular_report_type
    FROM report_history
    WHERE generated_at >= CURRENT_DATE - INTERVAL '1 year'
  `);
    const formatStats = await (0, connection_1.query)(`
    SELECT 
      format,
      COUNT(*) as count,
      ROUND((COUNT(*)::decimal / (SELECT COUNT(*) FROM report_history WHERE generated_at >= CURRENT_DATE - INTERVAL '1 year')) * 100, 2) as percentage
    FROM report_history
    WHERE generated_at >= CURRENT_DATE - INTERVAL '1 year'
    GROUP BY format
    ORDER BY count DESC
  `);
    const typeStats = await (0, connection_1.query)(`
    SELECT 
      report_type,
      COUNT(*) as count,
      ROUND((COUNT(*)::decimal / (SELECT COUNT(*) FROM report_history WHERE generated_at >= CURRENT_DATE - INTERVAL '1 year')) * 100, 2) as percentage
    FROM report_history
    WHERE generated_at >= CURRENT_DATE - INTERVAL '1 year'
    GROUP BY report_type
    ORDER BY count DESC
  `);
    const monthlyTrends = await (0, connection_1.query)(`
    SELECT 
      DATE_TRUNC('month', generated_at) as month,
      COUNT(*) as exports,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
      COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
    FROM report_history
    WHERE generated_at >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', generated_at)
    ORDER BY month
  `);
    const statistics = stats.rows[0];
    res.json({
        success: true,
        data: {
            overview: {
                totalExports: parseInt(statistics.total_exports) || 0,
                successfulExports: parseInt(statistics.successful_exports) || 0,
                failedExports: parseInt(statistics.failed_exports) || 0,
                exportsLastWeek: parseInt(statistics.exports_last_week) || 0,
                exportsLastMonth: parseInt(statistics.exports_last_month) || 0,
                averageFileSize: parseFloat(statistics.average_file_size) || 0,
                totalFileSize: parseFloat(statistics.total_file_size) || 0,
                uniqueReportTypes: parseInt(statistics.unique_report_types) || 0,
                mostPopularFormat: statistics.most_popular_format || 'N/A',
                mostPopularReportType: statistics.most_popular_report_type || 'N/A',
            },
            formatDistribution: formatStats.rows.map((row) => ({
                format: row.format,
                count: parseInt(row.count),
                percentage: parseFloat(row.percentage),
            })),
            typeDistribution: typeStats.rows.map((row) => ({
                reportType: row.report_type,
                count: parseInt(row.count),
                percentage: parseFloat(row.percentage),
            })),
            monthlyTrends: monthlyTrends.rows.map((row) => ({
                month: row.month.toISOString().slice(0, 7),
                exports: parseInt(row.exports),
                successful: parseInt(row.successful),
                failed: parseInt(row.failed),
            })),
        }
    });
});
async function getReportData(reportId, userId, userRole) {
    return {
        metadata: {
            reportId,
            reportType: 'attendance',
            title: 'Sample Report',
            generatedBy: userId,
            generatedAt: new Date().toISOString(),
            parameters: {},
            format: 'json'
        },
        summary: {
            totalRecords: 100,
            dateRange: {
                startDate: '2024-01-01',
                endDate: '2024-01-31'
            },
            filters: {},
            aggregations: {
                'Total Students': 100,
                'Average Attendance': '85%'
            }
        },
        data: [
            { studentName: 'John Doe', attendancePercentage: 95 },
            { studentName: 'Jane Smith', attendancePercentage: 88 }
        ]
    };
}
async function validateFileAccess(fileName, userId, userRole) {
    return true;
}
function getMimeType(fileName) {
    const extension = path_1.default.extname(fileName).toLowerCase();
    switch (extension) {
        case '.pdf':
            return 'application/pdf';
        case '.xlsx':
            return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case '.csv':
            return 'text/csv';
        default:
            return 'application/octet-stream';
    }
}
async function logExportActivity(reportId, userId, format, success) {
    try {
        await (0, connection_1.query)(`INSERT INTO report_history (
         report_type, title, parameters, format, status, generated_by, generated_at
       ) VALUES ('export', 'Report Export', '{}', $1, $2, $3, CURRENT_TIMESTAMP)`, [format, success ? 'completed' : 'failed', userId]);
    }
    catch (error) {
        console.error('Failed to log export activity:', error);
    }
}
async function logEmailActivity(reportId, userId, recipients, format) {
    try {
        await (0, connection_1.query)(`INSERT INTO report_history (
         report_type, title, parameters, format, status, generated_by, generated_at
       ) VALUES ('email', 'Report Email', $1, $2, 'completed', $3, CURRENT_TIMESTAMP)`, [JSON.stringify({ recipients }), format, userId]);
    }
    catch (error) {
        console.error('Failed to log email activity:', error);
    }
}
//# sourceMappingURL=reportExportController.js.map
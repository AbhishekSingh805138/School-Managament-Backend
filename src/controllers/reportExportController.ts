import { Request, Response } from 'express';
import { query } from '../database/connection';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { reportExportService } from '../services/reportExportService';
import { scheduledReportService, ScheduledReportFilters } from '../services/scheduledReportService';
import { 
  ReportFormatSchema,
  CreateScheduledReportSchema,
  UpdateScheduledReportSchema,
  ReportQuerySchema
} from '../types/report';
import { getPaginationParams } from '../utils/pagination';
import fs from 'fs/promises';
import path from 'path';

// Export existing report
export const exportReport = asyncHandler(async (req: Request, res: Response) => {
  const { reportId } = req.params;
  const { format = 'pdf' } = req.query;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Validate format
  const exportFormat = ReportFormatSchema.parse(format);

  // Get report data from report history or generate new report
  const reportData = await getReportData(reportId, userId, userRole);

  if (!reportData) {
    throw new AppError('Report not found or access denied', 404);
  }

  // Export report
  const exportResult = await reportExportService.exportReport(reportData, exportFormat);

  // Log export activity
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
  } else {
    throw new AppError('Export failed', 500);
  }
});

// Download exported report file
export const downloadReport = asyncHandler(async (req: Request, res: Response) => {
  const { fileName } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Validate file access
  const hasAccess = await validateFileAccess(fileName, userId, userRole);
  if (!hasAccess) {
    throw new AppError('File not found or access denied', 404);
  }

  const filePath = path.join(process.cwd(), 'exports', fileName);

  try {
    // Check if file exists
    await fs.access(filePath);

    // Get file stats
    const stats = await fs.stat(filePath);
    
    // Set appropriate headers
    const mimeType = getMimeType(fileName);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Stream file to response
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
  } catch (error) {
    throw new AppError('File not found', 404);
  }
});

// Email report
export const emailReport = asyncHandler(async (req: Request, res: Response) => {
  const { reportId } = req.params;
  const { recipients, format = 'pdf', message } = req.body;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Validate inputs
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    throw new AppError('Recipients are required', 400);
  }

  const exportFormat = ReportFormatSchema.parse(format);

  // Get report data
  const reportData = await getReportData(reportId, userId, userRole);
  if (!reportData) {
    throw new AppError('Report not found or access denied', 404);
  }

  // Export report
  const exportResult = await reportExportService.exportReport(reportData, exportFormat);

  if (!exportResult.success) {
    throw new AppError('Failed to generate report for email', 500);
  }

  // Send email
  await reportExportService.emailReport(exportResult, recipients, reportData, message);

  // Log email activity
  await logEmailActivity(reportId, userId, recipients, exportFormat);

  res.json({
    success: true,
    message: `Report emailed successfully to ${recipients.length} recipient(s)`
  });
});

// Create scheduled report
export const createScheduledReport = asyncHandler(async (req: Request, res: Response) => {
  const reportData = CreateScheduledReportSchema.parse(req.body);
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Only admins and staff can create scheduled reports
  if (!['admin', 'staff'].includes(userRole)) {
    throw new AppError('Only administrators and staff can create scheduled reports', 403);
  }

  const scheduledReport = await scheduledReportService.createScheduledReport(reportData, userId);

  res.status(201).json({
    success: true,
    data: scheduledReport,
    message: 'Scheduled report created successfully'
  });
});

// Get scheduled reports
export const getScheduledReports = asyncHandler(async (req: Request, res: Response) => {
  const queryParams = ReportQuerySchema.parse(req.query);
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const filters: ScheduledReportFilters = {
    reportType: queryParams.reportType,
    isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    page: queryParams.page,
    limit: queryParams.limit,
  };

  const { reports, total } = await scheduledReportService.getScheduledReports(filters, userId, userRole);

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

// Get scheduled report by ID
export const getScheduledReportById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const scheduledReport = await scheduledReportService.getScheduledReportById(id, userId, userRole);

  if (!scheduledReport) {
    throw new AppError('Scheduled report not found', 404);
  }

  res.json({
    success: true,
    data: scheduledReport
  });
});

// Update scheduled report
export const updateScheduledReport = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = UpdateScheduledReportSchema.parse(req.body);
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const updatedReport = await scheduledReportService.updateScheduledReport(id, updateData, userId, userRole);

  res.json({
    success: true,
    data: updatedReport,
    message: 'Scheduled report updated successfully'
  });
});

// Delete scheduled report
export const deleteScheduledReport = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  await scheduledReportService.deleteScheduledReport(id, userId, userRole);

  res.json({
    success: true,
    message: 'Scheduled report deleted successfully'
  });
});

// Execute scheduled report manually
export const executeScheduledReport = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const exportResult = await scheduledReportService.executeScheduledReport(id, userId, userRole);

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

// Get report history
export const getReportHistory = asyncHandler(async (req: Request, res: Response) => {
  const queryParams = ReportQuerySchema.parse(req.query);
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { offset, limit } = getPaginationParams(req);

  // Build WHERE clause based on filters and authorization
  let whereClause = 'WHERE 1=1';
  const sqlParams: any[] = [];

  // Add authorization filters
  if (userRole !== 'admin') {
    whereClause += ` AND rh.generated_by = $${sqlParams.length + 1}`;
    sqlParams.push(userId);
  }

  // Add optional filters
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

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM report_history rh ${whereClause}`,
    sqlParams
  );

  const total = parseInt(countResult.rows[0].total);

  // Get report history with pagination
  const result = await query(
    `SELECT 
       rh.*,
       u.first_name as generated_by_first_name,
       u.last_name as generated_by_last_name,
       sr.name as scheduled_report_name
     FROM report_history rh
     LEFT JOIN users u ON rh.generated_by = u.id
     LEFT JOIN scheduled_reports sr ON rh.scheduled_report_id = sr.id
     ${whereClause}
     ORDER BY rh.generated_at DESC
     LIMIT $${sqlParams.length + 1} OFFSET $${sqlParams.length + 2}`,
    [...sqlParams, limit, offset]
  );

  const reportHistory = result.rows.map((row: any) => ({
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

// Get export statistics
export const getExportStatistics = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Only admins can view export statistics
  if (userRole !== 'admin') {
    throw new AppError('Only administrators can view export statistics', 403);
  }

  // Get export statistics
  const stats = await query(`
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

  // Get format distribution
  const formatStats = await query(`
    SELECT 
      format,
      COUNT(*) as count,
      ROUND((COUNT(*)::decimal / (SELECT COUNT(*) FROM report_history WHERE generated_at >= CURRENT_DATE - INTERVAL '1 year')) * 100, 2) as percentage
    FROM report_history
    WHERE generated_at >= CURRENT_DATE - INTERVAL '1 year'
    GROUP BY format
    ORDER BY count DESC
  `);

  // Get report type distribution
  const typeStats = await query(`
    SELECT 
      report_type,
      COUNT(*) as count,
      ROUND((COUNT(*)::decimal / (SELECT COUNT(*) FROM report_history WHERE generated_at >= CURRENT_DATE - INTERVAL '1 year')) * 100, 2) as percentage
    FROM report_history
    WHERE generated_at >= CURRENT_DATE - INTERVAL '1 year'
    GROUP BY report_type
    ORDER BY count DESC
  `);

  // Get monthly export trends
  const monthlyTrends = await query(`
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
      formatDistribution: formatStats.rows.map((row: any) => ({
        format: row.format,
        count: parseInt(row.count),
        percentage: parseFloat(row.percentage),
      })),
      typeDistribution: typeStats.rows.map((row: any) => ({
        reportType: row.report_type,
        count: parseInt(row.count),
        percentage: parseFloat(row.percentage),
      })),
      monthlyTrends: monthlyTrends.rows.map((row: any) => ({
        month: row.month.toISOString().slice(0, 7), // YYYY-MM format
        exports: parseInt(row.exports),
        successful: parseInt(row.successful),
        failed: parseInt(row.failed),
      })),
    }
  });
});

// Helper functions

/**
 * Get report data by ID
 */
async function getReportData(reportId: string, userId: string, userRole: string): Promise<any | null> {
  // This would integrate with existing report generation logic
  // For now, return a mock structure
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

/**
 * Validate file access
 */
async function validateFileAccess(fileName: string, userId: string, userRole: string): Promise<boolean> {
  // Check if user has access to this file
  // This could be based on report history or file ownership
  return true; // Simplified for now
}

/**
 * Get MIME type for file
 */
function getMimeType(fileName: string): string {
  const extension = path.extname(fileName).toLowerCase();
  
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

/**
 * Log export activity
 */
async function logExportActivity(
  reportId: string,
  userId: string,
  format: string,
  success: boolean
): Promise<void> {
  try {
    await query(
      `INSERT INTO report_history (
         report_type, title, parameters, format, status, generated_by, generated_at
       ) VALUES ('export', 'Report Export', '{}', $1, $2, $3, CURRENT_TIMESTAMP)`,
      [format, success ? 'completed' : 'failed', userId]
    );
  } catch (error) {
    console.error('Failed to log export activity:', error);
  }
}

/**
 * Log email activity
 */
async function logEmailActivity(
  reportId: string,
  userId: string,
  recipients: string[],
  format: string
): Promise<void> {
  try {
    await query(
      `INSERT INTO report_history (
         report_type, title, parameters, format, status, generated_by, generated_at
       ) VALUES ('email', 'Report Email', $1, $2, 'completed', $3, CURRENT_TIMESTAMP)`,
      [JSON.stringify({ recipients }), format, userId]
    );
  } catch (error) {
    console.error('Failed to log email activity:', error);
  }
}
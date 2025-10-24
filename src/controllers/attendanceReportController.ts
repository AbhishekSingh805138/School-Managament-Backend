import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AttendanceReportService } from '../services/attendanceReportService';

const attendanceReportService = new AttendanceReportService();

// Generate attendance summary report
export const generateAttendanceReport = asyncHandler(async (req: Request, res: Response) => {
  const reportQuery = req.query as any;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const report = await attendanceReportService.generateAttendanceReport(reportQuery, userId, userRole);

  res.json({
    success: true,
    data: report,
  });
});

// Get attendance trends and analytics
export const getAttendanceTrends = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const trends = await attendanceReportService.getAttendanceTrends(filters, userId, userRole);

  res.json({
    success: true,
    data: trends,
  });
});

// Get attendance statistics for dashboard
export const getAttendanceStatistics = asyncHandler(async (req: Request, res: Response) => {
  const { period = 'today' } = req.query;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const statistics = await attendanceReportService.getAttendanceStatistics(period as string, userId, userRole);

  res.json({
    success: true,
    data: statistics,
  });
});

// Export attendance data in different formats
export const exportAttendanceData = asyncHandler(async (req: Request, res: Response) => {
  const { format = 'csv', ...reportQuery } = req.query as any;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const exportResult = await attendanceReportService.exportAttendanceData(format as string, reportQuery, userId, userRole);

  if (format === 'json') {
    res.json({
      success: true,
      data: exportResult.data,
      exportInfo: exportResult.exportInfo,
    });
  } else {
    res.setHeader('Content-Type', (exportResult as any).mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${(exportResult as any).filename}"`);
    res.send((exportResult as any).csvData);
  }
});
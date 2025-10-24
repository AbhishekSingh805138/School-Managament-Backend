import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { FeeReportService } from '../services/feeReportService';

const feeReportService = new FeeReportService();

// Generate comprehensive fee collection report
export const generateFeeCollectionReport = asyncHandler(async (req: Request, res: Response) => {
  const reportQuery = req.query as any;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const report = await feeReportService.generateFeeCollectionReport(reportQuery, userId, userRole);

  res.json({
    success: true,
    data: report,
  });
});

// Get outstanding dues report
export const getOutstandingDuesReport = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const report = await feeReportService.getOutstandingDuesReport(filters, userId, userRole);

  res.json({
    success: true,
    data: report,
  });
});

// Get fee defaulters report
export const getFeeDefaultersReport = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const report = await feeReportService.getFeeDefaultersReport(filters, userId, userRole);

  res.json({
    success: true,
    data: report,
  });
});

// Get payment analysis report
export const getPaymentAnalysisReport = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const report = await feeReportService.getPaymentAnalysisReport(filters, userId, userRole);

  res.json({
    success: true,
    data: report,
  });
});

// Export fee report data
export const exportFeeReportData = asyncHandler(async (req: Request, res: Response) => {
  const { format = 'csv', reportType = 'collection', ...filters } = req.query;
  const userId = req.user!.id;

  const exportResult = await feeReportService.exportFeeReportData(
    format as string, 
    reportType as string, 
    filters, 
    userId
  );

  if (format === 'json') {
    res.json({
      success: true,
      data: exportResult.data,
      exportInfo: exportResult.exportInfo,
    });
  } else {
    res.setHeader('Content-Type', exportResult.mimeType || 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename || 'report.csv'}"`);
    res.send(exportResult.csvData);
  }
});
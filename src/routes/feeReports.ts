import { Router } from 'express';
import {
  generateFeeCollectionReport,
  getOutstandingDuesReport,
  getFeeDefaultersReport,
  getPaymentAnalysisReport,
  exportFeeReportData,
} from '../controllers/feeReportController';
import { validateQuery } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { FeeReportQuerySchema } from '../types/fee';
import { IdSchema } from '../types/common';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Generate fee collection report
router.get(
  '/collection',
  validateQuery(FeeReportQuerySchema),
  generateFeeCollectionReport
);

// Get outstanding dues report
router.get(
  '/outstanding',
  validateQuery(z.object({
    classId: IdSchema.optional(),
    feeCategoryId: IdSchema.optional(),
    daysOverdue: z.string().optional().default('0').transform(Number),
  })),
  getOutstandingDuesReport
);

// Get fee defaulters report (admin and staff only)
router.get(
  '/defaulters',
  authorize('admin', 'staff'),
  validateQuery(z.object({
    minOutstandingAmount: z.string().optional().default('0').transform(Number),
    minDaysOverdue: z.string().optional().default('30').transform(Number),
  })),
  getFeeDefaultersReport
);

// Get payment analysis report
router.get(
  '/payment-analysis',
  validateQuery(z.object({
    period: z.enum(['week', 'month', 'quarter', 'year']).optional().default('month'),
    classId: IdSchema.optional(),
    feeCategoryId: IdSchema.optional(),
  })),
  getPaymentAnalysisReport
);

// Export fee report data
router.get(
  '/export',
  validateQuery(z.object({
    format: z.enum(['csv', 'json', 'excel']).optional().default('csv'),
    reportType: z.enum(['collection', 'outstanding', 'defaulters']).optional().default('collection'),
    classId: IdSchema.optional(),
    feeCategoryId: IdSchema.optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  })),
  exportFeeReportData
);

export default router;
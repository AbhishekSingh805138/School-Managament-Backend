import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { PaymentService } from '../services/paymentService';

const paymentService = new PaymentService();

// Record a payment
export const recordPayment = asyncHandler(async (req: Request, res: Response) => {
  const paymentData = req.body;
  const processedBy = req.user!.id;
  const payment = await paymentService.recordPayment(paymentData, processedBy);

  res.status(201).json({
    success: true,
    message: 'Payment recorded successfully',
    data: payment,
  });
});

// Get all payments
export const getPayments = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentService.getPayments(req);

  res.json({
    success: true,
    data: result.payments,
    pagination: result.pagination,
  });
});

// Get payment by ID
export const getPaymentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payment = await paymentService.getPaymentById(id);

  res.json({
    success: true,
    data: payment,
  });
});

// Get payment summary
export const getPaymentSummary = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const summary = await paymentService.getPaymentSummary(
    startDate as string,
    endDate as string
  );

  res.json({
    success: true,
    data: summary,
  });
});

// Placeholder functions for missing exports
export const getPaymentReceipt = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const getPaymentHistory = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const getPaymentStatistics = getPaymentSummary; // Alias

export const reversePayment = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});
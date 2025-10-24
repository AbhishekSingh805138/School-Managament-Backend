"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reversePayment = exports.getPaymentStatistics = exports.getPaymentHistory = exports.getPaymentReceipt = exports.getPaymentSummary = exports.getPaymentById = exports.getPayments = exports.recordPayment = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const paymentService_1 = require("../services/paymentService");
const paymentService = new paymentService_1.PaymentService();
exports.recordPayment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const paymentData = req.body;
    const processedBy = req.user.id;
    const payment = await paymentService.recordPayment(paymentData, processedBy);
    res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        data: payment,
    });
});
exports.getPayments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await paymentService.getPayments(req);
    res.json({
        success: true,
        data: result.payments,
        pagination: result.pagination,
    });
});
exports.getPaymentById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const payment = await paymentService.getPaymentById(id);
    res.json({
        success: true,
        data: payment,
    });
});
exports.getPaymentSummary = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const summary = await paymentService.getPaymentSummary(startDate, endDate);
    res.json({
        success: true,
        data: summary,
    });
});
exports.getPaymentReceipt = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.getPaymentHistory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.getPaymentStatistics = exports.getPaymentSummary;
exports.reversePayment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
//# sourceMappingURL=paymentController.js.map
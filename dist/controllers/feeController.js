"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudentFee = exports.getStudentFeeById = exports.assignFeesToClass = exports.getStudentFees = exports.assignFeesToStudents = exports.deleteFeeCategory = exports.updateFeeCategory = exports.getFeeCategoryById = exports.getFeeCategories = exports.createFeeCategory = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const feeService_1 = require("../services/feeService");
const feeService = new feeService_1.FeeService();
exports.createFeeCategory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const feeCategoryData = req.body;
    const feeCategory = await feeService.createFeeCategory(feeCategoryData);
    res.status(201).json({
        success: true,
        message: 'Fee category created successfully',
        data: feeCategory,
    });
});
exports.getFeeCategories = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await feeService.getFeeCategories(req);
    res.json({
        success: true,
        data: result.feeCategories,
        pagination: result.pagination,
    });
});
exports.getFeeCategoryById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const feeCategory = await feeService.getFeeCategoryById(id);
    res.json({
        success: true,
        data: feeCategory,
    });
});
exports.updateFeeCategory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const feeCategory = await feeService.updateFeeCategory(id, updateData);
    res.json({
        success: true,
        message: 'Fee category updated successfully',
        data: feeCategory,
    });
});
exports.deleteFeeCategory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await feeService.deleteFeeCategory(id);
    res.json({
        success: true,
        message: 'Fee category deleted successfully',
    });
});
exports.assignFeesToStudents = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const assignmentData = req.body;
    const result = await feeService.assignFeesToStudents(assignmentData);
    res.status(201).json({
        success: true,
        message: 'Fees assigned to students successfully',
        data: result,
    });
});
exports.getStudentFees = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await feeService.getStudentFees(req);
    res.json({
        success: true,
        data: result.studentFees,
        pagination: result.pagination,
    });
});
exports.assignFeesToClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.getStudentFeeById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.updateStudentFee = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
//# sourceMappingURL=feeController.js.map
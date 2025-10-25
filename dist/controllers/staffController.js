"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaffSummary = exports.reactivateStaff = exports.deactivateStaff = exports.updateStaff = exports.getStaffById = exports.getStaff = exports.createStaff = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const staff_1 = require("../types/staff");
const staffService_1 = require("../services/staffService");
const staffService = new staffService_1.StaffService();
exports.createStaff = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const staffData = staff_1.CreateStaffSchema.parse(req.body);
    const userRole = req.user.role;
    if (userRole !== 'admin') {
        throw new errorHandler_1.AppError('Only administrators can create staff members', 403);
    }
    const staff = await staffService.createStaff(staffData, parseInt(req.user.id));
    res.status(201).json({
        success: true,
        data: staff,
        message: 'Staff member created successfully'
    });
});
exports.getStaff = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const queryParams = staff_1.StaffQuerySchema.parse(req.query);
    const userRole = req.user.role;
    const { staff, total } = await staffService.getStaff(queryParams, userRole, parseInt(req.user.id));
    res.json({
        success: true,
        data: staff,
        pagination: {
            page: queryParams.page,
            limit: queryParams.limit,
            total,
            pages: Math.ceil(total / queryParams.limit)
        }
    });
});
exports.getStaffById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const staff = await staffService.getStaffById(parseInt(id), userRole, parseInt(userId));
    res.json({
        success: true,
        data: staff
    });
});
exports.updateStaff = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = staff_1.UpdateStaffSchema.parse(req.body);
    const userId = req.user.id;
    const userRole = req.user.role;
    const updatedStaff = await staffService.updateStaff(parseInt(id), updateData, userRole, parseInt(userId));
    res.json({
        success: true,
        data: updatedStaff,
        message: 'Staff member updated successfully'
    });
});
exports.deactivateStaff = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userRole = req.user.role;
    if (userRole !== 'admin') {
        throw new errorHandler_1.AppError('Only administrators can deactivate staff members', 403);
    }
    await staffService.deactivateStaff(parseInt(id));
    res.json({
        success: true,
        message: 'Staff member deactivated successfully'
    });
});
exports.reactivateStaff = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userRole = req.user.role;
    if (userRole !== 'admin') {
        throw new errorHandler_1.AppError('Only administrators can reactivate staff members', 403);
    }
    const updatedStaff = await staffService.reactivateStaff(parseInt(id));
    res.json({
        success: true,
        data: updatedStaff,
        message: 'Staff member reactivated successfully'
    });
});
exports.getStaffSummary = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userRole = req.user.role;
    if (userRole !== 'admin') {
        throw new errorHandler_1.AppError('Only administrators can view staff summary', 403);
    }
    const summary = await staffService.getStaffSummary();
    res.json({
        success: true,
        data: summary
    });
});
//# sourceMappingURL=staffController.js.map
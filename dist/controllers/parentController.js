"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParentDashboard = exports.removeParentStudentRelationship = exports.updateParentStudentRelationship = exports.linkParentToStudent = exports.getParentChildren = exports.unlinkStudentFromParent = exports.linkStudentToParent = exports.deleteParent = exports.updateParent = exports.getParentById = exports.getParents = exports.createParent = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const parentService_1 = require("../services/parentService");
const parentService = new parentService_1.ParentService();
exports.createParent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const parentData = req.body;
    const parent = await parentService.createParent(parentData);
    res.status(201).json({
        success: true,
        message: 'Parent account created successfully',
        data: parent,
    });
});
exports.getParents = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await parentService.getParents(req);
    res.json({
        success: true,
        data: result.parents,
        pagination: result.pagination,
    });
});
exports.getParentById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const parent = await parentService.getParentById(id);
    res.json({
        success: true,
        data: parent,
    });
});
exports.updateParent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const parent = await parentService.updateParent(id, updateData);
    res.json({
        success: true,
        message: 'Parent updated successfully',
        data: parent,
    });
});
exports.deleteParent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await parentService.deleteParent(id);
    res.json({
        success: true,
        message: 'Parent deleted successfully',
    });
});
exports.linkStudentToParent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const linkData = req.body;
    const relationship = await parentService.linkStudentToParent(linkData);
    res.status(201).json({
        success: true,
        message: 'Student linked to parent successfully',
        data: relationship,
    });
});
exports.unlinkStudentFromParent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { studentId, parentId } = req.params;
    await parentService.unlinkStudentFromParent(studentId, parentId);
    res.json({
        success: true,
        message: 'Student unlinked from parent successfully',
    });
});
exports.getParentChildren = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { parentId } = req.params;
    const result = await parentService.getParentChildren(parentId);
    res.json({
        success: true,
        data: result,
    });
});
exports.linkParentToStudent = exports.linkStudentToParent;
exports.updateParentStudentRelationship = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
exports.removeParentStudentRelationship = exports.unlinkStudentFromParent;
exports.getParentDashboard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
//# sourceMappingURL=parentController.js.map
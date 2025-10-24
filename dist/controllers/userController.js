"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUserById = exports.getUsers = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const userService_1 = require("../services/userService");
const userService = new userService_1.UserService();
exports.getUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    console.log('Get users request received');
    const result = await userService.getUsers(req);
    res.json({
        success: true,
        data: result.users,
        pagination: result.pagination,
    });
});
exports.getUserById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    console.log('Get user by ID request received');
    const { id } = req.params;
    console.log("Looking for user with ID:", req.params.id);
    const user = await userService.getUserById(id);
    res.json({
        success: true,
        data: user,
    });
});
exports.updateUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    console.log('Update user request received');
    const { id } = req.params;
    const updateData = req.body;
    const user = await userService.updateUser(id, updateData);
    res.json({
        success: true,
        message: 'User updated successfully',
        data: user,
    });
});
exports.deleteUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    console.log('Delete user request received');
    const { id } = req.params;
    await userService.deleteUser(id);
    res.json({
        success: true,
        message: 'User deleted successfully',
    });
});
//# sourceMappingURL=userController.js.map
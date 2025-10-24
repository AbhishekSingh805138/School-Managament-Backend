"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.getCurrentUser = exports.login = exports.register = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const authService_1 = require("../services/authService");
const authService = new authService_1.AuthService();
exports.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    console.log('Register request received');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    const userData = req.body;
    const result = await authService.register(userData);
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
    });
});
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    console.log('Login request received');
    const loginData = req.body;
    const result = await authService.login(loginData);
    res.json({
        success: true,
        message: 'Login successful',
        data: result,
    });
});
exports.getCurrentUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const user = await authService.getCurrentUser(userId);
    res.json({
        success: true,
        data: user,
    });
});
exports.getProfile = exports.getCurrentUser;
//# sourceMappingURL=authController.js.map
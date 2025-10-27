"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.logoutAll = exports.logout = exports.refreshToken = exports.getCurrentUser = exports.login = exports.register = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const authService_1 = require("../services/authService");
const authService = new authService_1.AuthService();
exports.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    console.log('Register request received');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    const userData = req.body;
    try {
        const result = await authService.register(userData);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: result,
        });
    }
    catch (error) {
        throw error;
    }
});
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    console.log('Login request received');
    const loginData = req.body;
    try {
        const result = await authService.login(loginData);
        res.json({
            success: true,
            message: 'Login successful',
            data: result,
        });
    }
    catch (error) {
        throw error;
    }
});
exports.getCurrentUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const user = await authService.getCurrentUser(userId);
    res.json({
        success: true,
        data: user,
    });
});
exports.refreshToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw new errorHandler_1.AppError('Refresh token is required', 400);
    }
    const result = await authService.refreshToken(refreshToken);
    res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: result,
    });
});
exports.logout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw new errorHandler_1.AppError('Refresh token is required', 400);
    }
    await authService.logout(refreshToken);
    res.json({
        success: true,
        message: 'Logged out successfully',
    });
});
exports.logoutAll = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    await authService.logoutAll(userId);
    res.json({
        success: true,
        message: 'Logged out from all devices successfully',
    });
});
exports.getProfile = exports.getCurrentUser;
//# sourceMappingURL=authController.js.map
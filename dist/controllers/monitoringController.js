"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testErrorTracking = exports.getCacheMetrics = exports.getDatabaseMetrics = exports.getSystemMetrics = exports.clearRequestStats = exports.getRequestStats = exports.getMonitoringDashboard = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const requestTiming_1 = require("../middleware/requestTiming");
const monitoringService_1 = require("../services/monitoringService");
const connection_1 = require("../database/connection");
const cacheService_1 = require("../services/cacheService");
const os_1 = __importDefault(require("os"));
exports.getMonitoringDashboard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userRole = req.user.role;
    if (userRole !== 'admin') {
        throw new errorHandler_1.AppError('Only administrators can view monitoring dashboard', 403);
    }
    const requestStats = (0, requestTiming_1.getRequestTimingStats)();
    const dbMetrics = (0, connection_1.getPoolMetrics)();
    const cacheStats = await cacheService_1.cacheService.getStats();
    const systemMetrics = {
        platform: os_1.default.platform(),
        arch: os_1.default.arch(),
        cpus: os_1.default.cpus().length,
        totalMemory: os_1.default.totalmem(),
        freeMemory: os_1.default.freemem(),
        usedMemory: os_1.default.totalmem() - os_1.default.freemem(),
        memoryUsagePercent: Math.round(((os_1.default.totalmem() - os_1.default.freemem()) / os_1.default.totalmem()) * 10000) / 100,
        uptime: os_1.default.uptime(),
        loadAverage: os_1.default.loadavg(),
    };
    const processMetrics = {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        version: process.version,
        nodeVersion: process.versions.node,
    };
    const monitoringStatus = {
        sentryEnabled: monitoringService_1.monitoringService.isMonitoringEnabled(),
        environment: process.env.NODE_ENV,
    };
    res.json({
        success: true,
        data: {
            requestStats,
            dbMetrics,
            cacheStats,
            systemMetrics,
            processMetrics,
            monitoringStatus,
            timestamp: new Date().toISOString(),
        },
    });
});
exports.getRequestStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userRole = req.user.role;
    if (userRole !== 'admin') {
        throw new errorHandler_1.AppError('Only administrators can view request statistics', 403);
    }
    const stats = (0, requestTiming_1.getRequestTimingStats)();
    res.json({
        success: true,
        data: stats,
    });
});
exports.clearRequestStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userRole = req.user.role;
    if (userRole !== 'admin') {
        throw new errorHandler_1.AppError('Only administrators can clear request statistics', 403);
    }
    (0, requestTiming_1.clearRequestTimings)();
    res.json({
        success: true,
        message: 'Request statistics cleared',
    });
});
exports.getSystemMetrics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userRole = req.user.role;
    if (userRole !== 'admin') {
        throw new errorHandler_1.AppError('Only administrators can view system metrics', 403);
    }
    const metrics = {
        system: {
            platform: os_1.default.platform(),
            arch: os_1.default.arch(),
            hostname: os_1.default.hostname(),
            cpus: os_1.default.cpus().map(cpu => ({
                model: cpu.model,
                speed: cpu.speed,
            })),
            totalMemory: os_1.default.totalmem(),
            freeMemory: os_1.default.freemem(),
            usedMemory: os_1.default.totalmem() - os_1.default.freemem(),
            memoryUsagePercent: Math.round(((os_1.default.totalmem() - os_1.default.freemem()) / os_1.default.totalmem()) * 10000) / 100,
            uptime: os_1.default.uptime(),
            loadAverage: os_1.default.loadavg(),
        },
        process: {
            pid: process.pid,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage(),
            version: process.version,
            versions: process.versions,
            env: process.env.NODE_ENV,
        },
    };
    res.json({
        success: true,
        data: metrics,
    });
});
exports.getDatabaseMetrics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userRole = req.user.role;
    if (userRole !== 'admin') {
        throw new errorHandler_1.AppError('Only administrators can view database metrics', 403);
    }
    const metrics = (0, connection_1.getPoolMetrics)();
    res.json({
        success: true,
        data: metrics,
    });
});
exports.getCacheMetrics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userRole = req.user.role;
    if (userRole !== 'admin') {
        throw new errorHandler_1.AppError('Only administrators can view cache metrics', 403);
    }
    const metrics = await cacheService_1.cacheService.getStats();
    res.json({
        success: true,
        data: metrics,
    });
});
exports.testErrorTracking = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userRole = req.user.role;
    if (userRole !== 'admin') {
        throw new errorHandler_1.AppError('Only administrators can test error tracking', 403);
    }
    const testError = new Error('Test error for monitoring system');
    monitoringService_1.monitoringService.captureException(testError, {
        test: true,
        userId: req.user.id,
        timestamp: new Date().toISOString(),
    });
    monitoringService_1.monitoringService.captureMessage('Test message for monitoring system', 'info', {
        test: true,
        userId: req.user.id,
    });
    res.json({
        success: true,
        message: 'Test error and message sent to monitoring system',
        sentryEnabled: monitoringService_1.monitoringService.isMonitoringEnabled(),
    });
});
//# sourceMappingURL=monitoringController.js.map
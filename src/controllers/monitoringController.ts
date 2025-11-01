import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { getRequestTimingStats, clearRequestTimings } from '../middleware/requestTiming';
import { monitoringService } from '../services/monitoringService';
import { getPoolMetrics } from '../database/connection';
import { cacheService } from '../services/cacheService';
import os from 'os';

/**
 * Get monitoring dashboard data
 */
export const getMonitoringDashboard = asyncHandler(async (req: Request, res: Response) => {
  const userRole = req.user!.role;

  // Only admins can view monitoring dashboard
  if (userRole !== 'admin') {
    throw new AppError('Only administrators can view monitoring dashboard', 403);
  }

  // Get request timing stats
  const requestStats = getRequestTimingStats();

  // Get database pool metrics
  const dbMetrics = getPoolMetrics();

  // Get cache stats
  const cacheStats = await cacheService.getStats();

  // Get system metrics
  const systemMetrics = {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    usedMemory: os.totalmem() - os.freemem(),
    memoryUsagePercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 10000) / 100,
    uptime: os.uptime(),
    loadAverage: os.loadavg(),
  };

  // Get process metrics
  const processMetrics = {
    pid: process.pid,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    version: process.version,
    nodeVersion: process.versions.node,
  };

  // Get monitoring service status
  const monitoringStatus = {
    sentryEnabled: monitoringService.isMonitoringEnabled(),
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

/**
 * Get request timing statistics
 */
export const getRequestStats = asyncHandler(async (req: Request, res: Response) => {
  const userRole = req.user!.role;

  if (userRole !== 'admin') {
    throw new AppError('Only administrators can view request statistics', 403);
  }

  const stats = getRequestTimingStats();

  res.json({
    success: true,
    data: stats,
  });
});

/**
 * Clear request timing statistics
 */
export const clearRequestStats = asyncHandler(async (req: Request, res: Response) => {
  const userRole = req.user!.role;

  if (userRole !== 'admin') {
    throw new AppError('Only administrators can clear request statistics', 403);
  }

  clearRequestTimings();

  res.json({
    success: true,
    message: 'Request statistics cleared',
  });
});

/**
 * Get system metrics
 */
export const getSystemMetrics = asyncHandler(async (req: Request, res: Response) => {
  const userRole = req.user!.role;

  if (userRole !== 'admin') {
    throw new AppError('Only administrators can view system metrics', 403);
  }

  const metrics = {
    system: {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      cpus: os.cpus().map(cpu => ({
        model: cpu.model,
        speed: cpu.speed,
      })),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      usedMemory: os.totalmem() - os.freemem(),
      memoryUsagePercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 10000) / 100,
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
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

/**
 * Get database metrics
 */
export const getDatabaseMetrics = asyncHandler(async (req: Request, res: Response) => {
  const userRole = req.user!.role;

  if (userRole !== 'admin') {
    throw new AppError('Only administrators can view database metrics', 403);
  }

  const metrics = getPoolMetrics();

  res.json({
    success: true,
    data: metrics,
  });
});

/**
 * Get cache metrics
 */
export const getCacheMetrics = asyncHandler(async (req: Request, res: Response) => {
  const userRole = req.user!.role;

  if (userRole !== 'admin') {
    throw new AppError('Only administrators can view cache metrics', 403);
  }

  const metrics = await cacheService.getStats();

  res.json({
    success: true,
    data: metrics,
  });
});

/**
 * Test error tracking
 */
export const testErrorTracking = asyncHandler(async (req: Request, res: Response) => {
  const userRole = req.user!.role;

  if (userRole !== 'admin') {
    throw new AppError('Only administrators can test error tracking', 403);
  }

  // Test error capture
  const testError = new Error('Test error for monitoring system');
  monitoringService.captureException(testError, {
    test: true,
    userId: req.user!.id,
    timestamp: new Date().toISOString(),
  });

  // Test message capture
  monitoringService.captureMessage('Test message for monitoring system', 'info', {
    test: true,
    userId: req.user!.id,
  });

  res.json({
    success: true,
    message: 'Test error and message sent to monitoring system',
    sentryEnabled: monitoringService.isMonitoringEnabled(),
  });
});

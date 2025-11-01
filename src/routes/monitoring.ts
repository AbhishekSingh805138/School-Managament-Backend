import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getMonitoringDashboard,
  getRequestStats,
  clearRequestStats,
  getSystemMetrics,
  getDatabaseMetrics,
  getCacheMetrics,
  testErrorTracking,
} from '../controllers/monitoringController';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

/**
 * @route   GET /api/v1/monitoring/dashboard
 * @desc    Get comprehensive monitoring dashboard
 * @access  Private (Admin only)
 */
router.get('/dashboard', getMonitoringDashboard);

/**
 * @route   GET /api/v1/monitoring/requests
 * @desc    Get request timing statistics
 * @access  Private (Admin only)
 */
router.get('/requests', getRequestStats);

/**
 * @route   DELETE /api/v1/monitoring/requests
 * @desc    Clear request timing statistics
 * @access  Private (Admin only)
 */
router.delete('/requests', clearRequestStats);

/**
 * @route   GET /api/v1/monitoring/system
 * @desc    Get system metrics
 * @access  Private (Admin only)
 */
router.get('/system', getSystemMetrics);

/**
 * @route   GET /api/v1/monitoring/database
 * @desc    Get database metrics
 * @access  Private (Admin only)
 */
router.get('/database', getDatabaseMetrics);

/**
 * @route   GET /api/v1/monitoring/cache
 * @desc    Get cache metrics
 * @access  Private (Admin only)
 */
router.get('/cache', getCacheMetrics);

/**
 * @route   POST /api/v1/monitoring/test-error
 * @desc    Test error tracking system
 * @access  Private (Admin only)
 */
router.post('/test-error', testErrorTracking);

export default router;

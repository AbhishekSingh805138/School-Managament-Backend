import { Router } from 'express';
import {
  healthCheck,
  healthCheckDetailed,
  readinessCheck,
  livenessCheck,
  databaseStats,
} from '../controllers/healthController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public health check endpoints (no authentication required)
router.get('/', healthCheck);
router.get('/live', livenessCheck);
router.get('/ready', readinessCheck);

// Detailed health check (requires authentication)
router.get('/detailed', authenticate, authorize('admin'), healthCheckDetailed);

// Database statistics (requires admin authentication)
router.get('/database', authenticate, authorize('admin'), databaseStats);

export default router;

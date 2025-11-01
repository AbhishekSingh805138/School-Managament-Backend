import { Router } from 'express';
import { cacheStats, clearCache } from '../middleware/caching';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All cache routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

// Get cache statistics
router.get('/stats', cacheStats);

// Clear all cache
router.post('/clear', clearCache);

export default router;

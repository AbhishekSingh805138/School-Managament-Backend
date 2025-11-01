import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cacheService';
import crypto from 'crypto';

/**
 * Generate cache key from request
 */
const generateCacheKey = (req: Request): string => {
  const userId = req.user?.id || 'anonymous';
  const path = req.path;
  const query = JSON.stringify(req.query);
  const hash = crypto.createHash('md5').update(`${path}${query}`).digest('hex');
  return `api:${userId}:${hash}`;
};

/**
 * Response caching middleware
 * Caches GET requests automatically
 */
export const cacheResponse = (ttlSeconds: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = generateCacheKey(req);

    try {
      // Try to get from cache
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        // Add cache hit header
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        return res.json(cached);
      }

      // Cache miss - intercept response
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (body: any) {
        // Cache the response
        cacheService.set(cacheKey, body, ttlSeconds).catch(err => {
          console.error('Failed to cache response:', err);
        });

        // Call original json method
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Cache invalidation middleware
 * Invalidates cache on POST, PUT, PATCH, DELETE requests
 */
export const invalidateCache = (patterns: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original send/json methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Override to invalidate after successful response
    const invalidateAfterResponse = (body: any, originalMethod: Function) => {
      // Only invalidate on successful responses (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(pattern => {
          cacheService.delPattern(pattern).catch(err => {
            console.error(`Failed to invalidate cache pattern ${pattern}:`, err);
          });
        });
      }
      return originalMethod(body);
    };

    res.json = function (body: any) {
      return invalidateAfterResponse(body, originalJson);
    };

    res.send = function (body: any) {
      return invalidateAfterResponse(body, originalSend);
    };

    next();
  };
};

/**
 * Cache statistics middleware for monitoring
 */
export const cacheStats = async (req: Request, res: Response) => {
  try {
    const stats = await cacheService.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cache statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Clear all cache endpoint
 */
export const clearCache = async (req: Request, res: Response) => {
  try {
    await cacheService.flushAll();
    res.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

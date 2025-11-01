"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCache = exports.cacheStats = exports.invalidateCache = exports.cacheResponse = void 0;
const cacheService_1 = require("../services/cacheService");
const crypto_1 = __importDefault(require("crypto"));
const generateCacheKey = (req) => {
    const userId = req.user?.id || 'anonymous';
    const path = req.path;
    const query = JSON.stringify(req.query);
    const hash = crypto_1.default.createHash('md5').update(`${path}${query}`).digest('hex');
    return `api:${userId}:${hash}`;
};
const cacheResponse = (ttlSeconds = 300) => {
    return async (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }
        const cacheKey = generateCacheKey(req);
        try {
            const cached = await cacheService_1.cacheService.get(cacheKey);
            if (cached) {
                res.setHeader('X-Cache', 'HIT');
                res.setHeader('X-Cache-Key', cacheKey);
                return res.json(cached);
            }
            res.setHeader('X-Cache', 'MISS');
            res.setHeader('X-Cache-Key', cacheKey);
            const originalJson = res.json.bind(res);
            res.json = function (body) {
                cacheService_1.cacheService.set(cacheKey, body, ttlSeconds).catch(err => {
                    console.error('Failed to cache response:', err);
                });
                return originalJson(body);
            };
            next();
        }
        catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};
exports.cacheResponse = cacheResponse;
const invalidateCache = (patterns) => {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res);
        const originalSend = res.send.bind(res);
        const invalidateAfterResponse = (body, originalMethod) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                patterns.forEach(pattern => {
                    cacheService_1.cacheService.delPattern(pattern).catch(err => {
                        console.error(`Failed to invalidate cache pattern ${pattern}:`, err);
                    });
                });
            }
            return originalMethod(body);
        };
        res.json = function (body) {
            return invalidateAfterResponse(body, originalJson);
        };
        res.send = function (body) {
            return invalidateAfterResponse(body, originalSend);
        };
        next();
    };
};
exports.invalidateCache = invalidateCache;
const cacheStats = async (req, res) => {
    try {
        const stats = await cacheService_1.cacheService.getStats();
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve cache statistics',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.cacheStats = cacheStats;
const clearCache = async (req, res) => {
    try {
        await cacheService_1.cacheService.flushAll();
        res.json({
            success: true,
            message: 'Cache cleared successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to clear cache',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.clearCache = clearCache;
//# sourceMappingURL=caching.js.map
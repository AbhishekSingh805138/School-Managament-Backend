"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearRequestTimings = exports.getRequestTimingStats = exports.requestTimingMiddleware = void 0;
const monitoringService_1 = require("../services/monitoringService");
const requestTimings = [];
const MAX_TIMINGS = 1000;
const requestTimingMiddleware = (req, res, next) => {
    const startTime = Date.now();
    const startHrTime = process.hrtime();
    const originalEnd = res.end;
    res.end = function (...args) {
        const hrDuration = process.hrtime(startHrTime);
        const duration = hrDuration[0] * 1000 + hrDuration[1] / 1000000;
        const timing = {
            method: req.method,
            path: req.path || req.url,
            duration: Math.round(duration * 100) / 100,
            statusCode: res.statusCode,
            timestamp: new Date(),
        };
        requestTimings.push(timing);
        if (requestTimings.length > MAX_TIMINGS) {
            requestTimings.shift();
        }
        if (duration > 1000) {
            console.warn(`⚠️  Slow request detected: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
            monitoringService_1.monitoringService.captureMessage(`Slow request: ${req.method} ${req.path}`, 'warning', {
                duration,
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
            });
        }
        if (duration > 5000) {
            console.error(`🐌 Very slow request: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
        }
        res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
        return originalEnd.apply(this, args);
    };
    next();
};
exports.requestTimingMiddleware = requestTimingMiddleware;
const getRequestTimingStats = () => {
    if (requestTimings.length === 0) {
        return {
            totalRequests: 0,
            averageResponseTime: 0,
            minResponseTime: 0,
            maxResponseTime: 0,
            slowRequests: 0,
            recentRequests: [],
        };
    }
    const durations = requestTimings.map(t => t.duration);
    const total = durations.reduce((sum, d) => sum + d, 0);
    const average = total / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    const slowRequests = requestTimings.filter(t => t.duration > 1000).length;
    const recentRequests = requestTimings.slice(-10).reverse();
    const slowestRequests = [...requestTimings]
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10);
    const byEndpoint = {};
    requestTimings.forEach(timing => {
        const key = `${timing.method} ${timing.path}`;
        if (!byEndpoint[key]) {
            byEndpoint[key] = { count: 0, avgDuration: 0, maxDuration: 0 };
        }
        byEndpoint[key].count++;
        byEndpoint[key].avgDuration = (byEndpoint[key].avgDuration * (byEndpoint[key].count - 1) + timing.duration) / byEndpoint[key].count;
        byEndpoint[key].maxDuration = Math.max(byEndpoint[key].maxDuration, timing.duration);
    });
    const byStatusCode = {};
    requestTimings.forEach(timing => {
        byStatusCode[timing.statusCode] = (byStatusCode[timing.statusCode] || 0) + 1;
    });
    return {
        totalRequests: requestTimings.length,
        averageResponseTime: Math.round(average * 100) / 100,
        minResponseTime: Math.round(min * 100) / 100,
        maxResponseTime: Math.round(max * 100) / 100,
        slowRequests,
        slowRequestsPercentage: Math.round((slowRequests / requestTimings.length) * 10000) / 100,
        recentRequests: recentRequests.map(r => ({
            method: r.method,
            path: r.path,
            duration: r.duration,
            statusCode: r.statusCode,
            timestamp: r.timestamp,
        })),
        slowestRequests: slowestRequests.map(r => ({
            method: r.method,
            path: r.path,
            duration: r.duration,
            statusCode: r.statusCode,
            timestamp: r.timestamp,
        })),
        byEndpoint: Object.entries(byEndpoint)
            .map(([endpoint, stats]) => ({
            endpoint,
            count: stats.count,
            avgDuration: Math.round(stats.avgDuration * 100) / 100,
            maxDuration: Math.round(stats.maxDuration * 100) / 100,
        }))
            .sort((a, b) => b.avgDuration - a.avgDuration)
            .slice(0, 20),
        byStatusCode,
    };
};
exports.getRequestTimingStats = getRequestTimingStats;
const clearRequestTimings = () => {
    requestTimings.length = 0;
};
exports.clearRequestTimings = clearRequestTimings;
//# sourceMappingURL=requestTiming.js.map
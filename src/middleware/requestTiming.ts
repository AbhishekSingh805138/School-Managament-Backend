import { Request, Response, NextFunction } from 'express';
import { monitoringService } from '../services/monitoringService';

// Store request timings
interface RequestTiming {
  method: string;
  path: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
}

const requestTimings: RequestTiming[] = [];
const MAX_TIMINGS = 1000; // Keep last 1000 requests

/**
 * Request timing middleware
 * Tracks response time for each request
 */
export const requestTimingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const startHrTime = process.hrtime();

  // Store original end function
  const originalEnd = res.end;

  // Override end function to capture timing
  res.end = function (this: Response, ...args: any[]): Response {
    // Calculate duration
    const hrDuration = process.hrtime(startHrTime);
    const duration = hrDuration[0] * 1000 + hrDuration[1] / 1000000; // Convert to milliseconds

    // Store timing
    const timing: RequestTiming = {
      method: req.method,
      path: req.path || req.url,
      duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
      statusCode: res.statusCode,
      timestamp: new Date(),
    };

    // Add to timings array
    requestTimings.push(timing);
    if (requestTimings.length > MAX_TIMINGS) {
      requestTimings.shift(); // Remove oldest
    }

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      console.warn(`⚠️  Slow request detected: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
      
      // Send to monitoring service
      monitoringService.captureMessage(
        `Slow request: ${req.method} ${req.path}`,
        'warning',
        {
          duration,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
        }
      );
    }

    // Log very slow requests (> 5 seconds)
    if (duration > 5000) {
      console.error(`🐌 Very slow request: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
    }

    // Add timing header
    res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);

    // Call original end function
    return originalEnd.apply(this, args as any);
  };

  next();
};

/**
 * Get request timing statistics
 */
export const getRequestTimingStats = () => {
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

  // Get recent requests (last 10)
  const recentRequests = requestTimings.slice(-10).reverse();

  // Get slowest requests
  const slowestRequests = [...requestTimings]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10);

  // Get requests by endpoint
  const byEndpoint: { [key: string]: { count: number; avgDuration: number; maxDuration: number } } = {};
  requestTimings.forEach(timing => {
    const key = `${timing.method} ${timing.path}`;
    if (!byEndpoint[key]) {
      byEndpoint[key] = { count: 0, avgDuration: 0, maxDuration: 0 };
    }
    byEndpoint[key].count++;
    byEndpoint[key].avgDuration = (byEndpoint[key].avgDuration * (byEndpoint[key].count - 1) + timing.duration) / byEndpoint[key].count;
    byEndpoint[key].maxDuration = Math.max(byEndpoint[key].maxDuration, timing.duration);
  });

  // Get requests by status code
  const byStatusCode: { [key: number]: number } = {};
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

/**
 * Clear request timings
 */
export const clearRequestTimings = () => {
  requestTimings.length = 0;
};

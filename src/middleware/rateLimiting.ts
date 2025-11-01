import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Request, Response } from 'express';
import env from '../config/env';
import { auditSecurity } from './auditLogger';

/**
 * Rate limiting configuration based on environment
 */
const getRateLimitConfig = () => {
  const isProduction = env.NODE_ENV === 'production';
  const isTest = env.NODE_ENV === 'test';
  
  return {
    // More restrictive in production
    windowMs: isProduction ? env.RATE_LIMIT_WINDOW_MS : 60000, // 15 min in prod, 1 min in dev
    maxRequests: isProduction ? env.RATE_LIMIT_MAX_REQUESTS : 1000, // 100 in prod, 1000 in dev
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    // Do not skip in test environment so headers are present for assertions
    skip: () => false,
  };
};

/**
 * Custom rate limit handler with detailed error response
 */
const rateLimitHandler = (req: Request, res: Response) => {
  const config = getRateLimitConfig();
  
  // Audit rate limit violation
  auditSecurity.rateLimitExceeded(req, 'general');
  
  res.status(429).json({
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED',
    retryAfter: Math.ceil(config.windowMs / 1000), // seconds
    limit: config.maxRequests,
    windowMs: config.windowMs,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });
};

/**
 * General API rate limiter
 * Applies to all API endpoints
 */
export const generalRateLimit = rateLimit({
  windowMs: getRateLimitConfig().windowMs,
  max: getRateLimitConfig().maxRequests,
  handler: rateLimitHandler,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: getRateLimitConfig().skip,
});

/**
 * Strict rate limiter for authentication endpoints
 * More restrictive to prevent brute force attacks
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 5 : 100, // 5 attempts per 15 min in production
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts from this IP, please try again later.',
      error: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: 900, // 15 minutes in seconds
      limit: env.NODE_ENV === 'production' ? 5 : 100,
      windowMs: 15 * 60 * 1000,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: env.NODE_ENV === 'test' ? () => true : () => false,
});

/**
 * Password reset rate limiter
 * Very restrictive to prevent abuse
 */
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: env.NODE_ENV === 'production' ? 3 : 50, // 3 attempts per hour in production
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts from this IP, please try again later.',
      error: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
      retryAfter: 3600, // 1 hour in seconds
      limit: env.NODE_ENV === 'production' ? 3 : 50,
      windowMs: 60 * 60 * 1000,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: env.NODE_ENV === 'test' ? () => true : () => false,
});

/**
 * Registration rate limiter
 * Moderate restrictions for new user registrations
 */
export const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: env.NODE_ENV === 'production' ? 10 : 100, // 10 registrations per hour in production
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many registration attempts from this IP, please try again later.',
      error: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
      retryAfter: 3600, // 1 hour in seconds
      limit: env.NODE_ENV === 'production' ? 10 : 100,
      windowMs: 60 * 60 * 1000,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: env.NODE_ENV === 'test' ? () => true : () => false,
});

/**
 * File upload rate limiter
 * Restrictive for file operations
 */
export const fileUploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 20 : 200, // 20 uploads per 15 min in production
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many file upload attempts from this IP, please try again later.',
      error: 'FILE_UPLOAD_RATE_LIMIT_EXCEEDED',
      retryAfter: 900, // 15 minutes in seconds
      limit: env.NODE_ENV === 'production' ? 20 : 200,
      windowMs: 15 * 60 * 1000,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: env.NODE_ENV === 'test' ? () => true : () => false,
});

/**
 * Admin operations rate limiter
 * Moderate restrictions for admin operations
 */
export const adminRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: env.NODE_ENV === 'production' ? 100 : 1000, // 100 operations per 5 min in production
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many admin operations from this IP, please try again later.',
      error: 'ADMIN_RATE_LIMIT_EXCEEDED',
      retryAfter: 300, // 5 minutes in seconds
      limit: env.NODE_ENV === 'production' ? 100 : 1000,
      windowMs: 5 * 60 * 1000,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: env.NODE_ENV === 'test' ? () => true : () => false,
});

/**
 * Slow down middleware for gradual response delays
 * Slows down responses when rate limit is approaching
 */
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: env.NODE_ENV === 'production' ? 50 : 500, // Allow 50 requests per 15 min at full speed in production
  delayMs: () => 500, // express-slow-down v2 requires function for dynamic delay
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  skip: env.NODE_ENV === 'test' ? () => true : () => false,
});

/**
 * Create a custom rate limiter with specific configuration
 */
export const createCustomRateLimit = (options: {
  windowMs: number;
  max: number;
  message: string;
  errorCode?: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message: options.message,
        error: options.errorCode || 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(options.windowMs / 1000),
        limit: options.max,
        windowMs: options.windowMs,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: env.NODE_ENV === 'test' ? () => true : () => false,
  });
};

/**
 * Rate limiter for search operations
 * Moderate restrictions to prevent search abuse
 */
export const searchRateLimit = createCustomRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: env.NODE_ENV === 'production' ? 30 : 300, // 30 searches per minute in production
  message: 'Too many search requests from this IP, please try again later.',
  errorCode: 'SEARCH_RATE_LIMIT_EXCEEDED',
});

/**
 * Rate limiter for report generation
 * Restrictive due to resource-intensive operations
 */
export const reportRateLimit = createCustomRateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: env.NODE_ENV === 'production' ? 10 : 100, // 10 reports per 10 minutes in production
  message: 'Too many report generation requests from this IP, please try again later.',
  errorCode: 'REPORT_RATE_LIMIT_EXCEEDED',
});

/**
 * Rate limiter for bulk operations
 * Very restrictive due to high resource usage
 */
export const bulkOperationRateLimit = createCustomRateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: env.NODE_ENV === 'production' ? 5 : 50, // 5 bulk operations per 30 minutes in production
  message: 'Too many bulk operations from this IP, please try again later.',
  errorCode: 'BULK_OPERATION_RATE_LIMIT_EXCEEDED',
});

/**
 * Middleware to log rate limit violations
 */
export const rateLimitLogger = (req: Request, res: Response, next: any) => {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    if (res.statusCode === 429) {
      console.warn('Rate limit exceeded:', {
        ip: req.ip,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        headers: req.headers,
      });
    }
    return originalSend.call(this, data);
  };
  
  next();
};
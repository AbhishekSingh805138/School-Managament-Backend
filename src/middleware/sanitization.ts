import { Request, Response, NextFunction } from 'express';
import { sanitizeObject, sanitizeRequestBody, FIELD_DEFINITIONS } from '../utils/sanitization';

/**
 * Middleware to sanitize all request inputs
 */
export const sanitizeInputs = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    console.error('Error in input sanitization middleware:', error);
    // Continue processing even if sanitization fails
    next();
  }
};

/**
 * Create entity-specific sanitization middleware
 */
export const createEntitySanitizer = (entityType: keyof typeof FIELD_DEFINITIONS) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body && typeof req.body === 'object') {
        const fieldDefinitions = FIELD_DEFINITIONS[entityType];
        req.body = sanitizeRequestBody(req.body, fieldDefinitions);
      }
      
      // Still sanitize other parts of the request
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
      }
      
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params);
      }
      
      next();
    } catch (error) {
      console.error(`Error in ${entityType} sanitization middleware:`, error);
      next();
    }
  };
};

/**
 * Specific sanitization middlewares for different entities
 */
export const sanitizeUser = createEntitySanitizer('user');
export const sanitizeAcademicYear = createEntitySanitizer('academicYear');
export const sanitizeSemester = createEntitySanitizer('semester');
export const sanitizeSubject = createEntitySanitizer('subject');
export const sanitizeClass = createEntitySanitizer('class');
export const sanitizeTeacher = createEntitySanitizer('teacher');

/**
 * Middleware to add security headers for XSS protection
 */
export const addSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent XSS attacks
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent content type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';");
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

/**
 * Middleware to validate content type for POST/PUT requests
 */
export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type must be application/json',
      });
    }
  }
  
  return next();
};
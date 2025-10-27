import validator from 'validator';
import { filterXSS } from 'xss';

// XSS filter configuration
const xssOptions = {
  whiteList: {}, // No HTML tags allowed
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script'],
};

/**
 * Sanitize string input to prevent XSS attacks
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove XSS attempts
  let sanitized = filterXSS(input, xssOptions);
  
  // Normalize whitespace
  sanitized = sanitized.trim();
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  return sanitized;
};

/**
 * Sanitize email input
 */
export const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') {
    return '';
  }
  
  // Basic sanitization
  let sanitized = sanitizeString(email);
  
  // Normalize email
  sanitized = validator.normalizeEmail(sanitized) || '';
  
  return sanitized;
};

/**
 * Sanitize phone number input
 */
export const sanitizePhone = (phone: string): string => {
  if (typeof phone !== 'string') {
    return '';
  }
  
  // Remove XSS and keep only digits, spaces, +, -, (, )
  let sanitized = sanitizeString(phone);
  sanitized = sanitized.replace(/[^0-9\s\+\-\(\)]/g, '');
  
  return sanitized.trim();
};

/**
 * Sanitize numeric input
 */
export const sanitizeNumber = (input: any): number | null => {
  if (typeof input === 'number') {
    return isNaN(input) ? null : input;
  }
  
  if (typeof input === 'string') {
    const sanitized = sanitizeString(input);
    const num = parseFloat(sanitized);
    return isNaN(num) ? null : num;
  }
  
  return null;
};

/**
 * Sanitize boolean input
 */
export const sanitizeBoolean = (input: any): boolean => {
  if (typeof input === 'boolean') {
    return input;
  }
  
  if (typeof input === 'string') {
    const sanitized = sanitizeString(input).toLowerCase();
    return sanitized === 'true' || sanitized === '1' || sanitized === 'yes';
  }
  
  return false;
};

/**
 * Sanitize date input
 */
export const sanitizeDate = (input: any): string | null => {
  if (!input) {
    return null;
  }
  
  if (typeof input === 'string') {
    const sanitized = sanitizeString(input);
    
    // Check if it's a valid date format
    if (validator.isISO8601(sanitized) || validator.isDate(sanitized)) {
      return sanitized;
    }
  }
  
  return null;
};

/**
 * Sanitize URL input
 */
export const sanitizeUrl = (input: string): string | null => {
  if (typeof input !== 'string') {
    return null;
  }
  
  const sanitized = sanitizeString(input);
  
  if (validator.isURL(sanitized, {
    protocols: ['http', 'https'],
    require_protocol: true,
  })) {
    return sanitized;
  }
  
  return null;
};

/**
 * Sanitize UUID input
 */
export const sanitizeUUID = (input: string): string | null => {
  if (typeof input !== 'string') {
    return null;
  }
  
  const sanitized = sanitizeString(input);
  
  if (validator.isUUID(sanitized)) {
    return sanitized;
  }
  
  return null;
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize the key as well
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeObject(value);
    }
    
    return sanitized;
  }
  
  return obj;
};

/**
 * Validate and sanitize specific field types
 */
export const sanitizeField = (value: any, fieldType: string): any => {
  switch (fieldType) {
    case 'email':
      return sanitizeEmail(value);
    case 'phone':
      return sanitizePhone(value);
    case 'number':
      return sanitizeNumber(value);
    case 'boolean':
      return sanitizeBoolean(value);
    case 'date':
      return sanitizeDate(value);
    case 'url':
      return sanitizeUrl(value);
    case 'uuid':
      return sanitizeUUID(value);
    case 'string':
    default:
      return sanitizeString(value);
  }
};

/**
 * Sanitize request body based on field definitions
 */
export const sanitizeRequestBody = (body: any, fieldDefinitions: Record<string, string>): any => {
  if (!body || typeof body !== 'object') {
    return {};
  }
  
  const sanitized: any = {};
  
  for (const [field, type] of Object.entries(fieldDefinitions)) {
    if (body.hasOwnProperty(field)) {
      sanitized[field] = sanitizeField(body[field], type);
    }
  }
  
  // Also sanitize any additional fields not in definitions
  for (const [field, value] of Object.entries(body)) {
    if (!fieldDefinitions.hasOwnProperty(field)) {
      sanitized[field] = sanitizeObject(value);
    }
  }
  
  return sanitized;
};

/**
 * Common field type definitions for different entities
 */
export const FIELD_DEFINITIONS = {
  user: {
    firstName: 'string',
    lastName: 'string',
    email: 'email',
    phone: 'phone',
    dateOfBirth: 'date',
    address: 'string',
    role: 'string',
  },
  academicYear: {
    name: 'string',
    startDate: 'date',
    endDate: 'date',
    description: 'string',
  },
  semester: {
    name: 'string',
    startDate: 'date',
    endDate: 'date',
    academicYearId: 'uuid',
  },
  subject: {
    name: 'string',
    code: 'string',
    description: 'string',
    creditHours: 'number',
  },
  class: {
    name: 'string',
    grade: 'string',
    section: 'string',
    capacity: 'number',
    room: 'string',
    academicYearId: 'uuid',
    teacherId: 'uuid',
  },
  teacher: {
    firstName: 'string',
    lastName: 'string',
    email: 'email',
    phone: 'phone',
    dateOfBirth: 'date',
    address: 'string',
    employeeId: 'string',
    qualification: 'string',
    experienceYears: 'number',
    specialization: 'string',
    joiningDate: 'date',
    salary: 'number',
  },
};
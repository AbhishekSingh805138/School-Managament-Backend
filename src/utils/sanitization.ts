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
  
  // Remove XSS attempts in HTML
  let sanitized = filterXSS(input, xssOptions);
  
  // Remove dangerous schemes and event handler tokens even in plain text
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on(?:error|load|click|focus)\b/gi, '');
  
  // Neutralize common SQL injection keywords
  sanitized = sanitized.replace(/\b(DROP\s+TABLE|UNION\s+SELECT|INSERT\s+INTO|EXEC\s+xp_cmdshell)\b/gi, '');
  // Strip common SQL comment markers and boolean operators used in injections
  sanitized = sanitized.replace(/--/g, '');
  sanitized = sanitized.replace(/\/\*|\*\//g, '');
  sanitized = sanitized.replace(/\bOR\b/gi, '');
  
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
  let sanitized = sanitizeString(email).toLowerCase();
  
  // Split local and domain
  const atIdx = sanitized.indexOf('@');
  if (atIdx === -1) return '';
  let local = sanitized.slice(0, atIdx);
  const domain = sanitized.slice(atIdx + 1);
  
  // Remove "+tag" and dots in local part (gmail-style normalization)
  const plusIdx = local.indexOf('+');
  if (plusIdx !== -1) local = local.slice(0, plusIdx);
  local = local.replace(/\./g, '');
  
  const normalized = `${local}@${domain}`;
  return validator.isEmail(normalized) ? normalized : '';
};

/**
 * Sanitize phone number input
 */
export const sanitizePhone = (phone: string): string => {
  if (typeof phone !== 'string') {
    return '';
  }
  
  // Strip HTML tags but preserve inner text (so "(555)" inside <script> is kept)
  let sanitized = phone.replace(/<[^>]*>/g, '');
  // Keep only digits, spaces, +, -, (, )
  sanitized = sanitized.replace(/[^0-9\s\+\-\(\)]/g, '');
  // Remove empty parentheses introduced by stripping
  sanitized = sanitized.replace(/\(\s*\)/g, '');
  
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
      let value = sanitizeField(body[field], type);
      // Additional normalization for certain types
      if (type === 'phone' && typeof value === 'string') {
        value = value.replace(/\s+/g, ''); // remove spaces in phone for storage
      }
      sanitized[field] = value;
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
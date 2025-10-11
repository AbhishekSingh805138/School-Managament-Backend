import { z } from 'zod';

// Common validation schemas - accepts both UUID and regular IDs
export const IdSchema = z.string().min(1, 'ID is required').refine((id) => {
  // Check if it's a valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  // Check if it's a number (for regular IDs)
  const isNumber = /^\d+$/.test(id);
  // Accept both UUID and numeric IDs
  return uuidRegex.test(id) || isNumber || id.length > 0;
}, 'Invalid ID format');

export const PaginationSchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const DateSchema = z.string().refine((date) => {
  return !isNaN(Date.parse(date));
}, 'Invalid date format');

export const EmailSchema = z.string().email('Invalid email format');

export const PhoneSchema = z.string().min(10, 'Phone number must be at least 10 characters');

// Response schemas
export const SuccessResponseSchema = z.object({
  success: z.boolean().default(true),
  message: z.string(),
  data: z.any().optional(),
});

export const ErrorResponseSchema = z.object({
  success: z.boolean().default(false),
  message: z.string(),
  error: z.string().optional(),
  details: z.any().optional(),
});

export const PaginatedResponseSchema = z.object({
  success: z.boolean().default(true),
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

// Types
export type Id = z.infer<typeof IdSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type PaginatedResponse = z.infer<typeof PaginatedResponseSchema>;

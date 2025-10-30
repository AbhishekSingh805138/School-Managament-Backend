import { z } from 'zod';
import { IdSchema, EmailSchema, PhoneSchema, DateSchema } from './common';

// User role enum
export const UserRoleSchema = z.enum(['admin', 'teacher', 'student', 'parent', 'staff']);

// User schemas
export const CreateUserSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(100, 'First name must be at most 100 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(100, 'Last name must be at most 100 characters'),
  email: EmailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: UserRoleSchema,
  phone: PhoneSchema.optional(),
  dateOfBirth: DateSchema.optional(),
  address: z.string().optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true });

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const UserResponseSchema = z.object({
  id: IdSchema,
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  role: UserRoleSchema,
  phone: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  address: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Types
export type UserRole = z.infer<typeof UserRoleSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;

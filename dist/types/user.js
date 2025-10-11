"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResponseSchema = exports.ChangePasswordSchema = exports.LoginSchema = exports.UpdateUserSchema = exports.CreateUserSchema = exports.UserRoleSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.UserRoleSchema = zod_1.z.enum(['admin', 'teacher', 'student', 'parent']);
exports.CreateUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters'),
    lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters'),
    email: common_1.EmailSchema,
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    role: exports.UserRoleSchema,
    phone: common_1.PhoneSchema.optional(),
    dateOfBirth: common_1.DateSchema.optional(),
    address: zod_1.z.string().optional(),
});
exports.UpdateUserSchema = exports.CreateUserSchema.partial().omit({ password: true });
exports.LoginSchema = zod_1.z.object({
    email: common_1.EmailSchema,
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.ChangePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: zod_1.z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
exports.UserResponseSchema = zod_1.z.object({
    id: common_1.IdSchema,
    firstName: zod_1.z.string(),
    lastName: zod_1.z.string(),
    email: zod_1.z.string(),
    role: exports.UserRoleSchema,
    phone: zod_1.z.string().nullable(),
    dateOfBirth: zod_1.z.string().nullable(),
    address: zod_1.z.string().nullable(),
    isActive: zod_1.z.boolean(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
//# sourceMappingURL=user.js.map
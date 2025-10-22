import { z } from 'zod';
export declare const UserRoleSchema: z.ZodEnum<["admin", "teacher", "student", "parent", "staff"]>;
export declare const CreateUserSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodEnum<["admin", "teacher", "student", "parent", "staff"]>;
    phone: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    address: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: "admin" | "teacher" | "student" | "parent" | "staff";
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
}, {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: "admin" | "teacher" | "student" | "parent" | "staff";
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
}>;
export declare const UpdateUserSchema: z.ZodObject<Omit<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["admin", "teacher", "student", "parent", "staff"]>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    dateOfBirth: z.ZodOptional<z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "password">, "strip", z.ZodTypeAny, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    email?: string | undefined;
    role?: "admin" | "teacher" | "student" | "parent" | "staff" | undefined;
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
}, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    email?: string | undefined;
    role?: "admin" | "teacher" | "student" | "parent" | "staff" | undefined;
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
}>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const ChangePasswordSchema: z.ZodEffects<z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}>, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}>;
export declare const UserResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    role: z.ZodEnum<["admin", "teacher", "student", "parent", "staff"]>;
    phone: z.ZodNullable<z.ZodString>;
    dateOfBirth: z.ZodNullable<z.ZodString>;
    address: z.ZodNullable<z.ZodString>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "admin" | "teacher" | "student" | "parent" | "staff";
    phone: string | null;
    dateOfBirth: string | null;
    address: string | null;
    isActive: boolean;
    updatedAt: string;
}, {
    id: string;
    createdAt: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "admin" | "teacher" | "student" | "parent" | "staff";
    phone: string | null;
    dateOfBirth: string | null;
    address: string | null;
    isActive: boolean;
    updatedAt: string;
}>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
//# sourceMappingURL=user.d.ts.map
import { z } from 'zod';
export declare const CreateClassSchema: z.ZodObject<{
    name: z.ZodString;
    grade: z.ZodString;
    section: z.ZodString;
    teacherId: z.ZodEffects<z.ZodString, string, string>;
    capacity: z.ZodNumber;
    room: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    grade: string;
    section: string;
    teacherId: string;
    capacity: number;
    room?: string | undefined;
    description?: string | undefined;
}, {
    name: string;
    grade: string;
    section: string;
    teacherId: string;
    capacity: number;
    room?: string | undefined;
    description?: string | undefined;
}>;
export declare const UpdateClassSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    grade: z.ZodOptional<z.ZodString>;
    section: z.ZodOptional<z.ZodString>;
    teacherId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    capacity: z.ZodOptional<z.ZodNumber>;
    room: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    grade?: string | undefined;
    section?: string | undefined;
    teacherId?: string | undefined;
    capacity?: number | undefined;
    room?: string | undefined;
    description?: string | undefined;
}, {
    name?: string | undefined;
    grade?: string | undefined;
    section?: string | undefined;
    teacherId?: string | undefined;
    capacity?: number | undefined;
    room?: string | undefined;
    description?: string | undefined;
}>;
export declare const ClassResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    name: z.ZodString;
    grade: z.ZodString;
    section: z.ZodString;
    teacherId: z.ZodEffects<z.ZodString, string, string>;
    capacity: z.ZodNumber;
    currentEnrollment: z.ZodNumber;
    room: z.ZodNullable<z.ZodString>;
    description: z.ZodNullable<z.ZodString>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    teacher: z.ZodOptional<z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        firstName: string;
        lastName: string;
        email: string;
    }, {
        firstName: string;
        lastName: string;
        email: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    name: string;
    grade: string;
    section: string;
    teacherId: string;
    capacity: number;
    room: string | null;
    description: string | null;
    currentEnrollment: number;
    teacher?: {
        firstName: string;
        lastName: string;
        email: string;
    } | undefined;
}, {
    id: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    name: string;
    grade: string;
    section: string;
    teacherId: string;
    capacity: number;
    room: string | null;
    description: string | null;
    currentEnrollment: number;
    teacher?: {
        firstName: string;
        lastName: string;
        email: string;
    } | undefined;
}>;
export type CreateClass = z.infer<typeof CreateClassSchema>;
export type UpdateClass = z.infer<typeof UpdateClassSchema>;
export type ClassResponse = z.infer<typeof ClassResponseSchema>;
//# sourceMappingURL=class.d.ts.map
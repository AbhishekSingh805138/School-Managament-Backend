import { z } from 'zod';
export declare const CreateStudentSchema: z.ZodObject<{
    userId: z.ZodEffects<z.ZodString, string, string>;
    studentId: z.ZodString;
    classId: z.ZodEffects<z.ZodString, string, string>;
    enrollmentDate: z.ZodEffects<z.ZodString, string, string>;
    guardianName: z.ZodString;
    guardianPhone: z.ZodString;
    guardianEmail: z.ZodOptional<z.ZodString>;
    emergencyContact: z.ZodString;
    medicalInfo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    studentId: string;
    classId: string;
    enrollmentDate: string;
    guardianName: string;
    guardianPhone: string;
    emergencyContact: string;
    guardianEmail?: string | undefined;
    medicalInfo?: string | undefined;
}, {
    userId: string;
    studentId: string;
    classId: string;
    enrollmentDate: string;
    guardianName: string;
    guardianPhone: string;
    emergencyContact: string;
    guardianEmail?: string | undefined;
    medicalInfo?: string | undefined;
}>;
export declare const UpdateStudentSchema: z.ZodObject<Omit<{
    userId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    studentId: z.ZodOptional<z.ZodString>;
    classId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    enrollmentDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    guardianName: z.ZodOptional<z.ZodString>;
    guardianPhone: z.ZodOptional<z.ZodString>;
    guardianEmail: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    emergencyContact: z.ZodOptional<z.ZodString>;
    medicalInfo: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "userId">, "strip", z.ZodTypeAny, {
    studentId?: string | undefined;
    classId?: string | undefined;
    enrollmentDate?: string | undefined;
    guardianName?: string | undefined;
    guardianPhone?: string | undefined;
    guardianEmail?: string | undefined;
    emergencyContact?: string | undefined;
    medicalInfo?: string | undefined;
}, {
    studentId?: string | undefined;
    classId?: string | undefined;
    enrollmentDate?: string | undefined;
    guardianName?: string | undefined;
    guardianPhone?: string | undefined;
    guardianEmail?: string | undefined;
    emergencyContact?: string | undefined;
    medicalInfo?: string | undefined;
}>;
export declare const StudentResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    userId: z.ZodEffects<z.ZodString, string, string>;
    studentId: z.ZodString;
    classId: z.ZodEffects<z.ZodString, string, string>;
    enrollmentDate: z.ZodString;
    guardianName: z.ZodString;
    guardianPhone: z.ZodString;
    guardianEmail: z.ZodNullable<z.ZodString>;
    emergencyContact: z.ZodString;
    medicalInfo: z.ZodNullable<z.ZodString>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    user: z.ZodOptional<z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        email: z.ZodString;
        phone: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
    }, {
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
    }>>;
    class: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        grade: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        grade: string;
    }, {
        name: string;
        grade: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    userId: string;
    studentId: string;
    classId: string;
    enrollmentDate: string;
    guardianName: string;
    guardianPhone: string;
    guardianEmail: string | null;
    emergencyContact: string;
    medicalInfo: string | null;
    user?: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
    } | undefined;
    class?: {
        name: string;
        grade: string;
    } | undefined;
}, {
    id: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    userId: string;
    studentId: string;
    classId: string;
    enrollmentDate: string;
    guardianName: string;
    guardianPhone: string;
    guardianEmail: string | null;
    emergencyContact: string;
    medicalInfo: string | null;
    user?: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
    } | undefined;
    class?: {
        name: string;
        grade: string;
    } | undefined;
}>;
export type CreateStudent = z.infer<typeof CreateStudentSchema>;
export type UpdateStudent = z.infer<typeof UpdateStudentSchema>;
export type StudentResponse = z.infer<typeof StudentResponseSchema>;
//# sourceMappingURL=student.d.ts.map
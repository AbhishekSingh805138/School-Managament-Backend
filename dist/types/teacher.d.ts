import { z } from 'zod';
export declare const CreateTeacherSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    address: z.ZodOptional<z.ZodString>;
    employeeId: z.ZodString;
    qualification: z.ZodOptional<z.ZodString>;
    experienceYears: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    specialization: z.ZodOptional<z.ZodString>;
    joiningDate: z.ZodEffects<z.ZodString, string, string>;
    salary: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    employeeId: string;
    experienceYears: number;
    joiningDate: string;
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
    qualification?: string | undefined;
    specialization?: string | undefined;
    salary?: number | undefined;
}, {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    employeeId: string;
    joiningDate: string;
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
    qualification?: string | undefined;
    experienceYears?: number | undefined;
    specialization?: string | undefined;
    salary?: number | undefined;
}>;
export declare const UpdateTeacherSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    address: z.ZodOptional<z.ZodString>;
    qualification: z.ZodOptional<z.ZodString>;
    experienceYears: z.ZodOptional<z.ZodNumber>;
    specialization: z.ZodOptional<z.ZodString>;
    salary: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
    qualification?: string | undefined;
    experienceYears?: number | undefined;
    specialization?: string | undefined;
    salary?: number | undefined;
}, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
    qualification?: string | undefined;
    experienceYears?: number | undefined;
    specialization?: string | undefined;
    salary?: number | undefined;
}>;
export declare const TeacherResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    altId: z.ZodNullable<z.ZodString>;
    userId: z.ZodEffects<z.ZodString, string, string>;
    employeeId: z.ZodString;
    qualification: z.ZodNullable<z.ZodString>;
    experienceYears: z.ZodNumber;
    specialization: z.ZodNullable<z.ZodString>;
    joiningDate: z.ZodString;
    salary: z.ZodNullable<z.ZodNumber>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    user: z.ZodOptional<z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        email: z.ZodString;
        phone: z.ZodNullable<z.ZodString>;
        dateOfBirth: z.ZodNullable<z.ZodString>;
        address: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        dateOfBirth: string | null;
        address: string | null;
    }, {
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        dateOfBirth: string | null;
        address: string | null;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    altId: string | null;
    employeeId: string;
    qualification: string | null;
    experienceYears: number;
    specialization: string | null;
    joiningDate: string;
    salary: number | null;
    user?: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        dateOfBirth: string | null;
        address: string | null;
    } | undefined;
}, {
    id: string;
    userId: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    altId: string | null;
    employeeId: string;
    qualification: string | null;
    experienceYears: number;
    specialization: string | null;
    joiningDate: string;
    salary: number | null;
    user?: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        dateOfBirth: string | null;
        address: string | null;
    } | undefined;
}>;
export declare const CreateTeacherSubjectSchema: z.ZodObject<{
    teacherId: z.ZodEffects<z.ZodString, string, string>;
    subjectId: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    subjectId: string;
    teacherId: string;
}, {
    subjectId: string;
    teacherId: string;
}>;
export declare const TeacherSubjectResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    teacherId: z.ZodEffects<z.ZodString, string, string>;
    subjectId: z.ZodEffects<z.ZodString, string, string>;
    createdAt: z.ZodString;
    teacher: z.ZodOptional<z.ZodObject<{
        employeeId: z.ZodString;
        user: z.ZodObject<{
            firstName: z.ZodString;
            lastName: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            firstName: string;
            lastName: string;
        }, {
            firstName: string;
            lastName: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        user: {
            firstName: string;
            lastName: string;
        };
        employeeId: string;
    }, {
        user: {
            firstName: string;
            lastName: string;
        };
        employeeId: string;
    }>>;
    subject: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        code: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        code: string;
        name: string;
    }, {
        code: string;
        name: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    subjectId: string;
    teacherId: string;
    teacher?: {
        user: {
            firstName: string;
            lastName: string;
        };
        employeeId: string;
    } | undefined;
    subject?: {
        code: string;
        name: string;
    } | undefined;
}, {
    id: string;
    createdAt: string;
    subjectId: string;
    teacherId: string;
    teacher?: {
        user: {
            firstName: string;
            lastName: string;
        };
        employeeId: string;
    } | undefined;
    subject?: {
        code: string;
        name: string;
    } | undefined;
}>;
export declare const TeacherAssignmentSchema: z.ZodObject<{
    teacherId: z.ZodEffects<z.ZodString, string, string>;
    classId: z.ZodEffects<z.ZodString, string, string>;
    subjectId: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    classId: string;
    subjectId: string;
    teacherId: string;
}, {
    classId: string;
    subjectId: string;
    teacherId: string;
}>;
export declare const TeacherWorkloadSchema: z.ZodObject<{
    teacherId: z.ZodEffects<z.ZodString, string, string>;
    totalClasses: z.ZodNumber;
    totalSubjects: z.ZodNumber;
    totalStudents: z.ZodNumber;
    weeklyHours: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    teacherId: string;
    totalStudents: number;
    totalSubjects: number;
    totalClasses: number;
    weeklyHours?: number | undefined;
}, {
    teacherId: string;
    totalStudents: number;
    totalSubjects: number;
    totalClasses: number;
    weeklyHours?: number | undefined;
}>;
export type CreateTeacher = z.infer<typeof CreateTeacherSchema>;
export type UpdateTeacher = z.infer<typeof UpdateTeacherSchema>;
export type TeacherResponse = z.infer<typeof TeacherResponseSchema>;
export type CreateTeacherSubject = z.infer<typeof CreateTeacherSubjectSchema>;
export type TeacherSubjectResponse = z.infer<typeof TeacherSubjectResponseSchema>;
export type TeacherAssignment = z.infer<typeof TeacherAssignmentSchema>;
export type TeacherWorkload = z.infer<typeof TeacherWorkloadSchema>;
//# sourceMappingURL=teacher.d.ts.map
import { z } from 'zod';
export declare const CreateAcademicYearSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodString;
    startDate: z.ZodEffects<z.ZodString, string, string>;
    endDate: z.ZodEffects<z.ZodString, string, string>;
    isActive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
}, {
    name: string;
    startDate: string;
    endDate: string;
    isActive?: boolean | undefined;
}>, {
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
}, {
    name: string;
    startDate: string;
    endDate: string;
    isActive?: boolean | undefined;
}>;
export declare const UpdateAcademicYearSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    endDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    isActive?: boolean | undefined;
}, {
    name?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    isActive?: boolean | undefined;
}>, {
    name?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    isActive?: boolean | undefined;
}, {
    name?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const AcademicYearResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    altId: z.ZodNullable<z.ZodString>;
    name: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    startDate: string;
    endDate: string;
    id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    altId: string | null;
}, {
    name: string;
    startDate: string;
    endDate: string;
    id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    altId: string | null;
}>;
export declare const CreateSemesterSchema: z.ZodEffects<z.ZodObject<{
    academicYearId: z.ZodEffects<z.ZodString, string, string>;
    name: z.ZodString;
    startDate: z.ZodEffects<z.ZodString, string, string>;
    endDate: z.ZodEffects<z.ZodString, string, string>;
    isActive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    startDate: string;
    endDate: string;
    academicYearId: string;
    isActive: boolean;
}, {
    name: string;
    startDate: string;
    endDate: string;
    academicYearId: string;
    isActive?: boolean | undefined;
}>, {
    name: string;
    startDate: string;
    endDate: string;
    academicYearId: string;
    isActive: boolean;
}, {
    name: string;
    startDate: string;
    endDate: string;
    academicYearId: string;
    isActive?: boolean | undefined;
}>;
export declare const UpdateSemesterSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    endDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    isActive?: boolean | undefined;
}, {
    name?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    isActive?: boolean | undefined;
}>, {
    name?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    isActive?: boolean | undefined;
}, {
    name?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const SemesterResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    altId: z.ZodNullable<z.ZodString>;
    academicYearId: z.ZodEffects<z.ZodString, string, string>;
    name: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    academicYear: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        startDate: z.ZodString;
        endDate: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        startDate: string;
        endDate: string;
    }, {
        name: string;
        startDate: string;
        endDate: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    startDate: string;
    endDate: string;
    academicYearId: string;
    id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    altId: string | null;
    academicYear?: {
        name: string;
        startDate: string;
        endDate: string;
    } | undefined;
}, {
    name: string;
    startDate: string;
    endDate: string;
    academicYearId: string;
    id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    altId: string | null;
    academicYear?: {
        name: string;
        startDate: string;
        endDate: string;
    } | undefined;
}>;
export declare const CreateSubjectSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    creditHours: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    creditHours: number;
    description?: string | undefined;
}, {
    code: string;
    name: string;
    description?: string | undefined;
    creditHours?: number | undefined;
}>;
export declare const UpdateSubjectSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    creditHours: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodNumber>>>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    creditHours?: number | undefined;
}, {
    code?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    creditHours?: number | undefined;
}>;
export declare const SubjectResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    altId: z.ZodNullable<z.ZodString>;
    name: z.ZodString;
    code: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    creditHours: z.ZodNumber;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    description: string | null;
    creditHours: number;
    id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    altId: string | null;
}, {
    code: string;
    name: string;
    description: string | null;
    creditHours: number;
    id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    altId: string | null;
}>;
export declare const CreateClassSubjectSchema: z.ZodObject<{
    classId: z.ZodEffects<z.ZodString, string, string>;
    subjectId: z.ZodEffects<z.ZodString, string, string>;
    teacherId: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    teacherId: string;
    classId: string;
    subjectId: string;
}, {
    teacherId: string;
    classId: string;
    subjectId: string;
}>;
export declare const ClassSubjectResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    classId: z.ZodEffects<z.ZodString, string, string>;
    subjectId: z.ZodEffects<z.ZodString, string, string>;
    teacherId: z.ZodEffects<z.ZodString, string, string>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    class: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        grade: z.ZodString;
        section: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        grade: string;
        section: string;
    }, {
        name: string;
        grade: string;
        section: string;
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
    teacher: z.ZodOptional<z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        firstName: string;
        lastName: string;
    }, {
        email: string;
        firstName: string;
        lastName: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    teacherId: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    classId: string;
    subjectId: string;
    subject?: {
        code: string;
        name: string;
    } | undefined;
    class?: {
        name: string;
        grade: string;
        section: string;
    } | undefined;
    teacher?: {
        email: string;
        firstName: string;
        lastName: string;
    } | undefined;
}, {
    teacherId: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    classId: string;
    subjectId: string;
    subject?: {
        code: string;
        name: string;
    } | undefined;
    class?: {
        name: string;
        grade: string;
        section: string;
    } | undefined;
    teacher?: {
        email: string;
        firstName: string;
        lastName: string;
    } | undefined;
}>;
export type CreateAcademicYear = z.infer<typeof CreateAcademicYearSchema>;
export type UpdateAcademicYear = z.infer<typeof UpdateAcademicYearSchema>;
export type AcademicYearResponse = z.infer<typeof AcademicYearResponseSchema>;
export type CreateSemester = z.infer<typeof CreateSemesterSchema>;
export type UpdateSemester = z.infer<typeof UpdateSemesterSchema>;
export type SemesterResponse = z.infer<typeof SemesterResponseSchema>;
export type CreateSubject = z.infer<typeof CreateSubjectSchema>;
export type UpdateSubject = z.infer<typeof UpdateSubjectSchema>;
export type SubjectResponse = z.infer<typeof SubjectResponseSchema>;
export type CreateClassSubject = z.infer<typeof CreateClassSubjectSchema>;
export type ClassSubjectResponse = z.infer<typeof ClassSubjectResponseSchema>;
//# sourceMappingURL=academic.d.ts.map
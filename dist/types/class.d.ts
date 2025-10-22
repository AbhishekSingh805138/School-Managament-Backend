import { z } from 'zod';
export declare const CreateClassSchema: z.ZodObject<{
    name: z.ZodString;
    grade: z.ZodString;
    section: z.ZodString;
    teacherId: z.ZodEffects<z.ZodString, string, string>;
    capacity: z.ZodNumber;
    academicYearId: z.ZodEffects<z.ZodString, string, string>;
    room: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    academicYearId: string;
    name: string;
    teacherId: string;
    grade: string;
    section: string;
    capacity: number;
    description?: string | undefined;
    room?: string | undefined;
}, {
    academicYearId: string;
    name: string;
    teacherId: string;
    grade: string;
    section: string;
    capacity: number;
    description?: string | undefined;
    room?: string | undefined;
}>;
export declare const UpdateClassSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    grade: z.ZodOptional<z.ZodString>;
    section: z.ZodOptional<z.ZodString>;
    teacherId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    capacity: z.ZodOptional<z.ZodNumber>;
    academicYearId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    room: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    academicYearId?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    teacherId?: string | undefined;
    grade?: string | undefined;
    section?: string | undefined;
    capacity?: number | undefined;
    room?: string | undefined;
}, {
    academicYearId?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    teacherId?: string | undefined;
    grade?: string | undefined;
    section?: string | undefined;
    capacity?: number | undefined;
    room?: string | undefined;
}>;
export declare const ClassResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    name: z.ZodString;
    grade: z.ZodString;
    section: z.ZodString;
    teacherId: z.ZodEffects<z.ZodString, string, string>;
    capacity: z.ZodNumber;
    currentEnrollment: z.ZodNumber;
    academicYearId: z.ZodEffects<z.ZodString, string, string>;
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
    academicYear: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        startDate: z.ZodString;
        endDate: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        startDate: string;
        endDate: string;
        name: string;
    }, {
        startDate: string;
        endDate: string;
        name: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    academicYearId: string;
    name: string;
    description: string | null;
    teacherId: string;
    grade: string;
    section: string;
    capacity: number;
    room: string | null;
    currentEnrollment: number;
    teacher?: {
        firstName: string;
        lastName: string;
        email: string;
    } | undefined;
    academicYear?: {
        startDate: string;
        endDate: string;
        name: string;
    } | undefined;
}, {
    id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    academicYearId: string;
    name: string;
    description: string | null;
    teacherId: string;
    grade: string;
    section: string;
    capacity: number;
    room: string | null;
    currentEnrollment: number;
    teacher?: {
        firstName: string;
        lastName: string;
        email: string;
    } | undefined;
    academicYear?: {
        startDate: string;
        endDate: string;
        name: string;
    } | undefined;
}>;
export declare const EnrollStudentSchema: z.ZodObject<{
    studentId: z.ZodEffects<z.ZodString, string, string>;
    enrollmentDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    enrollmentDate?: string | undefined;
}, {
    studentId: string;
    enrollmentDate?: string | undefined;
}>;
export declare const BulkEnrollStudentsSchema: z.ZodObject<{
    studentIds: z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">;
    enrollmentDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    studentIds: string[];
    enrollmentDate?: string | undefined;
}, {
    studentIds: string[];
    enrollmentDate?: string | undefined;
}>;
export declare const TransferStudentSchema: z.ZodObject<{
    studentId: z.ZodEffects<z.ZodString, string, string>;
    newClassId: z.ZodEffects<z.ZodString, string, string>;
    transferDate: z.ZodOptional<z.ZodString>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    newClassId: string;
    transferDate?: string | undefined;
    reason?: string | undefined;
}, {
    studentId: string;
    newClassId: string;
    transferDate?: string | undefined;
    reason?: string | undefined;
}>;
export declare const ClassRosterQuerySchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    enrollmentDateFrom: z.ZodOptional<z.ZodString>;
    enrollmentDateTo: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["firstName", "lastName", "studentId", "enrollmentDate"]>>>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    sortBy: "firstName" | "lastName" | "studentId" | "enrollmentDate";
    sortOrder: "asc" | "desc";
    isActive?: boolean | undefined;
    search?: string | undefined;
    enrollmentDateFrom?: string | undefined;
    enrollmentDateTo?: string | undefined;
}, {
    sortBy?: "firstName" | "lastName" | "studentId" | "enrollmentDate" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    isActive?: boolean | undefined;
    search?: string | undefined;
    enrollmentDateFrom?: string | undefined;
    enrollmentDateTo?: string | undefined;
}>;
export declare const UpdateClassTeacherSchema: z.ZodObject<{
    teacherId: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    teacherId: string;
}, {
    teacherId: string;
}>;
export declare const ClassTeacherAssignmentSchema: z.ZodObject<{
    teacherId: z.ZodEffects<z.ZodString, string, string>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    subjectsCount: z.ZodOptional<z.ZodNumber>;
    subjects: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    isClassTeacher: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    email: string;
    teacherId: string;
    subjects?: string[] | undefined;
    subjectsCount?: number | undefined;
    isClassTeacher?: boolean | undefined;
}, {
    firstName: string;
    lastName: string;
    email: string;
    teacherId: string;
    subjects?: string[] | undefined;
    subjectsCount?: number | undefined;
    isClassTeacher?: boolean | undefined;
}>;
export declare const ClassEnrollmentHistorySchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    studentId: z.ZodEffects<z.ZodString, string, string>;
    studentNumber: z.ZodString;
    studentName: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodNullable<z.ZodString>;
    isCurrentlyEnrolled: z.ZodBoolean;
    academicYear: z.ZodObject<{
        name: z.ZodString;
        startDate: z.ZodString;
        endDate: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        startDate: string;
        endDate: string;
        name: string;
    }, {
        startDate: string;
        endDate: string;
        name: string;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    startDate: string;
    endDate: string | null;
    studentId: string;
    academicYear: {
        startDate: string;
        endDate: string;
        name: string;
    };
    studentNumber: string;
    studentName: string;
    isCurrentlyEnrolled: boolean;
}, {
    id: string;
    startDate: string;
    endDate: string | null;
    studentId: string;
    academicYear: {
        startDate: string;
        endDate: string;
        name: string;
    };
    studentNumber: string;
    studentName: string;
    isCurrentlyEnrolled: boolean;
}>;
export declare const ClassEnrollmentHistoryQuerySchema: z.ZodObject<{
    academicYearId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
}, "strip", z.ZodTypeAny, {
    academicYearId?: string | undefined;
}, {
    academicYearId?: string | undefined;
}>;
export type CreateClass = z.infer<typeof CreateClassSchema>;
export type UpdateClass = z.infer<typeof UpdateClassSchema>;
export type ClassResponse = z.infer<typeof ClassResponseSchema>;
export type EnrollStudent = z.infer<typeof EnrollStudentSchema>;
export type BulkEnrollStudents = z.infer<typeof BulkEnrollStudentsSchema>;
export type TransferStudent = z.infer<typeof TransferStudentSchema>;
export type ClassRosterQuery = z.infer<typeof ClassRosterQuerySchema>;
export type UpdateClassTeacher = z.infer<typeof UpdateClassTeacherSchema>;
export type ClassTeacherAssignment = z.infer<typeof ClassTeacherAssignmentSchema>;
export type ClassEnrollmentHistory = z.infer<typeof ClassEnrollmentHistorySchema>;
export type ClassEnrollmentHistoryQuery = z.infer<typeof ClassEnrollmentHistoryQuerySchema>;
//# sourceMappingURL=class.d.ts.map
import { z } from 'zod';
export declare const IdSchema: z.ZodEffects<z.ZodString, string, string>;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>;
    limit: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
}, {
    page?: string | undefined;
    limit?: string | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const DateSchema: z.ZodEffects<z.ZodString, string, string>;
export declare const EmailSchema: z.ZodString;
export declare const PhoneSchema: z.ZodString;
export declare const SuccessResponseSchema: z.ZodObject<{
    success: z.ZodDefault<z.ZodBoolean>;
    message: z.ZodString;
    data: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: boolean;
    data?: any;
}, {
    message: string;
    success?: boolean | undefined;
    data?: any;
}>;
export declare const ErrorResponseSchema: z.ZodObject<{
    success: z.ZodDefault<z.ZodBoolean>;
    message: z.ZodString;
    error: z.ZodOptional<z.ZodString>;
    details: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: boolean;
    error?: string | undefined;
    details?: any;
}, {
    message: string;
    error?: string | undefined;
    success?: boolean | undefined;
    details?: any;
}>;
export declare const PaginatedResponseSchema: z.ZodObject<{
    success: z.ZodDefault<z.ZodBoolean>;
    data: z.ZodArray<z.ZodAny, "many">;
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }, {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    data: any[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}, {
    data: any[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    success?: boolean | undefined;
}>;
export type Id = z.infer<typeof IdSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type PaginatedResponse = z.infer<typeof PaginatedResponseSchema>;
//# sourceMappingURL=common.d.ts.map
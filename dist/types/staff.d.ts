import { z } from 'zod';
export declare const CreateStaffSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    address: z.ZodOptional<z.ZodString>;
    employeeId: z.ZodString;
    department: z.ZodString;
    position: z.ZodString;
    joiningDate: z.ZodEffects<z.ZodString, string, string>;
    salary: z.ZodOptional<z.ZodNumber>;
    responsibilities: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    employeeId: string;
    joiningDate: string;
    department: string;
    position: string;
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
    salary?: number | undefined;
    responsibilities?: string | undefined;
}, {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    employeeId: string;
    joiningDate: string;
    department: string;
    position: string;
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
    salary?: number | undefined;
    responsibilities?: string | undefined;
}>;
export declare const UpdateStaffSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    address: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodString>;
    salary: z.ZodOptional<z.ZodNumber>;
    responsibilities: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
    salary?: number | undefined;
    department?: string | undefined;
    position?: string | undefined;
    responsibilities?: string | undefined;
}, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
    salary?: number | undefined;
    department?: string | undefined;
    position?: string | undefined;
    responsibilities?: string | undefined;
}>;
export declare const StaffResponseSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    altId: z.ZodNullable<z.ZodString>;
    userId: z.ZodEffects<z.ZodString, string, string>;
    employeeId: z.ZodString;
    department: z.ZodString;
    position: z.ZodString;
    joiningDate: z.ZodString;
    salary: z.ZodNullable<z.ZodNumber>;
    responsibilities: z.ZodNullable<z.ZodString>;
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
    joiningDate: string;
    salary: number | null;
    department: string;
    position: string;
    responsibilities: string | null;
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
    joiningDate: string;
    salary: number | null;
    department: string;
    position: string;
    responsibilities: string | null;
    user?: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        dateOfBirth: string | null;
        address: string | null;
    } | undefined;
}>;
export declare const StaffQuerySchema: z.ZodObject<{
    department: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    joiningDateFrom: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    joiningDateTo: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>;
    limit: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["firstName", "lastName", "employeeId", "department", "position", "joiningDate"]>>>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy: "firstName" | "lastName" | "employeeId" | "joiningDate" | "department" | "position";
    sortOrder: "asc" | "desc";
    isActive?: boolean | undefined;
    search?: string | undefined;
    department?: string | undefined;
    position?: string | undefined;
    joiningDateFrom?: string | undefined;
    joiningDateTo?: string | undefined;
}, {
    page?: string | undefined;
    limit?: string | undefined;
    sortBy?: "firstName" | "lastName" | "employeeId" | "joiningDate" | "department" | "position" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    isActive?: boolean | undefined;
    search?: string | undefined;
    department?: string | undefined;
    position?: string | undefined;
    joiningDateFrom?: string | undefined;
    joiningDateTo?: string | undefined;
}>;
export declare const DepartmentSummarySchema: z.ZodObject<{
    department: z.ZodString;
    totalStaff: z.ZodNumber;
    activeStaff: z.ZodNumber;
    positions: z.ZodArray<z.ZodObject<{
        position: z.ZodString;
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        position: string;
        count: number;
    }, {
        position: string;
        count: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    totalStaff: number;
    department: string;
    activeStaff: number;
    positions: {
        position: string;
        count: number;
    }[];
}, {
    totalStaff: number;
    department: string;
    activeStaff: number;
    positions: {
        position: string;
        count: number;
    }[];
}>;
export declare const StaffSummarySchema: z.ZodObject<{
    totalStaff: z.ZodNumber;
    activeStaff: z.ZodNumber;
    inactiveStaff: z.ZodNumber;
    departmentBreakdown: z.ZodArray<z.ZodObject<{
        department: z.ZodString;
        totalStaff: z.ZodNumber;
        activeStaff: z.ZodNumber;
        positions: z.ZodArray<z.ZodObject<{
            position: z.ZodString;
            count: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            position: string;
            count: number;
        }, {
            position: string;
            count: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        totalStaff: number;
        department: string;
        activeStaff: number;
        positions: {
            position: string;
            count: number;
        }[];
    }, {
        totalStaff: number;
        department: string;
        activeStaff: number;
        positions: {
            position: string;
            count: number;
        }[];
    }>, "many">;
    recentJoinings: z.ZodArray<z.ZodObject<{
        staffId: z.ZodEffects<z.ZodString, string, string>;
        name: z.ZodString;
        department: z.ZodString;
        position: z.ZodString;
        joiningDate: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        joiningDate: string;
        department: string;
        position: string;
        staffId: string;
    }, {
        name: string;
        joiningDate: string;
        department: string;
        position: string;
        staffId: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    totalStaff: number;
    activeStaff: number;
    inactiveStaff: number;
    departmentBreakdown: {
        totalStaff: number;
        department: string;
        activeStaff: number;
        positions: {
            position: string;
            count: number;
        }[];
    }[];
    recentJoinings: {
        name: string;
        joiningDate: string;
        department: string;
        position: string;
        staffId: string;
    }[];
}, {
    totalStaff: number;
    activeStaff: number;
    inactiveStaff: number;
    departmentBreakdown: {
        totalStaff: number;
        department: string;
        activeStaff: number;
        positions: {
            position: string;
            count: number;
        }[];
    }[];
    recentJoinings: {
        name: string;
        joiningDate: string;
        department: string;
        position: string;
        staffId: string;
    }[];
}>;
export declare const StaffReportQuerySchema: z.ZodObject<{
    department: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodString>;
    joiningDateFrom: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    joiningDateTo: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["department", "position", "joiningYear"]>>>;
    format: z.ZodDefault<z.ZodOptional<z.ZodEnum<["json", "csv", "pdf"]>>>;
}, "strip", z.ZodTypeAny, {
    format: "json" | "csv" | "pdf";
    groupBy: "department" | "position" | "joiningYear";
    isActive?: boolean | undefined;
    department?: string | undefined;
    position?: string | undefined;
    joiningDateFrom?: string | undefined;
    joiningDateTo?: string | undefined;
}, {
    isActive?: boolean | undefined;
    format?: "json" | "csv" | "pdf" | undefined;
    groupBy?: "department" | "position" | "joiningYear" | undefined;
    department?: string | undefined;
    position?: string | undefined;
    joiningDateFrom?: string | undefined;
    joiningDateTo?: string | undefined;
}>;
export declare const StaffReportItemSchema: z.ZodObject<{
    staffId: z.ZodEffects<z.ZodString, string, string>;
    employeeId: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    department: z.ZodString;
    position: z.ZodString;
    joiningDate: z.ZodString;
    salary: z.ZodNullable<z.ZodNumber>;
    isActive: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    email: string;
    isActive: boolean;
    name: string;
    employeeId: string;
    joiningDate: string;
    salary: number | null;
    department: string;
    position: string;
    staffId: string;
}, {
    email: string;
    isActive: boolean;
    name: string;
    employeeId: string;
    joiningDate: string;
    salary: number | null;
    department: string;
    position: string;
    staffId: string;
}>;
export declare const StaffReportSchema: z.ZodObject<{
    reportType: z.ZodString;
    generatedAt: z.ZodString;
    filters: z.ZodObject<{
        department: z.ZodNullable<z.ZodString>;
        position: z.ZodNullable<z.ZodString>;
        isActive: z.ZodNullable<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        isActive: boolean | null;
        department: string | null;
        position: string | null;
    }, {
        isActive: boolean | null;
        department: string | null;
        position: string | null;
    }>;
    data: z.ZodArray<z.ZodObject<{
        staffId: z.ZodEffects<z.ZodString, string, string>;
        employeeId: z.ZodString;
        name: z.ZodString;
        email: z.ZodString;
        department: z.ZodString;
        position: z.ZodString;
        joiningDate: z.ZodString;
        salary: z.ZodNullable<z.ZodNumber>;
        isActive: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        email: string;
        isActive: boolean;
        name: string;
        employeeId: string;
        joiningDate: string;
        salary: number | null;
        department: string;
        position: string;
        staffId: string;
    }, {
        email: string;
        isActive: boolean;
        name: string;
        employeeId: string;
        joiningDate: string;
        salary: number | null;
        department: string;
        position: string;
        staffId: string;
    }>, "many">;
    summary: z.ZodObject<{
        totalStaff: z.ZodNumber;
        activeStaff: z.ZodNumber;
        departmentCount: z.ZodNumber;
        positionCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        totalStaff: number;
        activeStaff: number;
        departmentCount: number;
        positionCount: number;
    }, {
        totalStaff: number;
        activeStaff: number;
        departmentCount: number;
        positionCount: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        email: string;
        isActive: boolean;
        name: string;
        employeeId: string;
        joiningDate: string;
        salary: number | null;
        department: string;
        position: string;
        staffId: string;
    }[];
    filters: {
        isActive: boolean | null;
        department: string | null;
        position: string | null;
    };
    reportType: string;
    generatedAt: string;
    summary: {
        totalStaff: number;
        activeStaff: number;
        departmentCount: number;
        positionCount: number;
    };
}, {
    data: {
        email: string;
        isActive: boolean;
        name: string;
        employeeId: string;
        joiningDate: string;
        salary: number | null;
        department: string;
        position: string;
        staffId: string;
    }[];
    filters: {
        isActive: boolean | null;
        department: string | null;
        position: string | null;
    };
    reportType: string;
    generatedAt: string;
    summary: {
        totalStaff: number;
        activeStaff: number;
        departmentCount: number;
        positionCount: number;
    };
}>;
export declare const CommonDepartmentsSchema: z.ZodEnum<["Administration", "Academics", "Finance", "Library", "IT", "Maintenance", "Security", "Transport", "Cafeteria", "Medical", "Sports", "Other"]>;
export declare const CommonPositionsSchema: z.ZodEnum<["Principal", "Vice Principal", "Academic Coordinator", "Librarian", "Accountant", "Clerk", "IT Administrator", "Security Guard", "Maintenance Staff", "Driver", "Cook", "Nurse", "Sports Instructor", "Counselor", "Other"]>;
export type CreateStaff = z.infer<typeof CreateStaffSchema>;
export type UpdateStaff = z.infer<typeof UpdateStaffSchema>;
export type StaffResponse = z.infer<typeof StaffResponseSchema>;
export type StaffQuery = z.infer<typeof StaffQuerySchema>;
export type DepartmentSummary = z.infer<typeof DepartmentSummarySchema>;
export type StaffSummary = z.infer<typeof StaffSummarySchema>;
export type StaffReportQuery = z.infer<typeof StaffReportQuerySchema>;
export type StaffReportItem = z.infer<typeof StaffReportItemSchema>;
export type StaffReport = z.infer<typeof StaffReportSchema>;
export type CommonDepartments = z.infer<typeof CommonDepartmentsSchema>;
export type CommonPositions = z.infer<typeof CommonPositionsSchema>;
//# sourceMappingURL=staff.d.ts.map
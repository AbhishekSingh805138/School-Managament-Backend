export declare const sanitizeString: (input: string) => string;
export declare const sanitizeEmail: (email: string) => string;
export declare const sanitizePhone: (phone: string) => string;
export declare const sanitizeNumber: (input: any) => number | null;
export declare const sanitizeBoolean: (input: any) => boolean;
export declare const sanitizeDate: (input: any) => string | null;
export declare const sanitizeUrl: (input: string) => string | null;
export declare const sanitizeUUID: (input: string) => string | null;
export declare const sanitizeObject: (obj: any) => any;
export declare const sanitizeField: (value: any, fieldType: string) => any;
export declare const sanitizeRequestBody: (body: any, fieldDefinitions: Record<string, string>) => any;
export declare const FIELD_DEFINITIONS: {
    user: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        dateOfBirth: string;
        address: string;
        role: string;
    };
    academicYear: {
        name: string;
        startDate: string;
        endDate: string;
        description: string;
    };
    semester: {
        name: string;
        startDate: string;
        endDate: string;
        academicYearId: string;
    };
    subject: {
        name: string;
        code: string;
        description: string;
        creditHours: string;
    };
    class: {
        name: string;
        grade: string;
        section: string;
        capacity: string;
        room: string;
        academicYearId: string;
        teacherId: string;
    };
    teacher: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        dateOfBirth: string;
        address: string;
        employeeId: string;
        qualification: string;
        experienceYears: string;
        specialization: string;
        joiningDate: string;
        salary: string;
    };
};
//# sourceMappingURL=sanitization.d.ts.map
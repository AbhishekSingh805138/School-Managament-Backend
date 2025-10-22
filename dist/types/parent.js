"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentQuerySchema = exports.ParentStudentDataSchema = exports.ParentAccessQuerySchema = exports.ParentDashboardSchema = exports.StudentParentResponseSchema = exports.UpdateStudentParentSchema = exports.CreateStudentParentSchema = exports.ParentResponseSchema = exports.UpdateParentSchema = exports.CreateParentSchema = exports.RelationshipTypeSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.RelationshipTypeSchema = zod_1.z.enum(['father', 'mother', 'guardian', 'other']);
exports.CreateParentSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters'),
    lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters'),
    email: common_1.EmailSchema,
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    phone: common_1.PhoneSchema.optional(),
    address: zod_1.z.string().optional(),
});
exports.UpdateParentSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters').optional(),
    lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters').optional(),
    phone: common_1.PhoneSchema.optional(),
    address: zod_1.z.string().optional(),
});
exports.ParentResponseSchema = zod_1.z.object({
    id: common_1.IdSchema,
    firstName: zod_1.z.string(),
    lastName: zod_1.z.string(),
    email: zod_1.z.string(),
    phone: zod_1.z.string().nullable(),
    address: zod_1.z.string().nullable(),
    isActive: zod_1.z.boolean(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.CreateStudentParentSchema = zod_1.z.object({
    studentId: common_1.IdSchema,
    parentUserId: common_1.IdSchema,
    relationshipType: exports.RelationshipTypeSchema,
    isPrimary: zod_1.z.boolean().optional().default(false),
});
exports.UpdateStudentParentSchema = zod_1.z.object({
    relationshipType: exports.RelationshipTypeSchema.optional(),
    isPrimary: zod_1.z.boolean().optional(),
});
exports.StudentParentResponseSchema = zod_1.z.object({
    id: common_1.IdSchema,
    studentId: common_1.IdSchema,
    parentUserId: common_1.IdSchema,
    relationshipType: exports.RelationshipTypeSchema,
    isPrimary: zod_1.z.boolean(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    student: zod_1.z.object({
        studentId: zod_1.z.string(),
        user: zod_1.z.object({
            firstName: zod_1.z.string(),
            lastName: zod_1.z.string(),
        }),
        class: zod_1.z.object({
            name: zod_1.z.string(),
            grade: zod_1.z.string(),
            section: zod_1.z.string(),
        }),
    }).optional(),
    parent: zod_1.z.object({
        firstName: zod_1.z.string(),
        lastName: zod_1.z.string(),
        email: zod_1.z.string(),
        phone: zod_1.z.string().nullable(),
    }).optional(),
});
exports.ParentDashboardSchema = zod_1.z.object({
    parentId: common_1.IdSchema,
    children: zod_1.z.array(zod_1.z.object({
        studentId: common_1.IdSchema,
        studentName: zod_1.z.string(),
        studentIdNumber: zod_1.z.string(),
        className: zod_1.z.string(),
        relationshipType: exports.RelationshipTypeSchema,
        isPrimary: zod_1.z.boolean(),
        recentAttendance: zod_1.z.object({
            percentage: zod_1.z.number(),
            lastWeekPresent: zod_1.z.number(),
            lastWeekTotal: zod_1.z.number(),
        }).optional(),
        recentGrades: zod_1.z.array(zod_1.z.object({
            subjectName: zod_1.z.string(),
            assessmentType: zod_1.z.string(),
            percentage: zod_1.z.number(),
            gradeLetter: zod_1.z.string(),
            date: zod_1.z.string(),
        })).optional(),
        feeStatus: zod_1.z.object({
            totalDue: zod_1.z.number(),
            overdue: zod_1.z.number(),
            nextDueDate: zod_1.z.string().nullable(),
        }).optional(),
    })),
    notifications: zod_1.z.array(zod_1.z.object({
        id: common_1.IdSchema,
        type: zod_1.z.enum(['attendance', 'grade', 'fee', 'announcement', 'event']),
        title: zod_1.z.string(),
        message: zod_1.z.string(),
        studentId: common_1.IdSchema.optional(),
        isRead: zod_1.z.boolean(),
        createdAt: zod_1.z.string(),
    })).optional(),
});
exports.ParentAccessQuerySchema = zod_1.z.object({
    studentId: common_1.IdSchema,
    dataType: zod_1.z.enum(['attendance', 'grades', 'fees', 'all']).optional().default('all'),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
});
exports.ParentStudentDataSchema = zod_1.z.object({
    student: zod_1.z.object({
        studentId: zod_1.z.string(),
        name: zod_1.z.string(),
        className: zod_1.z.string(),
        enrollmentDate: zod_1.z.string(),
    }),
    attendance: zod_1.z.object({
        totalDays: zod_1.z.number(),
        presentDays: zod_1.z.number(),
        percentage: zod_1.z.number(),
        recentRecords: zod_1.z.array(zod_1.z.object({
            date: zod_1.z.string(),
            status: zod_1.z.enum(['present', 'absent', 'late', 'excused']),
            subject: zod_1.z.string().nullable(),
        })),
    }).optional(),
    grades: zod_1.z.object({
        currentSemester: zod_1.z.string(),
        overallPercentage: zod_1.z.number().nullable(),
        overallGrade: zod_1.z.string().nullable(),
        subjects: zod_1.z.array(zod_1.z.object({
            subjectName: zod_1.z.string(),
            subjectCode: zod_1.z.string(),
            averagePercentage: zod_1.z.number(),
            gradeLetter: zod_1.z.string(),
            recentAssessments: zod_1.z.array(zod_1.z.object({
                assessmentType: zod_1.z.string(),
                marksObtained: zod_1.z.number(),
                totalMarks: zod_1.z.number(),
                percentage: zod_1.z.number(),
                date: zod_1.z.string(),
            })),
        })),
    }).optional(),
    fees: zod_1.z.object({
        totalFees: zod_1.z.number(),
        paidAmount: zod_1.z.number(),
        pendingAmount: zod_1.z.number(),
        overdueAmount: zod_1.z.number(),
        recentPayments: zod_1.z.array(zod_1.z.object({
            amount: zod_1.z.number(),
            paymentDate: zod_1.z.string(),
            receiptNumber: zod_1.z.string(),
            feeCategory: zod_1.z.string(),
        })),
        upcomingDues: zod_1.z.array(zod_1.z.object({
            feeCategory: zod_1.z.string(),
            amount: zod_1.z.number(),
            dueDate: zod_1.z.string(),
            status: zod_1.z.enum(['pending', 'partial', 'overdue']),
        })),
    }).optional(),
});
exports.ParentQuerySchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    hasChildren: zod_1.z.boolean().optional(),
    relationshipType: exports.RelationshipTypeSchema.optional(),
    page: zod_1.z.string().optional().default('1').transform(Number),
    limit: zod_1.z.string().optional().default('10').transform(Number),
    sortBy: zod_1.z.enum(['firstName', 'lastName', 'email', 'createdAt']).optional().default('firstName'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('asc'),
});
//# sourceMappingURL=parent.js.map
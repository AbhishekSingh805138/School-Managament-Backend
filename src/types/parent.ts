import { z } from 'zod';
import { IdSchema, EmailSchema, PhoneSchema } from './common';

// Parent-Student relationship type enum
export const RelationshipTypeSchema = z.enum(['father', 'mother', 'guardian', 'other']);

// Parent schemas (extends user creation)
export const CreateParentSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: EmailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: PhoneSchema.optional(),
  address: z.string().optional(),
});

export const UpdateParentSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  phone: PhoneSchema.optional(),
  address: z.string().optional(),
});

export const ParentResponseSchema = z.object({
  id: IdSchema,
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Student-Parent relationship schemas
export const CreateStudentParentSchema = z.object({
  studentId: IdSchema,
  parentUserId: IdSchema,
  relationshipType: RelationshipTypeSchema,
  isPrimary: z.boolean().optional().default(false),
});

export const UpdateStudentParentSchema = z.object({
  relationshipType: RelationshipTypeSchema.optional(),
  isPrimary: z.boolean().optional(),
});

export const StudentParentResponseSchema = z.object({
  id: IdSchema,
  studentId: IdSchema,
  parentUserId: IdSchema,
  relationshipType: RelationshipTypeSchema,
  isPrimary: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Relations
  student: z.object({
    studentId: z.string(),
    user: z.object({
      firstName: z.string(),
      lastName: z.string(),
    }),
    class: z.object({
      name: z.string(),
      grade: z.string(),
      section: z.string(),
    }),
  }).optional(),
  parent: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    phone: z.string().nullable(),
  }).optional(),
});

// Parent dashboard schemas
export const ParentDashboardSchema = z.object({
  parentId: IdSchema,
  children: z.array(z.object({
    studentId: IdSchema,
    studentName: z.string(),
    studentIdNumber: z.string(),
    className: z.string(),
    relationshipType: RelationshipTypeSchema,
    isPrimary: z.boolean(),
    // Recent activity summary
    recentAttendance: z.object({
      percentage: z.number(),
      lastWeekPresent: z.number(),
      lastWeekTotal: z.number(),
    }).optional(),
    recentGrades: z.array(z.object({
      subjectName: z.string(),
      assessmentType: z.string(),
      percentage: z.number(),
      gradeLetter: z.string(),
      date: z.string(),
    })).optional(),
    feeStatus: z.object({
      totalDue: z.number(),
      overdue: z.number(),
      nextDueDate: z.string().nullable(),
    }).optional(),
  })),
  notifications: z.array(z.object({
    id: IdSchema,
    type: z.enum(['attendance', 'grade', 'fee', 'announcement', 'event']),
    title: z.string(),
    message: z.string(),
    studentId: IdSchema.optional(),
    isRead: z.boolean(),
    createdAt: z.string(),
  })).optional(),
});

// Parent access schemas
export const ParentAccessQuerySchema = z.object({
  studentId: IdSchema,
  dataType: z.enum(['attendance', 'grades', 'fees', 'all']).optional().default('all'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const ParentStudentDataSchema = z.object({
  student: z.object({
    studentId: z.string(),
    name: z.string(),
    className: z.string(),
    enrollmentDate: z.string(),
  }),
  attendance: z.object({
    totalDays: z.number(),
    presentDays: z.number(),
    percentage: z.number(),
    recentRecords: z.array(z.object({
      date: z.string(),
      status: z.enum(['present', 'absent', 'late', 'excused']),
      subject: z.string().nullable(),
    })),
  }).optional(),
  grades: z.object({
    currentSemester: z.string(),
    overallPercentage: z.number().nullable(),
    overallGrade: z.string().nullable(),
    subjects: z.array(z.object({
      subjectName: z.string(),
      subjectCode: z.string(),
      averagePercentage: z.number(),
      gradeLetter: z.string(),
      recentAssessments: z.array(z.object({
        assessmentType: z.string(),
        marksObtained: z.number(),
        totalMarks: z.number(),
        percentage: z.number(),
        date: z.string(),
      })),
    })),
  }).optional(),
  fees: z.object({
    totalFees: z.number(),
    paidAmount: z.number(),
    pendingAmount: z.number(),
    overdueAmount: z.number(),
    recentPayments: z.array(z.object({
      amount: z.number(),
      paymentDate: z.string(),
      receiptNumber: z.string(),
      feeCategory: z.string(),
    })),
    upcomingDues: z.array(z.object({
      feeCategory: z.string(),
      amount: z.number(),
      dueDate: z.string(),
      status: z.enum(['pending', 'partial', 'overdue']),
    })),
  }).optional(),
});

// Parent query schemas
export const ParentQuerySchema = z.object({
  search: z.string().optional(), // Search by name, email, or phone
  hasChildren: z.boolean().optional(),
  relationshipType: RelationshipTypeSchema.optional(),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  sortBy: z.enum(['firstName', 'lastName', 'email', 'createdAt']).optional().default('firstName'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// Types
export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;

export type CreateParent = z.infer<typeof CreateParentSchema>;
export type UpdateParent = z.infer<typeof UpdateParentSchema>;
export type ParentResponse = z.infer<typeof ParentResponseSchema>;

export type CreateStudentParent = z.infer<typeof CreateStudentParentSchema>;
export type UpdateStudentParent = z.infer<typeof UpdateStudentParentSchema>;
export type StudentParentResponse = z.infer<typeof StudentParentResponseSchema>;

export type ParentDashboard = z.infer<typeof ParentDashboardSchema>;
export type ParentAccessQuery = z.infer<typeof ParentAccessQuerySchema>;
export type ParentStudentData = z.infer<typeof ParentStudentDataSchema>;

export type ParentQuery = z.infer<typeof ParentQuerySchema>;
import { z } from 'zod';
import { IdSchema } from './common';

// Grade letter enum
export const GradeLetterSchema = z.enum(['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']);

// Assessment Type schemas
export const CreateAssessmentTypeSchema = z.object({
  name: z.string().min(1, 'Assessment type name is required'),
  description: z.string().optional(),
  weightage: z.number().min(0.01, 'Weightage must be greater than 0').max(100, 'Weightage cannot exceed 100'),
});

export const UpdateAssessmentTypeSchema = CreateAssessmentTypeSchema.partial();

export const AssessmentTypeResponseSchema = z.object({
  id: IdSchema,
  altId: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  weightage: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Grade schemas
export const CreateGradeSchema = z.object({
  studentId: IdSchema,
  subjectId: IdSchema,
  assessmentTypeId: IdSchema,
  marksObtained: z.number().min(0, 'Marks obtained cannot be negative'),
  totalMarks: z.number().min(0.01, 'Total marks must be greater than 0'),
  semesterId: IdSchema,
  remarks: z.string().optional(),
}).refine((data) => data.marksObtained <= data.totalMarks, {
  message: 'Marks obtained cannot exceed total marks',
  path: ['marksObtained'],
});

export const UpdateGradeSchema = z.object({
  marksObtained: z.number().min(0, 'Marks obtained cannot be negative').optional(),
  totalMarks: z.number().min(0.01, 'Total marks must be greater than 0').optional(),
  remarks: z.string().optional(),
}).refine((data) => {
  if (data.marksObtained !== undefined && data.totalMarks !== undefined) {
    return data.marksObtained <= data.totalMarks;
  }
  return true;
}, {
  message: 'Marks obtained cannot exceed total marks',
  path: ['marksObtained'],
});

export const GradeResponseSchema = z.object({
  id: IdSchema,
  altId: z.string().nullable(),
  studentId: IdSchema,
  subjectId: IdSchema,
  assessmentTypeId: IdSchema,
  marksObtained: z.number(),
  totalMarks: z.number(),
  percentage: z.number(),
  gradeLetter: GradeLetterSchema,
  semesterId: IdSchema,
  recordedBy: IdSchema,
  remarks: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Relations
  student: z.object({
    studentId: z.string(),
    user: z.object({
      firstName: z.string(),
      lastName: z.string(),
    }),
  }).optional(),
  subject: z.object({
    name: z.string(),
    code: z.string(),
  }).optional(),
  assessmentType: z.object({
    name: z.string(),
    weightage: z.number(),
  }).optional(),
  semester: z.object({
    name: z.string(),
    academicYear: z.object({
      name: z.string(),
    }),
  }).optional(),
  recordedByUser: z.object({
    firstName: z.string(),
    lastName: z.string(),
  }).optional(),
});

// Report Card schemas
export const CreateReportCardSchema = z.object({
  studentId: IdSchema,
  semesterId: IdSchema,
  remarks: z.string().optional(),
});

export const UpdateReportCardSchema = z.object({
  remarks: z.string().optional(),
});

export const ReportCardResponseSchema = z.object({
  id: IdSchema,
  altId: z.string().nullable(),
  studentId: IdSchema,
  semesterId: IdSchema,
  overallPercentage: z.number().nullable(),
  overallGrade: GradeLetterSchema.nullable(),
  rankInClass: z.number().nullable(),
  totalStudents: z.number().nullable(),
  remarks: z.string().nullable(),
  generatedBy: IdSchema,
  generatedAt: z.string(),
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
  semester: z.object({
    name: z.string(),
    academicYear: z.object({
      name: z.string(),
    }),
  }).optional(),
  grades: z.array(z.object({
    subject: z.object({
      name: z.string(),
      code: z.string(),
    }),
    assessmentType: z.object({
      name: z.string(),
    }),
    marksObtained: z.number(),
    totalMarks: z.number(),
    percentage: z.number(),
    gradeLetter: GradeLetterSchema,
  })).optional(),
});

// Grade query schemas
export const GradeQuerySchema = z.object({
  studentId: IdSchema.optional(),
  classId: IdSchema.optional(),
  subjectId: IdSchema.optional(),
  assessmentTypeId: IdSchema.optional(),
  semesterId: IdSchema.optional(),
  minPercentage: z.number().min(0).max(100).optional(),
  maxPercentage: z.number().min(0).max(100).optional(),
  gradeLetter: GradeLetterSchema.optional(),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
});

// Grade summary schemas
export const StudentGradeSummarySchema = z.object({
  studentId: IdSchema,
  semesterId: IdSchema,
  totalSubjects: z.number(),
  averagePercentage: z.number(),
  overallGrade: GradeLetterSchema,
  rankInClass: z.number().nullable(),
  totalStudents: z.number(),
  subjectGrades: z.array(z.object({
    subjectId: IdSchema,
    subjectName: z.string(),
    subjectCode: z.string(),
    averagePercentage: z.number(),
    gradeLetter: GradeLetterSchema,
    assessments: z.array(z.object({
      assessmentType: z.string(),
      marksObtained: z.number(),
      totalMarks: z.number(),
      percentage: z.number(),
    })),
  })),
});

export const ClassGradeSummarySchema = z.object({
  classId: IdSchema,
  semesterId: IdSchema,
  className: z.string(),
  totalStudents: z.number(),
  averagePercentage: z.number(),
  topPerformer: z.object({
    studentId: IdSchema,
    studentName: z.string(),
    percentage: z.number(),
  }).nullable(),
  gradeDistribution: z.object({
    'A+': z.number(),
    'A': z.number(),
    'B+': z.number(),
    'B': z.number(),
    'C+': z.number(),
    'C': z.number(),
    'D': z.number(),
    'F': z.number(),
  }),
});

// Grade report schemas
export const GradeReportQuerySchema = z.object({
  classId: IdSchema.optional(),
  subjectId: IdSchema.optional(),
  semesterId: IdSchema,
  assessmentTypeId: IdSchema.optional(),
  groupBy: z.enum(['student', 'subject', 'class']).optional().default('student'),
  format: z.enum(['json', 'csv', 'pdf']).optional().default('json'),
});

export const GradeReportItemSchema = z.object({
  studentId: IdSchema,
  studentName: z.string(),
  className: z.string(),
  subjectName: z.string(),
  assessmentType: z.string(),
  marksObtained: z.number(),
  totalMarks: z.number(),
  percentage: z.number(),
  gradeLetter: GradeLetterSchema,
});

export const GradeReportSchema = z.object({
  reportType: z.string(),
  semesterName: z.string(),
  generatedAt: z.string(),
  data: z.array(GradeReportItemSchema),
  summary: z.object({
    totalStudents: z.number(),
    averagePercentage: z.number(),
    passPercentage: z.number(),
    gradeDistribution: z.record(z.number()),
  }),
});

// Types
export type GradeLetter = z.infer<typeof GradeLetterSchema>;

export type CreateAssessmentType = z.infer<typeof CreateAssessmentTypeSchema>;
export type UpdateAssessmentType = z.infer<typeof UpdateAssessmentTypeSchema>;
export type AssessmentTypeResponse = z.infer<typeof AssessmentTypeResponseSchema>;

export type CreateGrade = z.infer<typeof CreateGradeSchema>;
export type UpdateGrade = z.infer<typeof UpdateGradeSchema>;
export type GradeResponse = z.infer<typeof GradeResponseSchema>;

export type CreateReportCard = z.infer<typeof CreateReportCardSchema>;
export type UpdateReportCard = z.infer<typeof UpdateReportCardSchema>;
export type ReportCardResponse = z.infer<typeof ReportCardResponseSchema>;

export type GradeQuery = z.infer<typeof GradeQuerySchema>;
export type StudentGradeSummary = z.infer<typeof StudentGradeSummarySchema>;
export type ClassGradeSummary = z.infer<typeof ClassGradeSummarySchema>;

export type GradeReportQuery = z.infer<typeof GradeReportQuerySchema>;
export type GradeReportItem = z.infer<typeof GradeReportItemSchema>;
export type GradeReport = z.infer<typeof GradeReportSchema>;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradeReportSchema = exports.GradeReportItemSchema = exports.GradeReportQuerySchema = exports.ClassGradeSummarySchema = exports.StudentGradeSummarySchema = exports.GradeQuerySchema = exports.ReportCardResponseSchema = exports.UpdateReportCardSchema = exports.CreateReportCardSchema = exports.GradeResponseSchema = exports.UpdateGradeSchema = exports.CreateGradeSchema = exports.AssessmentTypeResponseSchema = exports.UpdateAssessmentTypeSchema = exports.CreateAssessmentTypeSchema = exports.GradeLetterSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.GradeLetterSchema = zod_1.z.enum(['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']);
exports.CreateAssessmentTypeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Assessment type name is required'),
    description: zod_1.z.string().optional(),
    weightage: zod_1.z.number().min(0.01, 'Weightage must be greater than 0').max(100, 'Weightage cannot exceed 100'),
});
exports.UpdateAssessmentTypeSchema = exports.CreateAssessmentTypeSchema.partial();
exports.AssessmentTypeResponseSchema = zod_1.z.object({
    id: common_1.IdSchema,
    altId: zod_1.z.string().nullable(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    weightage: zod_1.z.number(),
    isActive: zod_1.z.boolean(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.CreateGradeSchema = zod_1.z.object({
    studentId: common_1.IdSchema,
    subjectId: common_1.IdSchema,
    assessmentTypeId: common_1.IdSchema,
    marksObtained: zod_1.z.number().min(0, 'Marks obtained cannot be negative'),
    totalMarks: zod_1.z.number().min(0.01, 'Total marks must be greater than 0'),
    semesterId: common_1.IdSchema,
    remarks: zod_1.z.string().optional(),
}).refine((data) => data.marksObtained <= data.totalMarks, {
    message: 'Marks obtained cannot exceed total marks',
    path: ['marksObtained'],
});
exports.UpdateGradeSchema = zod_1.z.object({
    marksObtained: zod_1.z.number().min(0, 'Marks obtained cannot be negative').optional(),
    totalMarks: zod_1.z.number().min(0.01, 'Total marks must be greater than 0').optional(),
    remarks: zod_1.z.string().optional(),
}).refine((data) => {
    if (data.marksObtained !== undefined && data.totalMarks !== undefined) {
        return data.marksObtained <= data.totalMarks;
    }
    return true;
}, {
    message: 'Marks obtained cannot exceed total marks',
    path: ['marksObtained'],
});
exports.GradeResponseSchema = zod_1.z.object({
    id: common_1.IdSchema,
    altId: zod_1.z.string().nullable(),
    studentId: common_1.IdSchema,
    subjectId: common_1.IdSchema,
    assessmentTypeId: common_1.IdSchema,
    marksObtained: zod_1.z.number(),
    totalMarks: zod_1.z.number(),
    percentage: zod_1.z.number(),
    gradeLetter: exports.GradeLetterSchema,
    semesterId: common_1.IdSchema,
    recordedBy: common_1.IdSchema,
    remarks: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    student: zod_1.z.object({
        studentId: zod_1.z.string(),
        user: zod_1.z.object({
            firstName: zod_1.z.string(),
            lastName: zod_1.z.string(),
        }),
    }).optional(),
    subject: zod_1.z.object({
        name: zod_1.z.string(),
        code: zod_1.z.string(),
    }).optional(),
    assessmentType: zod_1.z.object({
        name: zod_1.z.string(),
        weightage: zod_1.z.number(),
    }).optional(),
    semester: zod_1.z.object({
        name: zod_1.z.string(),
        academicYear: zod_1.z.object({
            name: zod_1.z.string(),
        }),
    }).optional(),
    recordedByUser: zod_1.z.object({
        firstName: zod_1.z.string(),
        lastName: zod_1.z.string(),
    }).optional(),
});
exports.CreateReportCardSchema = zod_1.z.object({
    studentId: common_1.IdSchema,
    semesterId: common_1.IdSchema,
    remarks: zod_1.z.string().optional(),
});
exports.UpdateReportCardSchema = zod_1.z.object({
    remarks: zod_1.z.string().optional(),
});
exports.ReportCardResponseSchema = zod_1.z.object({
    id: common_1.IdSchema,
    altId: zod_1.z.string().nullable(),
    studentId: common_1.IdSchema,
    semesterId: common_1.IdSchema,
    overallPercentage: zod_1.z.number().nullable(),
    overallGrade: exports.GradeLetterSchema.nullable(),
    rankInClass: zod_1.z.number().nullable(),
    totalStudents: zod_1.z.number().nullable(),
    remarks: zod_1.z.string().nullable(),
    generatedBy: common_1.IdSchema,
    generatedAt: zod_1.z.string(),
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
    semester: zod_1.z.object({
        name: zod_1.z.string(),
        academicYear: zod_1.z.object({
            name: zod_1.z.string(),
        }),
    }).optional(),
    grades: zod_1.z.array(zod_1.z.object({
        subject: zod_1.z.object({
            name: zod_1.z.string(),
            code: zod_1.z.string(),
        }),
        assessmentType: zod_1.z.object({
            name: zod_1.z.string(),
        }),
        marksObtained: zod_1.z.number(),
        totalMarks: zod_1.z.number(),
        percentage: zod_1.z.number(),
        gradeLetter: exports.GradeLetterSchema,
    })).optional(),
});
exports.GradeQuerySchema = zod_1.z.object({
    studentId: common_1.IdSchema.optional(),
    classId: common_1.IdSchema.optional(),
    subjectId: common_1.IdSchema.optional(),
    assessmentTypeId: common_1.IdSchema.optional(),
    semesterId: common_1.IdSchema.optional(),
    minPercentage: zod_1.z.number().min(0).max(100).optional(),
    maxPercentage: zod_1.z.number().min(0).max(100).optional(),
    gradeLetter: exports.GradeLetterSchema.optional(),
    page: zod_1.z.string().optional().default('1').transform(Number),
    limit: zod_1.z.string().optional().default('10').transform(Number),
});
exports.StudentGradeSummarySchema = zod_1.z.object({
    studentId: common_1.IdSchema,
    semesterId: common_1.IdSchema,
    totalSubjects: zod_1.z.number(),
    averagePercentage: zod_1.z.number(),
    overallGrade: exports.GradeLetterSchema,
    rankInClass: zod_1.z.number().nullable(),
    totalStudents: zod_1.z.number(),
    subjectGrades: zod_1.z.array(zod_1.z.object({
        subjectId: common_1.IdSchema,
        subjectName: zod_1.z.string(),
        subjectCode: zod_1.z.string(),
        averagePercentage: zod_1.z.number(),
        gradeLetter: exports.GradeLetterSchema,
        assessments: zod_1.z.array(zod_1.z.object({
            assessmentType: zod_1.z.string(),
            marksObtained: zod_1.z.number(),
            totalMarks: zod_1.z.number(),
            percentage: zod_1.z.number(),
        })),
    })),
});
exports.ClassGradeSummarySchema = zod_1.z.object({
    classId: common_1.IdSchema,
    semesterId: common_1.IdSchema,
    className: zod_1.z.string(),
    totalStudents: zod_1.z.number(),
    averagePercentage: zod_1.z.number(),
    topPerformer: zod_1.z.object({
        studentId: common_1.IdSchema,
        studentName: zod_1.z.string(),
        percentage: zod_1.z.number(),
    }).nullable(),
    gradeDistribution: zod_1.z.object({
        'A+': zod_1.z.number(),
        'A': zod_1.z.number(),
        'B+': zod_1.z.number(),
        'B': zod_1.z.number(),
        'C+': zod_1.z.number(),
        'C': zod_1.z.number(),
        'D': zod_1.z.number(),
        'F': zod_1.z.number(),
    }),
});
exports.GradeReportQuerySchema = zod_1.z.object({
    classId: common_1.IdSchema.optional(),
    subjectId: common_1.IdSchema.optional(),
    semesterId: common_1.IdSchema,
    assessmentTypeId: common_1.IdSchema.optional(),
    groupBy: zod_1.z.enum(['student', 'subject', 'class']).optional().default('student'),
    format: zod_1.z.enum(['json', 'csv', 'pdf']).optional().default('json'),
});
exports.GradeReportItemSchema = zod_1.z.object({
    studentId: common_1.IdSchema,
    studentName: zod_1.z.string(),
    className: zod_1.z.string(),
    subjectName: zod_1.z.string(),
    assessmentType: zod_1.z.string(),
    marksObtained: zod_1.z.number(),
    totalMarks: zod_1.z.number(),
    percentage: zod_1.z.number(),
    gradeLetter: exports.GradeLetterSchema,
});
exports.GradeReportSchema = zod_1.z.object({
    reportType: zod_1.z.string(),
    semesterName: zod_1.z.string(),
    generatedAt: zod_1.z.string(),
    data: zod_1.z.array(exports.GradeReportItemSchema),
    summary: zod_1.z.object({
        totalStudents: zod_1.z.number(),
        averagePercentage: zod_1.z.number(),
        passPercentage: zod_1.z.number(),
        gradeDistribution: zod_1.z.record(zod_1.z.number()),
    }),
});
//# sourceMappingURL=grade.js.map
export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  assessmentTypeId: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  gradeLetter: string;
  semesterId: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    studentId: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  assessmentType?: AssessmentType;
}

export interface AssessmentType {
  id: string;
  name: string;
  description?: string;
  weightage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGrade {
  studentId: string;
  subjectId: string;
  assessmentTypeId: string;
  marksObtained: number;
  totalMarks: number;
  semesterId: string;
}

export interface ReportCard {
  id: string;
  studentId: string;
  semesterId: string;
  overallGrade: string;
  overallPercentage: number;
  rank?: number;
  remarks?: string;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    studentId: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  grades: Grade[];
}

export interface GradeStats {
  totalGrades: number;
  averagePercentage: number;
  topPerformers: number;
  needsImprovement: number;
}
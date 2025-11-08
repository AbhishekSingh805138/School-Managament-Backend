export interface Class {
  id: string;
  name: string;
  section: string;
  academicYearId: string;
  academicYear?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  teacherId?: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  capacity: number;
  currentStrength: number;
  subjects?: string[];
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClassFormData {
  name: string;
  section: string;
  academicYearId: string;
  teacherId?: string;
  capacity: number;
  subjects?: string[];
  description?: string;
  isActive: boolean;
}

export interface ClassFilters {
  search?: string;
  academicYearId?: string;
  teacherId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface ClassStats {
  totalClasses: number;
  activeClasses: number;
  totalStudents: number;
  averageClassSize: number;
  classesWithoutTeacher: number;
}

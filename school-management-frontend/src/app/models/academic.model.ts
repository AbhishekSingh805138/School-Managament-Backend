export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Semester {
  id: string;
  academicYearId: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  academicYear?: AcademicYear;
}

export interface CreateAcademicYear {
  name: string;
  startDate: string;
  endDate: string;
}

export interface CreateSemester {
  academicYearId: string;
  name: string;
  startDate: string;
  endDate: string;
}
import { User } from './user.model';

export interface Teacher {
  id: string;
  userId: string;
  employeeId: string;
  qualification: string;
  experience: number;
  specialization: string[];
  joiningDate: string;
  salary?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
  subjects: Subject[];
  classes: Class[];
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  creditHours: number;
  isActive: boolean;
}

export interface Class {
  id: string;
  name: string;
  grade: string;
  section: string;
  capacity: number;
  room?: string;
  description?: string;
  teacherId?: string;
  academicYearId: string;
  isActive: boolean;
}

export interface CreateTeacher {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  qualification: string;
  experience: number;
  specialization: string[];
  joiningDate: string;
  salary?: number;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
}

export interface TeacherStats {
  total: number;
  totalTeachers: number;
  activeTeachers: number;
  averageExperience: number;
  subjectsCovered: number;
}
import { User } from './user.model';

export interface Student {
  id: string;
  userId: string;
  studentId: string;
  classId: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  enrollmentDate: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  emergencyContact: string;
  medicalInfo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
  class?: {
    id: string;
    name: string;
    grade: string;
    section: string;
  };
}

export interface CreateStudent {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  classId: string;
  enrollmentDate: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  emergencyContact: string;
  medicalInfo?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
}

export interface StudentStats {
  total: number;
  totalStudents: number;
  activeStudents: number;
  newEnrollments: number;
  attendanceRate: number;
}
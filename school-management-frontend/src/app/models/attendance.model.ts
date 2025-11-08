export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  markedBy: string;
  remarks?: string;
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
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface CreateAttendance {
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface BulkAttendance {
  classId: string;
  date: string;
  attendance: {
    studentId: string;
    status: AttendanceStatus;
    remarks?: string;
  }[];
}

export interface AttendanceReport {
  studentId: string;
  studentName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
}

export interface AttendanceStats {
  present: number;
  absent: number;
  total: number;
  percentage: number;
  totalClasses: number;
  averageAttendance: number;
  presentToday: number;
  absentToday: number;
}
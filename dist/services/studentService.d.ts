import { BaseService } from './baseService';
import { CreateStudent, UpdateStudent } from '../types/student';
export declare class StudentService extends BaseService {
    createStudent(studentData: CreateStudent): Promise<{
        user: {
            firstName: any;
            lastName: any;
            email: any;
            phone: any;
            dateOfBirth: any;
            address: any;
        };
        temporaryPassword: string | undefined;
        id: any;
        altId: any;
        userId: any;
        studentId: any;
        classId: any;
        enrollmentDate: any;
        guardianName: any;
        guardianPhone: any;
        guardianEmail: any;
        emergencyContact: any;
        medicalInfo: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    getStudents(req: any): Promise<{
        students: any;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getStudentById(id: string): Promise<{
        user: {
            firstName: any;
            lastName: any;
            email: any;
            phone: any;
            dateOfBirth: any;
            address: any;
        };
        class: {
            id: any;
            name: any;
            grade: any;
            section: any;
            academicYear: any;
        };
        attendanceSummary: {
            totalDays: number;
            presentDays: number;
            absentDays: number;
            lateDays: number;
            attendancePercentage: number;
        };
        id: any;
        altId: any;
        userId: any;
        studentId: any;
        classId: any;
        enrollmentDate: any;
        guardianName: any;
        guardianPhone: any;
        guardianEmail: any;
        emergencyContact: any;
        medicalInfo: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateStudent(id: string, updateData: UpdateStudent): Promise<{
        user: {
            firstName: any;
            lastName: any;
            email: any;
            phone: any;
            dateOfBirth: any;
            address: any;
        };
        id: any;
        altId: any;
        userId: any;
        studentId: any;
        classId: any;
        enrollmentDate: any;
        guardianName: any;
        guardianPhone: any;
        guardianEmail: any;
        emergencyContact: any;
        medicalInfo: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    deleteStudent(id: string): Promise<{
        success: boolean;
    }>;
    private generateDefaultPassword;
    private transformStudentResponse;
    private transformUserResponse;
}
//# sourceMappingURL=studentService.d.ts.map
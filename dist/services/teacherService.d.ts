import { BaseService } from './baseService';
import { CreateTeacher, UpdateTeacher } from '../types/teacher';
export declare class TeacherService extends BaseService {
    createTeacher(teacherData: CreateTeacher): Promise<{
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
        employeeId: any;
        qualification: any;
        experienceYears: any;
        specialization: any;
        joiningDate: any;
        salary: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    getTeachers(req: any): Promise<{
        teachers: any;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getTeacherById(id: string): Promise<{
        user: {
            firstName: any;
            lastName: any;
            email: any;
            phone: any;
            dateOfBirth: any;
            address: any;
        };
        subjects: any;
        classes: any;
        id: any;
        altId: any;
        userId: any;
        employeeId: any;
        qualification: any;
        experienceYears: any;
        specialization: any;
        joiningDate: any;
        salary: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateTeacher(id: string, updateData: UpdateTeacher): Promise<{
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
        employeeId: any;
        qualification: any;
        experienceYears: any;
        specialization: any;
        joiningDate: any;
        salary: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    deleteTeacher(id: string): Promise<{
        success: boolean;
    }>;
    private transformTeacherResponse;
    private transformUserResponse;
    assignTeacherToSubject(teacherId: string, subjectId: string): Promise<{
        id: any;
        teacherId: any;
        subjectId: any;
        createdAt: any;
        teacher: {
            name: string;
        };
        subject: {
            name: any;
            code: any;
        };
    }>;
    removeTeacherFromSubject(teacherId: string, subjectId: string): Promise<{
        success: boolean;
    }>;
    assignTeacherToClass(teacherId: string, classId: string): Promise<{
        classId: any;
        className: any;
        grade: any;
        section: any;
        teacherId: string;
        teacherName: string;
        updatedAt: any;
    }>;
    getTeacherWorkload(id: string): Promise<{
        teacher: {
            id: any;
            name: string;
            employeeId: any;
        };
        workloadSummary: {
            totalClasses: number;
            totalSubjects: number;
            totalStudents: number;
            totalCreditHours: number;
            weeklyHours: number;
            workloadIntensity: number;
            workloadStatus: string;
            isMainClassTeacher: boolean;
            gradeDistribution: {
                [key: string]: number;
            };
        };
        mainClass: {
            id: any;
            name: any;
            grade: any;
            section: any;
            capacity: any;
            currentEnrollment: any;
            academicYear: any;
        } | null;
        specializations: any;
        teachingAssignments: any;
    }>;
    removeTeacherFromClass(classId: string): Promise<{
        success: boolean;
    }>;
    assignTeacherToClassSubject(teacherId: string, classId: string, subjectId: string): Promise<{
        id: any;
        classId: any;
        subjectId: any;
        teacherId: string;
        createdAt: any;
        teacher: {
            name: string;
        };
        class: {
            name: any;
            grade: any;
            section: any;
        };
        subject: {
            name: any;
            code: any;
        };
        updatedAt?: undefined;
    } | {
        id: any;
        classId: any;
        subjectId: any;
        teacherId: string;
        updatedAt: any;
        teacher: {
            name: string;
        };
        class: {
            name: any;
            grade: any;
            section: any;
        };
        subject: {
            name: any;
            code: any;
        };
        createdAt?: undefined;
    }>;
    removeTeacherFromClassSubject(classId: string, subjectId: string): Promise<{
        success: boolean;
    }>;
    getAllTeacherAssignments(req: any): Promise<{
        assignments: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    checkAssignmentConflicts(teacherId: string, classId: string, subjectId: string): Promise<{
        teacher: {
            id: string;
            name: string;
        };
        class: {
            id: string;
            name: any;
            grade: any;
            section: any;
        };
        subject: {
            id: string;
            name: any;
            code: any;
        };
        conflicts: string[];
        canAssign: boolean;
        workloadInfo: {
            currentAssignments: number;
            mainClasses: number;
            sameGradeAssignments: number;
            hasSpecialization: boolean;
        };
        recommendations: string[];
    }>;
    getOptimalTeacherSuggestions(classId: string, subjectId: string): Promise<{
        class: {
            id: string;
            name: any;
            grade: any;
            section: any;
        };
        subject: {
            id: string;
            name: any;
            code: any;
        };
        suggestions: any[];
        summary: {
            totalTeachers: number;
            excellentMatches: number;
            goodMatches: number;
            cautionMatches: number;
            availableTeachers: number;
        };
    }>;
    private generateAssignmentRecommendations;
}
//# sourceMappingURL=teacherService.d.ts.map
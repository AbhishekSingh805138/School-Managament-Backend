import { BaseService } from './baseService';
export declare class ClassService extends BaseService {
    createClass(classData: any): Promise<{
        academicYear: {
            id: any;
            name: any;
        };
        teacher: {
            id: any;
            name: string;
        } | null;
        id: any;
        altId: any;
        name: any;
        grade: any;
        section: any;
        teacherId: any;
        capacity: any;
        room: any;
        description: any;
        academicYearId: any;
        currentEnrollment: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    getClasses(req: any): Promise<{
        classes: any;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getClassById(id: string): Promise<{
        academicYear: {
            id: any;
            name: any;
        };
        teacher: {
            id: any;
            name: string;
        } | null;
        students: any;
        subjects: any;
        id: any;
        altId: any;
        name: any;
        grade: any;
        section: any;
        teacherId: any;
        capacity: any;
        room: any;
        description: any;
        academicYearId: any;
        currentEnrollment: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateClass(id: string, updateData: any): Promise<{
        id: any;
        altId: any;
        name: any;
        grade: any;
        section: any;
        teacherId: any;
        capacity: any;
        room: any;
        description: any;
        academicYearId: any;
        currentEnrollment: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    deleteClass(id: string): Promise<{
        success: boolean;
    }>;
    assignSubjectToClass(classId: string, subjectId: string, teacherId?: string): Promise<{
        id: any;
        classId: any;
        subjectId: any;
        teacherId: any;
        subject: {
            id: any;
            name: any;
        };
        createdAt: any;
        updatedAt: any;
    }>;
    removeSubjectFromClass(classId: string, subjectId: string): Promise<{
        success: boolean;
    }>;
    getClassStatistics(classId: string): Promise<{
        class: {
            id: any;
            altId: any;
            name: any;
            grade: any;
            section: any;
            teacherId: any;
            capacity: any;
            room: any;
            description: any;
            academicYearId: any;
            currentEnrollment: any;
            isActive: any;
            createdAt: any;
            updatedAt: any;
        };
        stats: {
            totalStudents: number;
            totalSubjects: number;
            subjectTeachers: number;
            totalAttendanceRecords: number;
            totalGrades: number;
            averagePercentage: string | null;
            currentEnrollment: any;
            capacity: any;
            occupancyRate: string;
        };
    }>;
    enrollStudentToClass(classId: string, studentId: string): Promise<{
        studentId: string;
        classId: any;
        studentName: string;
        enrollmentDate: Date;
    }>;
    bulkEnrollStudentsToClass(classId: string, studentIds: string[]): Promise<{
        classId: any;
        successfulEnrollments: {
            studentId: string;
            studentName: string;
            enrollmentDate: Date;
        }[];
        errors: {
            studentId: string;
            error: any;
        }[];
        totalEnrolled: number;
        totalErrors: number;
    }>;
    transferStudent(studentId: string, targetClassId: string): Promise<{
        studentId: string;
        studentName: string;
        fromClass: {
            id: any;
            name: any;
            grade: any;
            section: any;
        };
        toClass: {
            id: any;
            name: any;
            grade: any;
            section: any;
        };
        transferDate: Date;
    }>;
    getClassStudents(classId: string): Promise<{
        class: {
            id: any;
            altId: any;
            name: any;
            grade: any;
            section: any;
            teacherId: any;
            capacity: any;
            room: any;
            description: any;
            academicYearId: any;
            currentEnrollment: any;
            isActive: any;
            createdAt: any;
            updatedAt: any;
        };
        students: any;
        totalStudents: any;
    }>;
    getClassSubjects(classId: string): Promise<{
        class: {
            id: any;
            altId: any;
            name: any;
            grade: any;
            section: any;
            teacherId: any;
            capacity: any;
            room: any;
            description: any;
            academicYearId: any;
            currentEnrollment: any;
            isActive: any;
            createdAt: any;
            updatedAt: any;
        };
        subjects: any;
        totalSubjects: any;
    }>;
    private transformClassResponse;
}
export declare const classService: ClassService;
//# sourceMappingURL=classService.d.ts.map
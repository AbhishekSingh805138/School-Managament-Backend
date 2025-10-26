import { BaseService } from './baseService';
import { CreateSubject, UpdateSubject } from '../types/academic';
export declare class SubjectService extends BaseService {
    createSubject(subjectData: CreateSubject): Promise<{
        id: any;
        altId: any;
        name: any;
        code: any;
        description: any;
        creditHours: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    getSubjects(req: any): Promise<{
        subjects: any;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getSubjectById(id: string): Promise<{
        classes: any;
        teachers: any;
        id: any;
        altId: any;
        name: any;
        code: any;
        description: any;
        creditHours: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateSubject(id: string, updateData: UpdateSubject): Promise<{
        id: any;
        altId: any;
        name: any;
        code: any;
        description: any;
        creditHours: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    deleteSubject(id: string): Promise<{
        success: boolean;
    }>;
    toggleSubjectStatus(id: string, isActive: boolean): Promise<{
        id: any;
        altId: any;
        name: any;
        code: any;
        description: any;
        creditHours: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    getSubjectStatistics(id: string): Promise<{
        subject: {
            id: any;
            altId: any;
            name: any;
            code: any;
            description: any;
            creditHours: any;
            isActive: any;
            createdAt: any;
            updatedAt: any;
        };
        stats: {
            totalClasses: number;
            totalTeachers: number;
            totalStudents: number;
            totalGrades: number;
            averagePercentage: string | null;
        };
        gradeDistribution: any;
    }>;
    private transformSubjectResponse;
}
export declare const subjectService: SubjectService;
//# sourceMappingURL=subjectService.d.ts.map
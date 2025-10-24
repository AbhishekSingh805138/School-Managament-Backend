import { BaseService } from './baseService';
import { CreateSemester, UpdateSemester } from '../types/academic';
export declare class SemesterService extends BaseService {
    createSemester(semesterData: CreateSemester): Promise<{
        academicYear: {
            id: any;
            name: any;
        };
        id: any;
        altId: any;
        academicYearId: any;
        name: any;
        startDate: any;
        endDate: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    getSemesters(req: any): Promise<{
        semesters: any;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getSemesterById(id: string): Promise<{
        academicYear: {
            id: any;
            name: any;
        };
        id: any;
        altId: any;
        academicYearId: any;
        name: any;
        startDate: any;
        endDate: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateSemester(id: string, updateData: UpdateSemester): Promise<{
        id: any;
        altId: any;
        academicYearId: any;
        name: any;
        startDate: any;
        endDate: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    deleteSemester(id: string): Promise<{
        success: boolean;
    }>;
    getActiveSemester(academicYearId?: string): Promise<{
        academicYear: {
            id: any;
            name: any;
        };
        id: any;
        altId: any;
        academicYearId: any;
        name: any;
        startDate: any;
        endDate: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    private transformSemesterResponse;
}
//# sourceMappingURL=semesterService.d.ts.map
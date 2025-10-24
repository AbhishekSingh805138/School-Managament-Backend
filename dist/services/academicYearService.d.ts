import { BaseService } from './baseService';
import { CreateAcademicYear, UpdateAcademicYear } from '../types/academic';
export declare class AcademicYearService extends BaseService {
    createAcademicYear(academicYearData: CreateAcademicYear): Promise<{
        id: any;
        altId: any;
        name: any;
        startDate: any;
        endDate: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    getAcademicYears(req: any): Promise<{
        academicYears: any;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getAcademicYearById(id: string): Promise<{
        semesters: any;
        id: any;
        altId: any;
        name: any;
        startDate: any;
        endDate: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateAcademicYear(id: string, updateData: UpdateAcademicYear): Promise<{
        id: any;
        altId: any;
        name: any;
        startDate: any;
        endDate: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    deleteAcademicYear(id: string): Promise<{
        success: boolean;
    }>;
    getActiveAcademicYear(): Promise<{
        id: any;
        altId: any;
        name: any;
        startDate: any;
        endDate: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    private transformAcademicYearResponse;
}
//# sourceMappingURL=academicYearService.d.ts.map
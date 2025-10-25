import { CreateStaff, UpdateStaff, StaffQuery, StaffResponse, StaffSummary } from '../types/staff';
import { BaseService } from './baseService';
export declare class StaffService extends BaseService {
    createStaff(staffData: CreateStaff, adminUserId: number): Promise<StaffResponse>;
    getStaff(queryParams: StaffQuery, userRole: string, userId?: number): Promise<{
        staff: StaffResponse[];
        total: number;
    }>;
    getStaffById(staffId: number, userRole: string, userId?: number): Promise<StaffResponse>;
    updateStaff(staffId: number, updateData: UpdateStaff, userRole: string, userId?: number): Promise<StaffResponse>;
    deactivateStaff(staffId: number): Promise<void>;
    reactivateStaff(staffId: number): Promise<StaffResponse>;
    getStaffSummary(): Promise<StaffSummary>;
    private getStaffWithUser;
    private formatStaffResponse;
    private getSortColumn;
}
//# sourceMappingURL=staffService.d.ts.map
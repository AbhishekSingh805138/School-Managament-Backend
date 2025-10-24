import { BaseService } from './baseService';
import { UpdateUser } from '../types/user';
export declare class UserService extends BaseService {
    getUsers(req: any): Promise<{
        users: any;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getUserById(id: string): Promise<{
        id: any;
        firstName: any;
        lastName: any;
        email: any;
        role: any;
        phone: any;
        dateOfBirth: any;
        address: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateUser(id: string, updateData: UpdateUser): Promise<{
        id: any;
        firstName: any;
        lastName: any;
        email: any;
        role: any;
        phone: any;
        dateOfBirth: any;
        address: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    deleteUser(id: string): Promise<{
        success: boolean;
    }>;
    private transformUserResponse;
}
//# sourceMappingURL=userService.d.ts.map
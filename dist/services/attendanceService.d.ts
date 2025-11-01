import { BaseService } from './baseService';
import { CreateAttendance, UpdateAttendance, CreateBulkAttendance } from '../types/attendance';
export declare class AttendanceService extends BaseService {
    markAttendance(attendanceData: CreateAttendance, markedBy: string): Promise<{
        student: {
            id: any;
            studentId: any;
            name: string;
        };
        class: {
            id: any;
            name: any;
            grade: any;
            section: any;
        };
        id: any;
        studentId: any;
        classId: any;
        subjectId: any;
        date: any;
        status: any;
        markedBy: any;
        remarks: any;
        createdAt: any;
        updatedAt: any;
    }>;
    markBulkAttendance(bulkData: CreateBulkAttendance, markedBy: string): Promise<{
        classId: string;
        date: string;
        subjectId: string | undefined;
        totalRecords: number;
        records: {
            student: {
                id: any;
                studentId: any;
                name: string;
            };
            id: any;
            studentId: any;
            classId: any;
            subjectId: any;
            date: any;
            status: any;
            markedBy: any;
            remarks: any;
            createdAt: any;
            updatedAt: any;
        }[];
    }>;
    getAttendance(req: any): Promise<{
        attendance: any;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    private executeAttendanceQuery;
    getAttendanceById(id: string): Promise<{
        student: {
            id: any;
            studentId: any;
            name: string;
        };
        class: {
            id: any;
            name: any;
            grade: any;
            section: any;
        };
        subject: {
            id: any;
            name: any;
            code: any;
        } | null;
        markedBy: {
            name: string;
        } | null;
        id: any;
        studentId: any;
        classId: any;
        subjectId: any;
        date: any;
        status: any;
        remarks: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateAttendance(id: string, updateData: UpdateAttendance): Promise<{
        id: any;
        studentId: any;
        classId: any;
        subjectId: any;
        date: any;
        status: any;
        markedBy: any;
        remarks: any;
        createdAt: any;
        updatedAt: any;
    }>;
    deleteAttendance(id: string): Promise<{
        success: boolean;
    }>;
    getStudentAttendanceSummary(studentId: string, startDate?: string, endDate?: string): Promise<{
        totalDays: number;
        presentDays: number;
        absentDays: number;
        lateDays: number;
        excusedDays: number;
        attendancePercentage: number;
    }>;
    private transformAttendanceResponse;
}
//# sourceMappingURL=attendanceService.d.ts.map
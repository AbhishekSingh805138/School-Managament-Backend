import { BaseService } from './baseService';
import { AttendanceReportQuery, ReportResponse } from '../types/report';
export declare class AttendanceReportService extends BaseService {
    generateAttendanceReport(reportQuery: AttendanceReportQuery, userId: string, userRole: string): Promise<ReportResponse>;
    getAttendanceTrends(filters: any, userId: string, userRole: string): Promise<{
        trends: any;
        lowAttendanceAlerts: any;
        dayPatterns: any;
    }>;
    getAttendanceStatistics(period: string, userId: string, userRole: string): Promise<{
        period: string;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        overview: {
            totalStudents: number;
            totalClasses: number;
            totalRecords: number;
            presentCount: number;
            absentCount: number;
            lateCount: number;
            excusedCount: number;
            overallAttendancePercentage: number;
        };
        topPerformingClasses: any;
        recentActivities: any;
    }>;
    exportAttendanceData(format: string, reportQuery: any, userId: string, userRole: string): Promise<{
        data: any[];
        exportInfo: {
            format: string;
            recordCount: number;
            generatedAt: string;
        };
        csvData?: undefined;
        filename?: undefined;
        mimeType?: undefined;
    } | {
        csvData: string;
        filename: string;
        mimeType: string;
        data?: undefined;
        exportInfo?: undefined;
    }>;
    private addAuthorizationFilters;
    private addOptionalFilters;
    private generateStudentAttendanceReport;
    private generateClassAttendanceReport;
    private generateDateAttendanceReport;
    private generateSubjectAttendanceReport;
    private calculateAttendanceSummary;
    private calculateDateRange;
    private getLowAttendanceAlerts;
    private getDayPatterns;
    private getOverallStats;
    private getClassStats;
    private getRecentActivities;
    private generateSimpleAttendanceExport;
    private convertToCSV;
}
//# sourceMappingURL=attendanceReportService.d.ts.map
import { ExportResult } from './reportExportService';
import { CreateScheduledReport, UpdateScheduledReport, ScheduledReportResponse, ReportFrequency, ReportType } from '../types/report';
export declare class ScheduledReportService {
    private static instance;
    private scheduledJobs;
    private constructor();
    static getInstance(): ScheduledReportService;
    createScheduledReport(reportData: CreateScheduledReport, createdBy: string): Promise<ScheduledReportResponse>;
    getScheduledReports(filters: ScheduledReportFilters, userId: string, userRole: string): Promise<{
        reports: ScheduledReportResponse[];
        total: number;
    }>;
    getScheduledReportById(id: string, userId: string, userRole: string): Promise<ScheduledReportResponse | null>;
    updateScheduledReport(id: string, updateData: UpdateScheduledReport, userId: string, userRole: string): Promise<ScheduledReportResponse>;
    deleteScheduledReport(id: string, userId: string, userRole: string): Promise<void>;
    executeScheduledReport(id: string, userId: string, userRole: string): Promise<ExportResult>;
    private initializeScheduledReports;
    private scheduleReport;
    private unscheduleReport;
    private generateAndSendReport;
    private generateReportData;
    private getCronExpression;
    private calculateNextRunDate;
    private updateReportRunDates;
    private logReportExecution;
    private logReportError;
    private formatScheduledReportResponse;
}
export interface ScheduledReportFilters {
    reportType?: ReportType;
    frequency?: ReportFrequency;
    isActive?: boolean;
    page: number;
    limit: number;
}
export declare const scheduledReportService: ScheduledReportService;
//# sourceMappingURL=scheduledReportService.d.ts.map
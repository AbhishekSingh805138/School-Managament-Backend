import { BaseService } from './baseService';
import { FeeReportQuery, FeeReport } from '../types/fee';
export declare class FeeReportService extends BaseService {
    generateFeeCollectionReport(reportQuery: FeeReportQuery, userId: string, userRole: string): Promise<FeeReport>;
    getOutstandingDuesReport(filters: any, userId: string, userRole: string): Promise<{
        summary: {
            totalStudents: any;
            totalOutstandingAmount: any;
            averageOutstanding: number;
            criticalOverdue: any;
        };
        outstandingDues: any;
        generatedAt: string;
        filters: {
            classId: any;
            feeCategoryId: any;
            daysOverdue: number;
        };
    }>;
    getFeeDefaultersReport(filters: any, userId: string, userRole: string): Promise<{
        summary: {
            totalDefaulters: any;
            totalOutstandingAmount: any;
            averageOutstanding: number;
            highRiskDefaulters: any;
        };
        defaulters: any;
        generatedAt: string;
        criteria: {
            minOutstandingAmount: number;
            minDaysOverdue: number;
        };
    }>;
    getPaymentAnalysisReport(filters: any, userId: string, userRole: string): Promise<{
        period: any;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        overview: {
            totalPayments: number;
            totalAmount: number;
            averagePayment: number;
            uniqueStudents: number;
            feeCategoriesPaid: number;
        };
        trends: any;
        paymentMethods: any;
        categoryPerformance: any;
        generatedAt: string;
    }>;
    exportFeeReportData(format: string, reportType: string, filters: any, userId: string): Promise<{
        data: any[];
        exportInfo: {
            format: string;
            reportType: string;
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
    private generateStudentFeeReport;
    private generateClassFeeReport;
    private generateCategoryFeeReport;
    private generateDateFeeReport;
    private calculateFeeSummary;
    private calculateDateRange;
    private getPaymentTrends;
    private getPaymentMethodAnalysis;
    private getCategoryPerformance;
    private getOverallPaymentStats;
    private generateCollectionExportData;
    private generateOutstandingExportData;
    private generateDefaultersExportData;
    private convertToCSV;
}
//# sourceMappingURL=feeReportService.d.ts.map
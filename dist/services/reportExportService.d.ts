import { ReportResponse, ReportFormat } from '../types/report';
export declare class ReportExportService {
    private static instance;
    private constructor();
    static getInstance(): ReportExportService;
    exportReport(reportData: ReportResponse, format: ReportFormat, options?: ExportOptions): Promise<ExportResult>;
    private exportToPDF;
    private exportToExcel;
    private exportToCSV;
    emailReport(exportResult: ExportResult, recipients: string[], reportData: ReportResponse, customMessage?: string): Promise<void>;
    private generateReportHTML;
    private generateSummaryHTML;
    private generateDataTableHTML;
    private generateChartsHTML;
    private getPDFStyles;
    private generatePDFHeader;
    private generatePDFFooter;
    private addExcelHeader;
    private addExcelSummary;
    private addExcelDataTable;
    private addExcelCharts;
    private styleExcelWorksheet;
    private generateEmailHTML;
    private generateFileName;
    private formatHeader;
    private formatCellValue;
    private escapeCSVField;
}
export interface ExportOptions {
    includeCharts?: boolean;
    customStyles?: string;
    orientation?: 'portrait' | 'landscape';
    pageSize?: 'A4' | 'A3' | 'Letter';
}
export interface ExportResult {
    success: boolean;
    fileName: string;
    filePath: string;
    fileSize: number;
    downloadUrl: string;
    mimeType: string;
    error?: string;
}
export declare const reportExportService: ReportExportService;
//# sourceMappingURL=reportExportService.d.ts.map
import puppeteer from 'puppeteer';
import ExcelJS from 'exceljs';
import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import { ReportResponse, ReportFormat, ReportType } from '../types/report';
import { AppError } from '../middleware/errorHandler';

export class ReportExportService {
  private static instance: ReportExportService;
  private emailTransporter: nodemailer.Transporter;

  private constructor() {
    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  public static getInstance(): ReportExportService {
    if (!ReportExportService.instance) {
      ReportExportService.instance = new ReportExportService();
    }
    return ReportExportService.instance;
  }

  /**
   * Export report to specified format
   */
  public async exportReport(
    reportData: ReportResponse,
    format: ReportFormat,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    try {
      switch (format) {
        case 'pdf':
          return await this.exportToPDF(reportData, options);
        case 'excel':
          return await this.exportToExcel(reportData, options);
        case 'csv':
          return await this.exportToCSV(reportData, options);
        default:
          throw new AppError(`Unsupported export format: ${format}`, 400);
      }
    } catch (error) {
      throw new AppError(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  /**
   * Export report to PDF format
   */
  private async exportToPDF(reportData: ReportResponse, options: ExportOptions): Promise<ExportResult> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      
      // Generate HTML content for the report
      const htmlContent = this.generateReportHTML(reportData, options);
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        displayHeaderFooter: true,
        headerTemplate: this.generatePDFHeader(reportData),
        footerTemplate: this.generatePDFFooter(),
      });

      // Save PDF file
      const fileName = this.generateFileName(reportData.metadata.reportType, 'pdf');
      const filePath = path.join(process.cwd(), 'exports', fileName);
      
      // Ensure exports directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, pdfBuffer);

      return {
        success: true,
        fileName,
        filePath,
        fileSize: pdfBuffer.length,
        downloadUrl: `/api/v1/reports/download/${fileName}`,
        mimeType: 'application/pdf',
      };
    } finally {
      await browser.close();
    }
  }

  /**
   * Export report to Excel format
   */
  private async exportToExcel(reportData: ReportResponse, options: ExportOptions): Promise<ExportResult> {
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'School Management System';
    workbook.lastModifiedBy = 'SMS Report Generator';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Create main data worksheet
    const worksheet = workbook.addWorksheet(reportData.metadata.title);

    // Add report header
    this.addExcelHeader(worksheet, reportData);

    // Add summary section
    if (reportData.summary) {
      this.addExcelSummary(worksheet, reportData.summary);
    }

    // Add data table
    this.addExcelDataTable(worksheet, reportData.data, reportData.metadata.reportType);

    // Add charts if available
    if (reportData.charts && reportData.charts.length > 0) {
      this.addExcelCharts(workbook, reportData.charts);
    }

    // Style the worksheet
    this.styleExcelWorksheet(worksheet);

    // Generate file
    const fileName = this.generateFileName(reportData.metadata.reportType, 'xlsx');
    const filePath = path.join(process.cwd(), 'exports', fileName);
    
    // Ensure exports directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await workbook.xlsx.writeFile(filePath);

    const stats = await fs.stat(filePath);

    return {
      success: true,
      fileName,
      filePath,
      fileSize: stats.size,
      downloadUrl: `/api/v1/reports/download/${fileName}`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  /**
   * Export report to CSV format
   */
  private async exportToCSV(reportData: ReportResponse, options: ExportOptions): Promise<ExportResult> {
    if (!reportData.data || reportData.data.length === 0) {
      throw new AppError('No data available for CSV export', 400);
    }

    // Get headers from first data row
    const headers = Object.keys(reportData.data[0]);
    
    // Create CSV content
    let csvContent = '';
    
    // Add report metadata as comments
    csvContent += `# ${reportData.metadata.title}\\n`;
    csvContent += `# Generated: ${reportData.metadata.generatedAt}\\n`;
    csvContent += `# Report Type: ${reportData.metadata.reportType}\\n`;
    csvContent += `# Total Records: ${reportData.summary.totalRecords}\\n`;
    csvContent += `\\n`;

    // Add headers
    csvContent += headers.map(header => this.escapeCSVField(header)).join(',') + '\\n';

    // Add data rows
    for (const row of reportData.data) {
      const values = headers.map(header => {
        const value = row[header];
        return this.escapeCSVField(value?.toString() || '');
      });
      csvContent += values.join(',') + '\\n';
    }

    // Save CSV file
    const fileName = this.generateFileName(reportData.metadata.reportType, 'csv');
    const filePath = path.join(process.cwd(), 'exports', fileName);
    
    // Ensure exports directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, csvContent, 'utf8');

    const stats = await fs.stat(filePath);

    return {
      success: true,
      fileName,
      filePath,
      fileSize: stats.size,
      downloadUrl: `/api/v1/reports/download/${fileName}`,
      mimeType: 'text/csv',
    };
  }

  /**
   * Send report via email
   */
  public async emailReport(
    exportResult: ExportResult,
    recipients: string[],
    reportData: ReportResponse,
    customMessage?: string
  ): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@schoolmanagement.com',
        to: recipients.join(', '),
        subject: `School Management Report: ${reportData.metadata.title}`,
        html: this.generateEmailHTML(reportData, customMessage),
        attachments: [
          {
            filename: exportResult.fileName,
            path: exportResult.filePath,
            contentType: exportResult.mimeType,
          },
        ],
      };

      await this.emailTransporter.sendMail(mailOptions);
    } catch (error) {
      throw new AppError(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  /**
   * Generate HTML content for PDF reports
   */
  private generateReportHTML(reportData: ReportResponse, options: ExportOptions): string {
    const { metadata, summary, data, charts } = reportData;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${metadata.title}</title>
        <style>
          ${this.getPDFStyles()}
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="report-header">
            <h1>${metadata.title}</h1>
            <div class="report-meta">
              <p><strong>Report Type:</strong> ${metadata.reportType}</p>
              <p><strong>Generated:</strong> ${new Date(metadata.generatedAt).toLocaleString()}</p>
              <p><strong>Date Range:</strong> ${summary.dateRange.startDate} to ${summary.dateRange.endDate}</p>
              <p><strong>Total Records:</strong> ${summary.totalRecords}</p>
            </div>
          </div>

          ${this.generateSummaryHTML(summary)}
          ${this.generateDataTableHTML(data, metadata.reportType)}
          ${charts ? this.generateChartsHTML(charts) : ''}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate summary section HTML
   */
  private generateSummaryHTML(summary: any): string {
    if (!summary.aggregations || Object.keys(summary.aggregations).length === 0) {
      return '';
    }

    const aggregationItems = Object.entries(summary.aggregations)
      .map(([key, value]) => `<div class="summary-item"><span class="label">${key}:</span> <span class="value">${value}</span></div>`)
      .join('');

    return `
      <div class="summary-section">
        <h2>Summary</h2>
        <div class="summary-grid">
          ${aggregationItems}
        </div>
      </div>
    `;
  }

  /**
   * Generate data table HTML
   */
  private generateDataTableHTML(data: any[], reportType: ReportType): string {
    if (!data || data.length === 0) {
      return '<div class="no-data">No data available</div>';
    }

    const headers = Object.keys(data[0]);
    const headerRow = headers.map(header => `<th>${this.formatHeader(header)}</th>`).join('');
    
    const dataRows = data.map(row => {
      const cells = headers.map(header => {
        const value = row[header];
        return `<td>${this.formatCellValue(value, header)}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return `
      <div class="data-section">
        <h2>Data</h2>
        <table class="data-table">
          <thead>
            <tr>${headerRow}</tr>
          </thead>
          <tbody>
            ${dataRows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate charts HTML (placeholder for future chart implementation)
   */
  private generateChartsHTML(charts: any[]): string {
    return `
      <div class="charts-section">
        <h2>Charts</h2>
        <p>Chart visualization will be available in future versions.</p>
      </div>
    `;
  }

  /**
   * Get PDF styles
   */
  private getPDFStyles(): string {
    return `
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        color: #333;
      }
      .report-container {
        max-width: 100%;
      }
      .report-header {
        border-bottom: 2px solid #007bff;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      .report-header h1 {
        color: #007bff;
        margin: 0 0 15px 0;
        font-size: 24px;
      }
      .report-meta p {
        margin: 5px 0;
        font-size: 12px;
      }
      .summary-section {
        margin-bottom: 30px;
      }
      .summary-section h2 {
        color: #007bff;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5px;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-top: 15px;
      }
      .summary-item {
        background: #f8f9fa;
        padding: 10px;
        border-radius: 4px;
        border-left: 4px solid #007bff;
      }
      .summary-item .label {
        font-weight: bold;
        color: #495057;
      }
      .summary-item .value {
        color: #007bff;
        font-weight: bold;
      }
      .data-section h2 {
        color: #007bff;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5px;
      }
      .data-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
        font-size: 11px;
      }
      .data-table th {
        background: #007bff;
        color: white;
        padding: 8px;
        text-align: left;
        font-weight: bold;
      }
      .data-table td {
        padding: 6px 8px;
        border-bottom: 1px solid #ddd;
      }
      .data-table tr:nth-child(even) {
        background: #f8f9fa;
      }
      .no-data {
        text-align: center;
        padding: 40px;
        color: #6c757d;
        font-style: italic;
      }
      @media print {
        .report-container {
          margin: 0;
          padding: 0;
        }
      }
    `;
  }

  /**
   * Generate PDF header template
   */
  private generatePDFHeader(reportData: ReportResponse): string {
    return `
      <div style="font-size: 10px; padding: 5px 15px; width: 100%; display: flex; justify-content: space-between;">
        <span>School Management System</span>
        <span>${reportData.metadata.title}</span>
      </div>
    `;
  }

  /**
   * Generate PDF footer template
   */
  private generatePDFFooter(): string {
    return `
      <div style="font-size: 10px; padding: 5px 15px; width: 100%; display: flex; justify-content: space-between;">
        <span>Generated on <span class="date"></span></span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `;
  }

  /**
   * Add Excel header
   */
  private addExcelHeader(worksheet: ExcelJS.Worksheet, reportData: ReportResponse): void {
    worksheet.addRow([reportData.metadata.title]);
    worksheet.addRow(['Report Type:', reportData.metadata.reportType]);
    worksheet.addRow(['Generated:', new Date(reportData.metadata.generatedAt).toLocaleString()]);
    worksheet.addRow(['Date Range:', `${reportData.summary.dateRange.startDate} to ${reportData.summary.dateRange.endDate}`]);
    worksheet.addRow(['Total Records:', reportData.summary.totalRecords]);
    worksheet.addRow([]); // Empty row
  }

  /**
   * Add Excel summary
   */
  private addExcelSummary(worksheet: ExcelJS.Worksheet, summary: any): void {
    if (summary.aggregations && Object.keys(summary.aggregations).length > 0) {
      worksheet.addRow(['SUMMARY']);
      Object.entries(summary.aggregations).forEach(([key, value]) => {
        worksheet.addRow([key, value]);
      });
      worksheet.addRow([]); // Empty row
    }
  }

  /**
   * Add Excel data table
   */
  private addExcelDataTable(worksheet: ExcelJS.Worksheet, data: any[], reportType: ReportType): void {
    if (!data || data.length === 0) {
      worksheet.addRow(['No data available']);
      return;
    }

    // Add headers
    const headers = Object.keys(data[0]);
    worksheet.addRow(['DATA']);
    worksheet.addRow(headers.map(header => this.formatHeader(header)));

    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => row[header]);
      worksheet.addRow(values);
    });
  }

  /**
   * Add Excel charts (placeholder)
   */
  private addExcelCharts(workbook: ExcelJS.Workbook, charts: any[]): void {
    // Chart implementation would go here
    // For now, we'll create a separate worksheet with chart data
    const chartWorksheet = workbook.addWorksheet('Charts');
    chartWorksheet.addRow(['Charts will be available in future versions']);
  }

  /**
   * Style Excel worksheet
   */
  private styleExcelWorksheet(worksheet: ExcelJS.Worksheet): void {
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      if (column.values) {
        const lengths = column.values.map(v => v ? v.toString().length : 0);
        const maxLength = Math.max(...lengths.filter(v => typeof v === 'number'));
        column.width = Math.min(maxLength + 2, 50);
      }
    });

    // Style header rows
    worksheet.eachRow((row, rowNumber) => {
      const values = row.values as any[];
      if (rowNumber <= 6 || (values && (values.includes('SUMMARY') || values.includes('DATA')))) {
        row.font = { bold: true };
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6F3FF' }
        };
      }
    });
  }

  /**
   * Generate email HTML
   */
  private generateEmailHTML(reportData: ReportResponse, customMessage?: string): string {
    return `
      <html>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #007bff; margin-bottom: 20px;">School Management System Report</h2>
          
          ${customMessage ? `<p style="background: #e7f3ff; padding: 15px; border-radius: 4px; border-left: 4px solid #007bff;">${customMessage}</p>` : ''}
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">Report Details</h3>
            <p><strong>Title:</strong> ${reportData.metadata.title}</p>
            <p><strong>Type:</strong> ${reportData.metadata.reportType}</p>
            <p><strong>Generated:</strong> ${new Date(reportData.metadata.generatedAt).toLocaleString()}</p>
            <p><strong>Date Range:</strong> ${reportData.summary.dateRange.startDate} to ${reportData.summary.dateRange.endDate}</p>
            <p><strong>Total Records:</strong> ${reportData.summary.totalRecords}</p>
          </div>
          
          <p>Please find the detailed report attached to this email.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #6c757d;">
            <p>This is an automated email from the School Management System. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate file name
   */
  private generateFileName(reportType: ReportType, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${reportType}_report_${timestamp}.${extension}`;
  }

  /**
   * Format header for display
   */
  private formatHeader(header: string): string {
    return header
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Format cell value for display
   */
  private formatCellValue(value: any, header: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    // Format percentages
    if (header.toLowerCase().includes('percentage') && typeof value === 'number') {
      return `${value.toFixed(2)}%`;
    }

    // Format currency
    if (header.toLowerCase().includes('amount') || header.toLowerCase().includes('fee')) {
      return typeof value === 'number' ? `$${value.toFixed(2)}` : value.toString();
    }

    // Format dates
    if (header.toLowerCase().includes('date') && typeof value === 'string') {
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return value;
      }
    }

    return value.toString();
  }

  /**
   * Escape CSV field
   */
  private escapeCSVField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}

// Types
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

// Export singleton instance
export const reportExportService = ReportExportService.getInstance();
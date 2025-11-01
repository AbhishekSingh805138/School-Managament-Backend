"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportExportService = exports.ReportExportService = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const exceljs_1 = __importDefault(require("exceljs"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const errorHandler_1 = require("../middleware/errorHandler");
const emailService_1 = require("./emailService");
class ReportExportService {
    constructor() {
    }
    static getInstance() {
        if (!ReportExportService.instance) {
            ReportExportService.instance = new ReportExportService();
        }
        return ReportExportService.instance;
    }
    async exportReport(reportData, format, options = {}) {
        try {
            switch (format) {
                case 'pdf':
                    return await this.exportToPDF(reportData, options);
                case 'excel':
                    return await this.exportToExcel(reportData, options);
                case 'csv':
                    return await this.exportToCSV(reportData, options);
                default:
                    throw new errorHandler_1.AppError(`Unsupported export format: ${format}`, 400);
            }
        }
        catch (error) {
            throw new errorHandler_1.AppError(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
        }
    }
    async exportToPDF(reportData, options) {
        let browser;
        try {
            browser = await puppeteer_1.default.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu'
                ],
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            });
            const page = await browser.newPage();
            const htmlContent = this.generateReportHTML(reportData, options);
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
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
            const fileName = this.generateFileName(reportData.metadata.reportType, 'pdf');
            const filePath = path_1.default.join(process.cwd(), 'exports', fileName);
            await promises_1.default.mkdir(path_1.default.dirname(filePath), { recursive: true });
            await promises_1.default.writeFile(filePath, pdfBuffer);
            return {
                success: true,
                fileName,
                filePath,
                fileSize: pdfBuffer.length,
                downloadUrl: `/api/v1/reports/download/${fileName}`,
                mimeType: 'application/pdf',
            };
        }
        catch (error) {
            console.error('PDF generation error:', error);
            throw new errorHandler_1.AppError(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
        }
        finally {
            if (browser) {
                await browser.close();
            }
        }
    }
    async exportToExcel(reportData, options) {
        const workbook = new exceljs_1.default.Workbook();
        workbook.creator = 'School Management System';
        workbook.lastModifiedBy = 'SMS Report Generator';
        workbook.created = new Date();
        workbook.modified = new Date();
        const worksheet = workbook.addWorksheet(reportData.metadata.title);
        this.addExcelHeader(worksheet, reportData);
        if (reportData.summary) {
            this.addExcelSummary(worksheet, reportData.summary);
        }
        this.addExcelDataTable(worksheet, reportData.data, reportData.metadata.reportType);
        if (reportData.charts && reportData.charts.length > 0) {
            this.addExcelCharts(workbook, reportData.charts);
        }
        this.styleExcelWorksheet(worksheet);
        const fileName = this.generateFileName(reportData.metadata.reportType, 'xlsx');
        const filePath = path_1.default.join(process.cwd(), 'exports', fileName);
        await promises_1.default.mkdir(path_1.default.dirname(filePath), { recursive: true });
        await workbook.xlsx.writeFile(filePath);
        const stats = await promises_1.default.stat(filePath);
        return {
            success: true,
            fileName,
            filePath,
            fileSize: stats.size,
            downloadUrl: `/api/v1/reports/download/${fileName}`,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
    }
    async exportToCSV(reportData, options) {
        if (!reportData.data || reportData.data.length === 0) {
            throw new errorHandler_1.AppError('No data available for CSV export', 400);
        }
        const headers = Object.keys(reportData.data[0]);
        let csvContent = '';
        csvContent += `# ${reportData.metadata.title}\\n`;
        csvContent += `# Generated: ${reportData.metadata.generatedAt}\\n`;
        csvContent += `# Report Type: ${reportData.metadata.reportType}\\n`;
        csvContent += `# Total Records: ${reportData.summary.totalRecords}\\n`;
        csvContent += `\\n`;
        csvContent += headers.map(header => this.escapeCSVField(header)).join(',') + '\\n';
        for (const row of reportData.data) {
            const values = headers.map(header => {
                const value = row[header];
                return this.escapeCSVField(value?.toString() || '');
            });
            csvContent += values.join(',') + '\\n';
        }
        const fileName = this.generateFileName(reportData.metadata.reportType, 'csv');
        const filePath = path_1.default.join(process.cwd(), 'exports', fileName);
        await promises_1.default.mkdir(path_1.default.dirname(filePath), { recursive: true });
        await promises_1.default.writeFile(filePath, csvContent, 'utf8');
        const stats = await promises_1.default.stat(filePath);
        return {
            success: true,
            fileName,
            filePath,
            fileSize: stats.size,
            downloadUrl: `/api/v1/reports/download/${fileName}`,
            mimeType: 'text/csv',
        };
    }
    async emailReport(exportResult, recipients, reportData, customMessage) {
        try {
            const html = this.generateEmailHTML(reportData, customMessage);
            await emailService_1.emailService.sendEmail({
                to: recipients,
                subject: `School Management Report: ${reportData.metadata.title}`,
                html,
                attachments: [
                    {
                        filename: exportResult.fileName,
                        path: exportResult.filePath,
                    },
                ],
            });
        }
        catch (error) {
            throw new errorHandler_1.AppError(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
        }
    }
    generateReportHTML(reportData, options) {
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
    generateSummaryHTML(summary) {
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
    generateDataTableHTML(data, reportType) {
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
    generateChartsHTML(charts) {
        return `
      <div class="charts-section">
        <h2>Charts</h2>
        <p>Chart visualization will be available in future versions.</p>
      </div>
    `;
    }
    getPDFStyles() {
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
    generatePDFHeader(reportData) {
        return `
      <div style="font-size: 10px; padding: 5px 15px; width: 100%; display: flex; justify-content: space-between;">
        <span>School Management System</span>
        <span>${reportData.metadata.title}</span>
      </div>
    `;
    }
    generatePDFFooter() {
        return `
      <div style="font-size: 10px; padding: 5px 15px; width: 100%; display: flex; justify-content: space-between;">
        <span>Generated on <span class="date"></span></span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `;
    }
    addExcelHeader(worksheet, reportData) {
        worksheet.addRow([reportData.metadata.title]);
        worksheet.addRow(['Report Type:', reportData.metadata.reportType]);
        worksheet.addRow(['Generated:', new Date(reportData.metadata.generatedAt).toLocaleString()]);
        worksheet.addRow(['Date Range:', `${reportData.summary.dateRange.startDate} to ${reportData.summary.dateRange.endDate}`]);
        worksheet.addRow(['Total Records:', reportData.summary.totalRecords]);
        worksheet.addRow([]);
    }
    addExcelSummary(worksheet, summary) {
        if (summary.aggregations && Object.keys(summary.aggregations).length > 0) {
            worksheet.addRow(['SUMMARY']);
            Object.entries(summary.aggregations).forEach(([key, value]) => {
                worksheet.addRow([key, value]);
            });
            worksheet.addRow([]);
        }
    }
    addExcelDataTable(worksheet, data, reportType) {
        if (!data || data.length === 0) {
            worksheet.addRow(['No data available']);
            return;
        }
        const headers = Object.keys(data[0]);
        worksheet.addRow(['DATA']);
        worksheet.addRow(headers.map(header => this.formatHeader(header)));
        data.forEach(row => {
            const values = headers.map(header => row[header]);
            worksheet.addRow(values);
        });
    }
    addExcelCharts(workbook, charts) {
        const chartWorksheet = workbook.addWorksheet('Charts');
        chartWorksheet.addRow(['Charts will be available in future versions']);
    }
    styleExcelWorksheet(worksheet) {
        worksheet.columns.forEach(column => {
            if (column.values) {
                const lengths = column.values.map(v => v ? v.toString().length : 0);
                const maxLength = Math.max(...lengths.filter(v => typeof v === 'number'));
                column.width = Math.min(maxLength + 2, 50);
            }
        });
        worksheet.eachRow((row, rowNumber) => {
            const values = row.values;
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
    generateEmailHTML(reportData, customMessage) {
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
    generateFileName(reportType, extension) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        return `${reportType}_report_${timestamp}.${extension}`;
    }
    formatHeader(header) {
        return header
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }
    formatCellValue(value, header) {
        if (value === null || value === undefined) {
            return '';
        }
        if (header.toLowerCase().includes('percentage') && typeof value === 'number') {
            return `${value.toFixed(2)}%`;
        }
        if (header.toLowerCase().includes('amount') || header.toLowerCase().includes('fee')) {
            return typeof value === 'number' ? `$${value.toFixed(2)}` : value.toString();
        }
        if (header.toLowerCase().includes('date') && typeof value === 'string') {
            try {
                return new Date(value).toLocaleDateString();
            }
            catch {
                return value;
            }
        }
        return value.toString();
    }
    escapeCSVField(field) {
        if (field.includes(',') || field.includes('"') || field.includes('\\n')) {
            return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
    }
}
exports.ReportExportService = ReportExportService;
exports.reportExportService = ReportExportService.getInstance();
//# sourceMappingURL=reportExportService.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const errorHandler_1 = require("../middleware/errorHandler");
class EmailService {
    constructor() {
        this.isConfigured = false;
        this.initializeTransporter();
    }
    static getInstance() {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }
    initializeTransporter() {
        try {
            const smtpHost = process.env.SMTP_HOST;
            const smtpPort = parseInt(process.env.SMTP_PORT || '587');
            const smtpUser = process.env.SMTP_USER;
            const smtpPass = process.env.SMTP_PASS;
            if (!smtpHost || !smtpUser || !smtpPass) {
                console.warn('⚠️  SMTP configuration incomplete. Email functionality will be disabled.');
                this.isConfigured = false;
                return;
            }
            this.transporter = nodemailer_1.default.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
            });
            this.isConfigured = true;
            console.log('✅ Email service configured successfully');
        }
        catch (error) {
            console.error('❌ Failed to configure email service:', error);
            this.isConfigured = false;
        }
    }
    async sendEmail(options) {
        if (!this.isConfigured) {
            console.warn('Email service not configured. Skipping email send.');
            return;
        }
        try {
            const mailOptions = {
                from: process.env.SMTP_FROM || options.from || 'noreply@schoolmanagement.com',
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
                attachments: options.attachments,
            };
            await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email sent successfully to ${mailOptions.to}`);
        }
        catch (error) {
            console.error('❌ Failed to send email:', error);
            throw new errorHandler_1.AppError(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
        }
    }
    async sendWelcomeEmail(to, userName, userRole, tempPassword) {
        const subject = 'Welcome to School Management System';
        const html = this.getWelcomeEmailTemplate(userName, userRole, tempPassword);
        await this.sendEmail({ to, subject, html });
    }
    async sendFeeReminder(to, studentName, feeDetails) {
        const subject = 'Fee Payment Reminder - School Management System';
        const html = this.getFeeReminderTemplate(studentName, feeDetails);
        await this.sendEmail({ to, subject, html });
    }
    async sendAttendanceAlert(to, studentName, attendanceData) {
        const subject = 'Low Attendance Alert - School Management System';
        const html = this.getAttendanceAlertTemplate(studentName, attendanceData);
        await this.sendEmail({ to, subject, html });
    }
    async sendGradeNotification(to, studentName, gradeData) {
        const subject = 'New Grade Posted - School Management System';
        const html = this.getGradeNotificationTemplate(studentName, gradeData);
        await this.sendEmail({ to, subject, html });
    }
    async sendPasswordResetEmail(to, userName, resetToken, resetUrl) {
        const subject = 'Password Reset Request - School Management System';
        const html = this.getPasswordResetTemplate(userName, resetToken, resetUrl);
        await this.sendEmail({ to, subject, html });
    }
    async sendReportCard(to, studentName, semester, attachmentPath) {
        const subject = `Report Card - ${semester} - School Management System`;
        const html = this.getReportCardTemplate(studentName, semester);
        const attachments = attachmentPath ? [{
                filename: `ReportCard_${studentName}_${semester}.pdf`,
                path: attachmentPath,
            }] : undefined;
        await this.sendEmail({ to, subject, html, attachments });
    }
    async sendCustomEmail(to, subject, message) {
        const html = this.getCustomEmailTemplate(message);
        await this.sendEmail({ to, subject, html });
    }
    getWelcomeEmailTemplate(userName, userRole, tempPassword) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .credentials { background: white; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to School Management System</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Welcome to our School Management System. Your account has been created successfully as a <strong>${userRole}</strong>.</p>
            
            ${tempPassword ? `
            <div class="credentials">
              <h3>Your Login Credentials:</h3>
              <p><strong>Temporary Password:</strong> ${tempPassword}</p>
              <p style="color: #dc3545;"><strong>Important:</strong> Please change your password after your first login for security reasons.</p>
            </div>
            ` : ''}
            
            <p>You can now access the system and start using all the features available to you.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login to Your Account</a>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from School Management System. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    getFeeReminderTemplate(studentName, feeDetails) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ffc107; color: #333; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .fee-details { background: white; padding: 20px; border-left: 4px solid #ffc107; margin: 20px 0; }
          .amount { font-size: 24px; color: #dc3545; font-weight: bold; }
          .button { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Fee Payment Reminder</h1>
          </div>
          <div class="content">
            <h2>Dear Parent/Guardian of ${studentName},</h2>
            <p>This is a friendly reminder about an upcoming fee payment.</p>
            
            <div class="fee-details">
              <h3>Fee Details:</h3>
              <p><strong>Fee Type:</strong> ${feeDetails.feeName}</p>
              <p><strong>Amount:</strong> ₹${feeDetails.amount.toFixed(2)}</p>
              <p><strong>Due Date:</strong> ${new Date(feeDetails.dueDate).toLocaleDateString()}</p>
              <p class="amount">Outstanding Amount: ₹${feeDetails.outstandingAmount.toFixed(2)}</p>
            </div>
            
            <p>Please ensure the payment is made before the due date to avoid any late fees.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments" class="button">Make Payment</a>
            
            <p>If you have already made the payment, please disregard this reminder.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from School Management System. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    getAttendanceAlertTemplate(studentName, attendanceData) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .alert-box { background: #fff3cd; padding: 20px; border-left: 4px solid #dc3545; margin: 20px 0; }
          .percentage { font-size: 32px; color: #dc3545; font-weight: bold; }
          .button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Low Attendance Alert</h1>
          </div>
          <div class="content">
            <h2>Dear Parent/Guardian of ${studentName},</h2>
            <p>We would like to bring to your attention that ${studentName}'s attendance has fallen below the required threshold.</p>
            
            <div class="alert-box">
              <h3>Attendance Summary for ${attendanceData.month}:</h3>
              <p class="percentage">${attendanceData.attendancePercentage}%</p>
              <p><strong>Absent Days:</strong> ${attendanceData.absentDays}</p>
              <p style="color: #dc3545;"><strong>Note:</strong> Minimum required attendance is 75%</p>
            </div>
            
            <p>Regular attendance is crucial for academic success. We encourage you to ensure ${studentName} attends school regularly.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/attendance" class="button">View Detailed Attendance</a>
            
            <p>If there are any concerns or issues affecting attendance, please contact the school administration.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from School Management System. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    getGradeNotificationTemplate(studentName, gradeData) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .grade-box { background: white; padding: 20px; border-left: 4px solid #28a745; margin: 20px 0; }
          .grade { font-size: 48px; color: #28a745; font-weight: bold; }
          .button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 New Grade Posted</h1>
          </div>
          <div class="content">
            <h2>Dear Parent/Guardian of ${studentName},</h2>
            <p>A new grade has been posted for ${studentName}.</p>
            
            <div class="grade-box">
              <h3>${gradeData.subject} - ${gradeData.semester}</h3>
              <p class="grade">${gradeData.grade}</p>
              <p><strong>Marks Obtained:</strong> ${gradeData.marks} / ${gradeData.totalMarks}</p>
              <p><strong>Percentage:</strong> ${((gradeData.marks / gradeData.totalMarks) * 100).toFixed(2)}%</p>
            </div>
            
            <p>You can view the complete grade details and report card by logging into the parent portal.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/grades" class="button">View All Grades</a>
          </div>
          <div class="footer">
            <p>This is an automated email from School Management System. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    getPasswordResetTemplate(userName, resetToken, resetUrl) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>We received a request to reset your password for your School Management System account.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <div class="warning">
              <p><strong>Security Note:</strong></p>
              <p>• This link will expire in 1 hour</p>
              <p>• If you didn't request this reset, please ignore this email</p>
              <p>• Never share this link with anyone</p>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>This is an automated email from School Management System. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    getReportCardTemplate(studentName, semester) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6f42c1; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Report Card Available</h1>
          </div>
          <div class="content">
            <h2>Dear Parent/Guardian of ${studentName},</h2>
            <p>The report card for ${semester} is now available.</p>
            
            <p>Please find the report card attached to this email. You can also view and download it from the parent portal.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/report-cards" class="button">View Report Card</a>
            
            <p>If you have any questions about the report card, please contact the class teacher or school administration.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from School Management System. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    getCustomEmailTemplate(message) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .message { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>School Management System</h1>
          </div>
          <div class="content">
            <div class="message">
              ${message}
            </div>
          </div>
          <div class="footer">
            <p>This is an automated email from School Management System. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    isEmailConfigured() {
        return this.isConfigured;
    }
}
exports.EmailService = EmailService;
exports.emailService = EmailService.getInstance();
//# sourceMappingURL=emailService.js.map
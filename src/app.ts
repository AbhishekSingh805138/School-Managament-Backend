import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import academicYearRoutes from './routes/academicYears';
import semesterRoutes from './routes/semesters';
import subjectRoutes from './routes/subjects';
import classRoutes from './routes/classes';
import studentRoutes from './routes/students';
import parentRoutes from './routes/parents';
import teacherRoutes from './routes/teachers';
import attendanceRoutes from './routes/attendance';
import attendanceReportRoutes from './routes/attendanceReports';
import feeRoutes from './routes/fees';
import paymentRoutes from './routes/payments';
import feeReportRoutes from './routes/feeReports';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Logging middleware
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Test endpoint
app.post('/test', (req, res) => {
  console.log('Test endpoint - Headers:', req.headers);
  console.log('Test endpoint - Body:', req.body);
  res.json({
    success: true,
    message: 'Test endpoint working',
    receivedBody: req.body,
    contentType: req.headers['content-type'],
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/academic-years', academicYearRoutes);
app.use('/api/v1/semesters', semesterRoutes);
app.use('/api/v1/subjects', subjectRoutes);
app.use('/api/v1/classes', classRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/parents', parentRoutes);
app.use('/api/v1/teachers', teacherRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/attendance-reports', attendanceReportRoutes);
app.use('/api/v1/fees', feeRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/fee-reports', feeReportRoutes);

// API documentation endpoint
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: 'School Management API v1',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      academicYears: '/api/v1/academic-years',
      semesters: '/api/v1/semesters',
      subjects: '/api/v1/subjects',
      classes: '/api/v1/classes',
      students: '/api/v1/students',
      parents: '/api/v1/parents',
      teachers: '/api/v1/teachers',
      attendance: '/api/v1/attendance',
      attendanceReports: '/api/v1/attendance-reports',
      fees: '/api/v1/fees',
      payments: '/api/v1/payments',
      feeReports: '/api/v1/fee-reports',
      grades: '/api/v1/grades',
      reports: '/api/v1/reports',
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;

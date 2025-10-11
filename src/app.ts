import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
// import studentRoutes from './routes/students';
// import classRoutes from './routes/classes';

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
// app.use('/api/v1/students', studentRoutes);
// app.use('/api/v1/classes', classRoutes);

// API documentation endpoint
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: 'School Management API v1',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      students: '/api/v1/students',
      classes: '/api/v1/classes',
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;

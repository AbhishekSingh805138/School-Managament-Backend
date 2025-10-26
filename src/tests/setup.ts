// Jest setup file for global test configuration
import { jest } from '@jest/globals';

// IMPORTANT: Set environment variables BEFORE importing any modules
// This ensures the environment configuration uses the test values
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long-for-jwt-validation';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'SMS';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'Kishan8051';
process.env.JWT_EXPIRES_IN = '7d';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';

// Global test timeout
jest.setTimeout(10000);
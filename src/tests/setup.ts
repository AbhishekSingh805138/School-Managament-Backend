// Jest setup file for global test configuration
import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long-for-jwt-validation';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'SMS';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'Kishan8051';

// Global test timeout
jest.setTimeout(10000);
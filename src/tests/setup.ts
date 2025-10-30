// Jest setup file for global test configuration
import { jest } from '@jest/globals';

// IMPORTANT: Set environment variables BEFORE importing any modules
// This ensures the environment configuration uses the test values
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'your_super_secret_jwt_key_change_this_in_production_environment_32_chars_minimum';
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

// Clean up common test emails to ensure idempotent runs
(async () => {
  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const { query } = await import('../database/connection');
      const emails = [
        'newuser@test.com',
        'admincreated@test.com',
        'teacherattempt@test.com',
        'studentattempt@test.com',
        'inactive@test.com'
      ];
      await query('DELETE FROM users WHERE email = ANY($1)', [emails]);
      break;
    } catch (e) {
      if (attempt === 5) break;
      await sleep(500);
    }
  }
})();

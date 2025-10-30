import request from 'supertest';
import { app } from '../app';
import fs from 'fs';
import path from 'path';
import { AuditLogger, auditAuth, auditData, auditSecurity } from '../middleware/auditLogger';

describe('Audit Logger', () => {
  let auditor: AuditLogger;
  const testLogDir = path.join('logs', 'audit');
  const testLogPath = path.join(testLogDir, 'audit.log');

  beforeAll(() => {
    auditor = AuditLogger.getInstance();
  });

  beforeEach(() => {
    // Clean up test log file
    try {
      if (fs.existsSync(testLogPath)) fs.unlinkSync(testLogPath);
    } catch {}
  });

  describe('AuditLogger Class', () => {
    it('should be a singleton', () => {
      const instance1 = AuditLogger.getInstance();
      const instance2 = AuditLogger.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should log events with all required fields', () => {
      auditor.logEvent({
        eventType: 'TEST_EVENT',
        userId: 'user123',
        userEmail: 'test@example.com',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        method: 'POST',
        endpoint: '/test',
        action: 'TEST_ACTION',
        success: true,
      });

      auditor.gracefulShutdown();
      expect(fs.existsSync(testLogPath)).toBe(true);
      const content = fs.readFileSync(testLogPath, 'utf-8').trim();
      const entry = JSON.parse(content.split(/\r?\n/).pop() as string);
      expect(entry.eventType).toBe('TEST_EVENT');
      expect(entry.userId).toBe('user123');
      expect(entry.userEmail).toBe('test@example.com');
      expect(entry.success).toBe(true);
      expect(entry.timestamp).toBeDefined();
    });

    it('should retrieve audit logs with filters and limits', async () => {
      auditor.logEvent({ eventType: 'AUTH_LOGIN', userId: 'u1', userEmail: 'u1@example.com', action: 'LOGIN', success: true });
      auditor.logEvent({ eventType: 'DATA_CREATE', userId: 'u2', userEmail: 'u2@example.com', action: 'CREATE', success: true });
      auditor.gracefulShutdown();

      const authLogs = await auditor.getAuditLogs({ eventType: 'AUTH_LOGIN' });
      expect(authLogs.length).toBeGreaterThan(0);
      expect(authLogs[authLogs.length - 1].eventType).toBe('AUTH_LOGIN');

      const limited = await auditor.getAuditLogs({ limit: 1 });
      expect(limited.length).toBe(1);
    });
  });

  describe('Audit helpers', () => {
    it('should log auth events', () => {
      const req: any = { ip: '127.0.0.1', get: jest.fn().mockReturnValue('test-agent'), method: 'POST', originalUrl: '/api/v1/auth/login' };
      auditAuth.login(req, 'test@example.com', true, { userId: 'user123', role: 'student' });
      auditor.gracefulShutdown();
      const content = fs.readFileSync(testLogPath, 'utf-8').trim();
      const entry = JSON.parse(content.split(/\r?\n/).pop() as string);
      expect(entry.eventType).toBe('AUTH_LOGIN');
      expect(entry.userEmail).toBe('test@example.com');
      expect(entry.success).toBe(true);
      expect(entry.action).toBe('LOGIN');
    });

    it('should log data events and redact sensitive fields', () => {
      const req: any = { ip: '127.0.0.1', get: jest.fn().mockReturnValue('test-agent'), method: 'POST', originalUrl: '/api/v1/users', body: { password: 'secret', token: 'abc', email: 'user@example.com' }, user: { id: 'u', email: 'e' } };
      auditData.create(req, 'users', 'r1', true);
      auditor.gracefulShutdown();
      const content = fs.readFileSync(testLogPath, 'utf-8').trim();
      const entry = JSON.parse(content.split(/\r?\n/).pop() as string);
      expect(entry.eventType).toBe('DATA_CREATE');
      expect(entry.details.body.password).toBe('[REDACTED]');
      expect(entry.details.body.token).toBe('[REDACTED]');
    });

    it('should log security events', () => {
      const req: any = { ip: '127.0.0.1', get: jest.fn().mockReturnValue('test-agent'), method: 'GET', originalUrl: '/api/v1/admin', user: { id: 'u', email: 'e' } };
      auditSecurity.unauthorizedAccess(req, 'Invalid JWT token');
      auditor.gracefulShutdown();
      const content = fs.readFileSync(testLogPath, 'utf-8').trim();
      const entry = JSON.parse(content.split(/\r?\n/).pop() as string);
      expect(entry.eventType).toBe('SECURITY_UNAUTHORIZED');
      expect(entry.action).toBe('UNAUTHORIZED_ACCESS');
      expect(entry.details.reason).toBe('Invalid JWT token');
    });
  });

  describe('Integration with Express App', () => {
    it('should audit failed authentication attempts', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({ email: 'nonexistent@example.com', password: 'wrongpassword' });
      expect(response.status).toBe(401);
      await new Promise((r) => setTimeout(r, 100));
      auditor.gracefulShutdown();
      const logs = await auditor.getAuditLogs({ eventType: 'AUTH_FAILED_ATTEMPT' });
      expect(logs.length).toBeGreaterThan(0);
      const loginAttempt = logs.find((l) => l.userEmail === 'nonexistent@example.com');
      expect(loginAttempt).toBeDefined();
      expect(loginAttempt?.success).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should handle high volume of audit events', () => {
      const start = Date.now();
      for (let i = 0; i < 500; i++) {
        auditor.logEvent({ eventType: 'PERFORMANCE_TEST', userId: `user${i}`, action: 'TEST', success: true });
      }
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1500);
    });
  });
});

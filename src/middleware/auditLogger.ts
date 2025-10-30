import fs from 'fs';
import path from 'path';
import { Request } from 'express';

// Types for audit entries
interface AuditEvent {
  timestamp: string;
  eventType: string;
  action?: string;
  success: boolean;
  userId?: string;
  userEmail?: string;
  ipAddress?: string | string[] | undefined;
  userAgent?: string | undefined;
  method?: string;
  endpoint?: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
}

// Utility: ensure directory exists
const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Utility: redact sensitive fields deeply
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'auth',
  'secret',
]);

const redactSensitive = (value: any): any => {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(k)) {
        result[k] = '[REDACTED]';
      } else {
        result[k] = redactSensitive(v);
      }
    }
    return result;
  }
  return value;
};

export class AuditLogger {
  private static instance: AuditLogger | null = null;
  private readonly logDir = path.join('logs', 'audit');
  private readonly logFile = path.join(this.logDir, 'audit.log');
  private buffer: AuditEvent[] = [];
  private readonly bufferLimit = 50;

  private constructor() {
    ensureDir(this.logDir);
    // Flush on process exit just in case
    process.on('beforeExit', () => {
      try { this.flush(); } catch { /* ignore */ }
    });
  }

  static getInstance(): AuditLogger {
    if (!this.instance) {
      this.instance = new AuditLogger();
    }
    return this.instance;
  }

  logEvent(event: Omit<AuditEvent, 'timestamp'>) {
    const entry: AuditEvent = {
      timestamp: new Date().toISOString(),
      ...event,
    };
    this.buffer.push(entry);
    if (this.buffer.length >= this.bufferLimit) {
      this.flush();
    }
  }

  flush() {
    if (this.buffer.length === 0) return;
    ensureDir(this.logDir);
    const lines = this.buffer.map((e) => JSON.stringify(e));
    fs.appendFileSync(this.logFile, lines.join('\n') + '\n');
    this.buffer = [];
  }

  async getAuditLogs(filters?: { eventType?: string; limit?: number }): Promise<AuditEvent[]> {
    try {
      if (!fs.existsSync(this.logFile)) return [];
      const content = fs.readFileSync(this.logFile, 'utf-8');
      const lines = content.trim().length ? content.trim().split(/\r?\n/) : [];
      let entries: AuditEvent[] = [];
      for (const line of lines) {
        try {
          entries.push(JSON.parse(line));
        } catch { /* ignore bad lines */ }
      }
      if (filters?.eventType) {
        entries = entries.filter((e) => e.eventType === filters.eventType);
      }
      if (filters?.limit && filters.limit > 0) {
        entries = entries.slice(-filters.limit);
      }
      return entries;
    } catch {
      return [];
    }
  }

  gracefulShutdown() {
    this.flush();
  }
}

const baseFromReq = (req: Request) => ({
  ipAddress: req.ip || (req as any).connection?.remoteAddress,
  userAgent: req.get('User-Agent'),
  method: req.method,
  endpoint: req.originalUrl,
});

export const auditAuth = {
  login(req: Request, userEmail: string, success: boolean, meta?: { userId?: string; role?: string }) {
    AuditLogger.getInstance().logEvent({
      eventType: 'AUTH_LOGIN',
      action: 'LOGIN',
      success,
      userId: meta?.userId,
      userEmail,
      ...baseFromReq(req),
      details: meta ? { role: meta.role } : undefined,
    });
  },
  failedAttempt(req: Request, userEmail: string, reason: string, attemptCount?: number) {
    AuditLogger.getInstance().logEvent({
      eventType: 'AUTH_FAILED_ATTEMPT',
      action: 'FAILED_LOGIN',
      success: false,
      userEmail,
      ...baseFromReq(req),
      details: { reason, attemptCount },
    });
  },
  passwordChange(req: Request, userId: string, userEmail: string, success: boolean) {
    AuditLogger.getInstance().logEvent({
      eventType: 'AUTH_PASSWORD_CHANGE',
      action: 'PASSWORD_CHANGE',
      success,
      userId,
      userEmail,
      ...baseFromReq(req),
    });
  },
};

export const auditData = {
  create(req: Request, resource: string, resourceId: string, success: boolean) {
    const body = redactSensitive((req as any).body || {});
    AuditLogger.getInstance().logEvent({
      eventType: 'DATA_CREATE',
      action: 'CREATE',
      success,
      userId: (req as any).user?.id,
      userEmail: (req as any).user?.email,
      resource,
      resourceId,
      ...baseFromReq(req),
      details: { body },
    });
  },
  update(req: Request, resource: string, resourceId: string, success: boolean, changes?: Record<string, any>) {
    AuditLogger.getInstance().logEvent({
      eventType: 'DATA_UPDATE',
      action: 'UPDATE',
      success,
      userId: (req as any).user?.id,
      userEmail: (req as any).user?.email,
      resource,
      resourceId,
      ...baseFromReq(req),
      details: { changes: redactSensitive(changes || {}) },
    });
  },
  delete(req: Request, resource: string, resourceId: string, success: boolean) {
    AuditLogger.getInstance().logEvent({
      eventType: 'DATA_DELETE',
      action: 'DELETE',
      success,
      userId: (req as any).user?.id,
      userEmail: (req as any).user?.email,
      resource,
      resourceId,
      ...baseFromReq(req),
    });
  },
  access(req: Request, resource: string, resourceId: string, success: boolean) {
    // Only log access for sensitive resources
    const sensitive = new Set(['users', 'payments', 'fees']);
    if (!sensitive.has(resource)) return;
    AuditLogger.getInstance().logEvent({
      eventType: 'DATA_ACCESS',
      action: 'ACCESS',
      success,
      userId: (req as any).user?.id,
      userEmail: (req as any).user?.email,
      resource,
      resourceId,
      ...baseFromReq(req),
    });
  },
};

export const auditSecurity = {
  suspiciousActivity(req: Request, action: string, details?: Record<string, any>) {
    AuditLogger.getInstance().logEvent({
      eventType: 'SECURITY_SUSPICIOUS',
      action,
      success: false,
      userId: (req as any).user?.id,
      userEmail: (req as any).user?.email,
      ...baseFromReq(req),
      details,
    });
  },
  rateLimitExceeded(req: Request, limitType: string) {
    AuditLogger.getInstance().logEvent({
      eventType: 'SECURITY_RATE_LIMIT',
      action: 'RATE_LIMIT_EXCEEDED',
      success: false,
      userId: (req as any).user?.id,
      userEmail: (req as any).user?.email,
      ...baseFromReq(req),
      details: { limitType },
    });
  },
  unauthorizedAccess(req: Request, reason: string) {
    AuditLogger.getInstance().logEvent({
      eventType: 'SECURITY_UNAUTHORIZED',
      action: 'UNAUTHORIZED_ACCESS',
      success: false,
      userId: (req as any).user?.id,
      userEmail: (req as any).user?.email,
      ...baseFromReq(req),
      details: { reason },
    });
  },
};

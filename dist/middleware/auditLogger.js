"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditSecurity = exports.auditData = exports.auditAuth = exports.AuditLogger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ensureDir = (dirPath) => {
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath, { recursive: true });
    }
};
const SENSITIVE_KEYS = new Set([
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'authorization',
    'auth',
    'secret',
]);
const redactSensitive = (value) => {
    if (value === null || value === undefined)
        return value;
    if (Array.isArray(value))
        return value.map(redactSensitive);
    if (typeof value === 'object') {
        const result = {};
        for (const [k, v] of Object.entries(value)) {
            if (SENSITIVE_KEYS.has(k)) {
                result[k] = '[REDACTED]';
            }
            else {
                result[k] = redactSensitive(v);
            }
        }
        return result;
    }
    return value;
};
class AuditLogger {
    constructor() {
        this.logDir = path_1.default.join('logs', 'audit');
        this.logFile = path_1.default.join(this.logDir, 'audit.log');
        this.buffer = [];
        this.bufferLimit = 50;
        ensureDir(this.logDir);
        process.on('beforeExit', () => {
            try {
                this.flush();
            }
            catch { }
        });
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new AuditLogger();
        }
        return this.instance;
    }
    logEvent(event) {
        const entry = {
            timestamp: new Date().toISOString(),
            ...event,
        };
        this.buffer.push(entry);
        if (this.buffer.length >= this.bufferLimit) {
            this.flush();
        }
    }
    flush() {
        if (this.buffer.length === 0)
            return;
        ensureDir(this.logDir);
        const lines = this.buffer.map((e) => JSON.stringify(e));
        fs_1.default.appendFileSync(this.logFile, lines.join('\n') + '\n');
        this.buffer = [];
    }
    async getAuditLogs(filters) {
        try {
            if (!fs_1.default.existsSync(this.logFile))
                return [];
            const content = fs_1.default.readFileSync(this.logFile, 'utf-8');
            const lines = content.trim().length ? content.trim().split(/\r?\n/) : [];
            let entries = [];
            for (const line of lines) {
                try {
                    entries.push(JSON.parse(line));
                }
                catch { }
            }
            if (filters?.eventType) {
                entries = entries.filter((e) => e.eventType === filters.eventType);
            }
            if (filters?.limit && filters.limit > 0) {
                entries = entries.slice(-filters.limit);
            }
            return entries;
        }
        catch {
            return [];
        }
    }
    gracefulShutdown() {
        this.flush();
    }
}
exports.AuditLogger = AuditLogger;
AuditLogger.instance = null;
const baseFromReq = (req) => ({
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent'),
    method: req.method,
    endpoint: req.originalUrl,
});
exports.auditAuth = {
    login(req, userEmail, success, meta) {
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
    failedAttempt(req, userEmail, reason, attemptCount) {
        AuditLogger.getInstance().logEvent({
            eventType: 'AUTH_FAILED_ATTEMPT',
            action: 'FAILED_LOGIN',
            success: false,
            userEmail,
            ...baseFromReq(req),
            details: { reason, attemptCount },
        });
    },
    passwordChange(req, userId, userEmail, success) {
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
exports.auditData = {
    create(req, resource, resourceId, success) {
        const body = redactSensitive(req.body || {});
        AuditLogger.getInstance().logEvent({
            eventType: 'DATA_CREATE',
            action: 'CREATE',
            success,
            userId: req.user?.id,
            userEmail: req.user?.email,
            resource,
            resourceId,
            ...baseFromReq(req),
            details: { body },
        });
    },
    update(req, resource, resourceId, success, changes) {
        AuditLogger.getInstance().logEvent({
            eventType: 'DATA_UPDATE',
            action: 'UPDATE',
            success,
            userId: req.user?.id,
            userEmail: req.user?.email,
            resource,
            resourceId,
            ...baseFromReq(req),
            details: { changes: redactSensitive(changes || {}) },
        });
    },
    delete(req, resource, resourceId, success) {
        AuditLogger.getInstance().logEvent({
            eventType: 'DATA_DELETE',
            action: 'DELETE',
            success,
            userId: req.user?.id,
            userEmail: req.user?.email,
            resource,
            resourceId,
            ...baseFromReq(req),
        });
    },
    access(req, resource, resourceId, success) {
        const sensitive = new Set(['users', 'payments', 'fees']);
        if (!sensitive.has(resource))
            return;
        AuditLogger.getInstance().logEvent({
            eventType: 'DATA_ACCESS',
            action: 'ACCESS',
            success,
            userId: req.user?.id,
            userEmail: req.user?.email,
            resource,
            resourceId,
            ...baseFromReq(req),
        });
    },
};
exports.auditSecurity = {
    suspiciousActivity(req, action, details) {
        AuditLogger.getInstance().logEvent({
            eventType: 'SECURITY_SUSPICIOUS',
            action,
            success: false,
            userId: req.user?.id,
            userEmail: req.user?.email,
            ...baseFromReq(req),
            details,
        });
    },
    rateLimitExceeded(req, limitType) {
        AuditLogger.getInstance().logEvent({
            eventType: 'SECURITY_RATE_LIMIT',
            action: 'RATE_LIMIT_EXCEEDED',
            success: false,
            userId: req.user?.id,
            userEmail: req.user?.email,
            ...baseFromReq(req),
            details: { limitType },
        });
    },
    unauthorizedAccess(req, reason) {
        AuditLogger.getInstance().logEvent({
            eventType: 'SECURITY_UNAUTHORIZED',
            action: 'UNAUTHORIZED_ACCESS',
            success: false,
            userId: req.user?.id,
            userEmail: req.user?.email,
            ...baseFromReq(req),
            details: { reason },
        });
    },
};
//# sourceMappingURL=auditLogger.js.map
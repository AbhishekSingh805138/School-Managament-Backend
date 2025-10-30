import { Request } from 'express';
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
export declare class AuditLogger {
    private static instance;
    private readonly logDir;
    private readonly logFile;
    private buffer;
    private readonly bufferLimit;
    private constructor();
    static getInstance(): AuditLogger;
    logEvent(event: Omit<AuditEvent, 'timestamp'>): void;
    flush(): void;
    getAuditLogs(filters?: {
        eventType?: string;
        limit?: number;
    }): Promise<AuditEvent[]>;
    gracefulShutdown(): void;
}
export declare const auditAuth: {
    login(req: Request, userEmail: string, success: boolean, meta?: {
        userId?: string;
        role?: string;
    }): void;
    failedAttempt(req: Request, userEmail: string, reason: string, attemptCount?: number): void;
    passwordChange(req: Request, userId: string, userEmail: string, success: boolean): void;
};
export declare const auditData: {
    create(req: Request, resource: string, resourceId: string, success: boolean): void;
    update(req: Request, resource: string, resourceId: string, success: boolean, changes?: Record<string, any>): void;
    delete(req: Request, resource: string, resourceId: string, success: boolean): void;
    access(req: Request, resource: string, resourceId: string, success: boolean): void;
};
export declare const auditSecurity: {
    suspiciousActivity(req: Request, action: string, details?: Record<string, any>): void;
    rateLimitExceeded(req: Request, limitType: string): void;
    unauthorizedAccess(req: Request, reason: string): void;
};
export {};
//# sourceMappingURL=auditLogger.d.ts.map
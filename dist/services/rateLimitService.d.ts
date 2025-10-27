import { BaseService } from './baseService';
interface LoginAttempt {
    email: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    attemptedAt: Date;
}
export declare class RateLimitService extends BaseService {
    private readonly MAX_ATTEMPTS;
    private readonly LOCKOUT_DURATION_MINUTES;
    private readonly WINDOW_MINUTES;
    recordLoginAttempt(attempt: LoginAttempt): Promise<void>;
    checkRateLimit(email: string, ipAddress: string): Promise<void>;
    cleanupOldAttempts(): Promise<void>;
    getLoginStats(timeframe?: 'hour' | 'day' | 'week'): Promise<any>;
    detectSuspiciousActivity(): Promise<any[]>;
}
export {};
//# sourceMappingURL=rateLimitService.d.ts.map
import * as Sentry from '@sentry/node';
import { Application, Request, Response, NextFunction } from 'express';
export declare class MonitoringService {
    private static instance;
    private isInitialized;
    private constructor();
    static getInstance(): MonitoringService;
    initializeSentry(app: Application): void;
    getRequestHandler(): (req: Request, res: Response, next: NextFunction) => void;
    getTracingHandler(): (req: Request, res: Response, next: NextFunction) => void;
    getErrorHandler(): (err: Error, req: Request, res: Response, next: NextFunction) => void;
    captureException(error: Error, context?: any): void;
    captureMessage(message: string, level?: Sentry.SeverityLevel, context?: any): void;
    setUser(user: {
        id: string;
        email?: string;
        username?: string;
    }): void;
    clearUser(): void;
    addBreadcrumb(message: string, category: string, data?: any): void;
    startTransaction(name: string, op: string): any;
    isMonitoringEnabled(): boolean;
}
export declare const monitoringService: MonitoringService;
//# sourceMappingURL=monitoringService.d.ts.map
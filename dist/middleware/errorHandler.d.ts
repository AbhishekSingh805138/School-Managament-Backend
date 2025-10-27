import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    errorCode?: string;
    context?: any;
    constructor(message: string, statusCode?: number, errorCode?: string, context?: any);
}
export declare class AuthError extends AppError {
    attemptCount?: number;
    lockoutTime?: Date;
    ipAddress?: string;
    userAgent?: string;
    remainingAttempts?: number;
    constructor(message: string, statusCode?: number, errorCode?: string, context?: {
        attemptCount?: number;
        lockoutTime?: Date;
        ipAddress?: string;
        userAgent?: string;
        userId?: string;
        email?: string;
        remainingAttempts?: number;
    });
}
export declare const errorHandler: (error: Error, req: Request, res: Response, next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response) => void;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map
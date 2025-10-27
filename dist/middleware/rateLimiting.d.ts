import { Request, Response } from 'express';
export declare const generalRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const passwordResetRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const registrationRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const fileUploadRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const adminRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const speedLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const createCustomRateLimit: (options: {
    windowMs: number;
    max: number;
    message: string;
    errorCode?: string;
}) => import("express-rate-limit").RateLimitRequestHandler;
export declare const searchRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const reportRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const bulkOperationRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const rateLimitLogger: (req: Request, res: Response, next: any) => void;
//# sourceMappingURL=rateLimiting.d.ts.map
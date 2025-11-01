import { Request, Response, NextFunction } from 'express';
export declare const requestTimingMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const getRequestTimingStats: () => {
    totalRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    slowRequests: number;
    recentRequests: never[];
    slowRequestsPercentage?: undefined;
    slowestRequests?: undefined;
    byEndpoint?: undefined;
    byStatusCode?: undefined;
} | {
    totalRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    slowRequests: number;
    slowRequestsPercentage: number;
    recentRequests: {
        method: string;
        path: string;
        duration: number;
        statusCode: number;
        timestamp: Date;
    }[];
    slowestRequests: {
        method: string;
        path: string;
        duration: number;
        statusCode: number;
        timestamp: Date;
    }[];
    byEndpoint: {
        endpoint: string;
        count: number;
        avgDuration: number;
        maxDuration: number;
    }[];
    byStatusCode: {
        [key: number]: number;
    };
};
export declare const clearRequestTimings: () => void;
//# sourceMappingURL=requestTiming.d.ts.map
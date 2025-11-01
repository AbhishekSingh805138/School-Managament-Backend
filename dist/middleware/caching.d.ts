import { Request, Response, NextFunction } from 'express';
export declare const cacheResponse: (ttlSeconds?: number) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const invalidateCache: (patterns: string[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const cacheStats: (req: Request, res: Response) => Promise<void>;
export declare const clearCache: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=caching.d.ts.map
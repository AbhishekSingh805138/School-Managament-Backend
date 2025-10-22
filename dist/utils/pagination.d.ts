import { Request } from 'express';
export interface PaginationParams {
    page: number;
    limit: number;
    offset: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}
export declare const getPaginationParams: (req: Request, defaultSortBy?: string, columnMappings?: Record<string, string>) => PaginationParams;
//# sourceMappingURL=pagination.d.ts.map
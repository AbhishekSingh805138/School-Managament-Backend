import { Pool, PoolClient } from 'pg';
export declare const pool: Pool;
export declare const testConnection: () => Promise<boolean>;
export declare const query: (text: string, params?: any[]) => Promise<any>;
export declare const getClient: () => Promise<PoolClient>;
export declare const getPoolMetrics: () => {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
    maxPoolSize: number;
    minPoolSize: number;
    utilization: string;
};
export declare const closePool: () => Promise<void>;
export default pool;
//# sourceMappingURL=connection.d.ts.map
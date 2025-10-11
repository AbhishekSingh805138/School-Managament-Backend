import { Pool, PoolClient } from 'pg';
export declare const pool: Pool;
export declare const testConnection: () => Promise<boolean>;
export declare const query: (text: string, params?: any[]) => Promise<any>;
export declare const getClient: () => Promise<PoolClient>;
export declare const closePool: () => Promise<void>;
export default pool;
//# sourceMappingURL=connection.d.ts.map
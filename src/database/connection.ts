import { Pool, PoolClient } from 'pg';
import env from '../config/env';

// Database configuration with optimized pooling
const dbConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  
  // Connection Pool Optimization (Phase 3.1.3)
  max: 25, // Maximum number of clients (increased for production load)
  min: 5, // Minimum pool size to maintain (keep connections warm)
  idleTimeoutMillis: 60000, // Close idle clients after 60 seconds (increased from 30s)
  connectionTimeoutMillis: 10000, // Wait up to 10s for connection (increased for stability)
  
  // Query Timeout
  query_timeout: 30000, // 30 second timeout for queries (prevent hung queries)
  statement_timeout: 30000, // 30 second statement timeout
  
  // Connection Settings
  allowExitOnIdle: false, // Keep pool alive even when idle
  
  // Application Name (for monitoring)
  application_name: 'school_management_system',
};

// Create connection pool
export const pool = new Pool(dbConfig);

// Pool error handling
pool.on('error', (err: Error) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Pool events for monitoring (Phase 3.2 - Monitoring)
pool.on('connect', (client) => {
  if (env.NODE_ENV === 'development') {
    console.log('🔗 New client connected to database pool');
  }
});

pool.on('acquire', (client) => {
  if (env.NODE_ENV === 'development') {
    console.log('📥 Client acquired from pool');
  }
});

pool.on('remove', (client) => {
  if (env.NODE_ENV === 'development') {
    console.log('🗑️  Client removed from pool');
  }
});

// Database connection test
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    if (env.NODE_ENV !== 'test') {
      console.log('✅ Database connected successfully');
    }
    return true;
  } catch (error) {
    if (env.NODE_ENV !== 'test') {
      console.error('❌ Database connection failed:', error);
    }
    return false;
  }
};

// Execute query with connection from pool
export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (env.NODE_ENV !== 'test') {
      console.log('📊 Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    if (env.NODE_ENV !== 'test') {
      console.error('❌ Query error:', error);
    }
    throw error;
  }
};

// Get client from pool for transactions
export const getClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};

// Get pool metrics for monitoring
export const getPoolMetrics = () => {
  return {
    totalCount: pool.totalCount, // Total number of clients in pool
    idleCount: pool.idleCount, // Number of idle clients
    waitingCount: pool.waitingCount, // Number of queued requests waiting for a client
    maxPoolSize: dbConfig.max,
    minPoolSize: dbConfig.min,
    utilization: pool.totalCount > 0 ? ((pool.totalCount - pool.idleCount) / pool.totalCount * 100).toFixed(2) + '%' : '0%',
  };
};

// Graceful shutdown
export const closePool = async (): Promise<void> => {
  await pool.end();
  if (env.NODE_ENV !== 'test') {
    console.log('🔌 Database pool closed');
  }
};

export default pool;

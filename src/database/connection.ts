import { Pool, PoolClient } from 'pg';
import env from '../config/env';

// Database configuration
const dbConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Increase timeout to reduce spurious connection failures under load
};

// Create connection pool
export const pool = new Pool(dbConfig);

// Pool error handling
pool.on('error', (err: Error) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
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

// Graceful shutdown
export const closePool = async (): Promise<void> => {
  await pool.end();
  if (env.NODE_ENV !== 'test') {
    console.log('🔌 Database pool closed');
  }
};

export default pool;

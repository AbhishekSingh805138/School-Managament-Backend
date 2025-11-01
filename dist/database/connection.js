"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closePool = exports.getPoolMetrics = exports.getClient = exports.query = exports.testConnection = exports.pool = void 0;
const pg_1 = require("pg");
const env_1 = __importDefault(require("../config/env"));
const dbConfig = {
    host: env_1.default.DB_HOST,
    port: env_1.default.DB_PORT,
    database: env_1.default.DB_NAME,
    user: env_1.default.DB_USER,
    password: env_1.default.DB_PASSWORD,
    max: 25,
    min: 5,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 10000,
    query_timeout: 30000,
    statement_timeout: 30000,
    allowExitOnIdle: false,
    application_name: 'school_management_system',
};
exports.pool = new pg_1.Pool(dbConfig);
exports.pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
});
exports.pool.on('connect', (client) => {
    if (env_1.default.NODE_ENV === 'development') {
        console.log('🔗 New client connected to database pool');
    }
});
exports.pool.on('acquire', (client) => {
    if (env_1.default.NODE_ENV === 'development') {
        console.log('📥 Client acquired from pool');
    }
});
exports.pool.on('remove', (client) => {
    if (env_1.default.NODE_ENV === 'development') {
        console.log('🗑️  Client removed from pool');
    }
});
const testConnection = async () => {
    try {
        const client = await exports.pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        if (env_1.default.NODE_ENV !== 'test') {
            console.log('✅ Database connected successfully');
        }
        return true;
    }
    catch (error) {
        if (env_1.default.NODE_ENV !== 'test') {
            console.error('❌ Database connection failed:', error);
        }
        return false;
    }
};
exports.testConnection = testConnection;
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await exports.pool.query(text, params);
        const duration = Date.now() - start;
        if (env_1.default.NODE_ENV !== 'test') {
            console.log('📊 Executed query', { text, duration, rows: res.rowCount });
        }
        return res;
    }
    catch (error) {
        if (env_1.default.NODE_ENV !== 'test') {
            console.error('❌ Query error:', error);
        }
        throw error;
    }
};
exports.query = query;
const getClient = async () => {
    return await exports.pool.connect();
};
exports.getClient = getClient;
const getPoolMetrics = () => {
    return {
        totalCount: exports.pool.totalCount,
        idleCount: exports.pool.idleCount,
        waitingCount: exports.pool.waitingCount,
        maxPoolSize: dbConfig.max,
        minPoolSize: dbConfig.min,
        utilization: exports.pool.totalCount > 0 ? ((exports.pool.totalCount - exports.pool.idleCount) / exports.pool.totalCount * 100).toFixed(2) + '%' : '0%',
    };
};
exports.getPoolMetrics = getPoolMetrics;
const closePool = async () => {
    await exports.pool.end();
    if (env_1.default.NODE_ENV !== 'test') {
        console.log('🔌 Database pool closed');
    }
};
exports.closePool = closePool;
exports.default = exports.pool;
//# sourceMappingURL=connection.js.map
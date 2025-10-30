"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closePool = exports.getClient = exports.query = exports.testConnection = exports.pool = void 0;
const pg_1 = require("pg");
const env_1 = __importDefault(require("../config/env"));
const dbConfig = {
    host: env_1.default.DB_HOST,
    port: env_1.default.DB_PORT,
    database: env_1.default.DB_NAME,
    user: env_1.default.DB_USER,
    password: env_1.default.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
};
exports.pool = new pg_1.Pool(dbConfig);
exports.pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
});
const testConnection = async () => {
    try {
        const client = await exports.pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Database connected successfully');
        return true;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
};
exports.testConnection = testConnection;
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await exports.pool.query(text, params);
        const duration = Date.now() - start;
        console.log('📊 Executed query', { text, duration, rows: res.rowCount });
        return res;
    }
    catch (error) {
        console.error('❌ Query error:', error);
        throw error;
    }
};
exports.query = query;
const getClient = async () => {
    return await exports.pool.connect();
};
exports.getClient = getClient;
const closePool = async () => {
    await exports.pool.end();
    console.log('🔌 Database pool closed');
};
exports.closePool = closePool;
exports.default = exports.pool;
//# sourceMappingURL=connection.js.map
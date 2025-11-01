"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheTTL = exports.CacheKeys = exports.CacheService = exports.cacheService = void 0;
const redis_1 = require("redis");
const env_1 = __importDefault(require("../config/env"));
class CacheService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.isEnabled = env_1.default.REDIS_ENABLED;
        if (this.isEnabled) {
            this.initializeClient();
        }
        else {
            console.log('📦 Redis caching is disabled - using in-memory fallback');
        }
    }
    async initializeClient() {
        try {
            const redisConfig = {
                socket: {
                    host: env_1.default.REDIS_HOST,
                    port: env_1.default.REDIS_PORT,
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            console.error('❌ Redis max reconnection attempts reached');
                            return new Error('Max reconnection attempts reached');
                        }
                        return Math.min(retries * 100, 3000);
                    },
                },
                database: env_1.default.REDIS_DB,
            };
            if (env_1.default.REDIS_PASSWORD) {
                redisConfig.password = env_1.default.REDIS_PASSWORD;
            }
            this.client = (0, redis_1.createClient)(redisConfig);
            this.client.on('error', (err) => {
                console.error('❌ Redis Client Error:', err);
                this.isConnected = false;
            });
            this.client.on('connect', () => {
                console.log('🔗 Redis connecting...');
            });
            this.client.on('ready', () => {
                console.log('✅ Redis connected and ready');
                this.isConnected = true;
            });
            this.client.on('reconnecting', () => {
                console.log('🔄 Redis reconnecting...');
            });
            await this.client.connect();
        }
        catch (error) {
            console.error('❌ Failed to initialize Redis client:', error);
            this.isEnabled = false;
            this.isConnected = false;
        }
    }
    async get(key) {
        if (!this.isEnabled || !this.isConnected || !this.client) {
            return null;
        }
        try {
            const value = await this.client.get(key);
            if (!value)
                return null;
            return JSON.parse(value);
        }
        catch (error) {
            console.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        if (!this.isEnabled || !this.isConnected || !this.client) {
            return false;
        }
        try {
            const ttl = ttlSeconds || env_1.default.CACHE_TTL_SECONDS;
            const serialized = JSON.stringify(value);
            await this.client.setEx(key, ttl, serialized);
            return true;
        }
        catch (error) {
            console.error(`Cache set error for key ${key}:`, error);
            return false;
        }
    }
    async del(key) {
        if (!this.isEnabled || !this.isConnected || !this.client) {
            return false;
        }
        try {
            await this.client.del(key);
            return true;
        }
        catch (error) {
            console.error(`Cache delete error for key ${key}:`, error);
            return false;
        }
    }
    async delPattern(pattern) {
        if (!this.isEnabled || !this.isConnected || !this.client) {
            return 0;
        }
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length === 0)
                return 0;
            await this.client.del(keys);
            return keys.length;
        }
        catch (error) {
            console.error(`Cache delete pattern error for ${pattern}:`, error);
            return 0;
        }
    }
    async exists(key) {
        if (!this.isEnabled || !this.isConnected || !this.client) {
            return false;
        }
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            console.error(`Cache exists error for key ${key}:`, error);
            return false;
        }
    }
    async expire(key, ttlSeconds) {
        if (!this.isEnabled || !this.isConnected || !this.client) {
            return false;
        }
        try {
            await this.client.expire(key, ttlSeconds);
            return true;
        }
        catch (error) {
            console.error(`Cache expire error for key ${key}:`, error);
            return false;
        }
    }
    async mGet(keys) {
        if (!this.isEnabled || !this.isConnected || !this.client || keys.length === 0) {
            return keys.map(() => null);
        }
        try {
            const values = await this.client.mGet(keys);
            return values.map(value => value ? JSON.parse(value) : null);
        }
        catch (error) {
            console.error('Cache mGet error:', error);
            return keys.map(() => null);
        }
    }
    async incr(key) {
        if (!this.isEnabled || !this.isConnected || !this.client) {
            return 0;
        }
        try {
            return await this.client.incr(key);
        }
        catch (error) {
            console.error(`Cache incr error for key ${key}:`, error);
            return 0;
        }
    }
    async flushAll() {
        if (!this.isEnabled || !this.isConnected || !this.client) {
            return false;
        }
        try {
            await this.client.flushAll();
            console.log('🗑️  Cache cleared');
            return true;
        }
        catch (error) {
            console.error('Cache flush error:', error);
            return false;
        }
    }
    async getStats() {
        if (!this.isEnabled || !this.isConnected || !this.client) {
            return {
                enabled: false,
                connected: false,
            };
        }
        try {
            const info = await this.client.info('stats');
            const keyspace = await this.client.info('keyspace');
            return {
                enabled: true,
                connected: this.isConnected,
                host: env_1.default.REDIS_HOST,
                port: env_1.default.REDIS_PORT,
                database: env_1.default.REDIS_DB,
                info,
                keyspace,
            };
        }
        catch (error) {
            console.error('Cache stats error:', error);
            return {
                enabled: true,
                connected: false,
                error: 'Failed to get stats',
            };
        }
    }
    async disconnect() {
        if (this.client && this.isConnected) {
            await this.client.quit();
            this.isConnected = false;
            console.log('🔌 Redis disconnected');
        }
    }
    static generateKey(prefix, ...parts) {
        return `${prefix}:${parts.join(':')}`;
    }
    async cacheQuery(key, queryFn, ttlSeconds) {
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }
        const result = await queryFn();
        await this.set(key, result, ttlSeconds);
        return result;
    }
}
exports.CacheService = CacheService;
exports.cacheService = new CacheService();
exports.default = exports.cacheService;
exports.CacheKeys = {
    ACADEMIC_YEAR: 'academic_year',
    ACADEMIC_YEARS_ALL: 'academic_years:all',
    ACADEMIC_YEAR_ACTIVE: 'academic_year:active',
    SEMESTER: 'semester',
    SEMESTERS_ALL: 'semesters:all',
    SUBJECT: 'subject',
    SUBJECTS_ALL: 'subjects:all',
    SUBJECTS_ACTIVE: 'subjects:active',
    CLASS: 'class',
    CLASSES_ALL: 'classes:all',
    CLASSES_BY_YEAR: 'classes:year',
    STUDENT: 'student',
    STUDENTS_BY_CLASS: 'students:class',
    TEACHER: 'teacher',
    TEACHERS_ALL: 'teachers:all',
    TEACHER_WORKLOAD: 'teacher:workload',
    USER_SESSION: 'user:session',
    REPORT_ATTENDANCE: 'report:attendance',
    REPORT_GRADES: 'report:grades',
    REPORT_FEES: 'report:fees',
    ASSESSMENT_TYPES: 'assessment_types:all',
    STATS_ENROLLMENT: 'stats:enrollment',
    STATS_ATTENDANCE: 'stats:attendance',
    STATS_FEES: 'stats:fees',
};
exports.CacheTTL = {
    ONE_MINUTE: 60,
    FIVE_MINUTES: 300,
    TEN_MINUTES: 600,
    THIRTY_MINUTES: 1800,
    ONE_HOUR: 3600,
    ONE_DAY: 86400,
};
//# sourceMappingURL=cacheService.js.map
import { createClient, RedisClientType } from 'redis';
import env from '../config/env';

class CacheService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private isEnabled: boolean = env.REDIS_ENABLED;

  constructor() {
    if (this.isEnabled) {
      this.initializeClient();
    } else {
      console.log('📦 Redis caching is disabled - using in-memory fallback');
    }
  }

  private async initializeClient() {
    try {
      const redisConfig: any = {
        socket: {
          host: env.REDIS_HOST,
          port: env.REDIS_PORT,
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              console.error('❌ Redis max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          },
        },
        database: env.REDIS_DB,
      };

      if (env.REDIS_PASSWORD) {
        redisConfig.password = env.REDIS_PASSWORD;
      }

      this.client = createClient(redisConfig);

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
    } catch (error) {
      console.error('❌ Failed to initialize Redis client:', error);
      this.isEnabled = false;
      this.isConnected = false;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled || !this.isConnected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.isEnabled || !this.isConnected || !this.client) {
      return false;
    }

    try {
      const ttl = ttlSeconds || env.CACHE_TTL_SECONDS;
      const serialized = JSON.stringify(value);
      await this.client.setEx(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.isEnabled || !this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string): Promise<number> {
    if (!this.isEnabled || !this.isConnected || !this.client) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;
      await this.client.del(keys);
      return keys.length;
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isEnabled || !this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set TTL for existing key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.isEnabled || !this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.expire(key, ttlSeconds);
      return true;
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get multiple keys at once
   */
  async mGet<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.isEnabled || !this.isConnected || !this.client || keys.length === 0) {
      return keys.map(() => null);
    }

    try {
      const values = await this.client.mGet(keys);
      return values.map(value => value ? JSON.parse(value) as T : null);
    } catch (error) {
      console.error('Cache mGet error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Increment counter
   */
  async incr(key: string): Promise<number> {
    if (!this.isEnabled || !this.isConnected || !this.client) {
      return 0;
    }

    try {
      return await this.client.incr(key);
    } catch (error) {
      console.error(`Cache incr error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async flushAll(): Promise<boolean> {
    if (!this.isEnabled || !this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.flushAll();
      console.log('🗑️  Cache cleared');
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
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
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        database: env.REDIS_DB,
        info,
        keyspace,
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        enabled: true,
        connected: false,
        error: 'Failed to get stats',
      };
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log('🔌 Redis disconnected');
    }
  }

  /**
   * Helper method to generate cache keys
   */
  static generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  /**
   * Cache wrapper for database queries
   * Automatically handles caching logic
   */
  async cacheQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, execute query
    const result = await queryFn();

    // Store result in cache
    await this.set(key, result, ttlSeconds);

    return result;
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;

// Export the class for static methods
export { CacheService };

// Export cache key prefixes for consistency
export const CacheKeys = {
  // Academic structure (rarely changes - 1 hour TTL)
  ACADEMIC_YEAR: 'academic_year',
  ACADEMIC_YEARS_ALL: 'academic_years:all',
  ACADEMIC_YEAR_ACTIVE: 'academic_year:active',
  SEMESTER: 'semester',
  SEMESTERS_ALL: 'semesters:all',
  
  // Subjects (rarely changes - 1 hour TTL)
  SUBJECT: 'subject',
  SUBJECTS_ALL: 'subjects:all',
  SUBJECTS_ACTIVE: 'subjects:active',
  
  // Classes (cache for 5 minutes)
  CLASS: 'class',
  CLASSES_ALL: 'classes:all',
  CLASSES_BY_YEAR: 'classes:year',
  
  // Students (cache for 5 minutes)
  STUDENT: 'student',
  STUDENTS_BY_CLASS: 'students:class',
  
  // Teachers (cache for 10 minutes)
  TEACHER: 'teacher',
  TEACHERS_ALL: 'teachers:all',
  TEACHER_WORKLOAD: 'teacher:workload',
  
  // User sessions (cache for 1 hour)
  USER_SESSION: 'user:session',
  
  // Report cache (cache for 10 minutes)
  REPORT_ATTENDANCE: 'report:attendance',
  REPORT_GRADES: 'report:grades',
  REPORT_FEES: 'report:fees',
  
  // Assessment types (rarely changes - 1 hour TTL)
  ASSESSMENT_TYPES: 'assessment_types:all',
  
  // Stats and analytics (cache for 5 minutes)
  STATS_ENROLLMENT: 'stats:enrollment',
  STATS_ATTENDANCE: 'stats:attendance',
  STATS_FEES: 'stats:fees',
};

// Export TTL constants (in seconds)
export const CacheTTL = {
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  TEN_MINUTES: 600,
  THIRTY_MINUTES: 1800,
  ONE_HOUR: 3600,
  ONE_DAY: 86400,
};

declare class CacheService {
    private client;
    private isConnected;
    private isEnabled;
    constructor();
    private initializeClient;
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<boolean>;
    del(key: string): Promise<boolean>;
    delPattern(pattern: string): Promise<number>;
    exists(key: string): Promise<boolean>;
    expire(key: string, ttlSeconds: number): Promise<boolean>;
    mGet<T>(keys: string[]): Promise<(T | null)[]>;
    incr(key: string): Promise<number>;
    flushAll(): Promise<boolean>;
    getStats(): Promise<any>;
    disconnect(): Promise<void>;
    static generateKey(prefix: string, ...parts: (string | number)[]): string;
    cacheQuery<T>(key: string, queryFn: () => Promise<T>, ttlSeconds?: number): Promise<T>;
}
export declare const cacheService: CacheService;
export default cacheService;
export { CacheService };
export declare const CacheKeys: {
    ACADEMIC_YEAR: string;
    ACADEMIC_YEARS_ALL: string;
    ACADEMIC_YEAR_ACTIVE: string;
    SEMESTER: string;
    SEMESTERS_ALL: string;
    SUBJECT: string;
    SUBJECTS_ALL: string;
    SUBJECTS_ACTIVE: string;
    CLASS: string;
    CLASSES_ALL: string;
    CLASSES_BY_YEAR: string;
    STUDENT: string;
    STUDENTS_BY_CLASS: string;
    TEACHER: string;
    TEACHERS_ALL: string;
    TEACHER_WORKLOAD: string;
    USER_SESSION: string;
    REPORT_ATTENDANCE: string;
    REPORT_GRADES: string;
    REPORT_FEES: string;
    ASSESSMENT_TYPES: string;
    STATS_ENROLLMENT: string;
    STATS_ATTENDANCE: string;
    STATS_FEES: string;
};
export declare const CacheTTL: {
    ONE_MINUTE: number;
    FIVE_MINUTES: number;
    TEN_MINUTES: number;
    THIRTY_MINUTES: number;
    ONE_HOUR: number;
    ONE_DAY: number;
};
//# sourceMappingURL=cacheService.d.ts.map
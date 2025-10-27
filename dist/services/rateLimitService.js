"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitService = void 0;
const baseService_1 = require("./baseService");
const errorHandler_1 = require("../middleware/errorHandler");
class RateLimitService extends baseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.MAX_ATTEMPTS = 5;
        this.LOCKOUT_DURATION_MINUTES = 15;
        this.WINDOW_MINUTES = 15;
    }
    async recordLoginAttempt(attempt) {
        await this.executeQuery(`INSERT INTO login_attempts (email, ip_address, user_agent, success, attempted_at)
       VALUES ($1, $2, $3, $4, $5)`, [attempt.email, attempt.ipAddress, attempt.userAgent, attempt.success, attempt.attemptedAt]);
    }
    async checkRateLimit(email, ipAddress) {
        const windowStart = new Date(Date.now() - this.WINDOW_MINUTES * 60 * 1000);
        const emailAttempts = await this.executeQuery(`SELECT COUNT(*) as count, MAX(attempted_at) as last_attempt
       FROM login_attempts 
       WHERE email = $1 AND success = false AND attempted_at > $2`, [email, windowStart]);
        const ipAttempts = await this.executeQuery(`SELECT COUNT(*) as count, MAX(attempted_at) as last_attempt
       FROM login_attempts 
       WHERE ip_address = $1 AND success = false AND attempted_at > $2`, [ipAddress, windowStart]);
        const emailCount = parseInt(emailAttempts.rows[0].count);
        const ipCount = parseInt(ipAttempts.rows[0].count);
        const lastAttempt = emailAttempts.rows[0].last_attempt || ipAttempts.rows[0].last_attempt;
        if (emailCount >= this.MAX_ATTEMPTS || ipCount >= this.MAX_ATTEMPTS) {
            const lockoutEnd = new Date(new Date(lastAttempt).getTime() + this.LOCKOUT_DURATION_MINUTES * 60 * 1000);
            if (new Date() < lockoutEnd) {
                throw new errorHandler_1.AuthError(`Too many failed login attempts. Account is locked until ${lockoutEnd.toISOString()}`, 429, 'RATE_LIMITED', {
                    attemptCount: Math.max(emailCount, ipCount),
                    lockoutTime: lockoutEnd,
                    ipAddress,
                    email,
                });
            }
        }
        if (emailCount >= this.MAX_ATTEMPTS - 2 || ipCount >= this.MAX_ATTEMPTS - 2) {
            const remainingAttempts = this.MAX_ATTEMPTS - Math.max(emailCount, ipCount);
            throw new errorHandler_1.AuthError(`Warning: ${remainingAttempts} login attempts remaining before account lockout`, 401, 'APPROACHING_LIMIT', {
                attemptCount: Math.max(emailCount, ipCount),
                remainingAttempts,
                ipAddress,
                email,
            });
        }
    }
    async cleanupOldAttempts() {
        const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        await this.executeQuery('DELETE FROM login_attempts WHERE attempted_at < $1', [cutoffDate]);
    }
    async getLoginStats(timeframe = 'day') {
        let interval;
        switch (timeframe) {
            case 'hour':
                interval = '1 hour';
                break;
            case 'week':
                interval = '7 days';
                break;
            default:
                interval = '1 day';
        }
        const stats = await this.executeQuery(`SELECT 
         COUNT(*) as total_attempts,
         COUNT(*) FILTER (WHERE success = true) as successful_logins,
         COUNT(*) FILTER (WHERE success = false) as failed_attempts,
         COUNT(DISTINCT email) as unique_users,
         COUNT(DISTINCT ip_address) as unique_ips
       FROM login_attempts 
       WHERE attempted_at > NOW() - INTERVAL '${interval}'`);
        const topFailedEmails = await this.executeQuery(`SELECT email, COUNT(*) as failed_count
       FROM login_attempts 
       WHERE success = false AND attempted_at > NOW() - INTERVAL '${interval}'
       GROUP BY email
       ORDER BY failed_count DESC
       LIMIT 10`);
        const topFailedIPs = await this.executeQuery(`SELECT ip_address, COUNT(*) as failed_count
       FROM login_attempts 
       WHERE success = false AND attempted_at > NOW() - INTERVAL '${interval}'
       GROUP BY ip_address
       ORDER BY failed_count DESC
       LIMIT 10`);
        return {
            timeframe,
            summary: stats.rows[0],
            topFailedEmails: topFailedEmails.rows,
            topFailedIPs: topFailedIPs.rows,
        };
    }
    async detectSuspiciousActivity() {
        const suspiciousPatterns = [];
        const highFailureIPs = await this.executeQuery(`SELECT ip_address, COUNT(*) as attempts, 
              COUNT(*) FILTER (WHERE success = false) as failures,
              (COUNT(*) FILTER (WHERE success = false)::float / COUNT(*)) as failure_rate
       FROM login_attempts 
       WHERE attempted_at > NOW() - INTERVAL '1 hour'
       GROUP BY ip_address
       HAVING COUNT(*) > 10 AND (COUNT(*) FILTER (WHERE success = false)::float / COUNT(*)) > 0.8
       ORDER BY attempts DESC`);
        if (highFailureIPs.rows.length > 0) {
            suspiciousPatterns.push({
                type: 'HIGH_FAILURE_RATE_IP',
                description: 'IPs with high failure rates',
                data: highFailureIPs.rows,
            });
        }
        const rapidAttempts = await this.executeQuery(`SELECT ip_address, COUNT(*) as attempts,
              MIN(attempted_at) as first_attempt,
              MAX(attempted_at) as last_attempt
       FROM login_attempts 
       WHERE attempted_at > NOW() - INTERVAL '5 minutes'
       GROUP BY ip_address
       HAVING COUNT(*) > 20
       ORDER BY attempts DESC`);
        if (rapidAttempts.rows.length > 0) {
            suspiciousPatterns.push({
                type: 'RAPID_ATTEMPTS',
                description: 'IPs making rapid login attempts',
                data: rapidAttempts.rows,
            });
        }
        const accountEnumeration = await this.executeQuery(`SELECT ip_address, COUNT(DISTINCT email) as unique_emails, COUNT(*) as total_attempts
       FROM login_attempts 
       WHERE attempted_at > NOW() - INTERVAL '1 hour' AND success = false
       GROUP BY ip_address
       HAVING COUNT(DISTINCT email) > 10
       ORDER BY unique_emails DESC`);
        if (accountEnumeration.rows.length > 0) {
            suspiciousPatterns.push({
                type: 'ACCOUNT_ENUMERATION',
                description: 'Possible account enumeration attempts',
                data: accountEnumeration.rows,
            });
        }
        return suspiciousPatterns;
    }
}
exports.RateLimitService = RateLimitService;
//# sourceMappingURL=rateLimitService.js.map
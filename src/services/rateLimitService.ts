import { BaseService } from './baseService';
import { AuthError } from '../middleware/errorHandler';

interface LoginAttempt {
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  attemptedAt: Date;
}

export class RateLimitService extends BaseService {
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 15;
  private readonly WINDOW_MINUTES = 15;

  // Record a login attempt
  async recordLoginAttempt(attempt: LoginAttempt): Promise<void> {
    await this.executeQuery(
      `INSERT INTO login_attempts (email, ip_address, user_agent, success, attempted_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [attempt.email, attempt.ipAddress, attempt.userAgent, attempt.success, attempt.attemptedAt]
    );
  }

  // Check if user/IP is rate limited
  async checkRateLimit(email: string, ipAddress: string): Promise<void> {
    const windowStart = new Date(Date.now() - this.WINDOW_MINUTES * 60 * 1000);

    // Check failed attempts by email in the time window
    const emailAttempts = await this.executeQuery(
      `SELECT COUNT(*) as count, MAX(attempted_at) as last_attempt
       FROM login_attempts 
       WHERE email = $1 AND success = false AND attempted_at > $2`,
      [email, windowStart]
    );

    // Check failed attempts by IP in the time window
    const ipAttempts = await this.executeQuery(
      `SELECT COUNT(*) as count, MAX(attempted_at) as last_attempt
       FROM login_attempts 
       WHERE ip_address = $1 AND success = false AND attempted_at > $2`,
      [ipAddress, windowStart]
    );

    const emailCount = parseInt(emailAttempts.rows[0].count);
    const ipCount = parseInt(ipAttempts.rows[0].count);
    const lastAttempt = emailAttempts.rows[0].last_attempt || ipAttempts.rows[0].last_attempt;

    // Check if either email or IP has exceeded the limit
    if (emailCount >= this.MAX_ATTEMPTS || ipCount >= this.MAX_ATTEMPTS) {
      const lockoutEnd = new Date(new Date(lastAttempt).getTime() + this.LOCKOUT_DURATION_MINUTES * 60 * 1000);
      
      if (new Date() < lockoutEnd) {
        throw new AuthError(
          `Too many failed login attempts. Account is locked until ${lockoutEnd.toISOString()}`,
          429,
          'RATE_LIMITED',
          {
            attemptCount: Math.max(emailCount, ipCount),
            lockoutTime: lockoutEnd,
            ipAddress,
            email,
          }
        );
      }
    }

    // Warn if approaching limit
    if (emailCount >= this.MAX_ATTEMPTS - 2 || ipCount >= this.MAX_ATTEMPTS - 2) {
      const remainingAttempts = this.MAX_ATTEMPTS - Math.max(emailCount, ipCount);
      throw new AuthError(
        `Warning: ${remainingAttempts} login attempts remaining before account lockout`,
        401,
        'APPROACHING_LIMIT',
        {
          attemptCount: Math.max(emailCount, ipCount),
          remainingAttempts,
          ipAddress,
          email,
        }
      );
    }
  }

  // Clean up old login attempts (should be run periodically)
  async cleanupOldAttempts(): Promise<void> {
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    await this.executeQuery(
      'DELETE FROM login_attempts WHERE attempted_at < $1',
      [cutoffDate]
    );
  }

  // Get login attempt statistics for monitoring
  async getLoginStats(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<any> {
    let interval: string;
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

    const stats = await this.executeQuery(
      `SELECT 
         COUNT(*) as total_attempts,
         COUNT(*) FILTER (WHERE success = true) as successful_logins,
         COUNT(*) FILTER (WHERE success = false) as failed_attempts,
         COUNT(DISTINCT email) as unique_users,
         COUNT(DISTINCT ip_address) as unique_ips
       FROM login_attempts 
       WHERE attempted_at > NOW() - INTERVAL '${interval}'`
    );

    const topFailedEmails = await this.executeQuery(
      `SELECT email, COUNT(*) as failed_count
       FROM login_attempts 
       WHERE success = false AND attempted_at > NOW() - INTERVAL '${interval}'
       GROUP BY email
       ORDER BY failed_count DESC
       LIMIT 10`
    );

    const topFailedIPs = await this.executeQuery(
      `SELECT ip_address, COUNT(*) as failed_count
       FROM login_attempts 
       WHERE success = false AND attempted_at > NOW() - INTERVAL '${interval}'
       GROUP BY ip_address
       ORDER BY failed_count DESC
       LIMIT 10`
    );

    return {
      timeframe,
      summary: stats.rows[0],
      topFailedEmails: topFailedEmails.rows,
      topFailedIPs: topFailedIPs.rows,
    };
  }

  // Check for suspicious activity patterns
  async detectSuspiciousActivity(): Promise<any[]> {
    const suspiciousPatterns = [];

    // Pattern 1: High failure rate from single IP
    const highFailureIPs = await this.executeQuery(
      `SELECT ip_address, COUNT(*) as attempts, 
              COUNT(*) FILTER (WHERE success = false) as failures,
              (COUNT(*) FILTER (WHERE success = false)::float / COUNT(*)) as failure_rate
       FROM login_attempts 
       WHERE attempted_at > NOW() - INTERVAL '1 hour'
       GROUP BY ip_address
       HAVING COUNT(*) > 10 AND (COUNT(*) FILTER (WHERE success = false)::float / COUNT(*)) > 0.8
       ORDER BY attempts DESC`
    );

    if (highFailureIPs.rows.length > 0) {
      suspiciousPatterns.push({
        type: 'HIGH_FAILURE_RATE_IP',
        description: 'IPs with high failure rates',
        data: highFailureIPs.rows,
      });
    }

    // Pattern 2: Rapid attempts from single IP
    const rapidAttempts = await this.executeQuery(
      `SELECT ip_address, COUNT(*) as attempts,
              MIN(attempted_at) as first_attempt,
              MAX(attempted_at) as last_attempt
       FROM login_attempts 
       WHERE attempted_at > NOW() - INTERVAL '5 minutes'
       GROUP BY ip_address
       HAVING COUNT(*) > 20
       ORDER BY attempts DESC`
    );

    if (rapidAttempts.rows.length > 0) {
      suspiciousPatterns.push({
        type: 'RAPID_ATTEMPTS',
        description: 'IPs making rapid login attempts',
        data: rapidAttempts.rows,
      });
    }

    // Pattern 3: Multiple failed attempts on different accounts from same IP
    const accountEnumeration = await this.executeQuery(
      `SELECT ip_address, COUNT(DISTINCT email) as unique_emails, COUNT(*) as total_attempts
       FROM login_attempts 
       WHERE attempted_at > NOW() - INTERVAL '1 hour' AND success = false
       GROUP BY ip_address
       HAVING COUNT(DISTINCT email) > 10
       ORDER BY unique_emails DESC`
    );

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
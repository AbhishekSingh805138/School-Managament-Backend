import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Application, Request, Response, NextFunction } from 'express';

export class MonitoringService {
  private static instance: MonitoringService;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Initialize Sentry for error tracking
   */
  public initializeSentry(app: Application): void {
    const sentryDsn = process.env.SENTRY_DSN;
    const environment = process.env.NODE_ENV || 'development';

    if (!sentryDsn) {
      console.log('⚠️  Sentry DSN not configured - Error tracking disabled');
      console.log('   Set SENTRY_DSN in .env to enable error tracking');
      return;
    }

    try {
      Sentry.init({
        dsn: sentryDsn,
        environment,
        integrations: [
          // Enable profiling
          nodeProfilingIntegration(),
        ],
        // Performance Monitoring
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
        // Profiling
        profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
        // Release tracking
        release: process.env.npm_package_version,
        // Before send hook to filter sensitive data
        beforeSend(event, hint) {
          // Remove sensitive data
          if (event.request) {
            delete event.request.cookies;
            if (event.request.headers) {
              delete event.request.headers.authorization;
              delete event.request.headers.cookie;
            }
          }
          return event;
        },
      });

      this.isInitialized = true;
      console.log('✅ Sentry error tracking initialized');
      console.log(`   Environment: ${environment}`);
      console.log(`   Traces Sample Rate: ${environment === 'production' ? '10%' : '100%'}`);
    } catch (error) {
      console.error('❌ Failed to initialize Sentry:', error);
    }
  }

  /**
   * Get Sentry request handler middleware
   */
  public getRequestHandler() {
    if (!this.isInitialized) {
      return (req: Request, res: Response, next: NextFunction) => next();
    }
    // Sentry v8 doesn't use Handlers anymore, return passthrough
    return (req: Request, res: Response, next: NextFunction) => next();
  }

  /**
   * Get Sentry tracing middleware
   */
  public getTracingHandler() {
    if (!this.isInitialized) {
      return (req: Request, res: Response, next: NextFunction) => next();
    }
    // Sentry v8 doesn't use Handlers anymore, return passthrough
    return (req: Request, res: Response, next: NextFunction) => next();
  }

  /**
   * Get Sentry error handler middleware
   */
  public getErrorHandler() {
    if (!this.isInitialized) {
      return (err: Error, req: Request, res: Response, next: NextFunction) => next(err);
    }
    // Sentry v8 doesn't use Handlers anymore, return passthrough
    return (err: Error, req: Request, res: Response, next: NextFunction) => next(err);
  }

  /**
   * Capture exception manually
   */
  public captureException(error: Error, context?: any): void {
    if (!this.isInitialized) {
      console.error('Error (Sentry not initialized):', error);
      return;
    }

    Sentry.captureException(error, {
      extra: context,
    });
  }

  /**
   * Capture message
   */
  public captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: any): void {
    if (!this.isInitialized) {
      console.log(`Message (Sentry not initialized): ${message}`);
      return;
    }

    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  }

  /**
   * Set user context
   */
  public setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.isInitialized) return;

    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  }

  /**
   * Clear user context
   */
  public clearUser(): void {
    if (!this.isInitialized) return;
    Sentry.setUser(null);
  }

  /**
   * Add breadcrumb
   */
  public addBreadcrumb(message: string, category: string, data?: any): void {
    if (!this.isInitialized) return;

    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }

  /**
   * Start transaction for performance monitoring
   */
  public startTransaction(name: string, op: string): any {
    if (!this.isInitialized) return null;

    // Sentry v8 uses startSpan instead of startTransaction
    return Sentry.startSpan({
      name,
      op,
    }, (span) => span);
  }

  /**
   * Check if monitoring is initialized
   */
  public isMonitoringEnabled(): boolean {
    return this.isInitialized;
  }
}

export const monitoringService = MonitoringService.getInstance();

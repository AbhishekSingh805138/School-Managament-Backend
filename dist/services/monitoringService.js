"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringService = exports.MonitoringService = void 0;
const Sentry = __importStar(require("@sentry/node"));
const profiling_node_1 = require("@sentry/profiling-node");
class MonitoringService {
    constructor() {
        this.isInitialized = false;
    }
    static getInstance() {
        if (!MonitoringService.instance) {
            MonitoringService.instance = new MonitoringService();
        }
        return MonitoringService.instance;
    }
    initializeSentry(app) {
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
                    (0, profiling_node_1.nodeProfilingIntegration)(),
                ],
                tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
                profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
                release: process.env.npm_package_version,
                beforeSend(event, hint) {
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
        }
        catch (error) {
            console.error('❌ Failed to initialize Sentry:', error);
        }
    }
    getRequestHandler() {
        if (!this.isInitialized) {
            return (req, res, next) => next();
        }
        return (req, res, next) => next();
    }
    getTracingHandler() {
        if (!this.isInitialized) {
            return (req, res, next) => next();
        }
        return (req, res, next) => next();
    }
    getErrorHandler() {
        if (!this.isInitialized) {
            return (err, req, res, next) => next(err);
        }
        return (err, req, res, next) => next(err);
    }
    captureException(error, context) {
        if (!this.isInitialized) {
            console.error('Error (Sentry not initialized):', error);
            return;
        }
        Sentry.captureException(error, {
            extra: context,
        });
    }
    captureMessage(message, level = 'info', context) {
        if (!this.isInitialized) {
            console.log(`Message (Sentry not initialized): ${message}`);
            return;
        }
        Sentry.captureMessage(message, {
            level,
            extra: context,
        });
    }
    setUser(user) {
        if (!this.isInitialized)
            return;
        Sentry.setUser({
            id: user.id,
            email: user.email,
            username: user.username,
        });
    }
    clearUser() {
        if (!this.isInitialized)
            return;
        Sentry.setUser(null);
    }
    addBreadcrumb(message, category, data) {
        if (!this.isInitialized)
            return;
        Sentry.addBreadcrumb({
            message,
            category,
            data,
            level: 'info',
        });
    }
    startTransaction(name, op) {
        if (!this.isInitialized)
            return null;
        return Sentry.startSpan({
            name,
            op,
        }, (span) => span);
    }
    isMonitoringEnabled() {
        return this.isInitialized;
    }
}
exports.MonitoringService = MonitoringService;
exports.monitoringService = MonitoringService.getInstance();
//# sourceMappingURL=monitoringService.js.map
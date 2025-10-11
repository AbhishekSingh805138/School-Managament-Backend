"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = __importDefault(require("./config/env"));
const connection_1 = require("./database/connection");
const startServer = async () => {
    try {
        const dbConnected = await (0, connection_1.testConnection)();
        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Exiting...');
            process.exit(1);
        }
        const server = app_1.default.listen(env_1.default.PORT, () => {
            console.log(`🚀 Server running on port ${env_1.default.PORT}`);
            console.log(`📝 Environment: ${env_1.default.NODE_ENV}`);
            console.log(`🔗 Health check: http://localhost:${env_1.default.PORT}/health`);
            console.log(`📚 API docs: http://localhost:${env_1.default.PORT}/api/v1`);
        });
        const gracefulShutdown = (signal) => {
            console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
            server.close(async () => {
                console.log('🔌 HTTP server closed');
                try {
                    await (0, connection_1.closePool)();
                    console.log('✅ Graceful shutdown completed');
                    process.exit(0);
                }
                catch (error) {
                    console.error('❌ Error during shutdown:', error);
                    process.exit(1);
                }
            });
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});
startServer();
//# sourceMappingURL=index.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = __importDefault(require("./config/env"));
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: env_1.default.CORS_ORIGIN,
    credentials: true,
}));
app.use((0, morgan_1.default)(env_1.default.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: env_1.default.NODE_ENV,
    });
});
app.post('/test', (req, res) => {
    console.log('Test endpoint - Headers:', req.headers);
    console.log('Test endpoint - Body:', req.body);
    res.json({
        success: true,
        message: 'Test endpoint working',
        receivedBody: req.body,
        contentType: req.headers['content-type'],
    });
});
app.use('/api/v1/auth', auth_1.default);
app.use('/api/v1/users', users_1.default);
app.get('/api/v1', (req, res) => {
    res.json({
        success: true,
        message: 'School Management API v1',
        endpoints: {
            auth: '/api/v1/auth',
            users: '/api/v1/users',
            students: '/api/v1/students',
            classes: '/api/v1/classes',
        },
    });
});
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map
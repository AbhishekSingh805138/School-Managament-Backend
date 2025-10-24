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
const academicYears_1 = __importDefault(require("./routes/academicYears"));
const semesters_1 = __importDefault(require("./routes/semesters"));
const subjects_1 = __importDefault(require("./routes/subjects"));
const classes_1 = __importDefault(require("./routes/classes"));
const students_1 = __importDefault(require("./routes/students"));
const parents_1 = __importDefault(require("./routes/parents"));
const teachers_1 = __importDefault(require("./routes/teachers"));
const attendance_1 = __importDefault(require("./routes/attendance"));
const attendanceReports_1 = __importDefault(require("./routes/attendanceReports"));
const fees_1 = __importDefault(require("./routes/fees"));
const payments_1 = __importDefault(require("./routes/payments"));
const feeReports_1 = __importDefault(require("./routes/feeReports"));
const grades_1 = __importDefault(require("./routes/grades"));
const assessmentTypes_1 = __importDefault(require("./routes/assessmentTypes"));
const reportCards_1 = __importDefault(require("./routes/reportCards"));
const staff_1 = __importDefault(require("./routes/staff"));
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
app.use('/api/v1/academic-years', academicYears_1.default);
app.use('/api/v1/semesters', semesters_1.default);
app.use('/api/v1/subjects', subjects_1.default);
app.use('/api/v1/classes', classes_1.default);
app.use('/api/v1/students', students_1.default);
app.use('/api/v1/parents', parents_1.default);
app.use('/api/v1/teachers', teachers_1.default);
app.use('/api/v1/attendance', attendance_1.default);
app.use('/api/v1/attendance-reports', attendanceReports_1.default);
app.use('/api/v1/fees', fees_1.default);
app.use('/api/v1/payments', payments_1.default);
app.use('/api/v1/fee-reports', feeReports_1.default);
app.use('/api/v1/grades', grades_1.default);
app.use('/api/v1/assessment-types', assessmentTypes_1.default);
app.use('/api/v1/report-cards', reportCards_1.default);
app.use('/api/v1/staff', staff_1.default);
app.get('/api/v1', (req, res) => {
    res.json({
        success: true,
        message: 'School Management API v1',
        endpoints: {
            auth: '/api/v1/auth',
            users: '/api/v1/users',
            academicYears: '/api/v1/academic-years',
            semesters: '/api/v1/semesters',
            subjects: '/api/v1/subjects',
            classes: '/api/v1/classes',
            students: '/api/v1/students',
            parents: '/api/v1/parents',
            teachers: '/api/v1/teachers',
            attendance: '/api/v1/attendance',
            attendanceReports: '/api/v1/attendance-reports',
            fees: '/api/v1/fees',
            payments: '/api/v1/payments',
            feeReports: '/api/v1/fee-reports',
            grades: '/api/v1/grades',
            assessmentTypes: '/api/v1/assessment-types',
            reportCards: '/api/v1/report-cards',
            staff: '/api/v1/staff',
            reports: '/api/v1/reports',
        },
    });
});
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map
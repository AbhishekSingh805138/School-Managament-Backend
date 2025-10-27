"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const auditLogger_1 = require("../middleware/auditLogger");
const auditController_1 = require("../controllers/auditController");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)('admin'));
router.get('/logs', (0, auditLogger_1.auditMiddleware)('AUDIT_ACCESS', 'audit_logs'), auditController_1.getAuditLogs);
router.get('/stats', (0, auditLogger_1.auditMiddleware)('AUDIT_ACCESS', 'audit_stats'), auditController_1.getAuditStats);
router.get('/alerts', (0, auditLogger_1.auditMiddleware)('AUDIT_ACCESS', 'security_alerts'), auditController_1.getSecurityAlerts);
exports.default = router;
//# sourceMappingURL=audit.js.map
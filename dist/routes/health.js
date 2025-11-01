"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const healthController_1 = require("../controllers/healthController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', healthController_1.healthCheck);
router.get('/live', healthController_1.livenessCheck);
router.get('/ready', healthController_1.readinessCheck);
router.get('/detailed', auth_1.authenticate, (0, auth_1.authorize)('admin'), healthController_1.healthCheckDetailed);
router.get('/database', auth_1.authenticate, (0, auth_1.authorize)('admin'), healthController_1.databaseStats);
exports.default = router;
//# sourceMappingURL=health.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const monitoringController_1 = require("../controllers/monitoringController");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)('admin'));
router.get('/dashboard', monitoringController_1.getMonitoringDashboard);
router.get('/requests', monitoringController_1.getRequestStats);
router.delete('/requests', monitoringController_1.clearRequestStats);
router.get('/system', monitoringController_1.getSystemMetrics);
router.get('/database', monitoringController_1.getDatabaseMetrics);
router.get('/cache', monitoringController_1.getCacheMetrics);
router.post('/test-error', monitoringController_1.testErrorTracking);
exports.default = router;
//# sourceMappingURL=monitoring.js.map
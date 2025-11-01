"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const caching_1 = require("../middleware/caching");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)('admin'));
router.get('/stats', caching_1.cacheStats);
router.post('/clear', caching_1.clearCache);
exports.default = router;
//# sourceMappingURL=cache.js.map
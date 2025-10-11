"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const user_1 = require("../types/user");
const router = (0, express_1.Router)();
router.post('/register', (0, validation_1.validateBody)(user_1.CreateUserSchema), authController_1.register);
router.post('/login', (0, validation_1.validateBody)(user_1.LoginSchema), authController_1.login);
router.get('/profile', auth_1.authenticate, authController_1.getProfile);
exports.default = router;
//# sourceMappingURL=auth.js.map
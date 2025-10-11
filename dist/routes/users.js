"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const user_1 = require("../types/user");
const common_1 = require("../types/common");
const common_2 = require("../types/common");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', (0, auth_1.authorize)('admin'), (0, validation_1.validateQuery)(common_1.PaginationSchema), userController_1.getUsers);
router.get('/:id', (0, validation_1.validateParams)(zod_1.z.object({ id: common_2.IdSchema })), userController_1.getUserById);
router.put('/:id', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_2.IdSchema })), (0, validation_1.validateBody)(user_1.UpdateUserSchema), userController_1.updateUser);
router.delete('/:id', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_2.IdSchema })), userController_1.deleteUser);
exports.default = router;
//# sourceMappingURL=users.js.map
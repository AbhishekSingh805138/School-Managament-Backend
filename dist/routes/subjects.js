"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subjectController_1 = require("../controllers/subjectController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const academic_1 = require("../types/academic");
const common_1 = require("../types/common");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', (0, auth_1.authorize)('admin'), (0, validation_1.validateBody)(academic_1.CreateSubjectSchema), subjectController_1.createSubject);
router.get('/', (0, validation_1.validateQuery)(common_1.PaginationSchema.extend({
    isActive: zod_1.z.string().optional().transform(val => val === 'true'),
    search: zod_1.z.string().optional(),
})), subjectController_1.getSubjects);
router.get('/:id', (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), subjectController_1.getSubjectById);
router.get('/:id/statistics', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), subjectController_1.getSubjectStatistics);
router.put('/:id', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, validation_1.validateBody)(academic_1.UpdateSubjectSchema), subjectController_1.updateSubject);
router.patch('/:id/status', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, validation_1.validateBody)(zod_1.z.object({
    isActive: zod_1.z.boolean(),
})), subjectController_1.toggleSubjectStatus);
router.delete('/:id', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), subjectController_1.deleteSubject);
exports.default = router;
//# sourceMappingURL=subjects.js.map
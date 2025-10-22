"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const semesterController_1 = require("../controllers/semesterController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const academic_1 = require("../types/academic");
const common_1 = require("../types/common");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', (0, auth_1.authorize)('admin'), (0, validation_1.validateBody)(academic_1.CreateSemesterSchema), semesterController_1.createSemester);
router.get('/', (0, validation_1.validateQuery)(common_1.PaginationSchema.extend({
    academicYearId: common_1.IdSchema.optional(),
    isActive: zod_1.z.string().optional().transform(val => val === 'true'),
})), semesterController_1.getSemesters);
router.get('/active', (0, validation_1.validateQuery)(zod_1.z.object({
    academicYearId: common_1.IdSchema.optional(),
})), semesterController_1.getActiveSemester);
router.get('/:id', (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), semesterController_1.getSemesterById);
router.put('/:id', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, validation_1.validateBody)(academic_1.UpdateSemesterSchema), semesterController_1.updateSemester);
router.delete('/:id', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), semesterController_1.deleteSemester);
exports.default = router;
//# sourceMappingURL=semesters.js.map
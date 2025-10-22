"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const academicYearController_1 = require("../controllers/academicYearController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const academic_1 = require("../types/academic");
const common_1 = require("../types/common");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', (0, auth_1.authorize)('admin'), (0, validation_1.validateBody)(academic_1.CreateAcademicYearSchema), academicYearController_1.createAcademicYear);
router.get('/', (0, validation_1.validateQuery)(common_1.PaginationSchema.extend({
    isActive: zod_1.z.string().optional().transform(val => val === 'true'),
})), academicYearController_1.getAcademicYears);
router.get('/active', academicYearController_1.getActiveAcademicYear);
router.get('/:id', (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), academicYearController_1.getAcademicYearById);
router.put('/:id', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, validation_1.validateBody)(academic_1.UpdateAcademicYearSchema), academicYearController_1.updateAcademicYear);
router.delete('/:id', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), academicYearController_1.deleteAcademicYear);
exports.default = router;
//# sourceMappingURL=academicYears.js.map
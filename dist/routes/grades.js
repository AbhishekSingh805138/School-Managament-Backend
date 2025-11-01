"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gradeController_1 = require("../controllers/gradeController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const caching_1 = require("../middleware/caching");
const grade_1 = require("../types/grade");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateBody)(grade_1.CreateGradeSchema), (0, caching_1.invalidateCache)(['report:grades*', 'stats:*']), gradeController_1.createGrade);
router.get('/', (0, validation_1.validateQuery)(grade_1.GradeQuerySchema), (0, caching_1.cacheResponse)(300), gradeController_1.getGrades);
router.get('/:id', gradeController_1.getGradeById);
router.put('/:id', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateBody)(grade_1.UpdateGradeSchema), gradeController_1.updateGrade);
router.delete('/:id', (0, auth_1.authorize)('admin', 'teacher'), gradeController_1.deleteGrade);
exports.default = router;
//# sourceMappingURL=grades.js.map
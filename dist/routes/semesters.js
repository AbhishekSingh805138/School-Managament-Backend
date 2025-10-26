"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const semesterController_1 = require("../controllers/semesterController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/current', semesterController_1.getCurrentSemester);
router.get('/', semesterController_1.getSemesters);
router.get('/:id', semesterController_1.getSemesterById);
router.post('/', (0, auth_1.authorize)('admin'), semesterController_1.createSemester);
router.put('/:id', (0, auth_1.authorize)('admin'), semesterController_1.updateSemester);
router.delete('/:id', (0, auth_1.authorize)('admin'), semesterController_1.deleteSemester);
exports.default = router;
//# sourceMappingURL=semesters.js.map
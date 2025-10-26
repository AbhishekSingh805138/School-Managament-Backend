"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subjectController_1 = require("../controllers/subjectController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', subjectController_1.getSubjects);
router.get('/:id', subjectController_1.getSubjectById);
router.get('/:id/statistics', (0, auth_1.authorize)('admin', 'teacher'), subjectController_1.getSubjectStatistics);
router.post('/', (0, auth_1.authorize)('admin'), subjectController_1.createSubject);
router.put('/:id', (0, auth_1.authorize)('admin'), subjectController_1.updateSubject);
router.patch('/:id/status', (0, auth_1.authorize)('admin'), subjectController_1.toggleSubjectStatus);
router.delete('/:id', (0, auth_1.authorize)('admin'), subjectController_1.deleteSubject);
exports.default = router;
//# sourceMappingURL=subjects.js.map
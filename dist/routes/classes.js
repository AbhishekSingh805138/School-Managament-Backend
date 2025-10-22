"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const classController_1 = require("../controllers/classController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const class_1 = require("../types/class");
const academic_1 = require("../types/academic");
const common_1 = require("../types/common");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', (0, auth_1.authorize)('admin'), (0, validation_1.validateBody)(class_1.CreateClassSchema), classController_1.createClass);
router.get('/', (0, validation_1.validateQuery)(common_1.PaginationSchema.extend({
    academicYearId: common_1.IdSchema.optional(),
    grade: zod_1.z.string().optional(),
    isActive: zod_1.z.string().optional().transform(val => val === 'true'),
    search: zod_1.z.string().optional(),
})), classController_1.getClasses);
router.get('/:id', (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), classController_1.getClassById);
router.get('/:id/statistics', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), classController_1.getClassStatistics);
router.put('/:id', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, validation_1.validateBody)(class_1.UpdateClassSchema), classController_1.updateClass);
router.delete('/:id', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), classController_1.deleteClass);
router.post('/:id/subjects', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, validation_1.validateBody)(academic_1.CreateClassSubjectSchema.omit({ classId: true })), classController_1.assignSubjectToClass);
router.delete('/:id/subjects/:subjectId', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({
    id: common_1.IdSchema,
    subjectId: common_1.IdSchema,
})), classController_1.removeSubjectFromClass);
router.get('/:id/students', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), classController_1.getClassStudents);
router.get('/:id/subjects', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), classController_1.getClassSubjects);
router.get('/:id/roster', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, validation_1.validateQuery)(class_1.ClassRosterQuerySchema), classController_1.getClassRoster);
router.get('/:id/teachers', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), classController_1.getClassTeacherAssignments);
router.put('/:id/teacher', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, validation_1.validateBody)(class_1.UpdateClassTeacherSchema), classController_1.updateClassTeacher);
router.get('/:id/enrollment-history', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, validation_1.validateQuery)(class_1.ClassEnrollmentHistoryQuerySchema), classController_1.getClassEnrollmentHistory);
router.get('/:id/validate-capacity', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, validation_1.validateQuery)(zod_1.z.object({
    proposedEnrollment: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 0),
})), classController_1.validateClassCapacity);
router.get('/:id/capacity', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), classController_1.getClassCapacity);
router.post('/:id/enroll', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, validation_1.validateBody)(class_1.EnrollStudentSchema), classController_1.enrollStudentToClass);
router.post('/:id/enroll/bulk', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, validation_1.validateBody)(class_1.BulkEnrollStudentsSchema), classController_1.bulkEnrollStudentsToClass);
router.post('/transfer', (0, auth_1.authorize)('admin'), (0, validation_1.validateBody)(class_1.TransferStudentSchema), classController_1.transferStudent);
exports.default = router;
//# sourceMappingURL=classes.js.map
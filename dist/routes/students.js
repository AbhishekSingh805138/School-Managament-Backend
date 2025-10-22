"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const studentController_1 = require("../controllers/studentController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const student_1 = require("../types/student");
const common_1 = require("../types/common");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', (0, auth_1.authorize)('admin'), (0, validation_1.validateBody)(student_1.CreateStudentSchema), studentController_1.createStudent);
router.get('/', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateQuery)(student_1.StudentQuerySchema), studentController_1.getStudents);
router.get('/:id', (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), studentController_1.getStudentById);
router.get('/:id/summary', (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), studentController_1.getStudentSummary);
router.get('/:id/class-history', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), studentController_1.getStudentClassHistory);
router.get('/class/:classId', (0, auth_1.authorize)('admin', 'teacher'), (0, validation_1.validateParams)(zod_1.z.object({ classId: common_1.IdSchema })), (0, validation_1.validateQuery)(zod_1.z.object({
    page: zod_1.z.string().optional().default('1'),
    limit: zod_1.z.string().optional().default('50'),
})), studentController_1.getStudentsByClass);
router.patch('/bulk-update', (0, auth_1.authorize)('admin'), (0, validation_1.validateBody)(zod_1.z.object({
    studentIds: zod_1.z.array(common_1.IdSchema).min(1, 'At least one student ID is required'),
    updateData: zod_1.z.object({
        firstName: zod_1.z.string().optional(),
        lastName: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        classId: common_1.IdSchema.optional(),
        guardianName: zod_1.z.string().optional(),
        guardianPhone: zod_1.z.string().optional(),
    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field to update is required',
    }),
})), studentController_1.bulkUpdateStudents);
router.put('/:id', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), (0, validation_1.validateBody)(student_1.UpdateStudentSchema), studentController_1.updateStudent);
router.delete('/:id', (0, auth_1.authorize)('admin'), (0, validation_1.validateParams)(zod_1.z.object({ id: common_1.IdSchema })), studentController_1.deleteStudent);
exports.default = router;
//# sourceMappingURL=students.js.map
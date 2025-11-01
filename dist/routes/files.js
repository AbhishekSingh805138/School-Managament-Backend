"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const fileController_1 = require("../controllers/fileController");
const fileUpload_1 = require("../middleware/fileUpload");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.post('/upload', (0, fileUpload_1.uploadMultiple)('files'), fileController_1.uploadFiles);
router.post('/upload-single', (0, fileUpload_1.uploadSingle)('file'), fileController_1.uploadFiles);
router.post('/profile-picture', fileUpload_1.uploadProfilePicture, fileController_1.uploadProfilePicture);
router.post('/documents', fileUpload_1.uploadDocument, fileController_1.uploadFiles);
router.get('/:id', fileController_1.getFile);
router.get('/:id/download', fileController_1.downloadFile);
router.get('/entity/:entityType/:entityId', fileController_1.getFilesByEntity);
router.put('/:id', fileController_1.updateFile);
router.delete('/:id', fileController_1.deleteFile);
router.get('/stats/statistics', (0, auth_1.authorize)('admin'), fileController_1.getFileStatistics);
exports.default = router;
//# sourceMappingURL=files.js.map
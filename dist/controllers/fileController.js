"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProfilePicture = exports.getFileStatistics = exports.updateFile = exports.deleteFile = exports.downloadFile = exports.getFilesByEntity = exports.getFile = exports.uploadFiles = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const fileService_1 = require("../services/fileService");
const promises_1 = __importDefault(require("fs/promises"));
exports.uploadFiles = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { entityType, entityId, fileType } = req.body;
    if (!req.files && !req.file) {
        throw new errorHandler_1.AppError('No files uploaded', 400);
    }
    if (!entityType || !entityId || !fileType) {
        throw new errorHandler_1.AppError('entityType, entityId, and fileType are required', 400);
    }
    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
    const uploadedFiles = [];
    for (const file of files) {
        const fileData = {
            fileName: file.filename,
            originalName: file.originalname,
            filePath: file.path,
            fileSize: file.size,
            mimeType: file.mimetype,
            uploadedBy: userId,
            entityType,
            entityId,
            fileType,
        };
        const savedFile = await fileService_1.fileService.saveFileMetadata(fileData);
        uploadedFiles.push(savedFile);
    }
    res.status(201).json({
        success: true,
        message: `${uploadedFiles.length} file(s) uploaded successfully`,
        data: uploadedFiles.length === 1 ? uploadedFiles[0] : uploadedFiles,
    });
});
exports.getFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const file = await fileService_1.fileService.getFileById(id);
    res.json({
        success: true,
        data: file,
    });
});
exports.getFilesByEntity = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { entityType, entityId } = req.params;
    const { fileType } = req.query;
    const files = await fileService_1.fileService.getFilesByEntity(entityType, entityId, fileType);
    res.json({
        success: true,
        data: files,
        count: files.length,
    });
});
exports.downloadFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const file = await fileService_1.fileService.getFileById(id);
    const fileExists = await fileService_1.fileService.fileExists(file.filePath);
    if (!fileExists) {
        throw new errorHandler_1.AppError('File not found on server', 404);
    }
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Length', file.fileSize);
    const fileBuffer = await promises_1.default.readFile(file.filePath);
    res.send(fileBuffer);
});
exports.deleteFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    await fileService_1.fileService.deleteFile(id, userId);
    res.json({
        success: true,
        message: 'File deleted successfully',
    });
});
exports.updateFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { fileName, fileType } = req.body;
    const updatedFile = await fileService_1.fileService.updateFileMetadata(id, {
        fileName,
        fileType,
    });
    res.json({
        success: true,
        message: 'File updated successfully',
        data: updatedFile,
    });
});
exports.getFileStatistics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { entityType } = req.query;
    const userRole = req.user.role;
    if (userRole !== 'admin') {
        throw new errorHandler_1.AppError('Only administrators can view file statistics', 403);
    }
    const stats = await fileService_1.fileService.getFileStatistics(entityType);
    res.json({
        success: true,
        data: stats,
    });
});
exports.uploadProfilePicture = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { entityType, entityId } = req.body;
    if (!req.file) {
        throw new errorHandler_1.AppError('No file uploaded', 400);
    }
    if (!entityType || !entityId) {
        throw new errorHandler_1.AppError('entityType and entityId are required', 400);
    }
    const existingFiles = await fileService_1.fileService.getFilesByEntity(entityType, entityId, 'profile_picture');
    for (const file of existingFiles) {
        await fileService_1.fileService.deleteFile(file.id, userId);
    }
    const fileData = {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: userId,
        entityType,
        entityId,
        fileType: 'profile_picture',
    };
    const savedFile = await fileService_1.fileService.saveFileMetadata(fileData);
    res.status(201).json({
        success: true,
        message: 'Profile picture uploaded successfully',
        data: savedFile,
    });
});
//# sourceMappingURL=fileController.js.map
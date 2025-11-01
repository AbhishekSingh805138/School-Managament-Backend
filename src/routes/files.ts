import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  uploadFiles,
  getFile,
  getFilesByEntity,
  downloadFile,
  deleteFile,
  updateFile,
  getFileStatistics,
  uploadProfilePicture,
} from '../controllers/fileController';
import {
  uploadSingle,
  uploadMultiple,
  uploadProfilePicture as uploadProfilePictureMiddleware,
  uploadDocument,
} from '../middleware/fileUpload';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/files/upload
 * @desc    Upload single or multiple files
 * @access  Private (All authenticated users)
 */
router.post('/upload', uploadMultiple('files'), uploadFiles);

/**
 * @route   POST /api/v1/files/upload-single
 * @desc    Upload single file
 * @access  Private (All authenticated users)
 */
router.post('/upload-single', uploadSingle('file'), uploadFiles);

/**
 * @route   POST /api/v1/files/profile-picture
 * @desc    Upload profile picture
 * @access  Private (All authenticated users)
 */
router.post('/profile-picture', uploadProfilePictureMiddleware, uploadProfilePicture);

/**
 * @route   POST /api/v1/files/documents
 * @desc    Upload documents (PDF, DOC, DOCX)
 * @access  Private (All authenticated users)
 */
router.post('/documents', uploadDocument, uploadFiles);

/**
 * @route   GET /api/v1/files/:id
 * @desc    Get file metadata by ID
 * @access  Private (All authenticated users)
 */
router.get('/:id', getFile);

/**
 * @route   GET /api/v1/files/:id/download
 * @desc    Download file
 * @access  Private (All authenticated users)
 */
router.get('/:id/download', downloadFile);

/**
 * @route   GET /api/v1/files/entity/:entityType/:entityId
 * @desc    Get files by entity
 * @access  Private (All authenticated users)
 */
router.get('/entity/:entityType/:entityId', getFilesByEntity);

/**
 * @route   PUT /api/v1/files/:id
 * @desc    Update file metadata
 * @access  Private (All authenticated users)
 */
router.put('/:id', updateFile);

/**
 * @route   DELETE /api/v1/files/:id
 * @desc    Delete file
 * @access  Private (All authenticated users)
 */
router.delete('/:id', deleteFile);

/**
 * @route   GET /api/v1/files/statistics
 * @desc    Get file statistics
 * @access  Private (Admin only)
 */
router.get('/stats/statistics', authorize('admin'), getFileStatistics);

export default router;

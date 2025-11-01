"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileService = exports.FileService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const errorHandler_1 = require("../middleware/errorHandler");
const connection_1 = require("../database/connection");
class FileService {
    constructor() { }
    static getInstance() {
        if (!FileService.instance) {
            FileService.instance = new FileService();
        }
        return FileService.instance;
    }
    async saveFileMetadata(fileData) {
        const result = await (0, connection_1.query)(`INSERT INTO files (
        file_name, original_name, file_path, file_size, mime_type,
        uploaded_by, entity_type, entity_id, file_type, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING *`, [
            fileData.fileName,
            fileData.originalName,
            fileData.filePath,
            fileData.fileSize,
            fileData.mimeType,
            fileData.uploadedBy,
            fileData.entityType,
            fileData.entityId,
            fileData.fileType,
        ]);
        return this.formatFileRecord(result.rows[0]);
    }
    async getFileById(fileId) {
        const result = await (0, connection_1.query)(`SELECT * FROM files WHERE id = $1 AND deleted_at IS NULL`, [fileId]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('File not found', 404);
        }
        return this.formatFileRecord(result.rows[0]);
    }
    async getFilesByEntity(entityType, entityId, fileType) {
        let sql = `SELECT * FROM files WHERE entity_type = $1 AND entity_id = $2 AND deleted_at IS NULL`;
        const params = [entityType, entityId];
        if (fileType) {
            sql += ` AND file_type = $3`;
            params.push(fileType);
        }
        sql += ` ORDER BY created_at DESC`;
        const result = await (0, connection_1.query)(sql, params);
        return result.rows.map((row) => this.formatFileRecord(row));
    }
    async deleteFile(fileId, userId) {
        const file = await this.getFileById(fileId);
        await (0, connection_1.query)(`UPDATE files SET deleted_at = CURRENT_TIMESTAMP, deleted_by = $1 WHERE id = $2`, [userId, fileId]);
        try {
            await promises_1.default.unlink(file.filePath);
        }
        catch (error) {
            console.error('Error deleting physical file:', error);
        }
    }
    async updateFileMetadata(fileId, updates) {
        const setClauses = [];
        const params = [];
        let paramIndex = 1;
        if (updates.fileName) {
            setClauses.push(`file_name = $${paramIndex++}`);
            params.push(updates.fileName);
        }
        if (updates.fileType) {
            setClauses.push(`file_type = $${paramIndex++}`);
            params.push(updates.fileType);
        }
        if (setClauses.length === 0) {
            throw new errorHandler_1.AppError('No updates provided', 400);
        }
        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(fileId);
        const result = await (0, connection_1.query)(`UPDATE files SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`, params);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('File not found', 404);
        }
        return this.formatFileRecord(result.rows[0]);
    }
    async getFileStatistics(entityType) {
        let whereClause = 'WHERE deleted_at IS NULL';
        const params = [];
        if (entityType) {
            whereClause += ' AND entity_type = $1';
            params.push(entityType);
        }
        const result = await (0, connection_1.query)(`SELECT 
        COUNT(*) as total_files,
        SUM(file_size) as total_size,
        AVG(file_size) as average_size,
        COUNT(DISTINCT entity_id) as unique_entities,
        COUNT(DISTINCT uploaded_by) as unique_uploaders,
        mode() WITHIN GROUP (ORDER BY file_type) as most_common_type,
        mode() WITHIN GROUP (ORDER BY mime_type) as most_common_mime_type
      FROM files ${whereClause}`, params);
        const stats = result.rows[0];
        const typeDistribution = await (0, connection_1.query)(`SELECT 
        file_type,
        COUNT(*) as count,
        SUM(file_size) as total_size
      FROM files ${whereClause}
      GROUP BY file_type
      ORDER BY count DESC`, params);
        return {
            totalFiles: parseInt(stats.total_files) || 0,
            totalSize: parseInt(stats.total_size) || 0,
            averageSize: parseFloat(stats.average_size) || 0,
            uniqueEntities: parseInt(stats.unique_entities) || 0,
            uniqueUploaders: parseInt(stats.unique_uploaders) || 0,
            mostCommonType: stats.most_common_type || 'N/A',
            mostCommonMimeType: stats.most_common_mime_type || 'N/A',
            typeDistribution: typeDistribution.rows.map((row) => ({
                fileType: row.file_type,
                count: parseInt(row.count),
                totalSize: parseInt(row.total_size),
            })),
        };
    }
    async fileExists(filePath) {
        try {
            await promises_1.default.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async getFileSize(filePath) {
        const stats = await promises_1.default.stat(filePath);
        return stats.size;
    }
    formatFileRecord(row) {
        return {
            id: row.id.toString(),
            fileName: row.file_name,
            originalName: row.original_name,
            filePath: row.file_path,
            fileUrl: `/uploads/${row.file_path.replace(/^uploads\//, '')}`,
            fileSize: row.file_size,
            mimeType: row.mime_type,
            uploadedBy: row.uploaded_by?.toString(),
            entityType: row.entity_type,
            entityId: row.entity_id?.toString(),
            fileType: row.file_type,
            createdAt: row.created_at?.toISOString(),
            updatedAt: row.updated_at?.toISOString(),
            deletedAt: row.deleted_at?.toISOString() || null,
            deletedBy: row.deleted_by?.toString() || null,
        };
    }
}
exports.FileService = FileService;
exports.fileService = FileService.getInstance();
//# sourceMappingURL=fileService.js.map
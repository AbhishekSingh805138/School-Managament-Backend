export declare class FileService {
    private static instance;
    private constructor();
    static getInstance(): FileService;
    saveFileMetadata(fileData: {
        fileName: string;
        originalName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        uploadedBy: string;
        entityType: string;
        entityId: string;
        fileType: string;
    }): Promise<any>;
    getFileById(fileId: string): Promise<any>;
    getFilesByEntity(entityType: string, entityId: string, fileType?: string): Promise<any[]>;
    deleteFile(fileId: string, userId: string): Promise<void>;
    updateFileMetadata(fileId: string, updates: {
        fileName?: string;
        fileType?: string;
    }): Promise<any>;
    getFileStatistics(entityType?: string): Promise<any>;
    fileExists(filePath: string): Promise<boolean>;
    getFileSize(filePath: string): Promise<number>;
    private formatFileRecord;
}
export declare const fileService: FileService;
//# sourceMappingURL=fileService.d.ts.map
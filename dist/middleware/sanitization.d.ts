import { Request, Response, NextFunction } from 'express';
import { FIELD_DEFINITIONS } from '../utils/sanitization';
export declare const sanitizeInputs: (req: Request, res: Response, next: NextFunction) => void;
export declare const createEntitySanitizer: (entityType: keyof typeof FIELD_DEFINITIONS) => (req: Request, res: Response, next: NextFunction) => void;
export declare const sanitizeUser: (req: Request, res: Response, next: NextFunction) => void;
export declare const sanitizeAcademicYear: (req: Request, res: Response, next: NextFunction) => void;
export declare const sanitizeSemester: (req: Request, res: Response, next: NextFunction) => void;
export declare const sanitizeSubject: (req: Request, res: Response, next: NextFunction) => void;
export declare const sanitizeClass: (req: Request, res: Response, next: NextFunction) => void;
export declare const sanitizeTeacher: (req: Request, res: Response, next: NextFunction) => void;
export declare const addSecurityHeaders: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateContentType: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=sanitization.d.ts.map
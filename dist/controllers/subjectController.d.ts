import { Request, Response } from 'express';
export declare const createSubject: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSubjects: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSubjectById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateSubject: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteSubject: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const toggleSubjectStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSubjectStatistics: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=subjectController.d.ts.map
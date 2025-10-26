import { Request, Response } from 'express';
export declare const createClass: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getClasses: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getClassById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateClass: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteClass: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const assignSubjectToClass: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const removeSubjectFromClass: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getClassStatistics: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const enrollStudentToClass: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const bulkEnrollStudentsToClass: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const transferStudent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getClassStudents: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getClassSubjects: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=classController.d.ts.map
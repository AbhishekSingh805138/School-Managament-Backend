import { Request, Response } from 'express';
export declare const createSemester: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSemesters: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSemesterById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateSemester: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteSemester: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getCurrentSemester: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=semesterController.d.ts.map
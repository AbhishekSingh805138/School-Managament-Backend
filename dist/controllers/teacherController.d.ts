import { Request, Response } from 'express';
export declare const createTeacher: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getTeachers: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getTeacherById: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateTeacher: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const deleteTeacher: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const assignTeacherToSubject: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const removeTeacherFromSubject: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const assignTeacherToClass: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const removeTeacherFromClass: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const assignTeacherToClassSubject: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const removeTeacherFromClassSubject: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getTeacherWorkload: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const checkAssignmentConflicts: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getAllTeacherAssignments: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getOptimalTeacherSuggestions: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=teacherController.d.ts.map
import { Request, Response } from 'express';
import { CreatePayment } from '../types/fee';
export declare const recordPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getPayments: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getPaymentById: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getPaymentReceipt: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getPaymentHistory: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getPaymentStatistics: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const reversePayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const validatePaymentData: (paymentData: CreatePayment, pendingAmount: number) => {
    isValid: boolean;
    errors: string[];
};
//# sourceMappingURL=paymentController.d.ts.map
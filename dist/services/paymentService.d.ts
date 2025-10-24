import { BaseService } from './baseService';
import { CreatePayment } from '../types/fee';
export declare class PaymentService extends BaseService {
    recordPayment(paymentData: CreatePayment, processedBy: string): Promise<{
        studentFee: {
            id: any;
            amount: number;
            paidAmount: number;
            remainingAmount: number;
            status: string;
        };
        student: {
            id: any;
            studentId: any;
            name: string;
            class: string;
        };
        feeCategory: {
            id: any;
            name: any;
        };
        id: any;
        studentFeeId: any;
        amount: number;
        paymentDate: any;
        paymentMethod: any;
        transactionId: any;
        receiptNumber: any;
        processedBy: any;
        createdAt: any;
        updatedAt: any;
    }>;
    getPayments(req: any): Promise<{
        payments: any;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getPaymentById(id: string): Promise<{
        studentFee: {
            id: any;
            amount: number;
            status: any;
        };
        student: {
            id: any;
            studentId: any;
            name: string;
            class: string;
        };
        feeCategory: {
            name: any;
        };
        processedBy: {
            name: string;
        } | null;
        id: any;
        studentFeeId: any;
        amount: number;
        paymentDate: any;
        paymentMethod: any;
        transactionId: any;
        receiptNumber: any;
        createdAt: any;
        updatedAt: any;
    }>;
    getPaymentSummary(startDate?: string, endDate?: string): Promise<{
        totalPayments: number;
        totalAmount: number;
        paymentMethods: {
            cash: {
                count: number;
                amount: number;
            };
            card: {
                count: number;
                amount: number;
            };
            bankTransfer: {
                count: number;
                amount: number;
            };
            online: {
                count: number;
                amount: number;
            };
        };
    }>;
    private generateReceiptNumber;
    private transformPaymentResponse;
}
//# sourceMappingURL=paymentService.d.ts.map
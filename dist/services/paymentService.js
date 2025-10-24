"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const baseService_1 = require("./baseService");
const errorHandler_1 = require("../middleware/errorHandler");
const pagination_1 = require("../utils/pagination");
class PaymentService extends baseService_1.BaseService {
    async recordPayment(paymentData, processedBy) {
        const studentFeeResult = await this.executeQuery(`SELECT sf.id, sf.student_id, sf.fee_category_id, sf.amount, sf.status,
              s.student_id as student_number, u.first_name, u.last_name,
              fc.name as fee_category_name,
              c.name as class_name, c.grade, c.section
       FROM student_fees sf
       JOIN students s ON sf.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN fee_categories fc ON sf.fee_category_id = fc.id
       JOIN classes c ON s.class_id = c.id
       WHERE sf.id = $1`, [paymentData.studentFeeId]);
        if (studentFeeResult.rows.length === 0) {
            throw new errorHandler_1.AppError('Student fee not found', 404);
        }
        const studentFee = studentFeeResult.rows[0];
        if (studentFee.status === 'paid') {
            throw new errorHandler_1.AppError('This fee has already been fully paid', 400);
        }
        const paidAmountResult = await this.executeQuery('SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE student_fee_id = $1', [paymentData.studentFeeId]);
        const currentPaidAmount = parseFloat(paidAmountResult.rows[0].total_paid);
        const totalAmount = parseFloat(studentFee.amount);
        const pendingAmount = totalAmount - currentPaidAmount;
        if (paymentData.amount <= 0) {
            throw new errorHandler_1.AppError('Payment amount must be greater than zero', 400);
        }
        if (paymentData.amount > pendingAmount) {
            throw new errorHandler_1.AppError(`Payment amount cannot exceed pending amount of ${pendingAmount}`, 400);
        }
        return await this.executeTransaction(async (client) => {
            const receiptNumber = await this.generateReceiptNumber();
            const paymentResult = await client.query(`INSERT INTO payments (student_fee_id, amount, payment_date, payment_method, transaction_id, receipt_number, processed_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, student_fee_id, amount, payment_date, payment_method, transaction_id, receipt_number, processed_by, created_at, updated_at`, [
                paymentData.studentFeeId,
                paymentData.amount,
                paymentData.paymentDate || new Date().toISOString().split('T')[0],
                paymentData.paymentMethod,
                paymentData.transactionId || null,
                receiptNumber,
                processedBy
            ]);
            const payment = paymentResult.rows[0];
            const newPaidAmount = currentPaidAmount + paymentData.amount;
            let newStatus = 'pending';
            if (newPaidAmount >= totalAmount) {
                newStatus = 'paid';
            }
            else if (newPaidAmount > 0) {
                newStatus = 'partial';
            }
            await client.query('UPDATE student_fees SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newStatus, paymentData.studentFeeId]);
            return {
                ...this.transformPaymentResponse(payment),
                studentFee: {
                    id: studentFee.id,
                    amount: totalAmount,
                    paidAmount: newPaidAmount,
                    remainingAmount: totalAmount - newPaidAmount,
                    status: newStatus,
                },
                student: {
                    id: studentFee.student_id,
                    studentId: studentFee.student_number,
                    name: `${studentFee.first_name} ${studentFee.last_name}`,
                    class: `${studentFee.grade}-${studentFee.section}`,
                },
                feeCategory: {
                    id: studentFee.fee_category_id,
                    name: studentFee.fee_category_name,
                },
            };
        });
    }
    async getPayments(req) {
        const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'payment_date');
        const { studentId, feeCategoryId, paymentMethod, startDate, endDate } = req.query;
        let whereClause = 'WHERE 1=1';
        const queryParams = [];
        if (studentId) {
            whereClause += ` AND sf.student_id = $${queryParams.length + 1}`;
            queryParams.push(studentId);
        }
        if (feeCategoryId) {
            whereClause += ` AND sf.fee_category_id = $${queryParams.length + 1}`;
            queryParams.push(feeCategoryId);
        }
        if (paymentMethod) {
            whereClause += ` AND p.payment_method = $${queryParams.length + 1}`;
            queryParams.push(paymentMethod);
        }
        if (startDate && endDate) {
            whereClause += ` AND p.payment_date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
            queryParams.push(startDate, endDate);
        }
        const countResult = await this.executeQuery(`SELECT COUNT(*) FROM payments p
       JOIN student_fees sf ON p.student_fee_id = sf.id
       JOIN students s ON sf.student_id = s.id
       ${whereClause}`, queryParams);
        const total = parseInt(countResult.rows[0].count);
        const result = await this.executeQuery(`SELECT p.id, p.student_fee_id, p.amount, p.payment_date, p.payment_method, p.transaction_id, 
              p.receipt_number, p.processed_by, p.created_at, p.updated_at,
              sf.amount as fee_amount, sf.status as fee_status,
              s.student_id as student_number, u.first_name, u.last_name,
              fc.name as fee_category_name,
              c.name as class_name, c.grade, c.section,
              processor.first_name as processor_first_name, processor.last_name as processor_last_name
       FROM payments p
       JOIN student_fees sf ON p.student_fee_id = sf.id
       JOIN students s ON sf.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN fee_categories fc ON sf.fee_category_id = fc.id
       JOIN classes c ON s.class_id = c.id
       LEFT JOIN users processor ON p.processed_by = processor.id
       ${whereClause}
       ORDER BY p.${sortBy} ${sortOrder}
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`, [...queryParams, limit, offset]);
        const payments = result.rows.map((payment) => ({
            ...this.transformPaymentResponse(payment),
            studentFee: {
                id: payment.student_fee_id,
                amount: parseFloat(payment.fee_amount),
                status: payment.fee_status,
            },
            student: {
                id: payment.student_id,
                studentId: payment.student_number,
                name: `${payment.first_name} ${payment.last_name}`,
                class: `${payment.grade}-${payment.section}`,
            },
            feeCategory: {
                name: payment.fee_category_name,
            },
            processedBy: payment.processor_first_name ? {
                name: `${payment.processor_first_name} ${payment.processor_last_name}`,
            } : null,
        }));
        return {
            payments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getPaymentById(id) {
        const payment = await this.checkEntityExists('payments', id);
        const result = await this.executeQuery(`SELECT p.id, p.student_fee_id, p.amount, p.payment_date, p.payment_method, p.transaction_id, 
              p.receipt_number, p.processed_by, p.created_at, p.updated_at,
              sf.amount as fee_amount, sf.status as fee_status,
              s.student_id as student_number, u.first_name, u.last_name,
              fc.name as fee_category_name,
              c.name as class_name, c.grade, c.section,
              processor.first_name as processor_first_name, processor.last_name as processor_last_name
       FROM payments p
       JOIN student_fees sf ON p.student_fee_id = sf.id
       JOIN students s ON sf.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN fee_categories fc ON sf.fee_category_id = fc.id
       JOIN classes c ON s.class_id = c.id
       LEFT JOIN users processor ON p.processed_by = processor.id
       WHERE p.id = $1`, [payment.id]);
        const paymentDetails = result.rows[0];
        return {
            ...this.transformPaymentResponse(paymentDetails),
            studentFee: {
                id: paymentDetails.student_fee_id,
                amount: parseFloat(paymentDetails.fee_amount),
                status: paymentDetails.fee_status,
            },
            student: {
                id: paymentDetails.student_id,
                studentId: paymentDetails.student_number,
                name: `${paymentDetails.first_name} ${paymentDetails.last_name}`,
                class: `${paymentDetails.grade}-${paymentDetails.section}`,
            },
            feeCategory: {
                name: paymentDetails.fee_category_name,
            },
            processedBy: paymentDetails.processor_first_name ? {
                name: `${paymentDetails.processor_first_name} ${paymentDetails.processor_last_name}`,
            } : null,
        };
    }
    async getPaymentSummary(startDate, endDate) {
        let whereClause = 'WHERE 1=1';
        const queryParams = [];
        if (startDate && endDate) {
            whereClause += ` AND p.payment_date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
            queryParams.push(startDate, endDate);
        }
        const result = await this.executeQuery(`SELECT 
         COUNT(*) as total_payments,
         COALESCE(SUM(p.amount), 0) as total_amount,
         COUNT(CASE WHEN p.payment_method = 'cash' THEN 1 END) as cash_payments,
         COUNT(CASE WHEN p.payment_method = 'card' THEN 1 END) as card_payments,
         COUNT(CASE WHEN p.payment_method = 'bank_transfer' THEN 1 END) as bank_transfer_payments,
         COUNT(CASE WHEN p.payment_method = 'online' THEN 1 END) as online_payments,
         COALESCE(SUM(CASE WHEN p.payment_method = 'cash' THEN p.amount ELSE 0 END), 0) as cash_amount,
         COALESCE(SUM(CASE WHEN p.payment_method = 'card' THEN p.amount ELSE 0 END), 0) as card_amount,
         COALESCE(SUM(CASE WHEN p.payment_method = 'bank_transfer' THEN p.amount ELSE 0 END), 0) as bank_transfer_amount,
         COALESCE(SUM(CASE WHEN p.payment_method = 'online' THEN p.amount ELSE 0 END), 0) as online_amount
       FROM payments p
       ${whereClause}`, queryParams);
        const summary = result.rows[0];
        return {
            totalPayments: parseInt(summary.total_payments),
            totalAmount: parseFloat(summary.total_amount),
            paymentMethods: {
                cash: {
                    count: parseInt(summary.cash_payments),
                    amount: parseFloat(summary.cash_amount),
                },
                card: {
                    count: parseInt(summary.card_payments),
                    amount: parseFloat(summary.card_amount),
                },
                bankTransfer: {
                    count: parseInt(summary.bank_transfer_payments),
                    amount: parseFloat(summary.bank_transfer_amount),
                },
                online: {
                    count: parseInt(summary.online_payments),
                    amount: parseFloat(summary.online_amount),
                },
            },
        };
    }
    async generateReceiptNumber() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const countResult = await this.executeQuery('SELECT COUNT(*) as count FROM payments WHERE DATE(created_at) = CURRENT_DATE');
        const count = parseInt(countResult.rows[0].count) + 1;
        const sequence = String(count).padStart(4, '0');
        return `RCP${year}${month}${day}${sequence}`;
    }
    transformPaymentResponse(payment) {
        return {
            id: payment.id,
            studentFeeId: payment.student_fee_id,
            amount: parseFloat(payment.amount),
            paymentDate: payment.payment_date,
            paymentMethod: payment.payment_method,
            transactionId: payment.transaction_id,
            receiptNumber: payment.receipt_number,
            processedBy: payment.processed_by,
            createdAt: payment.created_at,
            updatedAt: payment.updated_at,
        };
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=paymentService.js.map
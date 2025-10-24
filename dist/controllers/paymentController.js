"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePaymentData = exports.reversePayment = exports.getPaymentStatistics = exports.getPaymentHistory = exports.getPaymentReceipt = exports.getPaymentById = exports.getPayments = exports.recordPayment = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const pagination_1 = require("../utils/pagination");
exports.recordPayment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const paymentData = req.body;
    const processedBy = req.user.id;
    const studentFeeResult = await (0, connection_1.query)(`SELECT sf.id, sf.student_id, sf.fee_category_id, sf.amount, sf.discount_amount, sf.total_amount, sf.status,
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
    const paidAmountResult = await (0, connection_1.query)('SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE student_fee_id = $1', [paymentData.studentFeeId]);
    const currentPaidAmount = parseFloat(paidAmountResult.rows[0].total_paid);
    const totalAmount = parseFloat(studentFee.total_amount);
    const pendingAmount = totalAmount - currentPaidAmount;
    if (paymentData.amount > pendingAmount) {
        throw new errorHandler_1.AppError(`Payment amount (${paymentData.amount}) cannot exceed pending amount (${pendingAmount})`, 400);
    }
    if (paymentData.amount <= 0) {
        throw new errorHandler_1.AppError('Payment amount must be greater than 0', 400);
    }
    const client = await (0, connection_1.getClient)();
    try {
        await client.query('BEGIN');
        const seqIdResult = await client.query('SELECT generate_sequential_id($1) as next_id', ['payments']);
        const sequentialId = seqIdResult.rows[0].next_id;
        const paymentResult = await client.query(`INSERT INTO payments (student_fee_id, amount, payment_date, payment_method, transaction_id, processed_by, remarks, alt_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, alt_id, student_fee_id, amount, payment_date, payment_method, transaction_id, receipt_number, processed_by, remarks, created_at, updated_at`, [
            paymentData.studentFeeId,
            paymentData.amount,
            paymentData.paymentDate || new Date().toISOString().split('T')[0],
            paymentData.paymentMethod,
            paymentData.transactionId || null,
            processedBy,
            paymentData.remarks || null,
            sequentialId.toString()
        ]);
        const payment = paymentResult.rows[0];
        const updatedFeeResult = await client.query('SELECT status FROM student_fees WHERE id = $1', [paymentData.studentFeeId]);
        await client.query('COMMIT');
        const processorResult = await (0, connection_1.query)('SELECT first_name, last_name FROM users WHERE id = $1', [processedBy]);
        const processor = processorResult.rows[0];
        const updatedStatus = updatedFeeResult.rows[0].status;
        const newPaidAmount = currentPaidAmount + paymentData.amount;
        const newPendingAmount = totalAmount - newPaidAmount;
        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully',
            data: {
                payment: {
                    id: payment.id,
                    altId: payment.alt_id,
                    studentFeeId: payment.student_fee_id,
                    amount: parseFloat(payment.amount),
                    paymentDate: payment.payment_date,
                    paymentMethod: payment.payment_method,
                    transactionId: payment.transaction_id,
                    receiptNumber: payment.receipt_number,
                    processedBy: payment.processed_by,
                    remarks: payment.remarks,
                    createdAt: payment.created_at,
                    updatedAt: payment.updated_at,
                },
                studentFee: {
                    id: studentFee.id,
                    studentNumber: studentFee.student_number,
                    studentName: `${studentFee.first_name} ${studentFee.last_name}`,
                    className: `${studentFee.class_name} (${studentFee.grade}-${studentFee.section})`,
                    feeCategoryName: studentFee.fee_category_name,
                    totalAmount: totalAmount,
                    previousPaidAmount: currentPaidAmount,
                    currentPayment: paymentData.amount,
                    newPaidAmount: newPaidAmount,
                    pendingAmount: newPendingAmount,
                    previousStatus: studentFee.status,
                    newStatus: updatedStatus,
                },
                processor: {
                    name: `${processor.first_name} ${processor.last_name}`,
                },
            },
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
});
exports.getPayments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'payment_date');
    const queryParams = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    let whereClause = 'WHERE 1=1';
    const sqlParams = [];
    if (userRole === 'student') {
        whereClause += ` AND s.user_id = $${sqlParams.length + 1}`;
        sqlParams.push(userId);
    }
    else if (userRole === 'parent') {
        whereClause += ` AND EXISTS (
      SELECT 1 FROM student_parents sp 
      WHERE sp.student_id = s.id AND sp.parent_user_id = $${sqlParams.length + 1}
    )`;
        sqlParams.push(userId);
    }
    if (queryParams.studentId) {
        whereClause += ` AND sf.student_id = $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.studentId);
    }
    if (queryParams.classId) {
        whereClause += ` AND s.class_id = $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.classId);
    }
    if (queryParams.feeCategoryId) {
        whereClause += ` AND sf.fee_category_id = $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.feeCategoryId);
    }
    if (queryParams.startDate) {
        whereClause += ` AND p.payment_date >= $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.startDate);
    }
    if (queryParams.endDate) {
        whereClause += ` AND p.payment_date <= $${sqlParams.length + 1}`;
        sqlParams.push(queryParams.endDate);
    }
    const countResult = await (0, connection_1.query)(`SELECT COUNT(*) FROM payments p
     JOIN student_fees sf ON p.student_fee_id = sf.id
     JOIN students s ON sf.student_id = s.id
     ${whereClause}`, sqlParams);
    const total = parseInt(countResult.rows[0].count);
    const result = await (0, connection_1.query)(`SELECT p.id, p.alt_id, p.student_fee_id, p.amount, p.payment_date, p.payment_method, 
            p.transaction_id, p.receipt_number, p.processed_by, p.remarks, p.created_at, p.updated_at,
            s.student_id as student_number, su.first_name as student_first_name, su.last_name as student_last_name,
            fc.name as fee_category_name, fc.frequency,
            c.name as class_name, c.grade, c.section,
            pu.first_name as processor_first_name, pu.last_name as processor_last_name,
            sf.total_amount, sf.status as fee_status
     FROM payments p
     JOIN student_fees sf ON p.student_fee_id = sf.id
     JOIN students s ON sf.student_id = s.id
     JOIN users su ON s.user_id = su.id
     JOIN fee_categories fc ON sf.fee_category_id = fc.id
     JOIN classes c ON s.class_id = c.id
     JOIN users pu ON p.processed_by = pu.id
     ${whereClause}
     ORDER BY p.${sortBy} ${sortOrder}
     LIMIT $${sqlParams.length + 1} OFFSET $${sqlParams.length + 2}`, [...sqlParams, limit, offset]);
    const payments = result.rows.map((payment) => ({
        id: payment.id,
        altId: payment.alt_id,
        studentFeeId: payment.student_fee_id,
        amount: parseFloat(payment.amount),
        paymentDate: payment.payment_date,
        paymentMethod: payment.payment_method,
        transactionId: payment.transaction_id,
        receiptNumber: payment.receipt_number,
        processedBy: payment.processed_by,
        remarks: payment.remarks,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at,
        studentFee: {
            totalAmount: parseFloat(payment.total_amount),
            status: payment.fee_status,
            student: {
                studentId: payment.student_number,
                user: {
                    firstName: payment.student_first_name,
                    lastName: payment.student_last_name,
                },
                class: {
                    name: payment.class_name,
                    grade: payment.grade,
                    section: payment.section,
                },
            },
            feeCategory: {
                name: payment.fee_category_name,
                frequency: payment.frequency,
            },
        },
        processedByUser: {
            firstName: payment.processor_first_name,
            lastName: payment.processor_last_name,
        },
    }));
    res.json({
        success: true,
        data: payments,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
});
exports.getPaymentById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    let authorizationClause = '';
    const queryParams = [id];
    if (userRole === 'student') {
        authorizationClause = 'AND s.user_id = $2';
        queryParams.push(userId);
    }
    else if (userRole === 'parent') {
        authorizationClause = `AND EXISTS (
      SELECT 1 FROM student_parents sp 
      WHERE sp.student_id = s.id AND sp.parent_user_id = $2
    )`;
        queryParams.push(userId);
    }
    const result = await (0, connection_1.query)(`SELECT p.id, p.alt_id, p.student_fee_id, p.amount, p.payment_date, p.payment_method, 
            p.transaction_id, p.receipt_number, p.processed_by, p.remarks, p.created_at, p.updated_at,
            s.student_id as student_number, su.first_name as student_first_name, su.last_name as student_last_name,
            fc.name as fee_category_name, fc.frequency, fc.description,
            c.name as class_name, c.grade, c.section,
            pu.first_name as processor_first_name, pu.last_name as processor_last_name,
            sf.amount as fee_amount, sf.discount_amount, sf.total_amount, sf.status as fee_status, sf.due_date
     FROM payments p
     JOIN student_fees sf ON p.student_fee_id = sf.id
     JOIN students s ON sf.student_id = s.id
     JOIN users su ON s.user_id = su.id
     JOIN fee_categories fc ON sf.fee_category_id = fc.id
     JOIN classes c ON s.class_id = c.id
     JOIN users pu ON p.processed_by = pu.id
     WHERE p.id = $1 ${authorizationClause}`, queryParams);
    if (result.rows.length === 0) {
        throw new errorHandler_1.AppError('Payment not found or access denied', 404);
    }
    const payment = result.rows[0];
    const totalPaidResult = await (0, connection_1.query)('SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE student_fee_id = $1', [payment.student_fee_id]);
    const totalPaid = parseFloat(totalPaidResult.rows[0].total_paid);
    const totalAmount = parseFloat(payment.total_amount);
    res.json({
        success: true,
        data: {
            id: payment.id,
            altId: payment.alt_id,
            studentFeeId: payment.student_fee_id,
            amount: parseFloat(payment.amount),
            paymentDate: payment.payment_date,
            paymentMethod: payment.payment_method,
            transactionId: payment.transaction_id,
            receiptNumber: payment.receipt_number,
            processedBy: payment.processed_by,
            remarks: payment.remarks,
            createdAt: payment.created_at,
            updatedAt: payment.updated_at,
            studentFee: {
                amount: parseFloat(payment.fee_amount),
                discountAmount: parseFloat(payment.discount_amount),
                totalAmount: totalAmount,
                totalPaid: totalPaid,
                pendingAmount: totalAmount - totalPaid,
                status: payment.fee_status,
                dueDate: payment.due_date,
                student: {
                    studentId: payment.student_number,
                    user: {
                        firstName: payment.student_first_name,
                        lastName: payment.student_last_name,
                    },
                    class: {
                        name: payment.class_name,
                        grade: payment.grade,
                        section: payment.section,
                    },
                },
                feeCategory: {
                    name: payment.fee_category_name,
                    frequency: payment.frequency,
                    description: payment.description,
                },
            },
            processedByUser: {
                firstName: payment.processor_first_name,
                lastName: payment.processor_last_name,
            },
        },
    });
});
exports.getPaymentReceipt = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    let authorizationClause = '';
    const queryParams = [id];
    if (userRole === 'student') {
        authorizationClause = 'AND s.user_id = $2';
        queryParams.push(userId);
    }
    else if (userRole === 'parent') {
        authorizationClause = `AND EXISTS (
      SELECT 1 FROM student_parents sp 
      WHERE sp.student_id = s.id AND sp.parent_user_id = $2
    )`;
        queryParams.push(userId);
    }
    const result = await (0, connection_1.query)(`SELECT p.id, p.alt_id, p.amount, p.payment_date, p.payment_method, 
            p.transaction_id, p.receipt_number, p.remarks, p.created_at,
            s.student_id as student_number, su.first_name as student_first_name, su.last_name as student_last_name,
            su.email as student_email, su.phone as student_phone,
            fc.name as fee_category_name, fc.description as fee_description,
            c.name as class_name, c.grade, c.section,
            pu.first_name as processor_first_name, pu.last_name as processor_last_name,
            sf.amount as fee_amount, sf.discount_amount, sf.total_amount, sf.due_date,
            ay.name as academic_year_name
     FROM payments p
     JOIN student_fees sf ON p.student_fee_id = sf.id
     JOIN students s ON sf.student_id = s.id
     JOIN users su ON s.user_id = su.id
     JOIN fee_categories fc ON sf.fee_category_id = fc.id
     JOIN classes c ON s.class_id = c.id
     JOIN users pu ON p.processed_by = pu.id
     JOIN academic_years ay ON fc.academic_year_id = ay.id
     WHERE p.id = $1 ${authorizationClause}`, queryParams);
    if (result.rows.length === 0) {
        throw new errorHandler_1.AppError('Payment receipt not found or access denied', 404);
    }
    const payment = result.rows[0];
    const receiptData = {
        receiptNumber: payment.receipt_number,
        paymentDate: payment.payment_date,
        generatedAt: new Date().toISOString(),
        student: {
            studentId: payment.student_number,
            name: `${payment.student_first_name} ${payment.student_last_name}`,
            email: payment.student_email,
            phone: payment.student_phone,
            class: `${payment.class_name} (${payment.grade}-${payment.section})`,
        },
        fee: {
            category: payment.fee_category_name,
            description: payment.fee_description,
            academicYear: payment.academic_year_name,
            originalAmount: parseFloat(payment.fee_amount),
            discountAmount: parseFloat(payment.discount_amount),
            totalAmount: parseFloat(payment.total_amount),
            dueDate: payment.due_date,
        },
        payment: {
            amount: parseFloat(payment.amount),
            method: payment.payment_method,
            transactionId: payment.transaction_id,
            remarks: payment.remarks,
        },
        processedBy: `${payment.processor_first_name} ${payment.processor_last_name}`,
        school: {
            name: 'School Management System',
            address: 'School Address',
            phone: 'School Phone',
        },
    };
    res.json({
        success: true,
        data: receiptData,
    });
});
exports.getPaymentHistory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { studentFeeId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    let authorizationClause = '';
    const queryParams = [studentFeeId];
    if (userRole === 'student') {
        authorizationClause = 'AND s.user_id = $2';
        queryParams.push(userId);
    }
    else if (userRole === 'parent') {
        authorizationClause = `AND EXISTS (
      SELECT 1 FROM student_parents sp 
      WHERE sp.student_id = s.id AND sp.parent_user_id = $2
    )`;
        queryParams.push(userId);
    }
    const feeAccessResult = await (0, connection_1.query)(`SELECT sf.id FROM student_fees sf
     JOIN students s ON sf.student_id = s.id
     WHERE sf.id = $1 ${authorizationClause}`, queryParams);
    if (feeAccessResult.rows.length === 0) {
        throw new errorHandler_1.AppError('Student fee not found or access denied', 404);
    }
    const result = await (0, connection_1.query)(`SELECT p.id, p.alt_id, p.amount, p.payment_date, p.payment_method, 
            p.transaction_id, p.receipt_number, p.remarks, p.created_at,
            pu.first_name as processor_first_name, pu.last_name as processor_last_name
     FROM payments p
     JOIN users pu ON p.processed_by = pu.id
     WHERE p.student_fee_id = $1
     ORDER BY p.payment_date DESC, p.created_at DESC`, [studentFeeId]);
    const summaryResult = await (0, connection_1.query)(`SELECT sf.amount, sf.discount_amount, sf.total_amount, sf.status,
            COALESCE(SUM(p.amount), 0) as total_paid
     FROM student_fees sf
     LEFT JOIN payments p ON sf.id = p.student_fee_id
     WHERE sf.id = $1
     GROUP BY sf.id, sf.amount, sf.discount_amount, sf.total_amount, sf.status`, [studentFeeId]);
    const summary = summaryResult.rows[0];
    const totalPaid = parseFloat(summary.total_paid);
    const totalAmount = parseFloat(summary.total_amount);
    const payments = result.rows.map((payment) => ({
        id: payment.id,
        altId: payment.alt_id,
        amount: parseFloat(payment.amount),
        paymentDate: payment.payment_date,
        paymentMethod: payment.payment_method,
        transactionId: payment.transaction_id,
        receiptNumber: payment.receipt_number,
        remarks: payment.remarks,
        createdAt: payment.created_at,
        processedBy: `${payment.processor_first_name} ${payment.processor_last_name}`,
    }));
    res.json({
        success: true,
        data: {
            studentFeeId: studentFeeId,
            summary: {
                originalAmount: parseFloat(summary.amount),
                discountAmount: parseFloat(summary.discount_amount),
                totalAmount: totalAmount,
                totalPaid: totalPaid,
                pendingAmount: totalAmount - totalPaid,
                status: summary.status,
                paymentCount: payments.length,
            },
            payments: payments,
        },
    });
});
exports.getPaymentStatistics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { period = 'month', classId, feeCategoryId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    let startDate;
    let endDate;
    const today = new Date();
    switch (period) {
        case 'today':
            startDate = endDate = today.toISOString().split('T')[0];
            break;
        case 'week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            startDate = weekStart.toISOString().split('T')[0];
            endDate = today.toISOString().split('T')[0];
            break;
        case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            endDate = today.toISOString().split('T')[0];
            break;
        case 'year':
            startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
            endDate = today.toISOString().split('T')[0];
            break;
        default:
            startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            endDate = today.toISOString().split('T')[0];
    }
    let whereClause = 'WHERE p.payment_date BETWEEN $1 AND $2';
    const queryParams = [startDate, endDate];
    if (userRole === 'teacher') {
        whereClause += ` AND (c.teacher_id = $${queryParams.length + 1} OR EXISTS (
      SELECT 1 FROM class_subjects cs 
      WHERE cs.class_id = c.id AND cs.teacher_id = $${queryParams.length + 1}
    ))`;
        queryParams.push(userId);
    }
    else if (userRole === 'student') {
        whereClause += ` AND s.user_id = $${queryParams.length + 1}`;
        queryParams.push(userId);
    }
    else if (userRole === 'parent') {
        whereClause += ` AND EXISTS (
      SELECT 1 FROM student_parents sp 
      WHERE sp.student_id = s.id AND sp.parent_user_id = $${queryParams.length + 1}
    )`;
        queryParams.push(userId);
    }
    if (classId) {
        whereClause += ` AND s.class_id = $${queryParams.length + 1}`;
        queryParams.push(classId);
    }
    if (feeCategoryId) {
        whereClause += ` AND sf.fee_category_id = $${queryParams.length + 1}`;
        queryParams.push(feeCategoryId);
    }
    const statsResult = await (0, connection_1.query)(`SELECT 
       COUNT(*) as total_payments,
       COUNT(DISTINCT sf.student_id) as unique_students,
       COUNT(DISTINCT sf.fee_category_id) as unique_fee_categories,
       SUM(p.amount) as total_amount,
       AVG(p.amount) as average_payment,
       MIN(p.amount) as min_payment,
       MAX(p.amount) as max_payment
     FROM payments p
     JOIN student_fees sf ON p.student_fee_id = sf.id
     JOIN students s ON sf.student_id = s.id
     JOIN classes c ON s.class_id = c.id
     ${whereClause}`, queryParams);
    const methodBreakdownResult = await (0, connection_1.query)(`SELECT 
       p.payment_method,
       COUNT(*) as payment_count,
       SUM(p.amount) as total_amount
     FROM payments p
     JOIN student_fees sf ON p.student_fee_id = sf.id
     JOIN students s ON sf.student_id = s.id
     JOIN classes c ON s.class_id = c.id
     ${whereClause}
     GROUP BY p.payment_method
     ORDER BY total_amount DESC`, queryParams);
    const trendsResult = await (0, connection_1.query)(`SELECT 
       p.payment_date,
       COUNT(*) as payment_count,
       SUM(p.amount) as daily_total
     FROM payments p
     JOIN student_fees sf ON p.student_fee_id = sf.id
     JOIN students s ON sf.student_id = s.id
     JOIN classes c ON s.class_id = c.id
     ${whereClause}
     GROUP BY p.payment_date
     ORDER BY p.payment_date`, queryParams);
    const topCategoriesResult = await (0, connection_1.query)(`SELECT 
       fc.id,
       fc.name,
       COUNT(*) as payment_count,
       SUM(p.amount) as total_collected
     FROM payments p
     JOIN student_fees sf ON p.student_fee_id = sf.id
     JOIN students s ON sf.student_id = s.id
     JOIN classes c ON s.class_id = c.id
     JOIN fee_categories fc ON sf.fee_category_id = fc.id
     ${whereClause}
     GROUP BY fc.id, fc.name
     ORDER BY total_collected DESC
     LIMIT 5`, queryParams);
    const stats = statsResult.rows[0];
    res.json({
        success: true,
        data: {
            period: period,
            dateRange: {
                startDate,
                endDate,
            },
            overview: {
                totalPayments: parseInt(stats.total_payments),
                uniqueStudents: parseInt(stats.unique_students),
                uniqueFeeCategories: parseInt(stats.unique_fee_categories),
                totalAmount: parseFloat(stats.total_amount) || 0,
                averagePayment: parseFloat(stats.average_payment) || 0,
                minPayment: parseFloat(stats.min_payment) || 0,
                maxPayment: parseFloat(stats.max_payment) || 0,
            },
            paymentMethods: methodBreakdownResult.rows.map((method) => ({
                method: method.payment_method,
                paymentCount: parseInt(method.payment_count),
                totalAmount: parseFloat(method.total_amount),
            })),
            dailyTrends: trendsResult.rows.map((trend) => ({
                date: trend.payment_date,
                paymentCount: parseInt(trend.payment_count),
                totalAmount: parseFloat(trend.daily_total),
            })),
            topFeeCategories: topCategoriesResult.rows.map((category) => ({
                id: category.id,
                name: category.name,
                paymentCount: parseInt(category.payment_count),
                totalCollected: parseFloat(category.total_collected),
            })),
        },
    });
});
exports.reversePayment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const processedBy = req.user.id;
    if (!reason || reason.trim().length === 0) {
        throw new errorHandler_1.AppError('Reason for payment reversal is required', 400);
    }
    const paymentResult = await (0, connection_1.query)(`SELECT p.id, p.student_fee_id, p.amount, p.payment_date, p.receipt_number,
            sf.total_amount, sf.status,
            s.student_id as student_number, u.first_name, u.last_name
     FROM payments p
     JOIN student_fees sf ON p.student_fee_id = sf.id
     JOIN students s ON sf.student_id = s.id
     JOIN users u ON s.user_id = u.id
     WHERE p.id = $1`, [id]);
    if (paymentResult.rows.length === 0) {
        throw new errorHandler_1.AppError('Payment not found', 404);
    }
    const payment = paymentResult.rows[0];
    const paymentDate = new Date(payment.payment_date);
    const today = new Date();
    const daysDiff = Math.ceil((today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 30) {
        throw new errorHandler_1.AppError('Cannot reverse payments older than 30 days', 400);
    }
    const client = await (0, connection_1.getClient)();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM payments WHERE id = $1', [id]);
        const remainingPaymentsResult = await client.query('SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE student_fee_id = $1', [payment.student_fee_id]);
        const totalPaid = parseFloat(remainingPaymentsResult.rows[0].total_paid);
        const totalAmount = parseFloat(payment.total_amount);
        let newStatus = 'pending';
        if (totalPaid >= totalAmount) {
            newStatus = 'paid';
        }
        else if (totalPaid > 0) {
            newStatus = 'partial';
        }
        else {
            const feeResult = await client.query('SELECT due_date FROM student_fees WHERE id = $1', [payment.student_fee_id]);
            const dueDate = new Date(feeResult.rows[0].due_date);
            if (dueDate < today) {
                newStatus = 'overdue';
            }
        }
        await client.query('UPDATE student_fees SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newStatus, payment.student_fee_id]);
        await client.query('COMMIT');
        res.json({
            success: true,
            message: 'Payment reversed successfully',
            data: {
                reversedPayment: {
                    id: payment.id,
                    amount: parseFloat(payment.amount),
                    receiptNumber: payment.receipt_number,
                    paymentDate: payment.payment_date,
                },
                studentFee: {
                    id: payment.student_fee_id,
                    studentNumber: payment.student_number,
                    studentName: `${payment.first_name} ${payment.last_name}`,
                    previousStatus: payment.status,
                    newStatus: newStatus,
                    totalAmount: totalAmount,
                    remainingPaid: totalPaid,
                    pendingAmount: totalAmount - totalPaid,
                },
                reversal: {
                    reason: reason,
                    reversedBy: processedBy,
                    reversedAt: new Date().toISOString(),
                },
            },
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
});
const validatePaymentData = (paymentData, pendingAmount) => {
    const errors = [];
    if (!paymentData.amount || paymentData.amount <= 0) {
        errors.push('Payment amount must be greater than 0');
    }
    if (paymentData.amount > pendingAmount) {
        errors.push(`Payment amount cannot exceed pending amount of ${pendingAmount}`);
    }
    if (!paymentData.paymentMethod) {
        errors.push('Payment method is required');
    }
    const validMethods = ['cash', 'card', 'bank_transfer', 'cheque', 'online', 'upi'];
    if (paymentData.paymentMethod && !validMethods.includes(paymentData.paymentMethod)) {
        errors.push('Invalid payment method');
    }
    if (paymentData.paymentMethod === 'cheque' && !paymentData.transactionId) {
        errors.push('Cheque number is required for cheque payments');
    }
    if (['card', 'online', 'upi'].includes(paymentData.paymentMethod) && !paymentData.transactionId) {
        errors.push('Transaction ID is required for electronic payments');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validatePaymentData = validatePaymentData;
//# sourceMappingURL=paymentController.js.map
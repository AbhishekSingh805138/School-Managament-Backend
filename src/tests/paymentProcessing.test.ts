// Payment Processing System Tests
describe('Payment Processing System', () => {
  
  describe('Payment Validation', () => {
    it('should validate payment amounts correctly', () => {
      const validatePaymentAmount = (paymentAmount: number, pendingAmount: number) => {
        const errors: string[] = [];
        
        if (paymentAmount <= 0) {
          errors.push('Payment amount must be greater than 0');
        }
        
        if (paymentAmount > pendingAmount) {
          errors.push('Payment amount cannot exceed pending amount');
        }
        
        return {
          isValid: errors.length === 0,
          errors
        };
      };

      expect(validatePaymentAmount(1000, 5000).isValid).toBe(true);
      expect(validatePaymentAmount(5000, 5000).isValid).toBe(true);
      expect(validatePaymentAmount(0, 5000).isValid).toBe(false);
      expect(validatePaymentAmount(-100, 5000).isValid).toBe(false);
      expect(validatePaymentAmount(6000, 5000).isValid).toBe(false);
    });

    it('should validate payment methods correctly', () => {
      const validPaymentMethods = ['cash', 'card', 'bank_transfer', 'cheque', 'online', 'upi'];
      
      const validatePaymentMethod = (method: string, transactionId?: string) => {
        const errors: string[] = [];
        
        if (!validPaymentMethods.includes(method)) {
          errors.push('Invalid payment method');
        }
        
        if (method === 'cheque' && !transactionId) {
          errors.push('Cheque number is required for cheque payments');
        }
        
        if (['card', 'online', 'upi'].includes(method) && !transactionId) {
          errors.push('Transaction ID is required for electronic payments');
        }
        
        return {
          isValid: errors.length === 0,
          errors
        };
      };

      expect(validatePaymentMethod('cash').isValid).toBe(true);
      expect(validatePaymentMethod('card', 'TXN123').isValid).toBe(true);
      expect(validatePaymentMethod('cheque', 'CHQ123').isValid).toBe(true);
      expect(validatePaymentMethod('invalid').isValid).toBe(false);
      expect(validatePaymentMethod('card').isValid).toBe(false);
      expect(validatePaymentMethod('cheque').isValid).toBe(false);
    });

    it('should validate transaction requirements by payment method', () => {
      const requiresTransactionId = (paymentMethod: string) => {
        return ['card', 'bank_transfer', 'online', 'upi'].includes(paymentMethod);
      };

      const requiresChequeNumber = (paymentMethod: string) => {
        return paymentMethod === 'cheque';
      };

      expect(requiresTransactionId('cash')).toBe(false);
      expect(requiresTransactionId('card')).toBe(true);
      expect(requiresTransactionId('upi')).toBe(true);
      expect(requiresChequeNumber('cheque')).toBe(true);
      expect(requiresChequeNumber('cash')).toBe(false);
    });
  });

  describe('Payment Status Updates', () => {
    it('should determine correct fee status after payment', () => {
      const determineFeeStatus = (totalAmount: number, totalPaid: number) => {
        if (totalPaid >= totalAmount) {
          return 'paid';
        } else if (totalPaid > 0) {
          return 'partial';
        } else {
          return 'pending';
        }
      };

      expect(determineFeeStatus(5000, 5000)).toBe('paid');
      expect(determineFeeStatus(5000, 5001)).toBe('paid'); // Overpayment still counts as paid
      expect(determineFeeStatus(5000, 2500)).toBe('partial');
      expect(determineFeeStatus(5000, 0)).toBe('pending');
    });

    it('should calculate remaining balance correctly', () => {
      const calculateBalance = (totalAmount: number, totalPaid: number) => {
        return Math.max(0, totalAmount - totalPaid);
      };

      expect(calculateBalance(5000, 2500)).toBe(2500);
      expect(calculateBalance(5000, 5000)).toBe(0);
      expect(calculateBalance(5000, 5500)).toBe(0); // No negative balance
      expect(calculateBalance(5000, 0)).toBe(5000);
    });

    it('should track payment progress correctly', () => {
      const calculatePaymentProgress = (totalAmount: number, totalPaid: number) => {
        if (totalAmount === 0) return 100;
        return Math.min(100, Math.round((totalPaid / totalAmount) * 100 * 100) / 100);
      };

      expect(calculatePaymentProgress(5000, 2500)).toBe(50);
      expect(calculatePaymentProgress(5000, 5000)).toBe(100);
      expect(calculatePaymentProgress(5000, 5500)).toBe(100);
      expect(calculatePaymentProgress(5000, 0)).toBe(0);
      expect(calculatePaymentProgress(0, 0)).toBe(100);
    });
  });

  describe('Receipt Generation', () => {
    it('should generate receipt numbers correctly', () => {
      const generateReceiptNumber = (lastReceiptNumber: string = 'RCP000000') => {
        const match = lastReceiptNumber.match(/RCP(\d+)/);
        if (!match) return 'RCP000001';
        
        const nextNumber = parseInt(match[1]) + 1;
        return `RCP${nextNumber.toString().padStart(6, '0')}`;
      };

      expect(generateReceiptNumber('RCP000001')).toBe('RCP000002');
      expect(generateReceiptNumber('RCP000999')).toBe('RCP001000');
      expect(generateReceiptNumber('RCP999999')).toBe('RCP1000000');
      expect(generateReceiptNumber()).toBe('RCP000001');
    });

    it('should validate receipt number format', () => {
      const isValidReceiptNumber = (receiptNumber: string) => {
        return /^RCP\d{6,}$/.test(receiptNumber);
      };

      expect(isValidReceiptNumber('RCP000001')).toBe(true);
      expect(isValidReceiptNumber('RCP123456')).toBe(true);
      expect(isValidReceiptNumber('RCP1000000')).toBe(true);
      expect(isValidReceiptNumber('RCP12345')).toBe(false); // Too short
      expect(isValidReceiptNumber('RCPABCDEF')).toBe(false); // Non-numeric
      expect(isValidReceiptNumber('INV000001')).toBe(false); // Wrong prefix
    });

    it('should format receipt data correctly', () => {
      const formatReceiptData = (payment: any, student: any, fee: any) => {
        return {
          receiptNumber: payment.receiptNumber,
          paymentDate: payment.paymentDate,
          student: {
            name: `${student.firstName} ${student.lastName}`,
            id: student.studentId,
            class: student.className,
          },
          fee: {
            category: fee.categoryName,
            amount: fee.totalAmount,
          },
          payment: {
            amount: payment.amount,
            method: payment.method,
          },
          formattedAmount: `₹${payment.amount.toLocaleString('en-IN')}`,
        };
      };

      const mockPayment = {
        receiptNumber: 'RCP000001',
        paymentDate: '2024-01-15',
        amount: 5000,
        method: 'cash'
      };

      const mockStudent = {
        firstName: 'John',
        lastName: 'Doe',
        studentId: 'STU001',
        className: 'Class 10-A'
      };

      const mockFee = {
        categoryName: 'Tuition Fee',
        totalAmount: 5000
      };

      const receipt = formatReceiptData(mockPayment, mockStudent, mockFee);
      
      expect(receipt.receiptNumber).toBe('RCP000001');
      expect(receipt.student.name).toBe('John Doe');
      expect(receipt.formattedAmount).toBe('₹5,000');
    });
  });

  describe('Payment History Tracking', () => {
    it('should calculate payment statistics correctly', () => {
      const payments = [
        { amount: 1000, method: 'cash', date: '2024-01-01' },
        { amount: 2000, method: 'card', date: '2024-01-02' },
        { amount: 1500, method: 'cash', date: '2024-01-03' },
        { amount: 3000, method: 'upi', date: '2024-01-04' },
      ];

      const calculateStatistics = (payments: any[]) => {
        const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        const averageAmount = totalAmount / payments.length;
        const methodCounts = payments.reduce((counts, p) => {
          counts[p.method] = (counts[p.method] || 0) + 1;
          return counts;
        }, {} as { [key: string]: number });

        return {
          totalPayments: payments.length,
          totalAmount,
          averageAmount: Math.round(averageAmount * 100) / 100,
          methodCounts,
          minAmount: Math.min(...payments.map(p => p.amount)),
          maxAmount: Math.max(...payments.map(p => p.amount)),
        };
      };

      const stats = calculateStatistics(payments);
      
      expect(stats.totalPayments).toBe(4);
      expect(stats.totalAmount).toBe(7500);
      expect(stats.averageAmount).toBe(1875);
      expect(stats.methodCounts.cash).toBe(2);
      expect(stats.methodCounts.card).toBe(1);
      expect(stats.methodCounts.upi).toBe(1);
      expect(stats.minAmount).toBe(1000);
      expect(stats.maxAmount).toBe(3000);
    });

    it('should group payments by time period correctly', () => {
      const payments = [
        { amount: 1000, date: '2024-01-01' },
        { amount: 2000, date: '2024-01-01' },
        { amount: 1500, date: '2024-01-02' },
        { amount: 3000, date: '2024-01-03' },
      ];

      const groupByDate = (payments: any[]) => {
        return payments.reduce((groups, payment) => {
          const date = payment.date;
          if (!groups[date]) {
            groups[date] = { count: 0, total: 0 };
          }
          groups[date].count++;
          groups[date].total += payment.amount;
          return groups;
        }, {} as { [key: string]: { count: number; total: number } });
      };

      const grouped = groupByDate(payments);
      
      expect(grouped['2024-01-01'].count).toBe(2);
      expect(grouped['2024-01-01'].total).toBe(3000);
      expect(grouped['2024-01-02'].count).toBe(1);
      expect(grouped['2024-01-02'].total).toBe(1500);
      expect(grouped['2024-01-03'].count).toBe(1);
      expect(grouped['2024-01-03'].total).toBe(3000);
    });
  });

  describe('Payment Reversal Logic', () => {
    it('should validate reversal eligibility', () => {
      const canReversePayment = (paymentDate: string, maxDays: number = 30) => {
        const payment = new Date(paymentDate);
        const today = new Date();
        const daysDiff = Math.ceil((today.getTime() - payment.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          canReverse: daysDiff <= maxDays,
          daysSincePayment: daysDiff,
          reason: daysDiff > maxDays ? `Payment is ${daysDiff} days old, exceeds ${maxDays} day limit` : null
        };
      };

      const today = new Date();
      const recentDate = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      const oldDate = new Date(today.getTime() - 35 * 24 * 60 * 60 * 1000); // 35 days ago

      expect(canReversePayment(recentDate.toISOString().split('T')[0]).canReverse).toBe(true);
      expect(canReversePayment(oldDate.toISOString().split('T')[0]).canReverse).toBe(false);
    });

    it('should calculate impact of payment reversal', () => {
      const calculateReversalImpact = (
        totalAmount: number, 
        currentPaid: number, 
        reversalAmount: number
      ) => {
        const newPaidAmount = currentPaid - reversalAmount;
        const newPendingAmount = totalAmount - newPaidAmount;
        
        let newStatus = 'pending';
        if (newPaidAmount >= totalAmount) {
          newStatus = 'paid';
        } else if (newPaidAmount > 0) {
          newStatus = 'partial';
        }

        return {
          previousPaid: currentPaid,
          newPaidAmount,
          newPendingAmount,
          newStatus,
          reversalAmount
        };
      };

      const impact = calculateReversalImpact(5000, 3000, 1000);
      
      expect(impact.previousPaid).toBe(3000);
      expect(impact.newPaidAmount).toBe(2000);
      expect(impact.newPendingAmount).toBe(3000);
      expect(impact.newStatus).toBe('partial');
      expect(impact.reversalAmount).toBe(1000);
    });
  });

  describe('Partial Payment Support', () => {
    it('should handle multiple partial payments correctly', () => {
      const processPartialPayments = (totalAmount: number, payments: number[]) => {
        let totalPaid = 0;
        const paymentHistory = [];
        
        for (const payment of payments) {
          const previousBalance = totalAmount - totalPaid;
          
          if (payment > previousBalance) {
            throw new Error(`Payment ${payment} exceeds remaining balance ${previousBalance}`);
          }
          
          totalPaid += payment;
          const remainingBalance = totalAmount - totalPaid;
          
          let status = 'pending';
          if (totalPaid >= totalAmount) {
            status = 'paid';
          } else if (totalPaid > 0) {
            status = 'partial';
          }
          
          paymentHistory.push({
            payment,
            totalPaid,
            remainingBalance,
            status
          });
        }
        
        return paymentHistory;
      };

      const history = processPartialPayments(5000, [1000, 2000, 2000]);
      
      expect(history).toHaveLength(3);
      expect(history[0].status).toBe('partial');
      expect(history[1].status).toBe('partial');
      expect(history[2].status).toBe('paid');
      expect(history[2].totalPaid).toBe(5000);
      expect(history[2].remainingBalance).toBe(0);
    });

    it('should prevent overpayment', () => {
      const validatePartialPayment = (totalAmount: number, currentPaid: number, newPayment: number) => {
        const remainingBalance = totalAmount - currentPaid;
        
        if (newPayment > remainingBalance) {
          return {
            valid: false,
            error: `Payment amount ${newPayment} exceeds remaining balance ${remainingBalance}`,
            maxAllowed: remainingBalance
          };
        }
        
        return {
          valid: true,
          newTotal: currentPaid + newPayment,
          newBalance: remainingBalance - newPayment
        };
      };

      expect(validatePartialPayment(5000, 3000, 1000).valid).toBe(true);
      expect(validatePartialPayment(5000, 3000, 2000).valid).toBe(true);
      expect(validatePartialPayment(5000, 3000, 3000).valid).toBe(false);
      expect(validatePartialPayment(5000, 3000, 2000).newBalance).toBe(0);
    });
  });

  describe('Authorization and Access Control', () => {
    it('should validate payment processing permissions', () => {
      const canProcessPayment = (userRole: string) => {
        const allowedRoles = ['admin', 'staff', 'accountant'];
        return allowedRoles.includes(userRole);
      };

      expect(canProcessPayment('admin')).toBe(true);
      expect(canProcessPayment('staff')).toBe(true);
      expect(canProcessPayment('accountant')).toBe(true);
      expect(canProcessPayment('teacher')).toBe(false);
      expect(canProcessPayment('student')).toBe(false);
      expect(canProcessPayment('parent')).toBe(false);
    });

    it('should validate payment viewing permissions', () => {
      const canViewPayment = (
        userRole: string, 
        userId: string, 
        studentUserId: string, 
        parentIds: string[]
      ) => {
        switch (userRole) {
          case 'admin':
          case 'staff':
            return { hasAccess: true, reason: 'Administrative access' };
          case 'student':
            return { 
              hasAccess: userId === studentUserId, 
              reason: userId === studentUserId ? 'Own payment' : 'Access denied' 
            };
          case 'parent':
            return { 
              hasAccess: parentIds.includes(userId), 
              reason: parentIds.includes(userId) ? 'Child payment' : 'Access denied' 
            };
          default:
            return { hasAccess: false, reason: 'Unknown role' };
        }
      };

      expect(canViewPayment('admin', 'admin-1', 'student-1', []).hasAccess).toBe(true);
      expect(canViewPayment('student', 'student-1', 'student-1', []).hasAccess).toBe(true);
      expect(canViewPayment('student', 'student-2', 'student-1', []).hasAccess).toBe(false);
      expect(canViewPayment('parent', 'parent-1', 'student-1', ['parent-1']).hasAccess).toBe(true);
      expect(canViewPayment('parent', 'parent-2', 'student-1', ['parent-1']).hasAccess).toBe(false);
    });
  });
});
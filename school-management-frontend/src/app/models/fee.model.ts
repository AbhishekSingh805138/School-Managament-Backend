export interface FeeCategory {
  id: string;
  name: string;
  description?: string;
  amount: number;
  frequency: FeeFrequency;
  isMandatory: boolean;
  academicYearId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type FeeFrequency = 'monthly' | 'quarterly' | 'semester' | 'annual' | 'one-time';

export interface StudentFee {
  id: string;
  studentId: string;
  feeCategoryId: string;
  amount: number;
  dueDate: string;
  status: FeeStatus;
  createdAt: string;
  updatedAt: string;
  feeCategory: FeeCategory;
  student?: {
    id: string;
    studentId: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export type FeeStatus = 'pending' | 'partial' | 'paid' | 'overdue';

export interface Payment {
  id: string;
  studentFeeId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  receiptNumber: string;
  processedBy: string;
  createdAt: string;
  updatedAt: string;
  studentFee?: StudentFee;
}

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'online';

export interface CreatePayment {
  studentFeeId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  receiptNumber?: string;
}

export interface FeeStats {
  totalFees: number;
  collectedAmount: number;
  pendingAmount: number;
  overdueAmount: number;
}
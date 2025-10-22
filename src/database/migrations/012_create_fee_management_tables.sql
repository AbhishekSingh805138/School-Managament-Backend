-- Create fee_categories table
CREATE TABLE IF NOT EXISTS fee_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alt_id VARCHAR(50),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'semester', 'annual', 'one-time')),
    is_mandatory BOOLEAN DEFAULT true,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_fee_amount CHECK (amount >= 0),
    CONSTRAINT unique_fee_name_per_year UNIQUE(name, academic_year_id)
);

-- Create indexes for fee_categories
CREATE INDEX IF NOT EXISTS idx_fee_categories_alt_id ON fee_categories(alt_id);
CREATE INDEX IF NOT EXISTS idx_fee_categories_academic_year_id ON fee_categories(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_fee_categories_active ON fee_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_fee_categories_frequency ON fee_categories(frequency);

-- Create trigger for fee_categories table
CREATE TRIGGER update_fee_categories_updated_at 
    BEFORE UPDATE ON fee_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create student_fees table
CREATE TABLE IF NOT EXISTS student_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alt_id VARCHAR(50),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    fee_category_id UUID NOT NULL REFERENCES fee_categories(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'waived')),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (amount - discount_amount) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_student_fee_amount CHECK (amount >= 0),
    CONSTRAINT check_discount_amount CHECK (discount_amount >= 0 AND discount_amount <= amount),
    CONSTRAINT unique_student_fee_category UNIQUE(student_id, fee_category_id)
);

-- Create indexes for student_fees
CREATE INDEX IF NOT EXISTS idx_student_fees_alt_id ON student_fees(alt_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_student_id ON student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_fee_category_id ON student_fees(fee_category_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_status ON student_fees(status);
CREATE INDEX IF NOT EXISTS idx_student_fees_due_date ON student_fees(due_date);
CREATE INDEX IF NOT EXISTS idx_student_fees_overdue ON student_fees(due_date, status) WHERE status IN ('pending', 'partial');

-- Create trigger for student_fees table
CREATE TRIGGER update_student_fees_updated_at 
    BEFORE UPDATE ON student_fees 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alt_id VARCHAR(50),
    student_fee_id UUID NOT NULL REFERENCES student_fees(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'cheque', 'online', 'upi')),
    transaction_id VARCHAR(100),
    receipt_number VARCHAR(50) UNIQUE,
    processed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_payment_amount CHECK (amount > 0)
);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_alt_id ON payments(alt_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_fee_id ON payments(student_fee_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_receipt_number ON payments(receipt_number);
CREATE INDEX IF NOT EXISTS idx_payments_processed_by ON payments(processed_by);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);

-- Create trigger for payments table
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update student fee status after payment
CREATE OR REPLACE FUNCTION update_student_fee_status()
RETURNS TRIGGER AS $$
DECLARE
    total_paid DECIMAL(10,2);
    fee_total DECIMAL(10,2);
BEGIN
    -- Get the total amount for the fee
    SELECT total_amount INTO fee_total
    FROM student_fees
    WHERE id = NEW.student_fee_id;
    
    -- Calculate total paid amount
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM payments
    WHERE student_fee_id = NEW.student_fee_id;
    
    -- Update fee status based on payment
    IF total_paid >= fee_total THEN
        UPDATE student_fees 
        SET status = 'paid', updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.student_fee_id;
    ELSIF total_paid > 0 THEN
        UPDATE student_fees 
        SET status = 'partial', updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.student_fee_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update fee status after payment
CREATE TRIGGER update_fee_status_after_payment
    AFTER INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_student_fee_status();

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    receipt_num VARCHAR(50);
BEGIN
    IF NEW.receipt_number IS NULL THEN
        -- Generate sequential receipt number
        SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
        INTO next_number
        FROM payments
        WHERE receipt_number ~ '^RCP[0-9]+$';
        
        receipt_num := 'RCP' || LPAD(next_number::TEXT, 6, '0');
        NEW.receipt_number := receipt_num;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to generate receipt number
CREATE TRIGGER generate_receipt_number_trigger
    BEFORE INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION generate_receipt_number();
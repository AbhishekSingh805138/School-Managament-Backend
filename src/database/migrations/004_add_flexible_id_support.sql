-- Add support for both UUID and regular IDs
-- This migration adds alternative ID columns that can handle both formats

-- Add alternative ID columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS alt_id VARCHAR(50);

-- Add alternative ID columns to classes table  
ALTER TABLE classes ADD COLUMN IF NOT EXISTS alt_id VARCHAR(50);

-- Add alternative ID columns to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS alt_id VARCHAR(50);

-- Create indexes for the new alternative ID columns
CREATE INDEX IF NOT EXISTS idx_users_alt_id ON users(alt_id);
CREATE INDEX IF NOT EXISTS idx_classes_alt_id ON classes(alt_id);
CREATE INDEX IF NOT EXISTS idx_students_alt_id ON students(alt_id);

-- Function to generate sequential IDs if needed
CREATE OR REPLACE FUNCTION generate_sequential_id(table_name TEXT)
RETURNS INTEGER AS $$
DECLARE
    next_id INTEGER;
BEGIN
    EXECUTE format('SELECT COALESCE(MAX(CAST(alt_id AS INTEGER)), 0) + 1 FROM %I WHERE alt_id ~ ''^[0-9]+$''', table_name) INTO next_id;
    RETURN next_id;
END;
$$ LANGUAGE plpgsql;

-- Create student_parents table for parent-student relationships
CREATE TABLE IF NOT EXISTS student_parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship_type VARCHAR(20) NOT NULL CHECK (relationship_type IN ('father', 'mother', 'guardian', 'other')),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_student_parent UNIQUE(student_id, parent_user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_student_parents_student_id ON student_parents(student_id);
CREATE INDEX IF NOT EXISTS idx_student_parents_parent_user_id ON student_parents(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_student_parents_primary ON student_parents(is_primary);

-- Create trigger for student_parents table
CREATE TRIGGER update_student_parents_updated_at 
    BEFORE UPDATE ON student_parents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create student_class_history table to track class changes
CREATE TABLE IF NOT EXISTS student_class_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_history_dates CHECK (end_date IS NULL OR end_date > start_date)
);

-- Create indexes for student_class_history
CREATE INDEX IF NOT EXISTS idx_student_class_history_student_id ON student_class_history(student_id);
CREATE INDEX IF NOT EXISTS idx_student_class_history_class_id ON student_class_history(class_id);
CREATE INDEX IF NOT EXISTS idx_student_class_history_academic_year_id ON student_class_history(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_student_class_history_dates ON student_class_history(start_date, end_date);

-- Create trigger for student_class_history table
CREATE TRIGGER update_student_class_history_updated_at 
    BEFORE UPDATE ON student_class_history 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
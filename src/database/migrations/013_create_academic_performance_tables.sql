-- Create assessment_types table
CREATE TABLE IF NOT EXISTS assessment_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alt_id VARCHAR(50),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    weightage DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_weightage CHECK (weightage > 0 AND weightage <= 100),
    CONSTRAINT unique_assessment_type_name UNIQUE(name)
);

-- Create indexes for assessment_types
CREATE INDEX IF NOT EXISTS idx_assessment_types_alt_id ON assessment_types(alt_id);
CREATE INDEX IF NOT EXISTS idx_assessment_types_active ON assessment_types(is_active);

-- Create trigger for assessment_types table
CREATE TRIGGER update_assessment_types_updated_at 
    BEFORE UPDATE ON assessment_types 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create grades table
CREATE TABLE IF NOT EXISTS grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alt_id VARCHAR(50),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    assessment_type_id UUID NOT NULL REFERENCES assessment_types(id) ON DELETE CASCADE,
    marks_obtained DECIMAL(6,2) NOT NULL,
    total_marks DECIMAL(6,2) NOT NULL,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (ROUND((marks_obtained / total_marks) * 100, 2)) STORED,
    grade_letter VARCHAR(5),
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    recorded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_marks_obtained CHECK (marks_obtained >= 0),
    CONSTRAINT check_total_marks CHECK (total_marks > 0),
    CONSTRAINT check_marks_not_exceed_total CHECK (marks_obtained <= total_marks),
    CONSTRAINT unique_student_subject_assessment_semester UNIQUE(student_id, subject_id, assessment_type_id, semester_id)
);

-- Create indexes for grades
CREATE INDEX IF NOT EXISTS idx_grades_alt_id ON grades(alt_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_assessment_type_id ON grades(assessment_type_id);
CREATE INDEX IF NOT EXISTS idx_grades_semester_id ON grades(semester_id);
CREATE INDEX IF NOT EXISTS idx_grades_recorded_by ON grades(recorded_by);
CREATE INDEX IF NOT EXISTS idx_grades_percentage ON grades(percentage);
CREATE INDEX IF NOT EXISTS idx_grades_student_semester ON grades(student_id, semester_id);

-- Create trigger for grades table
CREATE TRIGGER update_grades_updated_at 
    BEFORE UPDATE ON grades 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create report_cards table
CREATE TABLE IF NOT EXISTS report_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alt_id VARCHAR(50),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    overall_percentage DECIMAL(5,2),
    overall_grade VARCHAR(5),
    rank_in_class INTEGER,
    total_students INTEGER,
    remarks TEXT,
    generated_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_overall_percentage CHECK (overall_percentage >= 0 AND overall_percentage <= 100),
    CONSTRAINT check_rank CHECK (rank_in_class > 0),
    CONSTRAINT check_total_students CHECK (total_students > 0),
    CONSTRAINT check_rank_not_exceed_total CHECK (rank_in_class <= total_students),
    CONSTRAINT unique_student_semester_report UNIQUE(student_id, semester_id)
);

-- Create indexes for report_cards
CREATE INDEX IF NOT EXISTS idx_report_cards_alt_id ON report_cards(alt_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_student_id ON report_cards(student_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_semester_id ON report_cards(semester_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_overall_percentage ON report_cards(overall_percentage);
CREATE INDEX IF NOT EXISTS idx_report_cards_rank ON report_cards(rank_in_class);
CREATE INDEX IF NOT EXISTS idx_report_cards_generated_by ON report_cards(generated_by);

-- Create trigger for report_cards table
CREATE TRIGGER update_report_cards_updated_at 
    BEFORE UPDATE ON report_cards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate grade letter based on percentage
CREATE OR REPLACE FUNCTION calculate_grade_letter(percentage DECIMAL)
RETURNS VARCHAR(5) AS $$
BEGIN
    CASE
        WHEN percentage >= 90 THEN RETURN 'A+';
        WHEN percentage >= 80 THEN RETURN 'A';
        WHEN percentage >= 70 THEN RETURN 'B+';
        WHEN percentage >= 60 THEN RETURN 'B';
        WHEN percentage >= 50 THEN RETURN 'C+';
        WHEN percentage >= 40 THEN RETURN 'C';
        WHEN percentage >= 33 THEN RETURN 'D';
        ELSE RETURN 'F';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to update grade letter when percentage changes
CREATE OR REPLACE FUNCTION update_grade_letter()
RETURNS TRIGGER AS $$
BEGIN
    NEW.grade_letter := calculate_grade_letter(NEW.percentage);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update grade letter
CREATE TRIGGER update_grade_letter_trigger
    BEFORE INSERT OR UPDATE ON grades
    FOR EACH ROW
    EXECUTE FUNCTION update_grade_letter();

-- Function to calculate overall grade for report card
CREATE OR REPLACE FUNCTION calculate_overall_grade(
    p_student_id UUID,
    p_semester_id UUID
)
RETURNS TABLE(
    overall_percentage DECIMAL(5,2),
    overall_grade VARCHAR(5)
) AS $$
DECLARE
    avg_percentage DECIMAL(5,2);
    grade_letter VARCHAR(5);
BEGIN
    -- Calculate weighted average of all subjects
    SELECT ROUND(AVG(g.percentage), 2) INTO avg_percentage
    FROM grades g
    JOIN assessment_types at ON g.assessment_type_id = at.id
    WHERE g.student_id = p_student_id 
    AND g.semester_id = p_semester_id;
    
    -- Calculate grade letter
    grade_letter := calculate_grade_letter(COALESCE(avg_percentage, 0));
    
    RETURN QUERY SELECT COALESCE(avg_percentage, 0), grade_letter;
END;
$$ LANGUAGE plpgsql;
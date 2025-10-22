-- Create semesters table
CREATE TABLE IF NOT EXISTS semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alt_id VARCHAR(50),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_semester_dates CHECK (end_date > start_date),
    CONSTRAINT unique_semester_name_per_year UNIQUE(academic_year_id, name),
    CONSTRAINT check_only_one_active_semester_per_year EXCLUDE (academic_year_id WITH =, is_active WITH =) WHERE (is_active = true)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_semesters_alt_id ON semesters(alt_id);
CREATE INDEX IF NOT EXISTS idx_semesters_academic_year_id ON semesters(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_semesters_active ON semesters(is_active);
CREATE INDEX IF NOT EXISTS idx_semesters_dates ON semesters(start_date, end_date);

-- Create trigger for semesters table
CREATE TRIGGER update_semesters_updated_at 
    BEFORE UPDATE ON semesters 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to validate semester dates within academic year
CREATE OR REPLACE FUNCTION validate_semester_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if semester dates are within academic year dates
    IF NOT EXISTS (
        SELECT 1 FROM academic_years 
        WHERE id = NEW.academic_year_id 
        AND NEW.start_date >= start_date 
        AND NEW.end_date <= end_date
    ) THEN
        RAISE EXCEPTION 'Semester dates must be within the academic year dates';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate semester dates
CREATE TRIGGER validate_semester_dates_trigger
    BEFORE INSERT OR UPDATE ON semesters
    FOR EACH ROW
    EXECUTE FUNCTION validate_semester_dates();
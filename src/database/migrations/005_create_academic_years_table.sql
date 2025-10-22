-- Create academic years table
CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alt_id VARCHAR(50),
    name VARCHAR(100) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_academic_year_dates CHECK (end_date > start_date),
    CONSTRAINT check_only_one_active_year EXCLUDE (is_active WITH =) WHERE (is_active = true)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_academic_years_alt_id ON academic_years(alt_id);
CREATE INDEX IF NOT EXISTS idx_academic_years_active ON academic_years(is_active);
CREATE INDEX IF NOT EXISTS idx_academic_years_dates ON academic_years(start_date, end_date);

-- Create trigger for academic_years table
CREATE TRIGGER update_academic_years_updated_at 
    BEFORE UPDATE ON academic_years 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
-- Update classes table to include academic year and remove unique constraint
ALTER TABLE classes ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id) ON DELETE RESTRICT;

-- Drop the old unique constraint and create a new one that includes academic year
ALTER TABLE classes DROP CONSTRAINT IF EXISTS unique_class_grade_section;
ALTER TABLE classes ADD CONSTRAINT unique_class_grade_section_year UNIQUE(grade, section, academic_year_id);

-- Create index for academic year
CREATE INDEX IF NOT EXISTS idx_classes_academic_year_id ON classes(academic_year_id);

-- Create class_subjects table for many-to-many relationship between classes and subjects
CREATE TABLE IF NOT EXISTS class_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_class_subject UNIQUE(class_id, subject_id)
);

-- Create indexes for class_subjects
CREATE INDEX IF NOT EXISTS idx_class_subjects_class_id ON class_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject_id ON class_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_teacher_id ON class_subjects(teacher_id);

-- Create trigger for class_subjects table
CREATE TRIGGER update_class_subjects_updated_at 
    BEFORE UPDATE ON class_subjects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
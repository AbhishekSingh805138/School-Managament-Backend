-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    enrollment_date DATE NOT NULL,
    guardian_name VARCHAR(200) NOT NULL,
    guardian_phone VARCHAR(20) NOT NULL,
    guardian_email VARCHAR(255),
    emergency_contact VARCHAR(20) NOT NULL,
    medical_info TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);

-- Create trigger for students table
CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON students 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update class enrollment count
CREATE OR REPLACE FUNCTION update_class_enrollment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE classes 
        SET current_enrollment = current_enrollment + 1 
        WHERE id = NEW.class_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE classes 
        SET current_enrollment = current_enrollment - 1 
        WHERE id = OLD.class_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.class_id != NEW.class_id THEN
            UPDATE classes 
            SET current_enrollment = current_enrollment - 1 
            WHERE id = OLD.class_id;
            
            UPDATE classes 
            SET current_enrollment = current_enrollment + 1 
            WHERE id = NEW.class_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers for enrollment count
CREATE TRIGGER update_enrollment_on_insert 
    AFTER INSERT ON students 
    FOR EACH ROW 
    EXECUTE FUNCTION update_class_enrollment();

CREATE TRIGGER update_enrollment_on_delete 
    AFTER DELETE ON students 
    FOR EACH ROW 
    EXECUTE FUNCTION update_class_enrollment();

CREATE TRIGGER update_enrollment_on_update 
    AFTER UPDATE ON students 
    FOR EACH ROW 
    EXECUTE FUNCTION update_class_enrollment();

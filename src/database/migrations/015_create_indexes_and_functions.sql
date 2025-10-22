-- Additional indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);
CREATE INDEX IF NOT EXISTS idx_students_active ON students(is_active);
CREATE INDEX IF NOT EXISTS idx_classes_active ON classes(is_active);

-- Function to get student's current class
CREATE OR REPLACE FUNCTION get_student_current_class(p_student_id UUID)
RETURNS TABLE(
    class_id UUID,
    class_name VARCHAR(100),
    grade VARCHAR(20),
    section VARCHAR(10)
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.name, c.grade, c.section
    FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE s.id = p_student_id AND s.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to get class student count
CREATE OR REPLACE FUNCTION get_class_student_count(p_class_id UUID)
RETURNS INTEGER AS $$
DECLARE
    student_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO student_count
    FROM students
    WHERE class_id = p_class_id AND is_active = true;
    
    RETURN student_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check if teacher can be assigned to class
CREATE OR REPLACE FUNCTION can_assign_teacher_to_class(
    p_teacher_id UUID,
    p_class_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    teacher_exists BOOLEAN;
    class_exists BOOLEAN;
BEGIN
    -- Check if teacher exists and is active
    SELECT EXISTS(
        SELECT 1 FROM users u
        JOIN teachers t ON u.id = t.user_id
        WHERE u.id = p_teacher_id 
        AND u.role = 'teacher' 
        AND u.is_active = true 
        AND t.is_active = true
    ) INTO teacher_exists;
    
    -- Check if class exists and is active
    SELECT EXISTS(
        SELECT 1 FROM classes
        WHERE id = p_class_id AND is_active = true
    ) INTO class_exists;
    
    RETURN teacher_exists AND class_exists;
END;
$$ LANGUAGE plpgsql;

-- Function to get fee summary for student
CREATE OR REPLACE FUNCTION get_student_fee_summary(p_student_id UUID)
RETURNS TABLE(
    total_fees DECIMAL(10,2),
    paid_amount DECIMAL(10,2),
    pending_amount DECIMAL(10,2),
    overdue_amount DECIMAL(10,2)
) AS $$
DECLARE
    total_fees_amount DECIMAL(10,2) := 0;
    paid_fees_amount DECIMAL(10,2) := 0;
    pending_fees_amount DECIMAL(10,2) := 0;
    overdue_fees_amount DECIMAL(10,2) := 0;
BEGIN
    -- Calculate total fees
    SELECT COALESCE(SUM(total_amount), 0) INTO total_fees_amount
    FROM student_fees
    WHERE student_id = p_student_id;
    
    -- Calculate paid amount
    SELECT COALESCE(SUM(p.amount), 0) INTO paid_fees_amount
    FROM payments p
    JOIN student_fees sf ON p.student_fee_id = sf.id
    WHERE sf.student_id = p_student_id;
    
    -- Calculate pending amount
    SELECT COALESCE(SUM(total_amount), 0) INTO pending_fees_amount
    FROM student_fees
    WHERE student_id = p_student_id 
    AND status IN ('pending', 'partial');
    
    -- Calculate overdue amount
    SELECT COALESCE(SUM(total_amount), 0) INTO overdue_fees_amount
    FROM student_fees
    WHERE student_id = p_student_id 
    AND status IN ('pending', 'partial')
    AND due_date < CURRENT_DATE;
    
    RETURN QUERY SELECT 
        total_fees_amount,
        paid_fees_amount,
        pending_fees_amount,
        overdue_fees_amount;
END;
$$ LANGUAGE plpgsql;

-- Function to get class attendance summary
CREATE OR REPLACE FUNCTION get_class_attendance_summary(
    p_class_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    total_students INTEGER,
    present_count INTEGER,
    absent_count INTEGER,
    late_count INTEGER,
    excused_count INTEGER,
    attendance_percentage DECIMAL(5,2)
) AS $$
DECLARE
    total_students_count INTEGER;
    present_students INTEGER;
    absent_students INTEGER;
    late_students INTEGER;
    excused_students INTEGER;
    attendance_percent DECIMAL(5,2);
BEGIN
    -- Get total students in class
    SELECT COUNT(*) INTO total_students_count
    FROM students
    WHERE class_id = p_class_id AND is_active = true;
    
    -- Get attendance counts for the date
    SELECT 
        COALESCE(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END), 0)
    INTO present_students, absent_students, late_students, excused_students
    FROM attendance
    WHERE class_id = p_class_id AND date = p_date;
    
    -- Calculate attendance percentage
    IF total_students_count > 0 THEN
        attendance_percent := ROUND(((present_students + late_students)::DECIMAL / total_students_count::DECIMAL) * 100, 2);
    ELSE
        attendance_percent := 0;
    END IF;
    
    RETURN QUERY SELECT 
        total_students_count,
        present_students,
        absent_students,
        late_students,
        excused_students,
        attendance_percent;
END;
$$ LANGUAGE plpgsql;

-- Create view for student dashboard
CREATE OR REPLACE VIEW student_dashboard AS
SELECT 
    s.id as student_record_id,
    u.first_name,
    u.last_name,
    u.email,
    s.student_id,
    c.name as class_name,
    c.grade,
    c.section,
    s.enrollment_date,
    s.guardian_name,
    s.guardian_phone,
    s.is_active
FROM students s
JOIN users u ON s.user_id = u.id
JOIN classes c ON s.class_id = c.id
WHERE s.is_active = true AND u.is_active = true;

-- Create view for teacher dashboard
CREATE OR REPLACE VIEW teacher_dashboard AS
SELECT 
    t.id as teacher_id,
    u.first_name,
    u.last_name,
    u.email,
    t.employee_id,
    t.qualification,
    t.experience_years,
    t.specialization,
    t.joining_date,
    t.is_active
FROM teachers t
JOIN users u ON t.user_id = u.id
WHERE t.is_active = true AND u.is_active = true;
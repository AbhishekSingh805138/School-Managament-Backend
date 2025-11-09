-- Make teacher_id nullable in classes table
-- This allows classes to be created without assigning a teacher initially

ALTER TABLE classes ALTER COLUMN teacher_id DROP NOT NULL;

-- Add a comment to document this change
COMMENT ON COLUMN classes.teacher_id IS 'Optional reference to the class teacher. Can be NULL if no teacher is assigned yet.';

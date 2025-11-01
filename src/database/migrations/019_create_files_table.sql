-- Create files table for file upload management
CREATE TABLE IF NOT EXISTS files (
  id BIGSERIAL PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'student', 'teacher', 'staff', 'document', etc.
  entity_id BIGINT,
  file_type VARCHAR(50) NOT NULL, -- 'profile_picture', 'document', 'certificate', 'receipt', etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_files_entity ON files(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_file_type ON files(file_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_created_at ON files(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_deleted_at ON files(deleted_at) WHERE deleted_at IS NOT NULL;

-- Add comment
COMMENT ON TABLE files IS 'Stores metadata for all uploaded files in the system';
COMMENT ON COLUMN files.entity_type IS 'Type of entity the file belongs to (student, teacher, staff, etc.)';
COMMENT ON COLUMN files.entity_id IS 'ID of the entity the file belongs to';
COMMENT ON COLUMN files.file_type IS 'Type of file (profile_picture, document, certificate, receipt, etc.)';

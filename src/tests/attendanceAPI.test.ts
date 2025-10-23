import { 
  CreateAttendanceSchema, 
  CreateBulkAttendanceSchema, 
  UpdateAttendanceSchema,
  AttendanceStatusSchema 
} from '../types/attendance';

describe('Attendance API Validation', () => {
  
  describe('CreateAttendanceSchema Validation', () => {
    it('should validate correct attendance data', () => {
      const validData = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        classId: '123e4567-e89b-12d3-a456-426614174001',
        date: '2024-01-15',
        status: 'present' as const,
        remarks: 'On time'
      };

      const result = CreateAttendanceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty student ID', () => {
      const invalidData = {
        studentId: '',
        classId: '123e4567-e89b-12d3-a456-426614174001',
        date: '2024-01-15',
        status: 'present' as const
      };

      const result = CreateAttendanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid attendance status', () => {
      const invalidData = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        classId: '123e4567-e89b-12d3-a456-426614174001',
        date: '2024-01-15',
        status: 'invalid-status'
      };

      const result = CreateAttendanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept optional subject ID', () => {
      const validData = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        classId: '123e4567-e89b-12d3-a456-426614174001',
        subjectId: '123e4567-e89b-12d3-a456-426614174002',
        date: '2024-01-15',
        status: 'present' as const
      };

      const result = CreateAttendanceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('CreateBulkAttendanceSchema Validation', () => {
    it('should validate correct bulk attendance data', () => {
      const validData = {
        classId: '123e4567-e89b-12d3-a456-426614174001',
        date: '2024-01-15',
        attendance: [
          {
            studentId: '123e4567-e89b-12d3-a456-426614174000',
            status: 'present' as const,
            remarks: 'On time'
          },
          {
            studentId: '123e4567-e89b-12d3-a456-426614174003',
            status: 'absent' as const,
            remarks: 'Sick'
          }
        ]
      };

      const result = CreateBulkAttendanceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty attendance array', () => {
      const invalidData = {
        classId: '123e4567-e89b-12d3-a456-426614174001',
        date: '2024-01-15',
        attendance: []
      };

      const result = CreateBulkAttendanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate with optional subject ID', () => {
      const validData = {
        classId: '123e4567-e89b-12d3-a456-426614174001',
        subjectId: '123e4567-e89b-12d3-a456-426614174002',
        date: '2024-01-15',
        attendance: [
          {
            studentId: '123e4567-e89b-12d3-a456-426614174000',
            status: 'present' as const
          }
        ]
      };

      const result = CreateBulkAttendanceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateAttendanceSchema Validation', () => {
    it('should validate attendance update data', () => {
      const validData = {
        status: 'late' as const,
        remarks: 'Traffic delay'
      };

      const result = UpdateAttendanceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow status-only updates', () => {
      const validData = {
        status: 'excused' as const
      };

      const result = UpdateAttendanceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status in update', () => {
      const invalidData = {
        status: 'invalid-status',
        remarks: 'Some remarks'
      };

      const result = UpdateAttendanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('AttendanceStatusSchema Validation', () => {
    it('should validate all allowed attendance statuses', () => {
      const validStatuses = ['present', 'absent', 'late', 'excused'];
      
      validStatuses.forEach(status => {
        const result = AttendanceStatusSchema.safeParse(status);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid attendance statuses', () => {
      const invalidStatuses = ['here', 'missing', 'tardy', 'sick', ''];
      
      invalidStatuses.forEach(status => {
        const result = AttendanceStatusSchema.safeParse(status);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Date Format Validation', () => {
    it('should validate correct date formats', () => {
      const validDates = ['2024-01-15', '2024-12-31', '2023-02-28'];
      
      validDates.forEach(date => {
        const data = {
          studentId: '123e4567-e89b-12d3-a456-426614174000',
          classId: '123e4567-e89b-12d3-a456-426614174001',
          date: date,
          status: 'present' as const
        };
        
        const result = CreateAttendanceSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid date formats', () => {
      const invalidDates = ['invalid-date', 'not-a-date', ''];
      
      invalidDates.forEach(date => {
        const data = {
          studentId: '123e4567-e89b-12d3-a456-426614174000',
          classId: '123e4567-e89b-12d3-a456-426614174001',
          date: date,
          status: 'present' as const
        };
        
        const result = CreateAttendanceSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('ID Validation', () => {
    it('should validate correct ID formats', () => {
      const validIds = [
        '123e4567-e89b-12d3-a456-426614174000', // UUID
        'f47ac10b-58cc-4372-a567-0e02b2c3d479', // UUID
        '123', // Numeric ID
        'student-123', // String ID
        'abc123' // Alphanumeric ID
      ];
      
      validIds.forEach(id => {
        const data = {
          studentId: id,
          classId: '123e4567-e89b-12d3-a456-426614174001',
          date: '2024-01-15',
          status: 'present' as const
        };
        
        const result = CreateAttendanceSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject empty ID formats', () => {
      const invalidIds = [''];
      
      invalidIds.forEach(id => {
        const data = {
          studentId: id,
          classId: '123e4567-e89b-12d3-a456-426614174001',
          date: '2024-01-15',
          status: 'present' as const
        };
        
        const result = CreateAttendanceSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });
});
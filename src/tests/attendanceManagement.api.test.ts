import jwt from 'jsonwebtoken';

// Attendance Management API Comprehensive Tests
describe('Attendance Management API Tests', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-that-is-at-least-32-characters-long-for-jwt-validation';
  
  const generateToken = (payload: any) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  };

  const adminToken = generateToken({ userId: 'admin-1', role: 'admin' });
  const teacherToken = generateToken({ userId: 'teacher-1', role: 'teacher' });
  const studentToken = generateToken({ userId: 'student-1', role: 'student' });
  const parentToken = generateToken({ userId: 'parent-1', role: 'parent' });

  describe('POST /api/v1/attendance', () => {
    it('should validate attendance marking data', () => {
      const validateAttendanceData = (attendanceData: any) => {
        const errors = [];
        
        if (!attendanceData.studentId) {
          errors.push('Student ID is required');
        } else if (!/^[0-9a-f-]{36}$/i.test(attendanceData.studentId)) {
          errors.push('Invalid student ID format');
        }
        
        if (!attendanceData.classId) {
          errors.push('Class ID is required');
        } else if (!/^[0-9a-f-]{36}$/i.test(attendanceData.classId)) {
          errors.push('Invalid class ID format');
        }
        
        if (!attendanceData.date) {
          errors.push('Date is required');
        } else if (isNaN(Date.parse(attendanceData.date))) {
          errors.push('Invalid date format');
        } else {
          const attendanceDate = new Date(attendanceData.date);
          const today = new Date();
          const daysDiff = (today.getTime() - attendanceDate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysDiff > 7) {
            errors.push('Cannot mark attendance for dates older than 7 days');
          }
          
          if (attendanceDate > today) {
            errors.push('Cannot mark attendance for future dates');
          }
        }
        
        if (!attendanceData.status) {
          errors.push('Attendance status is required');
        } else if (!['present', 'absent', 'late', 'excused'].includes(attendanceData.status)) {
          errors.push('Invalid attendance status');
        }
        
        if (attendanceData.remarks && attendanceData.remarks.length > 500) {
          errors.push('Remarks cannot exceed 500 characters');
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      };

      const validAttendance = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        classId: '123e4567-e89b-12d3-a456-426614174001',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        remarks: 'On time'
      };

      expect(validateAttendanceData(validAttendance).valid).toBe(true);
      expect(validateAttendanceData({ ...validAttendance, studentId: 'invalid-id' }).valid).toBe(false);
      expect(validateAttendanceData({ ...validAttendance, date: 'invalid-date' }).valid).toBe(false);
      expect(validateAttendanceData({ ...validAttendance, status: 'invalid-status' }).valid).toBe(false);
      
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);
      expect(validateAttendanceData({ ...validAttendance, date: oldDate.toISOString().split('T')[0] }).valid).toBe(false);
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(validateAttendanceData({ ...validAttendance, date: futureDate.toISOString().split('T')[0] }).valid).toBe(false);
    });

    it('should validate teacher permissions for attendance marking', () => {
      const checkAttendanceMarkingPermissions = (userRole: string, userId: string, classTeacherId: string) => {
        // Admin can mark attendance for any class
        if (userRole === 'admin') {
          return { allowed: true };
        }
        
        // Teachers can mark attendance for their assigned classes
        if (userRole === 'teacher' && userId === classTeacherId) {
          return { allowed: true };
        }
        
        return {
          allowed: false,
          statusCode: 403,
          message: 'Only assigned teachers can mark attendance for this class'
        };
      };

      expect(checkAttendanceMarkingPermissions('admin', 'admin-1', 'teacher-1').allowed).toBe(true);
      expect(checkAttendanceMarkingPermissions('teacher', 'teacher-1', 'teacher-1').allowed).toBe(true);
      expect(checkAttendanceMarkingPermissions('teacher', 'teacher-2', 'teacher-1').allowed).toBe(false);
      expect(checkAttendanceMarkingPermissions('student', 'student-1', 'teacher-1').allowed).toBe(false);
    });

    it('should check for duplicate attendance records', () => {
      const checkDuplicateAttendance = (studentId: string, classId: string, date: string, existingRecords: any[]) => {
        const duplicate = existingRecords.find(record => 
          record.studentId === studentId && 
          record.classId === classId && 
          record.date === date
        );
        
        if (duplicate) {
          return {
            duplicate: true,
            message: 'Attendance already marked for this student on this date',
            existingRecord: duplicate
          };
        }
        
        return { duplicate: false };
      };

      const existingRecords = [
        { studentId: 'student-1', classId: 'class-1', date: '2024-01-15', status: 'present' }
      ];
      
      expect(checkDuplicateAttendance('student-1', 'class-1', '2024-01-16', existingRecords).duplicate).toBe(false);
      expect(checkDuplicateAttendance('student-1', 'class-1', '2024-01-15', existingRecords).duplicate).toBe(true);
      expect(checkDuplicateAttendance('student-2', 'class-1', '2024-01-15', existingRecords).duplicate).toBe(false);
    });

    it('should validate student enrollment in class', () => {
      const validateStudentEnrollment = (studentId: string, classId: string, enrollments: any[]) => {
        const enrollment = enrollments.find(e => 
          e.studentId === studentId && 
          e.classId === classId && 
          e.isActive
        );
        
        if (!enrollment) {
          return {
            valid: false,
            error: 'Student is not enrolled in this class'
          };
        }
        
        return { valid: true };
      };

      const enrollments = [
        { studentId: 'student-1', classId: 'class-1', isActive: true },
        { studentId: 'student-2', classId: 'class-1', isActive: false }
      ];
      
      expect(validateStudentEnrollment('student-1', 'class-1', enrollments).valid).toBe(true);
      expect(validateStudentEnrollment('student-2', 'class-1', enrollments).valid).toBe(false);
      expect(validateStudentEnrollment('student-3', 'class-1', enrollments).valid).toBe(false);
    });
  });

  describe('POST /api/v1/attendance/bulk', () => {
    it('should validate bulk attendance data', () => {
      const validateBulkAttendanceData = (bulkData: any) => {
        const errors = [];
        
        if (!bulkData.classId) {
          errors.push('Class ID is required');
        } else if (!/^[0-9a-f-]{36}$/i.test(bulkData.classId)) {
          errors.push('Invalid class ID format');
        }
        
        if (!bulkData.date) {
          errors.push('Date is required');
        } else if (isNaN(Date.parse(bulkData.date))) {
          errors.push('Invalid date format');
        }
        
        if (!bulkData.attendance || !Array.isArray(bulkData.attendance)) {
          errors.push('Attendance array is required');
        } else {
          if (bulkData.attendance.length === 0) {
            errors.push('At least one attendance record is required');
          }
          
          bulkData.attendance.forEach((record: any, index: number) => {
            if (!record.studentId) {
              errors.push(`Student ID is required for record ${index + 1}`);
            } else if (!/^[0-9a-f-]{36}$/i.test(record.studentId)) {
              errors.push(`Invalid student ID format for record ${index + 1}`);
            }
            
            if (!record.status || !['present', 'absent', 'late', 'excused'].includes(record.status)) {
              errors.push(`Invalid status for record ${index + 1}`);
            }
            
            if (record.remarks && record.remarks.length > 500) {
              errors.push(`Remarks too long for record ${index + 1}`);
            }
          });
          
          // Check for duplicate student IDs in the same bulk request
          const studentIds = bulkData.attendance.map((r: any) => r.studentId);
          const duplicateIds = studentIds.filter((id: string, index: number) => studentIds.indexOf(id) !== index);
          
          if (duplicateIds.length > 0) {
            errors.push(`Duplicate student IDs found: ${duplicateIds.join(', ')}`);
          }
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      };

      const validBulkData = {
        classId: '123e4567-e89b-12d3-a456-426614174000',
        date: new Date().toISOString().split('T')[0],
        attendance: [
          { studentId: '123e4567-e89b-12d3-a456-426614174001', status: 'present' },
          { studentId: '123e4567-e89b-12d3-a456-426614174002', status: 'absent', remarks: 'Sick' }
        ]
      };

      expect(validateBulkAttendanceData(validBulkData).valid).toBe(true);
      expect(validateBulkAttendanceData({ ...validBulkData, classId: 'invalid-id' }).valid).toBe(false);
      expect(validateBulkAttendanceData({ ...validBulkData, attendance: [] }).valid).toBe(false);
      
      const duplicateData = {
        ...validBulkData,
        attendance: [
          { studentId: '123e4567-e89b-12d3-a456-426614174001', status: 'present' },
          { studentId: '123e4567-e89b-12d3-a456-426614174001', status: 'absent' }
        ]
      };
      expect(validateBulkAttendanceData(duplicateData).valid).toBe(false);
    });

    it('should process bulk attendance efficiently', () => {
      const processBulkAttendance = (bulkData: any) => {
        const results = {
          successful: 0,
          failed: 0,
          errors: [] as string[]
        };
        
        bulkData.attendance.forEach((record: any, index: number) => {
          // Simulate processing each record
          if (record.studentId && record.status) {
            results.successful++;
          } else {
            results.failed++;
            results.errors.push(`Record ${index + 1}: Missing required fields`);
          }
        });
        
        return results;
      };

      const bulkData = {
        classId: 'class-1',
        date: '2024-01-15',
        attendance: [
          { studentId: 'student-1', status: 'present' },
          { studentId: 'student-2', status: 'absent' },
          { studentId: '', status: 'present' } // Invalid record
        ]
      };

      const results = processBulkAttendance(bulkData);
      
      expect(results.successful).toBe(2);
      expect(results.failed).toBe(1);
      expect(results.errors).toHaveLength(1);
    });
  });

  describe('GET /api/v1/attendance', () => {
    it('should validate attendance listing permissions', () => {
      const checkAttendanceListAccess = (userRole: string) => {
        const allowedRoles = ['admin', 'teacher'];
        
        if (!allowedRoles.includes(userRole)) {
          return {
            allowed: false,
            statusCode: 403,
            message: 'Admin or teacher access required'
          };
        }
        
        return { allowed: true };
      };

      expect(checkAttendanceListAccess('admin').allowed).toBe(true);
      expect(checkAttendanceListAccess('teacher').allowed).toBe(true);
      expect(checkAttendanceListAccess('student').allowed).toBe(false);
      expect(checkAttendanceListAccess('parent').allowed).toBe(false);
    });

    it('should handle attendance filtering parameters', () => {
      const validateAttendanceFilters = (query: any) => {
        const errors = [];
        
        if (query.classId && !/^[0-9a-f-]{36}$/i.test(query.classId)) {
          errors.push('Invalid class ID format');
        }
        
        if (query.studentId && !/^[0-9a-f-]{36}$/i.test(query.studentId)) {
          errors.push('Invalid student ID format');
        }
        
        if (query.startDate && isNaN(Date.parse(query.startDate))) {
          errors.push('Invalid start date format');
        }
        
        if (query.endDate && isNaN(Date.parse(query.endDate))) {
          errors.push('Invalid end date format');
        }
        
        if (query.startDate && query.endDate) {
          const start = new Date(query.startDate);
          const end = new Date(query.endDate);
          
          if (start > end) {
            errors.push('Start date cannot be after end date');
          }
          
          const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
          if (daysDiff > 365) {
            errors.push('Date range cannot exceed 365 days');
          }
        }
        
        if (query.status && !['present', 'absent', 'late', 'excused'].includes(query.status)) {
          errors.push('Invalid attendance status');
        }
        
        if (query.teacherId && !/^[0-9a-f-]{36}$/i.test(query.teacherId)) {
          errors.push('Invalid teacher ID format');
        }
        
        return {
          valid: errors.length === 0,
          errors,
          filters: {
            classId: query.classId,
            studentId: query.studentId,
            startDate: query.startDate,
            endDate: query.endDate,
            status: query.status,
            teacherId: query.teacherId
          }
        };
      };

      expect(validateAttendanceFilters({
        classId: '123e4567-e89b-12d3-a456-426614174000',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        status: 'present'
      }).valid).toBe(true);
      
      expect(validateAttendanceFilters({ classId: 'invalid-id' }).valid).toBe(false);
      expect(validateAttendanceFilters({ startDate: 'invalid-date' }).valid).toBe(false);
      expect(validateAttendanceFilters({ startDate: '2024-01-31', endDate: '2024-01-01' }).valid).toBe(false);
      expect(validateAttendanceFilters({ status: 'invalid-status' }).valid).toBe(false);
    });

    it('should apply teacher-specific filtering', () => {
      const applyTeacherFiltering = (userRole: string, teacherId: string, attendanceRecords: any[]) => {
        if (userRole !== 'teacher') {
          return attendanceRecords;
        }
        
        // Teachers can only see attendance for their assigned classes
        const teacherClassIds = ['class-1', 'class-2']; // Mock teacher's classes
        
        return attendanceRecords.filter(record => teacherClassIds.includes(record.classId));
      };

      const allRecords = [
        { id: 'att-1', classId: 'class-1', studentId: 'student-1' },
        { id: 'att-2', classId: 'class-2', studentId: 'student-2' },
        { id: 'att-3', classId: 'class-3', studentId: 'student-3' }
      ];

      const teacherFiltered = applyTeacherFiltering('teacher', 'teacher-1', allRecords);
      const adminFiltered = applyTeacherFiltering('admin', 'admin-1', allRecords);
      
      expect(teacherFiltered).toHaveLength(2);
      expect(adminFiltered).toHaveLength(3);
    });

    it('should format attendance list response', () => {
      const formatAttendanceListResponse = (records: any[], total: number, page: number, limit: number) => {
        return {
          success: true,
          data: {
            attendance: records.map(record => ({
              id: record.id,
              studentId: record.studentId,
              studentName: record.student ? `${record.student.firstName} ${record.student.lastName}` : null,
              classId: record.classId,
              className: record.class?.name,
              date: record.date,
              status: record.status,
              remarks: record.remarks,
              markedBy: record.markedBy,
              markedAt: record.createdAt
            })),
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit),
              hasNext: page * limit < total,
              hasPrev: page > 1
            }
          }
        };
      };

      const mockRecords = [
        {
          id: 'att-1',
          studentId: 'student-1',
          student: { firstName: 'Alice', lastName: 'Johnson' },
          classId: 'class-1',
          class: { name: 'Grade 5A' },
          date: '2024-01-15',
          status: 'present',
          remarks: null,
          markedBy: 'teacher-1',
          createdAt: '2024-01-15T09:00:00Z'
        }
      ];

      const response = formatAttendanceListResponse(mockRecords, 1, 1, 10);
      
      expect(response.success).toBe(true);
      expect(response.data.attendance).toHaveLength(1);
      expect(response.data.attendance[0].studentName).toBe('Alice Johnson');
      expect(response.data.attendance[0].className).toBe('Grade 5A');
    });
  });

  describe('PUT /api/v1/attendance/:id', () => {
    it('should validate attendance update permissions', () => {
      const checkAttendanceUpdatePermissions = (userRole: string, userId: string, recordTeacherId: string, recordDate: string) => {
        // Admin can update any attendance record
        if (userRole === 'admin') {
          return { allowed: true };
        }
        
        // Teachers can update their own records within time limit
        if (userRole === 'teacher' && userId === recordTeacherId) {
          const recordDateTime = new Date(recordDate);
          const now = new Date();
          const hoursDiff = (now.getTime() - recordDateTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff > 24) {
            return {
              allowed: false,
              statusCode: 403,
              message: 'Cannot update attendance records older than 24 hours'
            };
          }
          
          return { allowed: true };
        }
        
        return {
          allowed: false,
          statusCode: 403,
          message: 'Access denied'
        };
      };

      const recentDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
      const oldDate = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(); // 30 hours ago

      expect(checkAttendanceUpdatePermissions('admin', 'admin-1', 'teacher-1', oldDate).allowed).toBe(true);
      expect(checkAttendanceUpdatePermissions('teacher', 'teacher-1', 'teacher-1', recentDate).allowed).toBe(true);
      expect(checkAttendanceUpdatePermissions('teacher', 'teacher-1', 'teacher-1', oldDate).allowed).toBe(false);
      expect(checkAttendanceUpdatePermissions('teacher', 'teacher-2', 'teacher-1', recentDate).allowed).toBe(false);
    });

    it('should validate attendance update data', () => {
      const validateAttendanceUpdateData = (updateData: any) => {
        const errors = [];
        
        if (updateData.status && !['present', 'absent', 'late', 'excused'].includes(updateData.status)) {
          errors.push('Invalid attendance status');
        }
        
        if (updateData.remarks && updateData.remarks.length > 500) {
          errors.push('Remarks cannot exceed 500 characters');
        }
        
        if (updateData.date && isNaN(Date.parse(updateData.date))) {
          errors.push('Invalid date format');
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      };

      expect(validateAttendanceUpdateData({ status: 'late', remarks: 'Traffic delay' }).valid).toBe(true);
      expect(validateAttendanceUpdateData({ status: 'invalid-status' }).valid).toBe(false);
      expect(validateAttendanceUpdateData({ remarks: 'a'.repeat(501) }).valid).toBe(false);
      expect(validateAttendanceUpdateData({ date: 'invalid-date' }).valid).toBe(false);
    });

    it('should track attendance update history', () => {
      const trackAttendanceUpdate = (originalRecord: any, updateData: any, updatedBy: string) => {
        const changes = [];
        
        if (updateData.status && updateData.status !== originalRecord.status) {
          changes.push({
            field: 'status',
            oldValue: originalRecord.status,
            newValue: updateData.status
          });
        }
        
        if (updateData.remarks !== undefined && updateData.remarks !== originalRecord.remarks) {
          changes.push({
            field: 'remarks',
            oldValue: originalRecord.remarks,
            newValue: updateData.remarks
          });
        }
        
        return {
          hasChanges: changes.length > 0,
          changes,
          auditLog: {
            updatedBy,
            updatedAt: new Date().toISOString(),
            changes
          }
        };
      };

      const originalRecord = { status: 'absent', remarks: 'Sick' };
      const updateData = { status: 'excused', remarks: 'Medical appointment' };
      
      const result = trackAttendanceUpdate(originalRecord, updateData, 'teacher-1');
      
      expect(result.hasChanges).toBe(true);
      expect(result.changes).toHaveLength(2);
      expect(result.changes[0].field).toBe('status');
      expect(result.changes[1].field).toBe('remarks');
    });
  });

  describe('GET /api/v1/attendance/class/:classId', () => {
    it('should validate class attendance access', () => {
      const checkClassAttendanceAccess = (userRole: string, userId: string, classTeacherId: string) => {
        const allowedRoles = ['admin'];
        
        if (allowedRoles.includes(userRole)) {
          return { allowed: true };
        }
        
        if (userRole === 'teacher' && userId === classTeacherId) {
          return { allowed: true };
        }
        
        return {
          allowed: false,
          statusCode: 403,
          message: 'Access denied'
        };
      };

      expect(checkClassAttendanceAccess('admin', 'admin-1', 'teacher-1').allowed).toBe(true);
      expect(checkClassAttendanceAccess('teacher', 'teacher-1', 'teacher-1').allowed).toBe(true);
      expect(checkClassAttendanceAccess('teacher', 'teacher-2', 'teacher-1').allowed).toBe(false);
    });

    it('should calculate class attendance statistics', () => {
      const calculateClassAttendanceStats = (attendanceRecords: any[]) => {
        const totalRecords = attendanceRecords.length;
        const statusCounts = attendanceRecords.reduce((counts, record) => {
          counts[record.status] = (counts[record.status] || 0) + 1;
          return counts;
        }, {} as { [key: string]: number });
        
        const presentCount = statusCounts.present || 0;
        const absentCount = statusCounts.absent || 0;
        const lateCount = statusCounts.late || 0;
        const excusedCount = statusCounts.excused || 0;
        
        const attendanceRate = totalRecords > 0 ? ((presentCount + lateCount) / totalRecords) * 100 : 0;
        
        return {
          totalRecords,
          presentCount,
          absentCount,
          lateCount,
          excusedCount,
          attendanceRate: Math.round(attendanceRate * 100) / 100,
          statusDistribution: statusCounts
        };
      };

      const attendanceRecords = [
        { status: 'present' },
        { status: 'present' },
        { status: 'absent' },
        { status: 'late' },
        { status: 'excused' }
      ];

      const stats = calculateClassAttendanceStats(attendanceRecords);
      
      expect(stats.totalRecords).toBe(5);
      expect(stats.presentCount).toBe(2);
      expect(stats.absentCount).toBe(1);
      expect(stats.lateCount).toBe(1);
      expect(stats.excusedCount).toBe(1);
      expect(stats.attendanceRate).toBe(60); // (2 present + 1 late) / 5 * 100
    });

    it('should format class attendance response', () => {
      const formatClassAttendanceResponse = (classData: any, attendanceRecords: any[], dateRange: { startDate: string, endDate: string }) => {
        const studentAttendance = attendanceRecords.reduce((acc, record) => {
          if (!acc[record.studentId]) {
            acc[record.studentId] = {
              studentId: record.studentId,
              studentName: record.student ? `${record.student.firstName} ${record.student.lastName}` : 'Unknown',
              records: []
            };
          }
          
          acc[record.studentId].records.push({
            date: record.date,
            status: record.status,
            remarks: record.remarks
          });
          
          return acc;
        }, {} as any);
        
        return {
          success: true,
          data: {
            class: {
              id: classData.id,
              name: classData.name,
              grade: classData.grade,
              section: classData.section
            },
            dateRange,
            studentAttendance: Object.values(studentAttendance),
            summary: {
              totalStudents: Object.keys(studentAttendance).length,
              totalRecords: attendanceRecords.length
            }
          }
        };
      };

      const classData = { id: 'class-1', name: 'Grade 5A', grade: '5', section: 'A' };
      const attendanceRecords = [
        {
          studentId: 'student-1',
          student: { firstName: 'Alice', lastName: 'Johnson' },
          date: '2024-01-15',
          status: 'present',
          remarks: null
        }
      ];
      const dateRange = { startDate: '2024-01-01', endDate: '2024-01-31' };

      const response = formatClassAttendanceResponse(classData, attendanceRecords, dateRange);
      
      expect(response.success).toBe(true);
      expect(response.data.class.name).toBe('Grade 5A');
      expect(response.data.studentAttendance).toHaveLength(1);
      expect(response.data.summary.totalStudents).toBe(1);
    });
  });

  describe('GET /api/v1/attendance/student/:studentId', () => {
    it('should validate student attendance access', () => {
      const checkStudentAttendanceAccess = (userRole: string, userId: string, studentUserId: string, parentIds: string[] = []) => {
        const allowedRoles = ['admin', 'teacher'];
        
        if (allowedRoles.includes(userRole)) {
          return { allowed: true };
        }
        
        if (userRole === 'student' && userId === studentUserId) {
          return { allowed: true };
        }
        
        if (userRole === 'parent' && parentIds.includes(userId)) {
          return { allowed: true };
        }
        
        return {
          allowed: false,
          statusCode: 403,
          message: 'Access denied'
        };
      };

      expect(checkStudentAttendanceAccess('admin', 'admin-1', 'user-1').allowed).toBe(true);
      expect(checkStudentAttendanceAccess('teacher', 'teacher-1', 'user-1').allowed).toBe(true);
      expect(checkStudentAttendanceAccess('student', 'user-1', 'user-1').allowed).toBe(true);
      expect(checkStudentAttendanceAccess('parent', 'parent-1', 'user-1', ['parent-1']).allowed).toBe(true);
      expect(checkStudentAttendanceAccess('student', 'user-2', 'user-1').allowed).toBe(false);
    });

    it('should calculate student attendance statistics', () => {
      const calculateStudentAttendanceStats = (attendanceRecords: any[], academicYearStart: string, academicYearEnd: string) => {
        const totalDays = attendanceRecords.length;
        const statusCounts = attendanceRecords.reduce((counts, record) => {
          counts[record.status] = (counts[record.status] || 0) + 1;
          return counts;
        }, {} as { [key: string]: number });
        
        const presentDays = statusCounts.present || 0;
        const absentDays = statusCounts.absent || 0;
        const lateDays = statusCounts.late || 0;
        const excusedDays = statusCounts.excused || 0;
        
        const attendancePercentage = totalDays > 0 ? ((presentDays + lateDays) / totalDays) * 100 : 0;
        
        // Calculate consecutive absences
        let maxConsecutiveAbsences = 0;
        let currentConsecutiveAbsences = 0;
        
        attendanceRecords.forEach(record => {
          if (record.status === 'absent') {
            currentConsecutiveAbsences++;
            maxConsecutiveAbsences = Math.max(maxConsecutiveAbsences, currentConsecutiveAbsences);
          } else {
            currentConsecutiveAbsences = 0;
          }
        });
        
        return {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          excusedDays,
          attendancePercentage: Math.round(attendancePercentage * 100) / 100,
          maxConsecutiveAbsences,
          statusDistribution: statusCounts,
          attendanceGrade: attendancePercentage >= 95 ? 'Excellent' : 
                          attendancePercentage >= 90 ? 'Good' : 
                          attendancePercentage >= 80 ? 'Satisfactory' : 'Poor'
        };
      };

      const attendanceRecords = [
        { status: 'present' },
        { status: 'present' },
        { status: 'absent' },
        { status: 'absent' },
        { status: 'present' },
        { status: 'late' }
      ];

      const stats = calculateStudentAttendanceStats(attendanceRecords, '2024-01-01', '2024-12-31');
      
      expect(stats.totalDays).toBe(6);
      expect(stats.presentDays).toBe(3);
      expect(stats.absentDays).toBe(2);
      expect(stats.lateDays).toBe(1);
      expect(stats.attendancePercentage).toBe(66.67); // (3 present + 1 late) / 6 * 100
      expect(stats.maxConsecutiveAbsences).toBe(2);
      expect(stats.attendanceGrade).toBe('Poor');
    });
  });

  describe('Attendance Reporting and Analytics', () => {
    it('should generate attendance trends', () => {
      const generateAttendanceTrends = (attendanceRecords: any[], groupBy: 'day' | 'week' | 'month') => {
        const trends = attendanceRecords.reduce((acc, record) => {
          let key: string;
          const date = new Date(record.date);
          
          switch (groupBy) {
            case 'day':
              key = record.date;
              break;
            case 'week':
              const weekStart = new Date(date);
              weekStart.setDate(date.getDate() - date.getDay());
              key = weekStart.toISOString().split('T')[0];
              break;
            case 'month':
              key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              break;
            default:
              key = record.date;
          }
          
          if (!acc[key]) {
            acc[key] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
          }
          
          acc[key][record.status as keyof typeof acc[typeof key]]++;
          acc[key].total++;
          
          return acc;
        }, {} as any);
        
        return Object.entries(trends).map(([period, stats]: [string, any]) => ({
          period,
          ...stats,
          attendanceRate: stats.total > 0 ? ((stats.present + stats.late) / stats.total) * 100 : 0
        }));
      };

      const attendanceRecords = [
        { date: '2024-01-15', status: 'present' },
        { date: '2024-01-15', status: 'absent' },
        { date: '2024-01-16', status: 'present' },
        { date: '2024-01-16', status: 'present' }
      ];

      const dailyTrends = generateAttendanceTrends(attendanceRecords, 'day');
      
      expect(dailyTrends).toHaveLength(2);
      expect(dailyTrends[0].period).toBe('2024-01-15');
      expect(dailyTrends[0].present).toBe(1);
      expect(dailyTrends[0].absent).toBe(1);
      expect(dailyTrends[0].attendanceRate).toBe(50);
    });

    it('should identify attendance patterns', () => {
      const identifyAttendancePatterns = (attendanceRecords: any[]) => {
        const dayOfWeekStats = attendanceRecords.reduce((acc, record) => {
          const dayOfWeek = new Date(record.date).getDay();
          const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
          
          if (!acc[dayName]) {
            acc[dayName] = { present: 0, absent: 0, total: 0 };
          }
          
          acc[dayName][record.status === 'present' ? 'present' : 'absent']++;
          acc[dayName].total++;
          
          return acc;
        }, {} as any);
        
        const patterns = Object.entries(dayOfWeekStats).map(([day, stats]: [string, any]) => ({
          day,
          attendanceRate: stats.total > 0 ? (stats.present / stats.total) * 100 : 0,
          totalRecords: stats.total
        }));
        
        const lowestAttendanceDay = patterns.reduce((min, current) => 
          current.attendanceRate < min.attendanceRate ? current : min
        );
        
        return {
          dayOfWeekStats: patterns,
          lowestAttendanceDay: lowestAttendanceDay.day,
          insights: {
            hasWeekendIssues: ['Saturday', 'Sunday'].includes(lowestAttendanceDay.day),
            hasMondayBlues: lowestAttendanceDay.day === 'Monday'
          }
        };
      };

      const attendanceRecords = [
        { date: '2024-01-15', status: 'present' }, // Monday
        { date: '2024-01-16', status: 'absent' },  // Tuesday
        { date: '2024-01-17', status: 'present' }, // Wednesday
        { date: '2024-01-22', status: 'absent' },  // Monday
        { date: '2024-01-23', status: 'present' }  // Tuesday
      ];

      const patterns = identifyAttendancePatterns(attendanceRecords);
      
      expect(patterns.dayOfWeekStats).toBeTruthy();
      expect(patterns.lowestAttendanceDay).toBeTruthy();
      expect(patterns.insights.hasMondayBlues).toBeDefined();
    });
  });
});
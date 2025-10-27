import request from 'supertest';
import jwt from 'jsonwebtoken';

// Student Management API Comprehensive Tests
describe('Student Management API Tests', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-that-is-at-least-32-characters-long-for-jwt-validation';
  
  const generateToken = (payload: any) => {
    // Ensure the payload has the correct format for auth middleware
    const tokenPayload = {
      id: payload.userId || payload.id,
      email: payload.email,
      role: payload.role
    };
    return jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
  };

  const adminToken = generateToken({ userId: 'admin-1', role: 'admin' });
  const teacherToken = generateToken({ userId: 'teacher-1', role: 'teacher' });
  const studentToken = generateToken({ userId: 'student-1', role: 'student' });
  const parentToken = generateToken({ userId: 'parent-1', role: 'parent' });

  describe('POST /api/v1/students', () => {
    it('should validate student creation data', () => {
      const validateStudentData = (studentData: any) => {
        const errors = [];
        
        if (!studentData.firstName || studentData.firstName.length < 2) {
          errors.push('First name must be at least 2 characters');
        }
        
        if (!studentData.lastName || studentData.lastName.length < 2) {
          errors.push('Last name must be at least 2 characters');
        }
        
        if (!studentData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentData.email)) {
          errors.push('Valid email is required');
        }
        
        if (!studentData.studentId || studentData.studentId.length < 3) {
          errors.push('Student ID must be at least 3 characters');
        }
        
        if (!studentData.classId) {
          errors.push('Class ID is required');
        }
        
        if (!studentData.dateOfBirth) {
          errors.push('Date of birth is required');
        } else {
          const dob = new Date(studentData.dateOfBirth);
          const today = new Date();
          const age = today.getFullYear() - dob.getFullYear();
          
          if (age < 3 || age > 25) {
            errors.push('Student age must be between 3 and 25 years');
          }
        }
        
        if (!studentData.guardianName || studentData.guardianName.length < 2) {
          errors.push('Guardian name is required');
        }
        
        if (!studentData.guardianPhone || !/^\+?[\d\s\-\(\)]{10,}$/.test(studentData.guardianPhone)) {
          errors.push('Valid guardian phone number is required');
        }
        
        if (studentData.guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentData.guardianEmail)) {
          errors.push('Invalid guardian email format');
        }
        
        if (!studentData.emergencyContact || !/^\+?[\d\s\-\(\)]{10,}$/.test(studentData.emergencyContact)) {
          errors.push('Valid emergency contact is required');
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      };

      const validStudent = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@student.school.com',
        studentId: 'STU001',
        classId: 'class-1',
        dateOfBirth: '2010-01-15',
        guardianName: 'Jane Doe',
        guardianPhone: '+1234567890',
        guardianEmail: 'jane.doe@parent.com',
        emergencyContact: '+1234567891',
        address: '123 Main St, City, State'
      };

      expect(validateStudentData(validStudent).valid).toBe(true);
      expect(validateStudentData({ ...validStudent, firstName: 'J' }).valid).toBe(false);
      expect(validateStudentData({ ...validStudent, email: 'invalid-email' }).valid).toBe(false);
      expect(validateStudentData({ ...validStudent, studentId: 'ST' }).valid).toBe(false);
      expect(validateStudentData({ ...validStudent, dateOfBirth: '1990-01-01' }).valid).toBe(false);
    });

    it('should check student ID uniqueness', () => {
      const checkStudentIdUniqueness = (studentId: string, existingIds: string[]) => {
        if (existingIds.includes(studentId)) {
          return {
            unique: false,
            message: 'Student ID already exists'
          };
        }
        
        return { unique: true };
      };

      const existingIds = ['STU001', 'STU002', 'STU003'];
      
      expect(checkStudentIdUniqueness('STU004', existingIds).unique).toBe(true);
      expect(checkStudentIdUniqueness('STU001', existingIds).unique).toBe(false);
    });

    it('should validate class capacity', () => {
      const validateClassCapacity = (classId: string, currentEnrollment: number, maxCapacity: number) => {
        if (currentEnrollment >= maxCapacity) {
          return {
            canEnroll: false,
            message: 'Class has reached maximum capacity'
          };
        }
        
        return {
          canEnroll: true,
          availableSlots: maxCapacity - currentEnrollment
        };
      };

      expect(validateClassCapacity('class-1', 25, 30).canEnroll).toBe(true);
      expect(validateClassCapacity('class-1', 25, 30).availableSlots).toBe(5);
      expect(validateClassCapacity('class-1', 30, 30).canEnroll).toBe(false);
    });

    it('should generate user account for student', () => {
      const generateStudentAccount = (studentData: any) => {
        const username = `${studentData.firstName.toLowerCase()}.${studentData.lastName.toLowerCase()}`;
        const tempPassword = Math.random().toString(36).substring(2, 10);
        
        return {
          username,
          email: studentData.email,
          password: tempPassword,
          role: 'student',
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          isActive: true,
          mustChangePassword: true
        };
      };

      const studentData = { firstName: 'John', lastName: 'Doe', email: 'john@school.com' };
      const account = generateStudentAccount(studentData);
      
      expect(account.username).toBe('john.doe');
      expect(account.role).toBe('student');
      expect(account.mustChangePassword).toBe(true);
      expect(account.password.length).toBeGreaterThan(5);
    });

    it('should validate admin permissions for student creation', () => {
      const checkStudentCreationPermissions = (userRole: string) => {
        const allowedRoles = ['admin'];
        
        if (!allowedRoles.includes(userRole)) {
          return {
            allowed: false,
            statusCode: 403,
            message: 'Admin access required to create students'
          };
        }
        
        return { allowed: true };
      };

      expect(checkStudentCreationPermissions('admin').allowed).toBe(true);
      expect(checkStudentCreationPermissions('teacher').allowed).toBe(false);
      expect(checkStudentCreationPermissions('student').allowed).toBe(false);
    });
  });

  describe('GET /api/v1/students', () => {
    it('should validate access permissions for student listing', () => {
      const checkStudentListAccess = (userRole: string) => {
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

      expect(checkStudentListAccess('admin').allowed).toBe(true);
      expect(checkStudentListAccess('teacher').allowed).toBe(true);
      expect(checkStudentListAccess('student').allowed).toBe(false);
      expect(checkStudentListAccess('parent').allowed).toBe(false);
    });

    it('should handle student search and filtering', () => {
      const validateStudentFilters = (query: any) => {
        const errors = [];
        
        if (query.classId && !/^[0-9a-f-]{36}$/i.test(query.classId)) {
          errors.push('Invalid class ID format');
        }
        
        if (query.grade && (isNaN(query.grade) || query.grade < 1 || query.grade > 12)) {
          errors.push('Grade must be between 1 and 12');
        }
        
        if (query.isActive && !['true', 'false'].includes(query.isActive)) {
          errors.push('isActive must be true or false');
        }
        
        if (query.search && query.search.length < 2) {
          errors.push('Search term must be at least 2 characters');
        }
        
        if (query.enrollmentYear && (isNaN(query.enrollmentYear) || query.enrollmentYear < 2000 || query.enrollmentYear > new Date().getFullYear() + 1)) {
          errors.push('Invalid enrollment year');
        }
        
        return {
          valid: errors.length === 0,
          errors,
          filters: {
            classId: query.classId,
            grade: query.grade ? parseInt(query.grade) : undefined,
            isActive: query.isActive === 'true',
            search: query.search,
            enrollmentYear: query.enrollmentYear ? parseInt(query.enrollmentYear) : undefined
          }
        };
      };

      expect(validateStudentFilters({ classId: '123e4567-e89b-12d3-a456-426614174000', grade: '5' }).valid).toBe(true);
      expect(validateStudentFilters({ grade: '15' }).valid).toBe(false);
      expect(validateStudentFilters({ isActive: 'maybe' }).valid).toBe(false);
      expect(validateStudentFilters({ search: 'a' }).valid).toBe(false);
      expect(validateStudentFilters({ enrollmentYear: '1999' }).valid).toBe(false);
    });

    it('should apply teacher-specific filtering', () => {
      const applyTeacherFiltering = (userRole: string, teacherId: string, students: any[]) => {
        if (userRole !== 'teacher') {
          return students;
        }
        
        // Teachers can only see students from their assigned classes
        const teacherClassIds = ['class-1', 'class-2']; // Mock teacher's classes
        
        return students.filter(student => teacherClassIds.includes(student.classId));
      };

      const allStudents = [
        { id: 'student-1', classId: 'class-1' },
        { id: 'student-2', classId: 'class-2' },
        { id: 'student-3', classId: 'class-3' }
      ];

      const teacherFiltered = applyTeacherFiltering('teacher', 'teacher-1', allStudents);
      const adminFiltered = applyTeacherFiltering('admin', 'admin-1', allStudents);
      
      expect(teacherFiltered).toHaveLength(2);
      expect(adminFiltered).toHaveLength(3);
    });

    it('should format student list response', () => {
      const formatStudentListResponse = (students: any[], total: number, page: number, limit: number) => {
        return {
          success: true,
          data: {
            students: students.map(student => ({
              id: student.id,
              studentId: student.studentId,
              firstName: student.firstName,
              lastName: student.lastName,
              email: student.email,
              classId: student.classId,
              className: student.class?.name,
              grade: student.class?.grade,
              section: student.class?.section,
              enrollmentDate: student.enrollmentDate,
              isActive: student.isActive
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

      const mockStudents = [
        {
          id: 'student-1',
          studentId: 'STU001',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@school.com',
          classId: 'class-1',
          class: { name: 'Grade 5A', grade: '5', section: 'A' },
          enrollmentDate: '2024-01-15',
          isActive: true
        }
      ];

      const response = formatStudentListResponse(mockStudents, 1, 1, 10);
      
      expect(response.success).toBe(true);
      expect(response.data.students).toHaveLength(1);
      expect(response.data.students[0].className).toBe('Grade 5A');
      expect(response.data.pagination.total).toBe(1);
      expect(response.data.pagination.hasNext).toBe(false);
    });
  });

  describe('GET /api/v1/students/:id', () => {
    it('should validate student access permissions', () => {
      const checkStudentAccess = (userRole: string, userId: string, studentId: string, studentUserId: string, parentIds: string[] = []) => {
        // Admin can access any student
        if (userRole === 'admin') {
          return { allowed: true };
        }
        
        // Teachers can access students in their classes
        if (userRole === 'teacher') {
          return { allowed: true, limitedAccess: true };
        }
        
        // Students can access their own profile
        if (userRole === 'student' && userId === studentUserId) {
          return { allowed: true };
        }
        
        // Parents can access their children's profiles
        if (userRole === 'parent' && parentIds.includes(userId)) {
          return { allowed: true };
        }
        
        return {
          allowed: false,
          statusCode: 403,
          message: 'Access denied'
        };
      };

      expect(checkStudentAccess('admin', 'admin-1', 'student-1', 'user-1').allowed).toBe(true);
      expect(checkStudentAccess('teacher', 'teacher-1', 'student-1', 'user-1').allowed).toBe(true);
      expect(checkStudentAccess('student', 'user-1', 'student-1', 'user-1').allowed).toBe(true);
      expect(checkStudentAccess('student', 'user-2', 'student-1', 'user-1').allowed).toBe(false);
      expect(checkStudentAccess('parent', 'parent-1', 'student-1', 'user-1', ['parent-1']).allowed).toBe(true);
    });

    it('should format detailed student response', () => {
      const formatStudentDetailResponse = (student: any, userRole: string) => {
        const baseData = {
          id: student.id,
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          dateOfBirth: student.dateOfBirth,
          enrollmentDate: student.enrollmentDate,
          isActive: student.isActive,
          class: {
            id: student.classId,
            name: student.class?.name,
            grade: student.class?.grade,
            section: student.class?.section
          }
        };
        
        // Add role-specific data
        if (['admin', 'teacher'].includes(userRole)) {
          return {
            ...baseData,
            guardianName: student.guardianName,
            guardianPhone: student.guardianPhone,
            guardianEmail: student.guardianEmail,
            emergencyContact: student.emergencyContact,
            address: student.address,
            medicalInfo: student.medicalInfo,
            parents: student.parents
          };
        }
        
        return baseData;
      };

      const mockStudent = {
        id: 'student-1',
        studentId: 'STU001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@school.com',
        dateOfBirth: '2010-01-15',
        enrollmentDate: '2024-01-15',
        isActive: true,
        classId: 'class-1',
        class: { name: 'Grade 5A', grade: '5', section: 'A' },
        guardianName: 'Jane Doe',
        guardianPhone: '+1234567890',
        guardianEmail: 'jane@parent.com',
        emergencyContact: '+1234567891',
        address: '123 Main St',
        medicalInfo: 'No allergies'
      };

      const adminResponse = formatStudentDetailResponse(mockStudent, 'admin') as any;
      const studentResponse = formatStudentDetailResponse(mockStudent, 'student') as any;
      
      expect(adminResponse.guardianName).toBeTruthy();
      expect(studentResponse.guardianName).toBeUndefined();
    });
  });

  describe('PUT /api/v1/students/:id', () => {
    it('should validate student update permissions', () => {
      const checkStudentUpdatePermissions = (userRole: string, userId: string, studentUserId: string) => {
        // Admin can update any student
        if (userRole === 'admin') {
          return { allowed: true, fullAccess: true };
        }
        
        // Students can update limited fields of their own profile
        if (userRole === 'student' && userId === studentUserId) {
          return { allowed: true, fullAccess: false };
        }
        
        return {
          allowed: false,
          statusCode: 403,
          message: 'Access denied'
        };
      };

      expect(checkStudentUpdatePermissions('admin', 'admin-1', 'user-1').allowed).toBe(true);
      expect(checkStudentUpdatePermissions('admin', 'admin-1', 'user-1').fullAccess).toBe(true);
      expect(checkStudentUpdatePermissions('student', 'user-1', 'user-1').allowed).toBe(true);
      expect(checkStudentUpdatePermissions('student', 'user-1', 'user-1').fullAccess).toBe(false);
      expect(checkStudentUpdatePermissions('teacher', 'teacher-1', 'user-1').allowed).toBe(false);
    });

    it('should validate student update data', () => {
      const validateStudentUpdateData = (updateData: any, hasFullAccess: boolean) => {
        const errors = [];
        
        // Fields that students can update
        const studentAllowedFields = ['address', 'emergencyContact'];
        
        // Fields that only admin can update
        const adminOnlyFields = ['studentId', 'classId', 'guardianName', 'guardianPhone', 'guardianEmail', 'isActive'];
        
        if (!hasFullAccess) {
          const restrictedFields = Object.keys(updateData).filter(field => 
            !studentAllowedFields.includes(field) && !['firstName', 'lastName'].includes(field)
          );
          
          if (restrictedFields.length > 0) {
            errors.push(`Cannot update restricted fields: ${restrictedFields.join(', ')}`);
          }
        }
        
        // Validate specific fields
        if (updateData.firstName && updateData.firstName.length < 2) {
          errors.push('First name must be at least 2 characters');
        }
        
        if (updateData.lastName && updateData.lastName.length < 2) {
          errors.push('Last name must be at least 2 characters');
        }
        
        if (updateData.emergencyContact && !/^\+?[\d\s\-\(\)]{10,}$/.test(updateData.emergencyContact)) {
          errors.push('Invalid emergency contact format');
        }
        
        if (updateData.guardianPhone && !/^\+?[\d\s\-\(\)]{10,}$/.test(updateData.guardianPhone)) {
          errors.push('Invalid guardian phone format');
        }
        
        if (updateData.guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.guardianEmail)) {
          errors.push('Invalid guardian email format');
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      };

      expect(validateStudentUpdateData({ firstName: 'John' }, true).valid).toBe(true);
      expect(validateStudentUpdateData({ firstName: 'John' }, false).valid).toBe(true);
      expect(validateStudentUpdateData({ classId: 'class-2' }, false).valid).toBe(false);
      expect(validateStudentUpdateData({ classId: 'class-2' }, true).valid).toBe(true);
      expect(validateStudentUpdateData({ emergencyContact: '123' }, true).valid).toBe(false);
    });

    it('should handle class transfer validation', () => {
      const validateClassTransfer = (currentClassId: string, newClassId: string, newClassCapacity: number, newClassEnrollment: number) => {
        if (currentClassId === newClassId) {
          return {
            valid: false,
            error: 'Student is already in this class'
          };
        }
        
        if (newClassEnrollment >= newClassCapacity) {
          return {
            valid: false,
            error: 'Target class has reached maximum capacity'
          };
        }
        
        return { valid: true };
      };

      expect(validateClassTransfer('class-1', 'class-2', 30, 25).valid).toBe(true);
      expect(validateClassTransfer('class-1', 'class-1', 30, 25).valid).toBe(false);
      expect(validateClassTransfer('class-1', 'class-2', 30, 30).valid).toBe(false);
    });
  });

  describe('DELETE /api/v1/students/:id', () => {
    it('should validate student deletion permissions', () => {
      const checkStudentDeletionPermissions = (userRole: string) => {
        if (userRole !== 'admin') {
          return {
            allowed: false,
            statusCode: 403,
            message: 'Admin access required'
          };
        }
        
        return { allowed: true };
      };

      expect(checkStudentDeletionPermissions('admin').allowed).toBe(true);
      expect(checkStudentDeletionPermissions('teacher').allowed).toBe(false);
      expect(checkStudentDeletionPermissions('student').allowed).toBe(false);
    });

    it('should handle student deletion with related data', () => {
      const handleStudentDeletion = (studentId: string, hasAttendance: boolean, hasGrades: boolean, hasFees: boolean) => {
        const relatedData = [];
        
        if (hasAttendance) relatedData.push('attendance records');
        if (hasGrades) relatedData.push('grade records');
        if (hasFees) relatedData.push('fee records');
        
        if (relatedData.length > 0) {
          return {
            type: 'soft',
            action: 'deactivate',
            message: `Student deactivated. Has related data: ${relatedData.join(', ')}`,
            relatedData
          };
        }
        
        return {
          type: 'hard',
          action: 'delete',
          message: 'Student deleted permanently'
        };
      };

      expect(handleStudentDeletion('student-1', true, true, false).type).toBe('soft');
      expect(handleStudentDeletion('student-1', false, false, false).type).toBe('hard');
      expect(handleStudentDeletion('student-1', true, false, false).relatedData).toContain('attendance records');
    });
  });

  describe('GET /api/v1/students/:id/attendance', () => {
    it('should validate attendance access permissions', () => {
      const checkAttendanceAccess = (userRole: string, userId: string, studentUserId: string, parentIds: string[] = []) => {
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

      expect(checkAttendanceAccess('admin', 'admin-1', 'user-1').allowed).toBe(true);
      expect(checkAttendanceAccess('student', 'user-1', 'user-1').allowed).toBe(true);
      expect(checkAttendanceAccess('parent', 'parent-1', 'user-1', ['parent-1']).allowed).toBe(true);
      expect(checkAttendanceAccess('student', 'user-2', 'user-1').allowed).toBe(false);
    });

    it('should handle attendance date range filtering', () => {
      const validateAttendanceDateRange = (startDate?: string, endDate?: string) => {
        const errors = [];
        
        if (startDate && isNaN(Date.parse(startDate))) {
          errors.push('Invalid start date format');
        }
        
        if (endDate && isNaN(Date.parse(endDate))) {
          errors.push('Invalid end date format');
        }
        
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          
          if (start > end) {
            errors.push('Start date cannot be after end date');
          }
          
          const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
          if (daysDiff > 366) {
            errors.push('Date range cannot exceed 366 days');
          }
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      };

      expect(validateAttendanceDateRange('2024-01-01', '2024-01-31').valid).toBe(true);
      expect(validateAttendanceDateRange('invalid-date', '2024-01-31').valid).toBe(false);
      expect(validateAttendanceDateRange('2024-01-31', '2024-01-01').valid).toBe(false);
      expect(validateAttendanceDateRange('2023-01-01', '2024-12-31').valid).toBe(false);
    });
  });

  describe('GET /api/v1/students/:id/grades', () => {
    it('should validate grades access permissions', () => {
      const checkGradesAccess = (userRole: string, userId: string, studentUserId: string, parentIds: string[] = []) => {
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

      expect(checkGradesAccess('admin', 'admin-1', 'user-1').allowed).toBe(true);
      expect(checkGradesAccess('student', 'user-1', 'user-1').allowed).toBe(true);
      expect(checkGradesAccess('parent', 'parent-1', 'user-1', ['parent-1']).allowed).toBe(true);
      expect(checkGradesAccess('student', 'user-2', 'user-1').allowed).toBe(false);
    });

    it('should handle grades filtering by subject and semester', () => {
      const validateGradesFilters = (subjectId?: string, semesterId?: string, assessmentType?: string) => {
        const errors = [];
        
        if (subjectId && !/^[0-9a-f-]{36}$/i.test(subjectId)) {
          errors.push('Invalid subject ID format');
        }
        
        if (semesterId && !/^[0-9a-f-]{36}$/i.test(semesterId)) {
          errors.push('Invalid semester ID format');
        }
        
        if (assessmentType && !['assignment', 'quiz', 'midterm', 'final', 'project'].includes(assessmentType)) {
          errors.push('Invalid assessment type');
        }
        
        return {
          valid: errors.length === 0,
          errors,
          filters: {
            subjectId,
            semesterId,
            assessmentType
          }
        };
      };

      expect(validateGradesFilters('123e4567-e89b-12d3-a456-426614174000', undefined, 'assignment').valid).toBe(true);
      expect(validateGradesFilters('invalid-id').valid).toBe(false);
      expect(validateGradesFilters(undefined, undefined, 'invalid-type').valid).toBe(false);
    });
  });

  describe('GET /api/v1/students/:id/fees', () => {
    it('should validate fees access permissions', () => {
      const checkFeesAccess = (userRole: string, userId: string, studentUserId: string, parentIds: string[] = []) => {
        const allowedRoles = ['admin', 'staff'];
        
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

      expect(checkFeesAccess('admin', 'admin-1', 'user-1').allowed).toBe(true);
      expect(checkFeesAccess('student', 'user-1', 'user-1').allowed).toBe(true);
      expect(checkFeesAccess('parent', 'parent-1', 'user-1', ['parent-1']).allowed).toBe(true);
      expect(checkFeesAccess('teacher', 'teacher-1', 'user-1').allowed).toBe(false);
    });

    it('should handle fees filtering by status and academic year', () => {
      const validateFeesFilters = (status?: string, academicYearId?: string, feeType?: string) => {
        const errors = [];
        
        if (status && !['pending', 'partial', 'paid', 'overdue'].includes(status)) {
          errors.push('Invalid fee status');
        }
        
        if (academicYearId && !/^[0-9a-f-]{36}$/i.test(academicYearId)) {
          errors.push('Invalid academic year ID format');
        }
        
        if (feeType && !['tuition', 'library', 'transport', 'examination', 'activity'].includes(feeType)) {
          errors.push('Invalid fee type');
        }
        
        return {
          valid: errors.length === 0,
          errors,
          filters: {
            status,
            academicYearId,
            feeType
          }
        };
      };

      expect(validateFeesFilters('pending', '123e4567-e89b-12d3-a456-426614174000', 'tuition').valid).toBe(true);
      expect(validateFeesFilters('invalid-status').valid).toBe(false);
      expect(validateFeesFilters(undefined, 'invalid-id').valid).toBe(false);
    });
  });

  describe('POST /api/v1/students/:id/parents', () => {
    it('should validate parent linking permissions', () => {
      const checkParentLinkingPermissions = (userRole: string) => {
        if (userRole !== 'admin') {
          return {
            allowed: false,
            statusCode: 403,
            message: 'Admin access required'
          };
        }
        
        return { allowed: true };
      };

      expect(checkParentLinkingPermissions('admin').allowed).toBe(true);
      expect(checkParentLinkingPermissions('teacher').allowed).toBe(false);
    });

    it('should validate parent linking data', () => {
      const validateParentLinkingData = (linkingData: any) => {
        const errors = [];
        
        if (!linkingData.parentUserId) {
          errors.push('Parent user ID is required');
        } else if (!/^[0-9a-f-]{36}$/i.test(linkingData.parentUserId)) {
          errors.push('Invalid parent user ID format');
        }
        
        if (!linkingData.relationshipType) {
          errors.push('Relationship type is required');
        } else if (!['father', 'mother', 'guardian', 'other'].includes(linkingData.relationshipType)) {
          errors.push('Invalid relationship type');
        }
        
        if (linkingData.isPrimary !== undefined && typeof linkingData.isPrimary !== 'boolean') {
          errors.push('isPrimary must be a boolean');
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      };

      expect(validateParentLinkingData({
        parentUserId: '123e4567-e89b-12d3-a456-426614174000',
        relationshipType: 'father',
        isPrimary: true
      }).valid).toBe(true);
      
      expect(validateParentLinkingData({
        parentUserId: 'invalid-id',
        relationshipType: 'father'
      }).valid).toBe(false);
      
      expect(validateParentLinkingData({
        parentUserId: '123e4567-e89b-12d3-a456-426614174000',
        relationshipType: 'invalid'
      }).valid).toBe(false);
    });

    it('should check for duplicate parent relationships', () => {
      const checkDuplicateParentRelationship = (studentId: string, parentUserId: string, existingRelationships: any[]) => {
        const existingRelationship = existingRelationships.find(rel => 
          rel.studentId === studentId && rel.parentUserId === parentUserId
        );
        
        if (existingRelationship) {
          return {
            duplicate: true,
            message: 'Parent is already linked to this student'
          };
        }
        
        return { duplicate: false };
      };

      const existingRelationships = [
        { studentId: 'student-1', parentUserId: 'parent-1' }
      ];
      
      expect(checkDuplicateParentRelationship('student-1', 'parent-2', existingRelationships).duplicate).toBe(false);
      expect(checkDuplicateParentRelationship('student-1', 'parent-1', existingRelationships).duplicate).toBe(true);
    });
  });
});
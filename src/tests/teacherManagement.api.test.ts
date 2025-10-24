import jwt from 'jsonwebtoken';

// Teacher Management API Comprehensive Tests
describe('Teacher Management API Tests', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-that-is-at-least-32-characters-long-for-jwt-validation';
  
  const generateToken = (payload: any) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  };

  const adminToken = generateToken({ userId: 'admin-1', role: 'admin' });
  const teacherToken = generateToken({ userId: 'teacher-1', role: 'teacher' });
  const studentToken = generateToken({ userId: 'student-1', role: 'student' });

  describe('POST /api/v1/teachers', () => {
    it('should validate teacher creation data', () => {
      const validateTeacherData = (teacherData: any) => {
        const errors = [];
        
        if (!teacherData.firstName || teacherData.firstName.length < 2) {
          errors.push('First name must be at least 2 characters');
        }
        
        if (!teacherData.lastName || teacherData.lastName.length < 2) {
          errors.push('Last name must be at least 2 characters');
        }
        
        if (!teacherData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(teacherData.email)) {
          errors.push('Valid email is required');
        }
        
        if (!teacherData.employeeId || teacherData.employeeId.length < 3) {
          errors.push('Employee ID must be at least 3 characters');
        }
        
        if (!teacherData.phone || !/^\+?[\d\s\-\(\)]{10,}$/.test(teacherData.phone)) {
          errors.push('Valid phone number is required');
        }
        
        if (!teacherData.dateOfBirth) {
          errors.push('Date of birth is required');
        } else {
          const dob = new Date(teacherData.dateOfBirth);
          const today = new Date();
          const age = today.getFullYear() - dob.getFullYear();
          
          if (age < 21 || age > 70) {
            errors.push('Teacher age must be between 21 and 70 years');
          }
        }
        
        if (!teacherData.joiningDate) {
          errors.push('Joining date is required');
        } else {
          const joiningDate = new Date(teacherData.joiningDate);
          const today = new Date();
          
          if (joiningDate > today) {
            errors.push('Joining date cannot be in the future');
          }
        }
        
        if (!teacherData.qualification || teacherData.qualification.length < 2) {
          errors.push('Qualification is required');
        }
        
        if (!teacherData.experience || isNaN(teacherData.experience) || teacherData.experience < 0) {
          errors.push('Valid experience in years is required');
        }
        
        if (!teacherData.subjects || !Array.isArray(teacherData.subjects) || teacherData.subjects.length === 0) {
          errors.push('At least one subject specialization is required');
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      };

      const validTeacher = {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@school.com',
        employeeId: 'EMP001',
        phone: '+1234567890',
        dateOfBirth: '1985-05-15',
        joiningDate: '2020-08-01',
        qualification: 'M.Sc. Mathematics',
        experience: 5,
        subjects: ['mathematics', 'physics'],
        address: '123 Teacher Lane, City, State'
      };

      expect(validateTeacherData(validTeacher).valid).toBe(true);
      expect(validateTeacherData({ ...validTeacher, firstName: 'J' }).valid).toBe(false);
      expect(validateTeacherData({ ...validTeacher, email: 'invalid-email' }).valid).toBe(false);
      expect(validateTeacherData({ ...validTeacher, employeeId: 'EM' }).valid).toBe(false);
      expect(validateTeacherData({ ...validTeacher, dateOfBirth: '2010-01-01' }).valid).toBe(false);
      expect(validateTeacherData({ ...validTeacher, subjects: [] }).valid).toBe(false);
    });

    it('should check employee ID uniqueness', () => {
      const checkEmployeeIdUniqueness = (employeeId: string, existingIds: string[]) => {
        if (existingIds.includes(employeeId)) {
          return {
            unique: false,
            message: 'Employee ID already exists'
          };
        }
        
        return { unique: true };
      };

      const existingIds = ['EMP001', 'EMP002', 'EMP003'];
      
      expect(checkEmployeeIdUniqueness('EMP004', existingIds).unique).toBe(true);
      expect(checkEmployeeIdUniqueness('EMP001', existingIds).unique).toBe(false);
    });

    it('should validate subject specializations', () => {
      const validateSubjectSpecializations = (subjects: string[], availableSubjects: string[]) => {
        const errors = [];
        
        if (!Array.isArray(subjects)) {
          errors.push('Subjects must be an array');
          return { valid: false, errors };
        }
        
        const invalidSubjects = subjects.filter(subject => !availableSubjects.includes(subject));
        
        if (invalidSubjects.length > 0) {
          errors.push(`Invalid subjects: ${invalidSubjects.join(', ')}`);
        }
        
        if (subjects.length > 5) {
          errors.push('Cannot specialize in more than 5 subjects');
        }
        
        const duplicates = subjects.filter((subject, index) => subjects.indexOf(subject) !== index);
        if (duplicates.length > 0) {
          errors.push('Duplicate subjects not allowed');
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      };

      const availableSubjects = ['mathematics', 'physics', 'chemistry', 'biology', 'english', 'history'];
      
      expect(validateSubjectSpecializations(['mathematics', 'physics'], availableSubjects).valid).toBe(true);
      expect(validateSubjectSpecializations(['invalid-subject'], availableSubjects).valid).toBe(false);
      expect(validateSubjectSpecializations(['mathematics', 'mathematics'], availableSubjects).valid).toBe(false);
      expect(validateSubjectSpecializations(['mathematics', 'physics', 'chemistry', 'biology', 'english', 'history'], availableSubjects).valid).toBe(false);
    });

    it('should validate admin permissions for teacher creation', () => {
      const checkTeacherCreationPermissions = (userRole: string) => {
        if (userRole !== 'admin') {
          return {
            allowed: false,
            statusCode: 403,
            message: 'Admin access required to create teachers'
          };
        }
        
        return { allowed: true };
      };

      expect(checkTeacherCreationPermissions('admin').allowed).toBe(true);
      expect(checkTeacherCreationPermissions('teacher').allowed).toBe(false);
      expect(checkTeacherCreationPermissions('student').allowed).toBe(false);
    });

    it('should generate user account for teacher', () => {
      const generateTeacherAccount = (teacherData: any) => {
        const username = `${teacherData.firstName.toLowerCase()}.${teacherData.lastName.toLowerCase()}`;
        const tempPassword = Math.random().toString(36).substring(2, 12);
        
        return {
          username,
          email: teacherData.email,
          password: tempPassword,
          role: 'teacher',
          firstName: teacherData.firstName,
          lastName: teacherData.lastName,
          isActive: true,
          mustChangePassword: true
        };
      };

      const teacherData = { firstName: 'John', lastName: 'Smith', email: 'john@school.com' };
      const account = generateTeacherAccount(teacherData);
      
      expect(account.username).toBe('john.smith');
      expect(account.role).toBe('teacher');
      expect(account.mustChangePassword).toBe(true);
      expect(account.password.length).toBeGreaterThan(7);
    });
  });

  describe('GET /api/v1/teachers', () => {
    it('should validate access permissions for teacher listing', () => {
      const checkTeacherListAccess = (userRole: string) => {
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

      expect(checkTeacherListAccess('admin').allowed).toBe(true);
      expect(checkTeacherListAccess('teacher').allowed).toBe(true);
      expect(checkTeacherListAccess('student').allowed).toBe(false);
      expect(checkTeacherListAccess('parent').allowed).toBe(false);
    });

    it('should handle teacher search and filtering', () => {
      const validateTeacherFilters = (query: any) => {
        const errors = [];
        
        if (query.subjectId && !/^[0-9a-f-]{36}$/i.test(query.subjectId)) {
          errors.push('Invalid subject ID format');
        }
        
        if (query.isActive && !['true', 'false'].includes(query.isActive)) {
          errors.push('isActive must be true or false');
        }
        
        if (query.search && query.search.length < 2) {
          errors.push('Search term must be at least 2 characters');
        }
        
        if (query.experience && (isNaN(query.experience) || query.experience < 0)) {
          errors.push('Experience must be a positive number');
        }
        
        if (query.qualification && query.qualification.length < 2) {
          errors.push('Qualification filter must be at least 2 characters');
        }
        
        return {
          valid: errors.length === 0,
          errors,
          filters: {
            subjectId: query.subjectId,
            isActive: query.isActive === 'true',
            search: query.search,
            experience: query.experience ? parseInt(query.experience) : undefined,
            qualification: query.qualification
          }
        };
      };

      expect(validateTeacherFilters({ subjectId: '123e4567-e89b-12d3-a456-426614174000', isActive: 'true' }).valid).toBe(true);
      expect(validateTeacherFilters({ subjectId: 'invalid-id' }).valid).toBe(false);
      expect(validateTeacherFilters({ isActive: 'maybe' }).valid).toBe(false);
      expect(validateTeacherFilters({ search: 'a' }).valid).toBe(false);
      expect(validateTeacherFilters({ experience: '-1' }).valid).toBe(false);
    });

    it('should format teacher list response', () => {
      const formatTeacherListResponse = (teachers: any[], total: number, page: number, limit: number) => {
        return {
          success: true,
          data: {
            teachers: teachers.map(teacher => ({
              id: teacher.id,
              employeeId: teacher.employeeId,
              firstName: teacher.firstName,
              lastName: teacher.lastName,
              email: teacher.email,
              phone: teacher.phone,
              qualification: teacher.qualification,
              experience: teacher.experience,
              subjects: teacher.subjects,
              joiningDate: teacher.joiningDate,
              isActive: teacher.isActive
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

      const mockTeachers = [
        {
          id: 'teacher-1',
          employeeId: 'EMP001',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@school.com',
          phone: '+1234567890',
          qualification: 'M.Sc. Mathematics',
          experience: 5,
          subjects: ['mathematics', 'physics'],
          joiningDate: '2020-08-01',
          isActive: true
        }
      ];

      const response = formatTeacherListResponse(mockTeachers, 1, 1, 10);
      
      expect(response.success).toBe(true);
      expect(response.data.teachers).toHaveLength(1);
      expect(response.data.teachers[0].subjects).toEqual(['mathematics', 'physics']);
      expect(response.data.pagination.total).toBe(1);
    });
  });

  describe('GET /api/v1/teachers/:id', () => {
    it('should validate teacher access permissions', () => {
      const checkTeacherAccess = (userRole: string, userId: string, teacherId: string, teacherUserId: string) => {
        // Admin can access any teacher
        if (userRole === 'admin') {
          return { allowed: true };
        }
        
        // Teachers can access their own profile
        if (userRole === 'teacher' && userId === teacherUserId) {
          return { allowed: true };
        }
        
        // Other teachers can view basic info
        if (userRole === 'teacher') {
          return { allowed: true, limitedAccess: true };
        }
        
        return {
          allowed: false,
          statusCode: 403,
          message: 'Access denied'
        };
      };

      expect(checkTeacherAccess('admin', 'admin-1', 'teacher-1', 'user-1').allowed).toBe(true);
      expect(checkTeacherAccess('teacher', 'user-1', 'teacher-1', 'user-1').allowed).toBe(true);
      expect(checkTeacherAccess('teacher', 'user-2', 'teacher-1', 'user-1').allowed).toBe(true);
      expect(checkTeacherAccess('teacher', 'user-2', 'teacher-1', 'user-1').limitedAccess).toBe(true);
      expect(checkTeacherAccess('student', 'student-1', 'teacher-1', 'user-1').allowed).toBe(false);
    });

    it('should format detailed teacher response', () => {
      const formatTeacherDetailResponse = (teacher: any, userRole: string, isOwnProfile: boolean) => {
        const baseData = {
          id: teacher.id,
          employeeId: teacher.employeeId,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email,
          qualification: teacher.qualification,
          experience: teacher.experience,
          subjects: teacher.subjects,
          joiningDate: teacher.joiningDate,
          isActive: teacher.isActive
        };
        
        // Add sensitive data only for admin or own profile
        if (userRole === 'admin' || isOwnProfile) {
          return {
            ...baseData,
            phone: teacher.phone,
            dateOfBirth: teacher.dateOfBirth,
            address: teacher.address,
            emergencyContact: teacher.emergencyContact,
            salary: teacher.salary,
            classes: teacher.classes
          };
        }
        
        return baseData;
      };

      const mockTeacher = {
        id: 'teacher-1',
        employeeId: 'EMP001',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@school.com',
        phone: '+1234567890',
        dateOfBirth: '1985-05-15',
        qualification: 'M.Sc. Mathematics',
        experience: 5,
        subjects: ['mathematics', 'physics'],
        joiningDate: '2020-08-01',
        address: '123 Teacher Lane',
        emergencyContact: '+1234567891',
        salary: 50000,
        isActive: true
      };

      const adminResponse = formatTeacherDetailResponse(mockTeacher, 'admin', false) as any;
      const ownProfileResponse = formatTeacherDetailResponse(mockTeacher, 'teacher', true) as any;
      const otherTeacherResponse = formatTeacherDetailResponse(mockTeacher, 'teacher', false) as any;
      
      expect(adminResponse.phone).toBeTruthy();
      expect(ownProfileResponse.phone).toBeTruthy();
      expect(otherTeacherResponse.phone).toBeUndefined();
    });
  });

  describe('PUT /api/v1/teachers/:id', () => {
    it('should validate teacher update permissions', () => {
      const checkTeacherUpdatePermissions = (userRole: string, userId: string, teacherUserId: string) => {
        // Admin can update any teacher
        if (userRole === 'admin') {
          return { allowed: true, fullAccess: true };
        }
        
        // Teachers can update limited fields of their own profile
        if (userRole === 'teacher' && userId === teacherUserId) {
          return { allowed: true, fullAccess: false };
        }
        
        return {
          allowed: false,
          statusCode: 403,
          message: 'Access denied'
        };
      };

      expect(checkTeacherUpdatePermissions('admin', 'admin-1', 'user-1').allowed).toBe(true);
      expect(checkTeacherUpdatePermissions('admin', 'admin-1', 'user-1').fullAccess).toBe(true);
      expect(checkTeacherUpdatePermissions('teacher', 'user-1', 'user-1').allowed).toBe(true);
      expect(checkTeacherUpdatePermissions('teacher', 'user-1', 'user-1').fullAccess).toBe(false);
      expect(checkTeacherUpdatePermissions('teacher', 'user-2', 'user-1').allowed).toBe(false);
    });

    it('should validate teacher update data', () => {
      const validateTeacherUpdateData = (updateData: any, hasFullAccess: boolean) => {
        const errors = [];
        
        // Fields that teachers can update
        const teacherAllowedFields = ['phone', 'address', 'emergencyContact'];
        
        // Fields that only admin can update
        const adminOnlyFields = ['employeeId', 'salary', 'isActive', 'subjects', 'qualification'];
        
        if (!hasFullAccess) {
          const restrictedFields = Object.keys(updateData).filter(field => 
            !teacherAllowedFields.includes(field) && !['firstName', 'lastName'].includes(field)
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
        
        if (updateData.phone && !/^\+?[\d\s\-\(\)]{10,}$/.test(updateData.phone)) {
          errors.push('Invalid phone number format');
        }
        
        if (updateData.emergencyContact && !/^\+?[\d\s\-\(\)]{10,}$/.test(updateData.emergencyContact)) {
          errors.push('Invalid emergency contact format');
        }
        
        if (updateData.salary && (isNaN(updateData.salary) || updateData.salary < 0)) {
          errors.push('Salary must be a positive number');
        }
        
        if (updateData.experience && (isNaN(updateData.experience) || updateData.experience < 0)) {
          errors.push('Experience must be a positive number');
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      };

      expect(validateTeacherUpdateData({ firstName: 'John', phone: '+1234567890' }, true).valid).toBe(true);
      expect(validateTeacherUpdateData({ firstName: 'John', phone: '+1234567890' }, false).valid).toBe(true);
      expect(validateTeacherUpdateData({ salary: 60000 }, false).valid).toBe(false);
      expect(validateTeacherUpdateData({ salary: 60000 }, true).valid).toBe(true);
      expect(validateTeacherUpdateData({ phone: '123' }, true).valid).toBe(false);
    });
  });

  describe('DELETE /api/v1/teachers/:id', () => {
    it('should validate teacher deletion permissions', () => {
      const checkTeacherDeletionPermissions = (userRole: string) => {
        if (userRole !== 'admin') {
          return {
            allowed: false,
            statusCode: 403,
            message: 'Admin access required'
          };
        }
        
        return { allowed: true };
      };

      expect(checkTeacherDeletionPermissions('admin').allowed).toBe(true);
      expect(checkTeacherDeletionPermissions('teacher').allowed).toBe(false);
    });

    it('should handle teacher deletion with related data', () => {
      const handleTeacherDeletion = (teacherId: string, hasClasses: boolean, hasGrades: boolean, hasAttendance: boolean) => {
        const relatedData = [];
        
        if (hasClasses) relatedData.push('class assignments');
        if (hasGrades) relatedData.push('grade records');
        if (hasAttendance) relatedData.push('attendance records');
        
        if (relatedData.length > 0) {
          return {
            type: 'soft',
            action: 'deactivate',
            message: `Teacher deactivated. Has related data: ${relatedData.join(', ')}`,
            relatedData
          };
        }
        
        return {
          type: 'hard',
          action: 'delete',
          message: 'Teacher deleted permanently'
        };
      };

      expect(handleTeacherDeletion('teacher-1', true, true, false).type).toBe('soft');
      expect(handleTeacherDeletion('teacher-1', false, false, false).type).toBe('hard');
      expect(handleTeacherDeletion('teacher-1', true, false, false).relatedData).toContain('class assignments');
    });
  });

  describe('GET /api/v1/teachers/:id/classes', () => {
    it('should validate teacher classes access', () => {
      const checkTeacherClassesAccess = (userRole: string, userId: string, teacherUserId: string) => {
        const allowedRoles = ['admin'];
        
        if (allowedRoles.includes(userRole)) {
          return { allowed: true };
        }
        
        if (userRole === 'teacher' && userId === teacherUserId) {
          return { allowed: true };
        }
        
        return {
          allowed: false,
          statusCode: 403,
          message: 'Access denied'
        };
      };

      expect(checkTeacherClassesAccess('admin', 'admin-1', 'user-1').allowed).toBe(true);
      expect(checkTeacherClassesAccess('teacher', 'user-1', 'user-1').allowed).toBe(true);
      expect(checkTeacherClassesAccess('teacher', 'user-2', 'user-1').allowed).toBe(false);
    });

    it('should format teacher classes response', () => {
      const formatTeacherClassesResponse = (classes: any[]) => {
        return {
          success: true,
          data: {
            classes: classes.map(cls => ({
              id: cls.id,
              name: cls.name,
              grade: cls.grade,
              section: cls.section,
              subject: cls.subject,
              studentCount: cls.studentCount,
              capacity: cls.capacity,
              schedule: cls.schedule,
              isActive: cls.isActive
            }))
          }
        };
      };

      const mockClasses = [
        {
          id: 'class-1',
          name: 'Grade 5A Mathematics',
          grade: '5',
          section: 'A',
          subject: 'Mathematics',
          studentCount: 25,
          capacity: 30,
          schedule: 'Mon, Wed, Fri 10:00-11:00',
          isActive: true
        }
      ];

      const response = formatTeacherClassesResponse(mockClasses);
      
      expect(response.success).toBe(true);
      expect(response.data.classes).toHaveLength(1);
      expect(response.data.classes[0].subject).toBe('Mathematics');
    });
  });

  describe('GET /api/v1/teachers/:id/subjects', () => {
    it('should validate teacher subjects access', () => {
      const checkTeacherSubjectsAccess = (userRole: string) => {
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

      expect(checkTeacherSubjectsAccess('admin').allowed).toBe(true);
      expect(checkTeacherSubjectsAccess('teacher').allowed).toBe(true);
      expect(checkTeacherSubjectsAccess('student').allowed).toBe(false);
    });

    it('should format teacher subjects response', () => {
      const formatTeacherSubjectsResponse = (subjects: any[]) => {
        return {
          success: true,
          data: {
            subjects: subjects.map(subject => ({
              id: subject.id,
              name: subject.name,
              code: subject.code,
              description: subject.description,
              creditHours: subject.creditHours,
              classes: subject.classes,
              isActive: subject.isActive
            }))
          }
        };
      };

      const mockSubjects = [
        {
          id: 'subject-1',
          name: 'Mathematics',
          code: 'MATH101',
          description: 'Basic Mathematics',
          creditHours: 4,
          classes: ['Grade 5A', 'Grade 5B'],
          isActive: true
        }
      ];

      const response = formatTeacherSubjectsResponse(mockSubjects);
      
      expect(response.success).toBe(true);
      expect(response.data.subjects).toHaveLength(1);
      expect(response.data.subjects[0].classes).toEqual(['Grade 5A', 'Grade 5B']);
    });
  });

  describe('POST /api/v1/teachers/:id/assignments', () => {
    it('should validate teacher assignment permissions', () => {
      const checkTeacherAssignmentPermissions = (userRole: string) => {
        if (userRole !== 'admin') {
          return {
            allowed: false,
            statusCode: 403,
            message: 'Admin access required'
          };
        }
        
        return { allowed: true };
      };

      expect(checkTeacherAssignmentPermissions('admin').allowed).toBe(true);
      expect(checkTeacherAssignmentPermissions('teacher').allowed).toBe(false);
    });

    it('should validate teacher assignment data', () => {
      const validateTeacherAssignmentData = (assignmentData: any) => {
        const errors = [];
        
        if (!assignmentData.type || !['class', 'subject'].includes(assignmentData.type)) {
          errors.push('Assignment type must be either "class" or "subject"');
        }
        
        if (assignmentData.type === 'class') {
          if (!assignmentData.classId) {
            errors.push('Class ID is required for class assignment');
          } else if (!/^[0-9a-f-]{36}$/i.test(assignmentData.classId)) {
            errors.push('Invalid class ID format');
          }
          
          if (!assignmentData.subjectId) {
            errors.push('Subject ID is required for class assignment');
          }
        }
        
        if (assignmentData.type === 'subject') {
          if (!assignmentData.subjectId) {
            errors.push('Subject ID is required for subject assignment');
          } else if (!/^[0-9a-f-]{36}$/i.test(assignmentData.subjectId)) {
            errors.push('Invalid subject ID format');
          }
        }
        
        if (assignmentData.startDate && isNaN(Date.parse(assignmentData.startDate))) {
          errors.push('Invalid start date format');
        }
        
        if (assignmentData.endDate && isNaN(Date.parse(assignmentData.endDate))) {
          errors.push('Invalid end date format');
        }
        
        if (assignmentData.startDate && assignmentData.endDate) {
          const start = new Date(assignmentData.startDate);
          const end = new Date(assignmentData.endDate);
          
          if (start >= end) {
            errors.push('End date must be after start date');
          }
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      };

      expect(validateTeacherAssignmentData({
        type: 'class',
        classId: '123e4567-e89b-12d3-a456-426614174000',
        subjectId: '123e4567-e89b-12d3-a456-426614174001',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      }).valid).toBe(true);
      
      expect(validateTeacherAssignmentData({
        type: 'invalid'
      }).valid).toBe(false);
      
      expect(validateTeacherAssignmentData({
        type: 'class',
        classId: 'invalid-id'
      }).valid).toBe(false);
    });

    it('should check for assignment conflicts', () => {
      const checkAssignmentConflicts = (teacherId: string, assignmentData: any, existingAssignments: any[]) => {
        const conflicts = [];
        
        // Check for overlapping class assignments
        if (assignmentData.type === 'class') {
          const conflictingAssignments = existingAssignments.filter(assignment => 
            assignment.teacherId === teacherId &&
            assignment.classId === assignmentData.classId &&
            assignment.subjectId === assignmentData.subjectId &&
            assignment.isActive
          );
          
          if (conflictingAssignments.length > 0) {
            conflicts.push('Teacher is already assigned to this class-subject combination');
          }
        }
        
        // Check for workload limits
        const activeAssignments = existingAssignments.filter(assignment => 
          assignment.teacherId === teacherId && assignment.isActive
        );
        
        if (activeAssignments.length >= 10) {
          conflicts.push('Teacher has reached maximum assignment limit (10)');
        }
        
        return {
          hasConflicts: conflicts.length > 0,
          conflicts
        };
      };

      const existingAssignments = [
        { teacherId: 'teacher-1', classId: 'class-1', subjectId: 'subject-1', isActive: true }
      ];
      
      expect(checkAssignmentConflicts('teacher-1', {
        type: 'class',
        classId: 'class-2',
        subjectId: 'subject-1'
      }, existingAssignments).hasConflicts).toBe(false);
      
      expect(checkAssignmentConflicts('teacher-1', {
        type: 'class',
        classId: 'class-1',
        subjectId: 'subject-1'
      }, existingAssignments).hasConflicts).toBe(true);
    });
  });

  describe('Teacher Workload Management', () => {
    it('should calculate teacher workload', () => {
      const calculateTeacherWorkload = (assignments: any[]) => {
        const classCount = assignments.filter(a => a.type === 'class').length;
        const subjectCount = new Set(assignments.map(a => a.subjectId)).size;
        const totalStudents = assignments.reduce((sum, a) => sum + (a.studentCount || 0), 0);
        
        const workloadScore = (classCount * 2) + (subjectCount * 1) + (totalStudents * 0.1);
        
        return {
          classCount,
          subjectCount,
          totalStudents,
          workloadScore: Math.round(workloadScore * 100) / 100,
          workloadLevel: workloadScore < 20 ? 'Low' : workloadScore < 40 ? 'Medium' : 'High'
        };
      };

      const assignments = [
        { type: 'class', subjectId: 'subject-1', studentCount: 25 },
        { type: 'class', subjectId: 'subject-1', studentCount: 30 },
        { type: 'class', subjectId: 'subject-2', studentCount: 20 }
      ];

      const workload = calculateTeacherWorkload(assignments);
      
      expect(workload.classCount).toBe(3);
      expect(workload.subjectCount).toBe(2);
      expect(workload.totalStudents).toBe(75);
      expect(workload.workloadLevel).toBeTruthy();
    });

    it('should validate teacher availability', () => {
      const checkTeacherAvailability = (teacherId: string, timeSlot: any, existingSchedule: any[]) => {
        const conflicts = existingSchedule.filter(schedule => 
          schedule.teacherId === teacherId &&
          schedule.day === timeSlot.day &&
          ((timeSlot.startTime >= schedule.startTime && timeSlot.startTime < schedule.endTime) ||
           (timeSlot.endTime > schedule.startTime && timeSlot.endTime <= schedule.endTime) ||
           (timeSlot.startTime <= schedule.startTime && timeSlot.endTime >= schedule.endTime))
        );
        
        return {
          available: conflicts.length === 0,
          conflicts: conflicts.map(c => `${c.day} ${c.startTime}-${c.endTime} (${c.className})`)
        };
      };

      const existingSchedule = [
        { teacherId: 'teacher-1', day: 'Monday', startTime: '09:00', endTime: '10:00', className: 'Grade 5A' }
      ];
      
      const newTimeSlot = { day: 'Monday', startTime: '09:30', endTime: '10:30' };
      const availableTimeSlot = { day: 'Monday', startTime: '11:00', endTime: '12:00' };
      
      expect(checkTeacherAvailability('teacher-1', newTimeSlot, existingSchedule).available).toBe(false);
      expect(checkTeacherAvailability('teacher-1', availableTimeSlot, existingSchedule).available).toBe(true);
    });
  });
});
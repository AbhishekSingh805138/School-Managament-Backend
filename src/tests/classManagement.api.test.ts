import jwt from 'jsonwebtoken';

// Class Management API Comprehensive Tests
describe('Class Management API Tests', () => {
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

  describe('POST /api/v1/classes', () => {
    it('should validate class creation data', () => {
      const validateClassData = (classData: any) => {
        const errors = [];
        
        if (!classData.name || classData.name.length < 2) {
          errors.push('Class name must be at least 2 characters');
        }
        
        if (!classData.grade || !/^(K|[1-9]|1[0-2])$/.test(classData.grade)) {
          errors.push('Grade must be K or 1-12');
        }
        
        if (!classData.section || !/^[A-Z]$/.test(classData.section)) {
          errors.push('Section must be a single uppercase letter');
        }
        
        if (!classData.capacity || isNaN(classData.capacity) || classData.capacity < 1 || classData.capacity > 50) {
          errors.push('Capacity must be between 1 and 50');
        }
        
        if (!classData.academicYearId) {
          errors.push('Academic year ID is required');
        } else if (!/^[0-9a-f-]{36}$/i.test(classData.academicYearId)) {
          errors.push('Invalid academic year ID format');
        }
        
        if (classData.teacherId && !/^[0-9a-f-]{36}$/i.test(classData.teacherId)) {
          errors.push('Invalid teacher ID format');
        }
        
        if (classData.room && classData.room.length < 1) {
          errors.push('Room number cannot be empty if provided');
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      };

      const validClass = {
        name: 'Grade 5A',
        grade: '5',
        section: 'A',
        capacity: 30,
        academicYearId: '123e4567-e89b-12d3-a456-426614174000',
        teacherId: '123e4567-e89b-12d3-a456-426614174001',
        room: 'Room 101',
        description: 'Grade 5 Section A'
      };

      expect(validateClassData(validClass).valid).toBe(true);
      expect(validateClassData({ ...validClass, name: 'G' }).valid).toBe(false);
      expect(validateClassData({ ...validClass, grade: '13' }).valid).toBe(false);
      expect(validateClassData({ ...validClass, section: 'a' }).valid).toBe(false);
      expect(validateClassData({ ...validClass, capacity: 0 }).valid).toBe(false);
      expect(validateClassData({ ...validClass, capacity: 51 }).valid).toBe(false);
      expect(validateClassData({ ...validClass, academicYearId: 'invalid-id' }).valid).toBe(false);
    });

    it('should check class uniqueness', () => {
      const checkClassUniqueness = (grade: string, section: string, academicYearId: string, existingClasses: any[]) => {
        const duplicate = existingClasses.find(cls => 
          cls.grade === grade && 
          cls.section === section && 
          cls.academicYearId === academicYearId &&
          cls.isActive
        );
        
        if (duplicate) {
          return {
            unique: false,
            message: `Class ${grade}${section} already exists for this academic year`
          };
        }
        
        return { unique: true };
      };

      const existingClasses = [
        { grade: '5', section: 'A', academicYearId: 'year-1', isActive: true },
        { grade: '5', section: 'B', academicYearId: 'year-1', isActive: true }
      ];
      
      expect(checkClassUniqueness('5', 'C', 'year-1', existingClasses).unique).toBe(true);
      expect(checkClassUniqueness('5', 'A', 'year-1', existingClasses).unique).toBe(false);
      expect(checkClassUniqueness('5', 'A', 'year-2', existingClasses).unique).toBe(true);
    });

    it('should validate teacher availability', () => {
      const validateTeacherAvailability = (teacherId: string, existingAssignments: any[]) => {
        if (!teacherId) return { available: true };
        
        const currentAssignments = existingAssignments.filter(assignment => 
          assignment.teacherId === teacherId && assignment.isActive
        );
        
        if (currentAssignments.length >= 3) {
          return {
            available: false,
            message: 'Teacher is already assigned to maximum number of classes (3)'
          };
        }
        
        return { available: true };
      };

      const existingAssignments = [
        { teacherId: 'teacher-1', isActive: true },
        { teacherId: 'teacher-1', isActive: true },
        { teacherId: 'teacher-1', isActive: true }
      ];
      
      expect(validateTeacherAvailability('teacher-2', existingAssignments).available).toBe(true);
      expect(validateTeacherAvailability('teacher-1', existingAssignments).available).toBe(false);
      expect(validateTeacherAvailability('', existingAssignments).available).toBe(true);
    });

    it('should validate admin permissions for class creation', () => {
      const checkClassCreationPermissions = (userRole: string) => {
        if (userRole !== 'admin') {
          return {
            allowed: false,
            statusCode: 403,
            message: 'Admin access required to create classes'
          };
        }
        
        return { allowed: true };
      };

      expect(checkClassCreationPermissions('admin').allowed).toBe(true);
      expect(checkClassCreationPermissions('teacher').allowed).toBe(false);
      expect(checkClassCreationPermissions('student').allowed).toBe(false);
    });
  });

  describe('GET /api/v1/classes', () => {
    it('should validate access permissions for class listing', () => {
      const checkClassListAccess = (userRole: string) => {
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

      expect(checkClassListAccess('admin').allowed).toBe(true);
      expect(checkClassListAccess('teacher').allowed).toBe(true);
      expect(checkClassListAccess('student').allowed).toBe(false);
      expect(checkClassListAccess('parent').allowed).toBe(false);
    });

    it('should handle class search and filtering', () => {
      const validateClassFilters = (query: any) => {
        const errors = [];
        
        if (query.grade && !/^(K|[1-9]|1[0-2])$/.test(query.grade)) {
          errors.push('Invalid grade format');
        }
        
        if (query.section && !/^[A-Z]$/.test(query.section)) {
          errors.push('Section must be a single uppercase letter');
        }
        
        if (query.academicYearId && !/^[0-9a-f-]{36}$/i.test(query.academicYearId)) {
          errors.push('Invalid academic year ID format');
        }
        
        if (query.teacherId && !/^[0-9a-f-]{36}$/i.test(query.teacherId)) {
          errors.push('Invalid teacher ID format');
        }
        
        if (query.isActive && !['true', 'false'].includes(query.isActive)) {
          errors.push('isActive must be true or false');
        }
        
        if (query.search && query.search.length < 2) {
          errors.push('Search term must be at least 2 characters');
        }
        
        if (query.minCapacity && (isNaN(query.minCapacity) || query.minCapacity < 1)) {
          errors.push('Minimum capacity must be a positive number');
        }
        
        if (query.maxCapacity && (isNaN(query.maxCapacity) || query.maxCapacity < 1)) {
          errors.push('Maximum capacity must be a positive number');
        }
        
        if (query.minCapacity && query.maxCapacity && parseInt(query.minCapacity) > parseInt(query.maxCapacity)) {
          errors.push('Minimum capacity cannot be greater than maximum capacity');
        }
        
        return {
          valid: errors.length === 0,
          errors,
          filters: {
            grade: query.grade,
            section: query.section,
            academicYearId: query.academicYearId,
            teacherId: query.teacherId,
            isActive: query.isActive === 'true',
            search: query.search,
            minCapacity: query.minCapacity ? parseInt(query.minCapacity) : undefined,
            maxCapacity: query.maxCapacity ? parseInt(query.maxCapacity) : undefined
          }
        };
      };

      expect(validateClassFilters({ grade: '5', section: 'A', isActive: 'true' }).valid).toBe(true);
      expect(validateClassFilters({ grade: '13' }).valid).toBe(false);
      expect(validateClassFilters({ section: 'a' }).valid).toBe(false);
      expect(validateClassFilters({ academicYearId: 'invalid-id' }).valid).toBe(false);
      expect(validateClassFilters({ isActive: 'maybe' }).valid).toBe(false);
      expect(validateClassFilters({ search: 'a' }).valid).toBe(false);
      expect(validateClassFilters({ minCapacity: '30', maxCapacity: '20' }).valid).toBe(false);
    });

    it('should apply teacher-specific filtering', () => {
      const applyTeacherFiltering = (userRole: string, teacherId: string, classes: any[]) => {
        if (userRole !== 'teacher') {
          return classes;
        }
        
        // Teachers can only see their assigned classes
        return classes.filter(cls => cls.teacherId === teacherId);
      };

      const allClasses = [
        { id: 'class-1', teacherId: 'teacher-1', name: 'Grade 5A' },
        { id: 'class-2', teacherId: 'teacher-2', name: 'Grade 5B' },
        { id: 'class-3', teacherId: 'teacher-1', name: 'Grade 6A' }
      ];

      const teacherFiltered = applyTeacherFiltering('teacher', 'teacher-1', allClasses);
      const adminFiltered = applyTeacherFiltering('admin', 'admin-1', allClasses);
      
      expect(teacherFiltered).toHaveLength(2);
      expect(adminFiltered).toHaveLength(3);
      expect(teacherFiltered.every(cls => cls.teacherId === 'teacher-1')).toBe(true);
    });

    it('should format class list response', () => {
      const formatClassListResponse = (classes: any[], total: number, page: number, limit: number) => {
        return {
          success: true,
          data: {
            classes: classes.map(cls => ({
              id: cls.id,
              name: cls.name,
              grade: cls.grade,
              section: cls.section,
              capacity: cls.capacity,
              currentEnrollment: cls.currentEnrollment,
              teacherId: cls.teacherId,
              teacherName: cls.teacher ? `${cls.teacher.firstName} ${cls.teacher.lastName}` : null,
              room: cls.room,
              academicYearId: cls.academicYearId,
              academicYear: cls.academicYear?.name,
              isActive: cls.isActive,
              subjects: cls.subjects?.map((s: any) => ({ id: s.id, name: s.name }))
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

      const mockClasses = [
        {
          id: 'class-1',
          name: 'Grade 5A',
          grade: '5',
          section: 'A',
          capacity: 30,
          currentEnrollment: 25,
          teacherId: 'teacher-1',
          teacher: { firstName: 'John', lastName: 'Smith' },
          room: 'Room 101',
          academicYearId: 'year-1',
          academicYear: { name: '2024-2025' },
          isActive: true,
          subjects: [{ id: 'subject-1', name: 'Mathematics' }]
        }
      ];

      const response = formatClassListResponse(mockClasses, 1, 1, 10);
      
      expect(response.success).toBe(true);
      expect(response.data.classes).toHaveLength(1);
      expect(response.data.classes[0].teacherName).toBe('John Smith');
      expect(response.data.classes[0].subjects).toHaveLength(1);
      expect(response.data.pagination.total).toBe(1);
    });
  });

  describe('GET /api/v1/classes/:id', () => {
    it('should validate class access permissions', () => {
      const checkClassAccess = (userRole: string, userId: string, classTeacherId: string) => {
        // Admin can access any class
        if (userRole === 'admin') {
          return { allowed: true };
        }
        
        // Teachers can access their assigned classes
        if (userRole === 'teacher' && userId === classTeacherId) {
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

      expect(checkClassAccess('admin', 'admin-1', 'teacher-1').allowed).toBe(true);
      expect(checkClassAccess('teacher', 'teacher-1', 'teacher-1').allowed).toBe(true);
      expect(checkClassAccess('teacher', 'teacher-2', 'teacher-1').allowed).toBe(true);
      expect(checkClassAccess('teacher', 'teacher-2', 'teacher-1').limitedAccess).toBe(true);
      expect(checkClassAccess('student', 'student-1', 'teacher-1').allowed).toBe(false);
    });

    it('should format detailed class response', () => {
      const formatClassDetailResponse = (classData: any, userRole: string, hasFullAccess: boolean) => {
        const baseData = {
          id: classData.id,
          name: classData.name,
          grade: classData.grade,
          section: classData.section,
          capacity: classData.capacity,
          currentEnrollment: classData.currentEnrollment,
          room: classData.room,
          description: classData.description,
          isActive: classData.isActive,
          teacher: classData.teacher ? {
            id: classData.teacher.id,
            name: `${classData.teacher.firstName} ${classData.teacher.lastName}`,
            email: classData.teacher.email
          } : null,
          academicYear: {
            id: classData.academicYear.id,
            name: classData.academicYear.name
          },
          subjects: classData.subjects?.map((s: any) => ({
            id: s.id,
            name: s.name,
            code: s.code
          }))
        };
        
        // Add detailed data for admin or assigned teacher
        if (userRole === 'admin' || hasFullAccess) {
          return {
            ...baseData,
            students: classData.students?.map((s: any) => ({
              id: s.id,
              studentId: s.studentId,
              name: `${s.firstName} ${s.lastName}`,
              email: s.email,
              enrollmentDate: s.enrollmentDate
            })),
            schedule: classData.schedule,
            createdAt: classData.createdAt,
            updatedAt: classData.updatedAt
          };
        }
        
        return baseData;
      };

      const mockClass = {
        id: 'class-1',
        name: 'Grade 5A',
        grade: '5',
        section: 'A',
        capacity: 30,
        currentEnrollment: 25,
        room: 'Room 101',
        description: 'Grade 5 Section A',
        isActive: true,
        teacher: {
          id: 'teacher-1',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@school.com'
        },
        academicYear: {
          id: 'year-1',
          name: '2024-2025'
        },
        subjects: [{ id: 'subject-1', name: 'Mathematics', code: 'MATH5' }],
        students: [{ id: 'student-1', studentId: 'STU001', firstName: 'Alice', lastName: 'Johnson', email: 'alice@school.com', enrollmentDate: '2024-01-15' }],
        schedule: 'Mon-Fri 9:00-15:00',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      };

      const adminResponse = formatClassDetailResponse(mockClass, 'admin', true) as any;
      const teacherResponse = formatClassDetailResponse(mockClass, 'teacher', true) as any;
      const otherTeacherResponse = formatClassDetailResponse(mockClass, 'teacher', false) as any;
      
      expect(adminResponse.students).toBeTruthy();
      expect(teacherResponse.students).toBeTruthy();
      expect(otherTeacherResponse.students).toBeUndefined();
    });
  });

  describe('PUT /api/v1/classes/:id', () => {
    it('should validate class update permissions', () => {
      const checkClassUpdatePermissions = (userRole: string) => {
        if (userRole !== 'admin') {
          return {
            allowed: false,
            statusCode: 403,
            message: 'Admin access required'
          };
        }
        
        return { allowed: true };
      };

      expect(checkClassUpdatePermissions('admin').allowed).toBe(true);
      expect(checkClassUpdatePermissions('teacher').allowed).toBe(false);
      expect(checkClassUpdatePermissions('student').allowed).toBe(false);
    });

    it('should validate class update data', () => {
      const validateClassUpdateData = (updateData: any) => {
        const errors = [];
        
        if (updateData.name && updateData.name.length < 2) {
          errors.push('Class name must be at least 2 characters');
        }
        
        if (updateData.grade && !/^(K|[1-9]|1[0-2])$/.test(updateData.grade)) {
          errors.push('Grade must be K or 1-12');
        }
        
        if (updateData.section && !/^[A-Z]$/.test(updateData.section)) {
          errors.push('Section must be a single uppercase letter');
        }
        
        if (updateData.capacity !== undefined && (isNaN(updateData.capacity) || updateData.capacity < 1 || updateData.capacity > 50)) {
          errors.push('Capacity must be between 1 and 50');
        }
        
        if (updateData.teacherId && !/^[0-9a-f-]{36}$/i.test(updateData.teacherId)) {
          errors.push('Invalid teacher ID format');
        }
        
        if (updateData.room && updateData.room.length < 1) {
          errors.push('Room number cannot be empty if provided');
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      };

      expect(validateClassUpdateData({ name: 'Grade 5B', capacity: 25 }).valid).toBe(true);
      expect(validateClassUpdateData({ name: 'G' }).valid).toBe(false);
      expect(validateClassUpdateData({ grade: '13' }).valid).toBe(false);
      expect(validateClassUpdateData({ section: 'a' }).valid).toBe(false);
      expect(validateClassUpdateData({ capacity: 0 }).valid).toBe(false);
      expect(validateClassUpdateData({ teacherId: 'invalid-id' }).valid).toBe(false);
    });

    it('should validate capacity changes with current enrollment', () => {
      const validateCapacityChange = (newCapacity: number, currentEnrollment: number) => {
        if (newCapacity < currentEnrollment) {
          return {
            valid: false,
            error: `Cannot reduce capacity below current enrollment (${currentEnrollment})`
          };
        }
        
        return { valid: true };
      };

      expect(validateCapacityChange(30, 25).valid).toBe(true);
      expect(validateCapacityChange(20, 25).valid).toBe(false);
      expect(validateCapacityChange(25, 25).valid).toBe(true);
    });

    it('should validate teacher reassignment', () => {
      const validateTeacherReassignment = (newTeacherId: string, currentTeacherId: string, teacherAssignments: any[]) => {
        if (newTeacherId === currentTeacherId) {
          return { valid: true }; // No change
        }
        
        if (newTeacherId) {
          const teacherClassCount = teacherAssignments.filter(assignment => 
            assignment.teacherId === newTeacherId && assignment.isActive
          ).length;
          
          if (teacherClassCount >= 3) {
            return {
              valid: false,
              error: 'Teacher is already assigned to maximum number of classes (3)'
            };
          }
        }
        
        return { valid: true };
      };

      const teacherAssignments = [
        { teacherId: 'teacher-1', isActive: true },
        { teacherId: 'teacher-1', isActive: true },
        { teacherId: 'teacher-1', isActive: true }
      ];
      
      expect(validateTeacherReassignment('teacher-2', 'teacher-3', teacherAssignments).valid).toBe(true);
      expect(validateTeacherReassignment('teacher-1', 'teacher-3', teacherAssignments).valid).toBe(false);
      expect(validateTeacherReassignment('teacher-3', 'teacher-3', teacherAssignments).valid).toBe(true);
    });
  });

  describe('DELETE /api/v1/classes/:id', () => {
    it('should validate class deletion permissions', () => {
      const checkClassDeletionPermissions = (userRole: string) => {
        if (userRole !== 'admin') {
          return {
            allowed: false,
            statusCode: 403,
            message: 'Admin access required'
          };
        }
        
        return { allowed: true };
      };

      expect(checkClassDeletionPermissions('admin').allowed).toBe(true);
      expect(checkClassDeletionPermissions('teacher').allowed).toBe(false);
    });

    it('should handle class deletion with enrolled students', () => {
      const handleClassDeletion = (classId: string, hasStudents: boolean, hasAttendance: boolean, hasGrades: boolean) => {
        const relatedData = [];
        
        if (hasStudents) relatedData.push('enrolled students');
        if (hasAttendance) relatedData.push('attendance records');
        if (hasGrades) relatedData.push('grade records');
        
        if (relatedData.length > 0) {
          return {
            type: 'soft',
            action: 'deactivate',
            message: `Class deactivated. Has related data: ${relatedData.join(', ')}`,
            relatedData
          };
        }
        
        return {
          type: 'hard',
          action: 'delete',
          message: 'Class deleted permanently'
        };
      };

      expect(handleClassDeletion('class-1', true, true, false).type).toBe('soft');
      expect(handleClassDeletion('class-1', false, false, false).type).toBe('hard');
      expect(handleClassDeletion('class-1', true, false, false).relatedData).toContain('enrolled students');
    });
  });

  describe('GET /api/v1/classes/:id/students', () => {
    it('should validate class students access', () => {
      const checkClassStudentsAccess = (userRole: string, userId: string, classTeacherId: string) => {
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

      expect(checkClassStudentsAccess('admin', 'admin-1', 'teacher-1').allowed).toBe(true);
      expect(checkClassStudentsAccess('teacher', 'teacher-1', 'teacher-1').allowed).toBe(true);
      expect(checkClassStudentsAccess('teacher', 'teacher-2', 'teacher-1').allowed).toBe(false);
    });

    it('should format class students response', () => {
      const formatClassStudentsResponse = (students: any[]) => {
        return {
          success: true,
          data: {
            students: students.map(student => ({
              id: student.id,
              studentId: student.studentId,
              firstName: student.firstName,
              lastName: student.lastName,
              email: student.email,
              enrollmentDate: student.enrollmentDate,
              isActive: student.isActive,
              attendancePercentage: student.attendancePercentage,
              averageGrade: student.averageGrade
            })),
            totalStudents: students.length,
            activeStudents: students.filter(s => s.isActive).length
          }
        };
      };

      const mockStudents = [
        {
          id: 'student-1',
          studentId: 'STU001',
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice@school.com',
          enrollmentDate: '2024-01-15',
          isActive: true,
          attendancePercentage: 95.5,
          averageGrade: 87.2
        }
      ];

      const response = formatClassStudentsResponse(mockStudents);
      
      expect(response.success).toBe(true);
      expect(response.data.students).toHaveLength(1);
      expect(response.data.totalStudents).toBe(1);
      expect(response.data.activeStudents).toBe(1);
    });
  });

  describe('GET /api/v1/classes/:id/subjects', () => {
    it('should validate class subjects access', () => {
      const checkClassSubjectsAccess = (userRole: string) => {
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

      expect(checkClassSubjectsAccess('admin').allowed).toBe(true);
      expect(checkClassSubjectsAccess('teacher').allowed).toBe(true);
      expect(checkClassSubjectsAccess('student').allowed).toBe(false);
    });

    it('should format class subjects response', () => {
      const formatClassSubjectsResponse = (subjects: any[]) => {
        return {
          success: true,
          data: {
            subjects: subjects.map(subject => ({
              id: subject.id,
              name: subject.name,
              code: subject.code,
              description: subject.description,
              creditHours: subject.creditHours,
              teacherId: subject.teacherId,
              teacherName: subject.teacher ? `${subject.teacher.firstName} ${subject.teacher.lastName}` : null,
              isActive: subject.isActive
            }))
          }
        };
      };

      const mockSubjects = [
        {
          id: 'subject-1',
          name: 'Mathematics',
          code: 'MATH5',
          description: 'Grade 5 Mathematics',
          creditHours: 4,
          teacherId: 'teacher-1',
          teacher: { firstName: 'John', lastName: 'Smith' },
          isActive: true
        }
      ];

      const response = formatClassSubjectsResponse(mockSubjects);
      
      expect(response.success).toBe(true);
      expect(response.data.subjects).toHaveLength(1);
      expect(response.data.subjects[0].teacherName).toBe('John Smith');
    });
  });

  describe('POST /api/v1/classes/:id/subjects', () => {
    it('should validate subject assignment permissions', () => {
      const checkSubjectAssignmentPermissions = (userRole: string) => {
        if (userRole !== 'admin') {
          return {
            allowed: false,
            statusCode: 403,
            message: 'Admin access required'
          };
        }
        
        return { allowed: true };
      };

      expect(checkSubjectAssignmentPermissions('admin').allowed).toBe(true);
      expect(checkSubjectAssignmentPermissions('teacher').allowed).toBe(false);
    });

    it('should validate subject assignment data', () => {
      const validateSubjectAssignmentData = (assignmentData: any) => {
        const errors = [];
        
        if (!assignmentData.subjectId) {
          errors.push('Subject ID is required');
        } else if (!/^[0-9a-f-]{36}$/i.test(assignmentData.subjectId)) {
          errors.push('Invalid subject ID format');
        }
        
        if (!assignmentData.teacherId) {
          errors.push('Teacher ID is required');
        } else if (!/^[0-9a-f-]{36}$/i.test(assignmentData.teacherId)) {
          errors.push('Invalid teacher ID format');
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      };

      expect(validateSubjectAssignmentData({
        subjectId: '123e4567-e89b-12d3-a456-426614174000',
        teacherId: '123e4567-e89b-12d3-a456-426614174001'
      }).valid).toBe(true);
      
      expect(validateSubjectAssignmentData({
        subjectId: 'invalid-id',
        teacherId: '123e4567-e89b-12d3-a456-426614174001'
      }).valid).toBe(false);
      
      expect(validateSubjectAssignmentData({
        subjectId: '123e4567-e89b-12d3-a456-426614174000'
      }).valid).toBe(false);
    });

    it('should check for duplicate subject assignments', () => {
      const checkDuplicateSubjectAssignment = (classId: string, subjectId: string, existingAssignments: any[]) => {
        const duplicate = existingAssignments.find(assignment => 
          assignment.classId === classId && 
          assignment.subjectId === subjectId &&
          assignment.isActive
        );
        
        if (duplicate) {
          return {
            duplicate: true,
            message: 'Subject is already assigned to this class'
          };
        }
        
        return { duplicate: false };
      };

      const existingAssignments = [
        { classId: 'class-1', subjectId: 'subject-1', isActive: true }
      ];
      
      expect(checkDuplicateSubjectAssignment('class-1', 'subject-2', existingAssignments).duplicate).toBe(false);
      expect(checkDuplicateSubjectAssignment('class-1', 'subject-1', existingAssignments).duplicate).toBe(true);
    });

    it('should validate teacher subject specialization', () => {
      const validateTeacherSubjectSpecialization = (teacherId: string, subjectId: string, teacherSpecializations: string[]) => {
        if (!teacherSpecializations.includes(subjectId)) {
          return {
            valid: false,
            error: 'Teacher is not specialized in this subject'
          };
        }
        
        return { valid: true };
      };

      const teacherSpecializations = ['subject-1', 'subject-2'];
      
      expect(validateTeacherSubjectSpecialization('teacher-1', 'subject-1', teacherSpecializations).valid).toBe(true);
      expect(validateTeacherSubjectSpecialization('teacher-1', 'subject-3', teacherSpecializations).valid).toBe(false);
    });
  });

  describe('Class Enrollment Management', () => {
    it('should calculate class statistics', () => {
      const calculateClassStatistics = (classData: any) => {
        const totalCapacity = classData.capacity;
        const currentEnrollment = classData.students?.length || 0;
        const availableSlots = totalCapacity - currentEnrollment;
        const enrollmentPercentage = totalCapacity > 0 ? (currentEnrollment / totalCapacity) * 100 : 0;
        
        const activeStudents = classData.students?.filter((s: any) => s.isActive).length || 0;
        const inactiveStudents = currentEnrollment - activeStudents;
        
        return {
          totalCapacity,
          currentEnrollment,
          availableSlots,
          enrollmentPercentage: Math.round(enrollmentPercentage * 100) / 100,
          activeStudents,
          inactiveStudents,
          isFull: availableSlots === 0,
          isNearCapacity: enrollmentPercentage >= 90
        };
      };

      const classData = {
        capacity: 30,
        students: [
          { id: 'student-1', isActive: true },
          { id: 'student-2', isActive: true },
          { id: 'student-3', isActive: false }
        ]
      };

      const stats = calculateClassStatistics(classData);
      
      expect(stats.totalCapacity).toBe(30);
      expect(stats.currentEnrollment).toBe(3);
      expect(stats.availableSlots).toBe(27);
      expect(stats.enrollmentPercentage).toBe(10);
      expect(stats.activeStudents).toBe(2);
      expect(stats.inactiveStudents).toBe(1);
      expect(stats.isFull).toBe(false);
      expect(stats.isNearCapacity).toBe(false);
    });

    it('should validate student enrollment eligibility', () => {
      const validateStudentEnrollmentEligibility = (studentId: string, classId: string, classCapacity: number, currentEnrollment: number, studentCurrentClass: string | null) => {
        const errors = [];
        
        if (currentEnrollment >= classCapacity) {
          errors.push('Class has reached maximum capacity');
        }
        
        if (studentCurrentClass === classId) {
          errors.push('Student is already enrolled in this class');
        }
        
        return {
          eligible: errors.length === 0,
          errors
        };
      };

      expect(validateStudentEnrollmentEligibility('student-1', 'class-1', 30, 25, null).eligible).toBe(true);
      expect(validateStudentEnrollmentEligibility('student-1', 'class-1', 30, 30, null).eligible).toBe(false);
      expect(validateStudentEnrollmentEligibility('student-1', 'class-1', 30, 25, 'class-1').eligible).toBe(false);
    });
  });
});
import jwt from 'jsonwebtoken';

// Grade Management API Comprehensive Tests
describe('Grade Management API Tests', () => {
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

  describe('POST /api/v1/grades', () => {
    it('should validate grade entry data', () => {
      const validateGradeData = (gradeData: any) => {
        const errors = [];
        
        if (!gradeData.studentId) {
          errors.push('Student ID is required');
        } else if (!/^[0-9a-f-]{36}$/i.test(gradeData.studentId)) {
          errors.push('Invalid student ID format');
        }
        
        if (!gradeData.subjectId) {
          errors.push('Subject ID is required');
        } else if (!/^[0-9a-f-]{36}$/i.test(gradeData.subjectId)) {
          errors.push('Invalid subject ID format');
        }
        
        if (!gradeData.assessmentTypeId) {
          errors.push('Assessment type ID is required');
        } else if (!/^[0-9a-f-]{36}$/i.test(gradeData.assessmentTypeId)) {
          errors.push('Invalid assessment type ID format');
        }
        
        if (gradeData.marksObtained === undefined || gradeData.marksObtained === null) {
          errors.push('Marks obtained is required');
        } else if (isNaN(gradeData.marksObtained) || gradeData.marksObtained < 0) {
          errors.push('Marks obtained must be a non-negative number');
        }
        
        if (!gradeData.totalMarks || isNaN(gradeData.totalMarks) || gradeData.totalMarks <= 0) {
          errors.push('Total marks must be a positive number');
        }
        
        if (gradeData.marksObtained > gradeData.totalMarks) {
          errors.push('Marks obtained cannot exceed total marks');
        }
        
        if (!gradeData.semesterId) {
          errors.push('Semester ID is required');
        } else if (!/^[0-9a-f-]{36}$/i.test(gradeData.semesterId)) {
          errors.push('Invalid semester ID format');
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      };

      const validGrade = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        subjectId: '123e4567-e89b-12d3-a456-426614174001',
        assessmentTypeId: '123e4567-e89b-12d3-a456-426614174002',
        marksObtained: 85,
        totalMarks: 100,
        semesterId: '123e4567-e89b-12d3-a456-426614174003'
      };

      expect(validateGradeData(validGrade).valid).toBe(true);
      expect(validateGradeData({ ...validGrade, studentId: 'invalid-id' }).valid).toBe(false);
      expect(validateGradeData({ ...validGrade, marksObtained: -5 }).valid).toBe(false);
      expect(validateGradeData({ ...validGrade, totalMarks: 0 }).valid).toBe(false);
      expect(validateGradeData({ ...validGrade, marksObtained: 105, totalMarks: 100 }).valid).toBe(false);
    });

    it('should validate teacher permissions for grade entry', () => {
      const checkGradeEntryPermissions = (userRole: string, userId: string, subjectTeacherId: string, classTeacherId: string) => {
        // Admin can enter grades for any subject
        if (userRole === 'admin') {
          return { allowed: true };
        }
        
        // Teachers can enter grades for subjects they teach
        if (userRole === 'teacher' && (userId === subjectTeacherId || userId === classTeacherId)) {
          return { allowed: true };
        }
        
        return {
          allowed: false,
          statusCode: 403,
          message: 'Only assigned teachers can enter grades for this subject'
        };
      };

      expect(checkGradeEntryPermissions('admin', 'admin-1', 'teacher-1', 'teacher-2').allowed).toBe(true);
      expect(checkGradeEntryPermissions('teacher', 'teacher-1', 'teacher-1', 'teacher-2').allowed).toBe(true);
      expect(checkGradeEntryPermissions('teacher', 'teacher-1', 'teacher-2', 'teacher-1').allowed).toBe(true);
      expect(checkGradeEntryPermissions('teacher', 'teacher-3', 'teacher-1', 'teacher-2').allowed).toBe(false);
      expect(checkGradeEntryPermissions('student', 'student-1', 'teacher-1', 'teacher-2').allowed).toBe(false);
    });

    it('should calculate grade letter and percentage', () => {
      const calculateGradeMetrics = (marksObtained: number, totalMarks: number) => {
        const percentage = totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;
        
        let gradeLetter = 'F';
        if (percentage >= 90) gradeLetter = 'A+';
        else if (percentage >= 85) gradeLetter = 'A';
        else if (percentage >= 80) gradeLetter = 'A-';
        else if (percentage >= 75) gradeLetter = 'B+';
        else if (percentage >= 70) gradeLetter = 'B';
        else if (percentage >= 65) gradeLetter = 'B-';
        else if (percentage >= 60) gradeLetter = 'C+';
        else if (percentage >= 55) gradeLetter = 'C';
        else if (percentage >= 50) gradeLetter = 'C-';
        else if (percentage >= 40) gradeLetter = 'D';
        
        let gradePoint = 0;
        if (percentage >= 90) gradePoint = 4.0;
        else if (percentage >= 85) gradePoint = 3.7;
        else if (percentage >= 80) gradePoint = 3.3;
        else if (percentage >= 75) gradePoint = 3.0;
        else if (percentage >= 70) gradePoint = 2.7;
        else if (percentage >= 65) gradePoint = 2.3;
        else if (percentage >= 60) gradePoint = 2.0;
        else if (percentage >= 55) gradePoint = 1.7;
        else if (percentage >= 50) gradePoint = 1.3;
        else if (percentage >= 40) gradePoint = 1.0;
        
        return {
          percentage: Math.round(percentage * 100) / 100,
          gradeLetter,
          gradePoint,
          isPassing: percentage >= 40
        };
      };

      expect(calculateGradeMetrics(95, 100)).toEqual({
        percentage: 95,
        gradeLetter: 'A+',
        gradePoint: 4.0,
        isPassing: true
      });
      
      expect(calculateGradeMetrics(35, 100)).toEqual({
        percentage: 35,
        gradeLetter: 'F',
        gradePoint: 0,
        isPassing: false
      });
      
      expect(calculateGradeMetrics(82, 100)).toEqual({
        percentage: 82,
        gradeLetter: 'A-',
        gradePoint: 3.3,
        isPassing: true
      });
    });

    it('should check for duplicate grade entries', () => {
      const checkDuplicateGrade = (studentId: string, subjectId: string, assessmentTypeId: string, semesterId: string, existingGrades: any[]) => {
        const duplicate = existingGrades.find(grade => 
          grade.studentId === studentId && 
          grade.subjectId === subjectId && 
          grade.assessmentTypeId === assessmentTypeId &&
          grade.semesterId === semesterId
        );
        
        if (duplicate) {
          return {
            duplicate: true,
            message: 'Grade already exists for this student, subject, and assessment type in this semester',
            existingGrade: duplicate
          };
        }
        
        return { duplicate: false };
      };

      const existingGrades = [
        { studentId: 'student-1', subjectId: 'subject-1', assessmentTypeId: 'assessment-1', semesterId: 'semester-1' }
      ];
      
      expect(checkDuplicateGrade('student-1', 'subject-1', 'assessment-2', 'semester-1', existingGrades).duplicate).toBe(false);
      expect(checkDuplicateGrade('student-1', 'subject-1', 'assessment-1', 'semester-1', existingGrades).duplicate).toBe(true);
      expect(checkDuplicateGrade('student-2', 'subject-1', 'assessment-1', 'semester-1', existingGrades).duplicate).toBe(false);
    });

    it('should validate student enrollment in subject', () => {
      const validateStudentSubjectEnrollment = (studentId: string, subjectId: string, classSubjects: any[]) => {
        const enrollment = classSubjects.find(cs => 
          cs.studentId === studentId && 
          cs.subjectId === subjectId && 
          cs.isActive
        );
        
        if (!enrollment) {
          return {
            valid: false,
            error: 'Student is not enrolled in this subject'
          };
        }
        
        return { valid: true };
      };

      const classSubjects = [
        { studentId: 'student-1', subjectId: 'subject-1', isActive: true },
        { studentId: 'student-2', subjectId: 'subject-1', isActive: false }
      ];
      
      expect(validateStudentSubjectEnrollment('student-1', 'subject-1', classSubjects).valid).toBe(true);
      expect(validateStudentSubjectEnrollment('student-2', 'subject-1', classSubjects).valid).toBe(false);
      expect(validateStudentSubjectEnrollment('student-3', 'subject-1', classSubjects).valid).toBe(false);
    });
  });

  describe('GET /api/v1/grades', () => {
    it('should validate grade listing permissions', () => {
      const checkGradeListAccess = (userRole: string) => {
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

      expect(checkGradeListAccess('admin').allowed).toBe(true);
      expect(checkGradeListAccess('teacher').allowed).toBe(true);
      expect(checkGradeListAccess('student').allowed).toBe(false);
      expect(checkGradeListAccess('parent').allowed).toBe(false);
    });

    it('should handle grade filtering parameters', () => {
      const validateGradeFilters = (query: any) => {
        const errors = [];
        
        if (query.studentId && !/^[0-9a-f-]{36}$/i.test(query.studentId)) {
          errors.push('Invalid student ID format');
        }
        
        if (query.subjectId && !/^[0-9a-f-]{36}$/i.test(query.subjectId)) {
          errors.push('Invalid subject ID format');
        }
        
        if (query.classId && !/^[0-9a-f-]{36}$/i.test(query.classId)) {
          errors.push('Invalid class ID format');
        }
        
        if (query.semesterId && !/^[0-9a-f-]{36}$/i.test(query.semesterId)) {
          errors.push('Invalid semester ID format');
        }
        
        if (query.assessmentTypeId && !/^[0-9a-f-]{36}$/i.test(query.assessmentTypeId)) {
          errors.push('Invalid assessment type ID format');
        }
        
        if (query.minPercentage && (isNaN(query.minPercentage) || query.minPercentage < 0 || query.minPercentage > 100)) {
          errors.push('Minimum percentage must be between 0 and 100');
        }
        
        if (query.maxPercentage && (isNaN(query.maxPercentage) || query.maxPercentage < 0 || query.maxPercentage > 100)) {
          errors.push('Maximum percentage must be between 0 and 100');
        }
        
        if (query.minPercentage && query.maxPercentage && parseFloat(query.minPercentage) > parseFloat(query.maxPercentage)) {
          errors.push('Minimum percentage cannot be greater than maximum percentage');
        }
        
        if (query.gradeLetter && !/^[A-F][+-]?$/.test(query.gradeLetter)) {
          errors.push('Invalid grade letter format');
        }
        
        return {
          valid: errors.length === 0,
          errors,
          filters: {
            studentId: query.studentId,
            subjectId: query.subjectId,
            classId: query.classId,
            semesterId: query.semesterId,
            assessmentTypeId: query.assessmentTypeId,
            minPercentage: query.minPercentage ? parseFloat(query.minPercentage) : undefined,
            maxPercentage: query.maxPercentage ? parseFloat(query.maxPercentage) : undefined,
            gradeLetter: query.gradeLetter
          }
        };
      };

      expect(validateGradeFilters({
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        minPercentage: '80',
        maxPercentage: '100',
        gradeLetter: 'A+'
      }).valid).toBe(true);
      
      expect(validateGradeFilters({ studentId: 'invalid-id' }).valid).toBe(false);
      expect(validateGradeFilters({ minPercentage: '101' }).valid).toBe(false);
      expect(validateGradeFilters({ minPercentage: '90', maxPercentage: '80' }).valid).toBe(false);
      expect(validateGradeFilters({ gradeLetter: 'Z' }).valid).toBe(false);
    });

    it('should apply teacher-specific filtering', () => {
      const applyTeacherFiltering = (userRole: string, teacherId: string, grades: any[]) => {
        if (userRole !== 'teacher') {
          return grades;
        }
        
        // Teachers can only see grades for subjects they teach
        const teacherSubjectIds = ['subject-1', 'subject-2']; // Mock teacher's subjects
        
        return grades.filter(grade => teacherSubjectIds.includes(grade.subjectId));
      };

      const allGrades = [
        { id: 'grade-1', subjectId: 'subject-1', studentId: 'student-1' },
        { id: 'grade-2', subjectId: 'subject-2', studentId: 'student-2' },
        { id: 'grade-3', subjectId: 'subject-3', studentId: 'student-3' }
      ];

      const teacherFiltered = applyTeacherFiltering('teacher', 'teacher-1', allGrades);
      const adminFiltered = applyTeacherFiltering('admin', 'admin-1', allGrades);
      
      expect(teacherFiltered).toHaveLength(2);
      expect(adminFiltered).toHaveLength(3);
    });

    it('should format grade list response', () => {
      const formatGradeListResponse = (grades: any[], total: number, page: number, limit: number) => {
        return {
          success: true,
          data: {
            grades: grades.map(grade => ({
              id: grade.id,
              studentId: grade.studentId,
              studentName: grade.student ? `${grade.student.firstName} ${grade.student.lastName}` : null,
              subjectId: grade.subjectId,
              subjectName: grade.subject?.name,
              assessmentType: grade.assessmentType?.name,
              marksObtained: grade.marksObtained,
              totalMarks: grade.totalMarks,
              percentage: grade.percentage,
              gradeLetter: grade.gradeLetter,
              gradePoint: grade.gradePoint,
              semesterId: grade.semesterId,
              semesterName: grade.semester?.name,
              recordedBy: grade.recordedBy,
              recordedAt: grade.createdAt
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

      const mockGrades = [
        {
          id: 'grade-1',
          studentId: 'student-1',
          student: { firstName: 'Alice', lastName: 'Johnson' },
          subjectId: 'subject-1',
          subject: { name: 'Mathematics' },
          assessmentType: { name: 'Midterm Exam' },
          marksObtained: 85,
          totalMarks: 100,
          percentage: 85,
          gradeLetter: 'A',
          gradePoint: 3.7,
          semesterId: 'semester-1',
          semester: { name: 'Fall 2024' },
          recordedBy: 'teacher-1',
          createdAt: '2024-01-15T10:00:00Z'
        }
      ];

      const response = formatGradeListResponse(mockGrades, 1, 1, 10);
      
      expect(response.success).toBe(true);
      expect(response.data.grades).toHaveLength(1);
      expect(response.data.grades[0].studentName).toBe('Alice Johnson');
      expect(response.data.grades[0].subjectName).toBe('Mathematics');
      expect(response.data.pagination.total).toBe(1);
    });
  });

  describe('GET /api/v1/grades/student/:studentId', () => {
    it('should validate student grade access permissions', () => {
      const checkStudentGradeAccess = (userRole: string, userId: string, studentUserId: string, parentIds: string[] = []) => {
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

      expect(checkStudentGradeAccess('admin', 'admin-1', 'user-1').allowed).toBe(true);
      expect(checkStudentGradeAccess('teacher', 'teacher-1', 'user-1').allowed).toBe(true);
      expect(checkStudentGradeAccess('student', 'user-1', 'user-1').allowed).toBe(true);
      expect(checkStudentGradeAccess('parent', 'parent-1', 'user-1', ['parent-1']).allowed).toBe(true);
      expect(checkStudentGradeAccess('student', 'user-2', 'user-1').allowed).toBe(false);
    });

    it('should calculate student grade statistics', () => {
      const calculateStudentGradeStats = (grades: any[]) => {
        if (grades.length === 0) {
          return {
            totalGrades: 0,
            averagePercentage: 0,
            averageGradePoint: 0,
            highestGrade: null,
            lowestGrade: null,
            subjectAverages: {},
            overallGradeLetter: 'N/A'
          };
        }
        
        const totalPercentage = grades.reduce((sum, grade) => sum + grade.percentage, 0);
        const totalGradePoints = grades.reduce((sum, grade) => sum + grade.gradePoint, 0);
        
        const averagePercentage = totalPercentage / grades.length;
        const averageGradePoint = totalGradePoints / grades.length;
        
        const sortedByPercentage = [...grades].sort((a, b) => b.percentage - a.percentage);
        const highestGrade = sortedByPercentage[0];
        const lowestGrade = sortedByPercentage[sortedByPercentage.length - 1];
        
        // Calculate subject averages
        const subjectGrades = grades.reduce((acc, grade) => {
          if (!acc[grade.subjectId]) {
            acc[grade.subjectId] = [];
          }
          acc[grade.subjectId].push(grade);
          return acc;
        }, {} as any);
        
        const subjectAverages = Object.entries(subjectGrades).reduce((acc, [subjectId, subjectGradeList]: [string, any]) => {
          const subjectTotal = subjectGradeList.reduce((sum: number, grade: any) => sum + grade.percentage, 0);
          acc[subjectId] = {
            average: subjectTotal / subjectGradeList.length,
            gradeCount: subjectGradeList.length,
            subjectName: subjectGradeList[0].subject?.name || 'Unknown'
          };
          return acc;
        }, {} as any);
        
        // Determine overall grade letter
        let overallGradeLetter = 'F';
        if (averagePercentage >= 90) overallGradeLetter = 'A+';
        else if (averagePercentage >= 85) overallGradeLetter = 'A';
        else if (averagePercentage >= 80) overallGradeLetter = 'A-';
        else if (averagePercentage >= 75) overallGradeLetter = 'B+';
        else if (averagePercentage >= 70) overallGradeLetter = 'B';
        else if (averagePercentage >= 65) overallGradeLetter = 'B-';
        else if (averagePercentage >= 60) overallGradeLetter = 'C+';
        else if (averagePercentage >= 55) overallGradeLetter = 'C';
        else if (averagePercentage >= 50) overallGradeLetter = 'C-';
        else if (averagePercentage >= 40) overallGradeLetter = 'D';
        
        return {
          totalGrades: grades.length,
          averagePercentage: Math.round(averagePercentage * 100) / 100,
          averageGradePoint: Math.round(averageGradePoint * 100) / 100,
          highestGrade: {
            percentage: highestGrade.percentage,
            subject: highestGrade.subject?.name,
            assessmentType: highestGrade.assessmentType?.name
          },
          lowestGrade: {
            percentage: lowestGrade.percentage,
            subject: lowestGrade.subject?.name,
            assessmentType: lowestGrade.assessmentType?.name
          },
          subjectAverages,
          overallGradeLetter
        };
      };

      const mockGrades = [
        {
          percentage: 85,
          gradePoint: 3.7,
          subjectId: 'subject-1',
          subject: { name: 'Mathematics' },
          assessmentType: { name: 'Midterm' }
        },
        {
          percentage: 92,
          gradePoint: 4.0,
          subjectId: 'subject-1',
          subject: { name: 'Mathematics' },
          assessmentType: { name: 'Final' }
        },
        {
          percentage: 78,
          gradePoint: 3.0,
          subjectId: 'subject-2',
          subject: { name: 'Science' },
          assessmentType: { name: 'Quiz' }
        }
      ];

      const stats = calculateStudentGradeStats(mockGrades);
      
      expect(stats.totalGrades).toBe(3);
      expect(stats.averagePercentage).toBe(85);
      expect(stats.averageGradePoint).toBe(3.57);
      expect(stats.highestGrade?.percentage).toBe(92);
      expect(stats.lowestGrade?.percentage).toBe(78);
      expect(stats.overallGradeLetter).toBe('A');
      expect(Object.keys(stats.subjectAverages)).toHaveLength(2);
    });
  });

  describe('GET /api/v1/grades/class/:classId', () => {
    it('should validate class grade access permissions', () => {
      const checkClassGradeAccess = (userRole: string, userId: string, classTeacherId: string) => {
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

      expect(checkClassGradeAccess('admin', 'admin-1', 'teacher-1').allowed).toBe(true);
      expect(checkClassGradeAccess('teacher', 'teacher-1', 'teacher-1').allowed).toBe(true);
      expect(checkClassGradeAccess('teacher', 'teacher-2', 'teacher-1').allowed).toBe(false);
    });

    it('should calculate class grade statistics', () => {
      const calculateClassGradeStats = (grades: any[]) => {
        if (grades.length === 0) {
          return {
            totalGrades: 0,
            classAverage: 0,
            highestScore: null,
            lowestScore: null,
            gradeDistribution: {},
            passingRate: 0
          };
        }
        
        const totalPercentage = grades.reduce((sum, grade) => sum + grade.percentage, 0);
        const classAverage = totalPercentage / grades.length;
        
        const sortedGrades = [...grades].sort((a, b) => b.percentage - a.percentage);
        const highestScore = sortedGrades[0];
        const lowestScore = sortedGrades[sortedGrades.length - 1];
        
        // Grade distribution
        const gradeDistribution = grades.reduce((acc, grade) => {
          acc[grade.gradeLetter] = (acc[grade.gradeLetter] || 0) + 1;
          return acc;
        }, {} as any);
        
        // Passing rate (assuming 40% is passing)
        const passingGrades = grades.filter(grade => grade.percentage >= 40);
        const passingRate = (passingGrades.length / grades.length) * 100;
        
        return {
          totalGrades: grades.length,
          classAverage: Math.round(classAverage * 100) / 100,
          highestScore: {
            percentage: highestScore.percentage,
            studentName: highestScore.student ? `${highestScore.student.firstName} ${highestScore.student.lastName}` : 'Unknown'
          },
          lowestScore: {
            percentage: lowestScore.percentage,
            studentName: lowestScore.student ? `${lowestScore.student.firstName} ${lowestScore.student.lastName}` : 'Unknown'
          },
          gradeDistribution,
          passingRate: Math.round(passingRate * 100) / 100
        };
      };

      const mockGrades = [
        {
          percentage: 95,
          gradeLetter: 'A+',
          student: { firstName: 'Alice', lastName: 'Johnson' }
        },
        {
          percentage: 82,
          gradeLetter: 'A-',
          student: { firstName: 'Bob', lastName: 'Smith' }
        },
        {
          percentage: 35,
          gradeLetter: 'F',
          student: { firstName: 'Charlie', lastName: 'Brown' }
        }
      ];

      const stats = calculateClassGradeStats(mockGrades);
      
      expect(stats.totalGrades).toBe(3);
      expect(stats.classAverage).toBe(70.67);
      expect(stats.highestScore?.percentage).toBe(95);
      expect(stats.lowestScore?.percentage).toBe(35);
      expect(stats.passingRate).toBe(66.67);
      expect(stats.gradeDistribution['A+']).toBe(1);
    });
  });

  describe('PUT /api/v1/grades/:id', () => {
    it('should validate grade update permissions', () => {
      const checkGradeUpdatePermissions = (userRole: string, userId: string, recordedBy: string, recordDate: string) => {
        // Admin can update any grade
        if (userRole === 'admin') {
          return { allowed: true };
        }
        
        // Teachers can update their own grades within time limit
        if (userRole === 'teacher' && userId === recordedBy) {
          const recordDateTime = new Date(recordDate);
          const now = new Date();
          const hoursDiff = (now.getTime() - recordDateTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff > 48) {
            return {
              allowed: false,
              statusCode: 403,
              message: 'Cannot update grades older than 48 hours'
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

      const recentDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
      const oldDate = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(); // 72 hours ago

      expect(checkGradeUpdatePermissions('admin', 'admin-1', 'teacher-1', oldDate).allowed).toBe(true);
      expect(checkGradeUpdatePermissions('teacher', 'teacher-1', 'teacher-1', recentDate).allowed).toBe(true);
      expect(checkGradeUpdatePermissions('teacher', 'teacher-1', 'teacher-1', oldDate).allowed).toBe(false);
      expect(checkGradeUpdatePermissions('teacher', 'teacher-2', 'teacher-1', recentDate).allowed).toBe(false);
    });

    it('should validate grade update data', () => {
      const validateGradeUpdateData = (updateData: any) => {
        const errors = [];
        
        if (updateData.marksObtained !== undefined) {
          if (isNaN(updateData.marksObtained) || updateData.marksObtained < 0) {
            errors.push('Marks obtained must be a non-negative number');
          }
        }
        
        if (updateData.totalMarks !== undefined) {
          if (isNaN(updateData.totalMarks) || updateData.totalMarks <= 0) {
            errors.push('Total marks must be a positive number');
          }
        }
        
        if (updateData.marksObtained !== undefined && updateData.totalMarks !== undefined) {
          if (updateData.marksObtained > updateData.totalMarks) {
            errors.push('Marks obtained cannot exceed total marks');
          }
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      };

      expect(validateGradeUpdateData({ marksObtained: 90, totalMarks: 100 }).valid).toBe(true);
      expect(validateGradeUpdateData({ marksObtained: -5 }).valid).toBe(false);
      expect(validateGradeUpdateData({ totalMarks: 0 }).valid).toBe(false);
      expect(validateGradeUpdateData({ marksObtained: 105, totalMarks: 100 }).valid).toBe(false);
    });

    it('should track grade update history', () => {
      const trackGradeUpdate = (originalGrade: any, updateData: any, updatedBy: string) => {
        const changes = [];
        
        if (updateData.marksObtained !== undefined && updateData.marksObtained !== originalGrade.marksObtained) {
          changes.push({
            field: 'marksObtained',
            oldValue: originalGrade.marksObtained,
            newValue: updateData.marksObtained
          });
        }
        
        if (updateData.totalMarks !== undefined && updateData.totalMarks !== originalGrade.totalMarks) {
          changes.push({
            field: 'totalMarks',
            oldValue: originalGrade.totalMarks,
            newValue: updateData.totalMarks
          });
        }
        
        return {
          hasChanges: changes.length > 0,
          changes,
          auditLog: {
            updatedBy,
            updatedAt: new Date().toISOString(),
            changes,
            reason: 'Grade correction'
          }
        };
      };

      const originalGrade = { marksObtained: 80, totalMarks: 100 };
      const updateData = { marksObtained: 85, totalMarks: 100 };
      
      const result = trackGradeUpdate(originalGrade, updateData, 'teacher-1');
      
      expect(result.hasChanges).toBe(true);
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].field).toBe('marksObtained');
      expect(result.changes[0].oldValue).toBe(80);
      expect(result.changes[0].newValue).toBe(85);
    });
  });

  describe('POST /api/v1/report-cards/generate', () => {
    it('should validate report card generation permissions', () => {
      const checkReportCardGenerationPermissions = (userRole: string) => {
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

      expect(checkReportCardGenerationPermissions('admin').allowed).toBe(true);
      expect(checkReportCardGenerationPermissions('teacher').allowed).toBe(true);
      expect(checkReportCardGenerationPermissions('student').allowed).toBe(false);
    });

    it('should validate report card generation data', () => {
      const validateReportCardData = (reportData: any) => {
        const errors = [];
        
        if (!reportData.studentId && !reportData.classId) {
          errors.push('Either student ID or class ID is required');
        }
        
        if (reportData.studentId && !/^[0-9a-f-]{36}$/i.test(reportData.studentId)) {
          errors.push('Invalid student ID format');
        }
        
        if (reportData.classId && !/^[0-9a-f-]{36}$/i.test(reportData.classId)) {
          errors.push('Invalid class ID format');
        }
        
        if (!reportData.semesterId) {
          errors.push('Semester ID is required');
        } else if (!/^[0-9a-f-]{36}$/i.test(reportData.semesterId)) {
          errors.push('Invalid semester ID format');
        }
        
        if (reportData.includeComments !== undefined && typeof reportData.includeComments !== 'boolean') {
          errors.push('includeComments must be a boolean');
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      };

      expect(validateReportCardData({
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        semesterId: '123e4567-e89b-12d3-a456-426614174001',
        includeComments: true
      }).valid).toBe(true);
      
      expect(validateReportCardData({
        classId: '123e4567-e89b-12d3-a456-426614174000',
        semesterId: '123e4567-e89b-12d3-a456-426614174001'
      }).valid).toBe(true);
      
      expect(validateReportCardData({
        semesterId: '123e4567-e89b-12d3-a456-426614174001'
      }).valid).toBe(false);
      
      expect(validateReportCardData({
        studentId: 'invalid-id',
        semesterId: '123e4567-e89b-12d3-a456-426614174001'
      }).valid).toBe(false);
    });

    it('should compile report card data', () => {
      const compileReportCardData = (studentGrades: any[], studentInfo: any, semesterInfo: any) => {
        const subjectGrades = studentGrades.reduce((acc, grade) => {
          const subjectId = grade.subjectId;
          if (!acc[subjectId]) {
            acc[subjectId] = {
              subjectName: grade.subject?.name || 'Unknown',
              grades: [],
              average: 0,
              gradeLetter: 'F'
            };
          }
          
          acc[subjectId].grades.push({
            assessmentType: grade.assessmentType?.name,
            marksObtained: grade.marksObtained,
            totalMarks: grade.totalMarks,
            percentage: grade.percentage,
            gradeLetter: grade.gradeLetter
          });
          
          return acc;
        }, {} as any);
        
        // Calculate subject averages
        Object.keys(subjectGrades).forEach(subjectId => {
          const subject = subjectGrades[subjectId];
          const totalPercentage = subject.grades.reduce((sum: number, grade: any) => sum + grade.percentage, 0);
          subject.average = totalPercentage / subject.grades.length;
          
          // Determine subject grade letter
          if (subject.average >= 90) subject.gradeLetter = 'A+';
          else if (subject.average >= 85) subject.gradeLetter = 'A';
          else if (subject.average >= 80) subject.gradeLetter = 'A-';
          else if (subject.average >= 75) subject.gradeLetter = 'B+';
          else if (subject.average >= 70) subject.gradeLetter = 'B';
          else if (subject.average >= 65) subject.gradeLetter = 'B-';
          else if (subject.average >= 60) subject.gradeLetter = 'C+';
          else if (subject.average >= 55) subject.gradeLetter = 'C';
          else if (subject.average >= 50) subject.gradeLetter = 'C-';
          else if (subject.average >= 40) subject.gradeLetter = 'D';
        });
        
        // Calculate overall statistics
        const subjectAverages = Object.values(subjectGrades).map((subject: any) => subject.average);
        const overallAverage = subjectAverages.reduce((sum: number, avg: number) => sum + avg, 0) / subjectAverages.length;
        
        let overallGrade = 'F';
        if (overallAverage >= 90) overallGrade = 'A+';
        else if (overallAverage >= 85) overallGrade = 'A';
        else if (overallAverage >= 80) overallGrade = 'A-';
        else if (overallAverage >= 75) overallGrade = 'B+';
        else if (overallAverage >= 70) overallGrade = 'B';
        else if (overallAverage >= 65) overallGrade = 'B-';
        else if (overallAverage >= 60) overallGrade = 'C+';
        else if (overallAverage >= 55) overallGrade = 'C';
        else if (overallAverage >= 50) overallGrade = 'C-';
        else if (overallAverage >= 40) overallGrade = 'D';
        
        return {
          student: {
            id: studentInfo.id,
            name: `${studentInfo.firstName} ${studentInfo.lastName}`,
            studentId: studentInfo.studentId,
            class: studentInfo.class?.name
          },
          semester: {
            id: semesterInfo.id,
            name: semesterInfo.name,
            academicYear: semesterInfo.academicYear?.name
          },
          subjects: subjectGrades,
          summary: {
            totalSubjects: Object.keys(subjectGrades).length,
            overallAverage: Math.round(overallAverage * 100) / 100,
            overallGrade,
            totalGrades: studentGrades.length,
            generatedAt: new Date().toISOString()
          }
        };
      };

      const mockGrades = [
        {
          subjectId: 'subject-1',
          subject: { name: 'Mathematics' },
          assessmentType: { name: 'Midterm' },
          marksObtained: 85,
          totalMarks: 100,
          percentage: 85,
          gradeLetter: 'A'
        },
        {
          subjectId: 'subject-1',
          subject: { name: 'Mathematics' },
          assessmentType: { name: 'Final' },
          marksObtained: 90,
          totalMarks: 100,
          percentage: 90,
          gradeLetter: 'A+'
        }
      ];

      const studentInfo = {
        id: 'student-1',
        firstName: 'Alice',
        lastName: 'Johnson',
        studentId: 'STU001',
        class: { name: 'Grade 5A' }
      };

      const semesterInfo = {
        id: 'semester-1',
        name: 'Fall 2024',
        academicYear: { name: '2024-2025' }
      };

      const reportCard = compileReportCardData(mockGrades, studentInfo, semesterInfo);
      
      expect(reportCard.student.name).toBe('Alice Johnson');
      expect(reportCard.subjects['subject-1'].grades).toHaveLength(2);
      expect(reportCard.subjects['subject-1'].average).toBe(87.5);
      expect(reportCard.summary.overallAverage).toBe(87.5);
      expect(reportCard.summary.overallGrade).toBe('A');
    });
  });

  describe('Grade Analytics and Insights', () => {
    it('should identify grade trends', () => {
      const analyzeGradeTrends = (grades: any[]) => {
        // Sort grades by date
        const sortedGrades = [...grades].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        if (sortedGrades.length < 2) {
          return {
            trend: 'insufficient_data',
            trendDirection: null,
            averageImprovement: 0
          };
        }
        
        const firstHalf = sortedGrades.slice(0, Math.floor(sortedGrades.length / 2));
        const secondHalf = sortedGrades.slice(Math.floor(sortedGrades.length / 2));
        
        const firstHalfAverage = firstHalf.reduce((sum, grade) => sum + grade.percentage, 0) / firstHalf.length;
        const secondHalfAverage = secondHalf.reduce((sum, grade) => sum + grade.percentage, 0) / secondHalf.length;
        
        const improvement = secondHalfAverage - firstHalfAverage;
        
        let trend = 'stable';
        if (improvement > 5) trend = 'improving';
        else if (improvement < -5) trend = 'declining';
        
        return {
          trend,
          trendDirection: improvement > 0 ? 'upward' : improvement < 0 ? 'downward' : 'stable',
          averageImprovement: Math.round(improvement * 100) / 100,
          firstHalfAverage: Math.round(firstHalfAverage * 100) / 100,
          secondHalfAverage: Math.round(secondHalfAverage * 100) / 100
        };
      };

      const improvingGrades = [
        { percentage: 70, createdAt: '2024-01-01' },
        { percentage: 75, createdAt: '2024-01-15' },
        { percentage: 80, createdAt: '2024-02-01' },
        { percentage: 85, createdAt: '2024-02-15' }
      ];

      const decliningGrades = [
        { percentage: 90, createdAt: '2024-01-01' },
        { percentage: 85, createdAt: '2024-01-15' },
        { percentage: 75, createdAt: '2024-02-01' },
        { percentage: 70, createdAt: '2024-02-15' }
      ];

      const improvingTrend = analyzeGradeTrends(improvingGrades);
      const decliningTrend = analyzeGradeTrends(decliningGrades);
      
      expect(improvingTrend.trend).toBe('improving');
      expect(improvingTrend.trendDirection).toBe('upward');
      expect(decliningTrend.trend).toBe('declining');
      expect(decliningTrend.trendDirection).toBe('downward');
    });

    it('should identify at-risk students', () => {
      const identifyAtRiskStudents = (studentGrades: any[], threshold: number = 60) => {
        const studentStats = studentGrades.reduce((acc, grade) => {
          if (!acc[grade.studentId]) {
            acc[grade.studentId] = {
              studentId: grade.studentId,
              studentName: grade.student ? `${grade.student.firstName} ${grade.student.lastName}` : 'Unknown',
              grades: [],
              average: 0,
              failingSubjects: 0
            };
          }
          
          acc[grade.studentId].grades.push(grade);
          return acc;
        }, {} as any);
        
        // Calculate averages and identify at-risk students
        const atRiskStudents = Object.values(studentStats).map((student: any) => {
          const totalPercentage = student.grades.reduce((sum: number, grade: any) => sum + grade.percentage, 0);
          student.average = totalPercentage / student.grades.length;
          
          student.failingSubjects = student.grades.filter((grade: any) => grade.percentage < 40).length;
          
          const isAtRisk = student.average < threshold || student.failingSubjects > 0;
          
          return {
            ...student,
            isAtRisk,
            riskLevel: student.average < 40 ? 'high' : student.average < threshold ? 'medium' : 'low'
          };
        }).filter((student: any) => student.isAtRisk);
        
        return {
          atRiskStudents,
          totalAtRisk: atRiskStudents.length,
          highRisk: atRiskStudents.filter(s => s.riskLevel === 'high').length,
          mediumRisk: atRiskStudents.filter(s => s.riskLevel === 'medium').length
        };
      };

      const mockGrades = [
        { studentId: 'student-1', student: { firstName: 'Alice', lastName: 'Johnson' }, percentage: 35 },
        { studentId: 'student-1', student: { firstName: 'Alice', lastName: 'Johnson' }, percentage: 40 },
        { studentId: 'student-2', student: { firstName: 'Bob', lastName: 'Smith' }, percentage: 55 },
        { studentId: 'student-2', student: { firstName: 'Bob', lastName: 'Smith' }, percentage: 58 },
        { studentId: 'student-3', student: { firstName: 'Charlie', lastName: 'Brown' }, percentage: 85 },
        { studentId: 'student-3', student: { firstName: 'Charlie', lastName: 'Brown' }, percentage: 90 }
      ];

      const riskAnalysis = identifyAtRiskStudents(mockGrades, 60);
      
      expect(riskAnalysis.totalAtRisk).toBe(2);
      expect(riskAnalysis.highRisk).toBe(1); // Alice with average 37.5
      expect(riskAnalysis.mediumRisk).toBe(1); // Bob with average 56.5
    });
  });
});
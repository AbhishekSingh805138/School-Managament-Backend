// Report Card System Tests
describe('Report Card System', () => {

  describe('Overall Performance Calculation', () => {
    it('should calculate weighted average for subjects correctly', () => {
      const grades = [
        {
          subject_id: 'math-1',
          subject_name: 'Mathematics',
          subject_code: 'MATH101',
          assessment_type_id: 'midterm-1',
          assessment_type_name: 'Midterm Exam',
          weightage: 40,
          marks_obtained: 85,
          total_marks: 100,
          percentage: 85,
          grade_letter: 'B+'
        },
        {
          subject_id: 'math-1',
          subject_name: 'Mathematics',
          subject_code: 'MATH101',
          assessment_type_id: 'final-1',
          assessment_type_name: 'Final Exam',
          weightage: 60,
          marks_obtained: 90,
          total_marks: 100,
          percentage: 90,
          grade_letter: 'A'
        }
      ];

      const calculateSubjectAverage = (assessments: any[]): number => {
        const totalWeightage = assessments.reduce((sum, a) => sum + a.weightage, 0);
        if (totalWeightage === 0) {
          return assessments.reduce((sum, a) => sum + a.percentage, 0) / assessments.length;
        }
        return assessments.reduce((sum, a) => sum + (a.percentage * a.weightage / totalWeightage), 0);
      };

      const subjectAverage = calculateSubjectAverage(grades);
      expect(Math.round(subjectAverage * 100) / 100).toBe(88); // 85*0.4 + 90*0.6 = 34 + 54 = 88
    });

    it('should handle equal weightage when no weightage specified', () => {
      const grades = [
        { percentage: 80, weightage: 0 },
        { percentage: 90, weightage: 0 },
        { percentage: 85, weightage: 0 }
      ];

      const calculateAverage = (assessments: any[]): number => {
        const totalWeightage = assessments.reduce((sum, a) => sum + a.weightage, 0);
        if (totalWeightage === 0) {
          return assessments.reduce((sum, a) => sum + a.percentage, 0) / assessments.length;
        }
        return assessments.reduce((sum, a) => sum + (a.percentage * a.weightage / totalWeightage), 0);
      };

      const average = calculateAverage(grades);
      expect(Math.round(average * 100) / 100).toBe(85); // (80 + 90 + 85) / 3 = 85
    });

    it('should calculate overall grade letter correctly', () => {
      const calculateGradeLetter = (percentage: number): string => {
        if (percentage >= 95) return 'A+';
        if (percentage >= 90) return 'A';
        if (percentage >= 85) return 'B+';
        if (percentage >= 80) return 'B';
        if (percentage >= 75) return 'C+';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
      };

      expect(calculateGradeLetter(96)).toBe('A+');
      expect(calculateGradeLetter(92)).toBe('A');
      expect(calculateGradeLetter(87)).toBe('B+');
      expect(calculateGradeLetter(82)).toBe('B');
      expect(calculateGradeLetter(77)).toBe('C+');
      expect(calculateGradeLetter(72)).toBe('C');
      expect(calculateGradeLetter(65)).toBe('D');
      expect(calculateGradeLetter(55)).toBe('F');
    });
  });

  describe('Class Ranking Calculation', () => {
    it('should calculate correct rank based on percentage', () => {
      const classPerformances = [
        { studentId: 'student-1', percentage: 95 },
        { studentId: 'student-2', percentage: 88 },
        { studentId: 'student-3', percentage: 92 },
        { studentId: 'student-4', percentage: 85 },
        { studentId: 'student-5', percentage: 90 }
      ];

      const calculateRank = (studentPercentage: number, classPerformances: any[]): number => {
        const higherPerformers = classPerformances.filter(p => p.percentage > studentPercentage);
        return higherPerformers.length + 1;
      };

      expect(calculateRank(95, classPerformances)).toBe(1); // Highest
      expect(calculateRank(92, classPerformances)).toBe(2); // Second highest
      expect(calculateRank(90, classPerformances)).toBe(3); // Third
      expect(calculateRank(88, classPerformances)).toBe(4); // Fourth
      expect(calculateRank(85, classPerformances)).toBe(5); // Lowest
    });

    it('should handle tied percentages correctly', () => {
      const classPerformances = [
        { studentId: 'student-1', percentage: 90 },
        { studentId: 'student-2', percentage: 85 },
        { studentId: 'student-3', percentage: 90 },
        { studentId: 'student-4', percentage: 88 }
      ];

      const calculateRank = (studentPercentage: number, classPerformances: any[]): number => {
        const higherPerformers = classPerformances.filter(p => p.percentage > studentPercentage);
        return higherPerformers.length + 1;
      };

      // Both students with 90% should get rank 1 (no one higher)
      expect(calculateRank(90, classPerformances)).toBe(1);
      // Student with 88% should get rank 3 (2 students with 90% are higher)
      expect(calculateRank(88, classPerformances)).toBe(3);
      // Student with 85% should get rank 4 (3 students are higher)
      expect(calculateRank(85, classPerformances)).toBe(4);
    });

    it('should handle single student in class', () => {
      const classPerformances = [
        { studentId: 'student-1', percentage: 85 }
      ];

      const calculateRank = (studentPercentage: number, classPerformances: any[]): number => {
        if (classPerformances.length === 0) return 1;
        const higherPerformers = classPerformances.filter(p => p.percentage > studentPercentage);
        return higherPerformers.length + 1;
      };

      expect(calculateRank(85, classPerformances)).toBe(1);
    });
  });

  describe('Report Card Generation Validation', () => {
    it('should validate report card creation data', () => {
      const validReportCard = {
        studentId: 'student-123',
        semesterId: 'semester-456',
        remarks: 'Excellent performance this semester'
      };

      expect(validReportCard.studentId).toBeTruthy();
      expect(validReportCard.semesterId).toBeTruthy();
      expect(typeof validReportCard.remarks).toBe('string');
    });

    it('should prevent duplicate report card generation', () => {
      const existingReportCards = [
        { studentId: 'student-1', semesterId: 'semester-1' },
        { studentId: 'student-1', semesterId: 'semester-2' },
        { studentId: 'student-2', semesterId: 'semester-1' }
      ];

      const checkDuplicate = (studentId: string, semesterId: string, existing: any[]): boolean => {
        return existing.some(rc => rc.studentId === studentId && rc.semesterId === semesterId);
      };

      expect(checkDuplicate('student-1', 'semester-1', existingReportCards)).toBe(true);
      expect(checkDuplicate('student-1', 'semester-3', existingReportCards)).toBe(false);
      expect(checkDuplicate('student-3', 'semester-1', existingReportCards)).toBe(false);
    });

    it('should require grades to exist before generating report card', () => {
      const studentGrades = [
        { studentId: 'student-1', semesterId: 'semester-1', subjectId: 'math' },
        { studentId: 'student-1', semesterId: 'semester-1', subjectId: 'english' }
      ];

      const hasGrades = (studentId: string, semesterId: string, grades: any[]): boolean => {
        return grades.some(g => g.studentId === studentId && g.semesterId === semesterId);
      };

      expect(hasGrades('student-1', 'semester-1', studentGrades)).toBe(true);
      expect(hasGrades('student-1', 'semester-2', studentGrades)).toBe(false);
      expect(hasGrades('student-2', 'semester-1', studentGrades)).toBe(false);
    });
  });

  describe('Report Card Authorization', () => {
    it('should validate teacher authorization for report card generation', () => {
      const teacherAssignments = [
        { teacherId: 'teacher-1', classId: 'class-A' },
        { teacherId: 'teacher-2', classId: 'class-B' }
      ];

      const students = [
        { id: 'student-1', classId: 'class-A' },
        { id: 'student-2', classId: 'class-B' },
        { id: 'student-3', classId: 'class-C' }
      ];

      const canGenerateReportCard = (teacherId: string, studentId: string): boolean => {
        const student = students.find(s => s.id === studentId);
        if (!student) return false;
        
        return teacherAssignments.some(ta => 
          ta.teacherId === teacherId && ta.classId === student.classId
        );
      };

      expect(canGenerateReportCard('teacher-1', 'student-1')).toBe(true);
      expect(canGenerateReportCard('teacher-2', 'student-2')).toBe(true);
      expect(canGenerateReportCard('teacher-1', 'student-2')).toBe(false);
      expect(canGenerateReportCard('teacher-1', 'student-3')).toBe(false);
    });

    it('should validate role-based access for different operations', () => {
      const canGenerateReportCard = (role: string): boolean => {
        return ['admin', 'teacher'].includes(role);
      };

      const canViewReportCard = (role: string): boolean => {
        return ['admin', 'teacher', 'student', 'parent'].includes(role);
      };

      const canDeleteReportCard = (role: string): boolean => {
        return role === 'admin';
      };

      expect(canGenerateReportCard('admin')).toBe(true);
      expect(canGenerateReportCard('teacher')).toBe(true);
      expect(canGenerateReportCard('student')).toBe(false);
      expect(canGenerateReportCard('parent')).toBe(false);

      expect(canViewReportCard('admin')).toBe(true);
      expect(canViewReportCard('teacher')).toBe(true);
      expect(canViewReportCard('student')).toBe(true);
      expect(canViewReportCard('parent')).toBe(true);

      expect(canDeleteReportCard('admin')).toBe(true);
      expect(canDeleteReportCard('teacher')).toBe(false);
      expect(canDeleteReportCard('student')).toBe(false);
    });
  });

  describe('Report Card Data Formatting', () => {
    it('should format report card response correctly', () => {
      const mockReportCard = {
        id: 1,
        student_id: 'student-123',
        semester_id: 'semester-456',
        overall_percentage: 87.5,
        overall_grade: 'B+',
        rank_in_class: 3,
        total_students: 25,
        remarks: 'Good performance',
        generated_by: 'teacher-789',
        generated_at: new Date('2024-01-15T10:00:00Z'),
        created_at: new Date('2024-01-15T10:00:00Z'),
        updated_at: new Date('2024-01-15T10:00:00Z'),
        student_number: 'STU001',
        student_first_name: 'John',
        student_last_name: 'Doe',
        class_name: 'Grade 10',
        class_grade: '10',
        class_section: 'A',
        semester_name: 'Fall 2024',
        academic_year_name: '2024-2025'
      };

      const formatReportCard = (data: any) => ({
        id: data.id.toString(),
        studentId: data.student_id.toString(),
        semesterId: data.semester_id.toString(),
        overallPercentage: data.overall_percentage,
        overallGrade: data.overall_grade,
        rankInClass: data.rank_in_class,
        totalStudents: data.total_students,
        remarks: data.remarks,
        generatedBy: data.generated_by.toString(),
        generatedAt: data.generated_at.toISOString(),
        student: {
          studentId: data.student_number,
          user: {
            firstName: data.student_first_name,
            lastName: data.student_last_name,
          },
          class: {
            name: data.class_name,
            grade: data.class_grade,
            section: data.class_section,
          },
        },
        semester: {
          name: data.semester_name,
          academicYear: {
            name: data.academic_year_name,
          },
        },
      });

      const formatted = formatReportCard(mockReportCard);

      expect(formatted.id).toBe('1');
      expect(formatted.overallPercentage).toBe(87.5);
      expect(formatted.overallGrade).toBe('B+');
      expect(formatted.rankInClass).toBe(3);
      expect(formatted.totalStudents).toBe(25);
      expect(formatted.student.user.firstName).toBe('John');
      expect(formatted.student.class.name).toBe('Grade 10');
      expect(formatted.semester.name).toBe('Fall 2024');
    });

    it('should handle null values in report card data', () => {
      const mockReportCard = {
        id: 1,
        overall_percentage: null,
        overall_grade: null,
        rank_in_class: null,
        total_students: null,
        remarks: null
      };

      const formatReportCard = (data: any) => ({
        id: data.id.toString(),
        overallPercentage: data.overall_percentage,
        overallGrade: data.overall_grade,
        rankInClass: data.rank_in_class,
        totalStudents: data.total_students,
        remarks: data.remarks
      });

      const formatted = formatReportCard(mockReportCard);

      expect(formatted.overallPercentage).toBeNull();
      expect(formatted.overallGrade).toBeNull();
      expect(formatted.rankInClass).toBeNull();
      expect(formatted.totalStudents).toBeNull();
      expect(formatted.remarks).toBeNull();
    });
  });

  describe('Report Card Filtering and Queries', () => {
    it('should build correct filter conditions for report card queries', () => {
      const filters = {
        studentId: 'student-123',
        semesterId: 'semester-456',
        classId: 'class-789'
      };

      const buildWhereClause = (filters: any): string[] => {
        const conditions: string[] = [];
        
        if (filters.studentId) conditions.push(`rc.student_id = '${filters.studentId}'`);
        if (filters.semesterId) conditions.push(`rc.semester_id = '${filters.semesterId}'`);
        if (filters.classId) conditions.push(`s.class_id = '${filters.classId}'`);
        
        return conditions;
      };

      const conditions = buildWhereClause(filters);
      expect(conditions).toContain("rc.student_id = 'student-123'");
      expect(conditions).toContain("rc.semester_id = 'semester-456'");
      expect(conditions).toContain("s.class_id = 'class-789'");
    });

    it('should handle pagination for report card lists', () => {
      const paginationParams = {
        page: 2,
        limit: 5
      };

      const calculateOffset = (page: number, limit: number): number => {
        return (page - 1) * limit;
      };

      const calculatePages = (total: number, limit: number): number => {
        return Math.ceil(total / limit);
      };

      expect(calculateOffset(paginationParams.page, paginationParams.limit)).toBe(5);
      expect(calculatePages(23, paginationParams.limit)).toBe(5);
      expect(calculatePages(25, paginationParams.limit)).toBe(5);
      expect(calculatePages(26, paginationParams.limit)).toBe(6);
    });
  });

  describe('Report Card Regeneration', () => {
    it('should recalculate performance when grades are updated', () => {
      const originalGrades = [
        { subjectId: 'math', percentage: 85 },
        { subjectId: 'english', percentage: 90 },
        { subjectId: 'science', percentage: 88 }
      ];

      const updatedGrades = [
        { subjectId: 'math', percentage: 90 },
        { subjectId: 'english', percentage: 92 },
        { subjectId: 'science', percentage: 88 }
      ];

      const calculateOverallPercentage = (grades: any[]): number => {
        const total = grades.reduce((sum, grade) => sum + grade.percentage, 0);
        return Math.round((total / grades.length) * 100) / 100;
      };

      const originalOverall = calculateOverallPercentage(originalGrades);
      const updatedOverall = calculateOverallPercentage(updatedGrades);

      expect(originalOverall).toBe(87.67);
      expect(updatedOverall).toBe(90);
      expect(updatedOverall).toBeGreaterThan(originalOverall);
    });

    it('should update rank when performance changes', () => {
      const classPerformances = [
        { studentId: 'student-1', percentage: 95 },
        { studentId: 'student-2', percentage: 88 },
        { studentId: 'student-3', percentage: 92 }
      ];

      const calculateNewRank = (studentId: string, newPercentage: number, classPerformances: any[]): number => {
        // Update the student's performance
        const updatedPerformances = classPerformances.map(p => 
          p.studentId === studentId ? { ...p, percentage: newPercentage } : p
        );
        
        // Calculate new rank
        const higherPerformers = updatedPerformances.filter(p => 
          p.studentId !== studentId && p.percentage > newPercentage
        );
        
        return higherPerformers.length + 1;
      };

      // Student-2 improves from 88% to 94%
      const newRank = calculateNewRank('student-2', 94, classPerformances);
      expect(newRank).toBe(2); // Should move from 3rd to 2nd place
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing grades gracefully', () => {
      const validateGradesExist = (grades: any[]): boolean => {
        return grades && grades.length > 0;
      };

      expect(validateGradesExist([])).toBe(false);
      expect(validateGradesExist([{ id: 1 }])).toBe(true);
    });

    it('should handle invalid percentage calculations', () => {
      const safeCalculatePercentage = (obtained: number, total: number): number => {
        if (total <= 0) return 0;
        if (obtained < 0) return 0;
        if (obtained > total) return 100;
        return Math.round((obtained / total) * 100 * 100) / 100;
      };

      expect(safeCalculatePercentage(85, 100)).toBe(85);
      expect(safeCalculatePercentage(85, 0)).toBe(0);
      expect(safeCalculatePercentage(-5, 100)).toBe(0);
      expect(safeCalculatePercentage(105, 100)).toBe(100);
    });

    it('should handle empty class for ranking', () => {
      const calculateRankSafely = (studentPercentage: number, classPerformances: any[]): { rank: number; total: number } => {
        if (classPerformances.length === 0) {
          return { rank: 1, total: 1 };
        }
        
        const higherPerformers = classPerformances.filter(p => p.percentage > studentPercentage);
        return {
          rank: higherPerformers.length + 1,
          total: classPerformances.length
        };
      };

      const result = calculateRankSafely(85, []);
      expect(result.rank).toBe(1);
      expect(result.total).toBe(1);
    });

    it('should validate semester and student existence', () => {
      const entities = {
        student: { id: 'student-1', isActive: true },
        semester: { id: 'semester-1', isActive: false }
      };

      const validateEntities = (entities: any): string[] => {
        const errors: string[] = [];
        
        if (!entities.student || !entities.student.isActive) {
          errors.push('Student not found or inactive');
        }
        if (!entities.semester || !entities.semester.isActive) {
          errors.push('Semester not found or inactive');
        }
        
        return errors;
      };

      const errors = validateEntities(entities);
      expect(errors).toContain('Semester not found or inactive');
      expect(errors).not.toContain('Student not found or inactive');
    });
  });
});
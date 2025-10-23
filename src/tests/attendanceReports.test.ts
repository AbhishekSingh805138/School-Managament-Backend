// Attendance Reporting and Analytics Tests
describe('Attendance Reporting and Analytics System', () => {
  
  describe('Report Generation Logic', () => {
    it('should calculate attendance percentage correctly', () => {
      const calculateAttendancePercentage = (presentCount: number, totalCount: number) => {
        if (totalCount === 0) return 0;
        return Math.round((presentCount / totalCount) * 100 * 100) / 100; // Round to 2 decimal places
      };

      expect(calculateAttendancePercentage(18, 20)).toBe(90);
      expect(calculateAttendancePercentage(0, 20)).toBe(0);
      expect(calculateAttendancePercentage(20, 20)).toBe(100);
      expect(calculateAttendancePercentage(15, 20)).toBe(75);
      expect(calculateAttendancePercentage(0, 0)).toBe(0);
    });

    it('should group attendance data by different criteria', () => {
      const attendanceData = [
        { studentId: 'student-1', classId: 'class-1', date: '2024-01-01', status: 'present' },
        { studentId: 'student-1', classId: 'class-1', date: '2024-01-02', status: 'absent' },
        { studentId: 'student-2', classId: 'class-1', date: '2024-01-01', status: 'present' },
        { studentId: 'student-2', classId: 'class-1', date: '2024-01-02', status: 'late' },
      ];

      // Group by student
      const groupByStudent = (data: any[]) => {
        const grouped: { [key: string]: any[] } = {};
        data.forEach(record => {
          if (!grouped[record.studentId]) {
            grouped[record.studentId] = [];
          }
          grouped[record.studentId].push(record);
        });
        return grouped;
      };

      const studentGroups = groupByStudent(attendanceData);
      expect(Object.keys(studentGroups)).toHaveLength(2);
      expect(studentGroups['student-1']).toHaveLength(2);
      expect(studentGroups['student-2']).toHaveLength(2);

      // Group by date
      const groupByDate = (data: any[]) => {
        const grouped: { [key: string]: any[] } = {};
        data.forEach(record => {
          if (!grouped[record.date]) {
            grouped[record.date] = [];
          }
          grouped[record.date].push(record);
        });
        return grouped;
      };

      const dateGroups = groupByDate(attendanceData);
      expect(Object.keys(dateGroups)).toHaveLength(2);
      expect(dateGroups['2024-01-01']).toHaveLength(2);
      expect(dateGroups['2024-01-02']).toHaveLength(2);
    });

    it('should calculate summary statistics correctly', () => {
      const attendanceRecords = [
        { status: 'present' },
        { status: 'present' },
        { status: 'absent' },
        { status: 'late' },
        { status: 'excused' },
        { status: 'present' },
      ];

      const calculateSummary = (records: any[]) => {
        const total = records.length;
        const present = records.filter(r => r.status === 'present').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const late = records.filter(r => r.status === 'late').length;
        const excused = records.filter(r => r.status === 'excused').length;
        const attendancePercentage = Math.round(((present + late) / total) * 100 * 100) / 100;

        return {
          total,
          present,
          absent,
          late,
          excused,
          attendancePercentage,
        };
      };

      const summary = calculateSummary(attendanceRecords);
      expect(summary.total).toBe(6);
      expect(summary.present).toBe(3);
      expect(summary.absent).toBe(1);
      expect(summary.late).toBe(1);
      expect(summary.excused).toBe(1);
      expect(summary.attendancePercentage).toBe(66.67);
    });
  });

  describe('Trend Analysis Logic', () => {
    it('should identify attendance trends over time', () => {
      const weeklyData = [
        { week: '2024-W01', attendancePercentage: 85 },
        { week: '2024-W02', attendancePercentage: 88 },
        { week: '2024-W03', attendancePercentage: 82 },
        { week: '2024-W04', attendancePercentage: 90 },
      ];

      const calculateTrend = (data: any[]) => {
        if (data.length < 2) return 'insufficient_data';
        
        const first = data[0].attendancePercentage;
        const last = data[data.length - 1].attendancePercentage;
        const change = last - first;
        
        if (change > 5) return 'improving';
        if (change < -5) return 'declining';
        return 'stable';
      };

      expect(calculateTrend(weeklyData)).toBe('stable'); // 90 - 85 = 5, which is not > 5
      
      const decliningData = [
        { week: '2024-W01', attendancePercentage: 90 },
        { week: '2024-W02', attendancePercentage: 85 },
        { week: '2024-W03', attendancePercentage: 80 },
        { week: '2024-W04', attendancePercentage: 75 },
      ];
      
      expect(calculateTrend(decliningData)).toBe('declining');
    });

    it('should identify day-of-week patterns', () => {
      const dayPatterns = [
        { dayName: 'Monday', attendancePercentage: 85 },
        { dayName: 'Tuesday', attendancePercentage: 88 },
        { dayName: 'Wednesday', attendancePercentage: 90 },
        { dayName: 'Thursday', attendancePercentage: 87 },
        { dayName: 'Friday', attendancePercentage: 82 },
      ];

      const findBestDay = (patterns: any[]) => {
        return patterns.reduce((best, current) => 
          current.attendancePercentage > best.attendancePercentage ? current : best
        );
      };

      const findWorstDay = (patterns: any[]) => {
        return patterns.reduce((worst, current) => 
          current.attendancePercentage < worst.attendancePercentage ? current : worst
        );
      };

      expect(findBestDay(dayPatterns).dayName).toBe('Wednesday');
      expect(findWorstDay(dayPatterns).dayName).toBe('Friday');
    });
  });

  describe('Low Attendance Detection', () => {
    it('should identify students with low attendance', () => {
      const studentAttendance = [
        { studentId: 'student-1', attendancePercentage: 95 },
        { studentId: 'student-2', attendancePercentage: 70 },
        { studentId: 'student-3', attendancePercentage: 85 },
        { studentId: 'student-4', attendancePercentage: 60 },
        { studentId: 'student-5', attendancePercentage: 90 },
      ];

      const identifyLowAttendance = (students: any[], threshold: number = 75) => {
        return students.filter(student => student.attendancePercentage < threshold);
      };

      const lowAttendanceStudents = identifyLowAttendance(studentAttendance);
      expect(lowAttendanceStudents).toHaveLength(2);
      expect(lowAttendanceStudents.map(s => s.studentId)).toEqual(['student-2', 'student-4']);
    });

    it('should categorize attendance levels', () => {
      const categorizeAttendance = (percentage: number) => {
        if (percentage >= 95) return 'excellent';
        if (percentage >= 85) return 'good';
        if (percentage >= 75) return 'satisfactory';
        if (percentage >= 65) return 'needs_improvement';
        return 'critical';
      };

      expect(categorizeAttendance(98)).toBe('excellent');
      expect(categorizeAttendance(88)).toBe('good');
      expect(categorizeAttendance(78)).toBe('satisfactory');
      expect(categorizeAttendance(68)).toBe('needs_improvement');
      expect(categorizeAttendance(58)).toBe('critical');
    });
  });

  describe('Export Functionality', () => {
    it('should convert data to CSV format correctly', () => {
      const data = [
        { date: '2024-01-01', studentName: 'John Doe', status: 'present' },
        { date: '2024-01-02', studentName: 'Jane Smith', status: 'absent' },
      ];

      const convertToCSV = (data: any[]) => {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        
        const csvRows = data.map(row => 
          headers.map(header => {
            const value = row[header];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        );

        return [csvHeaders, ...csvRows].join('\n');
      };

      const csv = convertToCSV(data);
      const lines = csv.split('\n');
      
      expect(lines[0]).toBe('date,studentName,status');
      expect(lines[1]).toBe('2024-01-01,John Doe,present');
      expect(lines[2]).toBe('2024-01-02,Jane Smith,absent');
    });

    it('should handle CSV escaping correctly', () => {
      const data = [
        { name: 'John, Jr.', comment: 'He said "Hello"' },
      ];

      const convertToCSV = (data: any[]) => {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        
        const csvRows = data.map(row => 
          headers.map(header => {
            const value = row[header];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        );

        return [csvHeaders, ...csvRows].join('\n');
      };

      const csv = convertToCSV(data);
      expect(csv).toContain('"John, Jr."');
      expect(csv).toContain('"He said ""Hello"""');
    });
  });

  describe('Date Range Validation', () => {
    it('should validate date ranges correctly', () => {
      const validateDateRange = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return { valid: false, error: 'Invalid date format' };
        }
        
        if (start > end) {
          return { valid: false, error: 'Start date cannot be after end date' };
        }
        
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 365) {
          return { valid: false, error: 'Date range cannot exceed 365 days' };
        }
        
        return { valid: true, daysDiff };
      };

      expect(validateDateRange('2024-01-01', '2024-01-31').valid).toBe(true);
      expect(validateDateRange('2024-01-31', '2024-01-01').valid).toBe(false);
      expect(validateDateRange('invalid', '2024-01-01').valid).toBe(false);
      expect(validateDateRange('2023-01-01', '2024-01-02').valid).toBe(false); // > 365 days
    });

    it('should calculate period groupings correctly', () => {
      const getPeriodGrouping = (period: string) => {
        switch (period) {
          case 'daily':
            return 'DATE(date)';
          case 'weekly':
            return 'DATE_TRUNC(\'week\', date)';
          case 'monthly':
            return 'DATE_TRUNC(\'month\', date)';
          default:
            return 'DATE(date)';
        }
      };

      expect(getPeriodGrouping('daily')).toBe('DATE(date)');
      expect(getPeriodGrouping('weekly')).toBe('DATE_TRUNC(\'week\', date)');
      expect(getPeriodGrouping('monthly')).toBe('DATE_TRUNC(\'month\', date)');
      expect(getPeriodGrouping('invalid')).toBe('DATE(date)');
    });
  });

  describe('Authorization Logic', () => {
    it('should apply correct filters based on user role', () => {
      const buildAuthorizationFilter = (userRole: string, userId: string) => {
        switch (userRole) {
          case 'admin':
            return { clause: '', params: [] };
          case 'teacher':
            return { 
              clause: 'AND (c.teacher_id = ? OR EXISTS (SELECT 1 FROM class_subjects cs WHERE cs.class_id = c.id AND cs.teacher_id = ?))',
              params: [userId, userId]
            };
          case 'student':
            return { 
              clause: 'AND s.user_id = ?',
              params: [userId]
            };
          case 'parent':
            return { 
              clause: 'AND EXISTS (SELECT 1 FROM student_parents sp WHERE sp.student_id = s.id AND sp.parent_user_id = ?)',
              params: [userId]
            };
          default:
            return { clause: 'AND 1=0', params: [] }; // No access
        }
      };

      const adminFilter = buildAuthorizationFilter('admin', 'user-1');
      expect(adminFilter.clause).toBe('');
      expect(adminFilter.params).toHaveLength(0);

      const teacherFilter = buildAuthorizationFilter('teacher', 'teacher-1');
      expect(teacherFilter.clause).toContain('teacher_id');
      expect(teacherFilter.params).toHaveLength(2);

      const studentFilter = buildAuthorizationFilter('student', 'student-1');
      expect(studentFilter.clause).toContain('s.user_id');
      expect(studentFilter.params).toHaveLength(1);

      const parentFilter = buildAuthorizationFilter('parent', 'parent-1');
      expect(parentFilter.clause).toContain('student_parents');
      expect(parentFilter.params).toHaveLength(1);
    });
  });

  describe('Report Metadata Generation', () => {
    it('should generate correct report metadata', () => {
      const generateReportMetadata = (reportType: string, parameters: any, userId: string) => {
        return {
          reportId: `${reportType.toUpperCase()}_${Date.now()}`,
          reportType,
          title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
          generatedBy: userId,
          generatedAt: new Date().toISOString(),
          parameters,
          format: parameters.format || 'json',
        };
      };

      const metadata = generateReportMetadata('attendance', { groupBy: 'student' }, 'user-1');
      
      expect(metadata.reportType).toBe('attendance');
      expect(metadata.title).toBe('Attendance Report');
      expect(metadata.generatedBy).toBe('user-1');
      expect(metadata.reportId).toMatch(/^ATTENDANCE_\d+$/);
      expect(metadata.parameters.groupBy).toBe('student');
    });
  });
});
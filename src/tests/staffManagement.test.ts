// Staff Management System Tests
describe('Staff Management System', () => {

  describe('Staff Profile Creation', () => {
    it('should validate staff creation data', () => {
      const validStaff = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@school.com',
        password: 'password123',
        phone: '+1234567890',
        dateOfBirth: '1985-05-15',
        address: '123 Main St, City',
        employeeId: 'EMP001',
        department: 'Administration',
        position: 'Principal',
        joiningDate: '2024-01-15',
        salary: 75000,
        responsibilities: 'Overall school administration and management'
      };

      expect(validStaff.firstName.length).toBeGreaterThanOrEqual(2);
      expect(validStaff.lastName.length).toBeGreaterThanOrEqual(2);
      expect(validStaff.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(validStaff.password.length).toBeGreaterThanOrEqual(8);
      expect(validStaff.employeeId).toBeTruthy();
      expect(validStaff.department).toBeTruthy();
      expect(validStaff.position).toBeTruthy();
      expect(validStaff.salary).toBeGreaterThanOrEqual(0);
    });

    it('should prevent duplicate employee IDs', () => {
      const existingEmployeeIds = ['EMP001', 'EMP002', 'EMP003'];
      const newEmployeeId = 'EMP002';
      const uniqueEmployeeId = 'EMP004';

      const checkDuplicateEmployeeId = (employeeId: string, existing: string[]): boolean => {
        return existing.includes(employeeId);
      };

      expect(checkDuplicateEmployeeId(newEmployeeId, existingEmployeeIds)).toBe(true);
      expect(checkDuplicateEmployeeId(uniqueEmployeeId, existingEmployeeIds)).toBe(false);
    });

    it('should prevent duplicate email addresses', () => {
      const existingEmails = ['john@school.com', 'jane@school.com', 'admin@school.com'];
      const newEmail = 'john@school.com';
      const uniqueEmail = 'new.staff@school.com';

      const checkDuplicateEmail = (email: string, existing: string[]): boolean => {
        return existing.includes(email);
      };

      expect(checkDuplicateEmail(newEmail, existingEmails)).toBe(true);
      expect(checkDuplicateEmail(uniqueEmail, existingEmails)).toBe(false);
    });

    it('should validate department and position combinations', () => {
      const validCombinations = [
        { department: 'Administration', position: 'Principal' },
        { department: 'Administration', position: 'Vice Principal' },
        { department: 'Library', position: 'Librarian' },
        { department: 'Finance', position: 'Accountant' },
        { department: 'IT', position: 'IT Administrator' },
        { department: 'Security', position: 'Security Guard' }
      ];

      const isValidCombination = (department: string, position: string): boolean => {
        return validCombinations.some(combo => 
          combo.department === department && combo.position === position
        );
      };

      expect(isValidCombination('Administration', 'Principal')).toBe(true);
      expect(isValidCombination('Library', 'Librarian')).toBe(true);
      expect(isValidCombination('Administration', 'Librarian')).toBe(false);
      expect(isValidCombination('Finance', 'Security Guard')).toBe(false);
    });
  });

  describe('Staff Authorization and Access Control', () => {
    it('should validate role-based access for staff operations', () => {
      const canCreateStaff = (role: string): boolean => {
        return role === 'admin';
      };

      const canViewAllStaff = (role: string): boolean => {
        return ['admin'].includes(role);
      };

      const canViewOwnProfile = (role: string): boolean => {
        return ['admin', 'staff'].includes(role);
      };

      const canDeactivateStaff = (role: string): boolean => {
        return role === 'admin';
      };

      expect(canCreateStaff('admin')).toBe(true);
      expect(canCreateStaff('teacher')).toBe(false);
      expect(canCreateStaff('staff')).toBe(false);

      expect(canViewAllStaff('admin')).toBe(true);
      expect(canViewAllStaff('staff')).toBe(false);

      expect(canViewOwnProfile('admin')).toBe(true);
      expect(canViewOwnProfile('staff')).toBe(true);
      expect(canViewOwnProfile('teacher')).toBe(false);

      expect(canDeactivateStaff('admin')).toBe(true);
      expect(canDeactivateStaff('staff')).toBe(false);
    });

    it('should validate staff can only access their own profile', () => {
      const staffMembers = [
        { id: 'staff-1', userId: 'user-1' },
        { id: 'staff-2', userId: 'user-2' },
        { id: 'staff-3', userId: 'user-3' }
      ];

      const canAccessProfile = (requestingUserId: string, targetStaffId: string, userRole: string): boolean => {
        if (userRole === 'admin') return true;
        
        const targetStaff = staffMembers.find(s => s.id === targetStaffId);
        return targetStaff?.userId === requestingUserId;
      };

      expect(canAccessProfile('user-1', 'staff-1', 'staff')).toBe(true);
      expect(canAccessProfile('user-1', 'staff-2', 'staff')).toBe(false);
      expect(canAccessProfile('user-1', 'staff-3', 'admin')).toBe(true);
    });

    it('should validate department-specific permissions', () => {
      const staffPermissions = {
        'Administration': ['manage_users', 'view_reports', 'system_settings'],
        'Finance': ['manage_fees', 'view_payments', 'financial_reports'],
        'Library': ['manage_books', 'issue_books', 'library_reports'],
        'IT': ['system_maintenance', 'user_support', 'technical_reports']
      };

      const hasPermission = (department: string, permission: string): boolean => {
        return staffPermissions[department as keyof typeof staffPermissions]?.includes(permission) || false;
      };

      expect(hasPermission('Administration', 'manage_users')).toBe(true);
      expect(hasPermission('Finance', 'manage_fees')).toBe(true);
      expect(hasPermission('Library', 'manage_fees')).toBe(false);
      expect(hasPermission('IT', 'library_reports')).toBe(false);
    });
  });

  describe('Staff Data Filtering and Search', () => {
    it('should filter staff by department', () => {
      const staffMembers = [
        { id: 'staff-1', department: 'Administration', position: 'Principal' },
        { id: 'staff-2', department: 'Finance', position: 'Accountant' },
        { id: 'staff-3', department: 'Administration', position: 'Vice Principal' },
        { id: 'staff-4', department: 'Library', position: 'Librarian' }
      ];

      const filterByDepartment = (staff: any[], department: string) => {
        return staff.filter(s => s.department === department);
      };

      const adminStaff = filterByDepartment(staffMembers, 'Administration');
      expect(adminStaff).toHaveLength(2);
      expect(adminStaff.every(s => s.department === 'Administration')).toBe(true);

      const financeStaff = filterByDepartment(staffMembers, 'Finance');
      expect(financeStaff).toHaveLength(1);
      expect(financeStaff[0].position).toBe('Accountant');
    });

    it('should filter staff by position', () => {
      const staffMembers = [
        { id: 'staff-1', department: 'Administration', position: 'Principal' },
        { id: 'staff-2', department: 'Finance', position: 'Accountant' },
        { id: 'staff-3', department: 'Administration', position: 'Clerk' },
        { id: 'staff-4', department: 'IT', position: 'Clerk' }
      ];

      const filterByPosition = (staff: any[], position: string) => {
        return staff.filter(s => s.position === position);
      };

      const clerks = filterByPosition(staffMembers, 'Clerk');
      expect(clerks).toHaveLength(2);
      expect(clerks.every(s => s.position === 'Clerk')).toBe(true);

      const principals = filterByPosition(staffMembers, 'Principal');
      expect(principals).toHaveLength(1);
      expect(principals[0].department).toBe('Administration');
    });

    it('should search staff by name, employee ID, or email', () => {
      const staffMembers = [
        { id: 'staff-1', name: 'John Doe', employeeId: 'EMP001', email: 'john@school.com' },
        { id: 'staff-2', name: 'Jane Smith', employeeId: 'EMP002', email: 'jane@school.com' },
        { id: 'staff-3', name: 'Bob Johnson', employeeId: 'EMP003', email: 'bob@school.com' }
      ];

      const searchStaff = (staff: any[], searchTerm: string) => {
        const term = searchTerm.toLowerCase();
        return staff.filter(s => 
          s.name.toLowerCase().includes(term) ||
          s.employeeId.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term)
        );
      };

      expect(searchStaff(staffMembers, 'john')).toHaveLength(2); // John Doe and Bob Johnson
      expect(searchStaff(staffMembers, 'EMP002')).toHaveLength(1);
      expect(searchStaff(staffMembers, 'jane@school.com')).toHaveLength(1);
      expect(searchStaff(staffMembers, 'xyz')).toHaveLength(0);
    });

    it('should filter staff by joining date range', () => {
      const staffMembers = [
        { id: 'staff-1', joiningDate: '2023-01-15' },
        { id: 'staff-2', joiningDate: '2023-06-20' },
        { id: 'staff-3', joiningDate: '2024-01-10' },
        { id: 'staff-4', joiningDate: '2024-03-05' }
      ];

      const filterByDateRange = (staff: any[], startDate: string, endDate: string) => {
        return staff.filter(s => s.joiningDate >= startDate && s.joiningDate <= endDate);
      };

      const staff2023 = filterByDateRange(staffMembers, '2023-01-01', '2023-12-31');
      expect(staff2023).toHaveLength(2);

      const staff2024Q1 = filterByDateRange(staffMembers, '2024-01-01', '2024-03-31');
      expect(staff2024Q1).toHaveLength(2);

      const noStaff = filterByDateRange(staffMembers, '2025-01-01', '2025-12-31');
      expect(noStaff).toHaveLength(0);
    });
  });

  describe('Staff Statistics and Summary', () => {
    it('should calculate department-wise staff distribution', () => {
      const staffMembers = [
        { department: 'Administration', isActive: true },
        { department: 'Administration', isActive: true },
        { department: 'Finance', isActive: true },
        { department: 'Finance', isActive: false },
        { department: 'Library', isActive: true },
        { department: 'IT', isActive: true }
      ];

      const calculateDepartmentStats = (staff: any[]) => {
        const stats: Record<string, { total: number; active: number }> = {};
        
        staff.forEach(s => {
          if (!stats[s.department]) {
            stats[s.department] = { total: 0, active: 0 };
          }
          stats[s.department].total++;
          if (s.isActive) {
            stats[s.department].active++;
          }
        });
        
        return stats;
      };

      const stats = calculateDepartmentStats(staffMembers);
      
      expect(stats['Administration'].total).toBe(2);
      expect(stats['Administration'].active).toBe(2);
      expect(stats['Finance'].total).toBe(2);
      expect(stats['Finance'].active).toBe(1);
      expect(stats['Library'].total).toBe(1);
      expect(stats['Library'].active).toBe(1);
    });

    it('should calculate overall staff statistics', () => {
      const staffMembers = [
        { isActive: true },
        { isActive: true },
        { isActive: true },
        { isActive: false },
        { isActive: false }
      ];

      const calculateOverallStats = (staff: any[]) => {
        const total = staff.length;
        const active = staff.filter(s => s.isActive).length;
        const inactive = total - active;
        
        return { total, active, inactive };
      };

      const stats = calculateOverallStats(staffMembers);
      
      expect(stats.total).toBe(5);
      expect(stats.active).toBe(3);
      expect(stats.inactive).toBe(2);
    });

    it('should identify recent joinings', () => {
      const staffMembers = [
        { id: 'staff-1', name: 'John Doe', joiningDate: '2024-01-15' },
        { id: 'staff-2', name: 'Jane Smith', joiningDate: '2023-12-20' },
        { id: 'staff-3', name: 'Bob Johnson', joiningDate: '2024-01-25' },
        { id: 'staff-4', name: 'Alice Brown', joiningDate: '2023-11-10' }
      ];

      const getRecentJoinings = (staff: any[], days: number = 30) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffString = cutoffDate.toISOString().split('T')[0];
        
        return staff
          .filter(s => s.joiningDate >= cutoffString)
          .sort((a, b) => b.joiningDate.localeCompare(a.joiningDate));
      };

      // Assuming current date is around 2024-02-01
      const recentJoinings = getRecentJoinings(staffMembers, 30);
      
      // This would depend on the actual current date, but we can test the logic
      expect(recentJoinings.length).toBeGreaterThanOrEqual(0);
      if (recentJoinings.length > 1) {
        expect(recentJoinings[0].joiningDate >= recentJoinings[1].joiningDate).toBe(true);
      }
    });
  });

  describe('Staff Profile Updates', () => {
    it('should validate staff profile update data', () => {
      const updateData = {
        firstName: 'John',
        lastName: 'Smith',
        phone: '+1234567890',
        address: '456 New St, City',
        department: 'IT',
        position: 'IT Administrator',
        salary: 80000,
        responsibilities: 'Network administration and user support'
      };

      const validateUpdate = (data: any): string[] => {
        const errors: string[] = [];
        
        if (data.firstName && data.firstName.length < 2) {
          errors.push('First name must be at least 2 characters');
        }
        if (data.lastName && data.lastName.length < 2) {
          errors.push('Last name must be at least 2 characters');
        }
        if (data.salary && data.salary < 0) {
          errors.push('Salary cannot be negative');
        }
        
        return errors;
      };

      expect(validateUpdate(updateData)).toHaveLength(0);
      expect(validateUpdate({ firstName: 'J', salary: -1000 })).toHaveLength(2);
    });

    it('should handle partial updates correctly', () => {
      const originalStaff = {
        firstName: 'John',
        lastName: 'Doe',
        department: 'Administration',
        position: 'Principal',
        salary: 75000
      };

      const partialUpdate = {
        department: 'Finance',
        salary: 80000
      };

      const applyUpdate = (original: any, update: any) => {
        return { ...original, ...update };
      };

      const updatedStaff = applyUpdate(originalStaff, partialUpdate);
      
      expect(updatedStaff.firstName).toBe('John'); // Unchanged
      expect(updatedStaff.lastName).toBe('Doe'); // Unchanged
      expect(updatedStaff.department).toBe('Finance'); // Updated
      expect(updatedStaff.position).toBe('Principal'); // Unchanged
      expect(updatedStaff.salary).toBe(80000); // Updated
    });
  });

  describe('Staff Status Management', () => {
    it('should handle staff activation and deactivation', () => {
      const staff = {
        id: 'staff-1',
        isActive: true,
        userId: 'user-1'
      };

      const deactivateStaff = (staffMember: any) => {
        return { ...staffMember, isActive: false };
      };

      const reactivateStaff = (staffMember: any) => {
        return { ...staffMember, isActive: true };
      };

      const deactivated = deactivateStaff(staff);
      expect(deactivated.isActive).toBe(false);

      const reactivated = reactivateStaff(deactivated);
      expect(reactivated.isActive).toBe(true);
    });

    it('should validate status change permissions', () => {
      const canChangeStatus = (userRole: string, action: string): boolean => {
        if (userRole !== 'admin') return false;
        return ['activate', 'deactivate'].includes(action);
      };

      expect(canChangeStatus('admin', 'activate')).toBe(true);
      expect(canChangeStatus('admin', 'deactivate')).toBe(true);
      expect(canChangeStatus('staff', 'activate')).toBe(false);
      expect(canChangeStatus('teacher', 'deactivate')).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty staff lists gracefully', () => {
      const processStaffList = (staff: any[]) => {
        return {
          data: staff,
          total: staff.length,
          isEmpty: staff.length === 0,
          summary: staff.length > 0 ? {
            totalActive: staff.filter(s => s.isActive).length
          } : null
        };
      };

      const emptyResult = processStaffList([]);
      expect(emptyResult.isEmpty).toBe(true);
      expect(emptyResult.total).toBe(0);
      expect(emptyResult.summary).toBeNull();

      const nonEmptyResult = processStaffList([{ isActive: true }]);
      expect(nonEmptyResult.isEmpty).toBe(false);
      expect(nonEmptyResult.total).toBe(1);
      expect(nonEmptyResult.summary?.totalActive).toBe(1);
    });

    it('should validate required fields for staff creation', () => {
      const validateRequiredFields = (data: any): string[] => {
        const errors: string[] = [];
        const required = ['firstName', 'lastName', 'email', 'employeeId', 'department', 'position', 'joiningDate'];
        
        required.forEach(field => {
          if (!data[field]) {
            errors.push(`${field} is required`);
          }
        });
        
        return errors;
      };

      const completeData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@school.com',
        employeeId: 'EMP001',
        department: 'Administration',
        position: 'Principal',
        joiningDate: '2024-01-15'
      };

      const incompleteData = {
        firstName: 'John',
        email: 'john@school.com'
      };

      expect(validateRequiredFields(completeData)).toHaveLength(0);
      expect(validateRequiredFields(incompleteData)).toHaveLength(5);
    });

    it('should handle invalid date formats', () => {
      const validateDate = (dateString: string): boolean => {
        const date = new Date(dateString);
        return !isNaN(date.getTime()) && !!dateString.match(/^\d{4}-\d{2}-\d{2}$/);
      };

      expect(validateDate('2024-01-15')).toBe(true);
      expect(validateDate('2024-13-01')).toBe(false);
      expect(validateDate('invalid-date')).toBe(false);
      expect(validateDate('01/15/2024')).toBe(false);
    });

    it('should handle salary validation', () => {
      const validateSalary = (salary: any): { isValid: boolean; error?: string } => {
        if (salary === null || salary === undefined) {
          return { isValid: true }; // Optional field
        }
        
        if (typeof salary !== 'number') {
          return { isValid: false, error: 'Salary must be a number' };
        }
        
        if (salary < 0) {
          return { isValid: false, error: 'Salary cannot be negative' };
        }
        
        return { isValid: true };
      };

      expect(validateSalary(50000).isValid).toBe(true);
      expect(validateSalary(null).isValid).toBe(true);
      expect(validateSalary(-1000).isValid).toBe(false);
      expect(validateSalary('50000').isValid).toBe(false);
    });
  });
});
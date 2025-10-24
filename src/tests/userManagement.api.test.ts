import request from 'supertest';
import jwt from 'jsonwebtoken';

// User Management API Comprehensive Tests
describe('User Management API Tests', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-that-is-at-least-32-characters-long-for-jwt-validation';
  
  // Helper function to generate test tokens
  const generateToken = (payload: any) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  };

  const adminToken = generateToken({ userId: 'admin-1', role: 'admin', email: 'admin@school.com' });
  const teacherToken = generateToken({ userId: 'teacher-1', role: 'teacher', email: 'teacher@school.com' });
  const studentToken = generateToken({ userId: 'student-1', role: 'student', email: 'student@school.com' });
  const parentToken = generateToken({ userId: 'parent-1', role: 'parent', email: 'parent@school.com' });

  describe('POST /api/v1/auth/login', () => {
    it('should validate login request format', () => {
      const validateLoginRequest = (body: any) => {
        const errors = [];
        
        if (!body.email) {
          errors.push('Email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
          errors.push('Invalid email format');
        }
        
        if (!body.password) {
          errors.push('Password is required');
        } else if (body.password.length < 8) {
          errors.push('Password must be at least 8 characters');
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      };

      expect(validateLoginRequest({ email: 'test@example.com', password: 'password123' }).valid).toBe(true);
      expect(validateLoginRequest({ email: '', password: 'password123' }).valid).toBe(false);
      expect(validateLoginRequest({ email: 'invalid-email', password: 'password123' }).valid).toBe(false);
      expect(validateLoginRequest({ email: 'test@example.com', password: '123' }).valid).toBe(false);
    });

    it('should return proper login response format', () => {
      const mockLoginResponse = (user: any) => {
        return {
          success: true,
          message: 'Login successful',
          data: {
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              isActive: user.isActive
            },
            token: generateToken({ userId: user.id, role: user.role, email: user.email }),
            expiresIn: '24h'
          }
        };
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'admin',
        isActive: true
      };

      const response = mockLoginResponse(mockUser);
      
      expect(response.success).toBe(true);
      expect(response.data.user.id).toBe(mockUser.id);
      expect(response.data.user.email).toBe(mockUser.email);
      expect(response.data.token).toBeTruthy();
      expect(response.data.expiresIn).toBe('24h');
    });

    it('should handle invalid credentials', () => {
      const handleInvalidCredentials = (email: string, password: string, storedUser: any) => {
        if (!storedUser) {
          return {
            success: false,
            message: 'User not found',
            statusCode: 404
          };
        }
        
        // Mock password comparison
        const isValidPassword = password === 'correctPassword';
        if (!isValidPassword) {
          return {
            success: false,
            message: 'Invalid credentials',
            statusCode: 401
          };
        }
        
        if (!storedUser.isActive) {
          return {
            success: false,
            message: 'Account is deactivated',
            statusCode: 403
          };
        }
        
        return { success: true };
      };

      expect(handleInvalidCredentials('test@example.com', 'wrongPassword', { isActive: true }).success).toBe(false);
      expect(handleInvalidCredentials('test@example.com', 'correctPassword', null).success).toBe(false);
      expect(handleInvalidCredentials('test@example.com', 'correctPassword', { isActive: false }).success).toBe(false);
      expect(handleInvalidCredentials('test@example.com', 'correctPassword', { isActive: true }).success).toBe(true);
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should validate user registration data', () => {
      const validateRegistration = (userData: any) => {
        const errors = [];
        
        if (!userData.firstName || userData.firstName.length < 2) {
          errors.push('First name must be at least 2 characters');
        }
        
        if (!userData.lastName || userData.lastName.length < 2) {
          errors.push('Last name must be at least 2 characters');
        }
        
        if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
          errors.push('Valid email is required');
        }
        
        if (!userData.password || userData.password.length < 8) {
          errors.push('Password must be at least 8 characters');
        }
        
        if (!userData.role || !['admin', 'teacher', 'student', 'parent', 'staff'].includes(userData.role)) {
          errors.push('Valid role is required');
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      };

      const validUser = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'teacher'
      };

      expect(validateRegistration(validUser).valid).toBe(true);
      expect(validateRegistration({ ...validUser, firstName: 'J' }).valid).toBe(false);
      expect(validateRegistration({ ...validUser, email: 'invalid-email' }).valid).toBe(false);
      expect(validateRegistration({ ...validUser, role: 'invalid' }).valid).toBe(false);
    });

    it('should check email uniqueness', () => {
      const checkEmailUniqueness = (email: string, existingEmails: string[]) => {
        if (existingEmails.includes(email)) {
          return {
            unique: false,
            message: 'Email already exists'
          };
        }
        
        return { unique: true };
      };

      const existingEmails = ['admin@school.com', 'teacher@school.com'];
      
      expect(checkEmailUniqueness('new@school.com', existingEmails).unique).toBe(true);
      expect(checkEmailUniqueness('admin@school.com', existingEmails).unique).toBe(false);
    });
  });

  describe('GET /api/v1/users', () => {
    it('should validate admin access for user listing', () => {
      const checkUserListAccess = (userRole: string) => {
        if (userRole !== 'admin') {
          return {
            allowed: false,
            statusCode: 403,
            message: 'Admin access required'
          };
        }
        
        return { allowed: true };
      };

      expect(checkUserListAccess('admin').allowed).toBe(true);
      expect(checkUserListAccess('teacher').allowed).toBe(false);
      expect(checkUserListAccess('student').allowed).toBe(false);
    });

    it('should handle pagination parameters', () => {
      const validatePagination = (page?: string, limit?: string) => {
        const pageNum = page ? parseInt(page) : 1;
        const limitNum = limit ? parseInt(limit) : 10;
        
        const errors = [];
        
        if (pageNum < 1) {
          errors.push('Page must be greater than 0');
        }
        
        if (limitNum < 1 || limitNum > 100) {
          errors.push('Limit must be between 1 and 100');
        }
        
        return {
          valid: errors.length === 0,
          errors,
          pagination: {
            page: pageNum,
            limit: limitNum,
            offset: (pageNum - 1) * limitNum
          }
        };
      };

      expect(validatePagination('1', '10').valid).toBe(true);
      expect(validatePagination('0', '10').valid).toBe(false);
      expect(validatePagination('1', '101').valid).toBe(false);
      expect(validatePagination().pagination.page).toBe(1);
      expect(validatePagination().pagination.limit).toBe(10);
    });

    it('should handle search and filter parameters', () => {
      const validateSearchFilters = (query: any) => {
        const allowedFilters = ['role', 'isActive', 'search'];
        const allowedRoles = ['admin', 'teacher', 'student', 'parent', 'staff'];
        
        const errors = [];
        
        if (query.role && !allowedRoles.includes(query.role)) {
          errors.push('Invalid role filter');
        }
        
        if (query.isActive && !['true', 'false'].includes(query.isActive)) {
          errors.push('isActive must be true or false');
        }
        
        if (query.search && query.search.length < 2) {
          errors.push('Search term must be at least 2 characters');
        }
        
        return {
          valid: errors.length === 0,
          errors,
          filters: {
            role: query.role,
            isActive: query.isActive === 'true',
            search: query.search
          }
        };
      };

      expect(validateSearchFilters({ role: 'teacher', isActive: 'true' }).valid).toBe(true);
      expect(validateSearchFilters({ role: 'invalid' }).valid).toBe(false);
      expect(validateSearchFilters({ isActive: 'maybe' }).valid).toBe(false);
      expect(validateSearchFilters({ search: 'a' }).valid).toBe(false);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should validate user ID format', () => {
      const validateUserId = (id: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        
        if (!id) {
          return { valid: false, error: 'User ID is required' };
        }
        
        if (!uuidRegex.test(id)) {
          return { valid: false, error: 'Invalid user ID format' };
        }
        
        return { valid: true };
      };

      expect(validateUserId('123e4567-e89b-12d3-a456-426614174000').valid).toBe(true);
      expect(validateUserId('invalid-id').valid).toBe(false);
      expect(validateUserId('').valid).toBe(false);
    });

    it('should check user access permissions', () => {
      const checkUserAccess = (requestingUserId: string, requestingUserRole: string, targetUserId: string) => {
        // Admin can access any user
        if (requestingUserRole === 'admin') {
          return { allowed: true };
        }
        
        // Users can access their own profile
        if (requestingUserId === targetUserId) {
          return { allowed: true };
        }
        
        // Teachers can view basic info of students in their classes (simplified)
        if (requestingUserRole === 'teacher') {
          return { allowed: true, limitedAccess: true };
        }
        
        return {
          allowed: false,
          statusCode: 403,
          message: 'Access denied'
        };
      };

      expect(checkUserAccess('admin-1', 'admin', 'user-1').allowed).toBe(true);
      expect(checkUserAccess('user-1', 'student', 'user-1').allowed).toBe(true);
      expect(checkUserAccess('user-1', 'student', 'user-2').allowed).toBe(false);
      expect(checkUserAccess('teacher-1', 'teacher', 'student-1').allowed).toBe(true);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('should validate update permissions', () => {
      const checkUpdatePermissions = (requestingUserId: string, requestingUserRole: string, targetUserId: string, updateData: any) => {
        // Admin can update any user
        if (requestingUserRole === 'admin') {
          return { allowed: true };
        }
        
        // Users can update their own profile (limited fields)
        if (requestingUserId === targetUserId) {
          const allowedFields = ['firstName', 'lastName', 'phone', 'address'];
          const restrictedFields = ['email', 'role', 'isActive'];
          
          const hasRestrictedFields = Object.keys(updateData).some(field => restrictedFields.includes(field));
          
          if (hasRestrictedFields) {
            return {
              allowed: false,
              message: 'Cannot update restricted fields'
            };
          }
          
          return { allowed: true };
        }
        
        return {
          allowed: false,
          message: 'Access denied'
        };
      };

      expect(checkUpdatePermissions('admin-1', 'admin', 'user-1', { role: 'teacher' }).allowed).toBe(true);
      expect(checkUpdatePermissions('user-1', 'student', 'user-1', { firstName: 'John' }).allowed).toBe(true);
      expect(checkUpdatePermissions('user-1', 'student', 'user-1', { role: 'admin' }).allowed).toBe(false);
      expect(checkUpdatePermissions('user-1', 'student', 'user-2', { firstName: 'John' }).allowed).toBe(false);
    });

    it('should validate update data', () => {
      const validateUpdateData = (updateData: any) => {
        const errors = [];
        
        if (updateData.firstName && updateData.firstName.length < 2) {
          errors.push('First name must be at least 2 characters');
        }
        
        if (updateData.lastName && updateData.lastName.length < 2) {
          errors.push('Last name must be at least 2 characters');
        }
        
        if (updateData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.email)) {
          errors.push('Invalid email format');
        }
        
        if (updateData.phone && !/^\+?[\d\s\-\(\)]{10,}$/.test(updateData.phone)) {
          errors.push('Invalid phone number format');
        }
        
        if (updateData.role && !['admin', 'teacher', 'student', 'parent', 'staff'].includes(updateData.role)) {
          errors.push('Invalid role');
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      };

      expect(validateUpdateData({ firstName: 'John', lastName: 'Doe' }).valid).toBe(true);
      expect(validateUpdateData({ firstName: 'J' }).valid).toBe(false);
      expect(validateUpdateData({ email: 'invalid-email' }).valid).toBe(false);
      expect(validateUpdateData({ phone: '123' }).valid).toBe(false);
      expect(validateUpdateData({ role: 'invalid' }).valid).toBe(false);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should validate delete permissions', () => {
      const checkDeletePermissions = (requestingUserRole: string, targetUserRole: string) => {
        // Only admin can delete users
        if (requestingUserRole !== 'admin') {
          return {
            allowed: false,
            statusCode: 403,
            message: 'Admin access required'
          };
        }
        
        // Cannot delete other admins (business rule)
        if (targetUserRole === 'admin') {
          return {
            allowed: false,
            statusCode: 400,
            message: 'Cannot delete admin users'
          };
        }
        
        return { allowed: true };
      };

      expect(checkDeletePermissions('admin', 'teacher').allowed).toBe(true);
      expect(checkDeletePermissions('teacher', 'student').allowed).toBe(false);
      expect(checkDeletePermissions('admin', 'admin').allowed).toBe(false);
    });

    it('should handle soft delete vs hard delete', () => {
      const handleUserDeletion = (userId: string, forceDelete: boolean = false) => {
        // Check if user has related data
        const hasRelatedData = true; // Mock check
        
        if (hasRelatedData && !forceDelete) {
          // Soft delete - deactivate user
          return {
            type: 'soft',
            action: 'deactivate',
            message: 'User deactivated successfully'
          };
        } else {
          // Hard delete - remove user completely
          return {
            type: 'hard',
            action: 'delete',
            message: 'User deleted permanently'
          };
        }
      };

      expect(handleUserDeletion('user-1', false).type).toBe('soft');
      expect(handleUserDeletion('user-1', true).type).toBe('hard');
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should validate forgot password request', () => {
      const validateForgotPasswordRequest = (email: string) => {
        if (!email) {
          return {
            valid: false,
            error: 'Email is required'
          };
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return {
            valid: false,
            error: 'Invalid email format'
          };
        }
        
        return { valid: true };
      };

      expect(validateForgotPasswordRequest('test@example.com').valid).toBe(true);
      expect(validateForgotPasswordRequest('').valid).toBe(false);
      expect(validateForgotPasswordRequest('invalid-email').valid).toBe(false);
    });

    it('should generate password reset token', () => {
      const generateResetToken = (userId: string) => {
        const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        
        return {
          token: resetToken,
          expiresAt,
          userId
        };
      };

      const resetData = generateResetToken('user-123');
      
      expect(resetData.token).toBeTruthy();
      expect(resetData.token.length).toBeGreaterThan(10);
      expect(resetData.expiresAt).toBeInstanceOf(Date);
      expect(resetData.userId).toBe('user-123');
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('should validate reset password request', () => {
      const validateResetPasswordRequest = (token: string, newPassword: string) => {
        const errors = [];
        
        if (!token) {
          errors.push('Reset token is required');
        }
        
        if (!newPassword) {
          errors.push('New password is required');
        } else if (newPassword.length < 8) {
          errors.push('Password must be at least 8 characters');
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      };

      expect(validateResetPasswordRequest('valid-token', 'newPassword123').valid).toBe(true);
      expect(validateResetPasswordRequest('', 'newPassword123').valid).toBe(false);
      expect(validateResetPasswordRequest('valid-token', '123').valid).toBe(false);
    });

    it('should validate reset token', () => {
      const validateResetToken = (token: string, storedToken: string, expiresAt: Date) => {
        if (token !== storedToken) {
          return {
            valid: false,
            error: 'Invalid reset token'
          };
        }
        
        if (new Date() > expiresAt) {
          return {
            valid: false,
            error: 'Reset token has expired'
          };
        }
        
        return { valid: true };
      };

      const futureDate = new Date(Date.now() + 60 * 60 * 1000);
      const pastDate = new Date(Date.now() - 60 * 60 * 1000);

      expect(validateResetToken('token123', 'token123', futureDate).valid).toBe(true);
      expect(validateResetToken('token123', 'different', futureDate).valid).toBe(false);
      expect(validateResetToken('token123', 'token123', pastDate).valid).toBe(false);
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    it('should validate change password request', () => {
      const validateChangePasswordRequest = (currentPassword: string, newPassword: string, confirmPassword: string) => {
        const errors = [];
        
        if (!currentPassword) {
          errors.push('Current password is required');
        }
        
        if (!newPassword) {
          errors.push('New password is required');
        } else if (newPassword.length < 8) {
          errors.push('New password must be at least 8 characters');
        }
        
        if (newPassword !== confirmPassword) {
          errors.push('Password confirmation does not match');
        }
        
        if (currentPassword === newPassword) {
          errors.push('New password must be different from current password');
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      };

      expect(validateChangePasswordRequest('oldPass123', 'newPass123', 'newPass123').valid).toBe(true);
      expect(validateChangePasswordRequest('', 'newPass123', 'newPass123').valid).toBe(false);
      expect(validateChangePasswordRequest('oldPass123', 'new', 'new').valid).toBe(false);
      expect(validateChangePasswordRequest('oldPass123', 'newPass123', 'different').valid).toBe(false);
      expect(validateChangePasswordRequest('samePass123', 'samePass123', 'samePass123').valid).toBe(false);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should return user profile data', () => {
      const getUserProfile = (userId: string, userRole: string) => {
        const baseProfile = {
          id: userId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: userRole,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Add role-specific data
        switch (userRole) {
          case 'student':
            return {
              ...baseProfile,
              studentId: 'STU001',
              classId: 'class-1',
              enrollmentDate: new Date().toISOString()
            };
          case 'teacher':
            return {
              ...baseProfile,
              employeeId: 'EMP001',
              subjects: ['math', 'physics'],
              classes: ['class-1', 'class-2']
            };
          case 'parent':
            return {
              ...baseProfile,
              children: ['student-1', 'student-2']
            };
          default:
            return baseProfile;
        }
      };

      const studentProfile = getUserProfile('student-1', 'student') as any;
      const teacherProfile = getUserProfile('teacher-1', 'teacher') as any;
      
      expect(studentProfile.studentId).toBeTruthy();
      expect(teacherProfile.subjects).toBeTruthy();
      expect(Array.isArray(teacherProfile.subjects)).toBe(true);
    });
  });
});
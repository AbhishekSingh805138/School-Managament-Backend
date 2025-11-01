import { BaseService } from './baseService';
import { AppError } from '../middleware/errorHandler';
import { CreateTeacher, UpdateTeacher } from '../types/teacher';
import { getPaginationParams } from '../utils/pagination';
import { hashPassword } from '../utils/auth';
import cacheService, { CacheKeys, CacheTTL } from './cacheService';

export class TeacherService extends BaseService {
  async createTeacher(teacherData: CreateTeacher) {
    // Check if user with email already exists
    const existingUser = await this.executeQuery(
      'SELECT id FROM users WHERE email = $1',
      [teacherData.email]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('User with this email already exists', 409);
    }

    // Check if employee ID already exists
    const existingEmployee = await this.executeQuery(
      'SELECT id FROM teachers WHERE employee_id = $1',
      [teacherData.employeeId]
    );

    if (existingEmployee.rows.length > 0) {
      throw new AppError('Teacher with this employee ID already exists', 409);
    }

    return await this.executeTransaction(async (client) => {
      // Hash password
      const passwordHash = await hashPassword(teacherData.password);

      // Generate sequential ID for user alt_id
      const userSequentialId = await this.generateSequentialId('users');

      // Create user account
      const userResult = await client.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, role, phone, date_of_birth, address, alt_id)
         VALUES ($1, $2, $3, $4, 'teacher', $5, $6, $7, $8)
         RETURNING id, first_name, last_name, email, phone, date_of_birth, address, is_active, created_at, updated_at`,
        [
          teacherData.firstName,
          teacherData.lastName,
          teacherData.email,
          passwordHash,
          teacherData.phone || null,
          teacherData.dateOfBirth || null,
          teacherData.address || null,
          userSequentialId
        ]
      );

      const user = userResult.rows[0];

      // Generate sequential ID for teacher alt_id
      const teacherSequentialId = await this.generateSequentialId('teachers');

      // Create teacher profile
      const teacherResult = await client.query(
        `INSERT INTO teachers (user_id, employee_id, qualification, experience_years, specialization, joining_date, salary, alt_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, alt_id, user_id, employee_id, qualification, experience_years, specialization, joining_date, salary, is_active, created_at, updated_at`,
        [
          user.id,
          teacherData.employeeId,
          teacherData.qualification || null,
          teacherData.experienceYears || 0,
          teacherData.specialization || null,
          teacherData.joiningDate,
          teacherData.salary || null,
          teacherSequentialId
        ]
      );

      const teacher = teacherResult.rows[0];

      return {
        ...this.transformTeacherResponse(teacher),
        user: this.transformUserResponse(user),
      };
    });
  }

  async getTeachers(req: any) {
    const { page, limit, offset, sortBy, sortOrder } = getPaginationParams(req, 'first_name');
    const { isActive, search, specialization } = req.query;

    let whereClause = "WHERE u.role = 'teacher'";
    const queryParams: any[] = [];

    if (isActive !== undefined) {
      whereClause += ` AND t.is_active = $${queryParams.length + 1}`;
      queryParams.push(isActive === 'true');
    }

    if (search) {
      whereClause += ` AND (u.first_name ILIKE $${queryParams.length + 1} OR u.last_name ILIKE $${queryParams.length + 1} OR u.email ILIKE $${queryParams.length + 1} OR t.employee_id ILIKE $${queryParams.length + 1})`;
      queryParams.push(`%${search}%`);
    }

    if (specialization) {
      whereClause += ` AND t.specialization ILIKE $${queryParams.length + 1}`;
      queryParams.push(`%${specialization}%`);
    }

    // Get total count
    const countResult = await this.executeQuery(
      `SELECT COUNT(*) FROM teachers t
       JOIN users u ON t.user_id = u.id
       ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get teachers
    const result = await this.executeQuery(
      `SELECT t.id, t.alt_id, t.user_id, t.employee_id, t.qualification, t.experience_years, 
              t.specialization, t.joining_date, t.salary, t.is_active, t.created_at, t.updated_at,
              u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.address
       FROM teachers t
       JOIN users u ON t.user_id = u.id
       ${whereClause}
       ORDER BY u.${sortBy} ${sortOrder}
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      [...queryParams, limit, offset]
    );

    const teachers = result.rows.map((teacher: any) => ({
      ...this.transformTeacherResponse(teacher),
      user: this.transformUserResponse(teacher),
    }));

    return {
      teachers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTeacherById(id: string) {
    const isUUID = this.validateUUID(id);

    let result;
    if (isUUID) {
      result = await this.executeQuery(
        `SELECT t.id, t.alt_id, t.user_id, t.employee_id, t.qualification, t.experience_years, 
                t.specialization, t.joining_date, t.salary, t.is_active, t.created_at, t.updated_at,
                u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.address
         FROM teachers t
         JOIN users u ON t.user_id = u.id
         WHERE t.id = $1`,
        [id]
      );
    } else {
      result = await this.executeQuery(
        `SELECT t.id, t.alt_id, t.user_id, t.employee_id, t.qualification, t.experience_years, 
                t.specialization, t.joining_date, t.salary, t.is_active, t.created_at, t.updated_at,
                u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.address
         FROM teachers t
         JOIN users u ON t.user_id = u.id
         WHERE t.alt_id = $1 OR t.employee_id = $1`,
        [id]
      );
    }

    if (result.rows.length === 0) {
      throw new AppError('Teacher not found', 404);
    }

    const teacher = result.rows[0];

    // Get assigned subjects
    const subjectsResult = await this.executeQuery(
      `SELECT s.id, s.name, s.code, s.description, s.credit_hours
       FROM teacher_subjects ts
       JOIN subjects s ON ts.subject_id = s.id
       WHERE ts.teacher_id = $1 AND s.is_active = true
       ORDER BY s.name`,
      [teacher.id]
    );

    // Get assigned classes
    const classesResult = await this.executeQuery(
      `SELECT c.id, c.name, c.grade, c.section, c.capacity, c.room,
              ay.name as academic_year_name
       FROM classes c
       JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE c.teacher_id = $1 AND c.is_active = true
       ORDER BY c.grade, c.section`,
      [teacher.id]
    );

    return {
      ...this.transformTeacherResponse(teacher),
      user: this.transformUserResponse(teacher),
      subjects: subjectsResult.rows.map((subject: any) => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        description: subject.description,
        creditHours: subject.credit_hours,
      })),
      classes: classesResult.rows.map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        section: cls.section,
        capacity: cls.capacity,
        room: cls.room,
        academicYearName: cls.academic_year_name,
      })),
    };
  }

  async updateTeacher(id: string, updateData: UpdateTeacher) {
    const existingTeacher = await this.checkEntityExists('teachers', id, 'alt_id');
    const teacherId = existingTeacher.id;
    const userId = existingTeacher.user_id;

    return await this.executeTransaction(async (client) => {
      // Update user information if provided
      const userUpdateData: any = {};
      if (updateData.firstName) userUpdateData.firstName = updateData.firstName;
      if (updateData.lastName) userUpdateData.lastName = updateData.lastName;
      if (updateData.phone !== undefined) userUpdateData.phone = updateData.phone;
      if (updateData.dateOfBirth !== undefined) userUpdateData.dateOfBirth = updateData.dateOfBirth;
      if (updateData.address !== undefined) userUpdateData.address = updateData.address;

      if (Object.keys(userUpdateData).length > 0) {
        const { query: userUpdateQuery, values: userValues } = this.buildUpdateQuery('users', userUpdateData);
        userValues.push(userId);
        await client.query(userUpdateQuery, userValues);
      }

      // Update teacher information if provided
      const teacherUpdateData: any = {};
      if (updateData.qualification !== undefined) teacherUpdateData.qualification = updateData.qualification;
      if (updateData.experienceYears !== undefined) teacherUpdateData.experienceYears = updateData.experienceYears;
      if (updateData.specialization !== undefined) teacherUpdateData.specialization = updateData.specialization;
      if (updateData.salary !== undefined) teacherUpdateData.salary = updateData.salary;

      if (Object.keys(teacherUpdateData).length === 0 && Object.keys(userUpdateData).length === 0) {
        throw new AppError('No fields to update', 400);
      }

      let teacherResult;
      if (Object.keys(teacherUpdateData).length > 0) {
        const { query: teacherUpdateQuery, values: teacherValues } = this.buildUpdateQuery('teachers', teacherUpdateData);
        teacherValues.push(teacherId);
        teacherResult = await client.query(teacherUpdateQuery, teacherValues);
      } else {
        teacherResult = await client.query(
          `SELECT id, alt_id, user_id, employee_id, qualification, experience_years, specialization, joining_date, salary, is_active, created_at, updated_at
           FROM teachers WHERE id = $1`,
          [teacherId]
        );
      }

      // Get updated user information
      const userResult = await client.query(
        `SELECT first_name, last_name, email, phone, date_of_birth, address
         FROM users WHERE id = $1`,
        [userId]
      );

      const teacher = teacherResult.rows[0];
      const user = userResult.rows[0];

      return {
        ...this.transformTeacherResponse(teacher),
        user: this.transformUserResponse(user),
      };
    });
  }

  async deleteTeacher(id: string) {
    const existingTeacher = await this.checkEntityExists('teachers', id, 'alt_id');
    const teacherId = existingTeacher.id;
    const userId = existingTeacher.user_id;

    // Check for active assignments
    const assignmentsCheck = await this.executeQuery(
      `SELECT 
         (SELECT COUNT(*) FROM classes WHERE teacher_id = $1 AND is_active = true) as active_classes_count`,
      [teacherId]
    );

    const activeClasses = parseInt(assignmentsCheck.rows[0].active_classes_count);

    if (activeClasses > 0) {
      throw new AppError(
        `Cannot deactivate teacher. They have ${activeClasses} active class assignments. Please reassign classes first.`,
        409
      );
    }

    return await this.executeTransaction(async (client) => {
      // Deactivate teacher
      await client.query(
        'UPDATE teachers SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [teacherId]
      );

      // Deactivate user account
      await client.query(
        'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );

      return { success: true };
    });
  }

  private transformTeacherResponse(teacher: any) {
    return {
      id: teacher.id,
      altId: teacher.alt_id,
      userId: teacher.user_id,
      employeeId: teacher.employee_id,
      qualification: teacher.qualification,
      experienceYears: teacher.experience_years,
      specialization: teacher.specialization,
      joiningDate: teacher.joining_date,
      salary: teacher.salary,
      isActive: teacher.is_active,
      createdAt: teacher.created_at,
      updatedAt: teacher.updated_at,
    };
  }

  private transformUserResponse(user: any) {
    return {
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.date_of_birth,
      address: user.address,
    };
  }

  // Teacher assignment methods
  async assignTeacherToSubject(teacherId: string, subjectId: string) {
    // Validate teacher exists and is active
    const teacherExists = await this.executeQuery(
      `SELECT t.id, u.first_name, u.last_name 
       FROM teachers t 
       JOIN users u ON t.user_id = u.id 
       WHERE t.id = $1 AND t.is_active = true AND u.is_active = true`,
      [teacherId]
    );

    if (teacherExists.rows.length === 0) {
      throw new AppError('Teacher not found or inactive', 404);
    }

    // Validate subject exists and is active
    const subjectExists = await this.executeQuery(
      'SELECT id, name, code FROM subjects WHERE id = $1 AND is_active = true',
      [subjectId]
    );

    if (subjectExists.rows.length === 0) {
      throw new AppError('Subject not found or inactive', 404);
    }

    // Check if assignment already exists
    const existingAssignment = await this.executeQuery(
      'SELECT id FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2',
      [teacherId, subjectId]
    );

    if (existingAssignment.rows.length > 0) {
      throw new AppError('Teacher is already assigned to this subject', 409);
    }

    // Create assignment
    const result = await this.executeQuery(
      `INSERT INTO teacher_subjects (teacher_id, subject_id)
       VALUES ($1, $2)
       RETURNING id, teacher_id, subject_id, created_at`,
      [teacherId, subjectId]
    );

    const assignment = result.rows[0];
    const teacher = teacherExists.rows[0];
    const subject = subjectExists.rows[0];

    return {
      id: assignment.id,
      teacherId: assignment.teacher_id,
      subjectId: assignment.subject_id,
      createdAt: assignment.created_at,
      teacher: {
        name: `${teacher.first_name} ${teacher.last_name}`,
      },
      subject: {
        name: subject.name,
        code: subject.code,
      },
    };
  }

  async removeTeacherFromSubject(teacherId: string, subjectId: string) {
    // Check if assignment exists
    const existingAssignment = await this.executeQuery(
      'SELECT id FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2',
      [teacherId, subjectId]
    );

    if (existingAssignment.rows.length === 0) {
      throw new AppError('Teacher assignment to subject not found', 404);
    }

    // Check if teacher is currently teaching this subject in any active classes
    const activeTeaching = await this.executeQuery(
      `SELECT COUNT(*) as count FROM class_subjects cs
       JOIN classes c ON cs.class_id = c.id
       WHERE cs.teacher_id = (SELECT user_id FROM teachers WHERE id = $1)
       AND cs.subject_id = $2 AND c.is_active = true`,
      [teacherId, subjectId]
    );

    if (parseInt(activeTeaching.rows[0].count) > 0) {
      throw new AppError(
        'Cannot remove subject assignment. Teacher is currently teaching this subject in active classes.',
        409
      );
    }

    // Remove assignment
    await this.executeQuery(
      'DELETE FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2',
      [teacherId, subjectId]
    );

    return { success: true };
  }

  async assignTeacherToClass(teacherId: string, classId: string) {
    // Validate teacher exists and is active
    const teacherExists = await this.executeQuery(
      `SELECT t.id, t.user_id, u.first_name, u.last_name 
       FROM teachers t 
       JOIN users u ON t.user_id = u.id 
       WHERE t.id = $1 AND t.is_active = true AND u.is_active = true`,
      [teacherId]
    );

    if (teacherExists.rows.length === 0) {
      throw new AppError('Teacher not found or inactive', 404);
    }

    // Validate class exists and is active
    const classExists = await this.executeQuery(
      'SELECT id, name, grade, section, teacher_id FROM classes WHERE id = $1 AND is_active = true',
      [classId]
    );

    if (classExists.rows.length === 0) {
      throw new AppError('Class not found or inactive', 404);
    }

    const currentClass = classExists.rows[0];
    const teacher = teacherExists.rows[0];

    // Check if teacher is already assigned to another class as main teacher
    const existingClassAssignment = await this.executeQuery(
      'SELECT id, name, grade, section FROM classes WHERE teacher_id = $1 AND is_active = true AND id != $2',
      [teacher.user_id, classId]
    );

    if (existingClassAssignment.rows.length > 0) {
      const existingClass = existingClassAssignment.rows[0];
      throw new AppError(
        `Teacher is already assigned as main teacher to class ${existingClass.grade}-${existingClass.section}. A teacher can only be main teacher for one class.`,
        409
      );
    }

    // Update class with new teacher
    const result = await this.executeQuery(
      `UPDATE classes SET teacher_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, name, grade, section, teacher_id, updated_at`,
      [teacher.user_id, classId]
    );

    const updatedClass = result.rows[0];

    return {
      classId: updatedClass.id,
      className: updatedClass.name,
      grade: updatedClass.grade,
      section: updatedClass.section,
      teacherId: teacherId,
      teacherName: `${teacher.first_name} ${teacher.last_name}`,
      updatedAt: updatedClass.updated_at,
    };
  }

  async getTeacherWorkload(id: string) {
    // Check if teacher exists
    const teacherExists = await this.executeQuery(
      `SELECT t.id, t.user_id, u.first_name, u.last_name, t.employee_id
       FROM teachers t 
       JOIN users u ON t.user_id = u.id 
       WHERE t.id = $1 AND t.is_active = true AND u.is_active = true`,
      [id]
    );

    if (teacherExists.rows.length === 0) {
      throw new AppError('Teacher not found or inactive', 404);
    }

    const teacher = teacherExists.rows[0];

    // Get main class assignment
    const mainClassResult = await this.executeQuery(
      `SELECT c.id, c.name, c.grade, c.section, c.capacity, c.current_enrollment,
              ay.name as academic_year_name
       FROM classes c
       JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE c.teacher_id = $1 AND c.is_active = true`,
      [teacher.user_id]
    );

    // Get subject specializations
    const specializationsResult = await this.executeQuery(
      `SELECT s.id, s.name, s.code, s.credit_hours
       FROM teacher_subjects ts
       JOIN subjects s ON ts.subject_id = s.id
       WHERE ts.teacher_id = $1 AND s.is_active = true
       ORDER BY s.name`,
      [teacher.id]
    );

    // Get class-subject teaching assignments with enhanced details
    const teachingAssignmentsResult = await this.executeQuery(
      `SELECT cs.id, c.id as class_id, c.name as class_name, c.grade, c.section,
              s.id as subject_id, s.name as subject_name, s.code as subject_code, s.credit_hours,
              c.current_enrollment as student_count,
              ay.name as academic_year_name,
              cs.created_at as assignment_date
       FROM class_subjects cs
       JOIN classes c ON cs.class_id = c.id
       JOIN subjects s ON cs.subject_id = s.id
       JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE cs.teacher_id = $1 AND c.is_active = true AND s.is_active = true
       ORDER BY c.grade, c.section, s.name`,
      [teacher.user_id]
    );

    // Calculate workload statistics
    const totalClasses = new Set();
    const totalSubjects = new Set();
    const gradeDistribution: { [key: string]: number } = {};
    let totalCreditHours = 0;
    let weeklyHours = 0;

    // Add main class
    if (mainClassResult.rows.length > 0) {
      const mainClass = mainClassResult.rows[0];
      totalClasses.add(mainClass.id);
      gradeDistribution[mainClass.grade] = (gradeDistribution[mainClass.grade] || 0) + 1;
      weeklyHours += 5; // Assume 5 hours per week for main class teacher duties
    }

    // Add teaching assignments
    teachingAssignmentsResult.rows.forEach((assignment: any) => {
      totalClasses.add(assignment.class_id);
      totalSubjects.add(assignment.subject_id);
      totalCreditHours += assignment.credit_hours || 0;
      gradeDistribution[assignment.grade] = (gradeDistribution[assignment.grade] || 0) + 1;
      weeklyHours += (assignment.credit_hours || 3);
    });

    // Calculate unique student count
    const uniqueStudentsResult = await this.executeQuery(
      `SELECT COUNT(DISTINCT s.id) as unique_students
       FROM students s
       JOIN classes c ON s.class_id = c.id
       WHERE (c.teacher_id = $1 OR EXISTS (
         SELECT 1 FROM class_subjects cs 
         WHERE cs.class_id = c.id AND cs.teacher_id = $1
       )) AND c.is_active = true AND s.is_active = true`,
      [teacher.user_id]
    );

    const uniqueStudents = parseInt(uniqueStudentsResult.rows[0].unique_students) || 0;

    // Calculate workload metrics
    const maxRecommendedHours = 25;
    const workloadIntensity = Math.min((weeklyHours / maxRecommendedHours) * 100, 100);

    let workloadStatus = 'normal';
    if (weeklyHours > 30) {
      workloadStatus = 'overloaded';
    } else if (weeklyHours > 25) {
      workloadStatus = 'high';
    } else if (weeklyHours < 15) {
      workloadStatus = 'light';
    }

    return {
      teacher: {
        id: teacher.id,
        name: `${teacher.first_name} ${teacher.last_name}`,
        employeeId: teacher.employee_id,
      },
      workloadSummary: {
        totalClasses: totalClasses.size,
        totalSubjects: totalSubjects.size,
        totalStudents: uniqueStudents,
        totalCreditHours: totalCreditHours,
        weeklyHours: weeklyHours,
        workloadIntensity: Math.round(workloadIntensity),
        workloadStatus: workloadStatus,
        isMainClassTeacher: mainClassResult.rows.length > 0,
        gradeDistribution: gradeDistribution,
      },
      mainClass: mainClassResult.rows.length > 0 ? {
        id: mainClassResult.rows[0].id,
        name: mainClassResult.rows[0].name,
        grade: mainClassResult.rows[0].grade,
        section: mainClassResult.rows[0].section,
        capacity: mainClassResult.rows[0].capacity,
        currentEnrollment: mainClassResult.rows[0].current_enrollment,
        academicYear: mainClassResult.rows[0].academic_year_name,
      } : null,
      specializations: specializationsResult.rows.map((spec: any) => ({
        id: spec.id,
        name: spec.name,
        code: spec.code,
        creditHours: spec.credit_hours,
      })),
      teachingAssignments: teachingAssignmentsResult.rows.map((assignment: any) => ({
        id: assignment.id,
        assignmentDate: assignment.assignment_date,
        class: {
          id: assignment.class_id,
          name: assignment.class_name,
          grade: assignment.grade,
          section: assignment.section,
          studentCount: assignment.student_count,
          academicYear: assignment.academic_year_name,
        },
        subject: {
          id: assignment.subject_id,
          name: assignment.subject_name,
          code: assignment.subject_code,
          creditHours: assignment.credit_hours,
        },
      })),
    };
  }

  // Remove teacher from class (main class teacher)
  async removeTeacherFromClass(classId: string) {
    // Validate class exists and has a teacher assigned
    const classExists = await this.executeQuery(
      'SELECT id, name, grade, section, teacher_id FROM classes WHERE id = $1 AND is_active = true',
      [classId]
    );

    if (classExists.rows.length === 0) {
      throw new AppError('Class not found or inactive', 404);
    }

    const currentClass = classExists.rows[0];

    if (!currentClass.teacher_id) {
      throw new AppError('No teacher is currently assigned to this class', 400);
    }

    // Remove teacher assignment
    await this.executeQuery(
      `UPDATE classes SET teacher_id = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [classId]
    );

    return { success: true };
  }

  // Assign teacher to teach specific subject in specific class
  async assignTeacherToClassSubject(teacherId: string, classId: string, subjectId: string) {
    // Validate teacher exists and is active
    const teacherExists = await this.executeQuery(
      `SELECT t.id, t.user_id, u.first_name, u.last_name 
       FROM teachers t 
       JOIN users u ON t.user_id = u.id 
       WHERE t.id = $1 AND t.is_active = true AND u.is_active = true`,
      [teacherId]
    );

    if (teacherExists.rows.length === 0) {
      throw new AppError('Teacher not found or inactive', 404);
    }

    // Validate class exists and is active
    const classExists = await this.executeQuery(
      'SELECT id, name, grade, section FROM classes WHERE id = $1 AND is_active = true',
      [classId]
    );

    if (classExists.rows.length === 0) {
      throw new AppError('Class not found or inactive', 404);
    }

    // Validate subject exists and is active
    const subjectExists = await this.executeQuery(
      'SELECT id, name, code FROM subjects WHERE id = $1 AND is_active = true',
      [subjectId]
    );

    if (subjectExists.rows.length === 0) {
      throw new AppError('Subject not found or inactive', 404);
    }

    // Check if class-subject combination exists
    const classSubjectExists = await this.executeQuery(
      'SELECT id, teacher_id FROM class_subjects WHERE class_id = $1 AND subject_id = $2',
      [classId, subjectId]
    );

    const teacher = teacherExists.rows[0];
    const classInfo = classExists.rows[0];
    const subject = subjectExists.rows[0];

    if (classSubjectExists.rows.length === 0) {
      // Create new class-subject assignment
      const result = await this.executeQuery(
        `INSERT INTO class_subjects (class_id, subject_id, teacher_id)
         VALUES ($1, $2, $3)
         RETURNING id, class_id, subject_id, teacher_id, created_at`,
        [classId, subjectId, teacher.user_id]
      );

      const assignment = result.rows[0];

      return {
        id: assignment.id,
        classId: assignment.class_id,
        subjectId: assignment.subject_id,
        teacherId: teacherId,
        createdAt: assignment.created_at,
        teacher: {
          name: `${teacher.first_name} ${teacher.last_name}`,
        },
        class: {
          name: classInfo.name,
          grade: classInfo.grade,
          section: classInfo.section,
        },
        subject: {
          name: subject.name,
          code: subject.code,
        },
      };
    } else {
      // Update existing assignment
      const currentAssignment = classSubjectExists.rows[0];

      if (currentAssignment.teacher_id === teacher.user_id) {
        throw new AppError('Teacher is already assigned to teach this subject in this class', 409);
      }

      const result = await this.executeQuery(
        `UPDATE class_subjects 
         SET teacher_id = $1, updated_at = CURRENT_TIMESTAMP
         WHERE class_id = $2 AND subject_id = $3
         RETURNING id, class_id, subject_id, teacher_id, updated_at`,
        [teacher.user_id, classId, subjectId]
      );

      const assignment = result.rows[0];

      return {
        id: assignment.id,
        classId: assignment.class_id,
        subjectId: assignment.subject_id,
        teacherId: teacherId,
        updatedAt: assignment.updated_at,
        teacher: {
          name: `${teacher.first_name} ${teacher.last_name}`,
        },
        class: {
          name: classInfo.name,
          grade: classInfo.grade,
          section: classInfo.section,
        },
        subject: {
          name: subject.name,
          code: subject.code,
        },
      };
    }
  }

  // Remove teacher from class-subject assignment
  async removeTeacherFromClassSubject(classId: string, subjectId: string) {
    // Check if assignment exists
    const existingAssignment = await this.executeQuery(
      'SELECT id, teacher_id FROM class_subjects WHERE class_id = $1 AND subject_id = $2',
      [classId, subjectId]
    );

    if (existingAssignment.rows.length === 0) {
      throw new AppError('Class-subject assignment not found', 404);
    }

    const assignment = existingAssignment.rows[0];

    if (!assignment.teacher_id) {
      throw new AppError('No teacher is currently assigned to this class-subject', 400);
    }

    // Remove teacher assignment
    await this.executeQuery(
      `UPDATE class_subjects 
       SET teacher_id = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE class_id = $1 AND subject_id = $2`,
      [classId, subjectId]
    );

    return { success: true };
  }

  // Get all teacher assignments overview
  async getAllTeacherAssignments(req: any) {
    const { page, limit, offset, sortBy, sortOrder } = getPaginationParams(req, 'teacher_name');
    const { academicYearId, subjectId, classId } = req.query;

    let whereClause = "WHERE t.is_active = true AND u.is_active = true";
    const queryParams: any[] = [];

    if (academicYearId) {
      whereClause += ` AND c.academic_year_id = $${queryParams.length + 1}`;
      queryParams.push(academicYearId);
    }

    if (subjectId) {
      whereClause += ` AND (cs.subject_id = $${queryParams.length + 1} OR ts.subject_id = $${queryParams.length + 1})`;
      queryParams.push(subjectId);
    }

    if (classId) {
      whereClause += ` AND (c.id = $${queryParams.length + 1} OR cs.class_id = $${queryParams.length + 1})`;
      queryParams.push(classId);
    }

    // Get total count
    const countResult = await this.executeQuery(
      `SELECT COUNT(DISTINCT t.id) FROM teachers t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN classes c ON c.teacher_id = u.id AND c.is_active = true
       LEFT JOIN class_subjects cs ON cs.teacher_id = u.id
       LEFT JOIN teacher_subjects ts ON ts.teacher_id = t.id
       ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get assignments with detailed information
    const result = await this.executeQuery(
      `SELECT DISTINCT t.id, t.alt_id, t.employee_id, 
              u.first_name, u.last_name, u.email,
              t.specialization, t.experience_years,
              COUNT(DISTINCT c.id) as main_classes_count,
              COUNT(DISTINCT cs.id) as subject_assignments_count,
              COUNT(DISTINCT ts.subject_id) as specializations_count
       FROM teachers t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN classes c ON c.teacher_id = u.id AND c.is_active = true
       LEFT JOIN class_subjects cs ON cs.teacher_id = u.id
       LEFT JOIN teacher_subjects ts ON ts.teacher_id = t.id
       ${whereClause}
       GROUP BY t.id, t.alt_id, t.employee_id, u.first_name, u.last_name, u.email, t.specialization, t.experience_years
       ORDER BY u.first_name ${sortOrder}
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      [...queryParams, limit, offset]
    );

    const assignments = await Promise.all(
      result.rows.map(async (teacher: any) => {
        // Get main classes
        const mainClassesResult = await this.executeQuery(
          `SELECT c.id, c.name, c.grade, c.section, ay.name as academic_year
           FROM classes c
           JOIN academic_years ay ON c.academic_year_id = ay.id
           WHERE c.teacher_id = (SELECT user_id FROM teachers WHERE id = $1) AND c.is_active = true
           ORDER BY c.grade, c.section`,
          [teacher.id]
        );

        // Get subject assignments
        const subjectAssignmentsResult = await this.executeQuery(
          `SELECT cs.id, c.name as class_name, c.grade, c.section,
                  s.name as subject_name, s.code as subject_code,
                  ay.name as academic_year
           FROM class_subjects cs
           JOIN classes c ON cs.class_id = c.id
           JOIN subjects s ON cs.subject_id = s.id
           JOIN academic_years ay ON c.academic_year_id = ay.id
           WHERE cs.teacher_id = (SELECT user_id FROM teachers WHERE id = $1) AND c.is_active = true
           ORDER BY c.grade, c.section, s.name`,
          [teacher.id]
        );

        // Get specializations
        const specializationsResult = await this.executeQuery(
          `SELECT s.id, s.name, s.code
           FROM teacher_subjects ts
           JOIN subjects s ON ts.subject_id = s.id
           WHERE ts.teacher_id = $1 AND s.is_active = true
           ORDER BY s.name`,
          [teacher.id]
        );

        return {
          teacher: {
            id: teacher.id,
            altId: teacher.alt_id,
            employeeId: teacher.employee_id,
            name: `${teacher.first_name} ${teacher.last_name}`,
            email: teacher.email,
            specialization: teacher.specialization,
            experienceYears: teacher.experience_years,
          },
          summary: {
            mainClassesCount: parseInt(teacher.main_classes_count),
            subjectAssignmentsCount: parseInt(teacher.subject_assignments_count),
            specializationsCount: parseInt(teacher.specializations_count),
          },
          mainClasses: mainClassesResult.rows.map((cls: any) => ({
            id: cls.id,
            name: cls.name,
            grade: cls.grade,
            section: cls.section,
            academicYear: cls.academic_year,
          })),
          subjectAssignments: subjectAssignmentsResult.rows.map((assignment: any) => ({
            id: assignment.id,
            className: assignment.class_name,
            grade: assignment.grade,
            section: assignment.section,
            subjectName: assignment.subject_name,
            subjectCode: assignment.subject_code,
            academicYear: assignment.academic_year,
          })),
          specializations: specializationsResult.rows.map((spec: any) => ({
            id: spec.id,
            name: spec.name,
            code: spec.code,
          })),
        };
      })
    );

    return {
      assignments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Check for assignment conflicts before assigning
  async checkAssignmentConflicts(teacherId: string, classId: string, subjectId: string) {
    // Validate inputs exist
    const teacherExists = await this.executeQuery(
      `SELECT t.id, t.user_id, u.first_name, u.last_name 
       FROM teachers t 
       JOIN users u ON t.user_id = u.id 
       WHERE t.id = $1 AND t.is_active = true AND u.is_active = true`,
      [teacherId]
    );

    if (teacherExists.rows.length === 0) {
      throw new AppError('Teacher not found or inactive', 404);
    }

    const classExists = await this.executeQuery(
      'SELECT id, name, grade, section FROM classes WHERE id = $1 AND is_active = true',
      [classId]
    );

    if (classExists.rows.length === 0) {
      throw new AppError('Class not found or inactive', 404);
    }

    const subjectExists = await this.executeQuery(
      'SELECT id, name, code FROM subjects WHERE id = $1 AND is_active = true',
      [subjectId]
    );

    if (subjectExists.rows.length === 0) {
      throw new AppError('Subject not found or inactive', 404);
    }

    const teacher = teacherExists.rows[0];
    const classInfo = classExists.rows[0];
    const subject = subjectExists.rows[0];

    const conflicts: string[] = [];
    let canAssign = true;

    // Check if teacher is already assigned to this class-subject
    const existingAssignment = await this.executeQuery(
      'SELECT id FROM class_subjects WHERE class_id = $1 AND subject_id = $2 AND teacher_id = $3',
      [classId, subjectId, teacher.user_id]
    );

    if (existingAssignment.rows.length > 0) {
      conflicts.push('Teacher is already assigned to teach this subject in this class');
      canAssign = false;
    }

    // Check if teacher has specialization in this subject
    const hasSpecialization = await this.executeQuery(
      'SELECT id FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2',
      [teacherId, subjectId]
    );

    if (hasSpecialization.rows.length === 0) {
      conflicts.push('Teacher does not have specialization in this subject');
    }

    // Check current workload
    const workloadResult = await this.executeQuery(
      `SELECT COUNT(DISTINCT cs.id) as current_assignments,
              COUNT(DISTINCT c.id) as main_classes
       FROM teachers t
       LEFT JOIN class_subjects cs ON cs.teacher_id = (SELECT user_id FROM teachers WHERE id = t.id)
       LEFT JOIN classes c ON c.teacher_id = (SELECT user_id FROM teachers WHERE id = t.id) AND c.is_active = true
       WHERE t.id = $1`,
      [teacherId]
    );

    const currentAssignments = parseInt(workloadResult.rows[0].current_assignments);
    const mainClasses = parseInt(workloadResult.rows[0].main_classes);

    // Check for overload (more than 8 subject assignments or more than 1 main class)
    if (currentAssignments >= 8) {
      conflicts.push('Teacher already has maximum recommended subject assignments (8)');
    }

    if (mainClasses > 0 && currentAssignments >= 6) {
      conflicts.push('Teacher is a main class teacher and already has high workload');
    }

    // Check for same grade level assignments (good practice)
    const sameGradeAssignments = await this.executeQuery(
      `SELECT COUNT(*) as count
       FROM class_subjects cs
       JOIN classes c ON cs.class_id = c.id
       WHERE cs.teacher_id = $1 AND c.grade = $2 AND c.is_active = true`,
      [teacher.user_id, classInfo.grade]
    );

    const sameGradeCount = parseInt(sameGradeAssignments.rows[0].count);

    return {
      teacher: {
        id: teacherId,
        name: `${teacher.first_name} ${teacher.last_name}`,
      },
      class: {
        id: classId,
        name: classInfo.name,
        grade: classInfo.grade,
        section: classInfo.section,
      },
      subject: {
        id: subjectId,
        name: subject.name,
        code: subject.code,
      },
      conflicts,
      canAssign,
      workloadInfo: {
        currentAssignments,
        mainClasses,
        sameGradeAssignments: sameGradeCount,
        hasSpecialization: hasSpecialization.rows.length > 0,
      },
      recommendations: this.generateAssignmentRecommendations(currentAssignments, mainClasses, sameGradeCount, hasSpecialization.rows.length > 0),
    };
  }

  // Get optimal teacher suggestions for class-subject assignment
  async getOptimalTeacherSuggestions(classId: string, subjectId: string) {
    // Validate class and subject exist
    const classExists = await this.executeQuery(
      'SELECT id, name, grade, section FROM classes WHERE id = $1 AND is_active = true',
      [classId]
    );

    if (classExists.rows.length === 0) {
      throw new AppError('Class not found or inactive', 404);
    }

    const subjectExists = await this.executeQuery(
      'SELECT id, name, code FROM subjects WHERE id = $1 AND is_active = true',
      [subjectId]
    );

    if (subjectExists.rows.length === 0) {
      throw new AppError('Subject not found or inactive', 404);
    }

    const classInfo = classExists.rows[0];
    const subject = subjectExists.rows[0];

    // Get all active teachers with their workload and specialization info
    const teachersResult = await this.executeQuery(
      `SELECT t.id, t.employee_id, t.user_id, t.specialization, t.experience_years,
              u.first_name, u.last_name,
              COUNT(DISTINCT cs.id) as current_assignments,
              COUNT(DISTINCT c.id) as main_classes,
              COUNT(DISTINCT ts.subject_id) as specializations_count,
              CASE WHEN ts.subject_id = $2 THEN true ELSE false END as has_subject_specialization
       FROM teachers t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN class_subjects cs ON cs.teacher_id = u.id
       LEFT JOIN classes c ON c.teacher_id = u.id AND c.is_active = true
       LEFT JOIN teacher_subjects ts ON ts.teacher_id = t.id AND ts.subject_id = $2
       WHERE t.is_active = true AND u.is_active = true
       GROUP BY t.id, t.employee_id, t.user_id, t.specialization, t.experience_years, u.first_name, u.last_name, ts.subject_id
       ORDER BY has_subject_specialization DESC, current_assignments ASC, t.experience_years DESC`,
      [classId, subjectId]
    );

    const suggestions = await Promise.all(
      teachersResult.rows.map(async (teacher: any) => {
        // Check if already assigned to this class-subject
        const alreadyAssigned = await this.executeQuery(
          'SELECT id FROM class_subjects WHERE class_id = $1 AND subject_id = $2 AND teacher_id = $3',
          [classId, subjectId, teacher.user_id]
        );

        // Get same grade assignments
        const sameGradeAssignments = await this.executeQuery(
          `SELECT COUNT(*) as count
           FROM class_subjects cs
           JOIN classes c ON cs.class_id = c.id
           WHERE cs.teacher_id = $1 AND c.grade = $2 AND c.is_active = true`,
          [teacher.user_id, classInfo.grade]
        );

        const currentAssignments = parseInt(teacher.current_assignments);
        const mainClasses = parseInt(teacher.main_classes);
        const sameGradeCount = parseInt(sameGradeAssignments.rows[0].count);
        const hasSpecialization = teacher.has_subject_specialization;
        const experienceYears = teacher.experience_years || 0;

        // Calculate suitability score (0-100)
        let score = 50; // Base score

        // Specialization bonus
        if (hasSpecialization) score += 30;

        // Experience bonus
        score += Math.min(experienceYears * 2, 20);

        // Same grade experience bonus
        if (sameGradeCount > 0) score += 10;

        // Workload penalties
        if (currentAssignments >= 8) score -= 30;
        else if (currentAssignments >= 6) score -= 15;
        else if (currentAssignments >= 4) score -= 5;

        // Main class teacher penalty for high workload
        if (mainClasses > 0 && currentAssignments >= 5) score -= 10;

        // Already assigned penalty
        if (alreadyAssigned.rows.length > 0) score = 0;

        score = Math.max(0, Math.min(100, score));

        // Determine recommendation level
        let recommendation = 'not_recommended';
        if (score >= 80) recommendation = 'excellent';
        else if (score >= 65) recommendation = 'good';
        else if (score >= 40) recommendation = 'caution';

        // Calculate projected workload
        const projectedAssignments = currentAssignments + (alreadyAssigned.rows.length > 0 ? 0 : 1);
        const projectedHours = projectedAssignments * 3 + (mainClasses * 5); // Assume 3 hours per subject, 5 extra for main class
        const utilizationPercentage = Math.min((projectedHours / 25) * 100, 100); // 25 hours as full utilization

        // Generate conflicts
        const conflicts: string[] = [];
        if (alreadyAssigned.rows.length > 0) {
          conflicts.push('Already assigned to this class-subject');
        }
        if (!hasSpecialization) {
          conflicts.push('No specialization in this subject');
        }
        if (currentAssignments >= 8) {
          conflicts.push('Already at maximum workload');
        }
        if (mainClasses > 0 && currentAssignments >= 6) {
          conflicts.push('High workload as main class teacher');
        }

        return {
          teacher: {
            id: teacher.id,
            employeeId: teacher.employee_id,
            name: `${teacher.first_name} ${teacher.last_name}`,
            isMainTeacher: mainClasses > 0,
          },
          suitabilityScore: Math.round(score),
          recommendation: recommendation as 'excellent' | 'good' | 'caution' | 'not_recommended',
          currentWorkload: {
            assignments: currentAssignments,
            hours: currentAssignments * 3 + (mainClasses * 5),
            sameGradeAssignments: sameGradeCount,
          },
          projectedWorkload: {
            assignments: projectedAssignments,
            hours: projectedHours,
            utilizationPercentage: Math.round(utilizationPercentage),
          },
          conflicts,
          canAssign: alreadyAssigned.rows.length === 0 && score > 0,
        };
      })
    );

    // Sort by suitability score descending
    suggestions.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    return {
      class: {
        id: classId,
        name: classInfo.name,
        grade: classInfo.grade,
        section: classInfo.section,
      },
      subject: {
        id: subjectId,
        name: subject.name,
        code: subject.code,
      },
      suggestions: suggestions.slice(0, 10), // Return top 10 suggestions
      summary: {
        totalTeachers: suggestions.length,
        excellentMatches: suggestions.filter(s => s.recommendation === 'excellent').length,
        goodMatches: suggestions.filter(s => s.recommendation === 'good').length,
        cautionMatches: suggestions.filter(s => s.recommendation === 'caution').length,
        availableTeachers: suggestions.filter(s => s.canAssign).length,
      },
    };
  }

  private generateAssignmentRecommendations(currentAssignments: number, mainClasses: number, sameGradeCount: number, hasSpecialization: boolean): string[] {
    const recommendations: string[] = [];

    if (!hasSpecialization) {
      recommendations.push('Consider assigning teacher to subject specialization first');
    }

    if (currentAssignments >= 6) {
      recommendations.push('Teacher has high workload - monitor performance');
    }

    if (mainClasses > 0 && currentAssignments >= 5) {
      recommendations.push('As main class teacher, consider limiting additional assignments');
    }

    if (sameGradeCount === 0) {
      recommendations.push('Teacher has no experience with this grade level');
    } else if (sameGradeCount >= 3) {
      recommendations.push('Teacher has good experience with this grade level');
    }

    if (currentAssignments === 0) {
      recommendations.push('New teacher - consider mentoring support');
    }

    return recommendations;
  }
}
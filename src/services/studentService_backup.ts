import { BaseService } from './baseService';
import { AppError } from '../middleware/errorHandler';
import { CreateStudent, UpdateStudent } from '../types/student';
import { getPaginationParams } from '../utils/pagination';
import { hashPassword } from '../utils/auth';
import { cacheService, CacheKeys, CacheTTL } from './cacheService';

export class StudentService extends BaseService {
  async createStudent(studentData: CreateStudent) {
    return await this.executeTransaction(async (client) => {
      // Check if user with email already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [studentData.email]
      );

      if (existingUser.rows.length > 0) {
        throw new AppError('User with this email already exists', 409);
      }

      // Check if student ID already exists
      const existingStudentId = await client.query(
        'SELECT id FROM students WHERE student_id = $1',
        [studentData.studentId]
      );

      if (existingStudentId.rows.length > 0) {
        throw new AppError('Student with this ID already exists', 409);
      }

      // Check if class exists and has capacity
      const classResult = await client.query(
        'SELECT id, capacity, current_enrollment FROM classes WHERE id = $1 AND is_active = true',
        [studentData.classId]
      );

      if (classResult.rows.length === 0) {
        throw new AppError('Class not found or inactive', 404);
      }

      const classInfo = classResult.rows[0];
      if (classInfo.current_enrollment >= classInfo.capacity) {
        throw new AppError('Class is at full capacity', 409);
      }

      // Generate password if not provided
      const password = studentData.password || this.generateDefaultPassword(studentData.studentId);
      const passwordHash = await hashPassword(password);

      // Generate sequential ID for user alt_id
      const userSequentialId = await this.generateSequentialId('users');

      // Create user account
      const userResult = await client.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, role, phone, date_of_birth, address, alt_id)
         VALUES ($1, $2, $3, $4, 'student', $5, $6, $7, $8)
         RETURNING id, first_name, last_name, email, phone, date_of_birth, address, is_active, created_at, updated_at`,
        [
          studentData.firstName,
          studentData.lastName,
          studentData.email,
          passwordHash,
          studentData.phone || null,
          studentData.dateOfBirth || null,
          studentData.address || null,
          userSequentialId
        ]
      );

      const user = userResult.rows[0];

      // Generate sequential ID for student alt_id
      const studentSequentialId = await this.generateSequentialId('students');

      // Create student profile
      const studentResult = await client.query(
        `INSERT INTO students (user_id, student_id, class_id, enrollment_date, guardian_name, guardian_phone, guardian_email, emergency_contact, medical_info, alt_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, alt_id, user_id, student_id, class_id, enrollment_date, guardian_name, guardian_phone, guardian_email, emergency_contact, medical_info, is_active, created_at, updated_at`,
        [
          user.id,
          studentData.studentId,
          studentData.classId,
          studentData.enrollmentDate,
          studentData.guardianName,
          studentData.guardianPhone,
          studentData.guardianEmail || null,
          studentData.emergencyContact,
          studentData.medicalInfo || null,
          studentSequentialId
        ]
      );

      const student = studentResult.rows[0];

      // Update class enrollment count
      await client.query(
        'UPDATE classes SET current_enrollment = current_enrollment + 1 WHERE id = $1',
        [studentData.classId]
      );

      // Create student class history record
      await client.query(
        `INSERT INTO student_class_history (student_id, class_id, academic_year_id, start_date)
         VALUES ($1, $2, (SELECT academic_year_id FROM classes WHERE id = $2), $3)`,
        [student.id, studentData.classId, studentData.enrollmentDate]
      );

      return {
        ...this.transformStudentResponse(student),
        user: this.transformUserResponse(user),
        temporaryPassword: studentData.password ? undefined : password,
      };
    });
  }

  async getStudents(req: any) {
    const { page, limit, offset, sortBy, sortOrder } = getPaginationParams(req, 'first_name');
    const { isActive, search, classId, grade } = req.query;

    let whereClause = "WHERE u.role = 'student'";
    const queryParams: any[] = [];

    if (isActive !== undefined) {
      whereClause += ` AND s.is_active = $${queryParams.length + 1}`;
      queryParams.push(isActive === 'true');
    }

    if (search) {
      whereClause += ` AND (u.first_name ILIKE $${queryParams.length + 1} OR u.last_name ILIKE $${queryParams.length + 1} OR u.email ILIKE $${queryParams.length + 1} OR s.student_id ILIKE $${queryParams.length + 1})`;
      queryParams.push(`%${search}%`);
    }

    if (classId) {
      whereClause += ` AND s.class_id = $${queryParams.length + 1}`;
      queryParams.push(classId);
    }

    if (grade) {
      whereClause += ` AND c.grade = $${queryParams.length + 1}`;
      queryParams.push(grade);
    }

    // Get total count
    const countResult = await this.executeQuery(
      `SELECT COUNT(*) FROM students s
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON s.class_id = c.id
       ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get students
    const result = await this.executeQuery(
      `SELECT s.id, s.alt_id, s.user_id, s.student_id, s.class_id, s.enrollment_date, 
              s.guardian_name, s.guardian_phone, s.guardian_email, s.emergency_contact, 
              s.medical_info, s.is_active, s.created_at, s.updated_at,
              u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.address,
              c.name as class_name, c.grade, c.section,
              ay.name as academic_year_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON s.class_id = c.id
       JOIN academic_years ay ON c.academic_year_id = ay.id
       ${whereClause}
       ORDER BY u.${sortBy} ${sortOrder}
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      [...queryParams, limit, offset]
    );

    const students = result.rows.map((student: any) => ({
      ...this.transformStudentResponse(student),
      user: this.transformUserResponse(student),
      class: {
        id: student.class_id,
        name: student.class_name,
        grade: student.grade,
        section: student.section,
        academicYear: student.academic_year_name,
      },
    }));

    return {
      students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStudentById(id: string) {
    const isUUID = this.validateUUID(id);
    
    let result;
    if (isUUID) {
      result = await this.executeQuery(
        `SELECT s.id, s.alt_id, s.user_id, s.student_id, s.class_id, s.enrollment_date, 
                s.guardian_name, s.guardian_phone, s.guardian_email, s.emergency_contact, 
                s.medical_info, s.is_active, s.created_at, s.updated_at,
                u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.address,
                c.name as class_name, c.grade, c.section,
                ay.name as academic_year_name
         FROM students s
         JOIN users u ON s.user_id = u.id
         JOIN classes c ON s.class_id = c.id
         JOIN academic_years ay ON c.academic_year_id = ay.id
         WHERE s.id = $1`,
        [id]
      );
    } else {
      result = await this.executeQuery(
        `SELECT s.id, s.alt_id, s.user_id, s.student_id, s.class_id, s.enrollment_date, 
                s.guardian_name, s.guardian_phone, s.guardian_email, s.emergency_contact, 
                s.medical_info, s.is_active, s.created_at, s.updated_at,
                u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.address,
                c.name as class_name, c.grade, c.section,
                ay.name as academic_year_name
         FROM students s
         JOIN users u ON s.user_id = u.id
         JOIN classes c ON s.class_id = c.id
         JOIN academic_years ay ON c.academic_year_id = ay.id
         WHERE s.alt_id = $1 OR s.student_id = $1`,
        [id]
      );
    }

    if (result.rows.length === 0) {
      throw new AppError('Student not found', 404);
    }

    const student = result.rows[0];

    // Get attendance summary
    const attendanceResult = await this.executeQuery(
      `SELECT 
         COUNT(*) as total_days,
         COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
         COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
         COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days
       FROM attendance 
       WHERE student_id = $1`,
      [student.id]
    );

    const attendance = attendanceResult.rows[0];
    const attendancePercentage = attendance.total_days > 0 
      ? Math.round((attendance.present_days / attendance.total_days) * 100) 
      : 0;

    return {
      ...this.transformStudentResponse(student),
      user: this.transformUserResponse(student),
      class: {
        id: student.class_id,
        name: student.class_name,
        grade: student.grade,
        section: student.section,
        academicYear: student.academic_year_name,
      },
      attendanceSummary: {
        totalDays: parseInt(attendance.total_days),
        presentDays: parseInt(attendance.present_days),
        absentDays: parseInt(attendance.absent_days),
        lateDays: parseInt(attendance.late_days),
        attendancePercentage,
      },
    };
  }

  async updateStudent(id: string, updateData: UpdateStudent) {
    const existingStudent = await this.checkEntityExists('students', id, 'alt_id');
    const studentId = existingStudent.id;
    const userId = existingStudent.user_id;

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

      // Update student information if provided
      const studentUpdateData: any = {};
      if (updateData.guardianName) studentUpdateData.guardianName = updateData.guardianName;
      if (updateData.guardianPhone) studentUpdateData.guardianPhone = updateData.guardianPhone;
      if (updateData.guardianEmail !== undefined) studentUpdateData.guardianEmail = updateData.guardianEmail;
      if (updateData.emergencyContact) studentUpdateData.emergencyContact = updateData.emergencyContact;
      if (updateData.medicalInfo !== undefined) studentUpdateData.medicalInfo = updateData.medicalInfo;

      // Handle class change
      if (updateData.classId && updateData.classId !== existingStudent.class_id) {
        // Check if new class exists and has capacity
        const newClassResult = await client.query(
          'SELECT id, capacity, current_enrollment FROM classes WHERE id = $1 AND is_active = true',
          [updateData.classId]
        );

        if (newClassResult.rows.length === 0) {
          throw new AppError('New class not found or inactive', 404);
        }

        const newClass = newClassResult.rows[0];
        if (newClass.current_enrollment >= newClass.capacity) {
          throw new AppError('New class is at full capacity', 409);
        }

        // Update class enrollments
        await client.query(
          'UPDATE classes SET current_enrollment = current_enrollment - 1 WHERE id = $1',
          [existingStudent.class_id]
        );
        await client.query(
          'UPDATE classes SET current_enrollment = current_enrollment + 1 WHERE id = $1',
          [updateData.classId]
        );

        // End current class history and start new one
        await client.query(
          'UPDATE student_class_history SET end_date = CURRENT_DATE WHERE student_id = $1 AND end_date IS NULL',
          [studentId]
        );
        await client.query(
          `INSERT INTO student_class_history (student_id, class_id, academic_year_id, start_date)
           VALUES ($1, $2, (SELECT academic_year_id FROM classes WHERE id = $2), CURRENT_DATE)`,
          [studentId, updateData.classId]
        );

        studentUpdateData.classId = updateData.classId;
      }

      if (Object.keys(studentUpdateData).length === 0 && Object.keys(userUpdateData).length === 0) {
        throw new AppError('No fields to update', 400);
      }

      let studentResult;
      if (Object.keys(studentUpdateData).length > 0) {
        const { query: studentUpdateQuery, values: studentValues } = this.buildUpdateQuery('students', studentUpdateData);
        studentValues.push(studentId);
        studentResult = await client.query(studentUpdateQuery, studentValues);
      } else {
        studentResult = await client.query(
          `SELECT id, alt_id, user_id, student_id, class_id, enrollment_date, guardian_name, guardian_phone, guardian_email, emergency_contact, medical_info, is_active, created_at, updated_at
           FROM students WHERE id = $1`,
          [studentId]
        );
      }

      // Get updated user information
      const userResult = await client.query(
        `SELECT first_name, last_name, email, phone, date_of_birth, address
         FROM users WHERE id = $1`,
        [userId]
      );

      const student = studentResult.rows[0];
      const user = userResult.rows[0];

      return {
        ...this.transformStudentResponse(student),
        user: this.transformUserResponse(user),
      };
    });
  }

  async deleteStudent(id: string) {
    const existingStudent = await this.checkEntityExists('students', id, 'alt_id');
    const studentId = existingStudent.id;
    const userId = existingStudent.user_id;

    return await this.executeTransaction(async (client) => {
      // Deactivate student
      await client.query(
        'UPDATE students SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [studentId]
      );

      // Deactivate user account
      await client.query(
        'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );

      // Update class enrollment count
      await client.query(
        'UPDATE classes SET current_enrollment = current_enrollment - 1 WHERE id = $1',
        [existingStudent.class_id]
      );

      // End class history
      await client.query(
        'UPDATE student_class_history SET end_date = CURRENT_DATE WHERE student_id = $1 AND end_date IS NULL',
        [studentId]
      );

      return { success: true };
    });
  }

  private generateDefaultPassword(studentId: string): string {
    // Generate a simple default password based on student ID
    return `student${studentId}`;
  }

  private transformStudentResponse(student: any) {
    return {
      id: student.id,
      altId: student.alt_id,
      userId: student.user_id,
      studentId: student.student_id,
      classId: student.class_id,
      enrollmentDate: student.enrollment_date,
      guardianName: student.guardian_name,
      guardianPhone: student.guardian_phone,
      guardianEmail: student.guardian_email,
      emergencyContact: student.emergency_contact,
      medicalInfo: student.medical_info,
      isActive: student.is_active,
      createdAt: student.created_at,
      updatedAt: student.updated_at,
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

  // Get student summary with all related information
  async getStudentSummary(id: string) {
    const student = await this.getStudentById(id);

    // Get fee information
    const feeResult = await this.executeQuery(
      `SELECT 
         COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.amount_due - p.amount_paid ELSE 0 END), 0) as pending_fees,
         MAX(p.due_date) as next_due_date
       FROM payments p
       WHERE p.student_id = $1`,
      [student.id]
    );

    // Get recent grades
    const gradesResult = await this.executeQuery(
      `SELECT g.grade_value, g.grade_letter, g.assessment_date,
              s.name as subject_name, at.name as assessment_type
       FROM grades g
       JOIN subjects s ON g.subject_id = s.id
       JOIN assessment_types at ON g.assessment_type_id = at.id
       WHERE g.student_id = $1
       ORDER BY g.assessment_date DESC
       LIMIT 5`,
      [student.id]
    );

    // Calculate overall GPA
    const gpaResult = await this.executeQuery(
      `SELECT AVG(grade_value) as overall_gpa
       FROM grades
       WHERE student_id = $1 AND grade_value IS NOT NULL`,
      [student.id]
    );

    return {
      studentId: student.id,
      personalInfo: {
        name: `${student.user.firstName} ${student.user.lastName}`,
        studentIdNumber: student.studentId,
        email: student.user.email,
        phone: student.user.phone,
        dateOfBirth: student.user.dateOfBirth,
        address: student.user.address,
      },
      academicInfo: {
        currentClass: `${student.class?.grade} ${student.class?.section}`,
        enrollmentDate: student.enrollmentDate,
        academicYear: student.class?.academicYear,
      },
      guardianInfo: {
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        guardianEmail: student.guardianEmail,
        emergencyContact: student.emergencyContact,
      },
      currentStats: {
        attendancePercentage: student.attendanceSummary?.attendancePercentage || 0,
        overallGpa: gpaResult.rows[0]?.overall_gpa 
          ? parseFloat(gpaResult.rows[0].overall_gpa).toFixed(2) 
          : null,
        pendingFees: parseFloat(feeResult.rows[0]?.pending_fees || '0'),
        nextDueDate: feeResult.rows[0]?.next_due_date,
        recentGrades: gradesResult.rows.map((g: any) => ({
          subject: g.subject_name,
          assessmentType: g.assessment_type,
          gradeValue: g.grade_value,
          gradeLetter: g.grade_letter,
          assessmentDate: g.assessment_date,
        })),
      },
    };
  }

  // Get student class history
  async getStudentClassHistory(id: string) {
    const existingStudent = await this.checkEntityExists('students', id, 'alt_id');
    const studentId = existingStudent.id;

    const result = await this.executeQuery(
      `SELECT sch.id, sch.student_id, sch.class_id, sch.academic_year_id,
              sch.start_date, sch.end_date, sch.created_at, sch.updated_at,
              c.name as class_name, c.grade, c.section,
              ay.name as academic_year_name, ay.start_date as year_start, ay.end_date as year_end
       FROM student_class_history sch
       JOIN classes c ON sch.class_id = c.id
       JOIN academic_years ay ON sch.academic_year_id = ay.id
       WHERE sch.student_id = $1
       ORDER BY sch.start_date DESC`,
      [studentId]
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      studentId: row.student_id,
      classId: row.class_id,
      academicYearId: row.academic_year_id,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      class: {
        name: row.class_name,
        grade: row.grade,
        section: row.section,
      },
      academicYear: {
        name: row.academic_year_name,
        startDate: row.year_start,
        endDate: row.year_end,
      },
    }));
  }

  // Get students by class with pagination
  async getStudentsByClass(classId: string, params: { page: number; limit: number }) {
    const { page, limit } = params;
    const offset = (page - 1) * limit;

    // Validate class exists
    await this.checkEntityExists('classes', classId, 'alt_id');

    // Get total count
    const countResult = await this.executeQuery(
      `SELECT COUNT(*) FROM students s WHERE s.class_id = $1 AND s.is_active = true`,
      [classId]
    );
    const total = parseInt(countResult.rows[0].count);

    // Get students
    const result = await this.executeQuery(
      `SELECT s.id, s.alt_id, s.user_id, s.student_id, s.class_id, s.enrollment_date,
              s.guardian_name, s.guardian_phone, s.guardian_email, s.emergency_contact,
              s.medical_info, s.is_active, s.created_at, s.updated_at,
              u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.address
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.class_id = $1 AND s.is_active = true
       ORDER BY u.first_name, u.last_name
       LIMIT $2 OFFSET $3`,
      [classId, limit, offset]
    );

    const students = result.rows.map((row: any) => ({
      ...this.transformStudentResponse(row),
      user: this.transformUserResponse(row),
    }));

    return {
      students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Bulk update students
  async bulkUpdateStudents(studentIds: string[], updateData: any) {
    return await this.executeTransaction(async (client) => {
      const results = {
        updatedCount: 0,
        failedUpdates: [] as any[],
      };

      for (const studentId of studentIds) {
        try {
          // Check if student exists
          const studentResult = await client.query(
            'SELECT id, user_id FROM students WHERE id = $1 OR alt_id = $1',
            [studentId]
          );

          if (studentResult.rows.length === 0) {
            results.failedUpdates.push({
              studentId,
              error: 'Student not found',
            });
            continue;
          }

          const student = studentResult.rows[0];

          // Update user information if provided
          const userUpdateData: any = {};
          if (updateData.firstName) userUpdateData.firstName = updateData.firstName;
          if (updateData.lastName) userUpdateData.lastName = updateData.lastName;
          if (updateData.phone !== undefined) userUpdateData.phone = updateData.phone;

          if (Object.keys(userUpdateData).length > 0) {
            const { query: userUpdateQuery, values: userValues } = this.buildUpdateQuery('users', userUpdateData);
            userValues.push(student.user_id);
            await client.query(userUpdateQuery, userValues);
          }

          // Update student information if provided
          const studentUpdateData: any = {};
          if (updateData.guardianName) studentUpdateData.guardianName = updateData.guardianName;
          if (updateData.guardianPhone) studentUpdateData.guardianPhone = updateData.guardianPhone;
          if (updateData.classId) studentUpdateData.classId = updateData.classId;

          if (Object.keys(studentUpdateData).length > 0) {
            const { query: studentUpdateQuery, values: studentValues } = this.buildUpdateQuery('students', studentUpdateData);
            studentValues.push(student.id);
            await client.query(studentUpdateQuery, studentValues);
          }

          results.updatedCount++;
        } catch (error: any) {
          results.failedUpdates.push({
            studentId,
            error: error.message,
          });
        }
      }

      return results;
    });
  }
}

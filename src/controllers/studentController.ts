import { Request, Response } from 'express';
import { query, getClient } from '../database/connection';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { hashPassword } from '../utils/auth';
import { 
  CreateStudent, 
  UpdateStudent,
  StudentQuery
} from '../types/student';
import { Pagination } from '../types/common';
import { getPaginationParams } from '../utils/pagination';

// Create student with user account
export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const studentData: CreateStudent = req.body;
  const client = await getClient();

  try {
    await client.query('BEGIN');

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

    // Hash password
    const passwordHash = await hashPassword(studentData.password);

    // Generate sequential ID for user alt_id
    const userSeqIdResult = await client.query('SELECT generate_sequential_id($1) as next_id', ['users']);
    const userSequentialId = userSeqIdResult.rows[0].next_id;

    // Create user account
    const userResult = await client.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, phone, date_of_birth, address, alt_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, alt_id, first_name, last_name, email, role, phone, date_of_birth, address, is_active, created_at, updated_at`,
      [
        studentData.firstName,
        studentData.lastName,
        studentData.email,
        passwordHash,
        'student',
        studentData.phone || null,
        studentData.dateOfBirth || null,
        studentData.address || null,
        userSequentialId.toString(),
      ]
    );

    const user = userResult.rows[0];

    // Generate sequential ID for student alt_id
    const studentSeqIdResult = await client.query('SELECT generate_sequential_id($1) as next_id', ['students']);
    const studentSequentialId = studentSeqIdResult.rows[0].next_id;

    // Create student record
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
        studentSequentialId.toString(),
      ]
    );

    const student = studentResult.rows[0];

    // Create student class history record
    await client.query(
      `INSERT INTO student_class_history (student_id, class_id, academic_year_id, start_date)
       SELECT $1, $2, c.academic_year_id, $3
       FROM classes c WHERE c.id = $2`,
      [student.id, studentData.classId, studentData.enrollmentDate]
    );

    // Get class and academic year info for response
    const classInfoResult = await client.query(
      `SELECT c.name, c.grade, c.section, ay.name as academic_year_name
       FROM classes c
       JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE c.id = $1`,
      [studentData.classId]
    );

    const classDetails = classInfoResult.rows[0];

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: {
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
        user: {
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          dateOfBirth: user.date_of_birth,
          address: user.address,
        },
        class: {
          name: classDetails.name,
          grade: classDetails.grade,
          section: classDetails.section,
          academicYear: {
            name: classDetails.academic_year_name,
          },
        },
      },
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// Get all students
export const getStudents = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, offset, sortBy, sortOrder } = getPaginationParams(req, 'firstName');
  const queryParams = req.query as any as StudentQuery;
  let whereClause = '';
  const values: any[] = [];

  // Build where clause based on query parameters
  if (queryParams.classId) {
    whereClause += whereClause ? ' AND ' : 'WHERE ';
    whereClause += `s.class_id = $${values.length + 1}`;
    values.push(queryParams.classId);
  }

  if (queryParams.grade) {
    whereClause += whereClause ? ' AND ' : 'WHERE ';
    whereClause += `c.grade = $${values.length + 1}`;
    values.push(queryParams.grade);
  }

  if (queryParams.section) {
    whereClause += whereClause ? ' AND ' : 'WHERE ';
    whereClause += `c.section = $${values.length + 1}`;
    values.push(queryParams.section);
  }

  if (queryParams.academicYearId) {
    whereClause += whereClause ? ' AND ' : 'WHERE ';
    whereClause += `c.academic_year_id = $${values.length + 1}`;
    values.push(queryParams.academicYearId);
  }

  if (queryParams.isActive !== undefined) {
    whereClause += whereClause ? ' AND ' : 'WHERE ';
    whereClause += `s.is_active = $${values.length + 1}`;
    values.push(queryParams.isActive);
  }

  if (queryParams.search) {
    whereClause += whereClause ? ' AND ' : 'WHERE ';
    whereClause += `(u.first_name ILIKE $${values.length + 1} OR u.last_name ILIKE $${values.length + 1} OR s.student_id ILIKE $${values.length + 1} OR u.email ILIKE $${values.length + 1})`;
    values.push(`%${queryParams.search}%`);
  }

  if (queryParams.enrollmentDateFrom) {
    whereClause += whereClause ? ' AND ' : 'WHERE ';
    whereClause += `s.enrollment_date >= $${values.length + 1}`;
    values.push(queryParams.enrollmentDateFrom);
  }

  if (queryParams.enrollmentDateTo) {
    whereClause += whereClause ? ' AND ' : 'WHERE ';
    whereClause += `s.enrollment_date <= $${values.length + 1}`;
    values.push(queryParams.enrollmentDateTo);
  }

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) FROM students s
     JOIN users u ON s.user_id = u.id
     JOIN classes c ON s.class_id = c.id
     ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count);

  // Get students with related data
  const result = await query(
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
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset]
  );

  const students = result.rows.map((student: any) => ({
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
    user: {
      firstName: student.first_name,
      lastName: student.last_name,
      email: student.email,
      phone: student.phone,
      dateOfBirth: student.date_of_birth,
      address: student.address,
    },
    class: {
      name: student.class_name,
      grade: student.grade,
      section: student.section,
      academicYear: {
        name: student.academic_year_name,
      },
    },
  }));

  res.json({
    success: true,
    data: students,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get student by ID
export const getStudentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  let result;
  if (isUUID) {
    result = await query(
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
    result = await query(
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
       WHERE s.alt_id = $1 OR s.id::text = $1 OR s.student_id = $1`,
      [id]
    );
  }

  if (result.rows.length === 0) {
    throw new AppError('Student not found', 404);
  }

  const student = result.rows[0];

  // Get parents
  const parentsResult = await query(
    `SELECT sp.id, sp.relationship_type, sp.is_primary,
            u.id as parent_id, u.first_name, u.last_name, u.email, u.phone
     FROM student_parents sp
     JOIN users u ON sp.parent_user_id = u.id
     WHERE sp.student_id = $1 AND u.is_active = true
     ORDER BY sp.is_primary DESC, u.first_name`,
    [student.id]
  );

  const parents = parentsResult.rows.map((parent: any) => ({
    parentId: parent.parent_id,
    firstName: parent.first_name,
    lastName: parent.last_name,
    relationshipType: parent.relationship_type,
    isPrimary: parent.is_primary,
  }));

  // Get class history
  const historyResult = await query(
    `SELECT sch.start_date, sch.end_date,
            c.name as class_name, c.grade, c.section,
            ay.name as academic_year_name
     FROM student_class_history sch
     JOIN classes c ON sch.class_id = c.id
     JOIN academic_years ay ON sch.academic_year_id = ay.id
     WHERE sch.student_id = $1
     ORDER BY sch.start_date DESC`,
    [student.id]
  );

  const classHistory = historyResult.rows.map((history: any) => ({
    startDate: history.start_date,
    endDate: history.end_date,
    className: history.class_name,
    grade: history.grade,
    section: history.section,
    academicYear: history.academic_year_name,
  }));

  res.json({
    success: true,
    data: {
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
      user: {
        firstName: student.first_name,
        lastName: student.last_name,
        email: student.email,
        phone: student.phone,
        dateOfBirth: student.date_of_birth,
        address: student.address,
      },
      class: {
        name: student.class_name,
        grade: student.grade,
        section: student.section,
        academicYear: {
          name: student.academic_year_name,
        },
      },
      parents,
      classHistory,
    },
  });
});

// Update student
export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: UpdateStudent = req.body;
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Check if it's a UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(id);

    // Check if student exists
    let existingStudent;
    if (isUUID) {
      existingStudent = await client.query('SELECT id, user_id, class_id FROM students WHERE id = $1', [id]);
    } else {
      existingStudent = await client.query('SELECT id, user_id, class_id FROM students WHERE alt_id = $1 OR id::text = $1 OR student_id = $1', [id]);
    }

    if (existingStudent.rows.length === 0) {
      throw new AppError('Student not found', 404);
    }

    const actualStudentId = existingStudent.rows[0].id;
    const userId = existingStudent.rows[0].user_id;
    const currentClassId = existingStudent.rows[0].class_id;

    // Update user information if provided
    const userUpdateFields = [];
    const userValues = [];
    let userParamCount = 1;

    if (updateData.firstName) {
      userUpdateFields.push(`first_name = $${userParamCount++}`);
      userValues.push(updateData.firstName);
    }
    if (updateData.lastName) {
      userUpdateFields.push(`last_name = $${userParamCount++}`);
      userValues.push(updateData.lastName);
    }
    if (updateData.phone !== undefined) {
      userUpdateFields.push(`phone = $${userParamCount++}`);
      userValues.push(updateData.phone);
    }
    if (updateData.dateOfBirth !== undefined) {
      userUpdateFields.push(`date_of_birth = $${userParamCount++}`);
      userValues.push(updateData.dateOfBirth);
    }
    if (updateData.address !== undefined) {
      userUpdateFields.push(`address = $${userParamCount++}`);
      userValues.push(updateData.address);
    }

    if (userUpdateFields.length > 0) {
      userValues.push(userId);
      await client.query(
        `UPDATE users SET ${userUpdateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${userParamCount}`,
        userValues
      );
    }

    // Update student information if provided
    const studentUpdateFields = [];
    const studentValues = [];
    let studentParamCount = 1;

    if (updateData.classId) {
      // Check if new class exists and has capacity
      const classResult = await client.query(
        'SELECT id, capacity, current_enrollment FROM classes WHERE id = $1 AND is_active = true',
        [updateData.classId]
      );

      if (classResult.rows.length === 0) {
        throw new AppError('Class not found or inactive', 404);
      }

      const classInfo = classResult.rows[0];
      if (classInfo.current_enrollment >= classInfo.capacity) {
        throw new AppError('New class is at full capacity', 409);
      }

      studentUpdateFields.push(`class_id = $${studentParamCount++}`);
      studentValues.push(updateData.classId);

      // Update class history - close current record and create new one
      await client.query(
        'UPDATE student_class_history SET end_date = CURRENT_DATE WHERE student_id = $1 AND end_date IS NULL',
        [actualStudentId]
      );

      await client.query(
        `INSERT INTO student_class_history (student_id, class_id, academic_year_id, start_date)
         SELECT $1, $2, c.academic_year_id, CURRENT_DATE
         FROM classes c WHERE c.id = $2`,
        [actualStudentId, updateData.classId]
      );
    }

    if (updateData.guardianName) {
      studentUpdateFields.push(`guardian_name = $${studentParamCount++}`);
      studentValues.push(updateData.guardianName);
    }
    if (updateData.guardianPhone) {
      studentUpdateFields.push(`guardian_phone = $${studentParamCount++}`);
      studentValues.push(updateData.guardianPhone);
    }
    if (updateData.guardianEmail !== undefined) {
      studentUpdateFields.push(`guardian_email = $${studentParamCount++}`);
      studentValues.push(updateData.guardianEmail);
    }
    if (updateData.emergencyContact) {
      studentUpdateFields.push(`emergency_contact = $${studentParamCount++}`);
      studentValues.push(updateData.emergencyContact);
    }
    if (updateData.medicalInfo !== undefined) {
      studentUpdateFields.push(`medical_info = $${studentParamCount++}`);
      studentValues.push(updateData.medicalInfo);
    }

    if (studentUpdateFields.length > 0) {
      studentValues.push(actualStudentId);
      await client.query(
        `UPDATE students SET ${studentUpdateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${studentParamCount}`,
        studentValues
      );
    }

    if (userUpdateFields.length === 0 && studentUpdateFields.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    // Get updated student data
    const updatedResult = await client.query(
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
      [actualStudentId]
    );

    const student = updatedResult.rows[0];

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: {
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
        user: {
          firstName: student.first_name,
          lastName: student.last_name,
          email: student.email,
          phone: student.phone,
          dateOfBirth: student.date_of_birth,
          address: student.address,
        },
        class: {
          name: student.class_name,
          grade: student.grade,
          section: student.section,
          academicYear: {
            name: student.academic_year_name,
          },
        },
      },
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// Delete student (soft delete)
export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if student exists
  let student;
  if (isUUID) {
    student = await query('SELECT id, user_id FROM students WHERE id = $1', [id]);
  } else {
    student = await query('SELECT id, user_id FROM students WHERE alt_id = $1 OR id::text = $1 OR student_id = $1', [id]);
  }

  if (student.rows.length === 0) {
    throw new AppError('Student not found', 404);
  }

  const actualStudentId = student.rows[0].id;
  const userId = student.rows[0].user_id;

  // Soft delete student and user
  await query(
    'UPDATE students SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [actualStudentId]
  );

  await query(
    'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [userId]
  );

  res.json({
    success: true,
    message: 'Student deactivated successfully',
  });
});

// Get student class history
export const getStudentClassHistory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if student exists
  let student;
  if (isUUID) {
    student = await query('SELECT id FROM students WHERE id = $1', [id]);
  } else {
    student = await query('SELECT id FROM students WHERE alt_id = $1 OR id::text = $1 OR student_id = $1', [id]);
  }

  if (student.rows.length === 0) {
    throw new AppError('Student not found', 404);
  }

  const actualStudentId = student.rows[0].id;

  // Get class history
  const historyResult = await query(
    `SELECT sch.id, sch.start_date, sch.end_date, sch.created_at, sch.updated_at,
            c.name as class_name, c.grade, c.section,
            ay.name as academic_year_name, ay.start_date as year_start, ay.end_date as year_end
     FROM student_class_history sch
     JOIN classes c ON sch.class_id = c.id
     JOIN academic_years ay ON sch.academic_year_id = ay.id
     WHERE sch.student_id = $1
     ORDER BY sch.start_date DESC`,
    [actualStudentId]
  );

  const classHistory = historyResult.rows.map((history: any) => ({
    id: history.id,
    startDate: history.start_date,
    endDate: history.end_date,
    createdAt: history.created_at,
    updatedAt: history.updated_at,
    class: {
      name: history.class_name,
      grade: history.grade,
      section: history.section,
    },
    academicYear: {
      name: history.academic_year_name,
      startDate: history.year_start,
      endDate: history.year_end,
    },
  }));

  res.json({
    success: true,
    data: classHistory,
  });
});

// Get students by class
export const getStudentsByClass = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  
  const offset = (Number(page) - 1) * Number(limit);

  // Check if class exists
  const classExists = await query(
    'SELECT id, name, grade, section FROM classes WHERE id = $1',
    [classId]
  );

  if (classExists.rows.length === 0) {
    throw new AppError('Class not found', 404);
  }

  const classInfo = classExists.rows[0];

  // Get total count
  const countResult = await query(
    'SELECT COUNT(*) FROM students WHERE class_id = $1 AND is_active = true',
    [classId]
  );
  const total = parseInt(countResult.rows[0].count);

  // Get students in class
  const result = await query(
    `SELECT s.id, s.alt_id, s.student_id, s.enrollment_date,
            u.first_name, u.last_name, u.email, u.phone, u.date_of_birth,
            s.guardian_name, s.guardian_phone, s.guardian_email, s.emergency_contact
     FROM students s
     JOIN users u ON s.user_id = u.id
     WHERE s.class_id = $1 AND s.is_active = true
     ORDER BY u.first_name, u.last_name
     LIMIT $2 OFFSET $3`,
    [classId, Number(limit), offset]
  );

  const students = result.rows.map((student: any) => ({
    id: student.id,
    altId: student.alt_id,
    studentId: student.student_id,
    enrollmentDate: student.enrollment_date,
    firstName: student.first_name,
    lastName: student.last_name,
    email: student.email,
    phone: student.phone,
    dateOfBirth: student.date_of_birth,
    guardianName: student.guardian_name,
    guardianPhone: student.guardian_phone,
    guardianEmail: student.guardian_email,
    emergencyContact: student.emergency_contact,
  }));

  res.json({
    success: true,
    data: {
      class: {
        id: classInfo.id,
        name: classInfo.name,
        grade: classInfo.grade,
        section: classInfo.section,
      },
      students,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    },
  });
});

// Bulk update students
export const bulkUpdateStudents = asyncHandler(async (req: Request, res: Response) => {
  const { studentIds, updateData } = req.body;

  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    throw new AppError('Student IDs array is required', 400);
  }

  if (!updateData || Object.keys(updateData).length === 0) {
    throw new AppError('Update data is required', 400);
  }

  const client = await getClient();
  const results = [];
  const errors = [];

  try {
    await client.query('BEGIN');

    for (const studentId of studentIds) {
      try {
        // Check if student exists
        const studentExists = await client.query(
          'SELECT id, user_id FROM students WHERE id = $1',
          [studentId]
        );

        if (studentExists.rows.length === 0) {
          errors.push({ id: studentId, error: 'Student not found' });
          continue;
        }

        const actualStudentId = studentExists.rows[0].id;
        const userId = studentExists.rows[0].user_id;

        // Update user information if provided
        const userUpdateFields = [];
        const userValues = [];
        let userParamCount = 1;

        if (updateData.firstName) {
          userUpdateFields.push(`first_name = $${userParamCount++}`);
          userValues.push(updateData.firstName);
        }
        if (updateData.lastName) {
          userUpdateFields.push(`last_name = $${userParamCount++}`);
          userValues.push(updateData.lastName);
        }
        if (updateData.phone !== undefined) {
          userUpdateFields.push(`phone = $${userParamCount++}`);
          userValues.push(updateData.phone);
        }

        if (userUpdateFields.length > 0) {
          userValues.push(userId);
          await client.query(
            `UPDATE users SET ${userUpdateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
             WHERE id = $${userParamCount}`,
            userValues
          );
        }

        // Update student information if provided
        const studentUpdateFields = [];
        const studentValues = [];
        let studentParamCount = 1;

        if (updateData.classId) {
          studentUpdateFields.push(`class_id = $${studentParamCount++}`);
          studentValues.push(updateData.classId);
        }
        if (updateData.guardianName) {
          studentUpdateFields.push(`guardian_name = $${studentParamCount++}`);
          studentValues.push(updateData.guardianName);
        }
        if (updateData.guardianPhone) {
          studentUpdateFields.push(`guardian_phone = $${studentParamCount++}`);
          studentValues.push(updateData.guardianPhone);
        }

        if (studentUpdateFields.length > 0) {
          studentValues.push(actualStudentId);
          await client.query(
            `UPDATE students SET ${studentUpdateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
             WHERE id = $${studentParamCount}`,
            studentValues
          );
        }

        results.push({ id: studentId, status: 'updated' });

      } catch (error) {
        errors.push({ id: studentId, error: (error as Error).message });
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Bulk update completed. ${results.length} students updated, ${errors.length} errors.`,
      data: {
        processed: results.length,
        failed: errors.length,
        results,
        errors,
      },
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// Get student summary/dashboard
export const getStudentSummary = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Get student basic info
  let studentResult;
  if (isUUID) {
    studentResult = await query(
      `SELECT s.id, s.student_id, s.enrollment_date, s.guardian_name, s.guardian_phone, s.guardian_email, s.emergency_contact,
              u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.address,
              c.name as class_name, c.grade, c.section,
              ay.name as academic_year_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON s.class_id = c.id
       JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE s.id = $1 AND s.is_active = true`,
      [id]
    );
  } else {
    studentResult = await query(
      `SELECT s.id, s.student_id, s.enrollment_date, s.guardian_name, s.guardian_phone, s.guardian_email, s.emergency_contact,
              u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.address,
              c.name as class_name, c.grade, c.section,
              ay.name as academic_year_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON s.class_id = c.id
       JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE (s.alt_id = $1 OR s.id::text = $1 OR s.student_id = $1) AND s.is_active = true`,
      [id]
    );
  }

  if (studentResult.rows.length === 0) {
    throw new AppError('Student not found', 404);
  }

  const student = studentResult.rows[0];

  // Get current stats
  const statsResult = await query(
    `SELECT 
       (SELECT calculate_attendance_percentage($1, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE)) as attendance_percentage,
       (SELECT COUNT(*) FROM attendance WHERE student_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days') as recent_attendance_count,
       (SELECT AVG(percentage) FROM grades WHERE student_id = $1) as overall_grade_percentage,
       (SELECT SUM(sf.total_amount - COALESCE(p.paid_amount, 0)) 
        FROM student_fees sf 
        LEFT JOIN (SELECT student_fee_id, SUM(amount) as paid_amount FROM payments GROUP BY student_fee_id) p 
        ON sf.id = p.student_fee_id 
        WHERE sf.student_id = $1 AND sf.status IN ('pending', 'partial')) as pending_fees,
       (SELECT MAX(date) FROM attendance WHERE student_id = $1) as last_attendance_date,
       (SELECT MAX(created_at) FROM grades WHERE student_id = $1) as last_grade_date`,
    [student.id]
  );

  const stats = statsResult.rows[0];

  res.json({
    success: true,
    data: {
      studentId: student.id,
      personalInfo: {
        name: `${student.first_name} ${student.last_name}`,
        studentIdNumber: student.student_id,
        email: student.email,
        phone: student.phone,
        dateOfBirth: student.date_of_birth,
        address: student.address,
      },
      academicInfo: {
        currentClass: `${student.class_name} (${student.grade}-${student.section})`,
        enrollmentDate: student.enrollment_date,
        academicYear: student.academic_year_name,
      },
      guardianInfo: {
        guardianName: student.guardian_name,
        guardianPhone: student.guardian_phone,
        guardianEmail: student.guardian_email,
        emergencyContact: student.emergency_contact,
      },
      currentStats: {
        attendancePercentage: parseFloat(stats.attendance_percentage) || 0,
        overallGrade: stats.overall_grade_percentage ? parseFloat(stats.overall_grade_percentage).toFixed(2) + '%' : null,
        pendingFees: parseFloat(stats.pending_fees) || 0,
        lastAttendanceDate: stats.last_attendance_date,
        lastGradeDate: stats.last_grade_date,
      },
    },
  });
});
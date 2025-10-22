import { Request, Response } from 'express';
import { query, getClient } from '../database/connection';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { 
  CreateClass, 
  UpdateClass,
  EnrollStudent,
  BulkEnrollStudents,
  TransferStudent,
  ClassRosterQuery
} from '../types/class';
import { CreateClassSubject } from '../types/academic';
import { Pagination } from '../types/common';
import { getPaginationParams } from '../utils/pagination';

// Create class
export const createClass = asyncHandler(async (req: Request, res: Response) => {
  const classData: CreateClass = req.body;

  // Check if academic year exists
  const academicYearExists = await query(
    'SELECT id, name FROM academic_years WHERE id = $1',
    [classData.academicYearId]
  );

  if (academicYearExists.rows.length === 0) {
    throw new AppError('Academic year not found', 404);
  }

  // Check if teacher exists and is active
  const teacherExists = await query(
    'SELECT id FROM users WHERE id = $1 AND role = $2 AND is_active = true',
    [classData.teacherId, 'teacher']
  );

  if (teacherExists.rows.length === 0) {
    throw new AppError('Teacher not found or inactive', 404);
  }

  // Check if class with same grade, section, and academic year already exists
  const existingClass = await query(
    'SELECT id FROM classes WHERE grade = $1 AND section = $2 AND academic_year_id = $3',
    [classData.grade, classData.section, classData.academicYearId]
  );

  if (existingClass.rows.length > 0) {
    throw new AppError('Class with this grade and section already exists for this academic year', 409);
  }

  // Generate sequential ID for alt_id
  const seqIdResult = await query('SELECT generate_sequential_id($1) as next_id', ['classes']);
  const sequentialId = seqIdResult.rows[0].next_id;

  // Create class
  const result = await query(
    `INSERT INTO classes (name, grade, section, teacher_id, capacity, academic_year_id, room, description, alt_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, alt_id, name, grade, section, teacher_id, capacity, current_enrollment, 
               academic_year_id, room, description, is_active, created_at, updated_at`,
    [
      classData.name,
      classData.grade,
      classData.section,
      classData.teacherId,
      classData.capacity,
      classData.academicYearId,
      classData.room || null,
      classData.description || null,
      sequentialId.toString()
    ]
  );

  const classRecord = result.rows[0];

  // Get teacher and academic year info
  const teacherResult = await query(
    'SELECT first_name, last_name, email FROM users WHERE id = $1',
    [classRecord.teacher_id]
  );

  const academicYear = academicYearExists.rows[0];
  const teacher = teacherResult.rows[0];

  res.status(201).json({
    success: true,
    message: 'Class created successfully',
    data: {
      id: classRecord.id,
      altId: classRecord.alt_id,
      name: classRecord.name,
      grade: classRecord.grade,
      section: classRecord.section,
      teacherId: classRecord.teacher_id,
      capacity: classRecord.capacity,
      currentEnrollment: classRecord.current_enrollment,
      academicYearId: classRecord.academic_year_id,
      room: classRecord.room,
      description: classRecord.description,
      isActive: classRecord.is_active,
      createdAt: classRecord.created_at,
      updatedAt: classRecord.updated_at,
      teacher: {
        firstName: teacher.first_name,
        lastName: teacher.last_name,
        email: teacher.email,
      },
      academicYear: {
        name: academicYear.name,
        startDate: academicYear.start_date,
        endDate: academicYear.end_date,
      },
    },
  });
});

// Get all classes
export const getClasses = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, offset, sortBy, sortOrder } = getPaginationParams(req, 'grade');
  const { academicYearId, grade, isActive, search } = req.query;
  let whereClause = '';
  const queryParams: any[] = [];

  if (academicYearId) {
    whereClause = 'WHERE c.academic_year_id = $1';
    queryParams.push(academicYearId);
  }

  if (grade) {
    whereClause += whereClause ? ' AND ' : 'WHERE ';
    whereClause += `c.grade = $${queryParams.length + 1}`;
    queryParams.push(grade);
  }

  if (isActive !== undefined) {
    whereClause += whereClause ? ' AND ' : 'WHERE ';
    whereClause += `c.is_active = $${queryParams.length + 1}`;
    queryParams.push(isActive === 'true');
  }

  if (search) {
    whereClause += whereClause ? ' AND ' : 'WHERE ';
    whereClause += `(c.name ILIKE $${queryParams.length + 1} OR c.grade ILIKE $${queryParams.length + 1} OR c.section ILIKE $${queryParams.length + 1})`;
    queryParams.push(`%${search}%`);
  }

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) FROM classes c ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].count);

  // Get classes with teacher and academic year info
  const result = await query(
    `SELECT c.id, c.alt_id, c.name, c.grade, c.section, c.teacher_id, c.capacity, 
            c.current_enrollment, c.academic_year_id, c.room, c.description, 
            c.is_active, c.created_at, c.updated_at,
            u.first_name, u.last_name, u.email,
            ay.name as academic_year_name, ay.start_date, ay.end_date
     FROM classes c
     JOIN users u ON c.teacher_id = u.id
     JOIN academic_years ay ON c.academic_year_id = ay.id
     ${whereClause}
     ORDER BY c.${sortBy} ${sortOrder}
     LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
    [...queryParams, limit, offset]
  );

  const classes = result.rows.map((cls: any) => ({
    id: cls.id,
    altId: cls.alt_id,
    name: cls.name,
    grade: cls.grade,
    section: cls.section,
    teacherId: cls.teacher_id,
    capacity: cls.capacity,
    currentEnrollment: cls.current_enrollment,
    academicYearId: cls.academic_year_id,
    room: cls.room,
    description: cls.description,
    isActive: cls.is_active,
    createdAt: cls.created_at,
    updatedAt: cls.updated_at,
    teacher: {
      firstName: cls.first_name,
      lastName: cls.last_name,
      email: cls.email,
    },
    academicYear: {
      name: cls.academic_year_name,
      startDate: cls.start_date,
      endDate: cls.end_date,
    },
  }));

  res.json({
    success: true,
    data: classes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get class by ID
export const getClassById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  let result;
  if (isUUID) {
    result = await query(
      `SELECT c.id, c.alt_id, c.name, c.grade, c.section, c.teacher_id, c.capacity, 
              c.current_enrollment, c.academic_year_id, c.room, c.description, 
              c.is_active, c.created_at, c.updated_at,
              u.first_name, u.last_name, u.email,
              ay.name as academic_year_name, ay.start_date, ay.end_date
       FROM classes c
       JOIN users u ON c.teacher_id = u.id
       JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE c.id = $1`,
      [id]
    );
  } else {
    result = await query(
      `SELECT c.id, c.alt_id, c.name, c.grade, c.section, c.teacher_id, c.capacity, 
              c.current_enrollment, c.academic_year_id, c.room, c.description, 
              c.is_active, c.created_at, c.updated_at,
              u.first_name, u.last_name, u.email,
              ay.name as academic_year_name, ay.start_date, ay.end_date
       FROM classes c
       JOIN users u ON c.teacher_id = u.id
       JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE c.alt_id = $1 OR c.id::text = $1`,
      [id]
    );
  }

  if (result.rows.length === 0) {
    throw new AppError('Class not found', 404);
  }

  const cls = result.rows[0];

  // Get students in this class
  const studentsResult = await query(
    `SELECT s.id, s.student_id, u.first_name, u.last_name, u.email, s.enrollment_date
     FROM students s
     JOIN users u ON s.user_id = u.id
     WHERE s.class_id = $1 AND s.is_active = true
     ORDER BY u.first_name, u.last_name`,
    [cls.id]
  );

  const students = studentsResult.rows.map((student: any) => ({
    id: student.id,
    studentId: student.student_id,
    firstName: student.first_name,
    lastName: student.last_name,
    email: student.email,
    enrollmentDate: student.enrollment_date,
  }));

  // Get subjects taught in this class
  const subjectsResult = await query(
    `SELECT cs.id, s.id as subject_id, s.name, s.code, s.credit_hours,
            u.first_name, u.last_name, u.email
     FROM class_subjects cs
     JOIN subjects s ON cs.subject_id = s.id
     JOIN users u ON cs.teacher_id = u.id
     WHERE cs.class_id = $1
     ORDER BY s.name`,
    [cls.id]
  );

  const subjects = subjectsResult.rows.map((subject: any) => ({
    id: subject.id,
    subjectId: subject.subject_id,
    name: subject.name,
    code: subject.code,
    creditHours: subject.credit_hours,
    teacher: {
      firstName: subject.first_name,
      lastName: subject.last_name,
      email: subject.email,
    },
  }));

  res.json({
    success: true,
    data: {
      id: cls.id,
      altId: cls.alt_id,
      name: cls.name,
      grade: cls.grade,
      section: cls.section,
      teacherId: cls.teacher_id,
      capacity: cls.capacity,
      currentEnrollment: cls.current_enrollment,
      academicYearId: cls.academic_year_id,
      room: cls.room,
      description: cls.description,
      isActive: cls.is_active,
      createdAt: cls.created_at,
      updatedAt: cls.updated_at,
      teacher: {
        firstName: cls.first_name,
        lastName: cls.last_name,
        email: cls.email,
      },
      academicYear: {
        name: cls.academic_year_name,
        startDate: cls.start_date,
        endDate: cls.end_date,
      },
      students,
      subjects,
    },
  });
});

// Update class
export const updateClass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: UpdateClass = req.body;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if class exists
  let existingClass;
  if (isUUID) {
    existingClass = await query('SELECT id, academic_year_id FROM classes WHERE id = $1', [id]);
  } else {
    existingClass = await query('SELECT id, academic_year_id FROM classes WHERE alt_id = $1 OR id::text = $1', [id]);
  }

  if (existingClass.rows.length === 0) {
    throw new AppError('Class not found', 404);
  }

  const actualClassId = existingClass.rows[0].id;
  const currentAcademicYearId = existingClass.rows[0].academic_year_id;

  // Validate teacher if being updated
  if (updateData.teacherId) {
    const teacherExists = await query(
      'SELECT id FROM users WHERE id = $1 AND role = $2 AND is_active = true',
      [updateData.teacherId, 'teacher']
    );

    if (teacherExists.rows.length === 0) {
      throw new AppError('Teacher not found or inactive', 404);
    }
  }

  // Check for grade/section conflicts if being updated
  if (updateData.grade || updateData.section) {
    const grade = updateData.grade || (await query('SELECT grade FROM classes WHERE id = $1', [actualClassId])).rows[0].grade;
    const section = updateData.section || (await query('SELECT section FROM classes WHERE id = $1', [actualClassId])).rows[0].section;
    const academicYearId = updateData.academicYearId || currentAcademicYearId;

    const conflictCheck = await query(
      'SELECT id FROM classes WHERE grade = $1 AND section = $2 AND academic_year_id = $3 AND id != $4',
      [grade, section, academicYearId, actualClassId]
    );

    if (conflictCheck.rows.length > 0) {
      throw new AppError('Class with this grade and section already exists for this academic year', 409);
    }
  }

  // Build update query dynamically
  const updateFields = [];
  const values = [];
  let paramCount = 1;

  if (updateData.name) {
    updateFields.push(`name = $${paramCount++}`);
    values.push(updateData.name);
  }
  if (updateData.grade) {
    updateFields.push(`grade = $${paramCount++}`);
    values.push(updateData.grade);
  }
  if (updateData.section) {
    updateFields.push(`section = $${paramCount++}`);
    values.push(updateData.section);
  }
  if (updateData.teacherId) {
    updateFields.push(`teacher_id = $${paramCount++}`);
    values.push(updateData.teacherId);
  }
  if (updateData.capacity) {
    updateFields.push(`capacity = $${paramCount++}`);
    values.push(updateData.capacity);
  }
  if (updateData.academicYearId) {
    updateFields.push(`academic_year_id = $${paramCount++}`);
    values.push(updateData.academicYearId);
  }
  if (updateData.room !== undefined) {
    updateFields.push(`room = $${paramCount++}`);
    values.push(updateData.room);
  }
  if (updateData.description !== undefined) {
    updateFields.push(`description = $${paramCount++}`);
    values.push(updateData.description);
  }

  if (updateFields.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  values.push(actualClassId);

  const result = await query(
    `UPDATE classes SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING id, alt_id, name, grade, section, teacher_id, capacity, current_enrollment, 
               academic_year_id, room, description, is_active, created_at, updated_at`,
    values
  );

  const classRecord = result.rows[0];

  // Get teacher and academic year info
  const teacherResult = await query(
    'SELECT first_name, last_name, email FROM users WHERE id = $1',
    [classRecord.teacher_id]
  );

  const academicYearResult = await query(
    'SELECT name, start_date, end_date FROM academic_years WHERE id = $1',
    [classRecord.academic_year_id]
  );

  const teacher = teacherResult.rows[0];
  const academicYear = academicYearResult.rows[0];

  res.json({
    success: true,
    message: 'Class updated successfully',
    data: {
      id: classRecord.id,
      altId: classRecord.alt_id,
      name: classRecord.name,
      grade: classRecord.grade,
      section: classRecord.section,
      teacherId: classRecord.teacher_id,
      capacity: classRecord.capacity,
      currentEnrollment: classRecord.current_enrollment,
      academicYearId: classRecord.academic_year_id,
      room: classRecord.room,
      description: classRecord.description,
      isActive: classRecord.is_active,
      createdAt: classRecord.created_at,
      updatedAt: classRecord.updated_at,
      teacher: {
        firstName: teacher.first_name,
        lastName: teacher.last_name,
        email: teacher.email,
      },
      academicYear: {
        name: academicYear.name,
        startDate: academicYear.start_date,
        endDate: academicYear.end_date,
      },
    },
  });
});

// Delete class (soft delete)
export const deleteClass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if class exists and has dependencies
  let classRecord;
  if (isUUID) {
    classRecord = await query('SELECT id, name FROM classes WHERE id = $1', [id]);
  } else {
    classRecord = await query('SELECT id, name FROM classes WHERE alt_id = $1 OR id::text = $1', [id]);
  }

  if (classRecord.rows.length === 0) {
    throw new AppError('Class not found', 404);
  }

  const actualClassId = classRecord.rows[0].id;

  // Check for dependencies
  const dependenciesCheck = await query(
    `SELECT 
       (SELECT COUNT(*) FROM students WHERE class_id = $1) as students_count,
       (SELECT COUNT(*) FROM class_subjects WHERE class_id = $1) as subjects_count,
       (SELECT COUNT(*) FROM attendance WHERE class_id = $1) as attendance_count`,
    [actualClassId]
  );

  const dependencies = dependenciesCheck.rows[0];
  const totalDependencies = parseInt(dependencies.students_count) + 
                           parseInt(dependencies.subjects_count) + 
                           parseInt(dependencies.attendance_count);

  if (totalDependencies > 0) {
    // Soft delete - deactivate instead of hard delete
    await query(
      'UPDATE classes SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [actualClassId]
    );

    res.json({
      success: true,
      message: 'Class deactivated successfully (has associated data)',
    });
  } else {
    // Hard delete if no dependencies
    await query('DELETE FROM classes WHERE id = $1', [actualClassId]);

    res.json({
      success: true,
      message: 'Class deleted successfully',
    });
  }
});

// Assign subject to class
export const assignSubjectToClass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const assignmentData: CreateClassSubject = req.body;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if class exists
  let classRecord;
  if (isUUID) {
    classRecord = await query('SELECT id FROM classes WHERE id = $1 AND is_active = true', [id]);
  } else {
    classRecord = await query('SELECT id FROM classes WHERE (alt_id = $1 OR id::text = $1) AND is_active = true', [id]);
  }

  if (classRecord.rows.length === 0) {
    throw new AppError('Class not found or inactive', 404);
  }

  const actualClassId = classRecord.rows[0].id;

  // Check if subject exists
  const subjectExists = await query(
    'SELECT id FROM subjects WHERE id = $1 AND is_active = true',
    [assignmentData.subjectId]
  );

  if (subjectExists.rows.length === 0) {
    throw new AppError('Subject not found or inactive', 404);
  }

  // Check if teacher exists and is active
  const teacherExists = await query(
    'SELECT id FROM users WHERE id = $1 AND role = $2 AND is_active = true',
    [assignmentData.teacherId, 'teacher']
  );

  if (teacherExists.rows.length === 0) {
    throw new AppError('Teacher not found or inactive', 404);
  }

  // Check if assignment already exists
  const existingAssignment = await query(
    'SELECT id FROM class_subjects WHERE class_id = $1 AND subject_id = $2',
    [actualClassId, assignmentData.subjectId]
  );

  if (existingAssignment.rows.length > 0) {
    throw new AppError('Subject is already assigned to this class', 409);
  }

  // Create assignment
  const result = await query(
    `INSERT INTO class_subjects (class_id, subject_id, teacher_id)
     VALUES ($1, $2, $3)
     RETURNING id, class_id, subject_id, teacher_id, created_at, updated_at`,
    [actualClassId, assignmentData.subjectId, assignmentData.teacherId]
  );

  const assignment = result.rows[0];

  // Get related data for response
  const relatedDataResult = await query(
    `SELECT c.name as class_name, c.grade, c.section,
            s.name as subject_name, s.code as subject_code,
            u.first_name, u.last_name, u.email
     FROM class_subjects cs
     JOIN classes c ON cs.class_id = c.id
     JOIN subjects s ON cs.subject_id = s.id
     JOIN users u ON cs.teacher_id = u.id
     WHERE cs.id = $1`,
    [assignment.id]
  );

  const relatedData = relatedDataResult.rows[0];

  res.status(201).json({
    success: true,
    message: 'Subject assigned to class successfully',
    data: {
      id: assignment.id,
      classId: assignment.class_id,
      subjectId: assignment.subject_id,
      teacherId: assignment.teacher_id,
      createdAt: assignment.created_at,
      updatedAt: assignment.updated_at,
      class: {
        name: relatedData.class_name,
        grade: relatedData.grade,
        section: relatedData.section,
      },
      subject: {
        name: relatedData.subject_name,
        code: relatedData.subject_code,
      },
      teacher: {
        firstName: relatedData.first_name,
        lastName: relatedData.last_name,
        email: relatedData.email,
      },
    },
  });
});

// Remove subject from class
export const removeSubjectFromClass = asyncHandler(async (req: Request, res: Response) => {
  const { id, subjectId } = req.params;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if class exists
  let classRecord;
  if (isUUID) {
    classRecord = await query('SELECT id FROM classes WHERE id = $1', [id]);
  } else {
    classRecord = await query('SELECT id FROM classes WHERE alt_id = $1 OR id::text = $1', [id]);
  }

  if (classRecord.rows.length === 0) {
    throw new AppError('Class not found', 404);
  }

  const actualClassId = classRecord.rows[0].id;

  // Check if assignment exists
  const assignment = await query(
    'SELECT id FROM class_subjects WHERE class_id = $1 AND subject_id = $2',
    [actualClassId, subjectId]
  );

  if (assignment.rows.length === 0) {
    throw new AppError('Subject assignment not found', 404);
  }

  // Check for dependencies (grades, attendance)
  const dependenciesCheck = await query(
    `SELECT 
       (SELECT COUNT(*) FROM grades WHERE subject_id = $1) as grades_count,
       (SELECT COUNT(*) FROM attendance WHERE class_id = $2 AND subject_id = $1) as attendance_count`,
    [subjectId, actualClassId]
  );

  const dependencies = dependenciesCheck.rows[0];
  const totalDependencies = parseInt(dependencies.grades_count) + parseInt(dependencies.attendance_count);

  if (totalDependencies > 0) {
    throw new AppError(
      `Cannot remove subject assignment. It has ${dependencies.grades_count} grades and ${dependencies.attendance_count} attendance records.`,
      409
    );
  }

  // Remove assignment
  await query('DELETE FROM class_subjects WHERE id = $1', [assignment.rows[0].id]);

  res.json({
    success: true,
    message: 'Subject removed from class successfully',
  });
});

// Get class statistics
export const getClassStatistics = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if class exists
  let classRecord;
  if (isUUID) {
    classRecord = await query('SELECT id, name FROM classes WHERE id = $1', [id]);
  } else {
    classRecord = await query('SELECT id, name FROM classes WHERE alt_id = $1 OR id::text = $1', [id]);
  }

  if (classRecord.rows.length === 0) {
    throw new AppError('Class not found', 404);
  }

  const actualClassId = classRecord.rows[0].id;

  // Get statistics
  const statsResult = await query(
    `SELECT 
       (SELECT COUNT(*) FROM students WHERE class_id = $1 AND is_active = true) as total_students,
       (SELECT COUNT(*) FROM class_subjects WHERE class_id = $1) as total_subjects,
       (SELECT ROUND(AVG(
         CASE WHEN attendance.status IN ('present', 'late') THEN 1 ELSE 0 END
       ) * 100, 2) FROM attendance WHERE class_id = $1) as average_attendance,
       (SELECT COUNT(*) FROM attendance WHERE class_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days') as recent_attendance_records`,
    [actualClassId]
  );

  const stats = statsResult.rows[0];

  res.json({
    success: true,
    data: {
      classId: actualClassId,
      className: classRecord.rows[0].name,
      totalStudents: parseInt(stats.total_students),
      totalSubjects: parseInt(stats.total_subjects),
      averageAttendance: parseFloat(stats.average_attendance) || 0,
      recentAttendanceRecords: parseInt(stats.recent_attendance_records),
    },
  });
});

// Enroll single student to class
export const enrollStudentToClass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { studentId, enrollmentDate }: { studentId: string; enrollmentDate?: string } = req.body;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if class exists and get capacity info
  let classRecord;
  if (isUUID) {
    classRecord = await query('SELECT id, name, capacity, current_enrollment FROM classes WHERE id = $1 AND is_active = true', [id]);
  } else {
    classRecord = await query('SELECT id, name, capacity, current_enrollment FROM classes WHERE (alt_id = $1 OR id::text = $1) AND is_active = true', [id]);
  }

  if (classRecord.rows.length === 0) {
    throw new AppError('Class not found or inactive', 404);
  }

  const actualClassId = classRecord.rows[0].id;
  const { capacity, current_enrollment } = classRecord.rows[0];

  // Check capacity
  if (current_enrollment >= capacity) {
    throw new AppError('Class is at full capacity', 409);
  }

  // Check if student exists and is not already enrolled in any class
  const studentCheck = await query(
    'SELECT id, class_id FROM students WHERE id = $1 AND is_active = true',
    [studentId]
  );

  if (studentCheck.rows.length === 0) {
    throw new AppError('Student not found or inactive', 404);
  }

  if (studentCheck.rows[0].class_id) {
    throw new AppError('Student is already enrolled in a class', 409);
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Update student's class
    await client.query(
      'UPDATE students SET class_id = $1, enrollment_date = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [actualClassId, enrollmentDate || new Date().toISOString(), studentId]
    );

    // Update class enrollment count
    await client.query(
      'UPDATE classes SET current_enrollment = current_enrollment + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [actualClassId]
    );

    // Create class history record
    await client.query(
      `INSERT INTO student_class_history (student_id, class_id, academic_year_id, start_date)
       SELECT $1, $2, c.academic_year_id, $3
       FROM classes c WHERE c.id = $2`,
      [studentId, actualClassId, enrollmentDate || new Date().toISOString()]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Student enrolled to class successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// Bulk enroll students to class
export const bulkEnrollStudentsToClass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { studentIds, enrollmentDate }: { studentIds: string[]; enrollmentDate?: string } = req.body;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if class exists and get capacity info
  let classRecord;
  if (isUUID) {
    classRecord = await query('SELECT id, name, capacity, current_enrollment FROM classes WHERE id = $1 AND is_active = true', [id]);
  } else {
    classRecord = await query('SELECT id, name, capacity, current_enrollment FROM classes WHERE (alt_id = $1 OR id::text = $1) AND is_active = true', [id]);
  }

  if (classRecord.rows.length === 0) {
    throw new AppError('Class not found or inactive', 404);
  }

  const actualClassId = classRecord.rows[0].id;
  const { capacity, current_enrollment } = classRecord.rows[0];

  // Check capacity
  if (current_enrollment + studentIds.length > capacity) {
    throw new AppError(`Cannot enroll ${studentIds.length} students. Available capacity: ${capacity - current_enrollment}`, 409);
  }

  // Check if all students exist and are not already enrolled
  const studentsCheck = await query(
    'SELECT id, class_id FROM students WHERE id = ANY($1) AND is_active = true',
    [studentIds]
  );

  if (studentsCheck.rows.length !== studentIds.length) {
    throw new AppError('One or more students not found or inactive', 404);
  }

  const enrolledStudents = studentsCheck.rows.filter((s: any) => s.class_id);
  if (enrolledStudents.length > 0) {
    throw new AppError(`${enrolledStudents.length} students are already enrolled in classes`, 409);
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const enrollDate = enrollmentDate || new Date().toISOString();

    // Update all students' class
    await client.query(
      'UPDATE students SET class_id = $1, enrollment_date = $2, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($3)',
      [actualClassId, enrollDate, studentIds]
    );

    // Update class enrollment count
    await client.query(
      'UPDATE classes SET current_enrollment = current_enrollment + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [studentIds.length, actualClassId]
    );

    // Create class history records for all students
    for (const studentId of studentIds) {
      await client.query(
        `INSERT INTO student_class_history (student_id, class_id, academic_year_id, start_date)
         SELECT $1, $2, c.academic_year_id, $3
         FROM classes c WHERE c.id = $2`,
        [studentId, actualClassId, enrollDate]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `${studentIds.length} students enrolled to class successfully`,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// Transfer student to another class
export const transferStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, newClassId, transferDate, reason }: { 
    studentId: string; 
    newClassId: string; 
    transferDate?: string; 
    reason?: string; 
  } = req.body;

  // Check if student exists and get current class
  const studentCheck = await query(
    'SELECT id, class_id FROM students WHERE id = $1 AND is_active = true',
    [studentId]
  );

  if (studentCheck.rows.length === 0) {
    throw new AppError('Student not found or inactive', 404);
  }

  const currentClassId = studentCheck.rows[0].class_id;
  if (!currentClassId) {
    throw new AppError('Student is not currently enrolled in any class', 400);
  }

  if (currentClassId === newClassId) {
    throw new AppError('Student is already in the target class', 400);
  }

  // Check if new class exists and has capacity
  const newClassCheck = await query(
    'SELECT id, name, capacity, current_enrollment FROM classes WHERE id = $1 AND is_active = true',
    [newClassId]
  );

  if (newClassCheck.rows.length === 0) {
    throw new AppError('Target class not found or inactive', 404);
  }

  const { capacity, current_enrollment } = newClassCheck.rows[0];
  if (current_enrollment >= capacity) {
    throw new AppError('Target class is at full capacity', 409);
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const transferDateTime = transferDate || new Date().toISOString();

    // Update current class history record end date
    await client.query(
      'UPDATE student_class_history SET end_date = $1 WHERE student_id = $2 AND class_id = $3 AND end_date IS NULL',
      [transferDateTime, studentId, currentClassId]
    );

    // Update student's class
    await client.query(
      'UPDATE students SET class_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newClassId, studentId]
    );

    // Update class enrollment counts
    await client.query(
      'UPDATE classes SET current_enrollment = current_enrollment - 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [currentClassId]
    );

    await client.query(
      'UPDATE classes SET current_enrollment = current_enrollment + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [newClassId]
    );

    // Create new class history record
    await client.query(
      `INSERT INTO student_class_history (student_id, class_id, academic_year_id, start_date)
       SELECT $1, $2, c.academic_year_id, $3
       FROM classes c WHERE c.id = $2`,
      [studentId, newClassId, transferDateTime]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Student transferred successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// Get class roster with filtering
export const getClassRoster = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    search, 
    isActive = true, 
    enrollmentDateFrom, 
    enrollmentDateTo, 
    sortBy = 'firstName', 
    sortOrder = 'asc' 
  } = req.query as any;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if class exists
  let classRecord;
  if (isUUID) {
    classRecord = await query('SELECT id, name, grade, section FROM classes WHERE id = $1', [id]);
  } else {
    classRecord = await query('SELECT id, name, grade, section FROM classes WHERE alt_id = $1 OR id::text = $1', [id]);
  }

  if (classRecord.rows.length === 0) {
    throw new AppError('Class not found', 404);
  }

  const actualClassId = classRecord.rows[0].id;

  // Build query conditions
  let whereClause = 'WHERE s.class_id = $1';
  const queryParams: any[] = [actualClassId];

  if (isActive !== undefined) {
    whereClause += ` AND s.is_active = $${queryParams.length + 1}`;
    queryParams.push(isActive);
  }

  if (search) {
    whereClause += ` AND (u.first_name ILIKE $${queryParams.length + 1} OR u.last_name ILIKE $${queryParams.length + 1} OR s.student_id ILIKE $${queryParams.length + 1} OR u.email ILIKE $${queryParams.length + 1})`;
    queryParams.push(`%${search}%`);
  }

  if (enrollmentDateFrom) {
    whereClause += ` AND s.enrollment_date >= $${queryParams.length + 1}`;
    queryParams.push(enrollmentDateFrom);
  }

  if (enrollmentDateTo) {
    whereClause += ` AND s.enrollment_date <= $${queryParams.length + 1}`;
    queryParams.push(enrollmentDateTo);
  }

  // Get students
  const studentsResult = await query(
    `SELECT s.id, s.student_id, s.enrollment_date, s.guardian_name, s.guardian_phone, 
            s.guardian_email, s.emergency_contact, s.is_active,
            u.first_name, u.last_name, u.email, u.date_of_birth, u.address
     FROM students s
     JOIN users u ON s.user_id = u.id
     ${whereClause}
     ORDER BY u.${sortBy} ${sortOrder}`,
    queryParams
  );

  const students = studentsResult.rows.map((student: any) => ({
    id: student.id,
    studentId: student.student_id,
    firstName: student.first_name,
    lastName: student.last_name,
    email: student.email,
    dateOfBirth: student.date_of_birth,
    address: student.address,
    enrollmentDate: student.enrollment_date,
    guardianName: student.guardian_name,
    guardianPhone: student.guardian_phone,
    guardianEmail: student.guardian_email,
    emergencyContact: student.emergency_contact,
    isActive: student.is_active,
  }));

  res.json({
    success: true,
    data: {
      class: {
        id: actualClassId,
        name: classRecord.rows[0].name,
        grade: classRecord.rows[0].grade,
        section: classRecord.rows[0].section,
      },
      students,
      totalStudents: students.length,
    },
  });
});

// Get class students
export const getClassStudents = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if class exists
  let classRecord;
  if (isUUID) {
    classRecord = await query('SELECT id, name FROM classes WHERE id = $1', [id]);
  } else {
    classRecord = await query('SELECT id, name FROM classes WHERE alt_id = $1 OR id::text = $1', [id]);
  }

  if (classRecord.rows.length === 0) {
    throw new AppError('Class not found', 404);
  }

  const actualClassId = classRecord.rows[0].id;

  // Get students in this class
  const studentsResult = await query(
    `SELECT s.id, s.student_id, u.first_name, u.last_name, u.email, s.enrollment_date,
            s.guardian_name, s.guardian_phone, s.guardian_email, s.emergency_contact, s.is_active
     FROM students s
     JOIN users u ON s.user_id = u.id
     WHERE s.class_id = $1 AND s.is_active = true
     ORDER BY u.first_name, u.last_name`,
    [actualClassId]
  );

  const students = studentsResult.rows.map((student: any) => ({
    id: student.id,
    studentId: student.student_id,
    firstName: student.first_name,
    lastName: student.last_name,
    email: student.email,
    enrollmentDate: student.enrollment_date,
    guardianName: student.guardian_name,
    guardianPhone: student.guardian_phone,
    guardianEmail: student.guardian_email,
    emergencyContact: student.emergency_contact,
    isActive: student.is_active,
  }));

  res.json({
    success: true,
    data: {
      classId: actualClassId,
      className: classRecord.rows[0].name,
      students,
      totalStudents: students.length,
    },
  });
});

// Get class subjects
export const getClassSubjects = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if class exists
  let classRecord;
  if (isUUID) {
    classRecord = await query('SELECT id, name FROM classes WHERE id = $1', [id]);
  } else {
    classRecord = await query('SELECT id, name FROM classes WHERE alt_id = $1 OR id::text = $1', [id]);
  }

  if (classRecord.rows.length === 0) {
    throw new AppError('Class not found', 404);
  }

  const actualClassId = classRecord.rows[0].id;

  // Get subjects taught in this class
  const subjectsResult = await query(
    `SELECT cs.id as assignment_id, s.id as subject_id, s.name, s.code, s.credit_hours, s.description,
            u.first_name, u.last_name, u.email, cs.created_at as assigned_at
     FROM class_subjects cs
     JOIN subjects s ON cs.subject_id = s.id
     JOIN users u ON cs.teacher_id = u.id
     WHERE cs.class_id = $1 AND s.is_active = true
     ORDER BY s.name`,
    [actualClassId]
  );

  const subjects = subjectsResult.rows.map((subject: any) => ({
    assignmentId: subject.assignment_id,
    subjectId: subject.subject_id,
    name: subject.name,
    code: subject.code,
    creditHours: subject.credit_hours,
    description: subject.description,
    assignedAt: subject.assigned_at,
    teacher: {
      firstName: subject.first_name,
      lastName: subject.last_name,
      email: subject.email,
    },
  }));

  res.json({
    success: true,
    data: {
      classId: actualClassId,
      className: classRecord.rows[0].name,
      subjects,
      totalSubjects: subjects.length,
    },
  });
});

// Get class teacher assignments
export const getClassTeacherAssignments = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if class exists
  let classRecord;
  if (isUUID) {
    classRecord = await query('SELECT id, name, teacher_id FROM classes WHERE id = $1', [id]);
  } else {
    classRecord = await query('SELECT id, name, teacher_id FROM classes WHERE alt_id = $1 OR id::text = $1', [id]);
  }

  if (classRecord.rows.length === 0) {
    throw new AppError('Class not found', 404);
  }

  const actualClassId = classRecord.rows[0].id;
  const classTeacherId = classRecord.rows[0].teacher_id;

  // Get class teacher (main teacher)
  const classTeacherResult = await query(
    'SELECT first_name, last_name, email FROM users WHERE id = $1',
    [classTeacherId]
  );

  const classTeacher = classTeacherResult.rows[0];

  // Get subject teachers
  const subjectTeachersResult = await query(
    `SELECT DISTINCT cs.teacher_id, u.first_name, u.last_name, u.email,
            COUNT(cs.subject_id) as subjects_count,
            ARRAY_AGG(s.name ORDER BY s.name) as subjects
     FROM class_subjects cs
     JOIN users u ON cs.teacher_id = u.id
     JOIN subjects s ON cs.subject_id = s.id
     WHERE cs.class_id = $1
     GROUP BY cs.teacher_id, u.first_name, u.last_name, u.email
     ORDER BY u.first_name, u.last_name`,
    [actualClassId]
  );

  const subjectTeachers = subjectTeachersResult.rows.map((teacher: any) => ({
    teacherId: teacher.teacher_id,
    firstName: teacher.first_name,
    lastName: teacher.last_name,
    email: teacher.email,
    subjectsCount: parseInt(teacher.subjects_count),
    subjects: teacher.subjects,
    isClassTeacher: teacher.teacher_id === classTeacherId,
  }));

  res.json({
    success: true,
    data: {
      classId: actualClassId,
      className: classRecord.rows[0].name,
      classTeacher: {
        teacherId: classTeacherId,
        firstName: classTeacher.first_name,
        lastName: classTeacher.last_name,
        email: classTeacher.email,
      },
      subjectTeachers,
      totalTeachers: subjectTeachers.length,
    },
  });
});

// Update class teacher assignment
export const updateClassTeacher = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { teacherId } = req.body;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if class exists
  let classRecord;
  if (isUUID) {
    classRecord = await query('SELECT id, name FROM classes WHERE id = $1', [id]);
  } else {
    classRecord = await query('SELECT id, name FROM classes WHERE alt_id = $1 OR id::text = $1', [id]);
  }

  if (classRecord.rows.length === 0) {
    throw new AppError('Class not found', 404);
  }

  const actualClassId = classRecord.rows[0].id;

  // Check if teacher exists and is active
  const teacherExists = await query(
    'SELECT id, first_name, last_name, email FROM users WHERE id = $1 AND role = $2 AND is_active = true',
    [teacherId, 'teacher']
  );

  if (teacherExists.rows.length === 0) {
    throw new AppError('Teacher not found or inactive', 404);
  }

  // Update class teacher
  await query(
    'UPDATE classes SET teacher_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [teacherId, actualClassId]
  );

  const teacher = teacherExists.rows[0];

  res.json({
    success: true,
    message: 'Class teacher updated successfully',
    data: {
      classId: actualClassId,
      className: classRecord.rows[0].name,
      teacher: {
        teacherId: teacher.id,
        firstName: teacher.first_name,
        lastName: teacher.last_name,
        email: teacher.email,
      },
    },
  });
});

// Get class enrollment history
export const getClassEnrollmentHistory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { academicYearId } = req.query;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if class exists
  let classRecord;
  if (isUUID) {
    classRecord = await query('SELECT id, name FROM classes WHERE id = $1', [id]);
  } else {
    classRecord = await query('SELECT id, name FROM classes WHERE alt_id = $1 OR id::text = $1', [id]);
  }

  if (classRecord.rows.length === 0) {
    throw new AppError('Class not found', 404);
  }

  const actualClassId = classRecord.rows[0].id;

  // Build query for enrollment history
  let whereClause = 'WHERE sch.class_id = $1';
  const queryParams: any[] = [actualClassId];

  if (academicYearId) {
    whereClause += ` AND sch.academic_year_id = ${queryParams.length + 1}`;
    queryParams.push(academicYearId);
  }

  // Get enrollment history
  const historyResult = await query(
    `SELECT sch.id, sch.student_id, sch.start_date, sch.end_date,
            u.first_name, u.last_name, s.student_id as student_number,
            ay.name as academic_year_name, ay.start_date as year_start, ay.end_date as year_end
     FROM student_class_history sch
     JOIN students s ON sch.student_id = s.id
     JOIN users u ON s.user_id = u.id
     JOIN academic_years ay ON sch.academic_year_id = ay.id
     ${whereClause}
     ORDER BY sch.start_date DESC, u.first_name, u.last_name`,
    queryParams
  );

  const enrollmentHistory = historyResult.rows.map((record: any) => ({
    id: record.id,
    studentId: record.student_id,
    studentNumber: record.student_number,
    studentName: `${record.first_name} ${record.last_name}`,
    startDate: record.start_date,
    endDate: record.end_date,
    isCurrentlyEnrolled: !record.end_date,
    academicYear: {
      name: record.academic_year_name,
      startDate: record.year_start,
      endDate: record.year_end,
    },
  }));

  // Get summary statistics
  const currentEnrollment = enrollmentHistory.filter((record: any) => record.isCurrentlyEnrolled).length;
  const totalHistoricalEnrollments = enrollmentHistory.length;

  res.json({
    success: true,
    data: {
      classId: actualClassId,
      className: classRecord.rows[0].name,
      currentEnrollment,
      totalHistoricalEnrollments,
      enrollmentHistory,
    },
  });
});

// Validate class capacity and enrollment constraints
export const validateClassCapacity = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { proposedEnrollment } = req.query;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if class exists
  let classRecord;
  if (isUUID) {
    classRecord = await query('SELECT id, name, capacity, current_enrollment FROM classes WHERE id = $1', [id]);
  } else {
    classRecord = await query('SELECT id, name, capacity, current_enrollment FROM classes WHERE alt_id = $1 OR id::text = $1', [id]);
  }

  if (classRecord.rows.length === 0) {
    throw new AppError('Class not found', 404);
  }

  const { capacity, current_enrollment } = classRecord.rows[0];
  const proposedCount = proposedEnrollment ? parseInt(proposedEnrollment as string) : 0;
  const totalAfterProposed = current_enrollment + proposedCount;

  const validation = {
    classId: classRecord.rows[0].id,
    className: classRecord.rows[0].name,
    capacity,
    currentEnrollment: current_enrollment,
    availableSpots: capacity - current_enrollment,
    proposedEnrollment: proposedCount,
    totalAfterProposed,
    isValid: totalAfterProposed <= capacity,
    utilizationPercentage: Math.round((current_enrollment / capacity) * 100),
    utilizationAfterProposed: Math.round((totalAfterProposed / capacity) * 100),
    warnings: [] as string[],
    errors: [] as string[],
  };

  // Add warnings and errors
  if (validation.utilizationPercentage >= 90) {
    validation.warnings.push('Class is at 90% or higher capacity');
  }

  if (validation.utilizationAfterProposed > 100) {
    validation.errors.push(`Proposed enrollment would exceed capacity by ${totalAfterProposed - capacity} students`);
  }

  if (validation.utilizationAfterProposed >= 95 && validation.utilizationAfterProposed <= 100) {
    validation.warnings.push('Proposed enrollment would result in 95% or higher capacity utilization');
  }

  if (proposedCount > validation.availableSpots) {
    validation.errors.push(`Cannot enroll ${proposedCount} students. Only ${validation.availableSpots} spots available`);
  }

  res.json({
    success: true,
    data: validation,
  });
});

// Get class capacity info
export const getClassCapacity = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);

  // Check if class exists
  let classRecord;
  if (isUUID) {
    classRecord = await query('SELECT id, name, capacity, current_enrollment FROM classes WHERE id = $1', [id]);
  } else {
    classRecord = await query('SELECT id, name, capacity, current_enrollment FROM classes WHERE alt_id = $1 OR id::text = $1', [id]);
  }

  if (classRecord.rows.length === 0) {
    throw new AppError('Class not found', 404);
  }

  const { capacity, current_enrollment } = classRecord.rows[0];

  res.json({
    success: true,
    data: {
      classId: classRecord.rows[0].id,
      className: classRecord.rows[0].name,
      capacity,
      currentEnrollment: current_enrollment,
      availableSpots: capacity - current_enrollment,
      utilizationPercentage: Math.round((current_enrollment / capacity) * 100),
    },
  });
});
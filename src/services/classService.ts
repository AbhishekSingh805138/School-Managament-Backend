import { BaseService } from './baseService';
import { AppError } from '../middleware/errorHandler';
import { CreateClass, UpdateClass } from '../types/class';
import { getPaginationParams } from '../utils/pagination';

export class ClassService extends BaseService {
  async createClass(classData: CreateClass) {
    return await this.executeTransaction(async (client) => {
      // Check if academic year exists
      const academicYearExists = await client.query(
        'SELECT id, name FROM academic_years WHERE id = $1',
        [classData.academicYearId]
      );

      if (academicYearExists.rows.length === 0) {
        throw new AppError('Academic year not found', 404);
      }

      // Check if teacher exists and is active (if provided)
      if (classData.teacherId) {
        const teacherExists = await client.query(
          'SELECT id FROM users WHERE id = $1 AND role = \'teacher\' AND is_active = true',
          [classData.teacherId]
        );

        if (teacherExists.rows.length === 0) {
          throw new AppError('Teacher not found or inactive', 404);
        }

        // Check if teacher is already assigned to another class as main teacher
        const existingAssignment = await client.query(
          'SELECT id, name, grade, section FROM classes WHERE teacher_id = $1 AND is_active = true',
          [classData.teacherId]
        );

        if (existingAssignment.rows.length > 0) {
          const existingClass = existingAssignment.rows[0];
          throw new AppError(
            `Teacher is already assigned as main teacher to class ${existingClass.grade}-${existingClass.section}`,
            409
          );
        }
      }

      // Check if class with same grade and section already exists for this academic year
      const existingClass = await client.query(
        'SELECT id FROM classes WHERE grade = $1 AND section = $2 AND academic_year_id = $3',
        [classData.grade, classData.section, classData.academicYearId]
      );

      if (existingClass.rows.length > 0) {
        throw new AppError('Class with this grade and section already exists for this academic year', 409);
      }

      // Generate sequential ID for alt_id
      const sequentialId = await this.generateSequentialId('classes');

      // Create class
      const result = await client.query(
        `INSERT INTO classes (name, grade, section, teacher_id, capacity, room, description, academic_year_id, current_enrollment, alt_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9)
         RETURNING id, alt_id, name, grade, section, teacher_id, capacity, room, description, academic_year_id, current_enrollment, is_active, created_at, updated_at`,
        [
          classData.name,
          classData.grade,
          classData.section,
          classData.teacherId || null,
          classData.capacity,
          classData.room || null,
          classData.description || null,
          classData.academicYearId,
          sequentialId
        ]
      );

      const newClass = result.rows[0];

      // Get academic year and teacher info for response
      const academicYear = academicYearExists.rows[0];
      let teacher = null;
      if (newClass.teacher_id) {
        const teacherResult = await client.query(
          'SELECT first_name, last_name FROM users WHERE id = $1',
          [newClass.teacher_id]
        );
        if (teacherResult.rows.length > 0) {
          const teacherInfo = teacherResult.rows[0];
          teacher = {
            id: newClass.teacher_id,
            name: `${teacherInfo.first_name} ${teacherInfo.last_name}`,
          };
        }
      }

      return {
        ...this.transformClassResponse(newClass),
        academicYear: {
          id: academicYear.id,
          name: academicYear.name,
        },
        teacher,
      };
    });
  }

  async getClasses(req: any) {
    const { page, limit, offset, sortBy, sortOrder } = getPaginationParams(req, 'grade');
    const { isActive, academicYearId, grade, teacherId } = req.query;

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];

    if (isActive !== undefined) {
      whereClause += ` AND c.is_active = $${queryParams.length + 1}`;
      queryParams.push(isActive === 'true');
    }

    if (academicYearId) {
      whereClause += ` AND c.academic_year_id = $${queryParams.length + 1}`;
      queryParams.push(academicYearId);
    }

    if (grade) {
      whereClause += ` AND c.grade = $${queryParams.length + 1}`;
      queryParams.push(grade);
    }

    if (teacherId) {
      whereClause += ` AND c.teacher_id = $${queryParams.length + 1}`;
      queryParams.push(teacherId);
    }

    // Get total count
    const countResult = await this.executeQuery(
      `SELECT COUNT(*) FROM classes c
       JOIN academic_years ay ON c.academic_year_id = ay.id
       ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get classes
    const result = await this.executeQuery(
      `SELECT c.id, c.alt_id, c.name, c.grade, c.section, c.teacher_id, c.capacity, c.room, 
              c.description, c.academic_year_id, c.current_enrollment, c.is_active, c.created_at, c.updated_at,
              ay.name as academic_year_name,
              u.first_name as teacher_first_name, u.last_name as teacher_last_name
       FROM classes c
       JOIN academic_years ay ON c.academic_year_id = ay.id
       LEFT JOIN users u ON c.teacher_id = u.id
       ${whereClause}
       ORDER BY c.${sortBy} ${sortOrder}, c.section
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      [...queryParams, limit, offset]
    );

    const classes = result.rows.map((cls: any) => ({
      ...this.transformClassResponse(cls),
      academicYear: {
        id: cls.academic_year_id,
        name: cls.academic_year_name,
      },
      teacher: cls.teacher_first_name ? {
        id: cls.teacher_id,
        name: `${cls.teacher_first_name} ${cls.teacher_last_name}`,
      } : null,
    }));

    return {
      classes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getClassById(id: string) {
    const classInfo = await this.checkEntityExists('classes', id, 'alt_id');

    // Get academic year info
    const academicYearResult = await this.executeQuery(
      'SELECT id, name FROM academic_years WHERE id = $1',
      [classInfo.academic_year_id]
    );

    // Get teacher info if assigned
    let teacher = null;
    if (classInfo.teacher_id) {
      const teacherResult = await this.executeQuery(
        'SELECT first_name, last_name FROM users WHERE id = $1',
        [classInfo.teacher_id]
      );
      if (teacherResult.rows.length > 0) {
        const teacherInfo = teacherResult.rows[0];
        teacher = {
          id: classInfo.teacher_id,
          name: `${teacherInfo.first_name} ${teacherInfo.last_name}`,
        };
      }
    }

    // Get students in this class
    const studentsResult = await this.executeQuery(
      `SELECT s.id, s.student_id, u.first_name, u.last_name, s.enrollment_date
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.class_id = $1 AND s.is_active = true
       ORDER BY u.first_name, u.last_name`,
      [classInfo.id]
    );

    // Get subjects taught in this class
    const subjectsResult = await this.executeQuery(
      `SELECT cs.id as assignment_id, s.id, s.name, s.code, s.credit_hours,
              u.first_name as teacher_first_name, u.last_name as teacher_last_name
       FROM class_subjects cs
       JOIN subjects s ON cs.subject_id = s.id
       LEFT JOIN users u ON cs.teacher_id = u.id
       WHERE cs.class_id = $1 AND s.is_active = true
       ORDER BY s.name`,
      [classInfo.id]
    );

    return {
      ...this.transformClassResponse(classInfo),
      academicYear: {
        id: academicYearResult.rows[0].id,
        name: academicYearResult.rows[0].name,
      },
      teacher,
      students: studentsResult.rows.map((student: any) => ({
        id: student.id,
        studentId: student.student_id,
        name: `${student.first_name} ${student.last_name}`,
        enrollmentDate: student.enrollment_date,
      })),
      subjects: subjectsResult.rows.map((subject: any) => ({
        assignmentId: subject.assignment_id,
        id: subject.id,
        name: subject.name,
        code: subject.code,
        creditHours: subject.credit_hours,
        teacher: subject.teacher_first_name ? {
          name: `${subject.teacher_first_name} ${subject.teacher_last_name}`,
        } : null,
      })),
    };
  }

  async updateClass(id: string, updateData: UpdateClass) {
    const existingClass = await this.checkEntityExists('classes', id, 'alt_id');
    const actualClassId = existingClass.id;

    return await this.executeTransaction(async (client) => {
      // Check if teacher is being updated
      if (updateData.teacherId !== undefined) {
        if (updateData.teacherId) {
          // Validate new teacher exists and is active
          const teacherExists = await client.query(
            'SELECT id FROM users WHERE id = $1 AND role = \'teacher\' AND is_active = true',
            [updateData.teacherId]
          );

          if (teacherExists.rows.length === 0) {
            throw new AppError('Teacher not found or inactive', 404);
          }

          // Check if teacher is already assigned to another class
          const existingAssignment = await client.query(
            'SELECT id, name, grade, section FROM classes WHERE teacher_id = $1 AND is_active = true AND id != $2',
            [updateData.teacherId, actualClassId]
          );

          if (existingAssignment.rows.length > 0) {
            const existingClass = existingAssignment.rows[0];
            throw new AppError(
              `Teacher is already assigned as main teacher to class ${existingClass.grade}-${existingClass.section}`,
              409
            );
          }
        }
      }

      // Check if grade/section combination is being updated
      if ((updateData.grade || updateData.section) && 
          (updateData.grade !== existingClass.grade || updateData.section !== existingClass.section)) {
        const newGrade = updateData.grade || existingClass.grade;
        const newSection = updateData.section || existingClass.section;

        const conflictCheck = await client.query(
          'SELECT id FROM classes WHERE grade = $1 AND section = $2 AND academic_year_id = $3 AND id != $4',
          [newGrade, newSection, existingClass.academic_year_id, actualClassId]
        );

        if (conflictCheck.rows.length > 0) {
          throw new AppError('Class with this grade and section already exists for this academic year', 409);
        }
      }

      const { query: updateQuery, values } = this.buildUpdateQuery('classes', updateData);
      values.push(actualClassId);

      const result = await client.query(updateQuery, values);
      return this.transformClassResponse(result.rows[0]);
    });
  }

  async deleteClass(id: string) {
    const existingClass = await this.checkEntityExists('classes', id, 'alt_id');
    const actualClassId = existingClass.id;

    // Check for dependencies
    const dependenciesCheck = await this.executeQuery(
      `SELECT 
         (SELECT COUNT(*) FROM students WHERE class_id = $1 AND is_active = true) as active_students,
         (SELECT COUNT(*) FROM class_subjects WHERE class_id = $1) as subject_assignments,
         (SELECT COUNT(*) FROM attendance WHERE class_id = $1) as attendance_records`,
      [actualClassId]
    );

    const dependencies = dependenciesCheck.rows[0];
    const activeStudents = parseInt(dependencies.active_students);

    if (activeStudents > 0) {
      throw new AppError(
        `Cannot delete class. It has ${activeStudents} active students. Please transfer students first.`,
        409
      );
    }

    // Soft delete the class
    await this.executeQuery(
      'UPDATE classes SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [actualClassId]
    );

    return { success: true };
  }

  private transformClassResponse(classInfo: any) {
    return {
      id: classInfo.id,
      altId: classInfo.alt_id,
      name: classInfo.name,
      grade: classInfo.grade,
      section: classInfo.section,
      teacherId: classInfo.teacher_id,
      capacity: classInfo.capacity,
      room: classInfo.room,
      description: classInfo.description,
      academicYearId: classInfo.academic_year_id,
      currentEnrollment: classInfo.current_enrollment,
      isActive: classInfo.is_active,
      createdAt: classInfo.created_at,
      updatedAt: classInfo.updated_at,
    };
  }
}
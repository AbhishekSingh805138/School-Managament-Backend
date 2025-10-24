import { BaseService } from './baseService';
import { AppError } from '../middleware/errorHandler';
import { CreateSubject, UpdateSubject } from '../types/academic';
import { getPaginationParams } from '../utils/pagination';

export class SubjectService extends BaseService {
  async createSubject(subjectData: CreateSubject) {
    // Check if subject with same code already exists
    const existingSubject = await this.executeQuery(
      'SELECT id FROM subjects WHERE code = $1',
      [subjectData.code]
    );

    if (existingSubject.rows.length > 0) {
      throw new AppError('Subject with this code already exists', 409);
    }

    // Generate sequential ID for alt_id
    const sequentialId = await this.generateSequentialId('subjects');

    // Create subject
    const result = await this.executeQuery(
      `INSERT INTO subjects (name, code, description, credit_hours, alt_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, alt_id, name, code, description, credit_hours, is_active, created_at, updated_at`,
      [
        subjectData.name,
        subjectData.code,
        subjectData.description || null,
        subjectData.creditHours || 1,
        sequentialId
      ]
    );

    return this.transformSubjectResponse(result.rows[0]);
  }

  async getSubjects(req: any) {
    const { page, limit, offset, sortBy, sortOrder } = getPaginationParams(req, 'name');
    const { isActive, search } = req.query;

    let whereClause = '';
    const queryParams: any[] = [];

    if (isActive !== undefined) {
      whereClause = 'WHERE is_active = $1';
      queryParams.push(isActive === 'true');
    }

    if (search) {
      const searchClause = isActive !== undefined ? ' AND' : 'WHERE';
      whereClause += `${searchClause} (name ILIKE $${queryParams.length + 1} OR code ILIKE $${queryParams.length + 1} OR description ILIKE $${queryParams.length + 1})`;
      queryParams.push(`%${search}%`);
    }

    // Get total count
    const countResult = await this.executeQuery(
      `SELECT COUNT(*) FROM subjects ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get subjects
    const result = await this.executeQuery(
      `SELECT id, alt_id, name, code, description, credit_hours, is_active, created_at, updated_at
       FROM subjects 
       ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      [...queryParams, limit, offset]
    );

    const subjects = result.rows.map((subject: any) => this.transformSubjectResponse(subject));

    return {
      subjects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSubjectById(id: string) {
    const subject = await this.checkEntityExists('subjects', id, 'alt_id');

    // Get classes that use this subject
    const classesResult = await this.executeQuery(
      `SELECT c.id, c.name, c.grade, c.section, ay.name as academic_year_name
       FROM class_subjects cs
       JOIN classes c ON cs.class_id = c.id
       JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE cs.subject_id = $1 AND c.is_active = true
       ORDER BY c.grade, c.section`,
      [subject.id]
    );

    // Get teachers assigned to this subject
    const teachersResult = await this.executeQuery(
      `SELECT t.id, t.employee_id, u.first_name, u.last_name
       FROM teacher_subjects ts
       JOIN teachers t ON ts.teacher_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE ts.subject_id = $1 AND t.is_active = true AND u.is_active = true
       ORDER BY u.first_name, u.last_name`,
      [subject.id]
    );

    return {
      ...this.transformSubjectResponse(subject),
      classes: classesResult.rows.map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        section: cls.section,
        academicYear: cls.academic_year_name,
      })),
      teachers: teachersResult.rows.map((teacher: any) => ({
        id: teacher.id,
        employeeId: teacher.employee_id,
        name: `${teacher.first_name} ${teacher.last_name}`,
      })),
    };
  }

  async updateSubject(id: string, updateData: UpdateSubject) {
    const existingSubject = await this.checkEntityExists('subjects', id, 'alt_id');
    const actualSubjectId = existingSubject.id;

    // Check if code is being updated and if it conflicts with another subject
    if (updateData.code && updateData.code !== existingSubject.code) {
      const codeConflict = await this.executeQuery(
        'SELECT id FROM subjects WHERE code = $1 AND id != $2',
        [updateData.code, actualSubjectId]
      );

      if (codeConflict.rows.length > 0) {
        throw new AppError('Subject with this code already exists', 409);
      }
    }

    const { query: updateQuery, values } = this.buildUpdateQuery('subjects', updateData);
    values.push(actualSubjectId);

    const result = await this.executeQuery(updateQuery, values);
    return this.transformSubjectResponse(result.rows[0]);
  }

  async deleteSubject(id: string) {
    const existingSubject = await this.checkEntityExists('subjects', id, 'alt_id');
    const actualSubjectId = existingSubject.id;

    // Check for dependencies
    const dependenciesCheck = await this.executeQuery(
      `SELECT 
         (SELECT COUNT(*) FROM class_subjects WHERE subject_id = $1) as class_assignments,
         (SELECT COUNT(*) FROM teacher_subjects WHERE subject_id = $1) as teacher_assignments,
         (SELECT COUNT(*) FROM grades WHERE subject_id = $1) as grade_records`,
      [actualSubjectId]
    );

    const dependencies = dependenciesCheck.rows[0];
    const totalDependencies = parseInt(dependencies.class_assignments) + 
                             parseInt(dependencies.teacher_assignments) + 
                             parseInt(dependencies.grade_records);

    if (totalDependencies > 0) {
      throw new AppError(
        `Cannot delete subject. It has ${dependencies.class_assignments} class assignments, ${dependencies.teacher_assignments} teacher assignments, and ${dependencies.grade_records} grade records.`,
        409
      );
    }

    // Soft delete the subject
    await this.executeQuery(
      'UPDATE subjects SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [actualSubjectId]
    );

    return { success: true };
  }

  private transformSubjectResponse(subject: any) {
    return {
      id: subject.id,
      altId: subject.alt_id,
      name: subject.name,
      code: subject.code,
      description: subject.description,
      creditHours: subject.credit_hours,
      isActive: subject.is_active,
      createdAt: subject.created_at,
      updatedAt: subject.updated_at,
    };
  }
}
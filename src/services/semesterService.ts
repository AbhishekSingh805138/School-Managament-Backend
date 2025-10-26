import { BaseService } from './baseService';
import { AppError } from '../middleware/errorHandler';
import { CreateSemester, UpdateSemester } from '../types/academic';
import { getPaginationParams } from '../utils/pagination';

export class SemesterService extends BaseService {
  async createSemester(semesterData: CreateSemester) {
    // Check if academic year exists
    const academicYearExists = await this.executeQuery(
      'SELECT id, name, start_date, end_date FROM academic_years WHERE id = $1',
      [semesterData.academicYearId]
    );

    if (academicYearExists.rows.length === 0) {
      throw new AppError('Academic year not found', 404);
    }

    const academicYear = academicYearExists.rows[0];

    // Validate semester dates are within academic year
    const semesterStart = new Date(semesterData.startDate);
    const semesterEnd = new Date(semesterData.endDate);
    const yearStart = new Date(academicYear.start_date);
    const yearEnd = new Date(academicYear.end_date);

    if (semesterStart < yearStart || semesterEnd > yearEnd) {
      throw new AppError('Semester dates must be within the academic year dates', 400);
    }

    // Check if semester with same name already exists for this academic year
    const existingSemester = await this.executeQuery(
      'SELECT id FROM semesters WHERE academic_year_id = $1 AND name = $2',
      [semesterData.academicYearId, semesterData.name]
    );

    if (existingSemester.rows.length > 0) {
      throw new AppError('Semester with this name already exists for this academic year', 409);
    }

    return await this.executeTransaction(async (client) => {
      // If setting as active, deactivate other active semesters for this academic year
      if (semesterData.isActive) {
        await client.query(
          'UPDATE semesters SET is_active = false WHERE academic_year_id = $1 AND is_active = true',
          [semesterData.academicYearId]
        );
      }

      // Generate sequential ID for alt_id
      const sequentialId = await this.generateSequentialId('semesters');

      // Create semester
      const result = await client.query(
        `INSERT INTO semesters (academic_year_id, name, start_date, end_date, is_active, alt_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, alt_id, academic_year_id, name, start_date, end_date, is_active, created_at, updated_at`,
        [
          semesterData.academicYearId,
          semesterData.name,
          semesterData.startDate,
          semesterData.endDate,
          semesterData.isActive || false,
          sequentialId
        ]
      );

      const semester = result.rows[0];

      return {
        ...this.transformSemesterResponse(semester),
        academicYear: {
          id: academicYear.id,
          name: academicYear.name,
        },
      };
    });
  }

  async getSemesters(req: any) {
    const { page, limit, offset, sortBy, sortOrder } = getPaginationParams(req, 'start_date');
    const { isActive, academicYearId } = req.query;

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];

    if (isActive !== undefined) {
      whereClause += ` AND s.is_active = $${queryParams.length + 1}`;
      queryParams.push(isActive === 'true');
    }

    if (academicYearId) {
      whereClause += ` AND s.academic_year_id = $${queryParams.length + 1}`;
      queryParams.push(academicYearId);
    }

    // Get total count
    const countResult = await this.executeQuery(
      `SELECT COUNT(*) FROM semesters s
       JOIN academic_years ay ON s.academic_year_id = ay.id
       ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get semesters
    const result = await this.executeQuery(
      `SELECT s.id, s.alt_id, s.academic_year_id, s.name, s.start_date, s.end_date, s.is_active, s.created_at, s.updated_at,
              ay.name as academic_year_name
       FROM semesters s
       JOIN academic_years ay ON s.academic_year_id = ay.id
       ${whereClause}
       ORDER BY s.${sortBy} ${sortOrder}
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      [...queryParams, limit, offset]
    );

    const semesters = result.rows.map((semester: any) => ({
      ...this.transformSemesterResponse(semester),
      academicYear: {
        id: semester.academic_year_id,
        name: semester.academic_year_name,
      },
    }));

    return {
      semesters,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSemesterById(id: string) {
    const semester = await this.checkEntityExists('semesters', id, 'alt_id');

    // Get academic year info
    const academicYearResult = await this.executeQuery(
      'SELECT id, name FROM academic_years WHERE id = $1',
      [semester.academic_year_id]
    );

    return {
      ...this.transformSemesterResponse(semester),
      academicYear: {
        id: academicYearResult.rows[0].id,
        name: academicYearResult.rows[0].name,
      },
    };
  }

  async updateSemester(id: string, updateData: UpdateSemester) {
    const existingSemester = await this.checkEntityExists('semesters', id, 'alt_id');
    const actualSemesterId = existingSemester.id;

    return await this.executeTransaction(async (client) => {
      // If setting as active, deactivate other active semesters for this academic year
      if (updateData.isActive) {
        await client.query(
          'UPDATE semesters SET is_active = false WHERE academic_year_id = $1 AND is_active = true AND id != $2',
          [existingSemester.academic_year_id, actualSemesterId]
        );
      }

      const { query: updateQuery, values } = this.buildUpdateQuery('semesters', updateData);
      values.push(actualSemesterId);

      const result = await client.query(updateQuery, values);
      return this.transformSemesterResponse(result.rows[0]);
    });
  }

  async deleteSemester(id: string) {
    const existingSemester = await this.checkEntityExists('semesters', id, 'alt_id');
    const actualSemesterId = existingSemester.id;

    // Check for dependencies
    const dependenciesCheck = await this.executeQuery(
      `SELECT 
         (SELECT COUNT(*) FROM grades WHERE semester_id = $1) as grade_records,
         (SELECT COUNT(*) FROM report_cards WHERE semester_id = $1) as report_cards`,
      [actualSemesterId]
    );

    const dependencies = dependenciesCheck.rows[0];
    const totalDependencies = parseInt(dependencies.grade_records) + parseInt(dependencies.report_cards);

    if (totalDependencies > 0) {
      throw new AppError(
        `Cannot delete semester. It has ${dependencies.grade_records} grade records and ${dependencies.report_cards} report cards.`,
        409
      );
    }

    // Delete the semester
    await this.executeQuery('DELETE FROM semesters WHERE id = $1', [actualSemesterId]);
    return { success: true };
  }

  async getActiveSemester(academicYearId?: string) {
    let whereClause = 'WHERE s.is_active = true';
    const queryParams: any[] = [];

    if (academicYearId) {
      whereClause += ' AND s.academic_year_id = $1';
      queryParams.push(academicYearId);
    }

    const result = await this.executeQuery(
      `SELECT s.id, s.alt_id, s.academic_year_id, s.name, s.start_date, s.end_date, s.is_active, s.created_at, s.updated_at,
              ay.name as academic_year_name
       FROM semesters s
       JOIN academic_years ay ON s.academic_year_id = ay.id
       ${whereClause}
       LIMIT 1`,
      queryParams
    );

    if (result.rows.length === 0) {
      throw new AppError('No active semester found', 404);
    }

    const semester = result.rows[0];
    return {
      ...this.transformSemesterResponse(semester),
      academicYear: {
        id: semester.academic_year_id,
        name: semester.academic_year_name,
      },
    };
  }

  private transformSemesterResponse(semester: any) {
    return {
      id: semester.id,
      altId: semester.alt_id,
      academicYearId: semester.academic_year_id,
      name: semester.name,
      startDate: semester.start_date,
      endDate: semester.end_date,
      isActive: semester.is_active,
      createdAt: semester.created_at,
      updatedAt: semester.updated_at,
    };
  }
}
export
 const semesterService = new SemesterService();
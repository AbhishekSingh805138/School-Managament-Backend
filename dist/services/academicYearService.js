"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicYearService = void 0;
const baseService_1 = require("./baseService");
const errorHandler_1 = require("../middleware/errorHandler");
const pagination_1 = require("../utils/pagination");
const cacheService_1 = require("./cacheService");
class AcademicYearService extends baseService_1.BaseService {
    async createAcademicYear(academicYearData) {
        const existingYear = await this.executeQuery('SELECT id FROM academic_years WHERE name = $1', [academicYearData.name]);
        if (existingYear.rows.length > 0) {
            throw new errorHandler_1.AppError('Academic year with this name already exists', 409);
        }
        const result = await this.executeTransaction(async (client) => {
            if (academicYearData.isActive) {
                await client.query('UPDATE academic_years SET is_active = false WHERE is_active = true');
            }
            const sequentialId = await this.generateSequentialId('academic_years');
            const result = await client.query(`INSERT INTO academic_years (name, start_date, end_date, is_active, alt_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, alt_id, name, start_date, end_date, is_active, created_at, updated_at`, [
                academicYearData.name,
                academicYearData.startDate,
                academicYearData.endDate,
                academicYearData.isActive || false,
                sequentialId
            ]);
            return this.transformAcademicYearResponse(result.rows[0]);
        });
        await cacheService_1.cacheService.delPattern(`${cacheService_1.CacheKeys.ACADEMIC_YEAR}*`);
        return result;
    }
    async getAcademicYears(req) {
        const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'start_date');
        const { isActive } = req.query;
        let whereClause = '';
        const queryParams = [];
        if (isActive !== undefined) {
            whereClause = 'WHERE is_active = $1';
            queryParams.push(isActive === 'true');
        }
        const countResult = await this.executeQuery(`SELECT COUNT(*) FROM academic_years ${whereClause}`, queryParams);
        const total = parseInt(countResult.rows[0].count);
        const result = await this.executeQuery(`SELECT id, alt_id, name, start_date, end_date, is_active, created_at, updated_at
       FROM academic_years 
       ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`, [...queryParams, limit, offset]);
        const academicYears = result.rows.map((year) => this.transformAcademicYearResponse(year));
        return {
            academicYears,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getAcademicYearById(id) {
        const academicYear = await this.checkEntityExists('academic_years', id, 'alt_id');
        const semestersResult = await this.executeQuery(`SELECT id, alt_id, name, start_date, end_date, is_active, created_at, updated_at
       FROM semesters WHERE academic_year_id = $1 ORDER BY start_date`, [academicYear.id]);
        const semesters = semestersResult.rows.map((semester) => ({
            id: semester.id,
            altId: semester.alt_id,
            name: semester.name,
            startDate: semester.start_date,
            endDate: semester.end_date,
            isActive: semester.is_active,
            createdAt: semester.created_at,
            updatedAt: semester.updated_at,
        }));
        return {
            ...this.transformAcademicYearResponse(academicYear),
            semesters,
        };
    }
    async updateAcademicYear(id, updateData) {
        const existingYear = await this.checkEntityExists('academic_years', id, 'alt_id');
        const actualYearId = existingYear.id;
        return await this.executeTransaction(async (client) => {
            if (updateData.isActive) {
                await client.query('UPDATE academic_years SET is_active = false WHERE is_active = true AND id != $1', [actualYearId]);
            }
            const { query: updateQuery, values } = this.buildUpdateQuery('academic_years', updateData);
            values.push(actualYearId);
            const result = await client.query(updateQuery, values);
            return this.transformAcademicYearResponse(result.rows[0]);
        });
    }
    async deleteAcademicYear(id) {
        const academicYear = await this.checkEntityExists('academic_years', id, 'alt_id');
        const actualYearId = academicYear.id;
        const dependenciesCheck = await this.executeQuery(`SELECT 
         (SELECT COUNT(*) FROM classes WHERE academic_year_id = $1) as classes_count,
         (SELECT COUNT(*) FROM semesters WHERE academic_year_id = $1) as semesters_count,
         (SELECT COUNT(*) FROM fee_categories WHERE academic_year_id = $1) as fee_categories_count`, [actualYearId]);
        const dependencies = dependenciesCheck.rows[0];
        const totalDependencies = parseInt(dependencies.classes_count) +
            parseInt(dependencies.semesters_count) +
            parseInt(dependencies.fee_categories_count);
        if (totalDependencies > 0) {
            throw new errorHandler_1.AppError(`Cannot delete academic year. It has ${dependencies.classes_count} classes, ${dependencies.semesters_count} semesters, and ${dependencies.fee_categories_count} fee categories associated with it.`, 409);
        }
        await this.executeQuery('DELETE FROM academic_years WHERE id = $1', [actualYearId]);
        return { success: true };
    }
    async getActiveAcademicYear() {
        return await cacheService_1.cacheService.cacheQuery(cacheService_1.CacheKeys.ACADEMIC_YEAR_ACTIVE, async () => {
            const result = await this.executeQuery(`SELECT id, alt_id, name, start_date, end_date, is_active, created_at, updated_at
           FROM academic_years WHERE is_active = true LIMIT 1`);
            if (result.rows.length === 0) {
                throw new errorHandler_1.AppError('No active academic year found', 404);
            }
            return this.transformAcademicYearResponse(result.rows[0]);
        }, cacheService_1.CacheTTL.ONE_HOUR);
    }
    transformAcademicYearResponse(academicYear) {
        return {
            id: academicYear.id,
            altId: academicYear.alt_id,
            name: academicYear.name,
            startDate: academicYear.start_date,
            endDate: academicYear.end_date,
            isActive: academicYear.is_active,
            createdAt: academicYear.created_at,
            updatedAt: academicYear.updated_at,
        };
    }
}
exports.AcademicYearService = AcademicYearService;
//# sourceMappingURL=academicYearService.js.map
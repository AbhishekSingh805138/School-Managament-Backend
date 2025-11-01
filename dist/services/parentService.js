"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentService = void 0;
const baseService_1 = require("./baseService");
const errorHandler_1 = require("../middleware/errorHandler");
const pagination_1 = require("../utils/pagination");
const auth_1 = require("../utils/auth");
const cacheService_1 = __importStar(require("./cacheService"));
class ParentService extends baseService_1.BaseService {
    async createParent(parentData) {
        const existingUser = await this.executeQuery('SELECT id FROM users WHERE email = $1', [parentData.email]);
        if (existingUser.rows.length > 0) {
            throw new errorHandler_1.AppError('User with this email already exists', 409);
        }
        const passwordHash = await (0, auth_1.hashPassword)(parentData.password);
        const sequentialId = await this.generateSequentialId('users');
        const result = await this.executeQuery(`INSERT INTO users (first_name, last_name, email, password_hash, role, phone, address, alt_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, alt_id, first_name, last_name, email, role, phone, address, is_active, created_at, updated_at`, [
            parentData.firstName,
            parentData.lastName,
            parentData.email,
            passwordHash,
            'parent',
            parentData.phone || null,
            parentData.address || null,
            sequentialId
        ]);
        return this.transformParentResponse(result.rows[0]);
    }
    async getParents(req) {
        const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'first_name');
        const { isActive, search } = req.query;
        const cacheKey = `parents:list:${page}:${limit}:${sortBy}:${sortOrder}:${isActive || 'all'}:${search || 'none'}`;
        if (!search) {
            return await cacheService_1.default.cacheQuery(cacheKey, async () => {
                return await this.executeParentsQuery(req);
            }, cacheService_1.CacheTTL.FIVE_MINUTES);
        }
        return await this.executeParentsQuery(req);
    }
    async executeParentsQuery(req) {
        const { page, limit, offset, sortBy, sortOrder } = (0, pagination_1.getPaginationParams)(req, 'first_name');
        const { isActive, search } = req.query;
        let whereClause = "WHERE role = 'parent'";
        const queryParams = [];
        if (isActive !== undefined) {
            whereClause += ` AND is_active = $${queryParams.length + 1}`;
            queryParams.push(isActive === 'true');
        }
        if (search) {
            whereClause += ` AND (first_name ILIKE $${queryParams.length + 1} OR last_name ILIKE $${queryParams.length + 1} OR email ILIKE $${queryParams.length + 1})`;
            queryParams.push(`%${search}%`);
        }
        const countResult = await this.executeQuery(`SELECT COUNT(*) FROM users ${whereClause}`, queryParams);
        const total = parseInt(countResult.rows[0].count);
        const result = await this.executeQuery(`SELECT id, alt_id, first_name, last_name, email, role, phone, address, is_active, created_at, updated_at
       FROM users 
       ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`, [...queryParams, limit, offset]);
        const parents = result.rows.map((parent) => this.transformParentResponse(parent));
        return {
            parents,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getParentById(id) {
        const parent = await this.checkEntityExists('users', id, 'alt_id');
        if (parent.role !== 'parent') {
            throw new errorHandler_1.AppError('User is not a parent', 400);
        }
        const childrenResult = await this.executeQuery(`SELECT sp.id as relationship_id, sp.relationship_type, sp.is_primary,
              s.id as student_id, s.student_id as student_number, s.class_id,
              u.first_name, u.last_name,
              c.name as class_name, c.grade, c.section
       FROM student_parents sp
       JOIN students s ON sp.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON s.class_id = c.id
       WHERE sp.parent_user_id = $1 AND s.is_active = true
       ORDER BY u.first_name, u.last_name`, [parent.id]);
        const children = childrenResult.rows.map((child) => ({
            relationshipId: child.relationship_id,
            relationshipType: child.relationship_type,
            isPrimary: child.is_primary,
            student: {
                id: child.student_id,
                studentId: child.student_number,
                name: `${child.first_name} ${child.last_name}`,
                class: {
                    id: child.class_id,
                    name: child.class_name,
                    grade: child.grade,
                    section: child.section,
                },
            },
        }));
        return {
            ...this.transformParentResponse(parent),
            children,
        };
    }
    async updateParent(id, updateData) {
        const existingParent = await this.checkEntityExists('users', id, 'alt_id');
        if (existingParent.role !== 'parent') {
            throw new errorHandler_1.AppError('User is not a parent', 400);
        }
        const actualParentId = existingParent.id;
        const { query: updateQuery, values } = this.buildUpdateQuery('users', updateData);
        values.push(actualParentId);
        const result = await this.executeQuery(updateQuery, values);
        return this.transformParentResponse(result.rows[0]);
    }
    async deleteParent(id) {
        const existingParent = await this.checkEntityExists('users', id, 'alt_id');
        if (existingParent.role !== 'parent') {
            throw new errorHandler_1.AppError('User is not a parent', 400);
        }
        const actualParentId = existingParent.id;
        const childrenCheck = await this.executeQuery(`SELECT COUNT(*) as children_count FROM student_parents sp
       JOIN students s ON sp.student_id = s.id
       WHERE sp.parent_user_id = $1 AND s.is_active = true`, [actualParentId]);
        const childrenCount = parseInt(childrenCheck.rows[0].children_count);
        if (childrenCount > 0) {
            throw new errorHandler_1.AppError(`Cannot delete parent. They have ${childrenCount} active children relationships. Please remove relationships first.`, 409);
        }
        await this.executeQuery('UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [actualParentId]);
        return { success: true };
    }
    async linkStudentToParent(linkData) {
        const studentExists = await this.executeQuery(`SELECT s.id, s.student_id, u.first_name, u.last_name
       FROM students s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.id = $1 AND s.is_active = true AND u.is_active = true`, [linkData.studentId]);
        if (studentExists.rows.length === 0) {
            throw new errorHandler_1.AppError('Student not found or inactive', 404);
        }
        const parentExists = await this.executeQuery('SELECT id, first_name, last_name FROM users WHERE id = $1 AND role = \'parent\' AND is_active = true', [linkData.parentUserId]);
        if (parentExists.rows.length === 0) {
            throw new errorHandler_1.AppError('Parent not found or inactive', 404);
        }
        const existingRelationship = await this.executeQuery('SELECT id FROM student_parents WHERE student_id = $1 AND parent_user_id = $2', [linkData.studentId, linkData.parentUserId]);
        if (existingRelationship.rows.length > 0) {
            throw new errorHandler_1.AppError('Relationship between student and parent already exists', 409);
        }
        return await this.executeTransaction(async (client) => {
            if (linkData.isPrimary) {
                await client.query('UPDATE student_parents SET is_primary = false WHERE student_id = $1', [linkData.studentId]);
            }
            const result = await client.query(`INSERT INTO student_parents (student_id, parent_user_id, relationship_type, is_primary)
         VALUES ($1, $2, $3, $4)
         RETURNING id, student_id, parent_user_id, relationship_type, is_primary, created_at, updated_at`, [
                linkData.studentId,
                linkData.parentUserId,
                linkData.relationshipType,
                linkData.isPrimary || false
            ]);
            const relationship = result.rows[0];
            const student = studentExists.rows[0];
            const parent = parentExists.rows[0];
            return {
                id: relationship.id,
                studentId: relationship.student_id,
                parentUserId: relationship.parent_user_id,
                relationshipType: relationship.relationship_type,
                isPrimary: relationship.is_primary,
                createdAt: relationship.created_at,
                updatedAt: relationship.updated_at,
                student: {
                    id: student.id,
                    studentId: student.student_id,
                    name: `${student.first_name} ${student.last_name}`,
                },
                parent: {
                    id: parent.id,
                    name: `${parent.first_name} ${parent.last_name}`,
                },
            };
        });
    }
    async unlinkStudentFromParent(studentId, parentUserId) {
        const existingRelationship = await this.executeQuery('SELECT id FROM student_parents WHERE student_id = $1 AND parent_user_id = $2', [studentId, parentUserId]);
        if (existingRelationship.rows.length === 0) {
            throw new errorHandler_1.AppError('Relationship between student and parent not found', 404);
        }
        await this.executeQuery('DELETE FROM student_parents WHERE student_id = $1 AND parent_user_id = $2', [studentId, parentUserId]);
        return { success: true };
    }
    async getParentChildren(parentId) {
        const parent = await this.checkEntityExists('users', parentId, 'alt_id');
        if (parent.role !== 'parent') {
            throw new errorHandler_1.AppError('User is not a parent', 400);
        }
        const childrenResult = await this.executeQuery(`SELECT sp.id as relationship_id, sp.relationship_type, sp.is_primary,
              s.id as student_id, s.student_id as student_number, s.class_id, s.enrollment_date,
              u.first_name, u.last_name, u.email,
              c.name as class_name, c.grade, c.section,
              ay.name as academic_year_name
       FROM student_parents sp
       JOIN students s ON sp.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON s.class_id = c.id
       JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE sp.parent_user_id = $1 AND s.is_active = true
       ORDER BY u.first_name, u.last_name`, [parent.id]);
        const children = childrenResult.rows.map((child) => ({
            relationshipId: child.relationship_id,
            relationshipType: child.relationship_type,
            isPrimary: child.is_primary,
            student: {
                id: child.student_id,
                studentId: child.student_number,
                name: `${child.first_name} ${child.last_name}`,
                email: child.email,
                enrollmentDate: child.enrollment_date,
                class: {
                    id: child.class_id,
                    name: child.class_name,
                    grade: child.grade,
                    section: child.section,
                    academicYear: child.academic_year_name,
                },
            },
        }));
        return {
            parent: this.transformParentResponse(parent),
            children,
            totalChildren: children.length,
        };
    }
    transformParentResponse(parent) {
        return {
            id: parent.id,
            altId: parent.alt_id,
            firstName: parent.first_name,
            lastName: parent.last_name,
            email: parent.email,
            role: parent.role,
            phone: parent.phone,
            address: parent.address,
            isActive: parent.is_active,
            createdAt: parent.created_at,
            updatedAt: parent.updated_at,
        };
    }
}
exports.ParentService = ParentService;
//# sourceMappingURL=parentService.js.map
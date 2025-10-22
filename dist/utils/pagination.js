"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginationParams = void 0;
const COLUMN_MAPPINGS = {
    firstName: 'first_name',
    lastName: 'last_name',
    dateOfBirth: 'date_of_birth',
    isActive: 'is_active',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    startDate: 'start_date',
    endDate: 'end_date',
    creditHours: 'credit_hours',
    academicYearId: 'academic_year_id',
    classId: 'class_id',
    studentId: 'student_id',
    parentUserId: 'parent_user_id',
    relationshipType: 'relationship_type'
};
const getPaginationParams = (req, defaultSortBy = 'created_at', columnMappings = {}) => {
    const { page: rawPage, limit: rawLimit, sortBy = defaultSortBy, sortOrder = 'asc' } = req.query;
    const page = Math.max(1, Number(rawPage) || 1);
    const limit = Math.max(1, Math.min(100, Number(rawLimit) || 10));
    const offset = (page - 1) * limit;
    const allMappings = { ...COLUMN_MAPPINGS, ...columnMappings };
    const mappedSortBy = allMappings[sortBy] || sortBy;
    return {
        page,
        limit,
        offset,
        sortBy: mappedSortBy,
        sortOrder: (sortOrder === 'desc' ? 'desc' : 'asc')
    };
};
exports.getPaginationParams = getPaginationParams;
//# sourceMappingURL=pagination.js.map
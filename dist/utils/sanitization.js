"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIELD_DEFINITIONS = exports.sanitizeRequestBody = exports.sanitizeField = exports.sanitizeObject = exports.sanitizeUUID = exports.sanitizeUrl = exports.sanitizeDate = exports.sanitizeBoolean = exports.sanitizeNumber = exports.sanitizePhone = exports.sanitizeEmail = exports.sanitizeString = void 0;
const validator_1 = __importDefault(require("validator"));
const xss_1 = require("xss");
const xssOptions = {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script'],
};
const sanitizeString = (input) => {
    if (typeof input !== 'string') {
        return '';
    }
    let sanitized = (0, xss_1.filterXSS)(input, xssOptions);
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on(?:error|load|click|focus)\b/gi, '');
    sanitized = sanitized.replace(/\b(DROP\s+TABLE|UNION\s+SELECT|INSERT\s+INTO|EXEC\s+xp_cmdshell)\b/gi, '');
    sanitized = sanitized.replace(/--/g, '');
    sanitized = sanitized.replace(/\/\*|\*\//g, '');
    sanitized = sanitized.replace(/\bOR\b/gi, '');
    sanitized = sanitized.trim();
    sanitized = sanitized.replace(/\0/g, '');
    return sanitized;
};
exports.sanitizeString = sanitizeString;
const sanitizeEmail = (email) => {
    if (typeof email !== 'string') {
        return '';
    }
    let sanitized = (0, exports.sanitizeString)(email).toLowerCase();
    const atIdx = sanitized.indexOf('@');
    if (atIdx === -1)
        return '';
    let local = sanitized.slice(0, atIdx);
    const domain = sanitized.slice(atIdx + 1);
    const plusIdx = local.indexOf('+');
    if (plusIdx !== -1)
        local = local.slice(0, plusIdx);
    local = local.replace(/\./g, '');
    const normalized = `${local}@${domain}`;
    return validator_1.default.isEmail(normalized) ? normalized : '';
};
exports.sanitizeEmail = sanitizeEmail;
const sanitizePhone = (phone) => {
    if (typeof phone !== 'string') {
        return '';
    }
    let sanitized = phone.replace(/<[^>]*>/g, '');
    sanitized = sanitized.replace(/[^0-9\s\+\-\(\)]/g, '');
    sanitized = sanitized.replace(/\(\s*\)/g, '');
    return sanitized.trim();
};
exports.sanitizePhone = sanitizePhone;
const sanitizeNumber = (input) => {
    if (typeof input === 'number') {
        return isNaN(input) ? null : input;
    }
    if (typeof input === 'string') {
        const sanitized = (0, exports.sanitizeString)(input);
        const num = parseFloat(sanitized);
        return isNaN(num) ? null : num;
    }
    return null;
};
exports.sanitizeNumber = sanitizeNumber;
const sanitizeBoolean = (input) => {
    if (typeof input === 'boolean') {
        return input;
    }
    if (typeof input === 'string') {
        const sanitized = (0, exports.sanitizeString)(input).toLowerCase();
        return sanitized === 'true' || sanitized === '1' || sanitized === 'yes';
    }
    return false;
};
exports.sanitizeBoolean = sanitizeBoolean;
const sanitizeDate = (input) => {
    if (!input) {
        return null;
    }
    if (typeof input === 'string') {
        const sanitized = (0, exports.sanitizeString)(input);
        if (validator_1.default.isISO8601(sanitized) || validator_1.default.isDate(sanitized)) {
            return sanitized;
        }
    }
    return null;
};
exports.sanitizeDate = sanitizeDate;
const sanitizeUrl = (input) => {
    if (typeof input !== 'string') {
        return null;
    }
    const sanitized = (0, exports.sanitizeString)(input);
    if (validator_1.default.isURL(sanitized, {
        protocols: ['http', 'https'],
        require_protocol: true,
    })) {
        return sanitized;
    }
    return null;
};
exports.sanitizeUrl = sanitizeUrl;
const sanitizeUUID = (input) => {
    if (typeof input !== 'string') {
        return null;
    }
    const sanitized = (0, exports.sanitizeString)(input);
    if (validator_1.default.isUUID(sanitized)) {
        return sanitized;
    }
    return null;
};
exports.sanitizeUUID = sanitizeUUID;
const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (typeof obj === 'string') {
        return (0, exports.sanitizeString)(obj);
    }
    if (typeof obj === 'number' || typeof obj === 'boolean') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => (0, exports.sanitizeObject)(item));
    }
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            const sanitizedKey = (0, exports.sanitizeString)(key);
            sanitized[sanitizedKey] = (0, exports.sanitizeObject)(value);
        }
        return sanitized;
    }
    return obj;
};
exports.sanitizeObject = sanitizeObject;
const sanitizeField = (value, fieldType) => {
    switch (fieldType) {
        case 'email':
            return (0, exports.sanitizeEmail)(value);
        case 'phone':
            return (0, exports.sanitizePhone)(value);
        case 'number':
            return (0, exports.sanitizeNumber)(value);
        case 'boolean':
            return (0, exports.sanitizeBoolean)(value);
        case 'date':
            return (0, exports.sanitizeDate)(value);
        case 'url':
            return (0, exports.sanitizeUrl)(value);
        case 'uuid':
            return (0, exports.sanitizeUUID)(value);
        case 'string':
        default:
            return (0, exports.sanitizeString)(value);
    }
};
exports.sanitizeField = sanitizeField;
const sanitizeRequestBody = (body, fieldDefinitions) => {
    if (!body || typeof body !== 'object') {
        return {};
    }
    const sanitized = {};
    for (const [field, type] of Object.entries(fieldDefinitions)) {
        if (body.hasOwnProperty(field)) {
            let value = (0, exports.sanitizeField)(body[field], type);
            if (type === 'phone' && typeof value === 'string') {
                value = value.replace(/\s+/g, '');
            }
            sanitized[field] = value;
        }
    }
    for (const [field, value] of Object.entries(body)) {
        if (!fieldDefinitions.hasOwnProperty(field)) {
            sanitized[field] = (0, exports.sanitizeObject)(value);
        }
    }
    return sanitized;
};
exports.sanitizeRequestBody = sanitizeRequestBody;
exports.FIELD_DEFINITIONS = {
    user: {
        firstName: 'string',
        lastName: 'string',
        email: 'email',
        phone: 'phone',
        dateOfBirth: 'date',
        address: 'string',
        role: 'string',
    },
    academicYear: {
        name: 'string',
        startDate: 'date',
        endDate: 'date',
        description: 'string',
    },
    semester: {
        name: 'string',
        startDate: 'date',
        endDate: 'date',
        academicYearId: 'uuid',
    },
    subject: {
        name: 'string',
        code: 'string',
        description: 'string',
        creditHours: 'number',
    },
    class: {
        name: 'string',
        grade: 'string',
        section: 'string',
        capacity: 'number',
        room: 'string',
        academicYearId: 'uuid',
        teacherId: 'uuid',
    },
    teacher: {
        firstName: 'string',
        lastName: 'string',
        email: 'email',
        phone: 'phone',
        dateOfBirth: 'date',
        address: 'string',
        employeeId: 'string',
        qualification: 'string',
        experienceYears: 'number',
        specialization: 'string',
        joiningDate: 'date',
        salary: 'number',
    },
};
//# sourceMappingURL=sanitization.js.map
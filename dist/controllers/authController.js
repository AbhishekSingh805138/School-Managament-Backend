"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.login = exports.register = void 0;
const connection_1 = require("../database/connection");
const auth_1 = require("../utils/auth");
const errorHandler_1 = require("../middleware/errorHandler");
exports.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    console.log('Register request received');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    const userData = req.body;
    const existingUser = await (0, connection_1.query)('SELECT id FROM users WHERE email = $1', [userData.email]);
    if (existingUser.rows.length > 0) {
        throw new errorHandler_1.AppError('User with this email already exists', 409);
    }
    const passwordHash = await (0, auth_1.hashPassword)(userData.password);
    const seqIdResult = await (0, connection_1.query)('SELECT generate_sequential_id($1) as next_id', ['users']);
    const sequentialId = seqIdResult.rows[0].next_id;
    const result = await (0, connection_1.query)(`INSERT INTO users (first_name, last_name, email, password_hash, role, phone, date_of_birth, address, alt_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, alt_id, first_name, last_name, email, role, phone, date_of_birth, address, is_active, created_at, updated_at`, [
        userData.firstName,
        userData.lastName,
        userData.email,
        passwordHash,
        userData.role,
        userData.phone || null,
        userData.dateOfBirth || null,
        userData.address || null,
        sequentialId.toString(),
    ]);
    const user = result.rows[0];
    const token = (0, auth_1.generateToken)({
        id: user.id,
        email: user.email,
        role: user.role,
    });
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: {
                id: user.id,
                altId: user.alt_id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                dateOfBirth: user.date_of_birth,
                address: user.address,
                isActive: user.is_active,
                createdAt: user.created_at,
                updatedAt: user.updated_at,
            },
            token,
        },
    });
});
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    console.log('Login request received');
    const { email, password } = req.body;
    const result = await (0, connection_1.query)('SELECT id, first_name, last_name, email, password_hash, role, phone, date_of_birth, address, is_active FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
        throw new errorHandler_1.AppError('Invalid email or password', 401);
    }
    const user = result.rows[0];
    if (!user.is_active) {
        throw new errorHandler_1.AppError('Account is deactivated', 401);
    }
    const isPasswordValid = await (0, auth_1.comparePassword)(password, user.password_hash);
    if (!isPasswordValid) {
        throw new errorHandler_1.AppError('Invalid email or password', 401);
    }
    const token = (0, auth_1.generateToken)({
        id: user.id,
        email: user.email,
        role: user.role,
    });
    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                dateOfBirth: user.date_of_birth,
                address: user.address,
                isActive: user.is_active,
            },
            token,
        },
    });
});
exports.getProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    console.log('Get profile request received');
    const userId = req.user?.id;
    const result = await (0, connection_1.query)('SELECT id, first_name, last_name, email, role, phone, date_of_birth, address, is_active, created_at, updated_at FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
        throw new errorHandler_1.AppError('User not found', 404);
    }
    const user = result.rows[0];
    res.json({
        success: true,
        data: {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            dateOfBirth: user.date_of_birth,
            address: user.address,
            isActive: user.is_active,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
        },
    });
});
//# sourceMappingURL=authController.js.map
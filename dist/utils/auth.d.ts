import jwt from 'jsonwebtoken';
import { UserRole } from '../types/user';
export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (password: string, hashedPassword: string) => Promise<boolean>;
export declare const generateAccessToken: (payload: {
    id: string;
    email: string;
    role: UserRole;
}) => string;
export declare const generateRefreshToken: (payload: {
    id: string;
    email: string;
    role: UserRole;
}) => string;
export declare const generateTokens: (payload: {
    id: string;
    email: string;
    role: UserRole;
}) => {
    accessToken: string;
    refreshToken: string;
};
export declare const generateToken: (payload: {
    id: string;
    email: string;
    role: UserRole;
}) => string;
export declare const verifyToken: (token: string) => string | jwt.JwtPayload;
export declare const isTokenExpired: (token: string) => boolean;
//# sourceMappingURL=auth.d.ts.map
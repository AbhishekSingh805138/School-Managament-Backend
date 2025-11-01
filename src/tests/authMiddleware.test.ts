import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { query } from '../database/connection';

// Mock the database connection
jest.mock('../database/connection');
const mockQuery = query as jest.MockedFunction<typeof query>;

// Authentication Middleware Unit Tests
describe('Authentication Middleware Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = { headers: {} };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    } as any;
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate middleware', () => {
    it('should authenticate valid Bearer token and attach user', async () => {
      const tokenPayload = { id: '00000000-0000-0000-0000-000000000001', email: 'admin@test.com', role: 'admin' } as any;
      jest.spyOn(jwt, 'verify').mockReturnValue(tokenPayload);
      mockQuery.mockResolvedValueOnce({ rows: [{ id: tokenPayload.id, email: tokenPayload.email, role: tokenPayload.role, is_active: true }] } as any);

      (mockRequest as any).headers = { authorization: 'Bearer test-token' };
      await (authenticate as any)(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockRequest as any).user).toEqual({ id: tokenPayload.id, email: tokenPayload.email, role: tokenPayload.role });
    });

    it('should reject missing token', async () => {
      (mockRequest as any).headers = {};
      await (authenticate as any)(mockRequest, mockResponse, (err: any) => {
        expect(err).toBeInstanceOf(Error);
      });
    });
  });

  describe('authorize middleware', () => {
    it('should allow when user has required role', async () => {
      (mockRequest as any).user = { id: 'u', email: 'e', role: 'admin' };
      const mw = (authorize as any)('admin');
      await mw(mockRequest, mockResponse, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny when user lacks required role', async () => {
      (mockRequest as any).user = { id: 'u', email: 'e', role: 'student' };
      const mw = (authorize as any)('admin');
      await mw(mockRequest, mockResponse, (err: any) => {
        expect(err).toBeInstanceOf(Error);
      });
    });
  });

  describe('optionalAuth middleware', () => {
    it('should not fail when no token provided', async () => {
      (mockRequest as any).headers = {};
      await optionalAuth(mockRequest as any, mockResponse as any, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

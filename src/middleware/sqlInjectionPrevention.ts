import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

// Very conservative pattern to catch obvious SQLi attempts in URL/query/body
// Note: Real protection is parameterized queries; this is an early warning/guardrail
const suspiciousPattern = /(--|;|\/\*|\*\/|\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|EXEC)\b)/i;

export const preventSQLInjection = (req: Request, res: Response, next: NextFunction) => {
  try {
    const payloads = [req.query, req.params, req.body];
    for (const p of payloads) {
      if (p && JSON.stringify(p).match(suspiciousPattern)) {
        throw new AppError('Potential SQL injection detected', 401, 'SQLI_DETECTED');
      }
    }
    next();
  } catch (e) {
    next(e);
  }
};

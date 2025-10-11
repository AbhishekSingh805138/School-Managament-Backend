import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

// Validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body, query, and params
      const validatedData = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Replace request data with validated data
      if (validatedData.body) {
        req.body = validatedData.body;
      }
      if (validatedData.query) {
        Object.keys(req.query).forEach(key => delete req.query[key]);
        Object.assign(req.query, validatedData.query);
      }
      if (validatedData.params) {
        Object.keys(req.params).forEach(key => delete req.params[key]);
        Object.assign(req.params, validatedData.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorMessages,
        });
        return;
      }

      next(error);
    }
  };
};

// Body validation middleware
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Validating body:', req.body);
      req.body = schema.parse(req.body);
      console.log('Validation passed');
      next();
    } catch (error) {
      console.log('Validation error:', error);
      if (error instanceof ZodError) {
        console.log('Zod errors:', error.errors);
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorMessages,
        });
        return;
      }

      next(error);
    }
  };
};

// Query validation middleware
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = schema.parse(req.query);
      // Replace query object properties instead of the whole object
      Object.keys(req.query).forEach(key => delete req.query[key]);
      Object.assign(req.query, validatedQuery);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          message: 'Query validation failed',
          errors: errorMessages,
        });
        return;
      }

      next(error);
    }
  };
};

// Params validation middleware
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedParams = schema.parse(req.params);
      // Replace params object properties instead of the whole object
      Object.keys(req.params).forEach(key => delete req.params[key]);
      Object.assign(req.params, validatedParams);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          message: 'Parameter validation failed',
          errors: errorMessages,
        });
        return;
      }

      next(error);
    }
  };
};

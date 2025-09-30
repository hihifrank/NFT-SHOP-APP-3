import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import ErrorHandler from './errorHandler';

class ValidationMiddleware {
  // Middleware to handle validation results
  static handleValidationErrors(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(error => ({
        field: error.type === 'field' ? (error as any).path : error.type,
        message: error.msg,
        value: error.type === 'field' ? (error as any).value : undefined,
      }));

      const error = ErrorHandler.createError(
        'Validation failed',
        400,
        'VALIDATION_ERROR',
        { errors: formattedErrors }
      );

      return next(error);
    }

    next();
  }

  // Helper to create validation middleware chain
  static validate(validations: ValidationChain[]) {
    return [
      ...validations,
      ValidationMiddleware.handleValidationErrors,
    ];
  }
}

export default ValidationMiddleware;
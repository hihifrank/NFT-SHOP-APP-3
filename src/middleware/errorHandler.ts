import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import config from '../config';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

class ErrorHandler {
  static handle(err: ApiError, req: Request, res: Response, next: NextFunction) {
    // Log error details
    logger.error('API Error:', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Default error response
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    
    const errorResponse: any = {
      success: false,
      error: {
        message,
        code: err.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      },
    };

    // Include additional details in development
    if (config.environment !== 'production') {
      errorResponse.error.stack = err.stack;
      errorResponse.error.details = err.details;
    }

    res.status(status).json(errorResponse);
  }

  static notFound(req: Request, res: Response) {
    res.status(404).json({
      success: false,
      error: {
        message: 'Endpoint not found',
        code: 'NOT_FOUND',
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      },
    });
  }

  static createError(message: string, status: number = 500, code?: string, details?: any): ApiError {
    const error = new Error(message) as ApiError;
    error.status = status;
    error.code = code;
    error.details = details;
    return error;
  }
}

export default ErrorHandler;
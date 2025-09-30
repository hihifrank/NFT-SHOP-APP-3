import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import ErrorHandler from './errorHandler';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    walletAddress: string;
    email?: string;
    preferredLanguage: string;
  };
}

class AuthMiddleware {
  // Middleware to verify JWT token
  static async verifyToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const error = ErrorHandler.createError(
          'Access token is required',
          401,
          'MISSING_TOKEN'
        );
        return next(error);
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as any;
        
        // Attach user info to request
        req.user = {
          id: decoded.userId,
          walletAddress: decoded.walletAddress,
          email: decoded.email,
          preferredLanguage: decoded.preferredLanguage || 'zh-HK',
        };

        next();
      } catch (jwtError) {
        logger.warn('Invalid JWT token:', { token: token.substring(0, 20) + '...', error: jwtError });
        
        const error = ErrorHandler.createError(
          'Invalid or expired token',
          401,
          'INVALID_TOKEN'
        );
        return next(error);
      }
    } catch (error) {
      logger.error('Auth middleware error:', error);
      const authError = ErrorHandler.createError(
        'Authentication failed',
        500,
        'AUTH_ERROR'
      );
      return next(authError);
    }
  }

  // Optional authentication - doesn't fail if no token provided
  static async optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    // Use the same verification logic but don't fail on error
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      
      req.user = {
        id: decoded.userId,
        walletAddress: decoded.walletAddress,
        email: decoded.email,
        preferredLanguage: decoded.preferredLanguage || 'zh-HK',
      };
    } catch (error) {
      // Log but don't fail
      logger.debug('Optional auth failed:', error);
    }

    next();
  }

  // Generate JWT token
  static generateToken(payload: {
    userId: string;
    walletAddress: string;
    email?: string;
    preferredLanguage?: string;
  }): string {
    return jwt.sign(
      {
        userId: payload.userId,
        walletAddress: payload.walletAddress,
        email: payload.email,
        preferredLanguage: payload.preferredLanguage,
      },
      config.jwtSecret,
      {
        expiresIn: '7d', // Token expires in 7 days
        issuer: 'hk-retail-nft-platform',
        audience: 'hk-retail-nft-users',
      }
    );
  }

  // Verify token without middleware (for direct use)
  static verifyTokenSync(token: string): any {
    try {
      return jwt.verify(token, config.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

export default AuthMiddleware;
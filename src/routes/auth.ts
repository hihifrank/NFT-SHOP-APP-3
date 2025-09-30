import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { rateLimiter, validation } from '../middleware';
import AuthMiddleware, { AuthenticatedRequest } from '../middleware/auth';
import AuthService from '../services/authService';
import ErrorHandler from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const authService = AuthService.getInstance();

/**
 * @swagger
 * /api/v1/auth/nonce:
 *   post:
 *     summary: Get nonce for wallet authentication
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 description: User's wallet address
 *     responses:
 *       200:
 *         description: Nonce generated successfully
 *       400:
 *         description: Invalid wallet address
 */
router.post('/nonce', 
  rateLimiter.auth,
  validation.validate([
    body('walletAddress')
      .isString()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { walletAddress } = req.body;
      
      const result = authService.generateNonce(walletAddress);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Nonce generation error:', error);
      const err = ErrorHandler.createError('Failed to generate nonce', 500, 'NONCE_ERROR');
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/v1/auth/wallet:
 *   post:
 *     summary: Authenticate user with wallet signature
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *               - signature
 *               - message
 *             properties:
 *               walletAddress:
 *                 type: string
 *               signature:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/wallet',
  rateLimiter.auth,
  validation.validate([
    body('walletAddress')
      .isString()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
    body('signature')
      .isString()
      .notEmpty()
      .withMessage('Signature is required'),
    body('message')
      .isString()
      .notEmpty()
      .withMessage('Message is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { walletAddress, signature, message } = req.body;
      
      const result = await authService.authenticateWallet({
        walletAddress,
        signature,
        message,
      });
      
      if (!result.success) {
        const error = ErrorHandler.createError(
          result.error || 'Authentication failed',
          401,
          'AUTH_FAILED'
        );
        return next(error);
      }
      
      res.json({
        success: true,
        data: {
          token: result.token,
          user: result.user,
        },
      });
    } catch (error) {
      logger.error('Wallet authentication error:', error);
      const err = ErrorHandler.createError('Authentication failed', 500, 'AUTH_ERROR');
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user with email/password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: User's password
 *               walletAddress:
 *                 type: string
 *                 description: Optional wallet address
 *               preferredLanguage:
 *                 type: string
 *                 enum: [zh-HK, zh-CN, en]
 *                 default: zh-HK
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: User already exists
 */
router.post('/register',
  rateLimiter.auth,
  validation.validate([
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    body('walletAddress')
      .optional()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
    body('preferredLanguage')
      .optional()
      .isIn(['zh-HK', 'zh-CN', 'en'])
      .withMessage('Invalid language preference'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, walletAddress, preferredLanguage } = req.body;
      
      const result = await authService.registerUser({
        email,
        password,
        walletAddress,
        preferredLanguage,
      });
      
      if (!result.success) {
        const statusCode = result.error?.includes('already exists') ? 409 : 400;
        const error = ErrorHandler.createError(
          result.error || 'Registration failed',
          statusCode,
          'REGISTRATION_FAILED'
        );
        return next(error);
      }
      
      res.status(201).json({
        success: true,
        data: {
          token: result.token,
          user: result.user,
        },
      });
    } catch (error) {
      logger.error('User registration error:', error);
      const err = ErrorHandler.createError('Registration failed', 500, 'REGISTRATION_ERROR');
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login',
  rateLimiter.auth,
  validation.validate([
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      
      const result = await authService.loginUser(email, password);
      
      if (!result.success) {
        const error = ErrorHandler.createError(
          result.error || 'Invalid credentials',
          401,
          'LOGIN_FAILED'
        );
        return next(error);
      }
      
      res.json({
        success: true,
        data: {
          token: result.token,
          user: result.user,
        },
      });
    } catch (error) {
      logger.error('User login error:', error);
      const err = ErrorHandler.createError('Login failed', 500, 'LOGIN_ERROR');
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/v1/auth/verify:
 *   post:
 *     summary: Verify JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Invalid or expired token
 */
router.post('/verify',
  AuthMiddleware.verifyToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      // If we reach here, the token is valid (verified by middleware)
      res.json({
        success: true,
        data: {
          user: req.user,
          message: 'Token is valid',
        },
      });
    } catch (error) {
      logger.error('Token verification error:', error);
      const err = ErrorHandler.createError('Token verification failed', 500, 'VERIFY_ERROR');
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or expired token
 */
router.post('/refresh',
  AuthMiddleware.verifyToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.user) {
        const error = ErrorHandler.createError('User not found', 401, 'USER_NOT_FOUND');
        return next(error);
      }

      // Generate new token
      const newToken = AuthMiddleware.generateToken({
        userId: req.user.id,
        walletAddress: req.user.walletAddress,
        email: req.user.email,
        preferredLanguage: req.user.preferredLanguage,
      });

      res.json({
        success: true,
        data: {
          token: newToken,
          user: req.user,
        },
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      const err = ErrorHandler.createError('Token refresh failed', 500, 'REFRESH_ERROR');
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user (client-side token removal)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout',
  AuthMiddleware.optionalAuth,
  async (req: AuthenticatedRequest, res) => {
    // Since we're using stateless JWT tokens, logout is handled client-side
    // This endpoint exists for consistency and potential future token blacklisting
    
    logger.info('User logout', {
      userId: req.user?.id,
      walletAddress: req.user?.walletAddress,
    });

    res.json({
      success: true,
      data: {
        message: 'Logout successful. Please remove the token from client storage.',
      },
    });
  }
);

export default router;
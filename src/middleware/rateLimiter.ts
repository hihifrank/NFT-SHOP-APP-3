import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Blockchain transaction rate limiter
export const blockchainLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 blockchain transactions per minute
  message: {
    success: false,
    error: {
      message: 'Too many blockchain transactions, please wait before trying again',
      code: 'BLOCKCHAIN_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 minute',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  general: generalLimiter,
  auth: authLimiter,
  blockchain: blockchainLimiter,
};
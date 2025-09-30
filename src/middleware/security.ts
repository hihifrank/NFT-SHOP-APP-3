import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import config from '../config';

// Enhanced security headers configuration
const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://polygon-rpc.com", "https://rpc-mumbai.maticvigil.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for Web3 compatibility
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Custom security middleware for API-specific headers
const apiSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Add custom API security headers
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Add response time header for monitoring (before response is sent)
  const startTime = Date.now();
  const originalSend = res.send;
  res.send = function(body) {
    const responseTime = Date.now() - startTime;
    res.setHeader('X-Response-Time', responseTime);
    return originalSend.call(this, body);
  };

  next();
};

export default [securityMiddleware, apiSecurityHeaders];
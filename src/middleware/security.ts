import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import config from '../config';
import DDoSProtection from './ddosProtection';
import InputSanitization from './inputSanitization';
import HTTPSEnforcement from './httpsEnforcement';

// Enhanced security headers configuration
const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-eval'"], // Required for Web3
      connectSrc: [
        "'self'", 
        "https://polygon-rpc.com", 
        "https://rpc-mumbai.maticvigil.com",
        "https://polygon-mumbai.g.alchemy.com",
        "https://gateway.pinata.cloud",
        "wss://polygon-mumbai.g.alchemy.com",
        "wss://ws-mumbai.maticvigil.com"
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for Web3 compatibility
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin for API
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});

// Custom security middleware for API-specific headers
const apiSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Add custom API security headers
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-Download-Options', 'noopen');
  
  // Security headers for API responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  // Add response time header for monitoring (before response is sent)
  const startTime = Date.now();
  const originalSend = res.send;
  res.send = function(body) {
    const responseTime = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    return originalSend.call(this, body);
  };

  next();
};

// Request logging for security monitoring
const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.headers['cf-connecting-ip'] as string ||
                   req.headers['x-real-ip'] as string ||
                   req.headers['x-forwarded-for']?.toString().split(',')[0] ||
                   req.connection.remoteAddress ||
                   'unknown';

  const userAgent = req.headers['user-agent'] || 'unknown';
  const method = req.method;
  const url = req.originalUrl;
  const timestamp = new Date().toISOString();

  // Log security-relevant requests
  if (method !== 'GET' || url.includes('/auth') || url.includes('/admin')) {
    console.log(`🔐 Security Log: ${timestamp} - ${clientIP} - ${method} ${url} - ${userAgent}`);
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /javascript:/i,  // JavaScript injection
    /vbscript:/i,  // VBScript injection
    /onload=/i,  // Event handler injection
  ];

  const fullUrl = `${url}${JSON.stringify(req.body)}${JSON.stringify(req.query)}`;
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(fullUrl));

  if (isSuspicious) {
    console.warn(`🚨 Suspicious request detected: ${clientIP} - ${method} ${url}`);
    console.warn(`🚨 Request details: ${JSON.stringify({ body: req.body, query: req.query })}`);
  }

  next();
};

// Content type validation
const contentTypeValidation = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type'];
    
    if (!contentType) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Content-Type header is required',
          code: 'MISSING_CONTENT_TYPE',
        },
      });
    }

    // Allow only specific content types
    const allowedTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
    ];

    const isAllowed = allowedTypes.some(type => contentType.includes(type));
    
    if (!isAllowed) {
      return res.status(415).json({
        success: false,
        error: {
          message: 'Unsupported content type',
          code: 'UNSUPPORTED_CONTENT_TYPE',
          allowedTypes,
        },
      });
    }
  }

  return next();
};

// Complete security middleware stack
const securityStack = [
  // HTTPS enforcement (first)
  ...HTTPSEnforcement.securityStack,
  
  // DDoS protection
  DDoSProtection.blockSuspiciousIPs,
  DDoSProtection.botDetection,
  DDoSProtection.requestSizeMonitor,
  
  // Input sanitization
  InputSanitization.sanitizeInput,
  
  // Content validation
  contentTypeValidation,
  
  // Security headers
  securityMiddleware,
  apiSecurityHeaders,
  
  // Security logging
  securityLogger,
];

// Security status endpoint data
const getSecurityStatus = () => {
  return {
    httpsStatus: HTTPSEnforcement.getHTTPSStatus(),
    ddosProtection: DDoSProtection.getProtectionStatus(),
    securityHeaders: {
      helmet: true,
      customHeaders: true,
      contentTypeValidation: true,
    },
    inputSanitization: {
      htmlSanitization: true,
      sqlInjectionPrevention: true,
      noSqlInjectionPrevention: true,
    },
    environment: config.environment,
    timestamp: new Date().toISOString(),
  };
};

export default securityStack;
export { getSecurityStatus, DDoSProtection, InputSanitization, HTTPSEnforcement };
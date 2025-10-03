import { Request, Response, NextFunction } from 'express';
import config from '../config';

// HTTPS enforcement and secure connection middleware
class HTTPSEnforcement {
  // Force HTTPS in production
  static enforceHTTPS = (req: Request, res: Response, next: NextFunction) => {
    // Skip HTTPS enforcement in development and test environments
    if (config.environment === 'development' || config.environment === 'test') {
      return next();
    }

    // Check if request is already secure
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      return next();
    }

    // Check for load balancer headers (common in cloud deployments)
    const forwardedProto = req.headers['x-forwarded-proto'];
    const cloudflareScheme = req.headers['cf-visitor'];
    
    if (forwardedProto === 'https' || 
        (cloudflareScheme && JSON.parse(cloudflareScheme as string).scheme === 'https')) {
      return next();
    }

    // Redirect to HTTPS
    const httpsUrl = `https://${req.headers.host}${req.url}`;
    console.log(`🔒 Redirecting HTTP to HTTPS: ${req.url} -> ${httpsUrl}`);
    
    return res.redirect(301, httpsUrl);
  };

  // Strict Transport Security (HSTS) middleware
  static setHSTS = (req: Request, res: Response, next: NextFunction) => {
    if (config.environment === 'production') {
      // Set HSTS header for 1 year, include subdomains, and allow preloading
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    next();
  };

  // Secure cookie settings
  static secureSession = (req: Request, res: Response, next: NextFunction) => {
    // Override res.cookie to ensure secure settings
    const originalCookie = res.cookie.bind(res);
    
    res.cookie = function(name: string, value: any, options: any = {}) {
      // Force secure settings in production
      if (config.environment === 'production') {
        options.secure = true;
        options.httpOnly = true;
        options.sameSite = 'strict';
      }
      
      // Set secure defaults for all environments
      options.httpOnly = options.httpOnly !== false;
      options.sameSite = options.sameSite || 'lax';
      
      return originalCookie(name, value, options);
    };

    return next();
  };

  // Check for secure headers from reverse proxies
  static checkProxyHeaders = (req: Request, res: Response, next: NextFunction) => {
    // Log security-relevant headers for monitoring
    const securityHeaders = {
      'x-forwarded-proto': req.headers['x-forwarded-proto'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-real-ip': req.headers['x-real-ip'],
      'cf-connecting-ip': req.headers['cf-connecting-ip'],
      'x-forwarded-host': req.headers['x-forwarded-host'],
    };

    // Add proxy information to request for logging
    (req as any).proxyInfo = securityHeaders;

    // Validate proxy headers to prevent header injection
    for (const [header, value] of Object.entries(securityHeaders)) {
      if (value && typeof value === 'string') {
        // Check for suspicious patterns in proxy headers
        if (value.includes('\n') || value.includes('\r') || value.includes('\0')) {
          console.warn(`🚨 Suspicious proxy header detected: ${header} = ${value}`);
          return res.status(400).json({
            success: false,
            error: {
              message: 'Invalid proxy headers detected',
              code: 'INVALID_PROXY_HEADERS',
            },
          });
        }
      }
    }

    return next();
  };

  // Mixed content prevention
  static preventMixedContent = (req: Request, res: Response, next: NextFunction) => {
    if (config.environment === 'production') {
      // Prevent mixed content by upgrading insecure requests
      res.setHeader('Content-Security-Policy', 'upgrade-insecure-requests');
    }
    next();
  };

  // Certificate transparency monitoring
  static certificateTransparency = (req: Request, res: Response, next: NextFunction) => {
    if (config.environment === 'production') {
      // Expect Certificate Transparency
      res.setHeader('Expect-CT', 'max-age=86400, enforce');
    }
    next();
  };

  // Complete HTTPS security middleware stack
  static securityStack = [
    HTTPSEnforcement.checkProxyHeaders,
    HTTPSEnforcement.enforceHTTPS,
    HTTPSEnforcement.setHSTS,
    HTTPSEnforcement.secureSession,
    HTTPSEnforcement.preventMixedContent,
    HTTPSEnforcement.certificateTransparency,
  ];

  // Health check for HTTPS configuration
  static getHTTPSStatus() {
    return {
      environment: config.environment,
      httpsEnforced: config.environment === 'production',
      hstsEnabled: config.environment === 'production',
      secureSessionsEnabled: true,
      mixedContentPrevention: config.environment === 'production',
      certificateTransparency: config.environment === 'production',
    };
  }
}

export default HTTPSEnforcement;
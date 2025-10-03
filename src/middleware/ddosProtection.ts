import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';

// Enhanced DDoS protection with multiple layers
class DDoSProtection {
  private static suspiciousIPs = new Map<string, { count: number; lastSeen: number }>();
  private static blockedIPs = new Set<string>();
  
  // Aggressive rate limiter for potential DDoS attacks
  static ddosLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50, // Very strict limit
    message: {
      success: false,
      error: {
        message: 'Request rate exceeded. Potential DDoS detected.',
        code: 'DDOS_PROTECTION_TRIGGERED',
        retryAfter: '1 minute',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      const clientIP = DDoSProtection.getClientIP(req);
      DDoSProtection.flagSuspiciousIP(clientIP);
      
      res.status(429).json({
        success: false,
        error: {
          message: 'Request rate exceeded. Potential DDoS detected.',
          code: 'DDOS_PROTECTION_TRIGGERED',
          retryAfter: '1 minute',
        },
      });
    },
  });

  // Burst protection for rapid requests
  static burstProtection = rateLimit({
    windowMs: 10 * 1000, // 10 seconds
    max: 20, // Max 20 requests per 10 seconds
    message: {
      success: false,
      error: {
        message: 'Too many requests in short time. Please slow down.',
        code: 'BURST_LIMIT_EXCEEDED',
        retryAfter: '10 seconds',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Get real client IP considering proxies
  private static getClientIP(req: Request): string {
    return (
      req.headers['cf-connecting-ip'] as string ||
      req.headers['x-real-ip'] as string ||
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  // Flag suspicious IPs for monitoring
  private static flagSuspiciousIP(ip: string): void {
    const now = Date.now();
    const existing = this.suspiciousIPs.get(ip);
    
    if (existing) {
      existing.count++;
      existing.lastSeen = now;
      
      // Block IP if too many violations
      if (existing.count > 5) {
        this.blockedIPs.add(ip);
        console.warn(`🚨 IP ${ip} blocked due to repeated violations`);
      }
    } else {
      this.suspiciousIPs.set(ip, { count: 1, lastSeen: now });
    }

    // Clean up old entries (older than 1 hour)
    for (const [suspiciousIP, data] of this.suspiciousIPs.entries()) {
      if (now - data.lastSeen > 60 * 60 * 1000) {
        this.suspiciousIPs.delete(suspiciousIP);
      }
    }
  }

  // Middleware to check blocked IPs
  static blockSuspiciousIPs = (req: Request, res: Response, next: NextFunction) => {
    const clientIP = DDoSProtection.getClientIP(req);
    
    if (DDoSProtection.blockedIPs.has(clientIP)) {
      console.warn(`🚫 Blocked IP ${clientIP} attempted access`);
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. IP has been blocked due to suspicious activity.',
          code: 'IP_BLOCKED',
        },
      });
    }

    return next();
  };

  // Request pattern analysis for bot detection
  static botDetection = (req: Request, res: Response, next: NextFunction) => {
    const userAgent = req.headers['user-agent'] || '';
    const clientIP = DDoSProtection.getClientIP(req);
    
    // Check for common bot patterns
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python-requests/i,
    ];

    const isBot = botPatterns.some(pattern => pattern.test(userAgent));
    
    if (isBot && !userAgent.includes('Googlebot') && !userAgent.includes('Bingbot')) {
      console.warn(`🤖 Potential bot detected: ${clientIP} - ${userAgent}`);
      
      // Apply stricter rate limiting for bots
      return DDoSProtection.ddosLimiter(req, res, next);
    }

    next();
  };

  // Request size monitoring
  static requestSizeMonitor = (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    
    if (contentLength > maxSize) {
      console.warn(`📦 Large request detected: ${contentLength} bytes from ${DDoSProtection.getClientIP(req)}`);
      return res.status(413).json({
        success: false,
        error: {
          message: 'Request entity too large',
          code: 'REQUEST_TOO_LARGE',
          maxSize: '10MB',
        },
      });
    }

    return next();
  };

  // Get current protection status
  static getProtectionStatus() {
    return {
      suspiciousIPs: Array.from(this.suspiciousIPs.entries()),
      blockedIPs: Array.from(this.blockedIPs),
      totalSuspicious: this.suspiciousIPs.size,
      totalBlocked: this.blockedIPs.size,
    };
  }

  // Manually unblock IP (for admin use)
  static unblockIP(ip: string): boolean {
    if (this.blockedIPs.has(ip)) {
      this.blockedIPs.delete(ip);
      this.suspiciousIPs.delete(ip);
      console.log(`✅ IP ${ip} has been unblocked`);
      return true;
    }
    return false;
  }
}

export default DDoSProtection;
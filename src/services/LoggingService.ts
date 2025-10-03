import winston from 'winston';
import { Request, Response } from 'express';

interface LogContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  error?: Error;
  metadata?: Record<string, any>;
}

class LoggingService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            ...meta
          });
        })
      ),
      defaultMeta: {
        service: 'hk-retail-nft-platform',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });

    // Add file transport for production
    if (process.env.NODE_ENV === 'production') {
      this.logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }));

      this.logger.add(new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }));
    }
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.logger.error(message, { 
      error: error?.message,
      stack: error?.stack,
      ...context 
    });
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, context);
  }

  // HTTP request logging
  logRequest(req: Request, res: Response, responseTime: number): void {
    const context: LogContext = {
      requestId: req.headers['x-request-id'] as string,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      userId: (req as any).user?.id
    };

    if (res.statusCode >= 400) {
      this.error(`HTTP ${res.statusCode} - ${req.method} ${req.originalUrl}`, undefined, context);
    } else {
      this.info(`HTTP ${res.statusCode} - ${req.method} ${req.originalUrl}`, context);
    }
  }

  // Business event logging
  logBusinessEvent(event: string, data: Record<string, any>, userId?: string): void {
    this.info(`Business Event: ${event}`, {
      userId,
      metadata: data,
      eventType: 'business'
    });
  }

  // Security event logging
  logSecurityEvent(event: string, details: Record<string, any>, severity: 'low' | 'medium' | 'high' = 'medium'): void {
    const logMethod = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
    this[logMethod](`Security Event: ${event}`, {
      metadata: details,
      eventType: 'security',
      severity
    });
  }

  // Performance logging
  logPerformance(operation: string, duration: number, metadata?: Record<string, any>): void {
    this.info(`Performance: ${operation}`, {
      metadata: {
        duration,
        ...metadata
      },
      eventType: 'performance'
    });
  }

  // Blockchain transaction logging
  logBlockchainTransaction(
    txHash: string, 
    operation: string, 
    status: 'pending' | 'confirmed' | 'failed',
    gasUsed?: number,
    userId?: string
  ): void {
    this.info(`Blockchain Transaction: ${operation}`, {
      userId,
      metadata: {
        txHash,
        operation,
        status,
        gasUsed
      },
      eventType: 'blockchain'
    });
  }
}

export const loggingService = new LoggingService();
export default LoggingService;
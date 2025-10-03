import { Request, Response, NextFunction } from 'express';
import { loggingService } from './LoggingService';

interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: Date;
}

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: Record<string, {
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    responseTime?: number;
  }>;
  timestamp: Date;
  uptime: number;
  version: string;
}

class MonitoringService {
  private metrics: Map<string, MetricData[]> = new Map();
  private readonly maxMetricsPerType = 1000;
  private startTime = Date.now();

  // Middleware for request monitoring
  requestMonitoring() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      // Add request ID for tracing
      req.headers['x-request-id'] = req.headers['x-request-id'] || this.generateRequestId();

      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        
        // Record metrics
        this.recordMetric('http_requests_total', 1, {
          method: req.method,
          route: req.route?.path || req.path,
          status_code: res.statusCode.toString()
        });

        this.recordMetric('http_request_duration_ms', responseTime, {
          method: req.method,
          route: req.route?.path || req.path
        });

        // Log request
        loggingService.logRequest(req, res, responseTime);

        // Alert on slow requests
        if (responseTime > 5000) {
          loggingService.warn('Slow request detected', {
            method: req.method,
            url: req.originalUrl,
            responseTime,
            requestId: req.headers['x-request-id'] as string
          });
        }

        // Alert on errors
        if (res.statusCode >= 500) {
          loggingService.error('Server error response', undefined, {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            requestId: req.headers['x-request-id'] as string
          });
        }
      });

      next();
    };
  }

  // Record custom metrics
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      tags,
      timestamp: new Date()
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    // Keep only recent metrics
    if (metrics.length > this.maxMetricsPerType) {
      metrics.shift();
    }
  }

  // Get metrics for export
  getMetrics(): Record<string, MetricData[]> {
    const result: Record<string, MetricData[]> = {};
    this.metrics.forEach((value, key) => {
      result[key] = [...value];
    });
    return result;
  }

  // Health check endpoint
  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = {};

    // Database health check
    try {
      const dbStart = Date.now();
      // Add actual database ping here
      const dbTime = Date.now() - dbStart;
      checks.database = {
        status: dbTime < 1000 ? 'pass' : 'warn',
        responseTime: dbTime,
        message: dbTime < 1000 ? 'Database responsive' : 'Database slow'
      };
    } catch (error) {
      checks.database = {
        status: 'fail',
        message: `Database connection failed: ${error}`
      };
    }

    // Redis health check
    try {
      const redisStart = Date.now();
      // Add actual Redis ping here
      const redisTime = Date.now() - redisStart;
      checks.redis = {
        status: redisTime < 500 ? 'pass' : 'warn',
        responseTime: redisTime,
        message: redisTime < 500 ? 'Redis responsive' : 'Redis slow'
      };
    } catch (error) {
      checks.redis = {
        status: 'fail',
        message: `Redis connection failed: ${error}`
      };
    }

    // Memory usage check
    const memUsage = process.memoryUsage();
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    checks.memory = {
      status: memUsagePercent < 80 ? 'pass' : memUsagePercent < 90 ? 'warn' : 'fail',
      message: `Memory usage: ${memUsagePercent.toFixed(2)}%`
    };

    // Determine overall status
    const hasFailures = Object.values(checks).some(check => check.status === 'fail');
    const hasWarnings = Object.values(checks).some(check => check.status === 'warn');
    
    let status: HealthCheckResult['status'] = 'healthy';
    if (hasFailures) {
      status = 'unhealthy';
    } else if (hasWarnings) {
      status = 'degraded';
    }

    return {
      status,
      checks,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0'
    };
  }

  // Error tracking
  trackError(error: Error, context?: Record<string, any>): void {
    this.recordMetric('errors_total', 1, {
      error_type: error.constructor.name,
      ...context
    });

    loggingService.error('Application error tracked', error, {
      metadata: context
    });
  }

  // Business metrics
  trackBusinessMetric(event: string, value: number = 1, metadata?: Record<string, any>): void {
    this.recordMetric(`business_${event}`, value, metadata);
    
    loggingService.logBusinessEvent(event, {
      value,
      ...metadata
    });
  }

  // Performance tracking
  trackPerformance(operation: string, duration: number, metadata?: Record<string, any>): void {
    this.recordMetric('operation_duration_ms', duration, {
      operation,
      ...metadata
    });

    loggingService.logPerformance(operation, duration, metadata);

    // Alert on slow operations
    if (duration > 10000) {
      loggingService.warn(`Slow operation detected: ${operation}`, {
        duration,
        metadata
      });
    }
  }

  // Generate unique request ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get system metrics
  getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime(),
      pid: process.pid,
      version: process.version,
      platform: process.platform
    };
  }
}

export const monitoringService = new MonitoringService();
export default MonitoringService;
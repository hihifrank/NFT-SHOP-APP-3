import { Request, Response } from 'express';
import { monitoringService } from '../services/MonitoringService';
import { alertingService } from '../services/AlertingService';
import { loggingService } from '../services/LoggingService';

export class MonitoringController {
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const healthResult = await monitoringService.performHealthCheck();
      
      const statusCode = healthResult.status === 'healthy' ? 200 : 
                        healthResult.status === 'degraded' ? 200 : 503;
      
      res.status(statusCode).json(healthResult);
    } catch (error) {
      loggingService.error('Health check failed', error as Error);
      res.status(503).json({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date()
      });
    }
  }

  async readinessCheck(req: Request, res: Response): Promise<void> {
    try {
      const healthResult = await monitoringService.performHealthCheck();
      
      // Application is ready if it's healthy or degraded (but not unhealthy)
      if (healthResult.status === 'unhealthy') {
        res.status(503).json({
          status: 'not ready',
          message: 'Application is not ready to serve traffic'
        });
      } else {
        res.status(200).json({
          status: 'ready',
          message: 'Application is ready to serve traffic'
        });
      }
    } catch (error) {
      loggingService.error('Readiness check failed', error as Error);
      res.status(503).json({
        status: 'not ready',
        error: 'Readiness check failed'
      });
    }
  }

  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = monitoringService.getMetrics();
      
      // Check alert rules with current metrics
      alertingService.checkAlertRules(metrics);
      
      res.json({
        metrics,
        timestamp: new Date(),
        summary: {
          totalMetricTypes: Object.keys(metrics).length,
          totalDataPoints: Object.values(metrics).reduce((sum, arr) => sum + arr.length, 0)
        }
      });
    } catch (error) {
      loggingService.error('Failed to get metrics', error as Error);
      res.status(500).json({
        error: 'Failed to retrieve metrics'
      });
    }
  }

  async getSystemMetrics(req: Request, res: Response): Promise<void> {
    try {
      const systemMetrics = monitoringService.getSystemMetrics();
      
      res.json({
        system: systemMetrics,
        timestamp: new Date()
      });
    } catch (error) {
      loggingService.error('Failed to get system metrics', error as Error);
      res.status(500).json({
        error: 'Failed to retrieve system metrics'
      });
    }
  }

  async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      const activeAlerts = alertingService.getActiveAlerts();
      const alertHistory = alertingService.getAlertHistory(50);
      
      res.json({
        active: activeAlerts,
        recent: alertHistory,
        summary: {
          activeCount: activeAlerts.length,
          criticalCount: activeAlerts.filter(a => a.severity === 'critical').length,
          highCount: activeAlerts.filter(a => a.severity === 'high').length
        },
        timestamp: new Date()
      });
    } catch (error) {
      loggingService.error('Failed to get alerts', error as Error);
      res.status(500).json({
        error: 'Failed to retrieve alerts'
      });
    }
  }

  async resolveAlert(req: Request, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      
      if (!alertId) {
        res.status(400).json({
          error: 'Alert ID is required'
        });
        return;
      }

      const resolved = alertingService.resolveAlert(alertId);
      
      if (resolved) {
        loggingService.info('Alert resolved via API', {
          alertId,
          resolvedBy: (req as any).user?.id || 'unknown'
        });
        
        res.json({
          success: true,
          message: 'Alert resolved successfully',
          alertId
        });
      } else {
        res.status(404).json({
          error: 'Alert not found or already resolved',
          alertId
        });
      }
    } catch (error) {
      loggingService.error('Failed to resolve alert', error as Error);
      res.status(500).json({
        error: 'Failed to resolve alert'
      });
    }
  }

  // Custom endpoint for Prometheus metrics format
  async getPrometheusMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = monitoringService.getMetrics();
      const systemMetrics = monitoringService.getSystemMetrics();
      
      // Convert to Prometheus format
      let prometheusOutput = '';
      
      // HTTP metrics
      if (metrics.http_requests_total) {
        prometheusOutput += '# HELP http_requests_total Total number of HTTP requests\n';
        prometheusOutput += '# TYPE http_requests_total counter\n';
        
        const requestCounts: Record<string, number> = {};
        metrics.http_requests_total.forEach(metric => {
          const key = `method="${metric.tags?.method || 'unknown'}",status="${metric.tags?.status_code || 'unknown'}"`;
          requestCounts[key] = (requestCounts[key] || 0) + metric.value;
        });
        
        Object.entries(requestCounts).forEach(([labels, count]) => {
          prometheusOutput += `http_requests_total{${labels}} ${count}\n`;
        });
      }
      
      // Memory metrics
      prometheusOutput += '# HELP nodejs_memory_heap_used_bytes Node.js heap memory used\n';
      prometheusOutput += '# TYPE nodejs_memory_heap_used_bytes gauge\n';
      prometheusOutput += `nodejs_memory_heap_used_bytes ${systemMetrics.memory.heapUsed}\n`;
      
      prometheusOutput += '# HELP nodejs_memory_heap_total_bytes Node.js heap memory total\n';
      prometheusOutput += '# TYPE nodejs_memory_heap_total_bytes gauge\n';
      prometheusOutput += `nodejs_memory_heap_total_bytes ${systemMetrics.memory.heapTotal}\n`;
      
      // Process uptime
      prometheusOutput += '# HELP nodejs_process_uptime_seconds Node.js process uptime\n';
      prometheusOutput += '# TYPE nodejs_process_uptime_seconds gauge\n';
      prometheusOutput += `nodejs_process_uptime_seconds ${systemMetrics.uptime}\n`;
      
      res.set('Content-Type', 'text/plain');
      res.send(prometheusOutput);
    } catch (error) {
      loggingService.error('Failed to generate Prometheus metrics', error as Error);
      res.status(500).send('# Error generating metrics\n');
    }
  }
}
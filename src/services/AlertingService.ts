import { loggingService } from './LoggingService';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  metadata?: Record<string, any>;
  resolved?: boolean;
  resolvedAt?: Date;
}

interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: any) => boolean;
  severity: Alert['severity'];
  cooldown: number; // milliseconds
  enabled: boolean;
}

class AlertingService {
  private alerts: Map<string, Alert> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private lastAlertTimes: Map<string, number> = new Map();

  constructor() {
    this.setupDefaultRules();
  }

  private setupDefaultRules(): void {
    // High error rate rule
    this.addRule({
      id: 'high_error_rate',
      name: 'High Error Rate',
      condition: (metrics) => {
        const errorRate = this.calculateErrorRate(metrics);
        return errorRate > 0.05; // 5% error rate
      },
      severity: 'high',
      cooldown: 300000, // 5 minutes
      enabled: true
    });

    // High response time rule
    this.addRule({
      id: 'high_response_time',
      name: 'High Response Time',
      condition: (metrics) => {
        const avgResponseTime = this.calculateAverageResponseTime(metrics);
        return avgResponseTime > 2000; // 2 seconds
      },
      severity: 'medium',
      cooldown: 180000, // 3 minutes
      enabled: true
    });

    // High memory usage rule
    this.addRule({
      id: 'high_memory_usage',
      name: 'High Memory Usage',
      condition: () => {
        const memUsage = process.memoryUsage();
        const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
        return memUsagePercent > 85;
      },
      severity: 'high',
      cooldown: 300000, // 5 minutes
      enabled: true
    });

    // Database connection failures
    this.addRule({
      id: 'database_connection_failure',
      name: 'Database Connection Failure',
      condition: (metrics) => {
        return this.hasRecentDatabaseErrors(metrics);
      },
      severity: 'critical',
      cooldown: 60000, // 1 minute
      enabled: true
    });

    // Blockchain transaction failures
    this.addRule({
      id: 'blockchain_tx_failure_rate',
      name: 'High Blockchain Transaction Failure Rate',
      condition: (metrics) => {
        const failureRate = this.calculateBlockchainFailureRate(metrics);
        return failureRate > 0.1; // 10% failure rate
      },
      severity: 'high',
      cooldown: 600000, // 10 minutes
      enabled: true
    });
  }

  addRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  removeRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
  }

  // Create and send alert
  createAlert(
    type: Alert['type'],
    title: string,
    message: string,
    severity: Alert['severity'],
    metadata?: Record<string, any>
  ): string {
    const alertId = this.generateAlertId();
    const alert: Alert = {
      id: alertId,
      type,
      title,
      message,
      severity,
      timestamp: new Date(),
      metadata,
      resolved: false
    };

    this.alerts.set(alertId, alert);
    this.sendAlert(alert);
    
    return alertId;
  }

  // Resolve alert
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      
      loggingService.info(`Alert resolved: ${alert.title}`, {
        alertId,
        metadata: alert.metadata
      });
      
      return true;
    }
    return false;
  }

  // Check alert rules against current metrics
  checkAlertRules(metrics: any): void {
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue;

      // Check cooldown
      const lastAlertTime = this.lastAlertTimes.get(ruleId) || 0;
      if (Date.now() - lastAlertTime < rule.cooldown) {
        continue;
      }

      try {
        if (rule.condition(metrics)) {
          this.triggerAlert(rule, metrics);
          this.lastAlertTimes.set(ruleId, Date.now());
        }
      } catch (error) {
        loggingService.error(`Error evaluating alert rule ${rule.name}`, error as Error);
      }
    }
  }

  private triggerAlert(rule: AlertRule, metrics: any): void {
    const alertId = this.createAlert(
      rule.severity === 'critical' ? 'error' : rule.severity === 'high' ? 'error' : 'warning',
      rule.name,
      `Alert rule "${rule.name}" has been triggered`,
      rule.severity,
      {
        ruleId: rule.id,
        metrics: this.sanitizeMetrics(metrics)
      }
    );

    loggingService.warn(`Alert triggered: ${rule.name}`, {
      alertId,
      ruleId: rule.id,
      severity: rule.severity
    });
  }

  private sendAlert(alert: Alert): void {
    // Log the alert
    const logMethod = alert.severity === 'critical' || alert.severity === 'high' ? 'error' : 'warn';
    loggingService[logMethod](`ALERT: ${alert.title}`, undefined, {
      alertId: alert.id,
      severity: alert.severity,
      metadata: alert.metadata
    });

    // In production, integrate with external alerting systems
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalSystems(alert);
    }
  }

  private sendToExternalSystems(alert: Alert): void {
    // Integrate with Slack, PagerDuty, email, etc.
    // This is a placeholder for actual integrations
    
    if (process.env.SLACK_WEBHOOK_URL && alert.severity === 'critical') {
      this.sendSlackAlert(alert);
    }

    if (process.env.EMAIL_ALERTS_ENABLED === 'true') {
      this.sendEmailAlert(alert);
    }
  }

  private sendSlackAlert(alert: Alert): void {
    // Placeholder for Slack integration
    loggingService.info('Slack alert would be sent', {
      alertId: alert.id,
      title: alert.title
    });
  }

  private sendEmailAlert(alert: Alert): void {
    // Placeholder for email integration
    loggingService.info('Email alert would be sent', {
      alertId: alert.id,
      title: alert.title
    });
  }

  // Utility methods for rule conditions
  private calculateErrorRate(metrics: any): number {
    const httpRequests = metrics.http_requests_total || [];
    const totalRequests = httpRequests.length;
    const errorRequests = httpRequests.filter((req: any) => 
      req.tags?.status_code && parseInt(req.tags.status_code) >= 400
    ).length;

    return totalRequests > 0 ? errorRequests / totalRequests : 0;
  }

  private calculateAverageResponseTime(metrics: any): number {
    const durations = metrics.http_request_duration_ms || [];
    if (durations.length === 0) return 0;

    const sum = durations.reduce((acc: number, metric: any) => acc + metric.value, 0);
    return sum / durations.length;
  }

  private hasRecentDatabaseErrors(metrics: any): boolean {
    const errors = metrics.errors_total || [];
    const recentErrors = errors.filter((error: any) => {
      const errorTime = new Date(error.timestamp).getTime();
      return Date.now() - errorTime < 300000 && // Last 5 minutes
             error.tags?.error_type?.includes('Database');
    });

    return recentErrors.length > 5; // More than 5 database errors in 5 minutes
  }

  private calculateBlockchainFailureRate(metrics: any): number {
    const blockchainOps = metrics.business_blockchain_transaction || [];
    const recentOps = blockchainOps.filter((op: any) => {
      const opTime = new Date(op.timestamp).getTime();
      return Date.now() - opTime < 600000; // Last 10 minutes
    });

    if (recentOps.length === 0) return 0;

    const failedOps = recentOps.filter((op: any) => 
      op.metadata?.status === 'failed'
    ).length;

    return failedOps / recentOps.length;
  }

  private sanitizeMetrics(metrics: any): any {
    // Remove sensitive data from metrics before logging
    const sanitized = { ...metrics };
    delete sanitized.sensitive_data;
    return sanitized;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get all active alerts
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  // Get alert history
  getAlertHistory(limit: number = 100): Alert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const alertingService = new AlertingService();
export default AlertingService;
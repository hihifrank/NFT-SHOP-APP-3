import { Router } from 'express';
import { MonitoringController } from '../controllers/MonitoringController';

const router = Router();
const monitoringController = new MonitoringController();

/**
 * @swagger
 * /api/v1/monitoring/health:
 *   get:
 *     summary: Get application health status
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Health check results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy, degraded]
 *                 checks:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 version:
 *                   type: string
 */
router.get('/health', monitoringController.healthCheck);

/**
 * @swagger
 * /api/v1/monitoring/health/ready:
 *   get:
 *     summary: Get readiness probe status
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Application is ready
 *       503:
 *         description: Application is not ready
 */
router.get('/health/ready', monitoringController.readinessCheck);

/**
 * @swagger
 * /api/v1/monitoring/metrics:
 *   get:
 *     summary: Get application metrics
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Application metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/metrics', monitoringController.getMetrics);

/**
 * @swagger
 * /api/v1/monitoring/system:
 *   get:
 *     summary: Get system metrics
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System metrics
 */
router.get('/system', monitoringController.getSystemMetrics);

/**
 * @swagger
 * /api/v1/monitoring/alerts:
 *   get:
 *     summary: Get active alerts
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active alerts
 */
router.get('/alerts', monitoringController.getAlerts);

/**
 * @swagger
 * /api/v1/monitoring/alerts/{alertId}/resolve:
 *   post:
 *     summary: Resolve an alert
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alert resolved successfully
 *       404:
 *         description: Alert not found
 */
router.post('/alerts/:alertId/resolve', monitoringController.resolveAlert);

/**
 * @swagger
 * /api/v1/monitoring/metrics/prometheus:
 *   get:
 *     summary: Get metrics in Prometheus format
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Metrics in Prometheus format
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.get('/metrics/prometheus', monitoringController.getPrometheusMetrics);

export default router;
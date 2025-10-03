import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import { initI18n } from './config/i18n';
import { languageDetectionMiddleware } from './middleware/i18n';
import SocketService from './services/SocketService';

// Initialize i18n
initI18n().then(() => {
  console.log('✅ Internationalization initialized');
}).catch((error) => {
  console.error('❌ Failed to initialize i18n:', error);
});

// Initialize Express application
const app = express();

// Create HTTP server
const server = createServer(app);

// Enhanced security middleware stack
import securityMiddleware from './middleware/security';
app.use(securityMiddleware);

// Monitoring middleware
import { monitoringService } from './services/MonitoringService';
app.use(monitoringService.requestMonitoring());

// CORS configuration with enhanced security
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log unauthorized origin attempts
    console.warn(`🚨 Unauthorized CORS origin attempt: ${origin}`);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Response-Time', 'X-API-Version'],
  maxAge: 86400, // 24 hours
}));

// Body parsing middleware with enhanced limits and validation
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for signature verification if needed
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 100 // Limit number of parameters
}));

// Language detection middleware
app.use(languageDetectionMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.environment,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Security status endpoint (admin only in production)
app.get('/security-status', (req, res) => {
  // In production, this should be protected by admin authentication
  if (config.environment === 'production') {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Access denied',
        code: 'FORBIDDEN',
      },
    });
  }

  const { getSecurityStatus } = require('./middleware/security');
  return res.status(200).json({
    success: true,
    data: getSecurityStatus(),
  });
});

// Import API routes
import apiRoutes from './routes';

// API routes
app.use('/api/v1', apiRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    error: config.environment === 'production' ? 'Internal server error' : err.message,
    ...(config.environment !== 'production' && { stack: err.stack }),
  });
});

// Initialize Socket.io service
const socketService = new SocketService(server);

// Make socket service available globally
declare global {
  var socketService: SocketService;
}
global.socketService = socketService;

// Start server
server.listen(config.port, () => {
  console.log(`🚀 HK Retail NFT Platform API server running on port ${config.port}`);
  console.log(`📍 Environment: ${config.environment}`);
  console.log(`🔗 Health check: http://localhost:${config.port}/health`);
  console.log(`🔌 Socket.io server initialized`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

export default app;
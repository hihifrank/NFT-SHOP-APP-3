import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';

// Initialize Express application
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.environment,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes will be added here in future tasks
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'HK Retail NFT Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      merchants: '/api/v1/merchants',
      coupons: '/api/v1/coupons',
      lotteries: '/api/v1/lotteries',
      stores: '/api/v1/stores',
    },
  });
});

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

// Start server
const server = app.listen(config.port, () => {
  console.log(`🚀 HK Retail NFT Platform API server running on port ${config.port}`);
  console.log(`📍 Environment: ${config.environment}`);
  console.log(`🔗 Health check: http://localhost:${config.port}/health`);
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
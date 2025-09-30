import morgan from 'morgan';
import { logger } from '../utils/logger';
import config from '../config';

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (req, res) => {
  const responseTime = res.getHeader('X-Response-Time');
  return responseTime ? `${responseTime}ms` : '-';
});

// Custom format for structured logging
const logFormat = config.environment === 'production'
  ? 'combined'
  : ':method :url :status :res[content-length] - :response-time ms';

// Create morgan middleware with Winston logger
const requestLogger = morgan(logFormat, {
  stream: {
    write: (message: string) => {
      // Remove trailing newline and log as info
      logger.info(message.trim());
    },
  },
  skip: (req, res) => {
    // Skip logging for health check in production
    if (config.environment === 'production' && req.url === '/health') {
      return true;
    }
    return false;
  },
});

export default requestLogger;
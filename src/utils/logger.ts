import winston from 'winston';
import config from '../config';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
try {
  winston.addColors(colors);
} catch (error) {
  // Ignore winston color errors in test environment
  if (config.environment !== 'test') {
    console.error('Winston color configuration failed:', error);
  }
}

// Define which logs to print based on environment
const level = () => {
  const env = config.environment || 'development';
  if (env === 'test') return 'error'; // Minimal logging in tests
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports based on environment
const createTransports = () => {
  const transports: winston.transport[] = [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      silent: config.environment === 'test', // Silent in test environment
    }),
  ];

  // Only add file transports in non-test environments
  if (config.environment !== 'test') {
    transports.push(
      // File transport for errors
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
      }),
      
      // File transport for all logs
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
      })
    );
  }

  return transports;
};

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports: createTransports(),
  // Handle exceptions and rejections only in non-test environments
  ...(config.environment !== 'test' && {
    exceptionHandlers: [
      new winston.transports.File({ filename: 'logs/exceptions.log' }),
    ],
    rejectionHandlers: [
      new winston.transports.File({ filename: 'logs/rejections.log' }),
    ],
  }),
});

// Create a stream object for Morgan HTTP logger
const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export { logger, stream };
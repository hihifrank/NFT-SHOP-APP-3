import { Pool } from 'pg';
import { createClient } from 'redis';
import config from '../config';
import { logger } from '../utils/logger';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    blockchain: ServiceHealth;
  };
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'unknown';
  responseTime?: number;
  error?: string;
}

class HealthService {
  private static instance: HealthService;
  private dbPool?: Pool;
  private redisClient?: any;

  private constructor() {}

  static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    const [dbHealth, redisHealth, blockchainHealth] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkBlockchain(),
    ]);

    const services = {
      database: this.getServiceResult(dbHealth),
      redis: this.getServiceResult(redisHealth),
      blockchain: this.getServiceResult(blockchainHealth),
    };

    // Determine overall status
    const hasDown = Object.values(services).some(service => service.status === 'down');
    const hasUnknown = Object.values(services).some(service => service.status === 'unknown');
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (hasDown) {
      overallStatus = 'unhealthy';
    } else if (hasUnknown) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.environment,
      uptime: process.uptime(),
      services,
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      if (!this.dbPool) {
        this.dbPool = new Pool({
          host: config.database.host,
          port: config.database.port,
          database: config.database.database,
          user: config.database.username,
          password: config.database.password,
          ssl: config.database.ssl,
          max: 1, // Only one connection for health checks
          connectionTimeoutMillis: 5000,
        });
      }

      await this.dbPool.query('SELECT 1');
      
      return {
        status: 'up',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      if (!this.redisClient) {
        this.redisClient = createClient({
          socket: {
            host: config.redis.host,
            port: config.redis.port,
            connectTimeout: 5000,
          },
          password: config.redis.password,
          database: config.redis.db,
        });
        
        this.redisClient.on('error', (err: Error) => {
          logger.error('Redis health check client error:', err);
        });
      }

      if (!this.redisClient.isOpen) {
        await this.redisClient.connect();
      }

      await this.redisClient.ping();
      
      return {
        status: 'up',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkBlockchain(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // For now, we'll just return unknown since blockchain integration
      // will be implemented in later tasks
      return {
        status: 'unknown',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('Blockchain health check failed:', error);
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private getServiceResult(result: PromiseSettledResult<ServiceHealth>): ServiceHealth {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        status: 'down',
        error: result.reason?.message || 'Health check failed',
      };
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.dbPool) {
        await this.dbPool.end();
      }
      if (this.redisClient && this.redisClient.isOpen) {
        await this.redisClient.quit();
      }
    } catch (error) {
      logger.error('Error during health service cleanup:', error);
    }
  }
}

export default HealthService;
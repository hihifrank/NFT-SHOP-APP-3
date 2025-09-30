import Redis from 'ioredis';
import config from '../config';
import { logger } from '../utils/logger';

class RedisConnection {
  private client: any;
  private static instance: RedisConnection;

  private constructor() {
    const redisOptions = {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      // Connection timeout
      connectTimeout: 10000,
      // Command timeout
      commandTimeout: 5000,
    };

    this.client = new Redis(redisOptions);

    // Event handlers
    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('error', (error: Error) => {
      logger.error('Redis client error:', error);
    });

    this.client.on('close', () => {
      logger.warn('Redis client connection closed');
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });

    this.client.on('end', () => {
      logger.warn('Redis client connection ended');
    });
  }

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  public getClient(): any {
    return this.client;
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
      logger.info('Redis connection established');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
      throw error;
    }
  }

  public async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis ping failed:', error);
      return false;
    }
  }

  public async flushAll(): Promise<void> {
    try {
      await this.client.flushall();
      logger.info('Redis cache cleared');
    } catch (error) {
      logger.error('Failed to clear Redis cache:', error);
      throw error;
    }
  }
}

export const redis = RedisConnection.getInstance();
export default RedisConnection;
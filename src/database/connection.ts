import { Pool, PoolClient, PoolConfig } from 'pg';
import config from '../config';
import { logger } from '../utils/logger';

class DatabaseConnection {
  private pool: Pool;
  private static instance: DatabaseConnection;

  private constructor() {
    const poolConfig: PoolConfig = {
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.username,
      password: config.database.password,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      max: config.database.maxConnections,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    this.pool = new Pool(poolConfig);

    // Handle pool errors
    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });

    // Handle pool connection
    this.pool.on('connect', (client) => {
      logger.info('New client connected to database');
    });

    // Handle pool removal
    this.pool.on('remove', (client) => {
      logger.info('Client removed from pool');
    });
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async getClient(): Promise<PoolClient> {
    try {
      const client = await this.pool.connect();
      return client;
    } catch (error) {
      logger.error('Error getting database client:', error);
      throw error;
    }
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const client = await this.getClient();
    try {
      const start = Date.now();
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Executed query', {
        text,
        duration,
        rows: result.rowCount,
      });
      
      return result;
    } catch (error) {
      logger.error('Database query error:', { text, params, error });
      throw error;
    } finally {
      client.release();
    }
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction rolled back:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW()');
      logger.info('Database connection test successful:', result.rows[0]);
      return true;
    } catch (error) {
      logger.error('Database connection test failed:', error);
      return false;
    }
  }

  public async close(): Promise<void> {
    try {
      await this.pool.end();
      logger.info('Database pool closed');
    } catch (error) {
      logger.error('Error closing database pool:', error);
      throw error;
    }
  }

  public getPool(): Pool {
    return this.pool;
  }
}

export const db = DatabaseConnection.getInstance();
export default DatabaseConnection;
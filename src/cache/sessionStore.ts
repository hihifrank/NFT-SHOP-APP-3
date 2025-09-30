import session from 'express-session';
import RedisStore from 'connect-redis';
import { redis } from './redis';
import config from '../config';
import { logger } from '../utils/logger';

class SessionManager {
  private store: RedisStore;
  private sessionConfig: session.SessionOptions;

  constructor() {
    // Create Redis store
    this.store = new RedisStore({
      client: redis.getClient(),
      prefix: 'hk_nft_session:',
      ttl: 86400, // 24 hours in seconds
    });

    // Configure session options
    this.sessionConfig = {
      store: this.store,
      secret: config.jwtSecret,
      name: 'hk_nft_session',
      resave: false,
      saveUninitialized: false,
      rolling: true, // Reset expiration on activity
      cookie: {
        secure: config.environment === 'production', // HTTPS only in production
        httpOnly: true, // Prevent XSS
        maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        sameSite: 'strict', // CSRF protection
      },
    };

    // Handle store events
    this.store.on('connect', () => {
      logger.info('Session store connected to Redis');
    });

    this.store.on('disconnect', () => {
      logger.warn('Session store disconnected from Redis');
    });

    this.store.on('error', (error) => {
      logger.error('Session store error:', error);
    });
  }

  public getSessionMiddleware() {
    return session(this.sessionConfig);
  }

  public getStore(): RedisStore {
    return this.store;
  }

  /**
   * Manually create a session
   */
  public async createSession(sessionId: string, sessionData: any): Promise<boolean> {
    try {
      return new Promise((resolve, reject) => {
        this.store.set(sessionId, sessionData, (error) => {
          if (error) {
            logger.error('Error creating session:', error);
            reject(error);
          } else {
            logger.debug(`Session created: ${sessionId}`);
            resolve(true);
          }
        });
      });
    } catch (error) {
      logger.error('Error in createSession:', error);
      return false;
    }
  }

  /**
   * Get session data
   */
  public async getSession(sessionId: string): Promise<any | null> {
    try {
      return new Promise((resolve, reject) => {
        this.store.get(sessionId, (error, session) => {
          if (error) {
            logger.error('Error getting session:', error);
            reject(error);
          } else {
            resolve(session || null);
          }
        });
      });
    } catch (error) {
      logger.error('Error in getSession:', error);
      return null;
    }
  }

  /**
   * Update session data
   */
  public async updateSession(sessionId: string, sessionData: any): Promise<boolean> {
    try {
      return new Promise((resolve, reject) => {
        this.store.set(sessionId, sessionData, (error) => {
          if (error) {
            logger.error('Error updating session:', error);
            reject(error);
          } else {
            logger.debug(`Session updated: ${sessionId}`);
            resolve(true);
          }
        });
      });
    } catch (error) {
      logger.error('Error in updateSession:', error);
      return false;
    }
  }

  /**
   * Destroy a session
   */
  public async destroySession(sessionId: string): Promise<boolean> {
    try {
      return new Promise((resolve, reject) => {
        this.store.destroy(sessionId, (error) => {
          if (error) {
            logger.error('Error destroying session:', error);
            reject(error);
          } else {
            logger.debug(`Session destroyed: ${sessionId}`);
            resolve(true);
          }
        });
      });
    } catch (error) {
      logger.error('Error in destroySession:', error);
      return false;
    }
  }

  /**
   * Touch a session to extend its TTL
   */
  public async touchSession(sessionId: string, sessionData: any): Promise<boolean> {
    try {
      return new Promise((resolve, reject) => {
        this.store.touch(sessionId, sessionData, (error) => {
          if (error) {
            logger.error('Error touching session:', error);
            reject(error);
          } else {
            logger.debug(`Session touched: ${sessionId}`);
            resolve(true);
          }
        });
      });
    } catch (error) {
      logger.error('Error in touchSession:', error);
      return false;
    }
  }

  /**
   * Get all active sessions (use with caution)
   */
  public async getAllSessions(): Promise<any[]> {
    try {
      return new Promise((resolve, reject) => {
        this.store.all((error, sessions) => {
          if (error) {
            logger.error('Error getting all sessions:', error);
            reject(error);
          } else {
            resolve(sessions || []);
          }
        });
      });
    } catch (error) {
      logger.error('Error in getAllSessions:', error);
      return [];
    }
  }

  /**
   * Get session count
   */
  public async getSessionCount(): Promise<number> {
    try {
      return new Promise((resolve, reject) => {
        this.store.length((error, count) => {
          if (error) {
            logger.error('Error getting session count:', error);
            reject(error);
          } else {
            resolve(count || 0);
          }
        });
      });
    } catch (error) {
      logger.error('Error in getSessionCount:', error);
      return 0;
    }
  }

  /**
   * Clear all sessions
   */
  public async clearAllSessions(): Promise<boolean> {
    try {
      return new Promise((resolve, reject) => {
        this.store.clear((error) => {
          if (error) {
            logger.error('Error clearing all sessions:', error);
            reject(error);
          } else {
            logger.info('All sessions cleared');
            resolve(true);
          }
        });
      });
    } catch (error) {
      logger.error('Error in clearAllSessions:', error);
      return false;
    }
  }
}

export const sessionManager = new SessionManager();
export default SessionManager;
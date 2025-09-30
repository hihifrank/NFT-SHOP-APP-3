import { redis } from './redis';
import { logger } from '../utils/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface StoreSearchParams {
  location: GeoLocation;
  radius: number;
  category?: string;
  isNftParticipant?: boolean;
}

class CacheService {
  private client = redis.getClient();
  private defaultTTL = 3600; // 1 hour default TTL

  /**
   * Generic cache operations
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (value === null) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    try {
      const ttl = options.ttl || this.defaultTTL;
      const serializedValue = JSON.stringify(value);
      
      if (ttl > 0) {
        await this.client.setex(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * User-specific cache operations
   */
  async cacheUserData(userId: string, userData: any, ttl: number = 1800): Promise<boolean> {
    const key = `user:${userId}`;
    return this.set(key, userData, { ttl });
  }

  async getUserData(userId: string): Promise<any | null> {
    const key = `user:${userId}`;
    return this.get(key);
  }

  async invalidateUserCache(userId: string): Promise<boolean> {
    const key = `user:${userId}`;
    return this.del(key);
  }

  /**
   * Store search cache operations
   */
  async cacheStoreSearch(params: StoreSearchParams, results: any[], ttl: number = 600): Promise<boolean> {
    const key = this.generateStoreSearchKey(params);
    return this.set(key, results, { ttl });
  }

  async getStoreSearch(params: StoreSearchParams): Promise<any[] | null> {
    const key = this.generateStoreSearchKey(params);
    return this.get(key);
  }

  private generateStoreSearchKey(params: StoreSearchParams): string {
    const { location, radius, category, isNftParticipant } = params;
    const lat = Math.round(location.latitude * 1000) / 1000; // Round to 3 decimal places
    const lng = Math.round(location.longitude * 1000) / 1000;
    
    let key = `store_search:${lat},${lng}:${radius}`;
    
    if (category) {
      key += `:cat:${category}`;
    }
    
    if (isNftParticipant !== undefined) {
      key += `:nft:${isNftParticipant}`;
    }
    
    return key;
  }

  /**
   * Merchant cache operations
   */
  async cacheMerchantData(merchantId: string, merchantData: any, ttl: number = 3600): Promise<boolean> {
    const key = `merchant:${merchantId}`;
    return this.set(key, merchantData, { ttl });
  }

  async getMerchantData(merchantId: string): Promise<any | null> {
    const key = `merchant:${merchantId}`;
    return this.get(key);
  }

  async invalidateMerchantCache(merchantId: string): Promise<boolean> {
    const key = `merchant:${merchantId}`;
    return this.del(key);
  }

  /**
   * NFT cache operations
   */
  async cacheNFTData(tokenId: string, nftData: any, ttl: number = 1800): Promise<boolean> {
    const key = `nft:${tokenId}`;
    return this.set(key, nftData, { ttl });
  }

  async getNFTData(tokenId: string): Promise<any | null> {
    const key = `nft:${tokenId}`;
    return this.get(key);
  }

  async invalidateNFTCache(tokenId: string): Promise<boolean> {
    const key = `nft:${tokenId}`;
    return this.del(key);
  }

  /**
   * Session management
   */
  async setSession(sessionId: string, sessionData: any, ttl: number = 86400): Promise<boolean> {
    const key = `session:${sessionId}`;
    return this.set(key, sessionData, { ttl });
  }

  async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`;
    return this.get(key);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const key = `session:${sessionId}`;
    return this.del(key);
  }

  async extendSession(sessionId: string, ttl: number = 86400): Promise<boolean> {
    const key = `session:${sessionId}`;
    return this.expire(key, ttl);
  }

  /**
   * Rate limiting
   */
  async incrementRateLimit(identifier: string, windowSeconds: number = 3600): Promise<number> {
    try {
      const key = `rate_limit:${identifier}`;
      const current = await this.client.incr(key);
      
      if (current === 1) {
        await this.client.expire(key, windowSeconds);
      }
      
      return current;
    } catch (error) {
      logger.error(`Rate limit increment error for ${identifier}:`, error);
      return 0;
    }
  }

  async getRateLimit(identifier: string): Promise<number> {
    try {
      const key = `rate_limit:${identifier}`;
      const value = await this.client.get(key);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      logger.error(`Rate limit get error for ${identifier}:`, error);
      return 0;
    }
  }

  /**
   * Geospatial operations for nearby stores
   */
  async addStoreLocation(storeId: string, longitude: number, latitude: number): Promise<boolean> {
    try {
      const key = 'store_locations';
      await this.client.geoadd(key, longitude, latitude, storeId);
      return true;
    } catch (error) {
      logger.error(`Error adding store location for ${storeId}:`, error);
      return false;
    }
  }

  async getNearbyStores(longitude: number, latitude: number, radius: number, unit: 'km' | 'm' = 'km'): Promise<string[]> {
    try {
      const key = 'store_locations';
      const results = await this.client.georadius(key, longitude, latitude, radius, unit);
      return results as string[];
    } catch (error) {
      logger.error('Error getting nearby stores:', error);
      return [];
    }
  }

  async removeStoreLocation(storeId: string): Promise<boolean> {
    try {
      const key = 'store_locations';
      const result = await this.client.zrem(key, storeId);
      return result > 0;
    } catch (error) {
      logger.error(`Error removing store location for ${storeId}:`, error);
      return false;
    }
  }

  /**
   * Lottery cache operations
   */
  async cacheLotteryData(lotteryId: string, lotteryData: any, ttl: number = 300): Promise<boolean> {
    const key = `lottery:${lotteryId}`;
    return this.set(key, lotteryData, { ttl });
  }

  async getLotteryData(lotteryId: string): Promise<any | null> {
    const key = `lottery:${lotteryId}`;
    return this.get(key);
  }

  async invalidateLotteryCache(lotteryId: string): Promise<boolean> {
    const key = `lottery:${lotteryId}`;
    return this.del(key);
  }

  /**
   * Bulk operations
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.client.mget(...keys);
      return values.map((value: string | null) => value ? JSON.parse(value) as T : null);
    } catch (error) {
      logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs: Record<string, any>, ttl?: number): Promise<boolean> {
    try {
      const pipeline = this.client.pipeline();
      
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        const serializedValue = JSON.stringify(value);
        if (ttl && ttl > 0) {
          pipeline.setex(key, ttl, serializedValue);
        } else {
          pipeline.set(key, serializedValue);
        }
      });
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Cache mset error:', error);
      return false;
    }
  }

  /**
   * Pattern-based operations
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      
      const result = await this.client.del(...keys);
      return result;
    } catch (error) {
      logger.error(`Error deleting pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Cache health check failed:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    try {
      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      
      return {
        memory: info,
        keyspace: keyspace,
        connected: await this.healthCheck(),
      };
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return null;
    }
  }
}

export const cacheService = new CacheService();
export default CacheService;
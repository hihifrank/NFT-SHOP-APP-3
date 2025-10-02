import RNFS from '../mocks/react-native-fs';
import SQLite from '../mocks/sqlite-storage';
import { Location } from './LocationService';

export interface MapTile {
  x: number;
  y: number;
  z: number;
  url: string;
  localPath?: string;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface StoreMarker {
  id: string;
  coordinate: Location;
  title: string;
  description: string;
  category: string;
  isNFTParticipant: boolean;
}

export class MapService {
  private static instance: MapService;
  private db: any | null = null;
  private readonly CACHE_DIR = `${RNFS.DocumentDirectoryPath}/map_cache`;
  private readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly TILE_SERVER_URL = 'https://tile.openstreetmap.org';

  static getInstance(): MapService {
    if (!MapService.instance) {
      MapService.instance = new MapService();
    }
    return MapService.instance;
  }

  /**
   * Initialize map service and database
   */
  async initialize(): Promise<void> {
    try {
      // Create cache directory
      await this.createCacheDirectory();
      
      // Initialize SQLite database
      await this.initializeDatabase();
      
      console.log('MapService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MapService:', error);
      throw error;
    }
  }

  /**
   * Get map region for Hong Kong
   */
  getHongKongRegion(): MapRegion {
    return {
      latitude: 22.3193,
      longitude: 114.1694,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  }

  /**
   * Download and cache map tiles for offline use
   */
  async cacheMapRegion(region: MapRegion, zoomLevels: number[] = [10, 12, 14, 16]): Promise<void> {
    try {
      const tiles = this.calculateTilesForRegion(region, zoomLevels);
      
      for (const tile of tiles) {
        await this.downloadAndCacheTile(tile);
      }
      
      // Clean up old cache if needed
      await this.cleanupCache();
      
      console.log(`Cached ${tiles.length} tiles for offline use`);
    } catch (error) {
      console.error('Failed to cache map region:', error);
      throw error;
    }
  }

  /**
   * Get cached tile path or download if not available
   */
  async getTileUrl(x: number, y: number, z: number): Promise<string> {
    try {
      const cachedPath = await this.getCachedTilePath(x, y, z);
      
      if (cachedPath && await RNFS.exists(cachedPath)) {
        return `file://${cachedPath}`;
      }
      
      // Return online tile URL if not cached
      return `${this.TILE_SERVER_URL}/${z}/${x}/${y}.png`;
    } catch (error) {
      console.error('Failed to get tile URL:', error);
      return `${this.TILE_SERVER_URL}/${z}/${x}/${y}.png`;
    }
  }

  /**
   * Check if area is available offline
   */
  async isAreaCached(region: MapRegion, zoomLevel: number = 14): Promise<boolean> {
    try {
      const tiles = this.calculateTilesForRegion(region, [zoomLevel]);
      
      for (const tile of tiles) {
        const cachedPath = await this.getCachedTilePath(tile.x, tile.y, tile.z);
        if (!cachedPath || !await RNFS.exists(cachedPath)) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to check cached area:', error);
      return false;
    }
  }

  /**
   * Get cache size in bytes
   */
  async getCacheSize(): Promise<number> {
    try {
      const files = await RNFS.readDir(this.CACHE_DIR);
      let totalSize = 0;
      
      for (const file of files) {
        if (file.isFile()) {
          totalSize += file.size;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return 0;
    }
  }

  /**
   * Clear all cached tiles
   */
  async clearCache(): Promise<void> {
    try {
      if (await RNFS.exists(this.CACHE_DIR)) {
        await RNFS.unlink(this.CACHE_DIR);
      }
      
      await this.createCacheDirectory();
      
      if (this.db) {
        await this.db.executeSql('DELETE FROM cached_tiles');
      }
      
      console.log('Map cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }

  private async createCacheDirectory(): Promise<void> {
    if (!await RNFS.exists(this.CACHE_DIR)) {
      await RNFS.mkdir(this.CACHE_DIR);
    }
  }

  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = SQLite.openDatabase(
        {
          name: 'MapCache.db',
          location: 'default',
        },
        () => {
          this.createTables().then(resolve).catch(reject);
        },
        (error: any) => {
          console.error('Failed to open database:', error);
          reject(error);
        }
      );
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS cached_tiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        z INTEGER NOT NULL,
        local_path TEXT NOT NULL,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(x, y, z)
      )
    `;

    return new Promise((resolve, reject) => {
      this.db!.executeSql(
        createTableQuery,
        [],
        () => resolve(),
        (error: any) => reject(error)
      );
    });
  }

  private calculateTilesForRegion(region: MapRegion, zoomLevels: number[]): MapTile[] {
    const tiles: MapTile[] = [];

    for (const zoom of zoomLevels) {
      const bounds = this.getBoundsFromRegion(region, zoom);
      
      for (let x = bounds.minX; x <= bounds.maxX; x++) {
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
          tiles.push({
            x,
            y,
            z: zoom,
            url: `${this.TILE_SERVER_URL}/${zoom}/${x}/${y}.png`,
          });
        }
      }
    }

    return tiles;
  }

  private getBoundsFromRegion(region: MapRegion, zoom: number) {
    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
    
    const north = latitude + latitudeDelta / 2;
    const south = latitude - latitudeDelta / 2;
    const east = longitude + longitudeDelta / 2;
    const west = longitude - longitudeDelta / 2;

    return {
      minX: this.lon2tile(west, zoom),
      maxX: this.lon2tile(east, zoom),
      minY: this.lat2tile(north, zoom),
      maxY: this.lat2tile(south, zoom),
    };
  }

  private lon2tile(lon: number, zoom: number): number {
    return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
  }

  private lat2tile(lat: number, zoom: number): number {
    return Math.floor(
      ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
        Math.pow(2, zoom)
    );
  }

  private async downloadAndCacheTile(tile: MapTile): Promise<void> {
    try {
      const fileName = `${tile.z}_${tile.x}_${tile.y}.png`;
      const localPath = `${this.CACHE_DIR}/${fileName}`;
      
      // Skip if already cached
      if (await RNFS.exists(localPath)) {
        return;
      }

      // Download tile
      const downloadResult = await RNFS.downloadFile({
        fromUrl: tile.url,
        toFile: localPath,
      }).promise;

      if (downloadResult.statusCode === 200) {
        // Save to database
        await this.saveTileToDatabase(tile.x, tile.y, tile.z, localPath);
      }
    } catch (error) {
      console.error(`Failed to download tile ${tile.x},${tile.y},${tile.z}:`, error);
    }
  }

  private async saveTileToDatabase(x: number, y: number, z: number, localPath: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      this.db!.executeSql(
        'INSERT OR REPLACE INTO cached_tiles (x, y, z, local_path) VALUES (?, ?, ?, ?)',
        [x, y, z, localPath],
        () => resolve(),
        (error: any) => reject(error)
      );
    });
  }

  private async getCachedTilePath(x: number, y: number, z: number): Promise<string | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      this.db!.executeSql(
        'SELECT local_path FROM cached_tiles WHERE x = ? AND y = ? AND z = ?',
        [x, y, z],
        (result: any) => {
          if (result.rows.length > 0) {
            resolve(result.rows.item(0).local_path);
          } else {
            resolve(null);
          }
        },
        (error: any) => {
          console.error('Database query error:', error);
          resolve(null);
        }
      );
    });
  }

  private async cleanupCache(): Promise<void> {
    try {
      const cacheSize = await this.getCacheSize();
      
      if (cacheSize > this.MAX_CACHE_SIZE) {
        // Remove oldest tiles
        if (this.db) {
          await new Promise<void>((resolve, reject) => {
            this.db!.executeSql(
              'DELETE FROM cached_tiles WHERE id IN (SELECT id FROM cached_tiles ORDER BY cached_at ASC LIMIT ?)',
              [Math.floor(cacheSize * 0.2)], // Remove 20% of oldest tiles
              () => resolve(),
              (error: any) => reject(error)
            );
          });
        }
      }
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
    }
  }
}

export default MapService.getInstance();
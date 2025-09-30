import fs from 'fs';
import path from 'path';
import { db } from './connection';
import { logger } from '../utils/logger';

interface Migration {
  id: string;
  filename: string;
  sql: string;
}

class DatabaseMigrator {
  private migrationsPath: string;

  constructor() {
    this.migrationsPath = path.join(__dirname, 'migrations');
  }

  /**
   * Initialize migrations table if it doesn't exist
   */
  private async initializeMigrationsTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    try {
      await db.query(createTableQuery);
      logger.info('Migrations table initialized');
    } catch (error) {
      logger.error('Failed to initialize migrations table:', error);
      throw error;
    }
  }

  /**
   * Get list of executed migrations
   */
  private async getExecutedMigrations(): Promise<string[]> {
    try {
      const result = await db.query('SELECT filename FROM migrations ORDER BY id');
      return result.rows.map((row: any) => row.filename);
    } catch (error) {
      logger.error('Failed to get executed migrations:', error);
      throw error;
    }
  }

  /**
   * Get list of available migration files
   */
  private getMigrationFiles(): Migration[] {
    try {
      const files = fs.readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();

      return files.map(filename => {
        const filePath = path.join(this.migrationsPath, filename);
        const sql = fs.readFileSync(filePath, 'utf8');
        const id = filename.replace('.sql', '');
        
        return { id, filename, sql };
      });
    } catch (error) {
      logger.error('Failed to read migration files:', error);
      throw error;
    }
  }

  /**
   * Execute a single migration
   */
  private async executeMigration(migration: Migration): Promise<void> {
    try {
      await db.transaction(async (client) => {
        // Execute the migration SQL
        await client.query(migration.sql);
        
        // Record the migration as executed
        await client.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [migration.filename]
        );
        
        logger.info(`Migration executed successfully: ${migration.filename}`);
      });
    } catch (error) {
      logger.error(`Failed to execute migration ${migration.filename}:`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  public async migrate(): Promise<void> {
    try {
      logger.info('Starting database migration...');
      
      // Initialize migrations table
      await this.initializeMigrationsTable();
      
      // Get executed and available migrations
      const executedMigrations = await this.getExecutedMigrations();
      const availableMigrations = this.getMigrationFiles();
      
      // Filter pending migrations
      const pendingMigrations = availableMigrations.filter(
        migration => !executedMigrations.includes(migration.filename)
      );
      
      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations found');
        return;
      }
      
      logger.info(`Found ${pendingMigrations.length} pending migrations`);
      
      // Execute pending migrations
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }
      
      logger.info('Database migration completed successfully');
    } catch (error) {
      logger.error('Database migration failed:', error);
      throw error;
    }
  }

  /**
   * Rollback the last migration (basic implementation)
   */
  public async rollback(): Promise<void> {
    try {
      logger.info('Starting migration rollback...');
      
      const result = await db.query(
        'SELECT filename FROM migrations ORDER BY id DESC LIMIT 1'
      );
      
      if (result.rows.length === 0) {
        logger.info('No migrations to rollback');
        return;
      }
      
      const lastMigration = result.rows[0].filename;
      
      // For now, we'll just remove the migration record
      // In a production system, you'd want proper rollback scripts
      await db.query('DELETE FROM migrations WHERE filename = $1', [lastMigration]);
      
      logger.warn(`Migration record removed: ${lastMigration}`);
      logger.warn('Note: This is a basic rollback. Manual cleanup may be required.');
    } catch (error) {
      logger.error('Migration rollback failed:', error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  public async getStatus(): Promise<{
    executed: string[];
    pending: string[];
    total: number;
  }> {
    try {
      await this.initializeMigrationsTable();
      
      const executedMigrations = await this.getExecutedMigrations();
      const availableMigrations = this.getMigrationFiles();
      
      const pendingMigrations = availableMigrations
        .filter(migration => !executedMigrations.includes(migration.filename))
        .map(migration => migration.filename);
      
      return {
        executed: executedMigrations,
        pending: pendingMigrations,
        total: availableMigrations.length,
      };
    } catch (error) {
      logger.error('Failed to get migration status:', error);
      throw error;
    }
  }

  /**
   * Create a new migration file
   */
  public createMigration(name: string): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
    const filePath = path.join(this.migrationsPath, filename);
    
    const template = `-- Migration: ${filename}
-- Description: ${name}
-- Created: ${new Date().toISOString().split('T')[0]}

-- Add your migration SQL here
-- Example:
-- CREATE TABLE example (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );
`;
    
    fs.writeFileSync(filePath, template);
    logger.info(`Migration file created: ${filename}`);
    
    return filename;
  }
}

export const migrator = new DatabaseMigrator();
export default DatabaseMigrator;
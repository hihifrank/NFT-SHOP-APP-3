import { PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/connection';
import { Transaction } from '../models/Transaction';
import { ITransactionRepository } from '../types/interfaces';
import { logger } from '../utils/logger';

export class TransactionRepository implements ITransactionRepository {
  /**
   * Create a new transaction record
   */
  async create(transactionData: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const id = uuidv4();
    const now = new Date();
    
    const query = `
      INSERT INTO transactions (
        id, user_id, nft_id, transaction_type, transaction_hash, 
        block_number, gas_used, gas_price, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      id,
      transactionData.userId,
      transactionData.nftId,
      transactionData.transactionType,
      transactionData.transactionHash,
      transactionData.blockNumber,
      transactionData.gasUsed,
      transactionData.gasPrice,
      now
    ];

    try {
      const result = await db.query(query, values);
      logger.info('Created transaction record:', { 
        id, 
        type: transactionData.transactionType,
        hash: transactionData.transactionHash 
      });
      return Transaction.fromDatabaseRow(result.rows[0]);
    } catch (error) {
      logger.error('Error creating transaction:', error);
      throw new Error('Failed to create transaction record');
    }
  }

  /**
   * Find transaction by ID
   */
  async findById(id: string): Promise<Transaction | null> {
    const query = 'SELECT * FROM transactions WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      if (result.rows.length === 0) {
        return null;
      }
      return Transaction.fromDatabaseRow(result.rows[0]);
    } catch (error) {
      logger.error('Error finding transaction by ID:', error);
      throw new Error('Failed to find transaction');
    }
  }

  /**
   * Find all transactions for a user
   */
  async findByUser(userId: string): Promise<Transaction[]> {
    const query = `
      SELECT * FROM transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    
    try {
      const result = await db.query(query, [userId]);
      return result.rows.map((row: any) => Transaction.fromDatabaseRow(row));
    } catch (error) {
      logger.error('Error finding transactions by user:', error);
      throw new Error('Failed to find user transactions');
    }
  }

  /**
   * Find all transactions for an NFT
   */
  async findByNFT(nftId: string): Promise<Transaction[]> {
    const query = `
      SELECT * FROM transactions 
      WHERE nft_id = $1 
      ORDER BY created_at DESC
    `;
    
    try {
      const result = await db.query(query, [nftId]);
      return result.rows.map((row: any) => Transaction.fromDatabaseRow(row));
    } catch (error) {
      logger.error('Error finding transactions by NFT:', error);
      throw new Error('Failed to find NFT transactions');
    }
  }

  /**
   * Find transactions by type
   */
  async findByType(type: Transaction['transactionType']): Promise<Transaction[]> {
    const query = `
      SELECT * FROM transactions 
      WHERE transaction_type = $1 
      ORDER BY created_at DESC
    `;
    
    try {
      const result = await db.query(query, [type]);
      return result.rows.map((row: any) => Transaction.fromDatabaseRow(row));
    } catch (error) {
      logger.error('Error finding transactions by type:', error);
      throw new Error('Failed to find transactions by type');
    }
  }

  /**
   * Find transaction by blockchain transaction hash
   */
  async findByTransactionHash(hash: string): Promise<Transaction | null> {
    const query = 'SELECT * FROM transactions WHERE transaction_hash = $1';
    
    try {
      const result = await db.query(query, [hash]);
      if (result.rows.length === 0) {
        return null;
      }
      return Transaction.fromDatabaseRow(result.rows[0]);
    } catch (error) {
      logger.error('Error finding transaction by hash:', error);
      throw new Error('Failed to find transaction by hash');
    }
  }

  /**
   * Get transaction statistics for a user
   */
  async getUserTransactionStats(userId: string): Promise<{
    totalTransactions: number;
    mintedCoupons: number;
    usedCoupons: number;
    transferredCoupons: number;
    recycledCoupons: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN transaction_type = 'mint' THEN 1 END) as minted_coupons,
        COUNT(CASE WHEN transaction_type = 'use' THEN 1 END) as used_coupons,
        COUNT(CASE WHEN transaction_type = 'transfer' THEN 1 END) as transferred_coupons,
        COUNT(CASE WHEN transaction_type = 'recycle' THEN 1 END) as recycled_coupons
      FROM transactions 
      WHERE user_id = $1
    `;
    
    try {
      const result = await db.query(query, [userId]);
      const row = result.rows[0];
      
      return {
        totalTransactions: parseInt(row.total_transactions),
        mintedCoupons: parseInt(row.minted_coupons),
        usedCoupons: parseInt(row.used_coupons),
        transferredCoupons: parseInt(row.transferred_coupons),
        recycledCoupons: parseInt(row.recycled_coupons)
      };
    } catch (error) {
      logger.error('Error getting user transaction stats:', error);
      throw new Error('Failed to get transaction statistics');
    }
  }

  /**
   * Get recent transactions with pagination
   */
  async findRecent(options: {
    limit?: number;
    offset?: number;
    userId?: string;
    transactionType?: string;
  } = {}): Promise<{ transactions: Transaction[]; total: number }> {
    const { limit = 20, offset = 0, userId, transactionType } = options;

    let whereConditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (userId) {
      whereConditions.push(`user_id = $${paramIndex}`);
      values.push(userId);
      paramIndex++;
    }

    if (transactionType) {
      whereConditions.push(`transaction_type = $${paramIndex}`);
      values.push(transactionType);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `SELECT COUNT(*) FROM transactions ${whereClause}`;
    
    // Data query
    const dataQuery = `
      SELECT * FROM transactions 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);

    try {
      const [countResult, dataResult] = await Promise.all([
        db.query(countQuery, values.slice(0, -2)),
        db.query(dataQuery, values)
      ]);

      const total = parseInt(countResult.rows[0].count);
      const transactions = dataResult.rows.map((row: any) => Transaction.fromDatabaseRow(row));

      return { transactions, total };
    } catch (error) {
      logger.error('Error finding recent transactions:', error);
      throw new Error('Failed to find recent transactions');
    }
  }

  /**
   * Execute within a transaction
   */
  async withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    return db.transaction(callback);
  }
}

export default TransactionRepository;
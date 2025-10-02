import { PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/connection';
import { CouponNFT } from '../models/CouponNFT';
import { ICouponNFTRepository } from '../types/interfaces';
import { logger } from '../utils/logger';

export class CouponNFTRepository implements ICouponNFTRepository {
  /**
   * Create a new coupon NFT record
   */
  async create(couponNFTData: Omit<CouponNFT, 'id' | 'createdAt'>): Promise<CouponNFT> {
    const id = uuidv4();
    const now = new Date();
    
    const query = `
      INSERT INTO coupon_nfts (
        id, token_id, merchant_id, current_owner_id, original_owner_id,
        coupon_type, title, title_en, title_zh_cn, description, description_en, description_zh_cn,
        discount_value, discount_type, minimum_purchase, max_quantity, remaining_quantity, total_minted,
        rarity, expiry_date, is_used, used_at, is_transferable, is_active,
        metadata_uri, image_url, terms_and_conditions, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
      ) RETURNING *
    `;

    const values = [
      id,
      couponNFTData.tokenId.toString(),
      couponNFTData.merchantId,
      couponNFTData.currentOwnerId,
      couponNFTData.originalOwnerId,
      couponNFTData.couponType,
      couponNFTData.title,
      couponNFTData.titleEn,
      couponNFTData.titleZhCn,
      couponNFTData.description,
      couponNFTData.descriptionEn,
      couponNFTData.descriptionZhCn,
      couponNFTData.discountValue,
      couponNFTData.discountType,
      couponNFTData.minimumPurchase,
      couponNFTData.maxQuantity,
      couponNFTData.remainingQuantity,
      couponNFTData.totalMinted,
      couponNFTData.rarity,
      couponNFTData.expiryDate,
      couponNFTData.isUsed,
      couponNFTData.usedAt,
      couponNFTData.isTransferable,
      couponNFTData.isActive,
      couponNFTData.metadataUri,
      couponNFTData.imageUrl,
      couponNFTData.termsAndConditions,
      now,
      now
    ];

    try {
      const result = await db.query(query, values);
      logger.info('Created coupon NFT:', { id, tokenId: couponNFTData.tokenId.toString() });
      return CouponNFT.fromDatabaseRow(result.rows[0]);
    } catch (error) {
      logger.error('Error creating coupon NFT:', error);
      throw new Error('Failed to create coupon NFT');
    }
  }

  /**
   * Find coupon NFT by ID
   */
  async findById(id: string): Promise<CouponNFT | null> {
    const query = 'SELECT * FROM coupon_nfts WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      if (result.rows.length === 0) {
        return null;
      }
      return CouponNFT.fromDatabaseRow(result.rows[0]);
    } catch (error) {
      logger.error('Error finding coupon NFT by ID:', error);
      throw new Error('Failed to find coupon NFT');
    }
  }

  /**
   * Find coupon NFT by token ID
   */
  async findByTokenId(tokenId: bigint): Promise<CouponNFT | null> {
    const query = 'SELECT * FROM coupon_nfts WHERE token_id = $1';
    
    try {
      const result = await db.query(query, [tokenId.toString()]);
      if (result.rows.length === 0) {
        return null;
      }
      return CouponNFT.fromDatabaseRow(result.rows[0]);
    } catch (error) {
      logger.error('Error finding coupon NFT by token ID:', error);
      throw new Error('Failed to find coupon NFT');
    }
  }

  /**
   * Find all coupon NFTs owned by a user
   */
  async findByOwner(ownerId: string): Promise<CouponNFT[]> {
    const query = `
      SELECT * FROM coupon_nfts 
      WHERE current_owner_id = $1 
      ORDER BY created_at DESC
    `;
    
    try {
      const result = await db.query(query, [ownerId]);
      return result.rows.map((row: any) => CouponNFT.fromDatabaseRow(row));
    } catch (error) {
      logger.error('Error finding coupon NFTs by owner:', error);
      throw new Error('Failed to find coupon NFTs by owner');
    }
  }

  /**
   * Find all coupon NFTs created by a merchant
   */
  async findByMerchant(merchantId: string): Promise<CouponNFT[]> {
    const query = `
      SELECT * FROM coupon_nfts 
      WHERE merchant_id = $1 
      ORDER BY created_at DESC
    `;
    
    try {
      const result = await db.query(query, [merchantId]);
      return result.rows.map((row: any) => CouponNFT.fromDatabaseRow(row));
    } catch (error) {
      logger.error('Error finding coupon NFTs by merchant:', error);
      throw new Error('Failed to find coupon NFTs by merchant');
    }
  }

  /**
   * Update coupon NFT
   */
  async update(id: string, updates: Partial<CouponNFT>): Promise<CouponNFT> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'createdAt') {
        const dbField = this.camelToSnakeCase(key);
        updateFields.push(`${dbField} = $${paramIndex}`);
        
        if (key === 'tokenId') {
          values.push(value.toString());
        } else {
          values.push(value);
        }
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Always update the updated_at field
    updateFields.push(`updated_at = $${paramIndex}`);
    values.push(new Date());
    paramIndex++;

    // Add the ID for the WHERE clause
    values.push(id);

    const query = `
      UPDATE coupon_nfts 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await db.query(query, values);
      if (result.rows.length === 0) {
        throw new Error('Coupon NFT not found');
      }
      logger.info('Updated coupon NFT:', { id });
      return CouponNFT.fromDatabaseRow(result.rows[0]);
    } catch (error) {
      logger.error('Error updating coupon NFT:', error);
      throw new Error('Failed to update coupon NFT');
    }
  }

  /**
   * Delete coupon NFT (soft delete by setting is_active to false)
   */
  async delete(id: string): Promise<boolean> {
    const query = `
      UPDATE coupon_nfts 
      SET is_active = false, updated_at = $1 
      WHERE id = $2
    `;
    
    try {
      const result = await db.query(query, [new Date(), id]);
      const deleted = result.rowCount > 0;
      if (deleted) {
        logger.info('Deleted coupon NFT:', { id });
      }
      return deleted;
    } catch (error) {
      logger.error('Error deleting coupon NFT:', error);
      throw new Error('Failed to delete coupon NFT');
    }
  }

  /**
   * Find available coupons with pagination and filters
   */
  async findAvailable(options: {
    limit?: number;
    offset?: number;
    merchantId?: string;
    category?: string;
    rarity?: string;
    minDiscount?: number;
    maxDiscount?: number;
  } = {}): Promise<{ coupons: CouponNFT[]; total: number }> {
    const {
      limit = 20,
      offset = 0,
      merchantId,
      category,
      rarity,
      minDiscount,
      maxDiscount
    } = options;

    let whereConditions = ['is_active = true', 'is_used = false'];
    const values: any[] = [];
    let paramIndex = 1;

    // Add filters
    if (merchantId) {
      whereConditions.push(`merchant_id = $${paramIndex}`);
      values.push(merchantId);
      paramIndex++;
    }

    if (rarity) {
      whereConditions.push(`rarity = $${paramIndex}`);
      values.push(rarity);
      paramIndex++;
    }

    if (minDiscount !== undefined) {
      whereConditions.push(`discount_value >= $${paramIndex}`);
      values.push(minDiscount);
      paramIndex++;
    }

    if (maxDiscount !== undefined) {
      whereConditions.push(`discount_value <= $${paramIndex}`);
      values.push(maxDiscount);
      paramIndex++;
    }

    // Add expiry check
    whereConditions.push('(expiry_date IS NULL OR expiry_date > NOW())');

    const whereClause = whereConditions.join(' AND ');

    // Count query
    const countQuery = `SELECT COUNT(*) FROM coupon_nfts WHERE ${whereClause}`;
    
    // Data query
    const dataQuery = `
      SELECT * FROM coupon_nfts 
      WHERE ${whereClause}
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
      const coupons = dataResult.rows.map((row: any) => CouponNFT.fromDatabaseRow(row));

      return { coupons, total };
    } catch (error) {
      logger.error('Error finding available coupons:', error);
      throw new Error('Failed to find available coupons');
    }
  }

  /**
   * Convert camelCase to snake_case for database fields
   */
  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Execute within a transaction
   */
  async withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    return db.transaction(callback);
  }
}

export default CouponNFTRepository;
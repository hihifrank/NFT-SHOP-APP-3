import Joi from 'joi';
import { CouponNFT as ICouponNFT } from '../types';
import { logger } from '../utils/logger';

export type CouponType = 'percentage' | 'fixed_amount' | 'buy_one_get_one' | 'free_item';
export type DiscountType = 'percentage' | 'fixed_amount';
export type RarityType = 'common' | 'rare' | 'epic' | 'legendary';

export class CouponNFT implements ICouponNFT {
  public id: string;
  public tokenId: bigint;
  public merchantId: string;
  public currentOwnerId?: string;
  public originalOwnerId?: string;
  public couponType: CouponType;
  public title: string;
  public titleEn?: string;
  public titleZhCn?: string;
  public description?: string;
  public descriptionEn?: string;
  public descriptionZhCn?: string;
  public discountValue: number;
  public discountType: DiscountType;
  public minimumPurchase: number;
  public maxQuantity: number;
  public remainingQuantity: number;
  public totalMinted: number;
  public rarity: RarityType;
  public expiryDate?: Date;
  public isUsed: boolean;
  public usedAt?: Date;
  public isTransferable: boolean;
  public isActive: boolean;
  public metadataUri?: string;
  public imageUrl?: string;
  public termsAndConditions?: string;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: Partial<ICouponNFT> & { 
    tokenId: bigint; 
    merchantId: string; 
    couponType: CouponType;
    title: string;
    discountValue: number;
    discountType: DiscountType;
    maxQuantity: number;
  }) {
    this.id = data.id || '';
    this.tokenId = data.tokenId;
    this.merchantId = data.merchantId;
    this.currentOwnerId = data.currentOwnerId;
    this.originalOwnerId = data.originalOwnerId;
    this.couponType = data.couponType;
    this.title = data.title;
    this.titleEn = data.titleEn;
    this.titleZhCn = data.titleZhCn;
    this.description = data.description;
    this.descriptionEn = data.descriptionEn;
    this.descriptionZhCn = data.descriptionZhCn;
    this.discountValue = data.discountValue;
    this.discountType = data.discountType;
    this.minimumPurchase = data.minimumPurchase || 0;
    this.maxQuantity = data.maxQuantity;
    this.remainingQuantity = data.remainingQuantity ?? data.maxQuantity;
    this.totalMinted = data.totalMinted || 0;
    this.rarity = (data.rarity as RarityType) || 'common';
    this.expiryDate = data.expiryDate;
    this.isUsed = data.isUsed ?? false;
    this.usedAt = data.usedAt;
    this.isTransferable = data.isTransferable ?? true;
    this.isActive = data.isActive ?? true;
    this.metadataUri = data.metadataUri;
    this.imageUrl = data.imageUrl;
    this.termsAndConditions = data.termsAndConditions;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validation schema for coupon NFT data
   */
  private static getValidationSchema() {
    return Joi.object({
      tokenId: Joi.alternatives()
        .try(
          Joi.number().integer().positive(),
          Joi.string().pattern(/^\d+$/),
          Joi.custom((value, helpers) => {
            if (typeof value === 'bigint' && value > 0n) {
              return value;
            }
            return helpers.error('any.invalid');
          })
        )
        .required()
        .messages({
          'any.required': 'Token ID is required',
          'alternatives.match': 'Token ID must be a positive integer',
          'any.invalid': 'Token ID must be a positive integer'
        }),
      
      merchantId: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.uuid': 'Merchant ID must be a valid UUID',
          'any.required': 'Merchant ID is required'
        }),
      
      currentOwnerId: Joi.string().uuid().optional(),
      originalOwnerId: Joi.string().uuid().optional(),
      
      couponType: Joi.string()
        .valid('percentage', 'fixed_amount', 'buy_one_get_one', 'free_item')
        .required()
        .messages({
          'any.only': 'Coupon type must be one of: percentage, fixed_amount, buy_one_get_one, free_item',
          'any.required': 'Coupon type is required'
        }),
      
      title: Joi.string()
        .min(3)
        .max(255)
        .required()
        .messages({
          'string.min': 'Title must be at least 3 characters long',
          'string.max': 'Title must not exceed 255 characters',
          'any.required': 'Title is required'
        }),
      
      titleEn: Joi.string().max(255).optional(),
      titleZhCn: Joi.string().max(255).optional(),
      
      description: Joi.string().max(1000).optional(),
      descriptionEn: Joi.string().max(1000).optional(),
      descriptionZhCn: Joi.string().max(1000).optional(),
      
      discountValue: Joi.number()
        .positive()
        .required()
        .messages({
          'number.positive': 'Discount value must be positive',
          'any.required': 'Discount value is required'
        }),
      
      discountType: Joi.string()
        .valid('percentage', 'fixed_amount')
        .required()
        .messages({
          'any.only': 'Discount type must be either percentage or fixed_amount',
          'any.required': 'Discount type is required'
        }),
      
      minimumPurchase: Joi.number()
        .min(0)
        .default(0)
        .messages({
          'number.min': 'Minimum purchase cannot be negative'
        }),
      
      maxQuantity: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
          'number.integer': 'Max quantity must be an integer',
          'number.positive': 'Max quantity must be positive',
          'any.required': 'Max quantity is required'
        }),
      
      remainingQuantity: Joi.number()
        .integer()
        .min(0)
        .optional(),
      
      totalMinted: Joi.number()
        .integer()
        .min(0)
        .default(0),
      
      rarity: Joi.string()
        .valid('common', 'rare', 'epic', 'legendary')
        .default('common')
        .messages({
          'any.only': 'Rarity must be one of: common, rare, epic, legendary'
        }),
      
      expiryDate: Joi.date()
        .greater('now')
        .optional()
        .messages({
          'date.greater': 'Expiry date must be in the future'
        }),
      
      isUsed: Joi.boolean().default(false),
      usedAt: Joi.date().optional(),
      isTransferable: Joi.boolean().default(true),
      isActive: Joi.boolean().default(true),
      
      metadataUri: Joi.string().uri().optional(),
      imageUrl: Joi.string().uri().optional(),
      termsAndConditions: Joi.string().max(2000).optional()
    });
  }

  /**
   * Validate coupon NFT data
   */
  public static validate(data: any): { error?: Joi.ValidationError; value?: any } {
    const schema = CouponNFT.getValidationSchema();
    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Create a new CouponNFT instance with validation
   */
  public static create(data: Partial<ICouponNFT> & { 
    tokenId: bigint; 
    merchantId: string; 
    couponType: CouponType;
    title: string;
    discountValue: number;
    discountType: DiscountType;
    maxQuantity: number;
  }): CouponNFT {
    const { error, value } = CouponNFT.validate(data);
    
    if (error) {
      logger.error('CouponNFT validation failed:', error.details);
      throw new Error(`CouponNFT validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }
    
    return new CouponNFT(value);
  }

  /**
   * Update coupon NFT data with validation
   */
  public update(updates: Partial<ICouponNFT>): void {
    // Create a schema that only validates the fields being updated
    const updateSchema = Joi.object({
      title: Joi.string().min(3).max(255).optional(),
      titleEn: Joi.string().max(255).optional(),
      titleZhCn: Joi.string().max(255).optional(),
      description: Joi.string().max(1000).optional(),
      descriptionEn: Joi.string().max(1000).optional(),
      descriptionZhCn: Joi.string().max(1000).optional(),
      discountValue: Joi.number().positive().optional(),
      minimumPurchase: Joi.number().min(0).optional(),
      remainingQuantity: Joi.number().integer().min(0).optional(),
      totalMinted: Joi.number().integer().min(0).optional(),
      rarity: Joi.string().valid('common', 'rare', 'epic', 'legendary').optional(),
      expiryDate: Joi.date().greater('now').optional(),
      isUsed: Joi.boolean().optional(),
      usedAt: Joi.date().optional(),
      isTransferable: Joi.boolean().optional(),
      isActive: Joi.boolean().optional(),
      metadataUri: Joi.string().uri().optional(),
      imageUrl: Joi.string().uri().optional(),
      termsAndConditions: Joi.string().max(2000).optional()
    });
    
    const { error, value } = updateSchema.validate(updates, { abortEarly: false });
    
    if (error) {
      logger.error('CouponNFT update validation failed:', error.details);
      throw new Error(`CouponNFT update validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }
    
    Object.assign(this, value);
    this.updatedAt = new Date();
  }

  /**
   * Check if coupon is valid for use
   */
  public isValidForUse(): { valid: boolean; reason?: string } {
    if (this.isUsed) {
      return { valid: false, reason: 'Coupon has already been used' };
    }
    
    if (!this.isActive) {
      return { valid: false, reason: 'Coupon is not active' };
    }
    
    if (this.remainingQuantity <= 0) {
      return { valid: false, reason: 'No remaining quantity available' };
    }
    
    if (this.expiryDate && new Date() > this.expiryDate) {
      return { valid: false, reason: 'Coupon has expired' };
    }
    
    return { valid: true };
  }

  /**
   * Check if coupon can be transferred
   */
  public canBeTransferred(): { transferable: boolean; reason?: string } {
    if (this.isUsed) {
      return { transferable: false, reason: 'Used coupons cannot be transferred' };
    }
    
    if (!this.isTransferable) {
      return { transferable: false, reason: 'This coupon is not transferable' };
    }
    
    if (!this.isActive) {
      return { transferable: false, reason: 'Inactive coupons cannot be transferred' };
    }
    
    if (this.expiryDate && new Date() > this.expiryDate) {
      return { transferable: false, reason: 'Expired coupons cannot be transferred' };
    }
    
    return { transferable: true };
  }

  /**
   * Use the coupon
   */
  public use(userId: string): void {
    const validation = this.isValidForUse();
    if (!validation.valid) {
      throw new Error(validation.reason);
    }
    
    this.isUsed = true;
    this.usedAt = new Date();
    this.currentOwnerId = userId;
    this.remainingQuantity = Math.max(0, this.remainingQuantity - 1);
    this.updatedAt = new Date();
  }

  /**
   * Transfer the coupon to another user
   */
  public transfer(fromUserId: string, toUserId: string): void {
    if (this.currentOwnerId !== fromUserId) {
      throw new Error('Only the current owner can transfer the coupon');
    }
    
    const validation = this.canBeTransferred();
    if (!validation.transferable) {
      throw new Error(validation.reason);
    }
    
    this.currentOwnerId = toUserId;
    this.updatedAt = new Date();
  }

  /**
   * Calculate discount amount for a given purchase amount
   */
  public calculateDiscount(purchaseAmount: number): number {
    if (purchaseAmount < this.minimumPurchase) {
      return 0;
    }
    
    if (this.discountType === 'percentage') {
      return Math.min(purchaseAmount * (this.discountValue / 100), purchaseAmount);
    } else {
      return Math.min(this.discountValue, purchaseAmount);
    }
  }

  /**
   * Get rarity multiplier for pricing
   */
  public getRarityMultiplier(): number {
    switch (this.rarity) {
      case 'common': return 1;
      case 'rare': return 2;
      case 'epic': return 5;
      case 'legendary': return 10;
      default: return 1;
    }
  }

  /**
   * Get localized title based on language preference
   */
  public getLocalizedTitle(language: 'zh-HK' | 'zh-CN' | 'en' = 'zh-HK'): string {
    switch (language) {
      case 'en':
        return this.titleEn || this.title;
      case 'zh-CN':
        return this.titleZhCn || this.title;
      default:
        return this.title;
    }
  }

  /**
   * Get localized description based on language preference
   */
  public getLocalizedDescription(language: 'zh-HK' | 'zh-CN' | 'en' = 'zh-HK'): string | undefined {
    switch (language) {
      case 'en':
        return this.descriptionEn || this.description;
      case 'zh-CN':
        return this.descriptionZhCn || this.description;
      default:
        return this.description;
    }
  }

  /**
   * Get days until expiry
   */
  public getDaysUntilExpiry(): number | null {
    if (!this.expiryDate) return null;
    
    const now = new Date();
    const diffTime = this.expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Convert to JSON for API response
   */
  public toJSON(): ICouponNFT {
    return {
      id: this.id,
      tokenId: this.tokenId,
      merchantId: this.merchantId,
      currentOwnerId: this.currentOwnerId,
      originalOwnerId: this.originalOwnerId,
      couponType: this.couponType,
      title: this.title,
      titleEn: this.titleEn,
      titleZhCn: this.titleZhCn,
      description: this.description,
      descriptionEn: this.descriptionEn,
      descriptionZhCn: this.descriptionZhCn,
      discountValue: this.discountValue,
      discountType: this.discountType,
      minimumPurchase: this.minimumPurchase,
      maxQuantity: this.maxQuantity,
      remainingQuantity: this.remainingQuantity,
      totalMinted: this.totalMinted,
      rarity: this.rarity,
      expiryDate: this.expiryDate,
      isUsed: this.isUsed,
      usedAt: this.usedAt,
      isTransferable: this.isTransferable,
      isActive: this.isActive,
      metadataUri: this.metadataUri,
      imageUrl: this.imageUrl,
      termsAndConditions: this.termsAndConditions,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create CouponNFT instance from database row
   */
  public static fromDatabaseRow(row: any): CouponNFT {
    return new CouponNFT({
      id: row.id,
      tokenId: BigInt(row.token_id),
      merchantId: row.merchant_id,
      currentOwnerId: row.current_owner_id,
      originalOwnerId: row.original_owner_id,
      couponType: row.coupon_type,
      title: row.title,
      titleEn: row.title_en,
      titleZhCn: row.title_zh_cn,
      description: row.description,
      descriptionEn: row.description_en,
      descriptionZhCn: row.description_zh_cn,
      discountValue: parseFloat(row.discount_value),
      discountType: row.discount_type,
      minimumPurchase: parseFloat(row.minimum_purchase) || 0,
      maxQuantity: parseInt(row.max_quantity),
      remainingQuantity: parseInt(row.remaining_quantity),
      totalMinted: parseInt(row.total_minted) || 0,
      rarity: row.rarity,
      expiryDate: row.expiry_date ? new Date(row.expiry_date) : undefined,
      isUsed: row.is_used,
      usedAt: row.used_at ? new Date(row.used_at) : undefined,
      isTransferable: row.is_transferable,
      isActive: row.is_active,
      metadataUri: row.metadata_uri,
      imageUrl: row.image_url,
      termsAndConditions: row.terms_and_conditions,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });
  }

  /**
   * Convert to database row format
   */
  public toDatabaseRow(): any {
    return {
      id: this.id,
      token_id: this.tokenId.toString(),
      merchant_id: this.merchantId,
      current_owner_id: this.currentOwnerId,
      original_owner_id: this.originalOwnerId,
      coupon_type: this.couponType,
      title: this.title,
      title_en: this.titleEn,
      title_zh_cn: this.titleZhCn,
      description: this.description,
      description_en: this.descriptionEn,
      description_zh_cn: this.descriptionZhCn,
      discount_value: this.discountValue,
      discount_type: this.discountType,
      minimum_purchase: this.minimumPurchase,
      max_quantity: this.maxQuantity,
      remaining_quantity: this.remainingQuantity,
      total_minted: this.totalMinted,
      rarity: this.rarity,
      expiry_date: this.expiryDate,
      is_used: this.isUsed,
      used_at: this.usedAt,
      is_transferable: this.isTransferable,
      is_active: this.isActive,
      metadata_uri: this.metadataUri,
      image_url: this.imageUrl,
      terms_and_conditions: this.termsAndConditions,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }
}
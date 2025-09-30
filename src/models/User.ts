import Joi from 'joi';
import { User as IUser } from '../types';
import { logger } from '../utils/logger';

export class User implements IUser {
  public id: string;
  public walletAddress: string;
  public email?: string;
  public username?: string;
  public preferredLanguage: 'zh-HK' | 'zh-CN' | 'en';
  public profileImageUrl?: string;
  public isActive: boolean;
  public emailVerified: boolean;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: Partial<IUser> & { walletAddress: string }) {
    this.id = data.id || '';
    this.walletAddress = data.walletAddress;
    this.email = data.email;
    this.username = data.username;
    this.preferredLanguage = data.preferredLanguage || 'zh-HK';
    this.profileImageUrl = data.profileImageUrl;
    this.isActive = data.isActive ?? true;
    this.emailVerified = data.emailVerified ?? false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validation schema for user data
   */
  private static getValidationSchema() {
    return Joi.object({
      walletAddress: Joi.string()
        .pattern(/^0x[a-fA-F0-9]{40}$/)
        .required()
        .messages({
          'string.pattern.base': 'Wallet address must be a valid Ethereum address',
          'any.required': 'Wallet address is required'
        }),
      
      email: Joi.string()
        .email()
        .optional()
        .messages({
          'string.email': 'Email must be a valid email address'
        }),
      
      username: Joi.string()
        .min(3)
        .max(50)
        .pattern(/^[a-zA-Z0-9_-]+$/)
        .optional()
        .messages({
          'string.min': 'Username must be at least 3 characters long',
          'string.max': 'Username must not exceed 50 characters',
          'string.pattern.base': 'Username can only contain letters, numbers, underscores, and hyphens'
        }),
      
      preferredLanguage: Joi.string()
        .valid('zh-HK', 'zh-CN', 'en')
        .default('zh-HK')
        .messages({
          'any.only': 'Preferred language must be one of: zh-HK, zh-CN, en'
        }),
      
      profileImageUrl: Joi.string()
        .uri()
        .optional()
        .messages({
          'string.uri': 'Profile image URL must be a valid URL'
        }),
      
      isActive: Joi.boolean().default(true),
      emailVerified: Joi.boolean().default(false)
    });
  }

  /**
   * Validate user data
   */
  public static validate(data: any): { error?: Joi.ValidationError; value?: any } {
    const schema = User.getValidationSchema();
    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Create a new User instance with validation
   */
  public static create(data: Partial<IUser> & { walletAddress: string }): User {
    const { error, value } = User.validate(data);
    
    if (error) {
      logger.error('User validation failed:', error.details);
      throw new Error(`User validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }
    
    return new User(value);
  }

  /**
   * Update user data with validation
   */
  public update(updates: Partial<IUser>): void {
    // Create a schema that only validates the fields being updated
    const updateSchema = Joi.object({
      walletAddress: Joi.string()
        .pattern(/^0x[a-fA-F0-9]{40}$/)
        .optional()
        .messages({
          'string.pattern.base': 'Wallet address must be a valid Ethereum address'
        }),
      
      email: Joi.string()
        .email()
        .optional()
        .messages({
          'string.email': 'Email must be a valid email address'
        }),
      
      username: Joi.string()
        .min(3)
        .max(50)
        .pattern(/^[a-zA-Z0-9_-]+$/)
        .optional()
        .messages({
          'string.min': 'Username must be at least 3 characters long',
          'string.max': 'Username must not exceed 50 characters',
          'string.pattern.base': 'Username can only contain letters, numbers, underscores, and hyphens'
        }),
      
      preferredLanguage: Joi.string()
        .valid('zh-HK', 'zh-CN', 'en')
        .optional()
        .messages({
          'any.only': 'Preferred language must be one of: zh-HK, zh-CN, en'
        }),
      
      profileImageUrl: Joi.string()
        .uri()
        .optional()
        .messages({
          'string.uri': 'Profile image URL must be a valid URL'
        }),
      
      isActive: Joi.boolean().optional(),
      emailVerified: Joi.boolean().optional()
    });
    
    const { error, value } = updateSchema.validate(updates, { abortEarly: false });
    
    if (error) {
      logger.error('User update validation failed:', error.details);
      throw new Error(`User update validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }
    
    // Apply updates
    Object.assign(this, value);
    this.updatedAt = new Date();
  }

  /**
   * Check if user has a complete profile
   */
  public hasCompleteProfile(): boolean {
    return !!(this.email && this.username && this.profileImageUrl);
  }

  /**
   * Check if user can participate in lotteries
   */
  public canParticipateInLotteries(): boolean {
    return this.isActive && this.emailVerified;
  }

  /**
   * Get user's display name
   */
  public getDisplayName(): string {
    return this.username || this.email || `${this.walletAddress.slice(0, 6)}...${this.walletAddress.slice(-4)}`;
  }

  /**
   * Check if wallet address is valid
   */
  public static isValidWalletAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Sanitize user data for public display
   */
  public toPublicJSON(): Partial<IUser> {
    return {
      id: this.id,
      username: this.username,
      preferredLanguage: this.preferredLanguage,
      profileImageUrl: this.profileImageUrl,
      createdAt: this.createdAt
    };
  }

  /**
   * Convert to JSON for database storage
   */
  public toJSON(): IUser {
    return {
      id: this.id,
      walletAddress: this.walletAddress,
      email: this.email,
      username: this.username,
      preferredLanguage: this.preferredLanguage,
      profileImageUrl: this.profileImageUrl,
      isActive: this.isActive,
      emailVerified: this.emailVerified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create User instance from database row
   */
  public static fromDatabaseRow(row: any): User {
    return new User({
      id: row.id,
      walletAddress: row.wallet_address,
      email: row.email,
      username: row.username,
      preferredLanguage: row.preferred_language,
      profileImageUrl: row.profile_image_url,
      isActive: row.is_active,
      emailVerified: row.email_verified,
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
      wallet_address: this.walletAddress,
      email: this.email,
      username: this.username,
      preferred_language: this.preferredLanguage,
      profile_image_url: this.profileImageUrl,
      is_active: this.isActive,
      email_verified: this.emailVerified,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }
}
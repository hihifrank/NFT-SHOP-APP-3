import Joi from 'joi';
import { Merchant as IMerchant } from '../types';
import { logger } from '../utils/logger';

export interface BusinessHours {
  [key: string]: {
    open: string;
    close: string;
    isClosed: boolean;
  };
}

export class Merchant implements IMerchant {
  public id: string;
  public ownerId?: string;
  public name: string;
  public nameEn?: string;
  public nameZhCn?: string;
  public description?: string;
  public descriptionEn?: string;
  public descriptionZhCn?: string;
  public address: string;
  public addressEn?: string;
  public addressZhCn?: string;
  public latitude: number;
  public longitude: number;
  public category: string;
  public subcategory?: string;
  public phone?: string;
  public email?: string;
  public website?: string;
  public businessHours?: BusinessHours;
  public isNftParticipant: boolean;
  public isVerified: boolean;
  public isActive: boolean;
  public rating: number;
  public totalReviews: number;
  public logoUrl?: string;
  public coverImageUrl?: string;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: Partial<IMerchant> & { name: string; address: string; latitude: number; longitude: number; category: string }) {
    this.id = data.id || '';
    this.ownerId = data.ownerId;
    this.name = data.name;
    this.nameEn = data.nameEn;
    this.nameZhCn = data.nameZhCn;
    this.description = data.description;
    this.descriptionEn = data.descriptionEn;
    this.descriptionZhCn = data.descriptionZhCn;
    this.address = data.address;
    this.addressEn = data.addressEn;
    this.addressZhCn = data.addressZhCn;
    this.latitude = data.latitude;
    this.longitude = data.longitude;
    this.category = data.category;
    this.subcategory = data.subcategory;
    this.phone = data.phone;
    this.email = data.email;
    this.website = data.website;
    this.businessHours = data.businessHours;
    this.isNftParticipant = data.isNftParticipant ?? false;
    this.isVerified = data.isVerified ?? false;
    this.isActive = data.isActive ?? true;
    this.rating = data.rating ?? 0;
    this.totalReviews = data.totalReviews ?? 0;
    this.logoUrl = data.logoUrl;
    this.coverImageUrl = data.coverImageUrl;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validation schema for merchant data
   */
  private static getValidationSchema() {
    return Joi.object({
      ownerId: Joi.string().uuid().optional(),
      
      name: Joi.string()
        .min(2)
        .max(255)
        .required()
        .messages({
          'string.min': 'Merchant name must be at least 2 characters long',
          'string.max': 'Merchant name must not exceed 255 characters',
          'any.required': 'Merchant name is required'
        }),
      
      nameEn: Joi.string().max(255).optional(),
      nameZhCn: Joi.string().max(255).optional(),
      
      description: Joi.string().max(1000).optional(),
      descriptionEn: Joi.string().max(1000).optional(),
      descriptionZhCn: Joi.string().max(1000).optional(),
      
      address: Joi.string()
        .min(10)
        .max(500)
        .required()
        .messages({
          'string.min': 'Address must be at least 10 characters long',
          'string.max': 'Address must not exceed 500 characters',
          'any.required': 'Address is required'
        }),
      
      addressEn: Joi.string().max(500).optional(),
      addressZhCn: Joi.string().max(500).optional(),
      
      latitude: Joi.number()
        .min(-90)
        .max(90)
        .required()
        .messages({
          'number.min': 'Latitude must be between -90 and 90',
          'number.max': 'Latitude must be between -90 and 90',
          'any.required': 'Latitude is required'
        }),
      
      longitude: Joi.number()
        .min(-180)
        .max(180)
        .required()
        .messages({
          'number.min': 'Longitude must be between -180 and 180',
          'number.max': 'Longitude must be between -180 and 180',
          'any.required': 'Longitude is required'
        }),
      
      category: Joi.string()
        .valid(
          'restaurant', 'retail', 'beauty', 'health', 'entertainment',
          'education', 'services', 'technology', 'fashion', 'sports',
          'travel', 'automotive', 'home', 'other'
        )
        .required()
        .messages({
          'any.only': 'Category must be a valid business category',
          'any.required': 'Category is required'
        }),
      
      subcategory: Joi.string().max(100).optional(),
      
      phone: Joi.string()
        .pattern(/^[\+]?[0-9\s\-\(\)]{8,20}$/)
        .optional()
        .messages({
          'string.pattern.base': 'Phone number must be a valid format'
        }),
      
      email: Joi.string()
        .email()
        .optional()
        .messages({
          'string.email': 'Email must be a valid email address'
        }),
      
      website: Joi.string()
        .uri()
        .optional()
        .messages({
          'string.uri': 'Website must be a valid URL'
        }),
      
      businessHours: Joi.object().pattern(
        Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
        Joi.object({
          open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
          close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
          isClosed: Joi.boolean().default(false)
        })
      ).optional(),
      
      isNftParticipant: Joi.boolean().default(false),
      isVerified: Joi.boolean().default(false),
      isActive: Joi.boolean().default(true),
      
      rating: Joi.number()
        .min(0)
        .max(5)
        .default(0)
        .messages({
          'number.min': 'Rating must be between 0 and 5',
          'number.max': 'Rating must be between 0 and 5'
        }),
      
      totalReviews: Joi.number().integer().min(0).default(0),
      
      logoUrl: Joi.string().uri().optional(),
      coverImageUrl: Joi.string().uri().optional()
    });
  }

  /**
   * Validate merchant data
   */
  public static validate(data: any): { error?: Joi.ValidationError; value?: any } {
    const schema = Merchant.getValidationSchema();
    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Create a new Merchant instance with validation
   */
  public static create(data: Partial<IMerchant> & { name: string; address: string; latitude: number; longitude: number; category: string }): Merchant {
    const { error, value } = Merchant.validate(data);
    
    if (error) {
      logger.error('Merchant validation failed:', error.details);
      throw new Error(`Merchant validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }
    
    return new Merchant(value);
  }

  /**
   * Update merchant data with validation
   */
  public update(updates: Partial<IMerchant>): void {
    // Create a schema that only validates the fields being updated
    const updateSchema = Joi.object({
      ownerId: Joi.string().uuid().optional(),
      name: Joi.string().min(2).max(255).optional(),
      nameEn: Joi.string().max(255).optional(),
      nameZhCn: Joi.string().max(255).optional(),
      description: Joi.string().max(1000).optional(),
      descriptionEn: Joi.string().max(1000).optional(),
      descriptionZhCn: Joi.string().max(1000).optional(),
      address: Joi.string().min(10).max(500).optional(),
      addressEn: Joi.string().max(500).optional(),
      addressZhCn: Joi.string().max(500).optional(),
      latitude: Joi.number().min(-90).max(90).optional(),
      longitude: Joi.number().min(-180).max(180).optional(),
      category: Joi.string().valid(
        'restaurant', 'retail', 'beauty', 'health', 'entertainment',
        'education', 'services', 'technology', 'fashion', 'sports',
        'travel', 'automotive', 'home', 'other'
      ).optional(),
      subcategory: Joi.string().max(100).optional(),
      phone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)]{8,20}$/).optional(),
      email: Joi.string().email().optional(),
      website: Joi.string().uri().optional(),
      businessHours: Joi.object().pattern(
        Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
        Joi.object({
          open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
          close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
          isClosed: Joi.boolean().default(false)
        })
      ).optional(),
      isNftParticipant: Joi.boolean().optional(),
      isVerified: Joi.boolean().optional(),
      isActive: Joi.boolean().optional(),
      rating: Joi.number().min(0).max(5).optional(),
      totalReviews: Joi.number().integer().min(0).optional(),
      logoUrl: Joi.string().uri().optional(),
      coverImageUrl: Joi.string().uri().optional()
    });
    
    const { error, value } = updateSchema.validate(updates, { abortEarly: false });
    
    if (error) {
      logger.error('Merchant update validation failed:', error.details);
      throw new Error(`Merchant update validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }
    
    Object.assign(this, value);
    this.updatedAt = new Date();
  }

  /**
   * Calculate distance from a given location (in kilometers)
   */
  public distanceFrom(latitude: number, longitude: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(latitude - this.latitude);
    const dLon = this.toRadians(longitude - this.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(this.latitude)) * Math.cos(this.toRadians(latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Check if merchant is currently open
   */
  public isCurrentlyOpen(): boolean {
    if (!this.businessHours) return true; // Assume open if no hours specified
    
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    const todayHours = this.businessHours[dayName];
    if (!todayHours || todayHours.isClosed) return false;
    
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  }

  /**
   * Get localized name based on language preference
   */
  public getLocalizedName(language: 'zh-HK' | 'zh-CN' | 'en' = 'zh-HK'): string {
    switch (language) {
      case 'en':
        return this.nameEn || this.name;
      case 'zh-CN':
        return this.nameZhCn || this.name;
      default:
        return this.name;
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
   * Get localized address based on language preference
   */
  public getLocalizedAddress(language: 'zh-HK' | 'zh-CN' | 'en' = 'zh-HK'): string {
    switch (language) {
      case 'en':
        return this.addressEn || this.address;
      case 'zh-CN':
        return this.addressZhCn || this.address;
      default:
        return this.address;
    }
  }

  /**
   * Check if merchant has complete profile
   */
  public hasCompleteProfile(): boolean {
    return !!(
      this.name &&
      this.description &&
      this.address &&
      this.phone &&
      this.email &&
      this.logoUrl
    );
  }

  /**
   * Update rating based on new review
   */
  public updateRating(newRating: number): void {
    if (newRating < 1 || newRating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    const totalRatingPoints = this.rating * this.totalReviews + newRating;
    this.totalReviews += 1;
    this.rating = Math.round((totalRatingPoints / this.totalReviews) * 100) / 100;
    this.updatedAt = new Date();
  }

  /**
   * Convert to JSON for API response
   */
  public toJSON(): IMerchant {
    return {
      id: this.id,
      ownerId: this.ownerId,
      name: this.name,
      nameEn: this.nameEn,
      nameZhCn: this.nameZhCn,
      description: this.description,
      descriptionEn: this.descriptionEn,
      descriptionZhCn: this.descriptionZhCn,
      address: this.address,
      addressEn: this.addressEn,
      addressZhCn: this.addressZhCn,
      latitude: this.latitude,
      longitude: this.longitude,
      category: this.category,
      subcategory: this.subcategory,
      phone: this.phone,
      email: this.email,
      website: this.website,
      businessHours: this.businessHours,
      isNftParticipant: this.isNftParticipant,
      isVerified: this.isVerified,
      isActive: this.isActive,
      rating: this.rating,
      totalReviews: this.totalReviews,
      logoUrl: this.logoUrl,
      coverImageUrl: this.coverImageUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create Merchant instance from database row
   */
  public static fromDatabaseRow(row: any): Merchant {
    return new Merchant({
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      nameEn: row.name_en,
      nameZhCn: row.name_zh_cn,
      description: row.description,
      descriptionEn: row.description_en,
      descriptionZhCn: row.description_zh_cn,
      address: row.address,
      addressEn: row.address_en,
      addressZhCn: row.address_zh_cn,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      category: row.category,
      subcategory: row.subcategory,
      phone: row.phone,
      email: row.email,
      website: row.website,
      businessHours: row.business_hours,
      isNftParticipant: row.is_nft_participant,
      isVerified: row.is_verified,
      isActive: row.is_active,
      rating: parseFloat(row.rating) || 0,
      totalReviews: parseInt(row.total_reviews) || 0,
      logoUrl: row.logo_url,
      coverImageUrl: row.cover_image_url,
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
      owner_id: this.ownerId,
      name: this.name,
      name_en: this.nameEn,
      name_zh_cn: this.nameZhCn,
      description: this.description,
      description_en: this.descriptionEn,
      description_zh_cn: this.descriptionZhCn,
      address: this.address,
      address_en: this.addressEn,
      address_zh_cn: this.addressZhCn,
      latitude: this.latitude,
      longitude: this.longitude,
      category: this.category,
      subcategory: this.subcategory,
      phone: this.phone,
      email: this.email,
      website: this.website,
      business_hours: this.businessHours,
      is_nft_participant: this.isNftParticipant,
      is_verified: this.isVerified,
      is_active: this.isActive,
      rating: this.rating,
      total_reviews: this.totalReviews,
      logo_url: this.logoUrl,
      cover_image_url: this.coverImageUrl,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }
}
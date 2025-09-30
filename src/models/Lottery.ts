import Joi from 'joi';
import { Lottery as ILottery } from '../types';
import { logger } from '../utils/logger';

export interface LotteryPrize {
  type: 'nft' | 'coupon' | 'token' | 'discount';
  value: string;
  quantity: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  description?: string;
}

export type WinnerSelectionMethod = 'random' | 'first_come_first_serve';

export class Lottery implements ILottery {
  public id: string;
  public name: string;
  public nameEn?: string;
  public nameZhCn?: string;
  public description?: string;
  public descriptionEn?: string;
  public descriptionZhCn?: string;
  public entryFee: number;
  public currency: string;
  public totalPrizes: number;
  public remainingPrizes: number;
  public maxParticipants?: number;
  public currentParticipants: number;
  public prizePool: LotteryPrize[];
  public startTime: Date;
  public endTime: Date;
  public drawTime?: Date;
  public isActive: boolean;
  public isCompleted: boolean;
  public randomSeed?: string;
  public winnerSelectionMethod: WinnerSelectionMethod;
  public createdBy?: string;
  public imageUrl?: string;
  public termsAndConditions?: string;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: Partial<ILottery> & {
    name: string;
    entryFee: number;
    totalPrizes: number;
    startTime: Date;
    endTime: Date;
  }) {
    this.id = data.id || '';
    this.name = data.name;
    this.nameEn = data.nameEn;
    this.nameZhCn = data.nameZhCn;
    this.description = data.description;
    this.descriptionEn = data.descriptionEn;
    this.descriptionZhCn = data.descriptionZhCn;
    this.entryFee = data.entryFee;
    this.currency = data.currency || 'HKD';
    this.totalPrizes = data.totalPrizes;
    this.remainingPrizes = data.remainingPrizes ?? data.totalPrizes;
    this.maxParticipants = data.maxParticipants;
    this.currentParticipants = data.currentParticipants || 0;
    this.prizePool = data.prizePool || [];
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.drawTime = data.drawTime;
    this.isActive = data.isActive ?? true;
    this.isCompleted = data.isCompleted ?? false;
    this.randomSeed = data.randomSeed;
    this.winnerSelectionMethod = (data.winnerSelectionMethod as WinnerSelectionMethod) || 'random';
    this.createdBy = data.createdBy;
    this.imageUrl = data.imageUrl;
    this.termsAndConditions = data.termsAndConditions;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validation schema for lottery data
   */
  private static getValidationSchema() {
    return Joi.object({
      name: Joi.string()
        .min(3)
        .max(255)
        .required()
        .messages({
          'string.min': 'Lottery name must be at least 3 characters long',
          'string.max': 'Lottery name must not exceed 255 characters',
          'any.required': 'Lottery name is required'
        }),
      
      nameEn: Joi.string().max(255).optional(),
      nameZhCn: Joi.string().max(255).optional(),
      
      description: Joi.string().max(1000).optional(),
      descriptionEn: Joi.string().max(1000).optional(),
      descriptionZhCn: Joi.string().max(1000).optional(),
      
      entryFee: Joi.number()
        .min(0)
        .required()
        .messages({
          'number.min': 'Entry fee cannot be negative',
          'any.required': 'Entry fee is required'
        }),
      
      currency: Joi.string()
        .valid('HKD', 'USD', 'CNY', 'ETH', 'MATIC')
        .default('HKD')
        .messages({
          'any.only': 'Currency must be one of: HKD, USD, CNY, ETH, MATIC'
        }),
      
      totalPrizes: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
          'number.integer': 'Total prizes must be an integer',
          'number.positive': 'Total prizes must be positive',
          'any.required': 'Total prizes is required'
        }),
      
      remainingPrizes: Joi.number()
        .integer()
        .min(0)
        .optional(),
      
      maxParticipants: Joi.number()
        .integer()
        .positive()
        .optional()
        .messages({
          'number.integer': 'Max participants must be an integer',
          'number.positive': 'Max participants must be positive'
        }),
      
      currentParticipants: Joi.number()
        .integer()
        .min(0)
        .default(0),
      
      prizePool: Joi.array()
        .items(
          Joi.object({
            type: Joi.string()
              .valid('nft', 'coupon', 'token', 'discount')
              .required(),
            value: Joi.string().required(),
            quantity: Joi.number().integer().positive().required(),
            rarity: Joi.string()
              .valid('common', 'rare', 'epic', 'legendary')
              .default('common'),
            description: Joi.string().max(500).optional()
          })
        )
        .default([]),
      
      startTime: Joi.date()
        .required()
        .messages({
          'any.required': 'Start time is required'
        }),
      
      endTime: Joi.date()
        .greater(Joi.ref('startTime'))
        .required()
        .messages({
          'date.greater': 'End time must be after start time',
          'any.required': 'End time is required'
        }),
      
      drawTime: Joi.date()
        .greater(Joi.ref('endTime'))
        .optional()
        .messages({
          'date.greater': 'Draw time must be after end time'
        }),
      
      isActive: Joi.boolean().default(true),
      isCompleted: Joi.boolean().default(false),
      
      randomSeed: Joi.string()
        .pattern(/^[a-fA-F0-9]{64}$/)
        .optional()
        .messages({
          'string.pattern.base': 'Random seed must be a 64-character hexadecimal string'
        }),
      
      winnerSelectionMethod: Joi.string()
        .valid('random', 'first_come_first_serve')
        .default('random')
        .messages({
          'any.only': 'Winner selection method must be either random or first_come_first_serve'
        }),
      
      createdBy: Joi.string().uuid().optional(),
      imageUrl: Joi.string().uri().optional(),
      termsAndConditions: Joi.string().max(2000).optional()
    });
  }

  /**
   * Validate lottery data
   */
  public static validate(data: any): { error?: Joi.ValidationError; value?: any } {
    const schema = Lottery.getValidationSchema();
    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Create a new Lottery instance with validation
   */
  public static create(data: Partial<ILottery> & {
    name: string;
    entryFee: number;
    totalPrizes: number;
    startTime: Date;
    endTime: Date;
  }): Lottery {
    const { error, value } = Lottery.validate(data);
    
    if (error) {
      logger.error('Lottery validation failed:', error.details);
      throw new Error(`Lottery validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }
    
    return new Lottery(value);
  }

  /**
   * Update lottery data with validation
   */
  public update(updates: Partial<ILottery>): void {
    // Create a schema that only validates the fields being updated
    const updateSchema = Joi.object({
      name: Joi.string().min(3).max(255).optional(),
      nameEn: Joi.string().max(255).optional(),
      nameZhCn: Joi.string().max(255).optional(),
      description: Joi.string().max(1000).optional(),
      descriptionEn: Joi.string().max(1000).optional(),
      descriptionZhCn: Joi.string().max(1000).optional(),
      entryFee: Joi.number().min(0).optional(),
      currency: Joi.string().valid('HKD', 'USD', 'CNY', 'ETH', 'MATIC').optional(),
      remainingPrizes: Joi.number().integer().min(0).optional(),
      maxParticipants: Joi.number().integer().positive().optional(),
      currentParticipants: Joi.number().integer().min(0).optional(),
      prizePool: Joi.array().items(
        Joi.object({
          type: Joi.string().valid('nft', 'coupon', 'token', 'discount').required(),
          value: Joi.string().required(),
          quantity: Joi.number().integer().positive().required(),
          rarity: Joi.string().valid('common', 'rare', 'epic', 'legendary').default('common'),
          description: Joi.string().max(500).optional()
        })
      ).optional(),
      drawTime: Joi.date().optional(),
      isActive: Joi.boolean().optional(),
      isCompleted: Joi.boolean().optional(),
      randomSeed: Joi.string().pattern(/^[a-fA-F0-9]{64}$/).optional(),
      winnerSelectionMethod: Joi.string().valid('random', 'first_come_first_serve').optional(),
      createdBy: Joi.string().uuid().optional(),
      imageUrl: Joi.string().uri().optional(),
      termsAndConditions: Joi.string().max(2000).optional()
    });
    
    const { error, value } = updateSchema.validate(updates, { abortEarly: false });
    
    if (error) {
      logger.error('Lottery update validation failed:', error.details);
      throw new Error(`Lottery update validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }
    
    Object.assign(this, value);
    this.updatedAt = new Date();
  }

  /**
   * Check if lottery is currently active and accepting participants
   */
  public canAcceptParticipants(): { canParticipate: boolean; reason?: string } {
    if (!this.isActive) {
      return { canParticipate: false, reason: 'Lottery is not active' };
    }
    
    if (this.isCompleted) {
      return { canParticipate: false, reason: 'Lottery has been completed' };
    }
    
    const now = new Date();
    if (now < this.startTime) {
      return { canParticipate: false, reason: 'Lottery has not started yet' };
    }
    
    if (now > this.endTime) {
      return { canParticipate: false, reason: 'Lottery has ended' };
    }
    
    if (this.maxParticipants && this.currentParticipants >= this.maxParticipants) {
      return { canParticipate: false, reason: 'Maximum participants reached' };
    }
    
    if (this.remainingPrizes <= 0) {
      return { canParticipate: false, reason: 'No prizes remaining' };
    }
    
    return { canParticipate: true };
  }

  /**
   * Check if lottery is ready for drawing
   */
  public isReadyForDraw(): { ready: boolean; reason?: string } {
    if (this.isCompleted) {
      return { ready: false, reason: 'Lottery has already been completed' };
    }
    
    if (!this.isActive) {
      return { ready: false, reason: 'Lottery is not active' };
    }
    
    const now = new Date();
    if (now < this.endTime) {
      return { ready: false, reason: 'Lottery has not ended yet' };
    }
    
    if (this.currentParticipants === 0) {
      return { ready: false, reason: 'No participants in the lottery' };
    }
    
    return { ready: true };
  }

  /**
   * Add a participant to the lottery
   */
  public addParticipant(): void {
    const validation = this.canAcceptParticipants();
    if (!validation.canParticipate) {
      throw new Error(validation.reason);
    }
    
    this.currentParticipants += 1;
    this.updatedAt = new Date();
  }

  /**
   * Complete the lottery
   */
  public complete(randomSeed?: string): void {
    const validation = this.isReadyForDraw();
    if (!validation.ready) {
      throw new Error(validation.reason);
    }
    
    this.isCompleted = true;
    this.drawTime = new Date();
    if (randomSeed) {
      this.randomSeed = randomSeed;
    }
    this.updatedAt = new Date();
  }

  /**
   * Calculate total prize value
   */
  public getTotalPrizeValue(): number {
    return this.prizePool.reduce((total, prize) => {
      const prizeValue = parseFloat(prize.value) || 0;
      return total + (prizeValue * prize.quantity);
    }, 0);
  }

  /**
   * Get prize distribution by rarity
   */
  public getPrizeDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0
    };
    
    this.prizePool.forEach(prize => {
      distribution[prize.rarity] += prize.quantity;
    });
    
    return distribution;
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
   * Get time remaining until start/end
   */
  public getTimeRemaining(): { 
    phase: 'not_started' | 'active' | 'ended' | 'completed';
    timeRemaining?: number;
    timeUntilDraw?: number;
  } {
    const now = new Date();
    
    if (this.isCompleted) {
      return { phase: 'completed' };
    }
    
    if (now < this.startTime) {
      return {
        phase: 'not_started',
        timeRemaining: this.startTime.getTime() - now.getTime()
      };
    }
    
    if (now < this.endTime) {
      return {
        phase: 'active',
        timeRemaining: this.endTime.getTime() - now.getTime()
      };
    }
    
    return {
      phase: 'ended',
      timeUntilDraw: this.drawTime ? this.drawTime.getTime() - now.getTime() : undefined
    };
  }

  /**
   * Convert to JSON for API response
   */
  public toJSON(): ILottery {
    return {
      id: this.id,
      name: this.name,
      nameEn: this.nameEn,
      nameZhCn: this.nameZhCn,
      description: this.description,
      descriptionEn: this.descriptionEn,
      descriptionZhCn: this.descriptionZhCn,
      entryFee: this.entryFee,
      currency: this.currency,
      totalPrizes: this.totalPrizes,
      remainingPrizes: this.remainingPrizes,
      maxParticipants: this.maxParticipants,
      currentParticipants: this.currentParticipants,
      prizePool: this.prizePool,
      startTime: this.startTime,
      endTime: this.endTime,
      drawTime: this.drawTime,
      isActive: this.isActive,
      isCompleted: this.isCompleted,
      randomSeed: this.randomSeed,
      winnerSelectionMethod: this.winnerSelectionMethod,
      createdBy: this.createdBy,
      imageUrl: this.imageUrl,
      termsAndConditions: this.termsAndConditions,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create Lottery instance from database row
   */
  public static fromDatabaseRow(row: any): Lottery {
    return new Lottery({
      id: row.id,
      name: row.name,
      nameEn: row.name_en,
      nameZhCn: row.name_zh_cn,
      description: row.description,
      descriptionEn: row.description_en,
      descriptionZhCn: row.description_zh_cn,
      entryFee: parseFloat(row.entry_fee),
      currency: row.currency,
      totalPrizes: parseInt(row.total_prizes),
      remainingPrizes: parseInt(row.remaining_prizes),
      maxParticipants: row.max_participants ? parseInt(row.max_participants) : undefined,
      currentParticipants: parseInt(row.current_participants) || 0,
      prizePool: typeof row.prize_pool === 'string' ? JSON.parse(row.prize_pool) : (row.prize_pool || []),
      startTime: new Date(row.start_time),
      endTime: new Date(row.end_time),
      drawTime: row.draw_time ? new Date(row.draw_time) : undefined,
      isActive: row.is_active,
      isCompleted: row.is_completed,
      randomSeed: row.random_seed,
      winnerSelectionMethod: row.winner_selection_method,
      createdBy: row.created_by,
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
      name: this.name,
      name_en: this.nameEn,
      name_zh_cn: this.nameZhCn,
      description: this.description,
      description_en: this.descriptionEn,
      description_zh_cn: this.descriptionZhCn,
      entry_fee: this.entryFee,
      currency: this.currency,
      total_prizes: this.totalPrizes,
      remaining_prizes: this.remainingPrizes,
      max_participants: this.maxParticipants,
      current_participants: this.currentParticipants,
      prize_pool: JSON.stringify(this.prizePool),
      start_time: this.startTime,
      end_time: this.endTime,
      draw_time: this.drawTime,
      is_active: this.isActive,
      is_completed: this.isCompleted,
      random_seed: this.randomSeed,
      winner_selection_method: this.winnerSelectionMethod,
      created_by: this.createdBy,
      image_url: this.imageUrl,
      terms_and_conditions: this.termsAndConditions,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }
}
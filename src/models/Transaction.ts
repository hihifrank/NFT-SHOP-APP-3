import Joi from 'joi';
import { Transaction as ITransaction } from '../types';
import { logger } from '../utils/logger';

export type TransactionType = 'mint' | 'transfer' | 'use' | 'recycle' | 'purchase' | 'lottery_entry' | 'lottery_win';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';

export class Transaction implements ITransaction {
  public id: string;
  public userId: string;
  public nftId?: string;
  public lotteryId?: string;
  public merchantId?: string;
  public transactionType: TransactionType;
  public transactionHash?: string;
  public blockNumber?: bigint;
  public gasUsed?: bigint;
  public gasPrice?: bigint;
  public transactionFee?: number;
  public amount?: number;
  public currency: string;
  public status: TransactionStatus;
  public fromAddress?: string;
  public toAddress?: string;
  public metadata?: Record<string, any>;
  public errorMessage?: string;
  public createdAt: Date;
  public confirmedAt?: Date;

  constructor(data: Partial<ITransaction> & {
    userId: string;
    transactionType: TransactionType;
  }) {
    this.id = data.id || '';
    this.userId = data.userId;
    this.nftId = data.nftId;
    this.lotteryId = data.lotteryId;
    this.merchantId = data.merchantId;
    this.transactionType = data.transactionType;
    this.transactionHash = data.transactionHash;
    this.blockNumber = data.blockNumber;
    this.gasUsed = data.gasUsed;
    this.gasPrice = data.gasPrice;
    this.transactionFee = data.transactionFee;
    this.amount = data.amount;
    this.currency = data.currency || 'HKD';
    this.status = (data.status as TransactionStatus) || 'pending';
    this.fromAddress = data.fromAddress;
    this.toAddress = data.toAddress;
    this.metadata = data.metadata;
    this.errorMessage = data.errorMessage;
    this.createdAt = data.createdAt || new Date();
    this.confirmedAt = data.confirmedAt;
  }

  /**
   * Validation schema for transaction data
   */
  private static getValidationSchema() {
    return Joi.object({
      userId: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.uuid': 'User ID must be a valid UUID',
          'any.required': 'User ID is required'
        }),
      
      nftId: Joi.string()
        .uuid()
        .optional()
        .messages({
          'string.uuid': 'NFT ID must be a valid UUID'
        }),
      
      lotteryId: Joi.string()
        .uuid()
        .optional()
        .messages({
          'string.uuid': 'Lottery ID must be a valid UUID'
        }),
      
      merchantId: Joi.string()
        .uuid()
        .optional()
        .messages({
          'string.uuid': 'Merchant ID must be a valid UUID'
        }),
      
      transactionType: Joi.string()
        .valid('mint', 'transfer', 'use', 'recycle', 'purchase', 'lottery_entry', 'lottery_win')
        .required()
        .messages({
          'any.only': 'Transaction type must be one of: mint, transfer, use, recycle, purchase, lottery_entry, lottery_win',
          'any.required': 'Transaction type is required'
        }),
      
      transactionHash: Joi.string()
        .pattern(/^0x[a-fA-F0-9]{64}$/)
        .optional()
        .messages({
          'string.pattern.base': 'Transaction hash must be a valid Ethereum transaction hash'
        }),
      
      blockNumber: Joi.alternatives()
        .try(
          Joi.number().integer().positive(),
          Joi.string().pattern(/^\d+$/)
        )
        .optional()
        .messages({
          'alternatives.match': 'Block number must be a positive integer'
        }),
      
      gasUsed: Joi.alternatives()
        .try(
          Joi.number().integer().positive(),
          Joi.string().pattern(/^\d+$/)
        )
        .optional()
        .messages({
          'alternatives.match': 'Gas used must be a positive integer'
        }),
      
      gasPrice: Joi.alternatives()
        .try(
          Joi.number().integer().positive(),
          Joi.string().pattern(/^\d+$/)
        )
        .optional()
        .messages({
          'alternatives.match': 'Gas price must be a positive integer'
        }),
      
      transactionFee: Joi.number()
        .min(0)
        .optional()
        .messages({
          'number.min': 'Transaction fee cannot be negative'
        }),
      
      amount: Joi.number()
        .min(0)
        .optional()
        .messages({
          'number.min': 'Amount cannot be negative'
        }),
      
      currency: Joi.string()
        .valid('HKD', 'USD', 'CNY', 'ETH', 'MATIC')
        .default('HKD')
        .messages({
          'any.only': 'Currency must be one of: HKD, USD, CNY, ETH, MATIC'
        }),
      
      status: Joi.string()
        .valid('pending', 'confirmed', 'failed', 'cancelled')
        .default('pending')
        .messages({
          'any.only': 'Status must be one of: pending, confirmed, failed, cancelled'
        }),
      
      fromAddress: Joi.string()
        .pattern(/^0x[a-fA-F0-9]{40}$/)
        .optional()
        .messages({
          'string.pattern.base': 'From address must be a valid Ethereum address'
        }),
      
      toAddress: Joi.string()
        .pattern(/^0x[a-fA-F0-9]{40}$/)
        .optional()
        .messages({
          'string.pattern.base': 'To address must be a valid Ethereum address'
        }),
      
      metadata: Joi.object().optional(),
      
      errorMessage: Joi.string().max(1000).optional(),
      
      confirmedAt: Joi.date().optional()
    });
  }

  /**
   * Validate transaction data
   */
  public static validate(data: any): { error?: Joi.ValidationError; value?: any } {
    const schema = Transaction.getValidationSchema();
    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Create a new Transaction instance with validation
   */
  public static create(data: Partial<ITransaction> & {
    userId: string;
    transactionType: TransactionType;
  }): Transaction {
    const { error, value } = Transaction.validate(data);
    
    if (error) {
      logger.error('Transaction validation failed:', error.details);
      throw new Error(`Transaction validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }
    
    return new Transaction(value);
  }

  /**
   * Update transaction data with validation
   */
  public update(updates: Partial<ITransaction>): void {
    // Create a schema that only validates the fields being updated
    const updateSchema = Joi.object({
      transactionHash: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).optional(),
      blockNumber: Joi.alternatives().try(
        Joi.number().integer().positive(),
        Joi.string().pattern(/^\d+$/)
      ).optional(),
      gasUsed: Joi.alternatives().try(
        Joi.number().integer().positive(),
        Joi.string().pattern(/^\d+$/)
      ).optional(),
      gasPrice: Joi.alternatives().try(
        Joi.number().integer().positive(),
        Joi.string().pattern(/^\d+$/)
      ).optional(),
      transactionFee: Joi.number().min(0).optional(),
      amount: Joi.number().min(0).optional(),
      currency: Joi.string().valid('HKD', 'USD', 'CNY', 'ETH', 'MATIC').optional(),
      status: Joi.string().valid('pending', 'confirmed', 'failed', 'cancelled').optional(),
      fromAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional(),
      toAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional(),
      metadata: Joi.object().optional(),
      errorMessage: Joi.string().max(1000).optional(),
      confirmedAt: Joi.date().optional()
    });
    
    const { error, value } = updateSchema.validate(updates, { abortEarly: false });
    
    if (error) {
      logger.error('Transaction update validation failed:', error.details);
      throw new Error(`Transaction update validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }
    
    Object.assign(this, value);
  }

  /**
   * Mark transaction as confirmed
   */
  public confirm(transactionHash?: string, blockNumber?: bigint): void {
    if (this.status === 'confirmed') {
      logger.warn(`Transaction ${this.id} is already confirmed`);
      return;
    }
    
    this.status = 'confirmed';
    this.confirmedAt = new Date();
    
    if (transactionHash) {
      this.transactionHash = transactionHash;
    }
    
    if (blockNumber) {
      this.blockNumber = blockNumber;
    }
    
    logger.info(`Transaction ${this.id} confirmed with hash: ${this.transactionHash}`);
  }

  /**
   * Mark transaction as failed
   */
  public fail(errorMessage?: string): void {
    if (this.status === 'confirmed') {
      throw new Error('Cannot mark confirmed transaction as failed');
    }
    
    this.status = 'failed';
    if (errorMessage) {
      this.errorMessage = errorMessage;
    }
    
    logger.error(`Transaction ${this.id} failed: ${this.errorMessage}`);
  }

  /**
   * Cancel transaction
   */
  public cancel(reason?: string): void {
    if (this.status === 'confirmed') {
      throw new Error('Cannot cancel confirmed transaction');
    }
    
    this.status = 'cancelled';
    if (reason) {
      this.errorMessage = reason;
    }
    
    logger.info(`Transaction ${this.id} cancelled: ${this.errorMessage}`);
  }

  /**
   * Check if transaction is pending
   */
  public isPending(): boolean {
    return this.status === 'pending';
  }

  /**
   * Check if transaction is confirmed
   */
  public isConfirmed(): boolean {
    return this.status === 'confirmed';
  }

  /**
   * Check if transaction failed
   */
  public isFailed(): boolean {
    return this.status === 'failed';
  }

  /**
   * Check if transaction was cancelled
   */
  public isCancelled(): boolean {
    return this.status === 'cancelled';
  }

  /**
   * Get transaction age in milliseconds
   */
  public getAge(): number {
    return Date.now() - this.createdAt.getTime();
  }

  /**
   * Get confirmation time in milliseconds (if confirmed)
   */
  public getConfirmationTime(): number | null {
    if (!this.confirmedAt) return null;
    return this.confirmedAt.getTime() - this.createdAt.getTime();
  }

  /**
   * Calculate total cost including fees
   */
  public getTotalCost(): number {
    const amount = this.amount || 0;
    const fee = this.transactionFee || 0;
    return amount + fee;
  }

  /**
   * Check if transaction involves NFT
   */
  public isNFTTransaction(): boolean {
    return ['mint', 'transfer', 'use', 'recycle'].includes(this.transactionType);
  }

  /**
   * Check if transaction involves lottery
   */
  public isLotteryTransaction(): boolean {
    return ['lottery_entry', 'lottery_win'].includes(this.transactionType);
  }

  /**
   * Get transaction description based on type
   */
  public getDescription(language: 'zh-HK' | 'zh-CN' | 'en' = 'zh-HK'): string {
    const descriptions = {
      'zh-HK': {
        mint: '鑄造NFT優惠券',
        transfer: '轉移NFT優惠券',
        use: '使用NFT優惠券',
        recycle: '回收NFT優惠券',
        purchase: '購買商品',
        lottery_entry: '參與抽獎',
        lottery_win: '抽獎獲勝'
      },
      'zh-CN': {
        mint: '铸造NFT优惠券',
        transfer: '转移NFT优惠券',
        use: '使用NFT优惠券',
        recycle: '回收NFT优惠券',
        purchase: '购买商品',
        lottery_entry: '参与抽奖',
        lottery_win: '抽奖获胜'
      },
      'en': {
        mint: 'Mint NFT Coupon',
        transfer: 'Transfer NFT Coupon',
        use: 'Use NFT Coupon',
        recycle: 'Recycle NFT Coupon',
        purchase: 'Purchase Item',
        lottery_entry: 'Lottery Entry',
        lottery_win: 'Lottery Win'
      }
    };
    
    return descriptions[language][this.transactionType] || this.transactionType;
  }

  /**
   * Add metadata to transaction
   */
  public addMetadata(key: string, value: any): void {
    if (!this.metadata) {
      this.metadata = {};
    }
    this.metadata[key] = value;
  }

  /**
   * Get metadata value
   */
  public getMetadata(key: string): any {
    return this.metadata?.[key];
  }

  /**
   * Convert to JSON for API response
   */
  public toJSON(): ITransaction {
    return {
      id: this.id,
      userId: this.userId,
      nftId: this.nftId,
      lotteryId: this.lotteryId,
      merchantId: this.merchantId,
      transactionType: this.transactionType,
      transactionHash: this.transactionHash,
      blockNumber: this.blockNumber,
      gasUsed: this.gasUsed,
      gasPrice: this.gasPrice,
      transactionFee: this.transactionFee,
      amount: this.amount,
      currency: this.currency,
      status: this.status,
      fromAddress: this.fromAddress,
      toAddress: this.toAddress,
      metadata: this.metadata,
      errorMessage: this.errorMessage,
      createdAt: this.createdAt,
      confirmedAt: this.confirmedAt
    };
  }

  /**
   * Create Transaction instance from database row
   */
  public static fromDatabaseRow(row: any): Transaction {
    return new Transaction({
      id: row.id,
      userId: row.user_id,
      nftId: row.nft_id,
      lotteryId: row.lottery_id,
      merchantId: row.merchant_id,
      transactionType: row.transaction_type,
      transactionHash: row.transaction_hash,
      blockNumber: row.block_number ? BigInt(row.block_number) : undefined,
      gasUsed: row.gas_used ? BigInt(row.gas_used) : undefined,
      gasPrice: row.gas_price ? BigInt(row.gas_price) : undefined,
      transactionFee: row.transaction_fee ? parseFloat(row.transaction_fee) : undefined,
      amount: row.amount ? parseFloat(row.amount) : undefined,
      currency: row.currency,
      status: row.status,
      fromAddress: row.from_address,
      toAddress: row.to_address,
      metadata: row.metadata,
      errorMessage: row.error_message,
      createdAt: new Date(row.created_at),
      confirmedAt: row.confirmed_at ? new Date(row.confirmed_at) : undefined
    });
  }

  /**
   * Convert to database row format
   */
  public toDatabaseRow(): any {
    return {
      id: this.id,
      user_id: this.userId,
      nft_id: this.nftId,
      lottery_id: this.lotteryId,
      merchant_id: this.merchantId,
      transaction_type: this.transactionType,
      transaction_hash: this.transactionHash,
      block_number: this.blockNumber?.toString(),
      gas_used: this.gasUsed?.toString(),
      gas_price: this.gasPrice?.toString(),
      transaction_fee: this.transactionFee,
      amount: this.amount,
      currency: this.currency,
      status: this.status,
      from_address: this.fromAddress,
      to_address: this.toAddress,
      metadata: this.metadata ? JSON.stringify(this.metadata) : null,
      error_message: this.errorMessage,
      created_at: this.createdAt,
      confirmed_at: this.confirmedAt
    };
  }
}
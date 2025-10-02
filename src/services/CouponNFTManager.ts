import { ICouponNFTManager } from '../types/interfaces';
import { CouponNFT, CouponType, DiscountType, RarityType } from '../models/CouponNFT';
import { Transaction } from '../models/Transaction';
import CouponNFTRepository from '../repositories/CouponNFTRepository';
import TransactionRepository from '../repositories/TransactionRepository';
import BlockchainService from './BlockchainService';
import IPFSService, { NFTMetadata } from './IPFSService';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface CouponCreationData {
  merchantId: string;
  couponType: CouponType;
  title: string;
  titleEn?: string;
  titleZhCn?: string;
  description?: string;
  descriptionEn?: string;
  descriptionZhCn?: string;
  discountValue: number;
  discountType: DiscountType;
  minimumPurchase?: number;
  maxQuantity: number;
  rarity?: RarityType;
  expiryDate?: Date;
  isTransferable?: boolean;
  termsAndConditions?: string;
  imageBuffer?: Buffer;
  imageFilename?: string;
}

export interface NFTResult {
  success: boolean;
  tokenId?: string;
  transactionHash?: string;
  couponNFT?: CouponNFT;
  error?: string;
}

export interface UsageResult {
  success: boolean;
  transactionHash?: string;
  transaction?: Transaction;
  error?: string;
}

export interface TransferResult {
  success: boolean;
  transactionHash?: string;
  transaction?: Transaction;
  error?: string;
}

export interface RecycleResult {
  success: boolean;
  transactionHash?: string;
  transaction?: Transaction;
  error?: string;
}

export class CouponNFTManager implements ICouponNFTManager {
  private couponRepository: CouponNFTRepository;
  private transactionRepository: TransactionRepository;
  private blockchainService: BlockchainService;
  private ipfsService: IPFSService;

  constructor() {
    this.couponRepository = new CouponNFTRepository();
    this.transactionRepository = new TransactionRepository();
    this.blockchainService = new BlockchainService();
    this.ipfsService = new IPFSService();

    // Setup blockchain event listeners
    this.blockchainService.setupEventListeners();

    logger.info('CouponNFTManager initialized');
  }

  /**
   * Create a new NFT coupon
   */
  async createCouponNFT(couponData: CouponCreationData): Promise<NFTResult> {
    try {
      logger.info('Creating NFT coupon', { 
        merchantId: couponData.merchantId,
        title: couponData.title,
        discountValue: couponData.discountValue
      });

      // Step 1: Upload image to IPFS (if provided)
      let imageHash: string | undefined;
      if (couponData.imageBuffer && couponData.imageFilename) {
        imageHash = await this.ipfsService.uploadImage(
          couponData.imageBuffer,
          couponData.imageFilename
        );
      }

      // Step 2: Create and upload metadata to IPFS
      const metadata: NFTMetadata = this.ipfsService.createMetadata({
        name: couponData.title,
        description: couponData.description || `${couponData.discountValue}${couponData.discountType === 'percentage' ? '%' : ' HKD'} discount coupon`,
        imageHash: imageHash || 'QmDefaultCouponImage', // Use default image if none provided
        merchantName: `Merchant ${couponData.merchantId}`, // In real implementation, fetch merchant name
        discountValue: couponData.discountValue,
        discountType: couponData.discountType,
        rarity: couponData.rarity || 'common',
        expiryDate: couponData.expiryDate,
        termsAndConditions: couponData.termsAndConditions
      });

      const metadataHash = await this.ipfsService.uploadMetadata(metadata);
      const metadataUri = this.ipfsService.getIPFSUrl(metadataHash);

      // Step 3: Generate token ID
      const totalSupply = await this.blockchainService.getTotalSupply();
      const tokenId = BigInt(totalSupply + 1);

      // Step 4: Create database record first
      const couponNFT = new CouponNFT({
        tokenId,
        merchantId: couponData.merchantId,
        couponType: couponData.couponType,
        title: couponData.title,
        titleEn: couponData.titleEn,
        titleZhCn: couponData.titleZhCn,
        description: couponData.description,
        descriptionEn: couponData.descriptionEn,
        descriptionZhCn: couponData.descriptionZhCn,
        discountValue: couponData.discountValue,
        discountType: couponData.discountType,
        minimumPurchase: couponData.minimumPurchase || 0,
        maxQuantity: couponData.maxQuantity,
        remainingQuantity: couponData.maxQuantity,
        totalMinted: 0,
        rarity: couponData.rarity || 'common',
        expiryDate: couponData.expiryDate,
        isTransferable: couponData.isTransferable ?? true,
        metadataUri,
        imageUrl: imageHash ? this.ipfsService.getIPFSUrl(imageHash) : undefined,
        termsAndConditions: couponData.termsAndConditions
      });

      const savedCoupon = await this.couponRepository.create(couponNFT);

      // Step 5: Mint NFT on blockchain
      const couponTypeEnum = this.getCouponTypeEnum(couponData.couponType);
      const rarityEnum = this.getRarityEnum(couponData.rarity || 'common');
      const expiryTimestamp = couponData.expiryDate ? Math.floor(couponData.expiryDate.getTime() / 1000) : Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // Default 1 year

      const transactionHash = await this.blockchainService.mintNFT(
        savedCoupon.currentOwnerId || savedCoupon.merchantId, // Mint to merchant initially
        couponData.merchantId,
        {
          couponType: couponTypeEnum,
          discountValue: couponData.discountValue,
          maxQuantity: couponData.maxQuantity,
          expiryDate: expiryTimestamp,
          rarity: rarityEnum,
          description: couponData.description || '',
          metadataUri
        }
      );

      // Step 6: Create transaction record
      const transaction = new Transaction({
        userId: savedCoupon.currentOwnerId || savedCoupon.merchantId,
        nftId: savedCoupon.id,
        transactionType: 'mint',
        transactionHash
        // blockNumber, gasUsed, gasPrice will be updated when transaction is confirmed
      });

      await this.transactionRepository.create(transaction);

      logger.info('NFT coupon created successfully', {
        tokenId: tokenId.toString(),
        transactionHash,
        metadataUri
      });

      return {
        success: true,
        tokenId: tokenId.toString(),
        transactionHash,
        couponNFT: savedCoupon
      };

    } catch (error) {
      logger.error('Error creating NFT coupon:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Use a coupon NFT
   */
  async useCoupon(nftId: string, userId: string): Promise<UsageResult> {
    try {
      logger.info('Using coupon NFT', { nftId, userId });

      // Step 1: Find and validate coupon
      const coupon = await this.couponRepository.findById(nftId);
      if (!coupon) {
        return { success: false, error: 'Coupon not found' };
      }

      // Step 2: Validate coupon can be used
      const validation = coupon.isValidForUse();
      if (!validation.valid) {
        return { success: false, error: validation.reason };
      }

      // Step 3: Verify ownership or authorization
      if (coupon.currentOwnerId !== userId) {
        return { success: false, error: 'Not authorized to use this coupon' };
      }

      // Step 4: Use coupon on blockchain
      const transactionHash = await this.blockchainService.burnNFT(coupon.tokenId.toString());

      // Step 5: Update coupon in database
      coupon.use(userId);
      await this.couponRepository.update(nftId, {
        isUsed: coupon.isUsed,
        usedAt: coupon.usedAt,
        remainingQuantity: coupon.remainingQuantity,
        updatedAt: coupon.updatedAt
      });

      // Step 6: Create transaction record
      const transaction = new Transaction({
        userId,
        nftId,
        transactionType: 'use',
        transactionHash
      });

      const savedTransaction = await this.transactionRepository.create(transaction);

      logger.info('Coupon used successfully', {
        nftId,
        userId,
        transactionHash
      });

      return {
        success: true,
        transactionHash,
        transaction: savedTransaction
      };

    } catch (error) {
      logger.error('Error using coupon:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Transfer NFT to another user
   */
  async transferNFT(from: string, to: string, nftId: string): Promise<TransferResult> {
    try {
      logger.info('Transferring NFT', { from, to, nftId });

      // Step 1: Find and validate coupon
      const coupon = await this.couponRepository.findById(nftId);
      if (!coupon) {
        return { success: false, error: 'Coupon not found' };
      }

      // Step 2: Validate transfer
      const validation = coupon.canBeTransferred();
      if (!validation.transferable) {
        return { success: false, error: validation.reason };
      }

      // Step 3: Verify ownership
      if (coupon.currentOwnerId !== from) {
        return { success: false, error: 'Not authorized to transfer this coupon' };
      }

      // Step 4: Transfer on blockchain
      const transactionHash = await this.blockchainService.transferNFT(
        from,
        to,
        coupon.tokenId.toString()
      );

      // Step 5: Update coupon ownership in database
      coupon.transfer(from, to);
      await this.couponRepository.update(nftId, {
        currentOwnerId: coupon.currentOwnerId,
        updatedAt: coupon.updatedAt
      });

      // Step 6: Create transaction record
      const transaction = new Transaction({
        userId: from,
        nftId,
        transactionType: 'transfer',
        transactionHash
      });

      const savedTransaction = await this.transactionRepository.create(transaction);

      logger.info('NFT transferred successfully', {
        from,
        to,
        nftId,
        transactionHash
      });

      return {
        success: true,
        transactionHash,
        transaction: savedTransaction
      };

    } catch (error) {
      logger.error('Error transferring NFT:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Recycle a used coupon back to marketplace
   */
  async recycleCoupon(nftId: string): Promise<RecycleResult> {
    try {
      logger.info('Recycling coupon', { nftId });

      // Step 1: Find and validate coupon
      const coupon = await this.couponRepository.findById(nftId);
      if (!coupon) {
        return { success: false, error: 'Coupon not found' };
      }

      // Step 2: Validate coupon can be recycled
      if (!coupon.isUsed) {
        return { success: false, error: 'Only used coupons can be recycled' };
      }

      if (!coupon.currentOwnerId) {
        return { success: false, error: 'No current owner found' };
      }

      // Step 3: Transfer back to contract owner on blockchain
      // This would typically involve calling a recycle function on the smart contract
      // For now, we'll simulate this by transferring to a designated recycling address
      const recyclingAddress = '0x0000000000000000000000000000000000000001'; // Placeholder
      const transactionHash = await this.blockchainService.transferNFT(
        coupon.currentOwnerId,
        recyclingAddress,
        coupon.tokenId.toString()
      );

      // Step 4: Update coupon status in database
      await this.couponRepository.update(nftId, {
        currentOwnerId: undefined, // Remove ownership
        isActive: false, // Deactivate
        updatedAt: new Date()
      });

      // Step 5: Create transaction record
      const transaction = new Transaction({
        userId: coupon.currentOwnerId,
        nftId,
        transactionType: 'recycle',
        transactionHash
      });

      const savedTransaction = await this.transactionRepository.create(transaction);

      logger.info('Coupon recycled successfully', {
        nftId,
        transactionHash
      });

      return {
        success: true,
        transactionHash,
        transaction: savedTransaction
      };

    } catch (error) {
      logger.error('Error recycling coupon:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Validate a coupon NFT
   */
  async validateCoupon(nftId: string): Promise<boolean> {
    try {
      // Step 1: Check database
      const coupon = await this.couponRepository.findById(nftId);
      if (!coupon) {
        return false;
      }

      const dbValidation = coupon.isValidForUse();
      if (!dbValidation.valid) {
        return false;
      }

      // Step 2: Check blockchain
      const blockchainValid = await this.blockchainService.isCouponValid(coupon.tokenId.toString());

      return blockchainValid;
    } catch (error) {
      logger.error('Error validating coupon:', error);
      return false;
    }
  }

  /**
   * Get coupon details with blockchain sync
   */
  async getCouponDetails(nftId: string): Promise<CouponNFT | null> {
    try {
      const coupon = await this.couponRepository.findById(nftId);
      if (!coupon) {
        return null;
      }

      // Optionally sync with blockchain data
      try {
        const blockchainData = await this.blockchainService.getCouponData(coupon.tokenId.toString());
        
        // Update database if blockchain data differs
        if (blockchainData.isUsed !== coupon.isUsed) {
          await this.couponRepository.update(nftId, {
            isUsed: blockchainData.isUsed,
            remainingQuantity: parseInt(blockchainData.remainingQuantity),
            updatedAt: new Date()
          });
          
          // Refresh coupon data
          return await this.couponRepository.findById(nftId);
        }
      } catch (blockchainError) {
        logger.warn('Could not sync with blockchain data:', blockchainError);
        // Continue with database data
      }

      return coupon;
    } catch (error) {
      logger.error('Error getting coupon details:', error);
      return null;
    }
  }

  /**
   * Get available coupons with filters
   */
  async getAvailableCoupons(options: {
    limit?: number;
    offset?: number;
    merchantId?: string;
    rarity?: string;
    minDiscount?: number;
    maxDiscount?: number;
  } = {}): Promise<{ coupons: CouponNFT[]; total: number }> {
    return this.couponRepository.findAvailable(options);
  }

  /**
   * Get user's NFT coupons
   */
  async getUserCoupons(userId: string): Promise<CouponNFT[]> {
    return this.couponRepository.findByOwner(userId);
  }

  /**
   * Get merchant's created coupons
   */
  async getMerchantCoupons(merchantId: string): Promise<CouponNFT[]> {
    return this.couponRepository.findByMerchant(merchantId);
  }

  /**
   * Convert coupon type to blockchain enum
   */
  private getCouponTypeEnum(couponType: CouponType): number {
    const typeMap: Record<CouponType, number> = {
      'percentage': 0,
      'fixed_amount': 1,
      'buy_one_get_one': 2,
      'free_item': 3
    };
    return typeMap[couponType] || 0;
  }

  /**
   * Convert rarity to blockchain enum
   */
  private getRarityEnum(rarity: RarityType): number {
    const rarityMap: Record<RarityType, number> = {
      'common': 0,
      'rare': 1,
      'epic': 2,
      'legendary': 3
    };
    return rarityMap[rarity] || 0;
  }
}

export default CouponNFTManager;
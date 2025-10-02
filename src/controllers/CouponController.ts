import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import CouponNFTManager, { CouponCreationData } from '../services/CouponNFTManager';
import { ICouponController } from '../types/interfaces';
import { logger } from '../utils/logger';

export class CouponController implements ICouponController {
  private couponManager: CouponNFTManager;

  constructor() {
    this.couponManager = new CouponNFTManager();
  }

  /**
   * Handle generic request (required by interface)
   */
  async handleRequest(req: Request, res: Response, next: any): Promise<void> {
    // This is a generic handler, specific methods handle actual requests
    next();
  }

  /**
   * Create a new NFT coupon
   * POST /api/v1/coupons
   */
  async createCoupon(req: Request, res: Response): Promise<void> {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const {
        merchantId,
        couponType,
        title,
        titleEn,
        titleZhCn,
        description,
        descriptionEn,
        descriptionZhCn,
        discountValue,
        discountType,
        minimumPurchase,
        maxQuantity,
        rarity,
        expiryDate,
        isTransferable,
        termsAndConditions
      } = req.body;

      // Handle image upload if present
      let imageBuffer: Buffer | undefined;
      let imageFilename: string | undefined;
      
      if (req.file) {
        imageBuffer = req.file.buffer;
        imageFilename = req.file.originalname;
      }

      const couponData: CouponCreationData = {
        merchantId,
        couponType,
        title,
        titleEn,
        titleZhCn,
        description,
        descriptionEn,
        descriptionZhCn,
        discountValue: parseFloat(discountValue),
        discountType,
        minimumPurchase: minimumPurchase ? parseFloat(minimumPurchase) : undefined,
        maxQuantity: parseInt(maxQuantity),
        rarity,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        isTransferable: isTransferable !== undefined ? Boolean(isTransferable) : undefined,
        termsAndConditions,
        imageBuffer,
        imageFilename
      };

      logger.info('Creating coupon NFT', { 
        merchantId, 
        title, 
        discountValue: couponData.discountValue 
      });

      const result = await this.couponManager.createCouponNFT(couponData);

      if (result.success) {
        res.status(201).json({
          success: true,
          data: {
            tokenId: result.tokenId,
            transactionHash: result.transactionHash,
            coupon: result.couponNFT?.toJSON()
          },
          message: 'Coupon NFT created successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: {
            message: result.error || 'Failed to create coupon NFT'
          }
        });
      }
    } catch (error) {
      logger.error('Error in createCoupon:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error'
        }
      });
    }
  }

  /**
   * Get available coupons with filters
   * GET /api/v1/coupons
   */
  async getCoupons(req: Request, res: Response): Promise<void> {
    try {
      const {
        limit = '20',
        offset = '0',
        merchantId,
        rarity,
        minDiscount,
        maxDiscount
      } = req.query;

      const options = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        merchantId: merchantId as string,
        rarity: rarity as string,
        minDiscount: minDiscount ? parseFloat(minDiscount as string) : undefined,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount as string) : undefined
      };

      const result = await this.couponManager.getAvailableCoupons(options);

      res.json({
        success: true,
        data: {
          coupons: result.coupons.map(coupon => coupon.toJSON()),
          pagination: {
            total: result.total,
            limit: options.limit,
            offset: options.offset,
            hasMore: (options.offset + options.limit) < result.total
          }
        }
      });
    } catch (error) {
      logger.error('Error in getCoupons:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error'
        }
      });
    }
  }

  /**
   * Get coupon details by ID
   * GET /api/v1/coupons/:id
   */
  async getCouponDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const coupon = await this.couponManager.getCouponDetails(id);

      if (!coupon) {
        res.status(404).json({
          success: false,
          error: {
            message: 'Coupon not found'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: {
          coupon: coupon.toJSON()
        }
      });
    } catch (error) {
      logger.error('Error in getCouponDetails:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error'
        }
      });
    }
  }

  /**
   * Use a coupon NFT
   * POST /api/v1/coupons/:id/use
   */
  async useCoupon(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const { id } = req.params;
      const { userId } = req.body;

      // In a real implementation, userId would come from JWT token
      // const userId = req.user?.id;

      logger.info('Using coupon', { couponId: id, userId });

      const result = await this.couponManager.useCoupon(id, userId);

      if (result.success) {
        res.json({
          success: true,
          data: {
            transactionHash: result.transactionHash,
            transaction: result.transaction?.toJSON()
          },
          message: 'Coupon used successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: {
            message: result.error || 'Failed to use coupon'
          }
        });
      }
    } catch (error) {
      logger.error('Error in useCoupon:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error'
        }
      });
    }
  }

  /**
   * Transfer a coupon NFT
   * POST /api/v1/coupons/:id/transfer
   */
  async transferCoupon(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const { id } = req.params;
      const { fromUserId, toUserId } = req.body;

      // In a real implementation, fromUserId would come from JWT token
      // const fromUserId = req.user?.id;

      logger.info('Transferring coupon', { couponId: id, fromUserId, toUserId });

      const result = await this.couponManager.transferNFT(fromUserId, toUserId, id);

      if (result.success) {
        res.json({
          success: true,
          data: {
            transactionHash: result.transactionHash,
            transaction: result.transaction?.toJSON()
          },
          message: 'Coupon transferred successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: {
            message: result.error || 'Failed to transfer coupon'
          }
        });
      }
    } catch (error) {
      logger.error('Error in transferCoupon:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error'
        }
      });
    }
  }

  /**
   * Validate a coupon NFT
   * GET /api/v1/coupons/:id/validate
   */
  async validateCoupon(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const isValid = await this.couponManager.validateCoupon(id);

      res.json({
        success: true,
        data: {
          isValid,
          couponId: id
        }
      });
    } catch (error) {
      logger.error('Error in validateCoupon:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error'
        }
      });
    }
  }

  /**
   * Get user's coupons
   * GET /api/v1/users/:userId/coupons
   */
  async getUserCoupons(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      // In a real implementation, verify that the requesting user can access this data
      // const requestingUserId = req.user?.id;

      const coupons = await this.couponManager.getUserCoupons(userId);

      res.json({
        success: true,
        data: {
          coupons: coupons.map(coupon => coupon.toJSON()),
          count: coupons.length
        }
      });
    } catch (error) {
      logger.error('Error in getUserCoupons:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error'
        }
      });
    }
  }

  /**
   * Get merchant's coupons
   * GET /api/v1/merchants/:merchantId/coupons
   */
  async getMerchantCoupons(req: Request, res: Response): Promise<void> {
    try {
      const { merchantId } = req.params;

      const coupons = await this.couponManager.getMerchantCoupons(merchantId);

      res.json({
        success: true,
        data: {
          coupons: coupons.map(coupon => coupon.toJSON()),
          count: coupons.length
        }
      });
    } catch (error) {
      logger.error('Error in getMerchantCoupons:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error'
        }
      });
    }
  }

  /**
   * Recycle a used coupon
   * POST /api/v1/coupons/:id/recycle
   */
  async recycleCoupon(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      logger.info('Recycling coupon', { couponId: id });

      const result = await this.couponManager.recycleCoupon(id);

      if (result.success) {
        res.json({
          success: true,
          data: {
            transactionHash: result.transactionHash,
            transaction: result.transaction?.toJSON()
          },
          message: 'Coupon recycled successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: {
            message: result.error || 'Failed to recycle coupon'
          }
        });
      }
    } catch (error) {
      logger.error('Error in recycleCoupon:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error'
        }
      });
    }
  }
}

export default CouponController;
import { PromotionBroadcast, NotificationBroadcast } from '../types';

export interface Promotion {
  id: string;
  merchantId: string;
  type: 'new_promotion' | 'limited_offer' | 'flash_sale';
  title: string;
  titleEn?: string;
  titleZhCn?: string;
  description: string;
  descriptionEn?: string;
  descriptionZhCn?: string;
  discountValue?: number;
  discountType?: 'percentage' | 'fixed_amount';
  validFrom: Date;
  validUntil: Date;
  maxRedemptions?: number;
  currentRedemptions?: number;
  targetLocation?: {
    latitude: number;
    longitude: number;
    radius: number; // in meters
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePromotionRequest {
  merchantId: string;
  type: 'new_promotion' | 'limited_offer' | 'flash_sale';
  title: string;
  titleEn?: string;
  titleZhCn?: string;
  description: string;
  descriptionEn?: string;
  descriptionZhCn?: string;
  discountValue?: number;
  discountType?: 'percentage' | 'fixed_amount';
  validFrom: Date;
  validUntil: Date;
  maxRedemptions?: number;
  targetLocation?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  broadcastImmediately?: boolean;
}

export class PromotionService {
  /**
   * Create and broadcast a new promotion
   */
  public static async createPromotion(promotionData: CreatePromotionRequest): Promise<{ success: boolean; promotionId?: string; error?: string }> {
    try {
      // Validate promotion data
      this.validatePromotionData(promotionData);

      // Generate promotion ID (in real implementation, this would be from database)
      const promotionId = `promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create promotion record (in real implementation, save to database)
      const promotion: Promotion = {
        id: promotionId,
        merchantId: promotionData.merchantId,
        type: promotionData.type,
        title: promotionData.title,
        titleEn: promotionData.titleEn,
        titleZhCn: promotionData.titleZhCn,
        description: promotionData.description,
        descriptionEn: promotionData.descriptionEn,
        descriptionZhCn: promotionData.descriptionZhCn,
        discountValue: promotionData.discountValue,
        discountType: promotionData.discountType,
        validFrom: promotionData.validFrom,
        validUntil: promotionData.validUntil,
        maxRedemptions: promotionData.maxRedemptions,
        currentRedemptions: 0,
        targetLocation: promotionData.targetLocation,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Broadcast promotion if requested
      if (promotionData.broadcastImmediately !== false && global.socketService) {
        await this.broadcastPromotion(promotion);
      }

      return {
        success: true,
        promotionId
      };
    } catch (error) {
      console.error('Error creating promotion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create promotion'
      };
    }
  }

  /**
   * Broadcast promotion to relevant users
   */
  public static async broadcastPromotion(promotion: Promotion): Promise<void> {
    if (!global.socketService) {
      console.warn('Socket service not available for promotion broadcast');
      return;
    }

    // Create promotion broadcast
    const broadcast: PromotionBroadcast = {
      merchantId: promotion.merchantId,
      type: promotion.type,
      title: promotion.title,
      description: promotion.description,
      location: promotion.targetLocation,
      data: {
        promotionId: promotion.id,
        discountValue: promotion.discountValue,
        discountType: promotion.discountType,
        validFrom: promotion.validFrom,
        validUntil: promotion.validUntil,
        maxRedemptions: promotion.maxRedemptions,
        currentRedemptions: promotion.currentRedemptions
      },
      timestamp: new Date()
    };

    // Broadcast promotion
    global.socketService.broadcastPromotion(broadcast);

    // Send targeted notifications based on promotion type
    await this.sendPromotionNotifications(promotion);

    console.log(`📢 Broadcasted promotion ${promotion.id} for merchant ${promotion.merchantId}`);
  }

  /**
   * Send targeted notifications for promotion
   */
  private static async sendPromotionNotifications(promotion: Promotion): Promise<void> {
    if (!global.socketService) return;

    let notificationTitle = '';
    let notificationMessage = '';

    // Customize notification based on promotion type
    switch (promotion.type) {
      case 'flash_sale':
        notificationTitle = '⚡ 限時閃購！';
        notificationMessage = `${promotion.title} - 立即搶購，數量有限！`;
        break;
      case 'limited_offer':
        notificationTitle = '🎯 限量優惠';
        notificationMessage = `${promotion.title} - 限量發售，先到先得！`;
        break;
      case 'new_promotion':
      default:
        notificationTitle = '🎉 新優惠推出';
        notificationMessage = `${promotion.title} - 查看詳情並享受優惠！`;
        break;
    }

    const notification: NotificationBroadcast = {
      type: 'merchant',
      title: notificationTitle,
      message: notificationMessage,
      data: {
        promotionId: promotion.id,
        merchantId: promotion.merchantId,
        promotionType: promotion.type,
        discountValue: promotion.discountValue,
        discountType: promotion.discountType,
        validUntil: promotion.validUntil
      },
      targetLocation: promotion.targetLocation,
      timestamp: new Date()
    };

    global.socketService.sendNotification(notification);
  }

  /**
   * Schedule promotion broadcast for future time
   */
  public static schedulePromotionBroadcast(promotion: Promotion, broadcastTime: Date): void {
    const delay = broadcastTime.getTime() - Date.now();
    
    if (delay <= 0) {
      // Broadcast immediately if time has passed
      this.broadcastPromotion(promotion);
      return;
    }

    setTimeout(() => {
      this.broadcastPromotion(promotion);
    }, delay);

    console.log(`📅 Scheduled promotion ${promotion.id} broadcast for ${broadcastTime.toISOString()}`);
  }

  /**
   * Broadcast location-based promotion to nearby users
   */
  public static async broadcastLocationBasedPromotion(
    merchantId: string,
    title: string,
    description: string,
    location: { latitude: number; longitude: number; radius: number },
    additionalData?: any
  ): Promise<void> {
    if (!global.socketService) {
      console.warn('Socket service not available for location-based promotion broadcast');
      return;
    }

    const broadcast: PromotionBroadcast = {
      merchantId,
      type: 'new_promotion',
      title,
      description,
      location,
      data: additionalData || {},
      timestamp: new Date()
    };

    global.socketService.broadcastPromotion(broadcast);

    // Also send as notification
    const notification: NotificationBroadcast = {
      type: 'merchant',
      title: '📍 附近優惠',
      message: `${title} - ${description}`,
      data: {
        merchantId,
        location,
        ...additionalData
      },
      targetLocation: location,
      timestamp: new Date()
    };

    global.socketService.sendNotification(notification);

    console.log(`📍 Broadcasted location-based promotion for merchant ${merchantId} within ${location.radius}m radius`);
  }

  /**
   * Send flash sale alert to all users
   */
  public static async sendFlashSaleAlert(
    merchantId: string,
    title: string,
    description: string,
    duration: number, // in minutes
    additionalData?: any
  ): Promise<void> {
    if (!global.socketService) {
      console.warn('Socket service not available for flash sale alert');
      return;
    }

    const broadcast: PromotionBroadcast = {
      merchantId,
      type: 'flash_sale',
      title,
      description,
      data: {
        duration,
        endsAt: new Date(Date.now() + duration * 60 * 1000),
        ...additionalData
      },
      timestamp: new Date()
    };

    global.socketService.broadcastPromotion(broadcast);

    // Send urgent notification
    const notification: NotificationBroadcast = {
      type: 'merchant',
      title: '⚡ 限時閃購警報！',
      message: `${title} - 僅限 ${duration} 分鐘！`,
      data: {
        merchantId,
        flashSale: true,
        duration,
        endsAt: new Date(Date.now() + duration * 60 * 1000),
        ...additionalData
      },
      timestamp: new Date()
    };

    global.socketService.sendNotification(notification);

    console.log(`⚡ Sent flash sale alert for merchant ${merchantId}, duration: ${duration} minutes`);
  }

  /**
   * Validate promotion data
   */
  private static validatePromotionData(data: CreatePromotionRequest): void {
    if (!data.merchantId || data.merchantId.trim().length === 0) {
      throw new Error('Merchant ID is required');
    }

    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Promotion title is required');
    }

    if (!data.description || data.description.trim().length === 0) {
      throw new Error('Promotion description is required');
    }

    if (data.validFrom >= data.validUntil) {
      throw new Error('Valid from date must be before valid until date');
    }

    if (data.validUntil <= new Date()) {
      throw new Error('Valid until date must be in the future');
    }

    if (data.discountValue !== undefined) {
      if (data.discountValue <= 0) {
        throw new Error('Discount value must be greater than 0');
      }

      if (data.discountType === 'percentage' && data.discountValue > 100) {
        throw new Error('Percentage discount cannot exceed 100%');
      }
    }

    if (data.maxRedemptions !== undefined && data.maxRedemptions <= 0) {
      throw new Error('Max redemptions must be greater than 0');
    }

    if (data.targetLocation) {
      if (data.targetLocation.radius <= 0) {
        throw new Error('Target location radius must be greater than 0');
      }

      if (Math.abs(data.targetLocation.latitude) > 90) {
        throw new Error('Invalid latitude value');
      }

      if (Math.abs(data.targetLocation.longitude) > 180) {
        throw new Error('Invalid longitude value');
      }
    }
  }
}
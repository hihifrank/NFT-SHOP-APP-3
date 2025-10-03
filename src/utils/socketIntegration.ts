/**
 * Utility functions for integrating Socket.io with existing services
 */

import { LotteryBroadcast, PromotionBroadcast, NotificationBroadcast } from '../types';

/**
 * Helper class for Socket.io integration with existing services
 */
export class SocketIntegration {
  /**
   * Broadcast lottery draw started event
   */
  static broadcastLotteryDrawStarted(lotteryId: string, lotteryName: string, participantCount: number): void {
    if (!global.socketService) return;

    const broadcast: LotteryBroadcast = {
      lotteryId,
      type: 'draw_started',
      data: {
        lotteryName,
        totalParticipants: participantCount,
        message: `抽獎「${lotteryName}」開始進行，共有 ${participantCount} 位參與者`
      },
      timestamp: new Date()
    };

    global.socketService.broadcastLotteryEvent(broadcast);
  }

  /**
   * Broadcast lottery draw completed event
   */
  static broadcastLotteryDrawCompleted(lotteryId: string, lotteryName: string, winnerCount: number): void {
    if (!global.socketService) return;

    const broadcast: LotteryBroadcast = {
      lotteryId,
      type: 'draw_completed',
      data: {
        lotteryName,
        totalWinners: winnerCount,
        message: `抽獎「${lotteryName}」已完成，共產生 ${winnerCount} 位中獎者`
      },
      timestamp: new Date()
    };

    global.socketService.broadcastLotteryEvent(broadcast);
  }

  /**
   * Broadcast lottery winners announcement
   */
  static broadcastLotteryWinners(lotteryId: string, lotteryName: string, winners: any[]): void {
    if (!global.socketService) return;

    const broadcast: LotteryBroadcast = {
      lotteryId,
      type: 'winner_announced',
      data: {
        lotteryName,
        winners: winners.map(w => ({
          userId: w.userId,
          prize: w.prize,
          winningNumber: w.winningNumber
        })),
        message: `恭喜 ${winners.length} 位中獎者！`
      },
      timestamp: new Date()
    };

    global.socketService.broadcastLotteryEvent(broadcast);

    // Send individual notifications to winners
    winners.forEach(winner => {
      this.notifyLotteryWinner(winner.userId, lotteryName, winner.prize);
    });
  }

  /**
   * Send individual winner notification
   */
  static notifyLotteryWinner(userId: string, lotteryName: string, prize: any): void {
    if (!global.socketService) return;

    const notification: NotificationBroadcast = {
      type: 'lottery',
      title: '🎉 恭喜中獎！',
      message: `您在抽獎「${lotteryName}」中獲得了獎品！`,
      data: {
        lotteryName,
        prize,
        isWinner: true
      },
      targetUsers: [userId],
      timestamp: new Date()
    };

    global.socketService.sendNotification(notification);
  }

  /**
   * Broadcast merchant flash sale
   */
  static broadcastFlashSale(
    merchantId: string, 
    title: string, 
    description: string, 
    durationMinutes: number,
    location?: { latitude: number; longitude: number; radius: number }
  ): void {
    if (!global.socketService) return;

    const endTime = new Date(Date.now() + durationMinutes * 60 * 1000);

    const broadcast: PromotionBroadcast = {
      merchantId,
      type: 'flash_sale',
      title,
      description,
      location,
      data: {
        duration: durationMinutes,
        endsAt: endTime,
        isFlashSale: true
      },
      timestamp: new Date()
    };

    global.socketService.broadcastPromotion(broadcast);

    // Also send as urgent notification
    const notification: NotificationBroadcast = {
      type: 'merchant',
      title: '⚡ 限時閃購！',
      message: `${title} - 僅限 ${durationMinutes} 分鐘！`,
      data: {
        merchantId,
        flashSale: true,
        duration: durationMinutes,
        endsAt: endTime
      },
      targetLocation: location,
      timestamp: new Date()
    };

    global.socketService.sendNotification(notification);
  }

  /**
   * Broadcast location-based promotion
   */
  static broadcastLocationPromotion(
    merchantId: string,
    title: string,
    description: string,
    location: { latitude: number; longitude: number; radius: number },
    additionalData?: any
  ): void {
    if (!global.socketService) return;

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

    // Send location-based notification
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
  }

  /**
   * Send NFT transaction status update
   */
  static notifyNFTTransactionStatus(
    userId: string,
    transactionType: string,
    status: 'pending' | 'confirmed' | 'failed',
    transactionHash?: string,
    additionalData?: any
  ): void {
    if (!global.socketService) return;

    let title = '';
    let message = '';

    switch (status) {
      case 'pending':
        title = '⏳ 交易處理中';
        message = `您的 ${transactionType} 交易正在處理中...`;
        break;
      case 'confirmed':
        title = '✅ 交易成功';
        message = `您的 ${transactionType} 交易已成功完成！`;
        break;
      case 'failed':
        title = '❌ 交易失敗';
        message = `您的 ${transactionType} 交易失敗，請重試。`;
        break;
    }

    const notification: NotificationBroadcast = {
      type: 'nft',
      title,
      message,
      data: {
        transactionType,
        status,
        transactionHash,
        ...additionalData
      },
      targetUsers: [userId],
      timestamp: new Date()
    };

    global.socketService.sendNotification(notification);
  }

  /**
   * Send system maintenance notification
   */
  static notifySystemMaintenance(
    title: string,
    message: string,
    maintenanceStart: Date,
    maintenanceEnd: Date,
    targetUsers?: string[]
  ): void {
    if (!global.socketService) return;

    const notification: NotificationBroadcast = {
      type: 'system',
      title,
      message,
      data: {
        maintenanceStart,
        maintenanceEnd,
        duration: Math.round((maintenanceEnd.getTime() - maintenanceStart.getTime()) / (1000 * 60)) // minutes
      },
      targetUsers,
      timestamp: new Date()
    };

    global.socketService.sendNotification(notification);

    // Also broadcast as system message
    global.socketService.broadcastSystemMessage(message, 'warning');
  }

  /**
   * Send coupon usage notification
   */
  static notifyCouponUsage(
    userId: string,
    couponTitle: string,
    merchantName: string,
    discountValue: number,
    discountType: 'percentage' | 'fixed_amount'
  ): void {
    if (!global.socketService) return;

    const discountText = discountType === 'percentage' 
      ? `${discountValue}%` 
      : `$${discountValue}`;

    const notification: NotificationBroadcast = {
      type: 'nft',
      title: '🎫 優惠券已使用',
      message: `您已在 ${merchantName} 使用了 ${couponTitle}，享受 ${discountText} 優惠！`,
      data: {
        couponTitle,
        merchantName,
        discountValue,
        discountType,
        usedAt: new Date()
      },
      targetUsers: [userId],
      timestamp: new Date()
    };

    global.socketService.sendNotification(notification);
  }

  /**
   * Broadcast new NFT coupon availability
   */
  static broadcastNewNFTCoupon(
    merchantId: string,
    couponTitle: string,
    discountValue: number,
    discountType: 'percentage' | 'fixed_amount',
    quantity: number,
    location?: { latitude: number; longitude: number; radius: number }
  ): void {
    if (!global.socketService) return;

    const discountText = discountType === 'percentage' 
      ? `${discountValue}%` 
      : `$${discountValue}`;

    const broadcast: PromotionBroadcast = {
      merchantId,
      type: 'new_promotion',
      title: `新NFT優惠券：${couponTitle}`,
      description: `限量 ${quantity} 張，享受 ${discountText} 優惠！`,
      location,
      data: {
        couponTitle,
        discountValue,
        discountType,
        quantity,
        isNFTCoupon: true
      },
      timestamp: new Date()
    };

    global.socketService.broadcastPromotion(broadcast);
  }
}

/**
 * Global helper functions for easy access
 */

// Lottery integration helpers
export const broadcastLotteryEvent = SocketIntegration.broadcastLotteryDrawStarted;
export const broadcastLotteryCompleted = SocketIntegration.broadcastLotteryDrawCompleted;
export const broadcastLotteryWinners = SocketIntegration.broadcastLotteryWinners;

// Promotion integration helpers
export const broadcastFlashSale = SocketIntegration.broadcastFlashSale;
export const broadcastLocationPromotion = SocketIntegration.broadcastLocationPromotion;

// Notification helpers
export const notifyNFTTransaction = SocketIntegration.notifyNFTTransactionStatus;
export const notifySystemMaintenance = SocketIntegration.notifySystemMaintenance;
export const notifyCouponUsage = SocketIntegration.notifyCouponUsage;
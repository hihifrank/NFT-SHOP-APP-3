import { Request, Response } from 'express';
import { LotteryBroadcast, PromotionBroadcast, NotificationBroadcast } from '../types';

/**
 * Controller for managing Socket.io real-time communications
 */
export class SocketController {
  /**
   * Broadcast lottery event to all participants
   */
  public static async broadcastLotteryEvent(req: Request, res: Response): Promise<void> {
    try {
      const { lotteryId, type, data } = req.body;

      if (!lotteryId || !type) {
        res.status(400).json({
          success: false,
          error: 'lotteryId and type are required',
        });
        return;
      }

      const broadcast: LotteryBroadcast = {
        lotteryId,
        type,
        data: data || {},
        timestamp: new Date(),
      };

      // Use global socket service
      global.socketService.broadcastLotteryEvent(broadcast);

      res.json({
        success: true,
        message: `Lottery event ${type} broadcasted successfully`,
        data: {
          lotteryId,
          type,
          timestamp: broadcast.timestamp,
        },
      });
    } catch (error) {
      console.error('Error broadcasting lottery event:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to broadcast lottery event',
      });
    }
  }

  /**
   * Broadcast promotion to users in specific location or all users
   */
  public static async broadcastPromotion(req: Request, res: Response): Promise<void> {
    try {
      const { merchantId, type, title, description, location, data } = req.body;

      if (!merchantId || !type || !title || !description) {
        res.status(400).json({
          success: false,
          error: 'merchantId, type, title, and description are required',
        });
        return;
      }

      const broadcast: PromotionBroadcast = {
        merchantId,
        type,
        title,
        description,
        location,
        data: data || {},
        timestamp: new Date(),
      };

      // Use global socket service
      global.socketService.broadcastPromotion(broadcast);

      res.json({
        success: true,
        message: 'Promotion broadcasted successfully',
        data: {
          merchantId,
          type,
          title,
          timestamp: broadcast.timestamp,
        },
      });
    } catch (error) {
      console.error('Error broadcasting promotion:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to broadcast promotion',
      });
    }
  }

  /**
   * Send notification to specific users or broadcast to all
   */
  public static async sendNotification(req: Request, res: Response): Promise<void> {
    try {
      const { type, title, message, data, targetUsers, targetLocation } = req.body;

      if (!type || !title || !message) {
        res.status(400).json({
          success: false,
          error: 'type, title, and message are required',
        });
        return;
      }

      const notification: NotificationBroadcast = {
        type,
        title,
        message,
        data,
        targetUsers,
        targetLocation,
        timestamp: new Date(),
      };

      // Use global socket service
      global.socketService.sendNotification(notification);

      res.json({
        success: true,
        message: 'Notification sent successfully',
        data: {
          type,
          title,
          targetUsers: targetUsers?.length || 'all',
          timestamp: notification.timestamp,
        },
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send notification',
      });
    }
  }

  /**
   * Send direct message to a specific user
   */
  public static async sendToUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId, event, data } = req.body;

      if (!userId || !event) {
        res.status(400).json({
          success: false,
          error: 'userId and event are required',
        });
        return;
      }

      // Use global socket service
      global.socketService.sendToUser(userId, event, data || {});

      res.json({
        success: true,
        message: 'Message sent to user successfully',
        data: {
          userId,
          event,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Error sending message to user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send message to user',
      });
    }
  }

  /**
   * Get Socket.io server statistics
   */
  public static async getSocketStats(req: Request, res: Response): Promise<void> {
    try {
      const connectedUsers = global.socketService.getConnectedUsersCount();

      res.json({
        success: true,
        data: {
          connectedUsers,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Error getting socket stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get socket statistics',
      });
    }
  }

  /**
   * Get users in a specific room
   */
  public static async getRoomUsers(req: Request, res: Response): Promise<void> {
    try {
      const { roomName } = req.params;

      if (!roomName) {
        res.status(400).json({
          success: false,
          error: 'roomName is required',
        });
        return;
      }

      const users = await global.socketService.getUsersInRoom(roomName);

      res.json({
        success: true,
        data: {
          roomName,
          userCount: users.length,
          users,
        },
      });
    } catch (error) {
      console.error('Error getting room users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get room users',
      });
    }
  }

  /**
   * Check if a user is connected
   */
  public static async checkUserConnection(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'userId is required',
        });
        return;
      }

      const isConnected = global.socketService.isUserConnected(userId);

      res.json({
        success: true,
        data: {
          userId,
          isConnected,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Error checking user connection:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check user connection',
      });
    }
  }

  /**
   * Broadcast system maintenance message
   */
  public static async broadcastSystemMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, type = 'info' } = req.body;

      if (!message) {
        res.status(400).json({
          success: false,
          error: 'message is required',
        });
        return;
      }

      // Use global socket service
      global.socketService.broadcastSystemMessage(message, type);

      res.json({
        success: true,
        message: 'System message broadcasted successfully',
        data: {
          message,
          type,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Error broadcasting system message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to broadcast system message',
      });
    }
  }
}
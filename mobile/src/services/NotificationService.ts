import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeoLocation, Merchant, CouponNFT } from '../types';

export interface NotificationData {
  type: 'location_based' | 'coupon_reminder' | 'lottery_result' | 'merchant_promotion';
  title: string;
  body: string;
  data?: any;
}

export interface LocationBasedNotification {
  merchantId: string;
  merchantName: string;
  message: string;
  radius: number; // in meters
  location: GeoLocation;
}

class NotificationService {
  private static instance: NotificationService;
  private fcmToken: string | null = null;
  private isInitialized = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permission for notifications
      await this.requestPermission();
      
      // Configure push notifications
      this.configurePushNotifications();
      
      // Get FCM token
      await this.getFCMToken();
      
      // Set up message handlers
      this.setupMessageHandlers();
      
      this.isInitialized = true;
      console.log('NotificationService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NotificationService:', error);
      throw error;
    }
  }

  private async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        return enabled;
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  private configurePushNotifications(): void {
    PushNotification.configure({
      onRegister: (token) => {
        console.log('Push notification token:', token);
      },
      onNotification: (notification) => {
        console.log('Notification received:', notification);
        this.handleNotification(notification);
      },
      onAction: (notification) => {
        console.log('Notification action:', notification);
      },
      onRegistrationError: (err) => {
        console.error('Push notification registration error:', err);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Create notification channels for Android
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'location-notifications',
          channelName: 'Location Based Notifications',
          channelDescription: 'Notifications based on your location',
          playSound: true,
          soundName: 'default',
          importance: 4,
          vibrate: true,
        },
        () => {}
      );

      PushNotification.createChannel(
        {
          channelId: 'coupon-reminders',
          channelName: 'Coupon Reminders',
          channelDescription: 'Reminders about your coupons',
          playSound: true,
          soundName: 'default',
          importance: 4,
          vibrate: true,
        },
        () => {}
      );
    }
  }

  private async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      this.fcmToken = token;
      
      // Store token locally
      await AsyncStorage.setItem('fcm_token', token);
      
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  }

  private setupMessageHandlers(): void {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Message handled in the background!', remoteMessage);
      this.processBackgroundMessage(remoteMessage);
    });

    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('Message received in foreground!', remoteMessage);
      this.showLocalNotification(remoteMessage);
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification caused app to open from background state:', remoteMessage);
      this.handleNotificationOpen(remoteMessage);
    });

    // Check whether an initial notification is available
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage);
          this.handleNotificationOpen(remoteMessage);
        }
      });
  }

  private showLocalNotification(remoteMessage: any): void {
    const { notification, data } = remoteMessage;
    
    PushNotification.localNotification({
      title: notification?.title || 'HK Retail NFT',
      message: notification?.body || '',
      playSound: true,
      soundName: 'default',
      userInfo: data,
      channelId: this.getChannelId(data?.type),
    });
  }

  private getChannelId(type?: string): string {
    switch (type) {
      case 'location_based':
      case 'merchant_promotion':
        return 'location-notifications';
      case 'coupon_reminder':
        return 'coupon-reminders';
      default:
        return 'default';
    }
  }

  private processBackgroundMessage(remoteMessage: any): void {
    // Process background message and update local storage if needed
    const { data } = remoteMessage;
    
    if (data?.type === 'coupon_reminder') {
      this.updateCouponReminderStatus(data.couponId);
    }
  }

  private handleNotification(notification: any): void {
    // Handle notification tap
    if (notification.userInteraction) {
      this.handleNotificationOpen(notification);
    }
  }

  private handleNotificationOpen(notification: any): void {
    const { data } = notification;
    
    // Navigate based on notification type
    switch (data?.type) {
      case 'location_based':
      case 'merchant_promotion':
        // Navigate to merchant detail
        if (data.merchantId) {
          // This would be handled by navigation service
          console.log('Navigate to merchant:', data.merchantId);
        }
        break;
      case 'coupon_reminder':
        // Navigate to NFT screen
        console.log('Navigate to NFT screen');
        break;
      case 'lottery_result':
        // Navigate to lottery result
        if (data.lotteryId) {
          console.log('Navigate to lottery result:', data.lotteryId);
        }
        break;
    }
  }

  // Public methods for sending notifications

  async sendLocationBasedNotification(
    userLocation: GeoLocation,
    merchants: Merchant[]
  ): Promise<void> {
    try {
      const nearbyMerchants = this.findNearbyMerchants(userLocation, merchants, 500); // 500m radius
      
      for (const merchant of nearbyMerchants) {
        const notificationData: NotificationData = {
          type: 'location_based',
          title: `附近發現 ${merchant.name}`,
          body: `您距離 ${merchant.name} 只有 ${Math.round(merchant.distance || 0)}米，快來看看有什麼優惠！`,
          data: {
            merchantId: merchant.id,
            merchantName: merchant.name,
          },
        };

        this.scheduleLocalNotification(notificationData);
      }
    } catch (error) {
      console.error('Failed to send location-based notification:', error);
    }
  }

  async sendCouponReminderNotification(coupon: CouponNFT): Promise<void> {
    try {
      const expiryDate = new Date(coupon.expiryDate);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry <= 3 && daysUntilExpiry > 0) {
        const notificationData: NotificationData = {
          type: 'coupon_reminder',
          title: '優惠券即將到期',
          body: `您的 ${coupon.merchantName} 優惠券將在 ${daysUntilExpiry} 天後到期，記得使用！`,
          data: {
            couponId: coupon.id,
            merchantName: coupon.merchantName,
            expiryDate: coupon.expiryDate,
          },
        };

        this.scheduleLocalNotification(notificationData);
      }
    } catch (error) {
      console.error('Failed to send coupon reminder:', error);
    }
  }

  async sendMerchantPromotionNotification(
    merchant: Merchant,
    promotion: string
  ): Promise<void> {
    try {
      const notificationData: NotificationData = {
        type: 'merchant_promotion',
        title: `${merchant.name} 新優惠`,
        body: promotion,
        data: {
          merchantId: merchant.id,
          merchantName: merchant.name,
          promotion,
        },
      };

      this.scheduleLocalNotification(notificationData);
    } catch (error) {
      console.error('Failed to send merchant promotion notification:', error);
    }
  }

  private scheduleLocalNotification(notificationData: NotificationData): void {
    PushNotification.localNotification({
      title: notificationData.title,
      message: notificationData.body,
      playSound: true,
      soundName: 'default',
      userInfo: notificationData.data,
      channelId: this.getChannelId(notificationData.type),
    });
  }

  private findNearbyMerchants(
    userLocation: GeoLocation,
    merchants: Merchant[],
    radiusInMeters: number
  ): Merchant[] {
    return merchants
      .map(merchant => ({
        ...merchant,
        distance: this.calculateDistance(userLocation, {
          latitude: merchant.latitude,
          longitude: merchant.longitude,
        }),
      }))
      .filter(merchant => (merchant.distance || 0) <= radiusInMeters)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  private calculateDistance(point1: GeoLocation, point2: GeoLocation): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private async updateCouponReminderStatus(couponId: string): Promise<void> {
    try {
      const reminders = await AsyncStorage.getItem('coupon_reminders');
      const reminderList = reminders ? JSON.parse(reminders) : [];
      
      if (!reminderList.includes(couponId)) {
        reminderList.push(couponId);
        await AsyncStorage.setItem('coupon_reminders', JSON.stringify(reminderList));
      }
    } catch (error) {
      console.error('Failed to update coupon reminder status:', error);
    }
  }

  // Utility methods

  async getFCMTokenForBackend(): Promise<string | null> {
    return this.fcmToken || await this.getFCMToken();
  }

  async clearAllNotifications(): Promise<void> {
    PushNotification.cancelAllLocalNotifications();
  }

  async setBadgeCount(count: number): Promise<void> {
    if (Platform.OS === 'ios') {
      PushNotification.setApplicationIconBadgeNumber(count);
    }
  }
}

export default NotificationService;
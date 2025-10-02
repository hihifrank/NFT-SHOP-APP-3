import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from './NotificationService';
import LocationService from './LocationService';
import { GeoLocation, Merchant, CouponNFT } from '../types';

interface NotificationSettings {
  locationBasedEnabled: boolean;
  couponRemindersEnabled: boolean;
  merchantPromotionsEnabled: boolean;
  notificationRadius: number; // in meters
}

interface LocationNotificationState {
  lastNotificationTime: number;
  notifiedMerchants: string[];
}

class NotificationManager {
  private static instance: NotificationManager;
  private notificationService: NotificationService;
  private locationService: LocationService;
  private appState: AppStateStatus = 'active';
  private locationCheckInterval: NodeJS.Timeout | null = null;
  private couponReminderInterval: NodeJS.Timeout | null = null;
  private settings: NotificationSettings = {
    locationBasedEnabled: true,
    couponRemindersEnabled: true,
    merchantPromotionsEnabled: true,
    notificationRadius: 500, // 500 meters
  };

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  constructor() {
    this.notificationService = NotificationService.getInstance();
    this.locationService = LocationService.getInstance();
    this.setupAppStateListener();
  }

  async initialize(): Promise<void> {
    try {
      // Initialize notification service
      await this.notificationService.initialize();
      
      // Load settings
      await this.loadSettings();
      
      // Start location-based notifications if enabled
      if (this.settings.locationBasedEnabled) {
        this.startLocationBasedNotifications();
      }
      
      // Start coupon reminder checks if enabled
      if (this.settings.couponRemindersEnabled) {
        this.startCouponReminderChecks();
      }
      
      console.log('NotificationManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NotificationManager:', error);
      throw error;
    }
  }

  private setupAppStateListener(): void {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        this.onAppForeground();
      } else if (this.appState === 'active' && nextAppState.match(/inactive|background/)) {
        // App has gone to the background
        this.onAppBackground();
      }
      this.appState = nextAppState;
    });
  }

  private onAppForeground(): void {
    console.log('App came to foreground, resuming notifications');
    
    if (this.settings.locationBasedEnabled) {
      this.startLocationBasedNotifications();
    }
    
    if (this.settings.couponRemindersEnabled) {
      this.startCouponReminderChecks();
    }
  }

  private onAppBackground(): void {
    console.log('App went to background, pausing location checks');
    
    // Stop location checks to save battery
    if (this.locationCheckInterval) {
      clearInterval(this.locationCheckInterval);
      this.locationCheckInterval = null;
    }
  }

  private startLocationBasedNotifications(): void {
    if (this.locationCheckInterval) {
      clearInterval(this.locationCheckInterval);
    }

    // Check location every 2 minutes when app is active
    this.locationCheckInterval = setInterval(async () => {
      if (this.appState === 'active') {
        await this.checkLocationForNotifications();
      }
    }, 2 * 60 * 1000); // 2 minutes

    // Initial check
    this.checkLocationForNotifications();
  }

  private async checkLocationForNotifications(): Promise<void> {
    try {
      const currentLocation = await this.locationService.getCurrentLocation();
      if (!currentLocation) return;

      const merchants = await this.getNearbyMerchants(currentLocation);
      const notificationState = await this.getLocationNotificationState();
      
      // Filter merchants that haven't been notified recently
      const newMerchants = merchants.filter(merchant => {
        const lastNotified = notificationState.notifiedMerchants.includes(merchant.id);
        const timeSinceLastNotification = Date.now() - notificationState.lastNotificationTime;
        
        // Don't notify about the same merchant within 1 hour
        return !lastNotified || timeSinceLastNotification > 60 * 60 * 1000;
      });

      if (newMerchants.length > 0) {
        await this.notificationService.sendLocationBasedNotification(currentLocation, newMerchants);
        
        // Update notification state
        await this.updateLocationNotificationState({
          lastNotificationTime: Date.now(),
          notifiedMerchants: newMerchants.map(m => m.id),
        });
      }
    } catch (error) {
      console.error('Failed to check location for notifications:', error);
    }
  }

  private async getNearbyMerchants(location: GeoLocation): Promise<Merchant[]> {
    try {
      // This would typically call an API to get nearby merchants
      // For now, we'll simulate with stored data
      const merchantsData = await AsyncStorage.getItem('cached_merchants');
      if (!merchantsData) return [];

      const merchants: Merchant[] = JSON.parse(merchantsData);
      
      return merchants.filter(merchant => {
        const distance = this.calculateDistance(location, {
          latitude: merchant.latitude,
          longitude: merchant.longitude,
        });
        return distance <= this.settings.notificationRadius;
      });
    } catch (error) {
      console.error('Failed to get nearby merchants:', error);
      return [];
    }
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

  private startCouponReminderChecks(): void {
    if (this.couponReminderInterval) {
      clearInterval(this.couponReminderInterval);
    }

    // Check coupons every 6 hours
    this.couponReminderInterval = setInterval(async () => {
      await this.checkCouponReminders();
    }, 6 * 60 * 60 * 1000); // 6 hours

    // Initial check
    this.checkCouponReminders();
  }

  private async checkCouponReminders(): Promise<void> {
    try {
      const couponsData = await AsyncStorage.getItem('user_coupons');
      if (!couponsData) return;

      const coupons: CouponNFT[] = JSON.parse(couponsData);
      const activeCoupons = coupons.filter(coupon => !coupon.isUsed);

      for (const coupon of activeCoupons) {
        await this.notificationService.sendCouponReminderNotification(coupon);
      }
    } catch (error) {
      console.error('Failed to check coupon reminders:', error);
    }
  }

  private async getLocationNotificationState(): Promise<LocationNotificationState> {
    try {
      const stateData = await AsyncStorage.getItem('location_notification_state');
      if (stateData) {
        return JSON.parse(stateData);
      }
    } catch (error) {
      console.error('Failed to get location notification state:', error);
    }

    return {
      lastNotificationTime: 0,
      notifiedMerchants: [],
    };
  }

  private async updateLocationNotificationState(state: LocationNotificationState): Promise<void> {
    try {
      await AsyncStorage.setItem('location_notification_state', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to update location notification state:', error);
    }
  }

  // Public methods for managing notifications

  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();

    // Restart services based on new settings
    if (newSettings.locationBasedEnabled !== undefined) {
      if (newSettings.locationBasedEnabled) {
        this.startLocationBasedNotifications();
      } else {
        if (this.locationCheckInterval) {
          clearInterval(this.locationCheckInterval);
          this.locationCheckInterval = null;
        }
      }
    }

    if (newSettings.couponRemindersEnabled !== undefined) {
      if (newSettings.couponRemindersEnabled) {
        this.startCouponReminderChecks();
      } else {
        if (this.couponReminderInterval) {
          clearInterval(this.couponReminderInterval);
          this.couponReminderInterval = null;
        }
      }
    }
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  async sendMerchantPromotion(merchant: Merchant, promotion: string): Promise<void> {
    if (this.settings.merchantPromotionsEnabled) {
      await this.notificationService.sendMerchantPromotionNotification(merchant, promotion);
    }
  }

  async clearAllNotifications(): Promise<void> {
    await this.notificationService.clearAllNotifications();
  }

  async setBadgeCount(count: number): Promise<void> {
    await this.notificationService.setBadgeCount(count);
  }

  async getFCMToken(): Promise<string | null> {
    return await this.notificationService.getFCMTokenForBackend();
  }

  private async loadSettings(): Promise<void> {
    try {
      const settingsData = await AsyncStorage.getItem('notification_settings');
      if (settingsData) {
        this.settings = { ...this.settings, ...JSON.parse(settingsData) };
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('notification_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }

  destroy(): void {
    if (this.locationCheckInterval) {
      clearInterval(this.locationCheckInterval);
    }
    if (this.couponReminderInterval) {
      clearInterval(this.couponReminderInterval);
    }
  }
}

export default NotificationManager;
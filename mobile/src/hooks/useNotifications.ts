import { useEffect, useCallback } from 'react';
import { useAppSelector } from '../store';
import NotificationManager from '../services/NotificationManager';
import LocationService from '../services/LocationService';
import { CouponNFT, Merchant } from '../types';

export const useNotifications = () => {
  const { user } = useAppSelector(state => state.auth);
  const { coupons } = useAppSelector(state => state.coupon);
  const { merchants } = useAppSelector(state => state.merchant);

  const notificationManager = NotificationManager.getInstance();
  const locationService = LocationService.getInstance();

  // Initialize notifications when user is authenticated
  useEffect(() => {
    if (user) {
      initializeNotifications();
    }
  }, [user]);

  // Monitor coupon changes for reminders
  useEffect(() => {
    if (coupons && coupons.length > 0) {
      checkCouponReminders(coupons);
    }
  }, [coupons]);

  const initializeNotifications = useCallback(async () => {
    try {
      await notificationManager.initialize();
      console.log('Notifications initialized for user:', user?.walletAddress);
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }, [user]);

  const checkCouponReminders = useCallback(async (userCoupons: CouponNFT[]) => {
    try {
      const activeCoupons = userCoupons.filter(coupon => !coupon.isUsed);
      
      for (const coupon of activeCoupons) {
        await notificationManager.sendCouponReminderNotification(coupon);
      }
    } catch (error) {
      console.error('Failed to check coupon reminders:', error);
    }
  }, []);

  const sendLocationBasedNotifications = useCallback(async () => {
    try {
      const currentLocation = await locationService.getCurrentLocation();
      if (!currentLocation || !merchants) return;

      await notificationManager.sendLocationBasedNotification(currentLocation, merchants);
    } catch (error) {
      console.error('Failed to send location-based notifications:', error);
    }
  }, [merchants]);

  const sendMerchantPromotion = useCallback(async (merchant: Merchant, promotion: string) => {
    try {
      await notificationManager.sendMerchantPromotionNotification(merchant, promotion);
    } catch (error) {
      console.error('Failed to send merchant promotion:', error);
    }
  }, []);

  const updateNotificationSettings = useCallback(async (settings: any) => {
    try {
      await notificationManager.updateSettings(settings);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    try {
      await notificationManager.clearAllNotifications();
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }, []);

  const getFCMToken = useCallback(async () => {
    try {
      return await notificationManager.getFCMToken();
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  }, []);

  return {
    sendLocationBasedNotifications,
    sendMerchantPromotion,
    updateNotificationSettings,
    clearAllNotifications,
    getFCMToken,
  };
};

export default useNotifications;
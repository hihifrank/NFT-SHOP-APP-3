# Push Notifications Implementation

This document describes the push notification implementation for the HK Retail NFT Platform mobile app.

## Overview

The app implements Firebase Cloud Messaging (FCM) for push notifications with the following features:

- **Location-based notifications**: Notify users when they're near participating merchants
- **Coupon reminders**: Remind users about expiring coupons
- **Merchant promotions**: Send promotional notifications from merchants
- **Lottery results**: Notify users about lottery outcomes

## Architecture

### Core Components

1. **NotificationService**: Handles FCM setup, token management, and message processing
2. **NotificationManager**: Manages notification logic, settings, and scheduling
3. **NotificationSettingsScreen**: UI for users to configure notification preferences
4. **useNotifications hook**: React hook for integrating notifications with app state

### Key Features

- **Background/Foreground handling**: Processes notifications in all app states
- **Location-aware**: Integrates with LocationService for proximity notifications
- **Configurable settings**: Users can control notification types and radius
- **Multilingual support**: Notifications support English and Chinese (Traditional/Simplified)
- **Battery optimization**: Smart scheduling to minimize battery drain

## Setup Instructions

### Firebase Configuration

1. **Android Setup**:
   - Place `google-services.json` in `android/app/`
   - Update `AndroidManifest.xml` with notification permissions
   - Configure notification channels and icons

2. **iOS Setup**:
   - Place `GoogleService-Info.plist` in `ios/hkretailnftmobile/`
   - Update `Info.plist` with notification permissions
   - Configure APNs certificates in Firebase Console

### Dependencies

```json
{
  "@react-native-firebase/app": "^18.6.1",
  "@react-native-firebase/messaging": "^18.6.1",
  "react-native-push-notification": "^8.1.1",
  "@react-native-community/push-notification-ios": "^1.11.0"
}
```

### Installation

```bash
cd mobile
npm install
# For iOS
cd ios && pod install
```

## Usage

### Initialization

The notification system is automatically initialized in `App.tsx`:

```typescript
import NotificationManager from '@services/NotificationManager';

useEffect(() => {
  NotificationManager.getInstance().initialize().catch(console.error);
}, []);
```

### Using the Hook

```typescript
import { useNotifications } from '@hooks/useNotifications';

const MyComponent = () => {
  const { 
    sendLocationBasedNotifications,
    updateNotificationSettings,
    clearAllNotifications 
  } = useNotifications();
  
  // Use notification functions
};
```

### Settings Management

Users can configure notifications through the settings screen:

- Enable/disable location-based notifications
- Set notification radius (100m - 2km)
- Toggle coupon reminders
- Control promotional notifications

## Notification Types

### Location-Based Notifications

Triggered when users are within the configured radius of participating merchants:

```typescript
{
  type: 'location_based',
  title: '附近發現 [Merchant Name]',
  body: '您距離 [Merchant Name] 只有 [distance]米，快來看看有什麼優惠！',
  data: {
    merchantId: 'merchant_id',
    merchantName: 'Merchant Name'
  }
}
```

### Coupon Reminders

Sent when coupons are about to expire (3 days before):

```typescript
{
  type: 'coupon_reminder',
  title: '優惠券即將到期',
  body: '您的 [Merchant Name] 優惠券將在 [days] 天後到期，記得使用！',
  data: {
    couponId: 'coupon_id',
    merchantName: 'Merchant Name',
    expiryDate: '2024-01-01'
  }
}
```

### Merchant Promotions

Promotional messages from merchants:

```typescript
{
  type: 'merchant_promotion',
  title: '[Merchant Name] 新優惠',
  body: '[Promotion Message]',
  data: {
    merchantId: 'merchant_id',
    merchantName: 'Merchant Name',
    promotion: 'Promotion details'
  }
}
```

## Configuration

### Notification Settings

Default settings can be configured in `NotificationManager`:

```typescript
private settings: NotificationSettings = {
  locationBasedEnabled: true,
  couponRemindersEnabled: true,
  merchantPromotionsEnabled: true,
  notificationRadius: 500, // 500 meters
};
```

### Timing Configuration

- **Location checks**: Every 2 minutes when app is active
- **Coupon reminders**: Every 6 hours
- **Notification cooldown**: 1 hour between same merchant notifications

## Privacy & Permissions

### Required Permissions

- **Android**: `POST_NOTIFICATIONS`, `ACCESS_FINE_LOCATION`
- **iOS**: Notification permission, Location permission

### Privacy Considerations

- Location data is only used for proximity calculations
- No location data is stored permanently
- Users can disable location-based notifications
- FCM tokens are managed securely

## Testing

### Local Testing

1. Enable notifications in device settings
2. Grant location permissions
3. Use the notification settings screen to configure preferences
4. Test with nearby merchants or mock location data

### Firebase Console Testing

1. Go to Firebase Console > Cloud Messaging
2. Send test messages to specific FCM tokens
3. Test different notification types and payloads

## Troubleshooting

### Common Issues

1. **Notifications not received**:
   - Check device notification settings
   - Verify FCM token generation
   - Check Firebase Console for delivery status

2. **Location notifications not working**:
   - Verify location permissions
   - Check if location services are enabled
   - Ensure merchants data is available

3. **iOS specific issues**:
   - Verify APNs certificates
   - Check provisioning profiles
   - Ensure proper entitlements

### Debug Commands

```bash
# Check FCM token
adb logcat | grep FCM

# iOS logs
xcrun simctl spawn booted log stream --predicate 'subsystem contains "com.hkretailnft.mobile"'
```

## Future Enhancements

- **Rich notifications**: Images and action buttons
- **Scheduled notifications**: Time-based reminders
- **Geofencing**: More precise location triggers
- **Analytics**: Notification engagement tracking
- **A/B testing**: Optimize notification content

## Security Notes

- FCM tokens are refreshed automatically
- All notification data is validated before processing
- Location data is processed locally only
- No sensitive user data in notification payloads
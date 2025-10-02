import { Platform, Alert, Linking } from 'react-native';
import { request, check, PERMISSIONS, RESULTS, openSettings } from '../mocks/permissions';

export interface LocationPermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  message?: string;
}

export class LocationUtils {
  /**
   * Check and request location permission
   */
  static async checkAndRequestLocationPermission(): Promise<LocationPermissionResult> {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE 
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      // Check current permission status
      const currentStatus = await check(permission);
      
      switch (currentStatus) {
        case RESULTS.GRANTED:
          return { granted: true, canAskAgain: true };
          
        case RESULTS.DENIED:
          // Permission has not been requested yet, request it
          const requestResult = await request(permission);
          return this.handlePermissionResult(requestResult);
          
        case RESULTS.BLOCKED:
          return {
            granted: false,
            canAskAgain: false,
            message: 'Location permission is blocked. Please enable it in settings.',
          };
          
        case RESULTS.LIMITED:
          // iOS only - limited location access
          return {
            granted: true,
            canAskAgain: true,
            message: 'Limited location access granted.',
          };
          
        case RESULTS.UNAVAILABLE:
          return {
            granted: false,
            canAskAgain: false,
            message: 'Location services are not available on this device.',
          };
          
        default:
          return {
            granted: false,
            canAskAgain: true,
            message: 'Unknown permission status.',
          };
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
      return {
        granted: false,
        canAskAgain: true,
        message: 'Error checking location permission.',
      };
    }
  }

  /**
   * Show permission dialog with options to go to settings
   */
  static showPermissionDialog(
    title: string,
    message: string,
    onSettingsPress?: () => void
  ): void {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Settings',
          onPress: onSettingsPress || this.openAppSettings,
        },
      ]
    );
  }

  /**
   * Open app settings
   */
  static openAppSettings(): void {
    openSettings().catch(() => {
      console.warn('Cannot open settings');
    });
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Format distance for display
   */
  static formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)}km`;
    } else {
      return `${Math.round(distanceKm)}km`;
    }
  }

  /**
   * Check if location is within Hong Kong bounds
   */
  static isLocationInHongKong(latitude: number, longitude: number): boolean {
    // Hong Kong approximate bounds
    const HK_BOUNDS = {
      north: 22.5608,
      south: 22.1435,
      east: 114.4374,
      west: 113.8259,
    };

    return (
      latitude >= HK_BOUNDS.south &&
      latitude <= HK_BOUNDS.north &&
      longitude >= HK_BOUNDS.west &&
      longitude <= HK_BOUNDS.east
    );
  }

  /**
   * Get region name from coordinates (simplified)
   */
  static getRegionName(latitude: number, longitude: number): string {
    // Simplified region detection based on coordinates
    if (latitude >= 22.27 && latitude <= 22.29 && longitude >= 114.15 && longitude <= 114.17) {
      return 'Central';
    } else if (latitude >= 22.27 && latitude <= 22.29 && longitude >= 114.18 && longitude <= 114.20) {
      return 'Causeway Bay';
    } else if (latitude >= 22.29 && latitude <= 22.31 && longitude >= 114.16 && longitude <= 114.18) {
      return 'Tsim Sha Tsui';
    } else if (latitude >= 22.31 && latitude <= 22.33 && longitude >= 114.16 && longitude <= 114.18) {
      return 'Mong Kok';
    } else {
      return 'Hong Kong';
    }
  }

  private static handlePermissionResult(result: string): LocationPermissionResult {
    switch (result) {
      case RESULTS.GRANTED:
        return { granted: true, canAskAgain: true };
      case RESULTS.DENIED:
        return {
          granted: false,
          canAskAgain: true,
          message: 'Location permission denied.',
        };
      case RESULTS.BLOCKED:
        return {
          granted: false,
          canAskAgain: false,
          message: 'Location permission is blocked.',
        };
      default:
        return {
          granted: false,
          canAskAgain: true,
          message: 'Unknown permission result.',
        };
    }
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export default LocationUtils;
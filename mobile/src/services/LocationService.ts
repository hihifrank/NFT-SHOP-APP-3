import Geolocation from '../mocks/geolocation';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { request, PERMISSIONS, RESULTS } from '../mocks/permissions';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface LocationError {
  code: number;
  message: string;
}

export class LocationService {
  private static instance: LocationService;
  private watchId: number | null = null;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permissions based on platform
   */
  async requestLocationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: '位置權限',
            message: '此應用需要訪問您的位置來查找附近的店鋪',
            buttonNeutral: '稍後詢問',
            buttonNegative: '取消',
            buttonPositive: '確定',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        return result === RESULTS.GRANTED;
      }
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      const hasPermission = this.requestLocationPermission();
      
      if (!hasPermission) {
        reject(new Error('Location permission denied'));
        return;
      }

      Geolocation.getCurrentPosition(
        (position: any) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error: any) => {
          reject(this.handleLocationError(error));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }

  /**
   * Watch location changes
   */
  watchLocation(
    onLocationUpdate: (location: Location) => void,
    onError: (error: LocationError) => void
  ): void {
    this.requestLocationPermission().then((hasPermission) => {
      if (!hasPermission) {
        onError({ code: 1, message: 'Location permission denied' });
        return;
      }

      this.watchId = Geolocation.watchPosition(
        (position: any) => {
          onLocationUpdate({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error: any) => {
          onError(this.handleLocationError(error));
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 10, // Update every 10 meters
          interval: 5000, // Update every 5 seconds
        }
      );
    });
  }

  /**
   * Stop watching location
   */
  stopWatchingLocation(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(
    location1: Location,
    location2: Location
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(location2.latitude - location1.latitude);
    const dLon = this.toRadians(location2.longitude - location1.longitude);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(location1.latitude)) *
        Math.cos(this.toRadians(location2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Find nearby stores within specified radius
   */
  findNearbyStores(
    userLocation: Location,
    stores: Array<{ id: string; latitude: number; longitude: number; [key: string]: any }>,
    radiusKm: number = 5
  ): Array<{ distance: number; [key: string]: any }> {
    return stores
      .map((store) => ({
        ...store,
        distance: this.calculateDistance(userLocation, {
          latitude: store.latitude,
          longitude: store.longitude,
        }),
      }))
      .filter((store) => store.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private handleLocationError(error: any): LocationError {
    let message = 'Unknown location error';
    
    switch (error.code) {
      case 1:
        message = 'Location permission denied';
        break;
      case 2:
        message = 'Location unavailable';
        break;
      case 3:
        message = 'Location request timeout';
        break;
      default:
        message = error.message || 'Unknown location error';
    }

    return { code: error.code, message };
  }
}

export default LocationService.getInstance();
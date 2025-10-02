import LocationService from '../services/LocationService';
import MapService from '../services/MapService';
import { LocationUtils } from '../utils/locationUtils';

describe('Map and Location Services', () => {
  describe('LocationService', () => {
    it('should calculate distance correctly', () => {
      const location1 = { latitude: 22.3193, longitude: 114.1694 }; // Mong Kok
      const location2 = { latitude: 22.2819, longitude: 114.1577 }; // Central
      
      const distance = LocationService.calculateDistance(location1, location2);
      
      // Distance between Mong Kok and Central should be approximately 4-5 km
      expect(distance).toBeGreaterThan(3);
      expect(distance).toBeLessThan(6);
    });

    it('should find nearby stores within radius', () => {
      const userLocation = { latitude: 22.3193, longitude: 114.1694 };
      const stores = [
        { id: '1', latitude: 22.3200, longitude: 114.1700 }, // Very close
        { id: '2', latitude: 22.2819, longitude: 114.1577 }, // Central - further
        { id: '3', latitude: 22.3190, longitude: 114.1690 }, // Very close
      ];
      
      const nearbyStores = LocationService.findNearbyStores(userLocation, stores, 1); // 1km radius
      
      // Should find the close stores but not Central
      expect(nearbyStores.length).toBe(2);
      expect(nearbyStores[0].distance).toBeLessThan(1);
    });
  });

  describe('MapService', () => {
    it('should return Hong Kong region', () => {
      const region = MapService.getHongKongRegion();
      
      expect(region.latitude).toBe(22.3193);
      expect(region.longitude).toBe(114.1694);
      expect(region.latitudeDelta).toBe(0.1);
      expect(region.longitudeDelta).toBe(0.1);
    });

    it('should initialize successfully', async () => {
      await expect(MapService.initialize()).resolves.not.toThrow();
    });
  });

  describe('LocationUtils', () => {
    it('should format distance correctly', () => {
      expect(LocationUtils.formatDistance(0.5)).toBe('500m');
      expect(LocationUtils.formatDistance(1.2)).toBe('1.2km');
      expect(LocationUtils.formatDistance(15.7)).toBe('16km');
    });

    it('should detect Hong Kong location', () => {
      expect(LocationUtils.isLocationInHongKong(22.3193, 114.1694)).toBe(true);
      expect(LocationUtils.isLocationInHongKong(40.7128, -74.0060)).toBe(false); // New York
    });

    it('should get region name', () => {
      expect(LocationUtils.getRegionName(22.28, 114.16)).toBe('Central');
      expect(LocationUtils.getRegionName(22.32, 114.17)).toBe('Mong Kok');
      expect(LocationUtils.getRegionName(22.5, 114.5)).toBe('Hong Kong');
    });
  });
});
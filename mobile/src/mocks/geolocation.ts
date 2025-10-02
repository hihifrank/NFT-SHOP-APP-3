// Mock implementation for @react-native-community/geolocation

interface Position {
  coords: {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy: number;
    altitudeAccuracy?: number;
    heading?: number;
    speed?: number;
  };
  timestamp: number;
}

interface PositionError {
  code: number;
  message: string;
}

interface PositionOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  distanceFilter?: number;
  interval?: number;
}

class MockGeolocation {
  static getCurrentPosition(
    success: (position: Position) => void,
    error?: (error: PositionError) => void,
    options?: PositionOptions
  ): void {
    // Mock Hong Kong location
    setTimeout(() => {
      success({
        coords: {
          latitude: 22.3193,
          longitude: 114.1694,
          accuracy: 10,
        },
        timestamp: Date.now(),
      });
    }, 1000);
  }

  static watchPosition(
    success: (position: Position) => void,
    error?: (error: PositionError) => void,
    options?: PositionOptions
  ): number {
    const watchId = Math.random();
    
    // Mock position updates
    const interval = setInterval(() => {
      success({
        coords: {
          latitude: 22.3193 + (Math.random() - 0.5) * 0.01,
          longitude: 114.1694 + (Math.random() - 0.5) * 0.01,
          accuracy: 10,
        },
        timestamp: Date.now(),
      });
    }, 5000);

    // Store interval for cleanup
    (this as any)[`interval_${watchId}`] = interval;
    
    return watchId;
  }

  static clearWatch(watchId: number): void {
    const interval = (this as any)[`interval_${watchId}`];
    if (interval) {
      clearInterval(interval);
      delete (this as any)[`interval_${watchId}`];
    }
  }
}

export default MockGeolocation;
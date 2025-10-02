// Mock implementation for react-native-permissions

export const PERMISSIONS = {
  ANDROID: {
    ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
  },
  IOS: {
    LOCATION_WHEN_IN_USE: 'ios.permission.LOCATION_WHEN_IN_USE',
  },
};

export const RESULTS = {
  UNAVAILABLE: 'unavailable',
  DENIED: 'denied',
  LIMITED: 'limited',
  GRANTED: 'granted',
  BLOCKED: 'blocked',
};

export const request = async (permission: string): Promise<string> => {
  // Mock permission request - always grant for development
  return Promise.resolve(RESULTS.GRANTED);
};

export const check = async (permission: string): Promise<string> => {
  // Mock permission check - always granted for development
  return Promise.resolve(RESULTS.GRANTED);
};

export const openSettings = async (): Promise<void> => {
  console.log('Mock: Opening app settings');
  return Promise.resolve();
};
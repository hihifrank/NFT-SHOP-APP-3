// Basic Jest setup for React Native testing

// Mock react-native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  const MockMapView = (props: any) => React.createElement(View, props, props.children);
  const MockMarker = (props: any) => React.createElement(View, props, props.children);
  
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    PROVIDER_GOOGLE: 'google',
  };
}, { virtual: true });

// Mock geolocation
jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}), { virtual: true });

// Mock permissions
jest.mock('react-native-permissions', () => ({
  PERMISSIONS: {
    ANDROID: {
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
    },
    IOS: {
      LOCATION_WHEN_IN_USE: 'ios.permission.LOCATION_WHEN_IN_USE',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    BLOCKED: 'blocked',
  },
  request: jest.fn(),
  check: jest.fn(),
}), { virtual: true });

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  messaging: () => ({
    hasPermission: jest.fn(() => Promise.resolve(true)),
    subscribeToTopic: jest.fn(),
    unsubscribeFromTopic: jest.fn(),
    requestPermission: jest.fn(() => Promise.resolve(true)),
    getToken: jest.fn(() => Promise.resolve('fcm-token')),
  }),
}), { virtual: true });

jest.mock('@react-native-firebase/messaging', () => ({
  messaging: () => ({
    hasPermission: jest.fn(() => Promise.resolve(true)),
    subscribeToTopic: jest.fn(),
    unsubscribeFromTopic: jest.fn(),
    requestPermission: jest.fn(() => Promise.resolve(true)),
    getToken: jest.fn(() => Promise.resolve('fcm-token')),
    onMessage: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
  }),
}), { virtual: true });

// Mock Web3 and wallet connections
jest.mock('web3', () => {
  return jest.fn().mockImplementation(() => ({
    eth: {
      getAccounts: jest.fn(() => Promise.resolve(['0x123'])),
      getBalance: jest.fn(() => Promise.resolve('1000000000000000000')),
      sendTransaction: jest.fn(() => Promise.resolve({ transactionHash: '0xabc' })),
    },
  }));
}, { virtual: true });

jest.mock('@react-native-metamask/sdk', () => ({
  MetaMaskSDK: jest.fn().mockImplementation(() => ({
    connect: jest.fn(() => Promise.resolve(['0x123'])),
    disconnect: jest.fn(),
    isConnected: jest.fn(() => true),
  })),
}), { virtual: true });

// Mock other potentially missing modules
jest.mock('react-native-get-random-values', () => ({}), { virtual: true });
jest.mock('react-native-url-polyfill', () => ({}), { virtual: true });
jest.mock('ethers', () => ({
  ethers: {
    providers: {
      Web3Provider: jest.fn(),
    },
    Contract: jest.fn(),
    utils: {
      parseEther: jest.fn(),
      formatEther: jest.fn(),
    },
  },
}), { virtual: true });

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en',
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}), { virtual: true });

// Global test timeout
jest.setTimeout(10000);
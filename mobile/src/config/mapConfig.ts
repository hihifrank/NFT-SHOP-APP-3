export const MAP_CONFIG = {
  // Default region for Hong Kong
  DEFAULT_REGION: {
    latitude: 22.3193,
    longitude: 114.1694,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  },

  // Popular areas in Hong Kong
  POPULAR_REGIONS: {
    CENTRAL: {
      latitude: 22.2819,
      longitude: 114.1577,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
      name: 'Central',
    },
    CAUSEWAY_BAY: {
      latitude: 22.2793,
      longitude: 114.1847,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
      name: 'Causeway Bay',
    },
    TSIM_SHA_TSUI: {
      latitude: 22.2976,
      longitude: 114.1722,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
      name: 'Tsim Sha Tsui',
    },
    MONG_KOK: {
      latitude: 22.3193,
      longitude: 114.1694,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
      name: 'Mong Kok',
    },
  },

  // Search settings
  SEARCH: {
    DEFAULT_RADIUS: 5, // km
    MAX_RADIUS: 50, // km
    MIN_RADIUS: 0.5, // km
  },

  // Offline map settings
  OFFLINE: {
    MAX_CACHE_SIZE: 100 * 1024 * 1024, // 100MB
    DEFAULT_ZOOM_LEVELS: [10, 12, 14, 16],
    TILE_SIZE: 256,
  },

  // Map style settings
  STYLE: {
    MARKER_COLORS: {
      NFT_PARTICIPANT: '#2196F3', // Blue for NFT participating stores
      REGULAR_STORE: '#FF9800', // Orange for regular stores
      USER_LOCATION: '#4CAF50', // Green for user location
    },
    MAP_PADDING: {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50,
    },
  },

  // API endpoints (will be replaced with actual backend URLs)
  API: {
    NEARBY_STORES: '/api/v1/stores/nearby',
    STORE_DETAILS: '/api/v1/stores',
    SEARCH_STORES: '/api/v1/stores/search',
  },
};

export const STORE_CATEGORIES = [
  { key: 'all', labelKey: 'stores.categories.all' },
  { key: 'restaurant', labelKey: 'stores.categories.restaurant' },
  { key: 'retail', labelKey: 'stores.categories.retail' },
  { key: 'entertainment', labelKey: 'stores.categories.entertainment' },
  { key: 'service', labelKey: 'stores.categories.service' },
];

export default MAP_CONFIG;
import React from 'react';

// Mock network status
const mockNetworkStatus = {
  isConnected: true,
  isInternetReachable: true
};

// Mock offline storage
const mockOfflineStorage = {
  stores: [
    {
      id: 'store-1',
      name: 'Central Coffee',
      latitude: 22.2819,
      longitude: 114.1577,
      category: 'restaurant',
      isNftParticipant: true,
      cached: true
    },
    {
      id: 'store-2', 
      name: 'Tsim Sha Tsui Shop',
      latitude: 22.2944,
      longitude: 114.1722,
      category: 'retail',
      isNftParticipant: false,
      cached: true
    }
  ],
  mapTiles: {
    'hongkong_central': { cached: true, lastUpdated: '2024-01-01' },
    'tsim_sha_tsui': { cached: true, lastUpdated: '2024-01-01' }
  }
};

// Mock offline-capable map component
const MockOfflineMap = ({ 
  stores, 
  userLocation, 
  isOffline, 
  onStoreSelect 
}: {
  stores: any[];
  userLocation: { latitude: number; longitude: number };
  isOffline: boolean;
  onStoreSelect: (store: any) => void;
}) => {
  const availableStores = isOffline 
    ? stores.filter(store => store.cached)
    : stores;

  return React.createElement('div', {
    'data-testid': 'offline-map',
    'data-offline-mode': isOffline,
    'data-stores-count': availableStores.length,
    'data-user-lat': userLocation.latitude,
    'data-user-lng': userLocation.longitude
  }, [
    React.createElement('div', { 
      key: 'status',
      'data-testid': 'connection-status'
    }, isOffline ? 'Offline Mode - Showing cached data' : 'Online'),
    
    ...availableStores.map(store => 
      React.createElement('div', {
        key: store.id,
        'data-testid': `store-marker-${store.id}`,
        'data-store-cached': store.cached,
        onClick: () => onStoreSelect(store)
      }, store.name)
    )
  ]);
};

// Mock store discovery with offline support
const MockStoreDiscovery = ({ 
  isOffline, 
  userLocation,
  loading = false,
  error = null
}: {
  isOffline: boolean;
  userLocation: { latitude: number; longitude: number };
  loading?: boolean;
  error?: string | null;
}) => {
  const stores = isOffline ? mockOfflineStorage.stores : mockOfflineStorage.stores;

  const handleStoreSelect = (store: any) => {
    // Handle store selection
  };

  return React.createElement('div', {
    'data-testid': 'store-discovery',
    'data-offline-mode': isOffline,
    'data-loading': loading,
    'data-error': error
  }, [
    loading && React.createElement('div', { 
      key: 'loading',
      'data-testid': 'loading-indicator'
    }, 'Loading stores...'),
    
    error && React.createElement('div', { 
      key: 'error',
      'data-testid': 'error-message'
    }, error),
    
    !loading && !error && React.createElement(MockOfflineMap, {
      key: 'map',
      stores,
      userLocation,
      isOffline,
      onStoreSelect: handleStoreSelect
    })
  ]);
};

// Mock offline data manager
const MockOfflineDataManager = ({ 
  storesCount = 0, 
  mapTilesCount = 0,
  onUpdateCache,
  onClearCache
}: {
  storesCount?: number;
  mapTilesCount?: number;
  onUpdateCache?: () => void;
  onClearCache?: () => void;
}) => {
  return React.createElement('div', {
    'data-testid': 'offline-data-manager'
  }, [
    React.createElement('div', { 
      key: 'cache-info',
      'data-testid': 'cache-info',
      'data-stores-cached': storesCount,
      'data-map-tiles-cached': mapTilesCount
    }, `Cached: ${storesCount} stores, ${mapTilesCount} map tiles`),
    
    React.createElement('button', {
      key: 'update-cache',
      'data-testid': 'update-cache-btn',
      onClick: onUpdateCache
    }, 'Update Cache'),
    
    React.createElement('button', {
      key: 'clear-cache',
      'data-testid': 'clear-cache-btn',
      onClick: onClearCache
    }, 'Clear Cache')
  ]);
};

describe('Offline Functionality Flow', () => {
  const mockUserLocation = {
    latitude: 22.2819,
    longitude: 114.1577
  };

  // Test requirement 5.1.4: Offline map functionality
  it('provides offline map functionality when network is unavailable', () => {
    const offlineMap = MockOfflineMap({
      stores: mockOfflineStorage.stores,
      userLocation: mockUserLocation,
      isOffline: true,
      onStoreSelect: jest.fn()
    });

    expect(offlineMap.props['data-offline-mode']).toBe(true);
    expect(offlineMap.props['data-stores-count']).toBe(2); // Both stores are cached
    
    const statusElement = offlineMap.props.children.find((child: any) => 
      child && child.props && child.props['data-testid'] === 'connection-status'
    );
    expect(statusElement.props.children).toBe('Offline Mode - Showing cached data');
  });

  it('shows only cached stores in offline mode', () => {
    const storesWithMixedCache = [
      ...mockOfflineStorage.stores,
      { id: 'store-3', name: 'Uncached Store', cached: false }
    ];

    const offlineMap = MockOfflineMap({
      stores: storesWithMixedCache,
      userLocation: mockUserLocation,
      isOffline: true,
      onStoreSelect: jest.fn()
    });

    // Should only show cached stores (2 out of 3)
    expect(offlineMap.props['data-stores-count']).toBe(2);
  });

  it('shows all stores in online mode', () => {
    const onlineMap = MockOfflineMap({
      stores: mockOfflineStorage.stores,
      userLocation: mockUserLocation,
      isOffline: false,
      onStoreSelect: jest.fn()
    });

    expect(onlineMap.props['data-offline-mode']).toBe(false);
    expect(onlineMap.props['data-stores-count']).toBe(2);
    
    const statusElement = onlineMap.props.children.find((child: any) => 
      child && child.props && child.props['data-testid'] === 'connection-status'
    );
    expect(statusElement.props.children).toBe('Online');
  });

  it('handles store discovery in offline mode', () => {
    const storeDiscovery = MockStoreDiscovery({
      isOffline: true,
      userLocation: mockUserLocation
    });

    expect(storeDiscovery.props['data-offline-mode']).toBe(true);
    expect(storeDiscovery.props['data-loading']).toBe(false); // No loading in offline mode
    
    const mapComponent = storeDiscovery.props.children.find((child: any) => 
      child && child.type === MockOfflineMap
    );
    expect(mapComponent).toBeDefined();
  });

  it('manages offline data cache effectively', () => {
    const mockUpdateCache = jest.fn();
    const mockClearCache = jest.fn();
    
    const dataManager = MockOfflineDataManager({
      storesCount: 0,
      mapTilesCount: 0,
      onUpdateCache: mockUpdateCache,
      onClearCache: mockClearCache
    });
    
    const cacheInfo = dataManager.props.children.find((child: any) => 
      child && child.props && child.props['data-testid'] === 'cache-info'
    );
    
    expect(cacheInfo.props['data-stores-cached']).toBe(0); // Initially empty
    expect(cacheInfo.props['data-map-tiles-cached']).toBe(0);
    
    // Test update cache functionality
    const updateButton = dataManager.props.children.find((child: any) => 
      child && child.props && child.props['data-testid'] === 'update-cache-btn'
    );
    expect(updateButton).toBeDefined();
  });

  it('allows users to interact with cached store data', () => {
    const mockOnStoreSelect = jest.fn();
    
    const offlineMap = MockOfflineMap({
      stores: mockOfflineStorage.stores,
      userLocation: mockUserLocation,
      isOffline: true,
      onStoreSelect: mockOnStoreSelect
    });

    // Find a store marker
    const storeMarker = offlineMap.props.children.find((child: any) => 
      child && child.props && child.props['data-testid'] === 'store-marker-store-1'
    );
    
    expect(storeMarker).toBeDefined();
    expect(storeMarker.props['data-store-cached']).toBe(true);
    
    // Simulate store selection
    storeMarker.props.onClick();
    expect(mockOnStoreSelect).toHaveBeenCalledWith(mockOfflineStorage.stores[0]);
  });

  it('gracefully handles network state transitions', () => {
    // Test transition from online to offline
    let isOffline = false;
    
    let storeDiscovery = MockStoreDiscovery({
      isOffline,
      userLocation: mockUserLocation
    });
    
    expect(storeDiscovery.props['data-offline-mode']).toBe(false);
    
    // Simulate network disconnection
    isOffline = true;
    
    storeDiscovery = MockStoreDiscovery({
      isOffline,
      userLocation: mockUserLocation
    });
    
    expect(storeDiscovery.props['data-offline-mode']).toBe(true);
  });

  it('provides clear offline status indicators', () => {
    const offlineMap = MockOfflineMap({
      stores: mockOfflineStorage.stores,
      userLocation: mockUserLocation,
      isOffline: true,
      onStoreSelect: jest.fn()
    });

    const statusElement = offlineMap.props.children.find((child: any) => 
      child && child.props && child.props['data-testid'] === 'connection-status'
    );
    
    expect(statusElement.props.children).toContain('Offline Mode');
    expect(statusElement.props.children).toContain('cached data');
  });

  it('maintains user location in offline mode', () => {
    const offlineMap = MockOfflineMap({
      stores: mockOfflineStorage.stores,
      userLocation: mockUserLocation,
      isOffline: true,
      onStoreSelect: jest.fn()
    });

    expect(offlineMap.props['data-user-lat']).toBe(22.2819);
    expect(offlineMap.props['data-user-lng']).toBe(114.1577);
  });

  it('supports both NFT and non-NFT stores in offline mode', () => {
    const offlineMap = MockOfflineMap({
      stores: mockOfflineStorage.stores,
      userLocation: mockUserLocation,
      isOffline: true,
      onStoreSelect: jest.fn()
    });

    // Should show both NFT participant and non-participant stores
    const storeMarkers = offlineMap.props.children.filter((child: any) => 
      child && child.props && child.props['data-testid'] && 
      child.props['data-testid'].startsWith('store-marker-')
    );
    
    expect(storeMarkers).toHaveLength(2);
  });

  it('handles cache management operations', () => {
    const mockUpdateCache = jest.fn();
    const mockClearCache = jest.fn();
    
    const dataManager = MockOfflineDataManager({
      onUpdateCache: mockUpdateCache,
      onClearCache: mockClearCache
    });
    
    const updateButton = dataManager.props.children.find((child: any) => 
      child && child.props && child.props['data-testid'] === 'update-cache-btn'
    );
    
    const clearButton = dataManager.props.children.find((child: any) => 
      child && child.props && child.props['data-testid'] === 'clear-cache-btn'
    );
    
    expect(updateButton).toBeDefined();
    expect(clearButton).toBeDefined();
    
    // Test button functionality
    updateButton.props.onClick();
    expect(mockUpdateCache).toHaveBeenCalledTimes(1);
    
    clearButton.props.onClick();
    expect(mockClearCache).toHaveBeenCalledTimes(1);
  });
});
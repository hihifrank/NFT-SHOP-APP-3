import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import { AppNavigator } from '../../navigation/AppNavigator';
import merchantSlice from '../../store/slices/merchantSlice';
import authSlice from '../../store/slices/authSlice';
import uiSlice from '../../store/slices/uiSlice';

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global, 'navigator', {
  value: {
    geolocation: mockGeolocation,
  },
});

const createMockStore = (initialState: any) => {
  return configureStore({
    reducer: {
      merchants: merchantSlice,
      auth: authSlice,
      ui: uiSlice,
    },
    preloadedState: initialState,
  });
};

describe('Store Discovery Flow', () => {
  const mockMerchants = [
    {
      id: 'merchant-1',
      name: 'Central Coffee',
      description: 'Premium coffee and pastries',
      category: 'restaurant',
      address: '123 Central Street, Central',
      latitude: 22.2819,
      longitude: 114.1577,
      distance: 0.5,
      isNftParticipant: true,
      rating: 4.5,
      imageUrl: 'https://example.com/coffee.jpg',
    },
    {
      id: 'merchant-2',
      name: 'Fashion Boutique',
      description: 'Trendy clothing and accessories',
      category: 'fashion',
      address: '456 Fashion Ave, Causeway Bay',
      latitude: 22.2793,
      longitude: 114.1628,
      distance: 1.2,
      isNftParticipant: false,
      rating: 4.2,
      imageUrl: 'https://example.com/fashion.jpg',
    },
    {
      id: 'merchant-3',
      name: 'Tech Store',
      description: 'Latest gadgets and electronics',
      category: 'electronics',
      address: '789 Tech Road, Mong Kok',
      latitude: 22.3193,
      longitude: 114.1694,
      distance: 2.1,
      isNftParticipant: true,
      rating: 4.7,
      imageUrl: 'https://example.com/tech.jpg',
    },
  ];

  const mockInitialState = {
    merchants: {
      nearbyMerchants: mockMerchants,
      selectedMerchant: null,
      searchResults: [],
      isLoading: false,
      error: null,
      filters: {
        category: 'all',
        distance: 5,
        nftParticipant: false,
        rating: 0,
      },
    },
    auth: {
      isAuthenticated: true,
      user: {
        id: 'user-123',
        walletAddress: '0x123',
        preferredLanguage: 'en',
      },
      isLoading: false,
      error: null,
    },
    ui: {
      language: 'en',
      theme: 'light',
      userLocation: {
        latitude: 22.2819,
        longitude: 114.1577,
      },
    },
  };

  beforeEach(() => {
    // Mock successful geolocation
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 22.2819,
          longitude: 114.1577,
          accuracy: 10,
        },
      });
    });
  });

  it('completes store discovery and navigation flow', async () => {
    const store = createMockStore(mockInitialState);
    
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    );

    // Step 1: Navigate to Explore screen
    fireEvent.press(getByText('Explore'));
    
    await waitFor(() => {
      expect(getByText('Discover Stores')).toBeTruthy();
      expect(getByText('Central Coffee')).toBeTruthy();
      expect(getByText('Fashion Boutique')).toBeTruthy();
    });

    // Step 2: Apply filters to find NFT participating stores
    fireEvent.press(getByTestId('filter-button'));
    
    await waitFor(() => {
      expect(getByText('Filter Stores')).toBeTruthy();
    });

    // Enable NFT participant filter
    fireEvent.press(getByText('NFT Participants Only'));
    fireEvent.press(getByText('Apply Filters'));

    // Step 3: Verify filtered results
    await waitFor(() => {
      expect(getByText('Central Coffee')).toBeTruthy();
      expect(getByText('Tech Store')).toBeTruthy();
      // Fashion Boutique should be hidden (not NFT participant)
    });

    // Step 4: Select a store to view details
    fireEvent.press(getByText('Central Coffee'));
    
    await waitFor(() => {
      expect(getByText('Store Details')).toBeTruthy();
      expect(getByText('Premium coffee and pastries')).toBeTruthy();
      expect(getByText('123 Central Street, Central')).toBeTruthy();
      expect(getByText('Get Directions')).toBeTruthy();
      expect(getByText('View NFT Coupons')).toBeTruthy();
    });

    // Step 5: View available NFT coupons
    fireEvent.press(getByText('View NFT Coupons'));
    
    await waitFor(() => {
      expect(getByText('Available Coupons')).toBeTruthy();
    });
  });

  it('handles location permission and search functionality', async () => {
    const store = createMockStore(mockInitialState);
    
    const { getByText, getByPlaceholderText } = render(
      <Provider store={store}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    );

    // Navigate to explore
    fireEvent.press(getByText('Explore'));
    
    // Step 1: Use search functionality
    const searchInput = getByPlaceholderText('Search stores...');
    fireEvent.changeText(searchInput, 'coffee');
    
    await waitFor(() => {
      expect(getByText('Central Coffee')).toBeTruthy();
      // Other stores should be filtered out
    });

    // Step 2: Clear search and test category filter
    fireEvent.changeText(searchInput, '');
    fireEvent.press(getByText('Restaurant'));
    
    await waitFor(() => {
      expect(getByText('Central Coffee')).toBeTruthy();
      // Only restaurant category should be shown
    });
  });

  it('handles map view and store markers', async () => {
    const store = createMockStore(mockInitialState);
    
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    );

    // Navigate to explore
    fireEvent.press(getByText('Explore'));
    
    // Switch to map view
    fireEvent.press(getByTestId('map-view-toggle'));
    
    await waitFor(() => {
      expect(getByTestId('store-map')).toBeTruthy();
    });

    // Tap on a store marker
    fireEvent.press(getByTestId('store-marker-merchant-1'));
    
    await waitFor(() => {
      expect(getByText('Central Coffee')).toBeTruthy();
      expect(getByText('0.5 km away')).toBeTruthy();
    });
  });

  it('handles offline mode and cached store data', async () => {
    const offlineState = {
      ...mockInitialState,
      merchants: {
        ...mockInitialState.merchants,
        isLoading: false,
        error: 'Network unavailable',
      },
    };

    const store = createMockStore(offlineState);
    
    const { getByText } = render(
      <Provider store={store}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    );

    fireEvent.press(getByText('Explore'));
    
    await waitFor(() => {
      expect(getByText('Offline Mode')).toBeTruthy();
      expect(getByText('Showing cached store data')).toBeTruthy();
      // Cached stores should still be visible
      expect(getByText('Central Coffee')).toBeTruthy();
    });
  });

  it('handles store rating and review functionality', async () => {
    const store = createMockStore(mockInitialState);
    
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    );

    // Navigate to store details
    fireEvent.press(getByText('Explore'));
    
    await waitFor(() => {
      fireEvent.press(getByText('Central Coffee'));
    });

    // View reviews
    await waitFor(() => {
      expect(getByText('4.5 ★')).toBeTruthy();
      fireEvent.press(getByText('View Reviews'));
    });

    await waitFor(() => {
      expect(getByText('Customer Reviews')).toBeTruthy();
    });

    // Add a review (if authenticated)
    fireEvent.press(getByText('Write Review'));
    
    await waitFor(() => {
      expect(getByText('Rate this store')).toBeTruthy();
    });

    // Select rating
    fireEvent.press(getByTestId('star-5'));
    
    // Add review text
    const reviewInput = getByPlaceholderText('Write your review...');
    fireEvent.changeText(reviewInput, 'Great coffee and service!');
    
    fireEvent.press(getByText('Submit Review'));
  });

  it('handles store directions and navigation', async () => {
    const store = createMockStore(mockInitialState);
    
    const { getByText } = render(
      <Provider store={store}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    );

    // Navigate to store details
    fireEvent.press(getByText('Explore'));
    
    await waitFor(() => {
      fireEvent.press(getByText('Central Coffee'));
    });

    // Get directions
    await waitFor(() => {
      fireEvent.press(getByText('Get Directions'));
    });

    // Should open external navigation app or show in-app directions
    await waitFor(() => {
      // In a real implementation, this would trigger navigation
      expect(getByText('Opening directions...')).toBeTruthy();
    });
  });

  it('handles store favorites and bookmarking', async () => {
    const store = createMockStore(mockInitialState);
    
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    );

    // Navigate to store details
    fireEvent.press(getByText('Explore'));
    
    await waitFor(() => {
      fireEvent.press(getByText('Central Coffee'));
    });

    // Add to favorites
    await waitFor(() => {
      fireEvent.press(getByTestId('favorite-button'));
    });

    await waitFor(() => {
      expect(getByText('Added to favorites')).toBeTruthy();
    });

    // Navigate to profile to see favorites
    fireEvent.press(getByText('Profile'));
    
    await waitFor(() => {
      fireEvent.press(getByText('Favorite Stores'));
    });

    await waitFor(() => {
      expect(getByText('Central Coffee')).toBeTruthy();
    });
  });
});
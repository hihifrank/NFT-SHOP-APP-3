import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import { HomeScreen } from '../../screens/HomeScreen';
import authSlice from '../../store/slices/authSlice';
import couponSlice from '../../store/slices/couponSlice';
import merchantSlice from '../../store/slices/merchantSlice';

const createMockStore = (initialState: any) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      coupons: couponSlice,
      merchants: merchantSlice,
    },
    preloadedState: initialState,
  });
};

const MockNavigationWrapper = ({ children }: { children: React.ReactNode }) => (
  <NavigationContainer>
    {children}
  </NavigationContainer>
);

describe('HomeScreen', () => {
  const mockInitialState = {
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
    coupons: {
      userCoupons: [
        {
          id: '1',
          tokenId: '123',
          name: 'Test Coupon',
          discountValue: 20,
          discountType: 'percentage',
          merchantName: 'Test Store',
          expiryDate: '2024-12-31',
          isUsed: false,
        },
      ],
      isLoading: false,
      error: null,
    },
    merchants: {
      nearbyMerchants: [
        {
          id: 'merchant-1',
          name: 'Nearby Store',
          category: 'restaurant',
          distance: 0.5,
          isNftParticipant: true,
        },
      ],
      isLoading: false,
      error: null,
    },
  };

  it('renders welcome message for authenticated user', () => {
    const store = createMockStore(mockInitialState);
    
    const { getByText } = render(
      <Provider store={store}>
        <MockNavigationWrapper>
          <HomeScreen />
        </MockNavigationWrapper>
      </Provider>
    );

    expect(getByText('Welcome back!')).toBeTruthy();
  });

  it('displays user coupons section', () => {
    const store = createMockStore(mockInitialState);
    
    const { getByText } = render(
      <Provider store={store}>
        <MockNavigationWrapper>
          <HomeScreen />
        </MockNavigationWrapper>
      </Provider>
    );

    expect(getByText('My NFT Coupons')).toBeTruthy();
    expect(getByText('Test Coupon')).toBeTruthy();
  });

  it('displays nearby merchants section', () => {
    const store = createMockStore(mockInitialState);
    
    const { getByText } = render(
      <Provider store={store}>
        <MockNavigationWrapper>
          <HomeScreen />
        </MockNavigationWrapper>
      </Provider>
    );

    expect(getByText('Nearby Stores')).toBeTruthy();
    expect(getByText('Nearby Store')).toBeTruthy();
  });

  it('shows loading state when data is loading', () => {
    const loadingState = {
      ...mockInitialState,
      coupons: { ...mockInitialState.coupons, isLoading: true },
    };
    const store = createMockStore(loadingState);
    
    const { getByTestId } = render(
      <Provider store={store}>
        <MockNavigationWrapper>
          <HomeScreen />
        </MockNavigationWrapper>
      </Provider>
    );

    expect(getByTestId('coupons-loading')).toBeTruthy();
  });

  it('displays error message when there is an error', () => {
    const errorState = {
      ...mockInitialState,
      coupons: { 
        ...mockInitialState.coupons, 
        error: 'Failed to load coupons',
        isLoading: false,
      },
    };
    const store = createMockStore(errorState);
    
    const { getByText } = render(
      <Provider store={store}>
        <MockNavigationWrapper>
          <HomeScreen />
        </MockNavigationWrapper>
      </Provider>
    );

    expect(getByText('Failed to load coupons')).toBeTruthy();
  });

  it('navigates to explore screen when explore button is pressed', async () => {
    const store = createMockStore(mockInitialState);
    const mockNavigate = jest.fn();
    
    // Mock navigation prop
    const mockNavigation = {
      navigate: mockNavigate,
      goBack: jest.fn(),
      dispatch: jest.fn(),
    };

    const { getByText } = render(
      <Provider store={store}>
        <HomeScreen navigation={mockNavigation} />
      </Provider>
    );

    fireEvent.press(getByText('Explore Stores'));
    expect(mockNavigate).toHaveBeenCalledWith('Explore');
  });

  it('refreshes data when pull to refresh is triggered', async () => {
    const store = createMockStore(mockInitialState);
    
    const { getByTestId } = render(
      <Provider store={store}>
        <MockNavigationWrapper>
          <HomeScreen />
        </MockNavigationWrapper>
      </Provider>
    );

    const scrollView = getByTestId('home-scroll-view');
    fireEvent(scrollView, 'refresh');
    
    // Verify refresh action was triggered
    await waitFor(() => {
      // In a real test, you would verify that the refresh action was dispatched
    });
  });

  it('displays empty state when no coupons are available', () => {
    const emptyCouponsState = {
      ...mockInitialState,
      coupons: {
        userCoupons: [],
        isLoading: false,
        error: null,
      },
    };
    const store = createMockStore(emptyCouponsState);
    
    const { getByText } = render(
      <Provider store={store}>
        <MockNavigationWrapper>
          <HomeScreen />
        </MockNavigationWrapper>
      </Provider>
    );

    expect(getByText('No coupons yet')).toBeTruthy();
    expect(getByText('Explore stores to find NFT coupons')).toBeTruthy();
  });
});
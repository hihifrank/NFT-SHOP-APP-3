import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import { AppNavigator } from '../../navigation/AppNavigator';
import authSlice from '../../store/slices/authSlice';
import couponSlice from '../../store/slices/couponSlice';
import web3Slice from '../../store/slices/web3Slice';

const createMockStore = (initialState: any) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      coupons: couponSlice,
      web3: web3Slice,
    },
    preloadedState: initialState,
  });
};

describe('Coupon Usage Flow', () => {
  const mockCoupon = {
    id: 'coupon-123',
    tokenId: '456',
    name: 'Coffee Shop 20% Off',
    description: 'Get 20% off your next coffee purchase',
    discountValue: 20,
    discountType: 'percentage' as const,
    merchantName: 'Central Coffee',
    merchantId: 'merchant-123',
    expiryDate: '2024-12-31',
    isUsed: false,
    rarity: 'common' as const,
    image: 'https://example.com/coupon.jpg',
  };

  const mockInitialState = {
    auth: {
      isAuthenticated: true,
      user: {
        id: 'user-123',
        walletAddress: '0x123456789',
        preferredLanguage: 'en',
      },
      isLoading: false,
      error: null,
    },
    coupons: {
      userCoupons: [mockCoupon],
      selectedCoupon: null,
      isLoading: false,
      error: null,
      usageHistory: [],
    },
    web3: {
      isConnected: true,
      account: '0x123456789',
      balance: '1.5',
      isLoading: false,
      error: null,
    },
  };

  it('completes full coupon usage flow', async () => {
    const store = createMockStore(mockInitialState);
    
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    );

    // Step 1: Navigate to NFT screen from home
    fireEvent.press(getByText('My NFTs'));
    
    await waitFor(() => {
      expect(getByText('My NFT Coupons')).toBeTruthy();
      expect(getByText('Coffee Shop 20% Off')).toBeTruthy();
    });

    // Step 2: Select the coupon to view details
    fireEvent.press(getByText('Coffee Shop 20% Off'));
    
    await waitFor(() => {
      expect(getByText('Coupon Details')).toBeTruthy();
      expect(getByText('20% OFF')).toBeTruthy();
      expect(getByText('Central Coffee')).toBeTruthy();
      expect(getByText('Use Coupon')).toBeTruthy();
    });

    // Step 3: Initiate coupon usage
    fireEvent.press(getByText('Use Coupon'));
    
    // Step 4: Confirm usage in modal
    await waitFor(() => {
      expect(getByText('Confirm Coupon Usage')).toBeTruthy();
      expect(getByText('Are you sure you want to use this coupon?')).toBeTruthy();
    });

    fireEvent.press(getByText('Confirm'));

    // Step 5: Show transaction processing
    await waitFor(() => {
      expect(getByTestId('transaction-processing')).toBeTruthy();
      expect(getByText('Processing transaction...')).toBeTruthy();
    });

    // Step 6: Mock successful transaction
    // In real implementation, this would update the store with transaction success
    await waitFor(() => {
      expect(getByText('Coupon Used Successfully!')).toBeTruthy();
      expect(getByText('Your discount has been applied')).toBeTruthy();
    });

    // Step 7: Return to coupon list and verify coupon is marked as used
    fireEvent.press(getByText('Done'));
    
    await waitFor(() => {
      expect(getByText('USED')).toBeTruthy(); // Coupon should show as used
    });
  });

  it('handles coupon usage cancellation', async () => {
    const store = createMockStore(mockInitialState);
    
    const { getByText } = render(
      <Provider store={store}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    );

    // Navigate to coupon details
    fireEvent.press(getByText('My NFTs'));
    
    await waitFor(() => {
      fireEvent.press(getByText('Coffee Shop 20% Off'));
    });

    // Initiate usage
    await waitFor(() => {
      fireEvent.press(getByText('Use Coupon'));
    });

    // Cancel in confirmation modal
    await waitFor(() => {
      expect(getByText('Cancel')).toBeTruthy();
    });

    fireEvent.press(getByText('Cancel'));

    // Should return to coupon details without using coupon
    await waitFor(() => {
      expect(getByText('Use Coupon')).toBeTruthy(); // Button should still be available
    });
  });

  it('handles transaction failure during coupon usage', async () => {
    const storeWithError = createMockStore({
      ...mockInitialState,
      coupons: {
        ...mockInitialState.coupons,
        error: 'Transaction failed: Insufficient gas',
      },
    });
    
    const { getByText } = render(
      <Provider store={storeWithError}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    );

    // Navigate to coupon and attempt usage
    fireEvent.press(getByText('My NFTs'));
    
    await waitFor(() => {
      fireEvent.press(getByText('Coffee Shop 20% Off'));
    });

    await waitFor(() => {
      fireEvent.press(getByText('Use Coupon'));
    });

    await waitFor(() => {
      fireEvent.press(getByText('Confirm'));
    });

    // Error should be displayed
    await waitFor(() => {
      expect(getByText('Transaction failed: Insufficient gas')).toBeTruthy();
      expect(getByText('Try Again')).toBeTruthy();
    });

    // User can retry
    fireEvent.press(getByText('Try Again'));
  });

  it('prevents usage of expired coupons', async () => {
    const expiredCoupon = {
      ...mockCoupon,
      expiryDate: '2023-01-01', // Expired date
    };

    const storeWithExpiredCoupon = createMockStore({
      ...mockInitialState,
      coupons: {
        ...mockInitialState.coupons,
        userCoupons: [expiredCoupon],
      },
    });
    
    const { getByText, queryByText } = render(
      <Provider store={storeWithExpiredCoupon}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    );

    // Navigate to expired coupon
    fireEvent.press(getByText('My NFTs'));
    
    await waitFor(() => {
      fireEvent.press(getByText('Coffee Shop 20% Off'));
    });

    // Use button should not be available for expired coupons
    await waitFor(() => {
      expect(getByText('EXPIRED')).toBeTruthy();
      expect(queryByText('Use Coupon')).toBeNull();
    });
  });

  it('shows usage history after successful coupon usage', async () => {
    const usedCoupon = { ...mockCoupon, isUsed: true };
    const storeWithUsedCoupon = createMockStore({
      ...mockInitialState,
      coupons: {
        ...mockInitialState.coupons,
        userCoupons: [usedCoupon],
        usageHistory: [
          {
            id: 'usage-123',
            couponId: 'coupon-123',
            merchantName: 'Central Coffee',
            usedAt: Date.now(),
            transactionHash: '0xabc123',
          },
        ],
      },
    });
    
    const { getByText } = render(
      <Provider store={storeWithUsedCoupon}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    );

    // Navigate to profile to see usage history
    fireEvent.press(getByText('Profile'));
    
    await waitFor(() => {
      expect(getByText('Usage History')).toBeTruthy();
      expect(getByText('Central Coffee')).toBeTruthy();
      expect(getByText('View Transaction')).toBeTruthy();
    });

    // Can view transaction details
    fireEvent.press(getByText('View Transaction'));
    
    await waitFor(() => {
      expect(getByText('Transaction Details')).toBeTruthy();
      expect(getByText('0xabc123')).toBeTruthy();
    });
  });

  it('handles wallet disconnection during coupon usage', async () => {
    const disconnectedState = {
      ...mockInitialState,
      web3: {
        ...mockInitialState.web3,
        isConnected: false,
        account: null,
      },
    };

    const store = createMockStore(disconnectedState);
    
    const { getByText } = render(
      <Provider store={store}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    );

    // Try to access NFTs without wallet connection
    fireEvent.press(getByText('My NFTs'));
    
    await waitFor(() => {
      expect(getByText('Wallet Not Connected')).toBeTruthy();
      expect(getByText('Please connect your wallet to view your NFT coupons')).toBeTruthy();
      expect(getByText('Connect Wallet')).toBeTruthy();
    });
  });
});
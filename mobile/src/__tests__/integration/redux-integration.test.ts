import { configureStore } from '@reduxjs/toolkit';
import authSlice, { loginUser, logoutUser } from '../../store/slices/authSlice';
import couponSlice, { fetchUserCoupons, useCoupon } from '../../store/slices/couponSlice';
import merchantSlice, { fetchNearbyMerchants, searchMerchants } from '../../store/slices/merchantSlice';
import web3Slice, { connectWallet, disconnectWallet } from '../../store/slices/web3Slice';

describe('Redux Store Integration', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authSlice,
        coupons: couponSlice,
        merchants: merchantSlice,
        web3: web3Slice,
      },
    });
  });

  describe('Authentication Flow', () => {
    it('handles user login and logout correctly', async () => {
      const initialState = store.getState();
      expect(initialState.auth.isAuthenticated).toBe(false);
      expect(initialState.auth.user).toBeNull();

      // Mock login
      const mockUser = {
        id: 'user-123',
        walletAddress: '0x123456789',
        preferredLanguage: 'en',
      };

      store.dispatch(loginUser.fulfilled(mockUser, 'requestId', mockUser));

      let state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.user).toEqual(mockUser);
      expect(state.auth.error).toBeNull();

      // Logout
      store.dispatch(logoutUser());

      state = store.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.user).toBeNull();
    });

    it('handles login errors correctly', () => {
      const error = 'Invalid credentials';
      
      store.dispatch(loginUser.rejected(new Error(error), 'requestId', {} as any));

      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.error).toBe(error);
      expect(state.auth.isLoading).toBe(false);
    });
  });

  describe('Web3 Integration', () => {
    it('handles wallet connection flow', async () => {
      const mockWalletData = {
        account: '0x123456789',
        balance: '1.5',
        chainId: 137, // Polygon
      };

      // Start connection
      store.dispatch(connectWallet.pending('requestId', 'metamask'));
      
      let state = store.getState();
      expect(state.web3.isLoading).toBe(true);

      // Complete connection
      store.dispatch(connectWallet.fulfilled(mockWalletData, 'requestId', 'metamask'));

      state = store.getState();
      expect(state.web3.isConnected).toBe(true);
      expect(state.web3.account).toBe(mockWalletData.account);
      expect(state.web3.balance).toBe(mockWalletData.balance);
      expect(state.web3.isLoading).toBe(false);
    });

    it('handles wallet disconnection', () => {
      // First connect
      const mockWalletData = {
        account: '0x123456789',
        balance: '1.5',
        chainId: 137,
      };
      
      store.dispatch(connectWallet.fulfilled(mockWalletData, 'requestId', 'metamask'));

      // Then disconnect
      store.dispatch(disconnectWallet());

      const state = store.getState();
      expect(state.web3.isConnected).toBe(false);
      expect(state.web3.account).toBeNull();
      expect(state.web3.balance).toBe('0');
    });
  });

  describe('Coupon Management', () => {
    it('fetches and manages user coupons', async () => {
      const mockCoupons = [
        {
          id: 'coupon-1',
          tokenId: '123',
          name: 'Coffee Discount',
          discountValue: 20,
          discountType: 'percentage' as const,
          merchantName: 'Central Coffee',
          expiryDate: '2024-12-31',
          isUsed: false,
        },
        {
          id: 'coupon-2',
          tokenId: '456',
          name: 'Fashion Sale',
          discountValue: 50,
          discountType: 'fixed_amount' as const,
          merchantName: 'Fashion Store',
          expiryDate: '2024-11-30',
          isUsed: false,
        },
      ];

      // Fetch coupons
      store.dispatch(fetchUserCoupons.fulfilled(mockCoupons, 'requestId', 'user-123'));

      let state = store.getState();
      expect(state.coupons.userCoupons).toEqual(mockCoupons);
      expect(state.coupons.isLoading).toBe(false);

      // Use a coupon
      const usageResult = {
        couponId: 'coupon-1',
        transactionHash: '0xabc123',
        success: true,
      };

      store.dispatch(useCoupon.fulfilled(usageResult, 'requestId', 'coupon-1'));

      state = store.getState();
      const usedCoupon = state.coupons.userCoupons.find((c: any) => c.id === 'coupon-1');
      expect(usedCoupon?.isUsed).toBe(true);
    });

    it('handles coupon usage errors', () => {
      const error = 'Transaction failed: Insufficient gas';
      
      store.dispatch(useCoupon.rejected(new Error(error), 'requestId', 'coupon-1'));

      const state = store.getState();
      expect(state.coupons.error).toBe(error);
      expect(state.coupons.isLoading).toBe(false);
    });
  });

  describe('Merchant Discovery', () => {
    it('fetches and filters nearby merchants', async () => {
      const mockMerchants = [
        {
          id: 'merchant-1',
          name: 'Central Coffee',
          category: 'restaurant',
          distance: 0.5,
          isNftParticipant: true,
          rating: 4.5,
        },
        {
          id: 'merchant-2',
          name: 'Fashion Store',
          category: 'fashion',
          distance: 1.2,
          isNftParticipant: false,
          rating: 4.2,
        },
      ];

      const location = { latitude: 22.2819, longitude: 114.1577 };
      
      store.dispatch(fetchNearbyMerchants.fulfilled(mockMerchants, 'requestId', location));

      let state = store.getState();
      expect(state.merchants.nearbyMerchants).toEqual(mockMerchants);

      // Test search functionality
      const searchResults = mockMerchants.filter(m => m.name.includes('Coffee'));
      
      store.dispatch(searchMerchants.fulfilled(searchResults, 'requestId', 'coffee'));

      state = store.getState();
      expect(state.merchants.searchResults).toEqual(searchResults);
    });

    it('applies filters correctly', () => {
      const mockMerchants = [
        {
          id: 'merchant-1',
          name: 'Central Coffee',
          category: 'restaurant',
          distance: 0.5,
          isNftParticipant: true,
          rating: 4.5,
        },
        {
          id: 'merchant-2',
          name: 'Fashion Store',
          category: 'fashion',
          distance: 1.2,
          isNftParticipant: false,
          rating: 4.2,
        },
      ];

      store.dispatch(fetchNearbyMerchants.fulfilled(mockMerchants, 'requestId', {}));

      // Apply NFT participant filter
      store.dispatch({
        type: 'merchants/setFilters',
        payload: { nftParticipant: true },
      });

      const state = store.getState();
      expect(state.merchants.filters.nftParticipant).toBe(true);
    });
  });

  describe('Cross-Slice Interactions', () => {
    it('handles wallet connection affecting authentication', () => {
      const mockWalletData = {
        account: '0x123456789',
        balance: '1.5',
        chainId: 137,
      };

      const mockUser = {
        id: 'user-123',
        walletAddress: '0x123456789',
        preferredLanguage: 'en',
      };

      // Connect wallet
      store.dispatch(connectWallet.fulfilled(mockWalletData, 'requestId', 'metamask'));
      
      // Login user with same wallet address
      store.dispatch(loginUser.fulfilled(mockUser, 'requestId', mockUser));

      const state = store.getState();
      expect(state.web3.isConnected).toBe(true);
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.user?.walletAddress).toBe(state.web3.account);
    });

    it('handles logout clearing all user data', () => {
      // Setup initial state with user data
      const mockUser = {
        id: 'user-123',
        walletAddress: '0x123456789',
        preferredLanguage: 'en',
      };

      const mockCoupons = [
        {
          id: 'coupon-1',
          tokenId: '123',
          name: 'Test Coupon',
          discountValue: 20,
          discountType: 'percentage' as const,
          merchantName: 'Test Store',
          expiryDate: '2024-12-31',
          isUsed: false,
        },
      ];

      store.dispatch(loginUser.fulfilled(mockUser, 'requestId', mockUser));
      store.dispatch(fetchUserCoupons.fulfilled(mockCoupons, 'requestId', 'user-123'));

      // Logout
      store.dispatch(logoutUser());

      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.user).toBeNull();
      // Coupons should be cleared on logout
      expect(state.coupons.userCoupons).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', () => {
      const networkError = 'Network request failed';
      
      // Test error handling across different slices
      store.dispatch(fetchUserCoupons.rejected(new Error(networkError), 'requestId', 'user-123'));
      store.dispatch(fetchNearbyMerchants.rejected(new Error(networkError), 'requestId', {}));

      const state = store.getState();
      expect(state.coupons.error).toBe(networkError);
      expect(state.merchants.error).toBe(networkError);
      expect(state.coupons.isLoading).toBe(false);
      expect(state.merchants.isLoading).toBe(false);
    });

    it('clears errors when new requests start', () => {
      // Set initial error state
      store.dispatch(fetchUserCoupons.rejected(new Error('Previous error'), 'requestId', 'user-123'));

      let state = store.getState();
      expect(state.coupons.error).toBe('Previous error');

      // Start new request
      store.dispatch(fetchUserCoupons.pending('requestId', 'user-123'));

      state = store.getState();
      expect(state.coupons.error).toBeNull();
      expect(state.coupons.isLoading).toBe(true);
    });
  });
});
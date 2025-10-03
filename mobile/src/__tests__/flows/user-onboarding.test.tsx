import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import { AppNavigator } from '../../navigation/AppNavigator';
import authSlice from '../../store/slices/authSlice';
import web3Slice from '../../store/slices/web3Slice';
import uiSlice from '../../store/slices/uiSlice';

const createMockStore = (initialState: any) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      web3: web3Slice,
      ui: uiSlice,
    },
    preloadedState: initialState,
  });
};

describe('User Onboarding Flow', () => {
  const mockInitialState = {
    auth: {
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    },
    web3: {
      isConnected: false,
      account: null,
      balance: '0',
      isLoading: false,
      error: null,
    },
    ui: {
      language: 'en',
      theme: 'light',
      isFirstLaunch: true,
    },
  };

  it('completes full onboarding flow from welcome to wallet connection', async () => {
    const store = createMockStore(mockInitialState);
    
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    );

    // Step 1: Welcome screen should be displayed for first-time users
    expect(getByText('Welcome to HK Retail NFT')).toBeTruthy();
    expect(getByText('Discover exclusive NFT coupons from local Hong Kong retailers')).toBeTruthy();

    // Step 2: Proceed to language selection
    fireEvent.press(getByText('Get Started'));
    
    await waitFor(() => {
      expect(getByText('Choose Your Language')).toBeTruthy();
    });

    // Step 3: Select language (English)
    fireEvent.press(getByText('English'));
    fireEvent.press(getByText('Continue'));

    // Step 4: Should navigate to wallet connection screen
    await waitFor(() => {
      expect(getByText('Connect Your Wallet')).toBeTruthy();
    });

    // Step 5: Attempt wallet connection
    fireEvent.press(getByText('MetaMask'));

    // Step 6: Mock successful wallet connection
    // In a real test, you would mock the wallet connection success
    await waitFor(() => {
      // Verify loading state
      expect(getByTestId('wallet-connecting')).toBeTruthy();
    });

    // Step 7: After successful connection, should navigate to home
    // This would be tested with proper mocking of the wallet connection
  });

  it('handles language switching during onboarding', async () => {
    const store = createMockStore(mockInitialState);
    
    const { getByText, queryByText } = render(
      <Provider store={store}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    );

    // Start onboarding
    fireEvent.press(getByText('Get Started'));
    
    await waitFor(() => {
      expect(getByText('Choose Your Language')).toBeTruthy();
    });

    // Select Traditional Chinese
    fireEvent.press(getByText('繁體中文'));
    
    // Verify UI updates to Chinese
    await waitFor(() => {
      expect(getByText('繼續')).toBeTruthy(); // Continue in Chinese
    });

    // Switch back to English
    fireEvent.press(getByText('English'));
    
    await waitFor(() => {
      expect(getByText('Continue')).toBeTruthy();
      expect(queryByText('繼續')).toBeNull();
    });
  });

  it('allows skipping wallet connection and browsing as guest', async () => {
    const store = createMockStore(mockInitialState);
    
    const { getByText } = render(
      <Provider store={store}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    );

    // Complete initial steps
    fireEvent.press(getByText('Get Started'));
    
    await waitFor(() => {
      fireEvent.press(getByText('English'));
      fireEvent.press(getByText('Continue'));
    });

    // On wallet connection screen, choose to browse as guest
    await waitFor(() => {
      expect(getByText('Browse as Guest')).toBeTruthy();
    });

    fireEvent.press(getByText('Browse as Guest'));

    // Should navigate to home screen in guest mode
    await waitFor(() => {
      expect(getByText('Welcome, Guest')).toBeTruthy();
      expect(getByText('Connect wallet to access full features')).toBeTruthy();
    });
  });

  it('handles wallet connection errors gracefully', async () => {
    const store = createMockStore({
      ...mockInitialState,
      web3: {
        ...mockInitialState.web3,
        error: 'User rejected connection',
      },
    });
    
    const { getByText } = render(
      <Provider store={store}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    );

    // Navigate to wallet connection
    fireEvent.press(getByText('Get Started'));
    
    await waitFor(() => {
      fireEvent.press(getByText('English'));
      fireEvent.press(getByText('Continue'));
    });

    // Error should be displayed
    await waitFor(() => {
      expect(getByText('User rejected connection')).toBeTruthy();
      expect(getByText('Retry')).toBeTruthy();
    });

    // User can retry connection
    fireEvent.press(getByText('Retry'));
    
    // Or choose to browse as guest
    fireEvent.press(getByText('Browse as Guest'));
  });

  it('persists onboarding completion state', async () => {
    const completedOnboardingState = {
      ...mockInitialState,
      ui: {
        ...mockInitialState.ui,
        isFirstLaunch: false,
      },
      auth: {
        isAuthenticated: true,
        user: { id: 'user-123', walletAddress: '0x123' },
        isLoading: false,
        error: null,
      },
    };

    const store = createMockStore(completedOnboardingState);
    
    const { getByText, queryByText } = render(
      <Provider store={store}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    );

    // Should skip onboarding and go directly to home screen
    await waitFor(() => {
      expect(getByText('Welcome back!')).toBeTruthy();
      expect(queryByText('Welcome to HK Retail NFT')).toBeNull();
    });
  });
});
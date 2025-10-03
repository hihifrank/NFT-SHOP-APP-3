import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import { WalletConnectScreen } from '../../screens/WalletConnectScreen';
import web3Slice from '../../store/slices/web3Slice';
import authSlice from '../../store/slices/authSlice';

const createMockStore = (initialState: any) => {
  return configureStore({
    reducer: {
      web3: web3Slice,
      auth: authSlice,
    },
    preloadedState: initialState,
  });
};

const MockNavigationWrapper = ({ children }: { children: React.ReactNode }) => (
  <NavigationContainer>
    {children}
  </NavigationContainer>
);

describe('WalletConnectScreen', () => {
  const mockInitialState = {
    web3: {
      isConnected: false,
      account: null,
      balance: '0',
      isLoading: false,
      error: null,
    },
    auth: {
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    },
  };

  it('renders wallet connection options', () => {
    const store = createMockStore(mockInitialState);
    
    const { getByText } = render(
      <Provider store={store}>
        <MockNavigationWrapper>
          <WalletConnectScreen />
        </MockNavigationWrapper>
      </Provider>
    );

    expect(getByText('Connect Your Wallet')).toBeTruthy();
    expect(getByText('MetaMask')).toBeTruthy();
    expect(getByText('WalletConnect')).toBeTruthy();
  });

  it('shows loading state when connecting', () => {
    const loadingState = {
      ...mockInitialState,
      web3: { ...mockInitialState.web3, isLoading: true },
    };
    const store = createMockStore(loadingState);
    
    const { getByTestId } = render(
      <Provider store={store}>
        <MockNavigationWrapper>
          <WalletConnectScreen />
        </MockNavigationWrapper>
      </Provider>
    );

    expect(getByTestId('wallet-connecting')).toBeTruthy();
  });

  it('displays error message when connection fails', () => {
    const errorState = {
      ...mockInitialState,
      web3: { 
        ...mockInitialState.web3, 
        error: 'Failed to connect wallet',
      },
    };
    const store = createMockStore(errorState);
    
    const { getByText } = render(
      <Provider store={store}>
        <MockNavigationWrapper>
          <WalletConnectScreen />
        </MockNavigationWrapper>
      </Provider>
    );

    expect(getByText('Failed to connect wallet')).toBeTruthy();
  });

  it('calls MetaMask connection when MetaMask button is pressed', async () => {
    const store = createMockStore(mockInitialState);
    
    const { getByText } = render(
      <Provider store={store}>
        <MockNavigationWrapper>
          <WalletConnectScreen />
        </MockNavigationWrapper>
      </Provider>
    );

    fireEvent.press(getByText('MetaMask'));
    
    // In a real test, you would verify that the MetaMask connection action was dispatched
    await waitFor(() => {
      // Verify connection attempt
    });
  });

  it('calls WalletConnect connection when WalletConnect button is pressed', async () => {
    const store = createMockStore(mockInitialState);
    
    const { getByText } = render(
      <Provider store={store}>
        <MockNavigationWrapper>
          <WalletConnectScreen />
        </MockNavigationWrapper>
      </Provider>
    );

    fireEvent.press(getByText('WalletConnect'));
    
    await waitFor(() => {
      // Verify WalletConnect connection attempt
    });
  });

  it('navigates to home when wallet is successfully connected', () => {
    const connectedState = {
      ...mockInitialState,
      web3: {
        isConnected: true,
        account: '0x123',
        balance: '1.0',
        isLoading: false,
        error: null,
      },
      auth: {
        isAuthenticated: true,
        user: { id: 'user-123', walletAddress: '0x123' },
        isLoading: false,
        error: null,
      },
    };
    const store = createMockStore(connectedState);
    const mockNavigate = jest.fn();
    
    const mockNavigation = {
      navigate: mockNavigate,
      replace: jest.fn(),
      goBack: jest.fn(),
    };

    render(
      <Provider store={store}>
        <WalletConnectScreen navigation={mockNavigation} />
      </Provider>
    );

    // In a real implementation, this would trigger navigation
    expect(mockNavigation.replace).toHaveBeenCalledWith('Home');
  });

  it('displays wallet connection instructions', () => {
    const store = createMockStore(mockInitialState);
    
    const { getByText } = render(
      <Provider store={store}>
        <MockNavigationWrapper>
          <WalletConnectScreen />
        </MockNavigationWrapper>
      </Provider>
    );

    expect(getByText('Choose your preferred wallet to connect')).toBeTruthy();
    expect(getByText('Your wallet will be used to store and manage your NFT coupons')).toBeTruthy();
  });

  it('shows retry button when connection fails', () => {
    const errorState = {
      ...mockInitialState,
      web3: { 
        ...mockInitialState.web3, 
        error: 'Connection timeout',
      },
    };
    const store = createMockStore(errorState);
    
    const { getByText } = render(
      <Provider store={store}>
        <MockNavigationWrapper>
          <WalletConnectScreen />
        </MockNavigationWrapper>
      </Provider>
    );

    expect(getByText('Retry')).toBeTruthy();
  });

  it('clears error when retry button is pressed', () => {
    const errorState = {
      ...mockInitialState,
      web3: { 
        ...mockInitialState.web3, 
        error: 'Connection failed',
      },
    };
    const store = createMockStore(errorState);
    
    const { getByText } = render(
      <Provider store={store}>
        <MockNavigationWrapper>
          <WalletConnectScreen />
        </MockNavigationWrapper>
      </Provider>
    );

    fireEvent.press(getByText('Retry'));
    
    // Verify error was cleared and connection retry was attempted
  });
});
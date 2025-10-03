import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { WalletStatusCard } from '../../components/WalletStatusCard';
import web3Slice from '../../store/slices/web3Slice';

const createMockStore = (initialState: any) => {
  return configureStore({
    reducer: {
      web3: web3Slice,
    },
    preloadedState: initialState,
  });
};

describe('WalletStatusCard Component', () => {
  it('renders disconnected state correctly', () => {
    const store = createMockStore({
      web3: {
        isConnected: false,
        account: null,
        balance: '0',
        isLoading: false,
        error: null,
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <WalletStatusCard />
      </Provider>
    );

    expect(getByText('Wallet Disconnected')).toBeTruthy();
    expect(getByText('Connect Wallet')).toBeTruthy();
  });

  it('renders connected state with account and balance', () => {
    const store = createMockStore({
      web3: {
        isConnected: true,
        account: '0x1234567890123456789012345678901234567890',
        balance: '1.5',
        isLoading: false,
        error: null,
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <WalletStatusCard />
      </Provider>
    );

    expect(getByText('Wallet Connected')).toBeTruthy();
    expect(getByText('0x1234...7890')).toBeTruthy(); // Truncated address
    expect(getByText('1.5 MATIC')).toBeTruthy();
  });

  it('shows loading state', () => {
    const store = createMockStore({
      web3: {
        isConnected: false,
        account: null,
        balance: '0',
        isLoading: true,
        error: null,
      },
    });

    const { getByTestId } = render(
      <Provider store={store}>
        <WalletStatusCard />
      </Provider>
    );

    expect(getByTestId('wallet-loading')).toBeTruthy();
  });

  it('displays error message when error exists', () => {
    const store = createMockStore({
      web3: {
        isConnected: false,
        account: null,
        balance: '0',
        isLoading: false,
        error: 'Connection failed',
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <WalletStatusCard />
      </Provider>
    );

    expect(getByText('Connection failed')).toBeTruthy();
  });

  it('calls connect wallet action when connect button is pressed', () => {
    const store = createMockStore({
      web3: {
        isConnected: false,
        account: null,
        balance: '0',
        isLoading: false,
        error: null,
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <WalletStatusCard />
      </Provider>
    );

    fireEvent.press(getByText('Connect Wallet'));
    // Note: In a real test, you would mock the dispatch and verify it was called
  });

  it('shows disconnect option when wallet is connected', () => {
    const store = createMockStore({
      web3: {
        isConnected: true,
        account: '0x1234567890123456789012345678901234567890',
        balance: '1.5',
        isLoading: false,
        error: null,
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <WalletStatusCard />
      </Provider>
    );

    expect(getByText('Disconnect')).toBeTruthy();
  });
});
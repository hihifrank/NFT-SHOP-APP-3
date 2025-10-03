import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TransactionStatusModal } from '../../components/TransactionStatusModal';

const mockTransaction = {
  id: 'tx-123',
  hash: '0xabcdef1234567890',
  status: 'pending' as const,
  type: 'coupon_use' as const,
  amount: '0.1',
  timestamp: Date.now(),
};

describe('TransactionStatusModal Component', () => {
  it('renders modal when visible is true', () => {
    const { getByText } = render(
      <TransactionStatusModal 
        visible={true}
        transaction={mockTransaction}
        onClose={() => {}}
      />
    );

    expect(getByText('Transaction Status')).toBeTruthy();
    expect(getByText('Pending')).toBeTruthy();
  });

  it('does not render when visible is false', () => {
    const { queryByText } = render(
      <TransactionStatusModal 
        visible={false}
        transaction={mockTransaction}
        onClose={() => {}}
      />
    );

    expect(queryByText('Transaction Status')).toBeNull();
  });

  it('displays transaction hash correctly', () => {
    const { getByText } = render(
      <TransactionStatusModal 
        visible={true}
        transaction={mockTransaction}
        onClose={() => {}}
      />
    );

    expect(getByText('0xabcd...7890')).toBeTruthy(); // Truncated hash
  });

  it('shows success status with checkmark', () => {
    const successTransaction = { ...mockTransaction, status: 'success' as const };
    
    const { getByText, getByTestId } = render(
      <TransactionStatusModal 
        visible={true}
        transaction={successTransaction}
        onClose={() => {}}
      />
    );

    expect(getByText('Success')).toBeTruthy();
    expect(getByTestId('success-icon')).toBeTruthy();
  });

  it('shows failed status with error icon', () => {
    const failedTransaction = { 
      ...mockTransaction, 
      status: 'failed' as const,
      error: 'Transaction reverted'
    };
    
    const { getByText, getByTestId } = render(
      <TransactionStatusModal 
        visible={true}
        transaction={failedTransaction}
        onClose={() => {}}
      />
    );

    expect(getByText('Failed')).toBeTruthy();
    expect(getByText('Transaction reverted')).toBeTruthy();
    expect(getByTestId('error-icon')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', () => {
    const mockOnClose = jest.fn();
    
    const { getByText } = render(
      <TransactionStatusModal 
        visible={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
      />
    );

    fireEvent.press(getByText('Close'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('displays transaction type correctly', () => {
    const { getByText } = render(
      <TransactionStatusModal 
        visible={true}
        transaction={mockTransaction}
        onClose={() => {}}
      />
    );

    expect(getByText('Coupon Use')).toBeTruthy();
  });

  it('shows view on explorer button for completed transactions', () => {
    const completedTransaction = { ...mockTransaction, status: 'success' as const };
    
    const { getByText } = render(
      <TransactionStatusModal 
        visible={true}
        transaction={completedTransaction}
        onClose={() => {}}
      />
    );

    expect(getByText('View on Explorer')).toBeTruthy();
  });

  it('displays loading indicator for pending transactions', () => {
    const { getByTestId } = render(
      <TransactionStatusModal 
        visible={true}
        transaction={mockTransaction}
        onClose={() => {}}
      />
    );

    expect(getByTestId('pending-spinner')).toBeTruthy();
  });
});
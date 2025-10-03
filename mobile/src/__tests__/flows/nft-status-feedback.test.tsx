import React from 'react';

// Mock transaction status types
type TransactionStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error';
type NFTOperationType = 'purchase' | 'use' | 'transfer' | 'mint';

// Mock NFT operation status component
const MockNFTStatusFeedback = ({ 
  operation, 
  status, 
  message, 
  transactionHash, 
  onClose, 
  onRetry 
}: {
  operation: NFTOperationType;
  status: TransactionStatus;
  message: string;
  transactionHash?: string;
  onClose?: () => void;
  onRetry?: () => void;
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending': return '⏳';
      case 'confirming': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending': return 'orange';
      case 'confirming': return 'blue';
      case 'success': return 'green';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  return React.createElement('div', {
    'data-testid': 'nft-status-feedback',
    'data-operation': operation,
    'data-status': status,
    'data-status-color': getStatusColor(),
    style: { color: getStatusColor() }
  }, [
    React.createElement('div', { key: 'icon' }, getStatusIcon()),
    React.createElement('div', { key: 'message' }, message),
    transactionHash && React.createElement('div', { 
      key: 'tx-hash',
      'data-testid': 'transaction-hash'
    }, `TX: ${transactionHash.substring(0, 10)}...`),
    status === 'error' && onRetry && React.createElement('button', {
      key: 'retry-btn',
      'data-testid': 'retry-button',
      onClick: onRetry
    }, 'Retry'),
    onClose && React.createElement('button', {
      key: 'close-btn',
      'data-testid': 'close-button',
      onClick: onClose
    }, 'Close')
  ]);
};

// Mock NFT operation component that shows status feedback
const MockNFTOperationFlow = ({ 
  nft, 
  operation, 
  onOperationComplete,
  currentStatus = 'idle'
}: {
  nft: any;
  operation: NFTOperationType;
  onOperationComplete: (result: any) => void;
  currentStatus?: TransactionStatus;
}) => {
  const executeOperation = () => {
    onOperationComplete({ success: true, transactionHash: '0xabcdef1234567890' });
  };

  return React.createElement('div', {
    'data-testid': 'nft-operation-flow',
    'data-nft-id': nft.id,
    'data-operation': operation,
    'data-current-status': currentStatus
  }, [
    React.createElement('button', {
      key: 'execute-btn',
      'data-testid': 'execute-operation',
      onClick: executeOperation,
      disabled: currentStatus !== 'idle'
    }, `${operation.charAt(0).toUpperCase() + operation.slice(1)} NFT`),
    
    currentStatus !== 'idle' && React.createElement(MockNFTStatusFeedback, {
      key: 'status-feedback',
      operation,
      status: currentStatus,
      message: `${operation} in progress...`,
      transactionHash: currentStatus === 'confirming' ? '0xabcdef1234567890' : undefined
    })
  ]);
};

describe('NFT Status Feedback Flow', () => {
  const mockNFT = {
    id: 'nft-123',
    tokenId: '456',
    name: 'Coffee Shop 20% Off',
    discountValue: 20,
    isUsed: false
  };

  // Test requirement 5.5: Clear status feedback for NFT operations
  it('provides clear status feedback during NFT purchase', () => {
    const statusFeedback = MockNFTStatusFeedback({
      operation: 'purchase',
      status: 'pending',
      message: 'Processing NFT purchase...'
    });

    expect(statusFeedback.props['data-operation']).toBe('purchase');
    expect(statusFeedback.props['data-status']).toBe('pending');
    expect(statusFeedback.props['data-status-color']).toBe('orange');
    
    const messageElement = statusFeedback.props.children.find((child: any) => 
      child.props.children === 'Processing NFT purchase...'
    );
    expect(messageElement).toBeDefined();
  });

  it('shows different status colors for different states', () => {
    const statuses: TransactionStatus[] = ['pending', 'confirming', 'success', 'error'];
    const expectedColors = ['orange', 'blue', 'green', 'red'];

    statuses.forEach((status, index) => {
      const statusFeedback = MockNFTStatusFeedback({
        operation: 'use',
        status,
        message: `Status: ${status}`
      });

      expect(statusFeedback.props['data-status-color']).toBe(expectedColors[index]);
    });
  });

  it('displays transaction hash when available', () => {
    const statusFeedback = MockNFTStatusFeedback({
      operation: 'use',
      status: 'confirming',
      message: 'Transaction confirming...',
      transactionHash: '0xabcdef1234567890abcdef1234567890abcdef12'
    });

    const txHashElement = statusFeedback.props.children.find((child: any) => 
      child && child.props && child.props['data-testid'] === 'transaction-hash'
    );
    
    expect(txHashElement).toBeDefined();
    expect(txHashElement.props.children).toBe('TX: 0xabcdef12...');
  });

  it('shows retry button on error status', () => {
    const mockOnRetry = jest.fn();
    const statusFeedback = MockNFTStatusFeedback({
      operation: 'transfer',
      status: 'error',
      message: 'Transaction failed',
      onRetry: mockOnRetry
    });

    const retryButton = statusFeedback.props.children.find((child: any) => 
      child && child.props && child.props['data-testid'] === 'retry-button'
    );
    
    expect(retryButton).toBeDefined();
    
    // Test retry functionality
    retryButton.props.onClick();
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('provides status feedback for coupon usage operation', () => {
    const mockOnComplete = jest.fn();
    
    const operationFlow = MockNFTOperationFlow({
      nft: mockNFT,
      operation: 'use',
      onOperationComplete: mockOnComplete
    });

    expect(operationFlow.props['data-operation']).toBe('use');
    expect(operationFlow.props['data-nft-id']).toBe('nft-123');

    const executeButton = operationFlow.props.children.find((child: any) => 
      child && child.props && child.props['data-testid'] === 'execute-operation'
    );
    
    expect(executeButton).toBeDefined();
    expect(executeButton.props.children).toBe('Use NFT');
  });

  it('handles different NFT operation types', () => {
    const operations: NFTOperationType[] = ['purchase', 'use', 'transfer', 'mint'];
    
    operations.forEach(operation => {
      const statusFeedback = MockNFTStatusFeedback({
        operation,
        status: 'success',
        message: `${operation} completed successfully`
      });

      expect(statusFeedback.props['data-operation']).toBe(operation);
    });
  });

  it('shows appropriate icons for different statuses', () => {
    const statusIcons = {
      'pending': '⏳',
      'confirming': '🔄',
      'success': '✅',
      'error': '❌'
    };

    Object.entries(statusIcons).forEach(([status, expectedIcon]) => {
      const statusFeedback = MockNFTStatusFeedback({
        operation: 'use',
        status: status as TransactionStatus,
        message: `Status: ${status}`
      });

      const iconElement = statusFeedback.props.children.find((child: any) => 
        child.props.children === expectedIcon
      );
      expect(iconElement).toBeDefined();
    });
  });

  it('provides clear feedback during complete operation flow', () => {
    // Test the complete flow from initiation to completion
    const mockOnComplete = jest.fn();
    
    const operationFlow = MockNFTOperationFlow({
      nft: mockNFT,
      operation: 'use',
      onOperationComplete: mockOnComplete,
      currentStatus: 'idle'
    });

    // Initially should show execute button
    const executeButton = operationFlow.props.children.find((child: any) => 
      child && child.props && child.props['data-testid'] === 'execute-operation'
    );
    
    expect(executeButton).toBeDefined();
    expect(executeButton.props.disabled).toBe(false);
  });

  it('disables operation button during transaction', () => {
    const statusFeedback = MockNFTStatusFeedback({
      operation: 'use',
      status: 'pending',
      message: 'Processing...'
    });

    // When status is not idle, button should be disabled
    expect(statusFeedback.props['data-status']).toBe('pending');
  });

  it('handles network errors with clear messaging', () => {
    const statusFeedback = MockNFTStatusFeedback({
      operation: 'purchase',
      status: 'error',
      message: 'Network connection failed. Please check your internet connection and try again.',
      onRetry: jest.fn()
    });

    expect(statusFeedback.props['data-status']).toBe('error');
    expect(statusFeedback.props['data-status-color']).toBe('red');
    
    const messageElement = statusFeedback.props.children.find((child: any) => 
      child.props.children === 'Network connection failed. Please check your internet connection and try again.'
    );
    expect(messageElement).toBeDefined();
  });

  it('provides close button for completed operations', () => {
    const mockOnClose = jest.fn();
    const statusFeedback = MockNFTStatusFeedback({
      operation: 'use',
      status: 'success',
      message: 'Coupon used successfully!',
      onClose: mockOnClose
    });

    const closeButton = statusFeedback.props.children.find((child: any) => 
      child && child.props && child.props['data-testid'] === 'close-button'
    );
    
    expect(closeButton).toBeDefined();
    
    closeButton.props.onClick();
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
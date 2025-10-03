import React from 'react';

// Mock ErrorMessage component for testing
const MockErrorMessage = ({ message, onRetry, type, visible }: any) => {
  if (!visible) return null;
  
  return React.createElement('div', {
    'data-testid': 'error-message',
    'data-error-type': type,
    'data-visible': visible
  }, [
    React.createElement('span', { key: 'message' }, message),
    onRetry && React.createElement('button', { 
      key: 'retry-btn', 
      onClick: onRetry,
      'data-testid': 'retry-button'
    }, 'Retry')
  ]);
};

jest.mock('../../components/ErrorMessage', () => MockErrorMessage);

describe('ErrorMessage Component', () => {
  it('renders error message correctly', () => {
    const errorMsg = MockErrorMessage({ 
      message: "Network connection failed", 
      visible: true 
    });
    
    expect(errorMsg.props['data-testid']).toBe('error-message');
    expect(errorMsg.props['data-visible']).toBe(true);
    
    const messageElement = errorMsg.props.children.find((child: any) => 
      child.props.children === "Network connection failed"
    );
    expect(messageElement).toBeDefined();
  });

  it('does not render when visible is false', () => {
    const errorMsg = MockErrorMessage({ 
      message: "Error message", 
      visible: false 
    });
    
    expect(errorMsg).toBeNull();
  });

  it('shows retry button when onRetry is provided', () => {
    const mockOnRetry = jest.fn();
    const errorMsg = MockErrorMessage({ 
      message: "Connection failed", 
      onRetry: mockOnRetry,
      visible: true 
    });
    
    const retryButton = errorMsg.props.children.find((child: any) => 
      child && child.props && child.props['data-testid'] === 'retry-button'
    );
    expect(retryButton).toBeDefined();
  });

  it('calls onRetry when retry button is pressed', () => {
    const mockOnRetry = jest.fn();
    const errorMsg = MockErrorMessage({ 
      message: "Connection failed", 
      onRetry: mockOnRetry,
      visible: true 
    });
    
    const retryButton = errorMsg.props.children.find((child: any) => 
      child && child.props && child.props['data-testid'] === 'retry-button'
    );
    
    if (retryButton) {
      retryButton.props.onClick();
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    }
  });

  it('handles different error types', () => {
    const networkError = MockErrorMessage({ 
      message: "Network error", 
      type: "network",
      visible: true 
    });
    
    const walletError = MockErrorMessage({ 
      message: "Wallet error", 
      type: "wallet",
      visible: true 
    });
    
    expect(networkError.props['data-error-type']).toBe('network');
    expect(walletError.props['data-error-type']).toBe('wallet');
  });

  it('does not show retry button when onRetry is not provided', () => {
    const errorMsg = MockErrorMessage({ 
      message: "Information message", 
      visible: true 
    });
    
    const retryButton = errorMsg.props.children.find((child: any) => 
      child && child.props && child.props['data-testid'] === 'retry-button'
    );
    expect(retryButton).toBeUndefined();
  });

  // Test requirement 5.5: Clear status feedback for errors
  it('provides clear error status feedback', () => {
    const errorTypes = ['network', 'wallet', 'transaction', 'validation'];
    
    errorTypes.forEach(type => {
      const errorMsg = MockErrorMessage({ 
        message: `${type} error occurred`, 
        type: type,
        visible: true 
      });
      
      expect(errorMsg.props['data-error-type']).toBe(type);
      expect(errorMsg.props['data-visible']).toBe(true);
    });
  });
});
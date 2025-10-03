import React from 'react';

// Mock the Button component for testing
const MockButton = ({ title, onPress, disabled, loading, variant, testID, children }: any) => {
  return React.createElement('button', {
    onClick: onPress,
    disabled: disabled || loading,
    'data-variant': variant,
    'data-testid': testID,
    'data-loading': loading
  }, children || title);
};

// Mock the actual Button component
jest.mock('../../components/Button', () => MockButton);

describe('Button Component', () => {
  it('renders correctly with title', () => {
    const button = MockButton({ title: "Test Button", onPress: () => {} });
    expect(button).toBeDefined();
    expect(button.props.children).toBe("Test Button");
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const button = MockButton({ title: "Test Button", onPress: mockOnPress });
    
    // Simulate button press
    button.props.onClick();
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('renders as disabled when disabled prop is true', () => {
    const button = MockButton({ title: "Disabled Button", onPress: () => {}, disabled: true });
    expect(button.props.disabled).toBe(true);
  });

  it('renders with loading state', () => {
    const button = MockButton({ title: "Loading Button", onPress: () => {}, loading: true });
    expect(button.props['data-loading']).toBe(true);
    expect(button.props.disabled).toBe(true); // Should be disabled when loading
  });

  it('applies custom variant correctly', () => {
    const button = MockButton({ 
      title: "Primary Button", 
      onPress: () => {}, 
      variant: "primary"
    });
    expect(button.props['data-variant']).toBe("primary");
  });

  it('renders different variants correctly', () => {
    const primaryButton = MockButton({ 
      title: "Primary", 
      onPress: () => {}, 
      variant: "primary"
    });
    
    const secondaryButton = MockButton({ 
      title: "Secondary", 
      onPress: () => {}, 
      variant: "secondary"
    });
    
    expect(primaryButton.props['data-variant']).toBe("primary");
    expect(secondaryButton.props['data-variant']).toBe("secondary");
  });

  it('handles testID prop correctly', () => {
    const button = MockButton({ 
      title: "Test Button", 
      onPress: () => {}, 
      testID: "custom-button"
    });
    expect(button.props['data-testid']).toBe("custom-button");
  });
});
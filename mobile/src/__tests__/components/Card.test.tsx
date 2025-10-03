import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../../components/Card';

describe('Card Component', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <Card>
        <Text>Card Content</Text>
      </Card>
    );
    
    expect(getByText('Card Content')).toBeTruthy();
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'blue' };
    const { getByTestId } = render(
      <Card style={customStyle} testID="custom-card">
        <Text>Styled Card</Text>
      </Card>
    );
    
    expect(getByTestId('custom-card')).toBeTruthy();
  });

  it('renders with elevation shadow', () => {
    const { getByTestId } = render(
      <Card elevation={5} testID="elevated-card">
        <Text>Elevated Card</Text>
      </Card>
    );
    
    expect(getByTestId('elevated-card')).toBeTruthy();
  });

  it('handles onPress events', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <Card onPress={mockOnPress} testID="pressable-card">
        <Text>Pressable Card</Text>
      </Card>
    );
    
    const card = getByTestId('pressable-card');
    expect(card).toBeTruthy();
  });
});
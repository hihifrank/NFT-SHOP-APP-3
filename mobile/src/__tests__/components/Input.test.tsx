import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../../components/Input';

describe('Input Component', () => {
  it('renders with placeholder', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter text" onChangeText={() => {}} />
    );
    
    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const mockOnChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Test input" onChangeText={mockOnChangeText} />
    );
    
    const input = getByPlaceholderText('Test input');
    fireEvent.changeText(input, 'new text');
    
    expect(mockOnChangeText).toHaveBeenCalledWith('new text');
  });

  it('displays error message when error prop is provided', () => {
    const { getByText } = render(
      <Input 
        placeholder="Test input" 
        onChangeText={() => {}} 
        error="This field is required"
      />
    );
    
    expect(getByText('This field is required')).toBeTruthy();
  });

  it('renders with label', () => {
    const { getByText } = render(
      <Input 
        label="Username"
        placeholder="Enter username" 
        onChangeText={() => {}} 
      />
    );
    
    expect(getByText('Username')).toBeTruthy();
  });

  it('handles secure text entry for passwords', () => {
    const { getByPlaceholderText } = render(
      <Input 
        placeholder="Password"
        onChangeText={() => {}} 
        secureTextEntry
      />
    );
    
    const input = getByPlaceholderText('Password');
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('applies custom styles', () => {
    const customStyle = { borderColor: 'red' };
    const { getByTestId } = render(
      <Input 
        placeholder="Styled input"
        onChangeText={() => {}} 
        style={customStyle}
        testID="styled-input"
      />
    );
    
    expect(getByTestId('styled-input')).toBeTruthy();
  });
});
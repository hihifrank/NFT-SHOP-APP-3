import React from 'react';
import {StyleSheet, ViewStyle} from 'react-native';
import {Button as PaperButton, ButtonProps} from 'react-native-paper';
import {theme} from '@theme/index';

interface CustomButtonProps extends Omit<ButtonProps, 'style'> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  style?: ViewStyle;
}

const Button: React.FC<CustomButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  style,
  children,
  ...props
}) => {
  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.button];
    
    if (fullWidth) {
      baseStyle.push(styles.fullWidth);
    }
    
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };

  const getButtonMode = (): ButtonProps['mode'] => {
    switch (variant) {
      case 'primary':
        return 'contained';
      case 'secondary':
        return 'contained-tonal';
      case 'outline':
        return 'outlined';
      default:
        return 'contained';
    }
  };

  return (
    <PaperButton
      mode={getButtonMode()}
      style={getButtonStyle()}
      contentStyle={styles.content}
      labelStyle={styles.label}
      {...props}
    >
      {children}
    </PaperButton>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.custom.borderRadius.medium,
    marginVertical: theme.spacing.xs,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Button;
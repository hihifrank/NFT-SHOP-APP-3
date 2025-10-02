import React from 'react';
import {StyleSheet, ViewStyle} from 'react-native';
import {Card as PaperCard, CardProps} from 'react-native-paper';
import {theme} from '@theme/index';

interface CustomCardProps extends Omit<CardProps, 'style'> {
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: keyof typeof theme.spacing;
  style?: ViewStyle;
}

const Card: React.FC<CustomCardProps> = ({
  variant = 'elevated',
  padding = 'md',
  style,
  children,
  ...props
}) => {
  const getCardStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [
      styles.card,
      {
        padding: theme.spacing[padding],
      },
    ];

    switch (variant) {
      case 'elevated':
        baseStyle.push(styles.elevated);
        break;
      case 'outlined':
        baseStyle.push(styles.outlined);
        break;
      case 'filled':
        baseStyle.push(styles.filled);
        break;
    }

    if (style) {
      baseStyle.push(style);
    }

    return baseStyle;
  };

  const {elevation, ...restProps} = props;
  
  return (
    <PaperCard style={getCardStyle()} {...restProps}>
      {children}
    </PaperCard>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.custom.borderRadius.medium,
    marginVertical: theme.spacing.xs,
  },
  elevated: {
    elevation: theme.custom.elevation.medium,
    backgroundColor: theme.colors.surface,
  },
  outlined: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
  },
  filled: {
    backgroundColor: theme.colors.surfaceVariant,
  },
});

export default Card;
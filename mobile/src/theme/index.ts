import {MD3LightTheme, MD3DarkTheme} from 'react-native-paper';

// Hong Kong retail brand colors
const colors = {
  primary: '#E91E63', // Pink - vibrant and modern
  primaryContainer: '#FCE4EC',
  secondary: '#FF9800', // Orange - energetic
  secondaryContainer: '#FFF3E0',
  tertiary: '#9C27B0', // Purple - premium feel
  tertiaryContainer: '#F3E5F5',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  background: '#FAFAFA',
  error: '#F44336',
  errorContainer: '#FFEBEE',
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onTertiary: '#FFFFFF',
  onSurface: '#212121',
  onSurfaceVariant: '#757575',
  onBackground: '#212121',
  onError: '#FFFFFF',
  outline: '#E0E0E0',
  outlineVariant: '#EEEEEE',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#303030',
  inverseOnSurface: '#FAFAFA',
  inversePrimary: '#F8BBD9',
  // Custom colors for NFT and crypto elements
  nftGold: '#FFD700',
  nftSilver: '#C0C0C0',
  nftBronze: '#CD7F32',
  cryptoGreen: '#4CAF50',
  cryptoRed: '#F44336',
  // Additional colors
  accent: '#FF5722',
  success: '#4CAF50',
  textSecondary: '#757575',
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const typography = {
  displayLarge: {
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '400' as const,
  },
  displayMedium: {
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '400' as const,
  },
  displaySmall: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '400' as const,
  },
  headlineLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '400' as const,
  },
  headlineMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '400' as const,
  },
  headlineSmall: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '400' as const,
  },
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '500' as const,
  },
  titleMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500' as const,
  },
  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...colors,
  },
  spacing,
  typography,
  roundness: 12,
  // Custom theme extensions
  custom: {
    borderRadius: {
      small: 8,
      medium: 12,
      large: 16,
      xl: 24,
    },
    elevation: {
      small: 2,
      medium: 4,
      large: 8,
    },
    animation: {
      scale: 1.05,
      duration: 200,
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    tertiary: colors.tertiary,
    surface: '#121212',
    background: '#000000',
    onSurface: '#FFFFFF',
    onBackground: '#FFFFFF',
  },
  spacing,
  typography,
  roundness: 12,
  custom: theme.custom,
};

export type Theme = typeof theme;

// Hook to use theme in components
export const useTheme = () => theme;
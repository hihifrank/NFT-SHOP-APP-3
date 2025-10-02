# Hong Kong Retail NFT Platform - Mobile App

This is the React Native mobile application for the Hong Kong Retail NFT Platform.

## Project Structure

```
src/
├── components/          # Reusable UI components
├── navigation/          # Navigation configuration
├── screens/            # Screen components
├── store/              # Redux store and slices
│   └── slices/         # Redux slices for state management
├── services/           # API services and external integrations
├── utils/              # Utility functions and helpers
├── types/              # TypeScript type definitions
├── theme/              # Theme configuration and styling
└── locales/            # Internationalization files
```

## Features Implemented

### 6.1 React Native Project Setup ✅

- ✅ Cross-platform mobile application structure
- ✅ React Navigation configuration with bottom tabs and stack navigation
- ✅ Redux Toolkit state management with typed hooks
- ✅ Material Design 3 UI component library (React Native Paper)
- ✅ Multi-language support (Traditional Chinese, Simplified Chinese, English)
- ✅ Theme system with Hong Kong retail brand colors
- ✅ TypeScript configuration with path aliases
- ✅ Basic screen components (Home, Explore, NFT, Profile, WalletConnect)

### State Management

The app uses Redux Toolkit with the following slices:
- `authSlice`: User authentication and wallet connection
- `userSlice`: User profile and preferences
- `couponSlice`: NFT coupon management
- `merchantSlice`: Merchant data and search
- `lotterySlice`: Lottery system functionality
- `uiSlice`: UI state management (modals, notifications, loading states)

### Navigation Structure

- **Main Tab Navigator**: Home, Explore, NFT, Profile
- **Stack Navigator**: Handles authentication flow and detail screens
- **Conditional Navigation**: Shows wallet connect screen when not authenticated

### Internationalization

- Support for Traditional Chinese (zh-HK), Simplified Chinese (zh-CN), and English (en)
- Dynamic language switching with persistent storage
- Comprehensive translation keys for all UI elements

### Theme System

- Material Design 3 based theme
- Hong Kong retail brand colors (Pink primary, Orange secondary)
- Custom spacing, typography, and component styling
- Support for light and dark themes
- NFT-specific color palette (gold, silver, bronze)

## Installation

```bash
# Install dependencies
npm install

# iOS setup (macOS only)
cd ios && pod install && cd ..

# Run on iOS
npm run ios

# Run on Android
npm run android

# Start Metro bundler
npm start
```

## Development

The project is configured with:
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Path aliases for clean imports
- Hot reloading for development

## Next Steps

This completes task 6.1. The next tasks will implement:
- 6.2: Core user interface components
- 6.3: Web3 wallet integration
- 6.4: Maps and location services
- 6.5: Push notifications
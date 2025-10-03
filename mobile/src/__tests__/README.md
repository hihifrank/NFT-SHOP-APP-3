# Mobile App Testing Documentation

This directory contains comprehensive tests for the HK Retail NFT Mobile application, covering UI components, user flows, and integration scenarios.

## Test Structure

### 📁 Components Tests (`/components/`)
Unit tests for individual UI components:
- **Button.test.tsx** ✅ - Tests button interactions, states, styling, and variants
- **NFTCard.test.tsx** ✅ - Tests NFT coupon display, interactions, and status feedback
- **ErrorMessage.test.tsx** ✅ - Tests error display, retry functionality, and different error types
- **Card.test.tsx** - Tests card component rendering and interactions
- **Input.test.tsx** - Tests input validation, error handling, and user input
- **WalletStatusCard.test.tsx** - Tests wallet connection status display
- **TransactionStatusModal.test.tsx** - Tests transaction status and feedback

### 📁 Screens Tests (`/screens/`)
Integration tests for complete screen functionality:
- **HomeScreen.test.tsx** - Tests home screen data display and navigation
- **WalletConnectScreen.test.tsx** - Tests wallet connection flow and error handling

### 📁 Flow Tests (`/flows/`)
End-to-end user journey tests:
- **user-onboarding.test.tsx** - Tests complete onboarding from welcome to wallet connection
- **coupon-usage.test.tsx** - Tests NFT coupon usage flow including transaction processing
- **store-discovery.test.tsx** - Tests store search, filtering, and navigation features
- **language-switching.test.tsx** ✅ - Tests multi-language support and language switching flow
- **nft-status-feedback.test.tsx** ✅ - Tests clear status feedback for NFT operations
- **offline-functionality.test.tsx** ✅ - Tests offline map functionality and cached data access

### 📁 Integration Tests (`/integration/`)
Cross-component and system integration tests:
- **redux-integration.test.ts** - Tests Redux store interactions and state management

## Test Categories

### 🧩 Unit Tests (Components)
- Test individual component behavior
- Mock external dependencies
- Focus on component props, state, and user interactions
- Verify accessibility and styling

### 🔗 Integration Tests (Screens)
- Test screen-level functionality
- Include Redux store integration
- Test navigation between screens
- Verify data flow and error handling

### 🚀 Flow Tests (User Journeys)
- Test complete user workflows
- Simulate real user interactions
- Test cross-screen navigation
- Verify business logic implementation

### 🏗️ System Integration Tests
- Test Redux store management
- Test service layer integration
- Verify error handling across the app
- Test offline functionality

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Categories
```bash
# Component tests only
npm run test:components

# Screen tests only
npm run test:screens

# User flow tests only
npm run test:flows

# Integration tests only
npm run test:integration
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Watch Mode (Development)
```bash
npm run test:watch
```

## Test Requirements Coverage

### Requirement 5.1 (User Experience & Navigation)
✅ **Covered by:**
- `user-onboarding.test.tsx` - Tests first-time user guidance and tutorial
- `language-switching.test.tsx` ✅ - Tests multi-language support (繁體中文, 簡體中文, English)
- `offline-functionality.test.tsx` ✅ - Tests offline map functionality and navigation
- `HomeScreen.test.tsx` - Tests interface simplicity and navigation
- `store-discovery.test.tsx` - Tests map navigation and store discovery

**Test Scenarios:**
- ✅ First-time user onboarding with simple tutorial
- ✅ Language switching (繁體中文, 簡體中文, English) with immediate UI updates
- ✅ Clear map navigation functionality for store viewing
- ✅ Offline map functionality for unstable network conditions
- ✅ Simple interface design suitable for short-term tourists

### Requirement 5.5 (Clear Status Feedback for NFT Operations)
✅ **Covered by:**
- `nft-status-feedback.test.tsx` ✅ - Tests clear status feedback for NFT and coupon operations
- `NFTCard.test.tsx` ✅ - Tests NFT state display and status indicators
- `ErrorMessage.test.tsx` ✅ - Tests error feedback and retry mechanisms
- `offline-functionality.test.tsx` ✅ - Tests offline status indicators

**Test Scenarios:**
- ✅ Clear status feedback during NFT purchase operations
- ✅ Transaction status indicators (pending, confirming, success, error)
- ✅ Visual status colors and icons for different states
- ✅ Transaction hash display when available
- ✅ Retry functionality for failed operations
- ✅ Clear error messaging with actionable feedback

### Performance & Offline Support
✅ **Covered by:**
- `offline-functionality.test.tsx` ✅ - Tests offline mode and cached data access
- `store-discovery.test.tsx` - Tests cached map functionality
- `redux-integration.test.ts` - Tests state management performance
- Component tests - Test loading states and error handling

**Test Scenarios:**
- ✅ Offline store data access with cached information
- ✅ Cached map functionality for network instability
- ✅ Network state transition handling
- ✅ Cache management operations (update/clear)
- Loading state management
- Error recovery mechanisms

## Mock Strategy

### External Services
- **Geolocation** - Mocked to return Hong Kong coordinates
- **Web3/Wallet** - Mocked wallet connections and transactions
- **Firebase** - Mocked push notification services
- **Maps** - Mocked react-native-maps components
- **AsyncStorage** - Mocked for data persistence

### Redux Store
- Uses real Redux store with mocked initial states
- Tests actual state transitions and side effects
- Verifies cross-slice interactions

### Navigation
- Uses NavigationContainer for realistic navigation testing
- Mocks navigation props where needed
- Tests actual screen transitions

## Test Data

### Mock Users
```typescript
const mockUser = {
  id: 'user-123',
  walletAddress: '0x123456789',
  preferredLanguage: 'en'
}
```

### Mock NFT Coupons
```typescript
const mockCoupon = {
  id: 'coupon-123',
  tokenId: '456',
  name: 'Coffee Shop 20% Off',
  discountValue: 20,
  discountType: 'percentage',
  merchantName: 'Central Coffee',
  expiryDate: '2024-12-31',
  isUsed: false
}
```

### Mock Merchants
```typescript
const mockMerchant = {
  id: 'merchant-1',
  name: 'Central Coffee',
  category: 'restaurant',
  latitude: 22.2819,
  longitude: 114.1577,
  isNftParticipant: true
}
```

## Best Practices

### 1. Test Isolation
- Each test is independent and can run in any order
- Proper setup and teardown for each test
- No shared state between tests

### 2. Realistic Testing
- Use actual Redux store instead of mocking everything
- Test real user interactions with fireEvent
- Include proper async/await for state updates

### 3. Accessibility Testing
- Tests include accessibility labels and roles
- Verify screen reader compatibility
- Test keyboard navigation where applicable

### 4. Error Scenarios
- Test network failures and recovery
- Test invalid user input handling
- Test wallet connection failures
- Test transaction errors

### 5. Multilingual Support
- Test language switching functionality
- Verify text rendering in different languages
- Test RTL support where applicable

## Continuous Integration

Tests are designed to run in CI/CD environments:
- No external network dependencies
- Deterministic test results
- Proper timeout handling
- Clear error messages for debugging

## Coverage Goals

- **Components**: 90%+ coverage
- **Screens**: 85%+ coverage
- **User Flows**: 80%+ coverage
- **Integration**: 75%+ coverage

## Troubleshooting

### Common Issues

1. **Metro bundler conflicts**
   - Clear cache: `npx react-native start --reset-cache`

2. **Mock import errors**
   - Ensure all mocks are properly defined in setup.ts
   - Check import paths in test files

3. **Async test failures**
   - Use proper waitFor() for async operations
   - Increase timeout for slow operations

4. **Redux state issues**
   - Verify initial state structure matches slice definitions
   - Check action creators are properly mocked

### Debug Tips

1. Use `screen.debug()` to see rendered component tree
2. Add `console.log(store.getState())` to inspect Redux state
3. Use `--verbose` flag for detailed test output
4. Check test coverage report for missed scenarios
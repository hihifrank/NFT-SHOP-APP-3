# End-to-End Testing Suite

This directory contains comprehensive end-to-end tests for the HK Retail NFT Platform, covering complete user journeys, cross-platform compatibility, and performance testing.

## Test Suites

### 1. User Journey Tests (`user-journey.test.ts`)

Tests the complete user flow from registration to coupon usage:

- **User Registration & Authentication**
  - Wallet connection (MetaMask, WalletConnect)
  - Digital signature verification
  - JWT token management
  - User profile management

- **Merchant Registration & Store Setup**
  - Merchant account creation
  - Store profile configuration
  - NFT participation setup

- **Store Discovery & Search**
  - Geolocation-based store finding
  - Category-based filtering
  - Store details retrieval

- **NFT Coupon Lifecycle**
  - Coupon creation by merchants
  - NFT minting and metadata storage
  - Coupon purchase by users
  - NFT ownership and transfers
  - Coupon usage and redemption
  - NFT recycling system

- **Lottery System**
  - Lottery creation and configuration
  - User participation
  - Random winner selection
  - Prize distribution

- **Multi-language Support**
  - Language switching
  - Localized content delivery
  - Character encoding (Chinese, English)

- **Real-time Communication**
  - Socket.IO connections
  - Live notifications
  - Event broadcasting

- **Security & Privacy**
  - Authentication validation
  - GDPR compliance (data export/deletion)
  - Privacy protection measures

### 2. Cross-Platform Compatibility Tests (`cross-platform.test.ts`)

Ensures the platform works across different devices and environments:

- **Mobile App Compatibility**
  - iOS app integration
  - Android app integration
  - Mobile-specific headers and features

- **Web Browser Support**
  - Chrome, Firefox, Safari compatibility
  - Different operating systems
  - Various screen resolutions

- **API Version Management**
  - Version compatibility
  - Backward compatibility
  - Deprecation handling

- **Content-Type Support**
  - JSON requests/responses
  - Form-encoded data
  - File uploads

- **Character Encoding**
  - UTF-8 support
  - Chinese character handling
  - Emoji support

- **Network Conditions**
  - Slow network simulation
  - Timeout handling
  - Offline capability

- **Geolocation Compatibility**
  - Different coordinate formats
  - GPS accuracy variations
  - Location permission handling

- **Wallet Integration**
  - Multiple wallet types
  - Different blockchain networks
  - Signature format variations

### 3. Performance & Load Tests (`performance.test.ts`)

Validates system performance under various conditions:

- **Response Time Benchmarks**
  - Health check: < 100ms
  - Store search: < 500ms
  - Coupon listing: < 1000ms

- **Concurrent Request Handling**
  - 10 concurrent health checks
  - 20 concurrent store searches
  - Mixed request types

- **Memory Management**
  - Memory leak detection
  - Large payload handling
  - Garbage collection efficiency

- **Database Performance**
  - Query optimization
  - Geospatial query efficiency
  - Connection pooling

- **Cache Performance**
  - Cache hit/miss ratios
  - Cache invalidation
  - Response time improvements

- **Rate Limiting**
  - Limit enforcement
  - Window reset behavior
  - Fair usage policies

- **Stress Testing**
  - Sustained load handling
  - Recovery from high load
  - Resource usage limits

## Running the Tests

### Prerequisites

1. **Environment Setup**
   ```bash
   # Set test environment
   export NODE_ENV=test
   
   # Install dependencies
   npm install
   
   # Setup test database
   npm run db:setup:test
   ```

2. **Configuration**
   - Copy `.env.example` to `.env.test`
   - Configure test database connection
   - Set up test blockchain network (Hardhat local)

### Running Individual Test Suites

```bash
# Run user journey tests
npm run test:e2e:journey

# Run cross-platform tests
npm run test:e2e:platform

# Run performance tests
npm run test:e2e:performance
```

### Running All E2E Tests

```bash
# Run complete E2E test suite
npm run test:e2e

# Run with custom test runner
node src/__tests__/e2e/test-runner.js
```

### Running with Coverage

```bash
# Run E2E tests with coverage report
npm run test:e2e:coverage
```

## Test Configuration

### Jest Configuration

```javascript
// jest.e2e.config.js
module.exports = {
  testMatch: ['**/e2e/**/*.test.ts'],
  testTimeout: 300000, // 5 minutes
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/__tests__/**'
  ]
};
```

### Environment Variables

```bash
# Test Environment
NODE_ENV=test
LOG_LEVEL=error

# Test Database
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/test_db
TEST_REDIS_URL=redis://localhost:6379/1

# Test Blockchain
TEST_BLOCKCHAIN_URL=http://localhost:8545
TEST_PRIVATE_KEY=0x...

# Test Services
TEST_IPFS_URL=http://localhost:5001
TEST_SOCKET_PORT=3001
```

## Test Data Management

### Test Fixtures

The tests use predefined test data for consistent results:

- **Test Users**: Pre-created wallet addresses and signatures
- **Test Merchants**: Sample store data with various categories
- **Test Coupons**: Different coupon types and configurations
- **Test Locations**: Hong Kong coordinates for geolocation tests

### Database Seeding

```bash
# Seed test database with sample data
npm run db:seed:test

# Reset test database
npm run db:reset:test
```

### Cleanup

Tests automatically clean up after themselves, but you can manually reset:

```bash
# Clean test data
npm run test:cleanup

# Reset all test environments
npm run test:reset
```

## Continuous Integration

### GitHub Actions Integration

The E2E tests are integrated into the CI/CD pipeline:

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run E2E tests
        run: npm run test:e2e
```

### Test Reports

Test results are automatically generated and stored:

- **JSON Report**: `test-reports/e2e-report.json`
- **Coverage Report**: `coverage/e2e/`
- **Performance Metrics**: `test-reports/performance.json`

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check database status
   pg_isready -h localhost -p 5432
   
   # Restart database
   sudo service postgresql restart
   ```

2. **Port Conflicts**
   ```bash
   # Check port usage
   lsof -i :3000
   
   # Kill processes using port
   kill -9 $(lsof -t -i:3000)
   ```

3. **Memory Issues**
   ```bash
   # Increase Node.js memory limit
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

4. **Timeout Issues**
   ```bash
   # Increase test timeout
   export JEST_TIMEOUT=600000
   ```

### Debug Mode

Run tests in debug mode for detailed output:

```bash
# Enable debug logging
DEBUG=* npm run test:e2e

# Run specific test with debugging
npx jest --detectOpenHandles --forceExit src/__tests__/e2e/user-journey.test.ts
```

### Performance Monitoring

Monitor test performance:

```bash
# Run with performance profiling
node --prof src/__tests__/e2e/test-runner.js

# Analyze performance
node --prof-process isolate-*.log > performance-analysis.txt
```

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on others
2. **Data Cleanup**: Always clean up test data after each test
3. **Realistic Scenarios**: Use realistic user flows and data
4. **Error Handling**: Test both success and failure scenarios
5. **Performance Awareness**: Monitor test execution times
6. **Documentation**: Keep test documentation up to date

## Contributing

When adding new E2E tests:

1. Follow the existing test structure
2. Add appropriate documentation
3. Ensure tests are deterministic
4. Include both positive and negative test cases
5. Update this README if adding new test categories
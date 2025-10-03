# Socket.io Real-time Communication Tests

## Overview

This test suite provides comprehensive coverage for the Socket.io real-time communication functionality in the HK Retail NFT Platform. The tests verify Socket.io connection handling, message passing, room management, and API integration as required by specifications 3.4 and 7.4.

## Test Files

### 1. `socket-service.test.ts` - Core Socket Service Tests

**Purpose**: Tests the core SocketService functionality including connection management, authentication, and broadcasting methods.

**Test Coverage**:
- ✅ Socket.io connection establishment with JWT authentication
- ✅ Connection rejection for invalid/missing tokens
- ✅ User connection tracking and status management
- ✅ Room management (join/leave lottery, location, merchant rooms)
- ✅ Message passing between client and server
- ✅ Ping-pong health check mechanism
- ✅ Broadcasting to specific rooms and users
- ✅ Multi-client communication scenarios
- ✅ Error handling for malformed events
- ✅ Connection resilience and reconnection
- ✅ Performance under high-frequency messaging

**Key Test Scenarios**:
```typescript
// Authentication Tests
- Valid JWT token → Connection accepted
- Invalid JWT token → Connection rejected
- Missing token → Connection rejected

// Room Management Tests
- Join lottery room → Receive lottery updates
- Join location room → Receive location-based promotions
- Join merchant room → Receive merchant-specific updates
- Leave rooms → Stop receiving updates

// Message Broadcasting Tests
- Lottery events → All participants receive updates
- Promotion broadcasts → Location/merchant-specific targeting
- System notifications → All users or targeted users
- Direct messages → Specific user receives message
```

### 2. `socket-api-integration.test.ts` - REST API Integration Tests

**Purpose**: Tests the REST API endpoints that trigger Socket.io broadcasts and manage real-time communication.

**Test Coverage**:
- ✅ Lottery broadcasting API endpoints
- ✅ Promotion broadcasting API endpoints
- ✅ Notification sending API endpoints
- ✅ Direct user messaging API endpoints
- ✅ Socket statistics and monitoring APIs
- ✅ Room management APIs
- ✅ User connection status APIs
- ✅ System message broadcasting APIs
- ✅ API parameter validation and error handling
- ✅ Concurrent API operations

**API Endpoints Tested**:
```http
POST /api/v1/socket/lottery/broadcast     # Broadcast lottery events
POST /api/v1/socket/promotion/broadcast   # Broadcast promotions
POST /api/v1/socket/notification/send     # Send notifications
POST /api/v1/socket/user/send            # Send direct messages
GET  /api/v1/socket/stats                # Get connection statistics
GET  /api/v1/socket/room/:roomName/users # Get room users
GET  /api/v1/socket/user/:userId/status  # Check user connection
POST /api/v1/socket/system/broadcast     # Broadcast system messages
```

### 3. `socket-e2e.test.ts` - End-to-End Real-time Scenarios

**Purpose**: Tests complete real-world scenarios that simulate actual platform usage patterns.

**Test Coverage**:
- ✅ Complete lottery draw process with real-time updates
- ✅ Location-based promotion broadcasting
- ✅ Multi-user notification scenarios
- ✅ Merchant-specific promotion updates
- ✅ System-wide maintenance notifications
- ✅ Targeted VIP user notifications
- ✅ Connection resilience and error recovery
- ✅ Performance with multiple concurrent rooms
- ✅ Scalability with mixed room types

**Real-world Scenarios**:
```typescript
// Lottery Draw Flow
1. Multiple users join lottery room
2. Broadcast "draw_started" → All participants notified
3. Broadcast "draw_completed" → Processing complete
4. Broadcast "winner_announced" → Winners revealed
5. Send individual winner notifications

// Location-based Promotions
1. Users join location-specific rooms (Central HK, Causeway Bay)
2. Merchant broadcasts promotion for Central area only
3. Only Central users receive promotion
4. Causeway Bay users don't receive irrelevant promotions

// System Maintenance
1. Multiple users connected to platform
2. Broadcast system maintenance notification
3. All users receive notification simultaneously
4. Targeted notifications sent to VIP users only
```

## Test Requirements Verification

### Requirement 3.4 - Lottery Real-time Updates
- ✅ **Draw Started**: Verified lottery participants receive real-time draw start notifications
- ✅ **Draw Completed**: Confirmed processing completion broadcasts reach all participants
- ✅ **Winner Announced**: Tested winner announcement broadcasting to lottery rooms
- ✅ **Individual Notifications**: Verified direct winner notifications via `sendToUser`
- ✅ **Random Verification**: Tested lottery fairness through verifiable random functions

### Requirement 7.4 - Merchant Promotion Broadcasting
- ✅ **Location-based Targeting**: Verified promotions reach users in specific geographic areas
- ✅ **Merchant-specific Updates**: Confirmed followers receive merchant room updates
- ✅ **Flash Sales**: Tested urgent promotion broadcasting with time-sensitive offers
- ✅ **System Notifications**: Verified platform-wide announcements reach all users
- ✅ **Real-time Delivery**: Confirmed immediate message delivery without delays

## Test Data and Scenarios

### Authentication Tokens
```typescript
// Valid JWT token for testing
const validToken = jwt.sign(
  { userId: 'test-user-123', walletAddress: '0x123...abc' },
  'test-secret',
  { expiresIn: '1h' }
);

// Invalid token for error testing
const invalidToken = 'invalid.token.here';
```

### Geographic Locations (Hong Kong)
```typescript
// Central District
const centralLocation = { 
  latitude: 22.2783, 
  longitude: 114.1747, 
  radius: 500 
};

// Causeway Bay
const causewayBayLocation = { 
  latitude: 22.2793, 
  longitude: 114.1847, 
  radius: 500 
};
```

### Room Types Tested
- **User Rooms**: `user:{userId}` - Personal notifications
- **Lottery Rooms**: `lottery:{lotteryId}` - Lottery-specific updates
- **Location Rooms**: `location:{lat}_{lng}_{radius}` - Geographic targeting
- **Merchant Rooms**: `merchant:{merchantId}` - Merchant-specific updates

## Performance Benchmarks

### Connection Handling
- ✅ **Multiple Connections**: Supports multiple simultaneous connections per user
- ✅ **Connection Tracking**: Accurately tracks connected user count
- ✅ **Reconnection**: Handles client reconnection gracefully
- ✅ **Cleanup**: Properly cleans up disconnected users

### Message Broadcasting
- ✅ **High Frequency**: Handles 50+ messages per second per user
- ✅ **Concurrent Rooms**: Manages 10+ lottery rooms with 3+ users each
- ✅ **Mixed Operations**: Processes lottery, promotion, and notification broadcasts simultaneously
- ✅ **Targeted Delivery**: Efficiently delivers messages to specific user subsets

### Error Resilience
- ✅ **Malformed Data**: Gracefully handles invalid event data
- ✅ **Network Issues**: Maintains server stability during client disconnections
- ✅ **Authentication Failures**: Properly rejects unauthorized connections
- ✅ **Resource Cleanup**: Prevents memory leaks from abandoned connections

## Running the Tests

### Prerequisites
```bash
# Install dependencies (including socket.io-client for testing)
npm install

# Ensure socket.io-client is in devDependencies
npm install --save-dev socket.io-client@^4.7.4
```

### Execute Tests
```bash
# Run all Socket.io tests
npm test -- --testPathPattern="socket.*test\.ts"

# Run specific test files
npm test src/__tests__/socket-service.test.ts
npm test src/__tests__/socket-api-integration.test.ts
npm test src/__tests__/socket-e2e.test.ts

# Run with verbose output
npm test -- --verbose --testPathPattern="socket.*test\.ts"

# Run with coverage
npm test -- --coverage --testPathPattern="socket.*test\.ts"
```

### Test Configuration
```javascript
// jest.config.js
module.exports = {
  testTimeout: 10000,        // 10 second timeout for Socket.io tests
  forceExit: true,          // Force exit after tests complete
  detectOpenHandles: true,  // Detect open handles (Socket connections)
};
```

## Test Results Interpretation

### Success Criteria
- ✅ All authentication scenarios pass
- ✅ Room management works correctly
- ✅ Message broadcasting reaches intended recipients
- ✅ API endpoints respond correctly
- ✅ Error handling prevents crashes
- ✅ Performance benchmarks are met

### Common Issues and Solutions

**Issue**: `Cannot find module 'socket.io-client'`
**Solution**: Install socket.io-client as dev dependency
```bash
npm install --save-dev socket.io-client@^4.7.4
```

**Issue**: Tests timeout or hang
**Solution**: Ensure proper cleanup in test teardown
```typescript
afterEach(() => {
  if (clientSocket && clientSocket.connected) {
    clientSocket.disconnect();
  }
});
```

**Issue**: JWT token errors
**Solution**: Verify config.jwtSecret is properly set
```typescript
const config = {
  jwtSecret: process.env.JWT_SECRET || 'test-secret-for-socket-tests'
};
```

## Integration with Platform Features

### Lottery System Integration
- Tests verify lottery draw process triggers real-time updates
- Confirms winner notifications are sent immediately
- Validates random number generation and fairness

### Merchant Promotion System
- Tests location-based promotion targeting
- Verifies merchant-specific update delivery
- Confirms flash sale urgency handling

### User Notification System
- Tests system-wide announcements
- Verifies targeted user notifications
- Confirms maintenance message broadcasting

## Security Testing

### Authentication Security
- ✅ JWT token validation prevents unauthorized access
- ✅ Invalid tokens are properly rejected
- ✅ Token expiration is handled correctly

### Data Validation
- ✅ Malformed event data doesn't crash server
- ✅ Invalid room names are handled gracefully
- ✅ User input is properly sanitized

### Rate Limiting (Future Enhancement)
- Consider implementing rate limiting for broadcast endpoints
- Monitor connection counts and implement limits if needed
- Add request validation for API endpoints

## Monitoring and Debugging

### Debug Mode
Enable Socket.io debug logging:
```javascript
// Client-side debugging
localStorage.debug = 'socket.io-client:socket';

// Server-side debugging
DEBUG=socket.io:* npm test
```

### Statistics Monitoring
```typescript
// Get real-time statistics
const stats = await socketService.getConnectedUsersCount();
const roomUsers = await socketService.getUsersInRoom('lottery:123');
const isConnected = socketService.isUserConnected('user-123');
```

### Health Checks
```typescript
// Ping-pong mechanism for connection health
client.emit('ping');
client.on('pong', (data) => {
  console.log('Connection healthy:', data.timestamp);
});
```

This comprehensive test suite ensures the Socket.io real-time communication system meets all requirements and performs reliably under various conditions, providing confidence in the platform's real-time capabilities for lottery updates and merchant promotions.
# Socket.io Real-time Communication Integration

## Overview

The HK Retail NFT Platform includes a comprehensive Socket.io service for real-time communication, enabling instant updates for lottery results, merchant promotions, and system notifications.

## Features

### 1. Real-time Lottery Updates
- **Draw Started**: Notifies all participants when a lottery draw begins
- **Draw Completed**: Announces when the draw process is finished
- **Winner Announced**: Broadcasts winner results to all participants
- **Individual Winner Notifications**: Direct messages to winners

### 2. Merchant Promotion Broadcasting
- **Location-based Promotions**: Target users within specific geographic areas
- **Flash Sales**: Urgent notifications for time-limited offers
- **New Promotions**: General promotion announcements
- **Merchant-specific Updates**: Updates for users following specific merchants

### 3. System Notifications
- **System Messages**: Maintenance announcements and system updates
- **User-specific Notifications**: Direct messages to individual users
- **Broadcast Notifications**: Platform-wide announcements

## Architecture

### Server Components

#### SocketService
Main service class that manages WebSocket connections and broadcasting.

```typescript
// Global access to socket service
global.socketService.broadcastLotteryEvent({
  lotteryId: 'lottery-123',
  type: 'winner_announced',
  data: { winners: [...] },
  timestamp: new Date()
});
```

#### SocketController
REST API endpoints for triggering broadcasts and managing socket operations.

#### Room Management
- **User Rooms**: `user:{userId}` - Personal notifications
- **Lottery Rooms**: `lottery:{lotteryId}` - Lottery-specific updates
- **Location Rooms**: `location:{lat}_{lng}_{radius}` - Geographic targeting
- **Merchant Rooms**: `merchant:{merchantId}` - Merchant-specific updates

### Client Integration

#### Authentication
Clients must provide a valid JWT token for connection:

```javascript
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

#### Event Listeners

```javascript
// Connection events
socket.on('connected', (data) => {
  console.log('Connected:', data.message);
});

// Lottery events
socket.on('lottery_update', (data) => {
  console.log('Lottery update:', data.type, data.data);
});

// Promotion events
socket.on('promotion_update', (data) => {
  console.log('New promotion:', data.title, data.description);
});

// Notifications
socket.on('notification', (data) => {
  console.log('Notification:', data.title, data.message);
});

// System messages
socket.on('system_message', (data) => {
  console.log('System:', data.type, data.message);
});
```

#### Room Management

```javascript
// Join lottery room for real-time updates
socket.emit('join_lottery', { lotteryId: 'lottery-123' });

// Join location-based room for nearby promotions
socket.emit('join_location', { 
  latitude: 22.3193, 
  longitude: 114.1694, 
  radius: 1000 
});

// Join merchant room for specific merchant updates
socket.emit('join_merchant', { merchantId: 'merchant-456' });

// Leave rooms when no longer needed
socket.emit('leave_lottery', { lotteryId: 'lottery-123' });
socket.emit('leave_location', { latitude: 22.3193, longitude: 114.1694, radius: 1000 });
socket.emit('leave_merchant', { merchantId: 'merchant-456' });
```

## API Endpoints

### Lottery Broadcasting
```http
POST /api/v1/socket/lottery/broadcast
Content-Type: application/json

{
  "lotteryId": "lottery-123",
  "type": "draw_started",
  "data": {
    "lotteryName": "Weekly Lucky Draw",
    "totalParticipants": 150
  }
}
```

### Promotion Broadcasting
```http
POST /api/v1/socket/promotion/broadcast
Content-Type: application/json

{
  "merchantId": "merchant-456",
  "type": "flash_sale",
  "title": "Flash Sale - 50% Off!",
  "description": "Limited time offer on all items",
  "location": {
    "latitude": 22.3193,
    "longitude": 114.1694,
    "radius": 1000
  },
  "data": {
    "discount": 50,
    "validUntil": "2024-01-01T23:59:59Z"
  }
}
```

### Notification Sending
```http
POST /api/v1/socket/notification/send
Content-Type: application/json

{
  "type": "system",
  "title": "System Maintenance",
  "message": "Platform will be under maintenance from 2-4 AM",
  "targetUsers": ["user-123", "user-456"],
  "data": {
    "maintenanceStart": "2024-01-01T02:00:00Z",
    "maintenanceEnd": "2024-01-01T04:00:00Z"
  }
}
```

### Socket Statistics
```http
GET /api/v1/socket/stats

Response:
{
  "success": true,
  "data": {
    "connectedUsers": 1250,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

## Integration Examples

### Lottery Service Integration

The LotteryService automatically broadcasts events during the draw process:

```typescript
// In LotteryService.drawWinners()
if (global.socketService) {
  // Broadcast draw started
  global.socketService.broadcastLotteryEvent({
    lotteryId,
    type: 'draw_started',
    data: { lotteryName: lottery.name },
    timestamp: new Date()
  });

  // ... draw process ...

  // Broadcast winners
  global.socketService.broadcastLotteryEvent({
    lotteryId,
    type: 'winner_announced',
    data: { winners },
    timestamp: new Date()
  });
}
```

### Promotion Service Integration

```typescript
import { PromotionService } from '../services/PromotionService';

// Create and broadcast promotion
await PromotionService.createPromotion({
  merchantId: 'merchant-123',
  type: 'flash_sale',
  title: 'Flash Sale!',
  description: '50% off all items',
  validFrom: new Date(),
  validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
  broadcastImmediately: true
});

// Send location-based promotion
await PromotionService.broadcastLocationBasedPromotion(
  'merchant-123',
  'Welcome Nearby Customers!',
  '20% discount for customers within 500m',
  { latitude: 22.3193, longitude: 114.1694, radius: 500 }
);
```

## Mobile App Integration

### React Native Socket.io Client

```javascript
import io from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    this.socket = io('ws://your-server.com', {
      auth: { token },
      transports: ['websocket']
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('connected', (data) => {
      console.log('Connected to server');
    });

    this.socket.on('lottery_update', (data) => {
      // Update lottery UI
      this.handleLotteryUpdate(data);
    });

    this.socket.on('promotion_update', (data) => {
      // Show promotion notification
      this.showPromotionNotification(data);
    });

    this.socket.on('notification', (data) => {
      // Show push notification
      this.showPushNotification(data);
    });
  }

  joinLottery(lotteryId) {
    this.socket.emit('join_lottery', { lotteryId });
  }

  joinLocationUpdates(latitude, longitude, radius = 1000) {
    this.socket.emit('join_location', { latitude, longitude, radius });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
```

## Security Considerations

### Authentication
- All connections require valid JWT tokens
- Tokens are verified on connection and contain user information
- Invalid tokens result in connection rejection

### Rate Limiting
- Consider implementing rate limiting for broadcast endpoints
- Monitor connection counts and implement connection limits if needed

### Data Validation
- All broadcast data is validated before transmission
- Malformed requests are rejected with appropriate error messages

## Performance Considerations

### Scaling
- Socket.io supports clustering with Redis adapter for horizontal scaling
- Consider implementing Redis adapter for multi-server deployments

### Room Management
- Automatic cleanup of empty rooms
- Efficient room joining/leaving to minimize memory usage

### Broadcasting Optimization
- Location-based rooms use rounded coordinates to group nearby users
- Targeted broadcasting reduces unnecessary network traffic

## Monitoring and Debugging

### Statistics Endpoint
Use `/api/v1/socket/stats` to monitor:
- Connected user count
- Active rooms
- Message throughput

### Logging
- Connection/disconnection events are logged
- Broadcast events include recipient counts
- Error conditions are logged with context

### Health Checks
- Ping/pong mechanism for connection health
- Automatic reconnection handling on client side

## Testing

### Unit Tests
The Socket.io service includes comprehensive unit tests covering:
- Connection authentication
- Room management
- Event broadcasting
- Error handling

### Integration Tests
Test real-time communication flows:
- Lottery draw process
- Promotion broadcasting
- Notification delivery

Run tests with:
```bash
npm test -- --testPathPattern=socket-service.test.ts
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check JWT token validity
   - Verify server is running and accessible
   - Check CORS configuration

2. **Events Not Received**
   - Ensure client is in correct room
   - Check event name spelling
   - Verify server-side broadcasting

3. **Performance Issues**
   - Monitor connected user count
   - Check room membership efficiency
   - Consider implementing connection limits

### Debug Mode
Enable debug logging:
```javascript
localStorage.debug = 'socket.io-client:socket';
```

This comprehensive Socket.io integration provides real-time communication capabilities essential for the lottery system and merchant promotions, enhancing user engagement and platform interactivity.
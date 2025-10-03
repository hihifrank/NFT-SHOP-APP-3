import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import SocketService from '../services/SocketService';
import config from '../config';

describe('Real-time Communication Tests', () => {
  let httpServer: any;
  let socketService: SocketService;
  let serverPort: number;
  let clientSocket: ClientSocket;
  let clientSocket2: ClientSocket;
  let validToken: string;
  let invalidToken: string;

  beforeAll((done) => {
    // Create HTTP server
    httpServer = createServer();
    socketService = new SocketService(httpServer);
    
    // Generate test tokens
    validToken = jwt.sign(
      { userId: 'test-user-123', walletAddress: '0x123...abc' },
      config.jwtSecret || 'test-secret',
      { expiresIn: '1h' }
    );
    
    invalidToken = 'invalid.token.here';

    // Start server on random port
    httpServer.listen(() => {
      serverPort = (httpServer.address() as any).port;
      done();
    });
  });

  afterAll((done) => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    if (clientSocket2 && clientSocket2.connected) {
      clientSocket2.disconnect();
    }
    if (httpServer) {
      httpServer.close(done);
    } else {
      done();
    }
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    if (clientSocket2 && clientSocket2.connected) {
      clientSocket2.disconnect();
    }
  });

  describe('Socket.io Connection Tests', () => {
    it('should initialize SocketService successfully', () => {
      expect(socketService).toBeDefined();
      expect(socketService.getIO()).toBeDefined();
      expect(socketService.getIO()).toBeInstanceOf(SocketIOServer);
    });

    it('should reject connection without authentication token', (done) => {
      clientSocket = Client(`http://localhost:${serverPort}`, {
        autoConnect: false,
      });

      clientSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication token required');
        done();
      });

      clientSocket.connect();
    });

    it('should reject connection with invalid authentication token', (done) => {
      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: invalidToken },
        autoConnect: false,
      });

      clientSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Invalid authentication token');
        done();
      });

      clientSocket.connect();
    });

    it('should accept connection with valid authentication token', (done) => {
      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: validToken },
        autoConnect: false,
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        expect(socketService.getConnectedUsersCount()).toBe(1);
        expect(socketService.isUserConnected('test-user-123')).toBe(true);
        done();
      });

      clientSocket.on('connected', (data) => {
        expect(data.message).toContain('Successfully connected');
        expect(data.userId).toBe('test-user-123');
        expect(data.timestamp).toBeDefined();
      });

      clientSocket.connect();
    });

    it('should handle multiple connections from same user', (done) => {
      let connectCount = 0;
      
      const handleConnect = () => {
        connectCount++;
        if (connectCount === 2) {
          expect(socketService.getConnectedUsersCount()).toBe(2);
          expect(socketService.isUserConnected('test-user-123')).toBe(true);
          done();
        }
      };

      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: validToken },
      });

      clientSocket2 = Client(`http://localhost:${serverPort}`, {
        auth: { token: validToken },
      });

      clientSocket.on('connect', handleConnect);
      clientSocket2.on('connect', handleConnect);
    });

    it('should handle disconnection properly', (done) => {
      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: validToken },
      });

      clientSocket.on('connect', () => {
        expect(socketService.getConnectedUsersCount()).toBe(1);
        clientSocket.disconnect();
      });

      clientSocket.on('disconnect', () => {
        // Give some time for cleanup
        setTimeout(() => {
          expect(socketService.getConnectedUsersCount()).toBe(0);
          expect(socketService.isUserConnected('test-user-123')).toBe(false);
          done();
        }, 100);
      });
    });
  });

  describe('Message Passing Tests', () => {
    beforeEach((done) => {
      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: validToken },
      });
      clientSocket.on('connect', () => done());
    });

    it('should handle ping-pong messages', (done) => {
      clientSocket.emit('ping');
      
      clientSocket.on('pong', (data) => {
        expect(data.timestamp).toBeDefined();
        expect(new Date(data.timestamp)).toBeInstanceOf(Date);
        done();
      });
    });

    it('should receive lottery updates when joined to lottery room', (done) => {
      const lotteryId = 'lottery-test-123';
      
      clientSocket.emit('join_lottery', { lotteryId });
      
      clientSocket.on('joined_room', (data) => {
        expect(data.room).toBe(`lottery:${lotteryId}`);
        
        // Broadcast lottery event
        socketService.broadcastLotteryEvent({
          lotteryId,
          type: 'draw_started',
          data: { message: 'Draw has started!' },
          timestamp: new Date()
        });
      });

      clientSocket.on('lottery_update', (data) => {
        expect(data.lotteryId).toBe(lotteryId);
        expect(data.type).toBe('draw_started');
        expect(data.data.message).toBe('Draw has started!');
        expect(data.timestamp).toBeDefined();
        done();
      });
    });

    it('should not receive lottery updates when not in lottery room', (done) => {
      const lotteryId = 'lottery-test-456';
      let receivedUpdate = false;
      
      clientSocket.on('lottery_update', () => {
        receivedUpdate = true;
      });

      // Broadcast without joining room
      socketService.broadcastLotteryEvent({
        lotteryId,
        type: 'draw_started',
        data: { message: 'Draw has started!' },
        timestamp: new Date()
      });

      // Wait and check that no update was received
      setTimeout(() => {
        expect(receivedUpdate).toBe(false);
        done();
      }, 200);
    });

    it('should receive promotion updates when in location room', (done) => {
      const latitude = 22.3193;
      const longitude = 114.1694;
      const radius = 1000;
      
      clientSocket.emit('join_location', { latitude, longitude, radius });
      
      clientSocket.on('joined_room', (data) => {
        expect(data.room).toBe(`location:${latitude.toFixed(3)}_${longitude.toFixed(3)}_${radius}`);
        
        // Broadcast promotion
        socketService.broadcastPromotion({
          merchantId: 'merchant-123',
          type: 'flash_sale',
          title: 'Flash Sale!',
          description: 'Limited time offer',
          location: { latitude, longitude, radius },
          data: { discount: 50 },
          timestamp: new Date()
        });
      });

      clientSocket.on('promotion_update', (data) => {
        expect(data.merchantId).toBe('merchant-123');
        expect(data.type).toBe('flash_sale');
        expect(data.title).toBe('Flash Sale!');
        expect(data.location).toEqual({ latitude, longitude, radius });
        done();
      });
    });

    it('should receive direct user notifications', (done) => {
      const userId = 'test-user-123';
      
      clientSocket.on('notification', (data) => {
        expect(data.type).toBe('system');
        expect(data.title).toBe('Personal Message');
        expect(data.message).toBe('This is a direct message');
        expect(data.timestamp).toBeDefined();
        done();
      });

      // Send notification to specific user
      socketService.sendNotification({
        type: 'system',
        title: 'Personal Message',
        message: 'This is a direct message',
        targetUsers: [userId],
        timestamp: new Date()
      });
    });

    it('should receive broadcast notifications', (done) => {
      clientSocket.on('notification', (data) => {
        expect(data.type).toBe('system');
        expect(data.title).toBe('System Announcement');
        expect(data.message).toBe('Platform maintenance scheduled');
        done();
      });

      // Send broadcast notification
      socketService.sendNotification({
        type: 'system',
        title: 'System Announcement',
        message: 'Platform maintenance scheduled',
        timestamp: new Date()
      });
    });

    it('should receive system messages', (done) => {
      clientSocket.on('system_message', (data) => {
        expect(data.type).toBe('warning');
        expect(data.message).toBe('System maintenance in progress');
        expect(data.timestamp).toBeDefined();
        done();
      });

      socketService.broadcastSystemMessage('System maintenance in progress', 'warning');
    });

    it('should receive direct messages via sendToUser', (done) => {
      const eventName = 'custom_event';
      const eventData = { message: 'Hello user!', data: { custom: true } };
      
      clientSocket.on(eventName, (data) => {
        expect(data.message).toBe('Hello user!');
        expect(data.data.custom).toBe(true);
        done();
      });

      socketService.sendToUser('test-user-123', eventName, eventData);
    });
  });

  describe('Room Management Tests', () => {
    beforeEach((done) => {
      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: validToken },
      });
      clientSocket.on('connect', () => done());
    });

    it('should join and leave lottery rooms', (done) => {
      const lotteryId = 'lottery-room-test';
      let joinedReceived = false;
      let leftReceived = false;
      
      clientSocket.on('joined_room', (data) => {
        expect(data.room).toBe(`lottery:${lotteryId}`);
        expect(data.message).toContain('Joined lottery room');
        joinedReceived = true;
        
        // Leave the room
        clientSocket.emit('leave_lottery', { lotteryId });
      });

      clientSocket.on('left_room', (data) => {
        expect(data.room).toBe(`lottery:${lotteryId}`);
        expect(data.message).toContain('Left lottery room');
        leftReceived = true;
        
        if (joinedReceived && leftReceived) {
          done();
        }
      });

      clientSocket.emit('join_lottery', { lotteryId });
    });

    it('should join and leave location rooms', (done) => {
      const location = { latitude: 22.3193, longitude: 114.1694, radius: 1000 };
      let joinedReceived = false;
      let leftReceived = false;
      
      clientSocket.on('joined_room', (data) => {
        expect(data.room).toBe(`location:${location.latitude.toFixed(3)}_${location.longitude.toFixed(3)}_${location.radius}`);
        expect(data.message).toContain('Joined location-based room');
        joinedReceived = true;
        
        // Leave the room
        clientSocket.emit('leave_location', location);
      });

      clientSocket.on('left_room', (data) => {
        expect(data.room).toBe(`location:${location.latitude.toFixed(3)}_${location.longitude.toFixed(3)}_${location.radius}`);
        expect(data.message).toContain('Left location-based room');
        leftReceived = true;
        
        if (joinedReceived && leftReceived) {
          done();
        }
      });

      clientSocket.emit('join_location', location);
    });

    it('should join and leave merchant rooms', (done) => {
      const merchantId = 'merchant-room-test';
      let joinedReceived = false;
      let leftReceived = false;
      
      clientSocket.on('joined_room', (data) => {
        expect(data.room).toBe(`merchant:${merchantId}`);
        expect(data.message).toContain('Joined merchant room');
        joinedReceived = true;
        
        // Leave the room
        clientSocket.emit('leave_merchant', { merchantId });
      });

      clientSocket.on('left_room', (data) => {
        expect(data.room).toBe(`merchant:${merchantId}`);
        expect(data.message).toContain('Left merchant room');
        leftReceived = true;
        
        if (joinedReceived && leftReceived) {
          done();
        }
      });

      clientSocket.emit('join_merchant', { merchantId });
    });

    it('should get users in room correctly', async () => {
      const lotteryId = 'lottery-users-test';
      
      // Join lottery room
      clientSocket.emit('join_lottery', { lotteryId });
      
      // Wait for join to complete
      await new Promise(resolve => {
        clientSocket.on('joined_room', resolve);
      });

      // Check users in room
      const users = await socketService.getUsersInRoom(`lottery:${lotteryId}`);
      expect(users).toContain('test-user-123');
    });
  });

  describe('Multi-client Communication Tests', () => {
    beforeEach((done) => {
      let connectCount = 0;
      
      const handleConnect = () => {
        connectCount++;
        if (connectCount === 2) {
          done();
        }
      };

      // Create two client connections
      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: validToken },
      });

      const secondUserToken = jwt.sign(
        { userId: 'test-user-456', walletAddress: '0x456...def' },
        config.jwtSecret || 'test-secret',
        { expiresIn: '1h' }
      );

      clientSocket2 = Client(`http://localhost:${serverPort}`, {
        auth: { token: secondUserToken },
      });

      clientSocket.on('connect', handleConnect);
      clientSocket2.on('connect', handleConnect);
    });

    it('should broadcast to multiple clients in same room', (done) => {
      const lotteryId = 'multi-client-lottery';
      let client1Received = false;
      let client2Received = false;
      
      const checkCompletion = () => {
        if (client1Received && client2Received) {
          done();
        }
      };

      // Both clients join the same lottery room
      clientSocket.emit('join_lottery', { lotteryId });
      clientSocket2.emit('join_lottery', { lotteryId });

      clientSocket.on('lottery_update', (data) => {
        expect(data.lotteryId).toBe(lotteryId);
        expect(data.type).toBe('winner_announced');
        client1Received = true;
        checkCompletion();
      });

      clientSocket2.on('lottery_update', (data) => {
        expect(data.lotteryId).toBe(lotteryId);
        expect(data.type).toBe('winner_announced');
        client2Received = true;
        checkCompletion();
      });

      // Wait for both to join, then broadcast
      setTimeout(() => {
        socketService.broadcastLotteryEvent({
          lotteryId,
          type: 'winner_announced',
          data: { winners: ['user1', 'user2'] },
          timestamp: new Date()
        });
      }, 200);
    });

    it('should send targeted notifications correctly', (done) => {
      let client1Received = false;
      let client2Received = false;
      
      clientSocket.on('notification', (data) => {
        expect(data.title).toBe('Targeted Message');
        client1Received = true;
      });

      clientSocket2.on('notification', () => {
        client2Received = true;
      });

      // Send notification only to first user
      socketService.sendNotification({
        type: 'system',
        title: 'Targeted Message',
        message: 'This is for user 123 only',
        targetUsers: ['test-user-123'],
        timestamp: new Date()
      });

      // Check after delay
      setTimeout(() => {
        expect(client1Received).toBe(true);
        expect(client2Received).toBe(false);
        done();
      }, 200);
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle malformed join_lottery events', (done) => {
      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: validToken },
      });

      clientSocket.on('connect', () => {
        // Send malformed data
        clientSocket.emit('join_lottery', { invalidField: 'test' });
        
        // Should not crash the server
        setTimeout(() => {
          expect(socketService.getConnectedUsersCount()).toBe(1);
          done();
        }, 100);
      });
    });

    it('should handle malformed join_location events', (done) => {
      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: validToken },
      });

      clientSocket.on('connect', () => {
        // Send malformed location data
        clientSocket.emit('join_location', { latitude: 'invalid' });
        
        // Should not crash the server
        setTimeout(() => {
          expect(socketService.getConnectedUsersCount()).toBe(1);
          done();
        }, 100);
      });
    });

    it('should handle broadcasting to non-existent rooms', () => {
      expect(() => {
        socketService.broadcastLotteryEvent({
          lotteryId: 'non-existent-lottery',
          type: 'draw_started',
          data: {},
          timestamp: new Date()
        });
      }).not.toThrow();
    });

    it('should handle sending messages to non-existent users', () => {
      expect(() => {
        socketService.sendToUser('non-existent-user', 'test_event', {});
      }).not.toThrow();
    });
  });

  describe('Performance and Utility Tests', () => {
    it('should track connected users count accurately', (done) => {
      expect(socketService.getConnectedUsersCount()).toBe(0);
      
      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: validToken },
      });

      clientSocket.on('connect', () => {
        expect(socketService.getConnectedUsersCount()).toBe(1);
        
        clientSocket2 = Client(`http://localhost:${serverPort}`, {
          auth: { token: validToken },
        });

        clientSocket2.on('connect', () => {
          expect(socketService.getConnectedUsersCount()).toBe(2);
          done();
        });
      });
    });

    it('should return correct Socket.io server instance', () => {
      const io = socketService.getIO();
      expect(io).toBeDefined();
      expect(typeof io.emit).toBe('function');
      expect(typeof io.to).toBe('function');
      expect(typeof io.in).toBe('function');
    });

    it('should handle empty room queries', async () => {
      const users = await socketService.getUsersInRoom('empty-room');
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBe(0);
    });
  });
});
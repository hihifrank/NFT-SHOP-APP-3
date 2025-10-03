import request from 'supertest';
import { createServer } from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import SocketService from '../services/SocketService';
import socketRoutes from '../routes/socket';
import config from '../config';

describe('Socket.io API Integration Tests', () => {
  let app: express.Application;
  let httpServer: any;
  let socketService: SocketService;
  let serverPort: number;
  let clientSocket: ClientSocket;
  let validToken: string;

  beforeAll((done) => {
    // Create Express app
    app = express();
    app.use(express.json());
    
    // Create HTTP server
    httpServer = createServer(app);
    socketService = new SocketService(httpServer);
    
    // Set global socket service for controllers
    (global as any).socketService = socketService;
    
    // Setup routes
    app.use('/api/v1/socket', socketRoutes);
    
    // Generate test token
    validToken = jwt.sign(
      { userId: 'test-user-123', walletAddress: '0x123...abc' },
      config.jwtSecret || 'test-secret',
      { expiresIn: '1h' }
    );

    // Start server
    httpServer.listen(() => {
      serverPort = (httpServer.address() as any).port;
      done();
    });
  });

  afterAll((done) => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    if (httpServer) {
      httpServer.close(done);
    } else {
      done();
    }
  });

  beforeEach((done) => {
    // Connect client for each test
    clientSocket = Client(`http://localhost:${serverPort}`, {
      auth: { token: validToken },
    });
    clientSocket.on('connect', () => done());
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('Lottery Broadcasting API', () => {
    it('should broadcast lottery event via API', (done) => {
      const lotteryId = 'api-lottery-123';
      
      // Join lottery room first
      clientSocket.emit('join_lottery', { lotteryId });
      
      clientSocket.on('joined_room', async () => {
        // Make API call to broadcast
        const response = await request(app)
          .post('/api/v1/socket/lottery/broadcast')
          .send({
            lotteryId,
            type: 'draw_started',
            data: { message: 'API broadcast test' }
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.lotteryId).toBe(lotteryId);
        expect(response.body.data.type).toBe('draw_started');
      });

      clientSocket.on('lottery_update', (data) => {
        expect(data.lotteryId).toBe(lotteryId);
        expect(data.type).toBe('draw_started');
        expect(data.data.message).toBe('API broadcast test');
        done();
      });
    });

    it('should return error for missing lottery broadcast parameters', async () => {
      const response = await request(app)
        .post('/api/v1/socket/lottery/broadcast')
        .send({
          type: 'draw_started'
          // Missing lotteryId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('lotteryId and type are required');
    });

    it('should handle all lottery event types', async () => {
      const lotteryId = 'api-lottery-types';
      const eventTypes = ['draw_started', 'draw_completed', 'winner_announced'];
      
      for (const eventType of eventTypes) {
        const response = await request(app)
          .post('/api/v1/socket/lottery/broadcast')
          .send({
            lotteryId,
            type: eventType,
            data: { testType: eventType }
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.type).toBe(eventType);
      }
    });
  });

  describe('Promotion Broadcasting API', () => {
    it('should broadcast promotion via API', (done) => {
      const merchantId = 'api-merchant-123';
      const location = { latitude: 22.3193, longitude: 114.1694, radius: 1000 };
      
      // Join location room first
      clientSocket.emit('join_location', location);
      
      clientSocket.on('joined_room', async () => {
        // Make API call to broadcast promotion
        const response = await request(app)
          .post('/api/v1/socket/promotion/broadcast')
          .send({
            merchantId,
            type: 'flash_sale',
            title: 'API Flash Sale',
            description: 'Limited time offer via API',
            location,
            data: { discount: 30 }
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.merchantId).toBe(merchantId);
        expect(response.body.data.type).toBe('flash_sale');
      });

      clientSocket.on('promotion_update', (data) => {
        expect(data.merchantId).toBe(merchantId);
        expect(data.type).toBe('flash_sale');
        expect(data.title).toBe('API Flash Sale');
        expect(data.description).toBe('Limited time offer via API');
        expect(data.location).toEqual(location);
        expect(data.data.discount).toBe(30);
        done();
      });
    });

    it('should return error for missing promotion parameters', async () => {
      const response = await request(app)
        .post('/api/v1/socket/promotion/broadcast')
        .send({
          merchantId: 'test-merchant',
          type: 'flash_sale'
          // Missing title and description
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('merchantId, type, title, and description are required');
    });

    it('should handle promotion without location', async () => {
      const response = await request(app)
        .post('/api/v1/socket/promotion/broadcast')
        .send({
          merchantId: 'test-merchant',
          type: 'new_promotion',
          title: 'General Promotion',
          description: 'Available everywhere'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Notification API', () => {
    it('should send notification via API', (done) => {
      clientSocket.on('notification', (data) => {
        expect(data.type).toBe('system');
        expect(data.title).toBe('API Notification');
        expect(data.message).toBe('Test notification via API');
        expect(data.data.source).toBe('api');
        done();
      });

      // Make API call to send notification
      request(app)
        .post('/api/v1/socket/notification/send')
        .send({
          type: 'system',
          title: 'API Notification',
          message: 'Test notification via API',
          data: { source: 'api' }
        })
        .expect(200)
        .end((err) => {
          if (err) done(err);
        });
    });

    it('should send targeted notification via API', (done) => {
      clientSocket.on('notification', (data) => {
        expect(data.type).toBe('merchant');
        expect(data.title).toBe('Targeted Notification');
        expect(data.message).toBe('This is for specific users');
        done();
      });

      // Make API call to send targeted notification
      request(app)
        .post('/api/v1/socket/notification/send')
        .send({
          type: 'merchant',
          title: 'Targeted Notification',
          message: 'This is for specific users',
          targetUsers: ['test-user-123']
        })
        .expect(200)
        .end((err) => {
          if (err) done(err);
        });
    });

    it('should return error for missing notification parameters', async () => {
      const response = await request(app)
        .post('/api/v1/socket/notification/send')
        .send({
          type: 'system'
          // Missing title and message
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('type, title, and message are required');
    });
  });

  describe('Direct User Messaging API', () => {
    it('should send direct message to user via API', (done) => {
      const eventName = 'api_custom_event';
      const eventData = { message: 'Direct API message', timestamp: new Date() };
      
      clientSocket.on(eventName, (data) => {
        expect(data.message).toBe('Direct API message');
        expect(data.timestamp).toBeDefined();
        done();
      });

      // Make API call to send direct message
      request(app)
        .post('/api/v1/socket/user/send')
        .send({
          userId: 'test-user-123',
          event: eventName,
          data: eventData
        })
        .expect(200)
        .end((err) => {
          if (err) done(err);
        });
    });

    it('should return error for missing user message parameters', async () => {
      const response = await request(app)
        .post('/api/v1/socket/user/send')
        .send({
          userId: 'test-user-123'
          // Missing event
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('userId and event are required');
    });
  });

  describe('Socket Statistics API', () => {
    it('should get socket statistics via API', async () => {
      const response = await request(app)
        .get('/api/v1/socket/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.connectedUsers).toBe(1); // One client connected
      expect(response.body.data.timestamp).toBeDefined();
    });

    it('should get room users via API', async () => {
      const lotteryId = 'api-room-test';
      
      // Join lottery room
      clientSocket.emit('join_lottery', { lotteryId });
      
      // Wait for join to complete
      await new Promise(resolve => {
        clientSocket.on('joined_room', resolve);
      });

      const response = await request(app)
        .get(`/api/v1/socket/room/lottery:${lotteryId}/users`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.roomName).toBe(`lottery:${lotteryId}`);
      expect(response.body.data.users).toContain('test-user-123');
      expect(response.body.data.userCount).toBe(1);
    });

    it('should check user connection status via API', async () => {
      const response = await request(app)
        .get('/api/v1/socket/user/test-user-123/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe('test-user-123');
      expect(response.body.data.isConnected).toBe(true);
      expect(response.body.data.timestamp).toBeDefined();
    });

    it('should return false for non-connected user', async () => {
      const response = await request(app)
        .get('/api/v1/socket/user/non-existent-user/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe('non-existent-user');
      expect(response.body.data.isConnected).toBe(false);
    });

    it('should return error for missing room name', async () => {
      const response = await request(app)
        .get('/api/v1/socket/room//users'); // Empty room name

      expect(response.status).toBe(404); // Route not found
    });

    it('should return error for missing user ID', async () => {
      const response = await request(app)
        .get('/api/v1/socket/user//status'); // Empty user ID

      expect(response.status).toBe(404); // Route not found
    });
  });

  describe('System Message Broadcasting API', () => {
    it('should broadcast system message via API', (done) => {
      clientSocket.on('system_message', (data) => {
        expect(data.type).toBe('info');
        expect(data.message).toBe('System update via API');
        expect(data.timestamp).toBeDefined();
        done();
      });

      // Make API call to broadcast system message
      request(app)
        .post('/api/v1/socket/system/broadcast')
        .send({
          message: 'System update via API',
          type: 'info'
        })
        .expect(200)
        .end((err) => {
          if (err) done(err);
        });
    });

    it('should broadcast system message with default type', (done) => {
      clientSocket.on('system_message', (data) => {
        expect(data.type).toBe('info'); // Default type
        expect(data.message).toBe('Default type message');
        done();
      });

      // Make API call without specifying type
      request(app)
        .post('/api/v1/socket/system/broadcast')
        .send({
          message: 'Default type message'
        })
        .expect(200)
        .end((err) => {
          if (err) done(err);
        });
    });

    it('should return error for missing system message', async () => {
      const response = await request(app)
        .post('/api/v1/socket/system/broadcast')
        .send({
          type: 'warning'
          // Missing message
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('message is required');
    });

    it('should handle different message types', async () => {
      const messageTypes = ['info', 'warning', 'error'];
      
      for (const messageType of messageTypes) {
        const response = await request(app)
          .post('/api/v1/socket/system/broadcast')
          .send({
            message: `Test ${messageType} message`,
            type: messageType
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.type).toBe(messageType);
      }
    });
  });

  describe('Error Handling in API', () => {
    it('should handle server errors gracefully', async () => {
      // Temporarily break the global socket service
      const originalSocketService = (global as any).socketService;
      (global as any).socketService = null;

      const response = await request(app)
        .post('/api/v1/socket/lottery/broadcast')
        .send({
          lotteryId: 'test-lottery',
          type: 'draw_started'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to broadcast lottery event');

      // Restore the socket service
      (global as any).socketService = originalSocketService;
    });

    it('should validate JSON payload', async () => {
      const response = await request(app)
        .post('/api/v1/socket/lottery/broadcast')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });
  });

  describe('Concurrent API Operations', () => {
    it('should handle multiple simultaneous broadcasts', async () => {
      const promises = [];
      
      // Create multiple broadcast requests
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/api/v1/socket/lottery/broadcast')
            .send({
              lotteryId: `concurrent-lottery-${i}`,
              type: 'draw_started',
              data: { index: i }
            })
        );
      }

      const responses = await Promise.all(promises);
      
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.lotteryId).toBe(`concurrent-lottery-${index}`);
      });
    });

    it('should handle mixed API operations', async () => {
      const operations = [
        request(app)
          .post('/api/v1/socket/lottery/broadcast')
          .send({
            lotteryId: 'mixed-lottery',
            type: 'draw_started'
          }),
        request(app)
          .post('/api/v1/socket/promotion/broadcast')
          .send({
            merchantId: 'mixed-merchant',
            type: 'flash_sale',
            title: 'Mixed Sale',
            description: 'Concurrent promotion'
          }),
        request(app)
          .post('/api/v1/socket/notification/send')
          .send({
            type: 'system',
            title: 'Mixed Notification',
            message: 'Concurrent notification'
          }),
        request(app)
          .get('/api/v1/socket/stats')
      ];

      const responses = await Promise.all(operations);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});
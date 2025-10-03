import request from 'supertest';
import { Express } from 'express';
import { ethers } from 'ethers';

// Mock wallet for testing
const testWallet = ethers.Wallet.createRandom();
const testPrivateKey = testWallet.privateKey;
const testAddress = testWallet.address;

describe('Complete User Journey E2E Tests', () => {
  let app: Express;
  let authToken: string;
  let userId: string;
  let merchantId: string;
  let couponNFTId: string;
  let lotteryId: string;

  beforeAll(async () => {
    // Initialize test app
    const { createTestApp } = require('../setup');
    app = await createTestApp();
  });

  describe('1. User Registration and Authentication Flow', () => {
    it('should register a new user with wallet connection', async () => {
      // Create signature for wallet verification
      const message = `Sign this message to verify your wallet ownership: ${Date.now()}`;
      const signature = await testWallet.signMessage(message);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          walletAddress: testAddress,
          message,
          signature,
          preferredLanguage: 'zh-HK'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.walletAddress).toBe(testAddress);
      expect(response.body.data.token).toBeDefined();
      
      authToken = response.body.data.token;
      userId = response.body.data.user.id;
    });

    it('should login existing user', async () => {
      const message = `Login message: ${Date.now()}`;
      const signature = await testWallet.signMessage(message);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          walletAddress: testAddress,
          message,
          signature
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should get user profile', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.walletAddress).toBe(testAddress);
    });
  });

  describe('2. Merchant Registration and Store Setup', () => {
    it('should register a merchant', async () => {
      const response = await request(app)
        .post('/api/v1/merchants/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Retail Store',
          description: 'A test retail store for NFT coupons',
          address: '123 Test Street, Hong Kong',
          latitude: 22.3193,
          longitude: 114.1694,
          category: 'retail',
          isNftParticipant: true
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Retail Store');
      merchantId = response.body.data.id;
    });

    it('should update merchant profile', async () => {
      const response = await request(app)
        .put(`/api/v1/merchants/${merchantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated description for test store',
          category: 'fashion'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('Updated description for test store');
    });
  });

  describe('3. Store Discovery and Search', () => {
    it('should find nearby stores', async () => {
      const response = await request(app)
        .get('/api/v1/stores/nearby')
        .query({
          latitude: 22.3193,
          longitude: 114.1694,
          radius: 5000
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should search stores by category', async () => {
      const response = await request(app)
        .get('/api/v1/stores/search')
        .query({
          category: 'fashion',
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get store details', async () => {
      const response = await request(app)
        .get(`/api/v1/stores/${merchantId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(merchantId);
    });
  });

  describe('4. NFT Coupon Creation and Management', () => {
    it('should create NFT coupon as merchant', async () => {
      const response = await request(app)
        .post('/api/v1/coupons/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          merchantId,
          couponType: 'discount',
          discountValue: 20,
          discountType: 'percentage',
          maxQuantity: 100,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          metadata: {
            title: 'Test 20% Discount Coupon',
            description: 'Test coupon for e2e testing',
            image: 'https://example.com/coupon-image.jpg'
          }
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.discountValue).toBe(20);
      expect(response.body.data.tokenId).toBeDefined();
      couponNFTId = response.body.data.id;
    });

    it('should get coupon details', async () => {
      const response = await request(app)
        .get(`/api/v1/coupons/${couponNFTId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(couponNFTId);
    });

    it('should list available coupons', async () => {
      const response = await request(app)
        .get('/api/v1/coupons')
        .query({
          merchantId,
          available: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('5. NFT Purchase and Ownership', () => {
    it('should purchase NFT coupon', async () => {
      const response = await request(app)
        .post(`/api/v1/coupons/${couponNFTId}/purchase`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 1,
          paymentMethod: 'crypto'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactionHash).toBeDefined();
    });

    it('should get user NFT collection', async () => {
      const response = await request(app)
        .get('/api/v1/users/nfts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should transfer NFT to another user', async () => {
      // Create another test user for transfer
      const recipientWallet = ethers.Wallet.createRandom();
      const message = `Transfer test: ${Date.now()}`;
      const signature = await testWallet.signMessage(message);

      const response = await request(app)
        .post(`/api/v1/coupons/${couponNFTId}/transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          toAddress: recipientWallet.address,
          message,
          signature
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactionHash).toBeDefined();
    });
  });

  describe('6. Coupon Usage Flow', () => {
    it('should use coupon at merchant location', async () => {
      // First, get the coupon back for testing
      await request(app)
        .post(`/api/v1/coupons/${couponNFTId}/transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          toAddress: testAddress,
          message: `Get back coupon: ${Date.now()}`,
          signature: await testWallet.signMessage(`Get back coupon: ${Date.now()}`)
        });

      const response = await request(app)
        .post(`/api/v1/coupons/${couponNFTId}/use`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          merchantId,
          orderAmount: 100,
          location: {
            latitude: 22.3193,
            longitude: 114.1694
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.discountApplied).toBe(20);
      expect(response.body.data.finalAmount).toBe(80);
    });

    it('should verify coupon is marked as used', async () => {
      const response = await request(app)
        .get(`/api/v1/coupons/${couponNFTId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isUsed).toBe(true);
    });
  });

  describe('7. Lottery System Flow', () => {
    it('should create lottery as merchant', async () => {
      const response = await request(app)
        .post('/api/v1/lotteries/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test NFT Lottery',
          description: 'Test lottery for e2e testing',
          entryFee: 10,
          totalPrizes: 5,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          prizes: [
            {
              type: 'nft_coupon',
              couponId: couponNFTId,
              quantity: 1
            }
          ]
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test NFT Lottery');
      lotteryId = response.body.data.id;
    });

    it('should participate in lottery', async () => {
      const response = await request(app)
        .post(`/api/v1/lotteries/${lotteryId}/participate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entries: 1
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.participationId).toBeDefined();
    });

    it('should get lottery details', async () => {
      const response = await request(app)
        .get(`/api/v1/lotteries/${lotteryId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(lotteryId);
    });

    it('should get user lottery history', async () => {
      const response = await request(app)
        .get('/api/v1/lotteries/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('8. Multi-language Support', () => {
    it('should switch language to English', async () => {
      const response = await request(app)
        .post('/api/v1/languages/switch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          language: 'en'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should get content in English', async () => {
      const response = await request(app)
        .get('/api/v1/content/coupons')
        .set('Accept-Language', 'en')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBeDefined();
    });

    it('should get content in Traditional Chinese', async () => {
      const response = await request(app)
        .get('/api/v1/content/coupons')
        .set('Accept-Language', 'zh-HK')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBeDefined();
    });
  });

  describe('9. Real-time Communication', () => {
    it('should connect to Socket.IO', (done) => {
      const io = require('socket.io-client');
      const client = io('http://localhost:3000', {
        auth: {
          token: authToken
        }
      });

      client.on('connect', () => {
        expect(client.connected).toBe(true);
        client.disconnect();
        done();
      });

      client.on('connect_error', (error: any) => {
        done(error);
      });
    });

    it('should receive lottery result notifications', (done) => {
      const io = require('socket.io-client');
      const client = io('http://localhost:3000', {
        auth: {
          token: authToken
        }
      });

      client.on('connect', () => {
        client.emit('join_lottery_room', { lotteryId });
        
        // Simulate lottery result
        client.on('lottery_result', (data: any) => {
          expect(data.lotteryId).toBe(lotteryId);
          client.disconnect();
          done();
        });

        // Trigger lottery result for testing
        setTimeout(() => {
          client.emit('test_lottery_result', { lotteryId });
        }, 100);
      });
    });
  });

  describe('10. Security and Privacy', () => {
    it('should handle unauthorized access', async () => {
      await request(app)
        .get('/api/v1/users/profile')
        .expect(401);
    });

    it('should handle invalid JWT token', async () => {
      await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should export user data (GDPR compliance)', async () => {
      const response = await request(app)
        .get('/api/v1/privacy/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.transactions).toBeDefined();
    });

    it('should handle data deletion request', async () => {
      const response = await request(app)
        .post('/api/v1/privacy/delete-request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Testing data deletion'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.requestId).toBeDefined();
    });
  });

  describe('11. Performance and Load Testing', () => {
    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(app)
          .get('/api/v1/stores/nearby')
          .query({
            latitude: 22.3193,
            longitude: 114.1694,
            radius: 1000
          })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/v1/coupons')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });
  });

  describe('12. Monitoring and Health Checks', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/v1/monitoring/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.checks).toBeDefined();
    });

    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/api/v1/monitoring/health/ready')
        .expect(200);

      expect(response.body.status).toBe('ready');
    });

    it('should provide metrics', async () => {
      const response = await request(app)
        .get('/api/v1/monitoring/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.metrics).toBeDefined();
      expect(response.body.summary).toBeDefined();
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (app && typeof (app as any).close === 'function') {
      await (app as any).close();
    }
  });
});
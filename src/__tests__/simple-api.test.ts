import request from 'supertest';
import app from '../index';

describe('Simple API Tests', () => {
  afterAll(async () => {
    // Give time for cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Basic Endpoints', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'OK',
        environment: expect.any(String),
        version: expect.any(String),
        timestamp: expect.any(String),
      });
    });

    it('should return API information', async () => {
      const response = await request(app)
        .get('/api/v1')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          message: 'HK Retail NFT Platform API',
          version: '1.0.0',
          endpoints: expect.objectContaining({
            auth: '/api/v1/auth',
            users: '/api/v1/users',
            merchants: '/api/v1/merchants',
            coupons: '/api/v1/coupons',
            lotteries: '/api/v1/lotteries',
            stores: '/api/v1/stores',
          }),
        },
      });
    });

    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/non-existent')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Endpoint not found',
        path: '/api/v1/non-existent',
      });
    });
  });

  describe('Authentication Endpoints', () => {
    it('should reject nonce request with invalid wallet address', async () => {
      const response = await request(app)
        .post('/api/v1/auth/nonce')
        .send({
          walletAddress: 'invalid-address',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject missing wallet address', async () => {
      const response = await request(app)
        .post('/api/v1/auth/nonce')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication for protected endpoints', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('Coupon Endpoints', () => {
    it('should get coupons without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/coupons')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          coupons: expect.any(Array),
          pagination: expect.any(Object),
        }),
      });
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/coupons?limit=200') // Exceeds max limit
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication for coupon creation', async () => {
      const response = await request(app)
        .post('/api/v1/coupons')
        .send({
          merchantId: 'test-merchant-id',
          couponType: 'percentage',
          title: 'Test Coupon',
          discountValue: 20,
          discountType: 'percentage',
          maxQuantity: 100,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Lottery Endpoints', () => {
    it('should get active lotteries without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/lotteries/active')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        pagination: expect.any(Object),
      });
    });

    it('should require authentication for lottery participation', async () => {
      const response = await request(app)
        .post('/api/v1/lotteries/test-lottery-id/participate')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication for lottery history', async () => {
      const response = await request(app)
        .get('/api/v1/lotteries/history')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Not Implemented Endpoints', () => {
    it('should return not implemented for user endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .expect(501);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'NOT_IMPLEMENTED',
        }),
      });
    });

    it('should return not implemented for merchant endpoints', async () => {
      const response = await request(app)
        .post('/api/v1/merchants/register')
        .send({
          name: 'Test Merchant',
          address: 'Test Address',
          category: 'retail',
        })
        .expect(501);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'NOT_IMPLEMENTED',
        }),
      });
    });

    it('should return not implemented for store endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/stores/nearby?latitude=22.3193&longitude=114.1694')
        .expect(501);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'NOT_IMPLEMENTED',
        }),
      });
    });
  });

  describe('Input Validation', () => {
    it('should validate request body size limits', async () => {
      const largePayload = {
        walletAddress: '0x1234567890123456789012345678901234567890',
        data: 'x'.repeat(11 * 1024 * 1024), // 11MB payload
      };

      const response = await request(app)
        .post('/api/v1/auth/nonce')
        .send(largePayload)
        .expect(413);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/auth/nonce')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for security headers (helmet middleware)
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/v1/auth/nonce')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });
});
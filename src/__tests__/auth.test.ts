import request from 'supertest';
import app from '../index';
import AuthService from '../services/authService';

describe('Authentication API', () => {
  const authService = AuthService.getInstance();
  
  // Set longer timeout for tests that might take time
  jest.setTimeout(10000);
  
  afterAll(async () => {
    // Cleanup any open handles
    try {
      const { HealthService, AuthService } = await import('../services');
      const healthService = HealthService.getInstance();
      const authService = AuthService.getInstance();
      
      // Cleanup services
      await healthService.cleanup();
      authService.cleanup();
      
      // Give a small delay to ensure cleanup completes
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  });

  describe('POST /api/v1/auth/nonce', () => {
    it('should generate nonce for valid wallet address', async () => {
      const walletAddress = '0x1234567890123456789012345678901234567890';
      
      const response = await request(app)
        .post('/api/v1/auth/nonce')
        .send({ walletAddress })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('nonce');
      expect(response.body.data).toHaveProperty('message');
      expect(typeof response.body.data.nonce).toBe('string');
      expect(typeof response.body.data.message).toBe('string');
    });

    it('should reject invalid wallet address', async () => {
      const response = await request(app)
        .post('/api/v1/auth/nonce')
        .send({ walletAddress: 'invalid-address' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should reject missing wallet address', async () => {
      const response = await request(app)
        .post('/api/v1/auth/nonce')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/wallet', () => {
    it('should reject authentication with invalid signature', async () => {
      const walletAddress = '0x1234567890123456789012345678901234567890';
      
      const response = await request(app)
        .post('/api/v1/auth/wallet')
        .send({
          walletAddress,
          signature: '0xinvalidsignature',
          message: 'test message',
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/wallet')
        .send({
          walletAddress: '0x1234567890123456789012345678901234567890',
          // Missing signature and message
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123',
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should register user with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          preferredLanguage: 'en',
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(typeof response.body.data.token).toBe('string');
    });
  });

  describe('POST /api/v1/auth/verify', () => {
    it('should reject request without token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'MISSING_TOKEN');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify')
        .set('Authorization', 'Bearer invalid-token')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_TOKEN');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should handle logout without token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('message');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to auth endpoints', async () => {
      const walletAddress = '0x1234567890123456789012345678901234567890';
      
      // Make multiple requests quickly
      const requests = Array(6).fill(null).map(() =>
        request(app)
          .post('/api/v1/auth/nonce')
          .send({ walletAddress })
      );

      const responses = await Promise.all(requests);
      
      // At least one should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
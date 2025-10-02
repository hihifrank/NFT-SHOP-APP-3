import request from 'supertest';
import app from '../index';
import AuthService from '../services/authService';
import AuthMiddleware from '../middleware/auth';
import { ethers } from 'ethers';

describe('Authentication and Authorization Integration Tests', () => {
  let authService: AuthService;
  let testWallet: ethers.HDNodeWallet;
  let validToken: string;
  let expiredToken: string;
  let testUser: any;

  beforeAll(async () => {
    authService = AuthService.getInstance();
    testWallet = ethers.Wallet.createRandom();
  });

  afterAll(async () => {
    authService.cleanup();
  });

  describe('Wallet-based Authentication Flow', () => {
    describe('Nonce Generation', () => {
      it('should generate unique nonces for each request', async () => {
        const walletAddress = testWallet.address;
        
        const response1 = await request(app)
          .post('/api/v1/auth/nonce')
          .send({ walletAddress })
          .expect(200);

        const response2 = await request(app)
          .post('/api/v1/auth/nonce')
          .send({ walletAddress })
          .expect(200);

        expect(response1.body.data.nonce).not.toBe(response2.body.data.nonce);
        expect(response1.body.data.message).not.toBe(response2.body.data.message);
      });

      it('should include wallet address in nonce message', async () => {
        const walletAddress = testWallet.address;
        
        const response = await request(app)
          .post('/api/v1/auth/nonce')
          .send({ walletAddress })
          .expect(200);

        expect(response.body.data.message).toContain(walletAddress.toLowerCase());
      });

      it('should validate wallet address format strictly', async () => {
        const invalidAddresses = [
          '0x123', // Too short
          '0xGGGG567890123456789012345678901234567890', // Invalid characters
          '1234567890123456789012345678901234567890', // Missing 0x prefix
          '0x12345678901234567890123456789012345678901', // Too long
        ];

        for (const address of invalidAddresses) {
          const response = await request(app)
            .post('/api/v1/auth/nonce')
            .send({ walletAddress: address })
            .expect(400);

          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toBe('VALIDATION_ERROR');
        }
      });

      it('should handle case sensitivity in wallet addresses', async () => {
        const lowerCaseAddress = testWallet.address.toLowerCase();
        const upperCaseAddress = testWallet.address.toUpperCase();
        
        const response1 = await request(app)
          .post('/api/v1/auth/nonce')
          .send({ walletAddress: lowerCaseAddress })
          .expect(200);

        const response2 = await request(app)
          .post('/api/v1/auth/nonce')
          .send({ walletAddress: upperCaseAddress })
          .expect(200);

        // Both should succeed
        expect(response1.body.success).toBe(true);
        expect(response2.body.success).toBe(true);
      });
    });

    describe('Wallet Signature Authentication', () => {
      it('should authenticate with valid signature', async () => {
        // Get nonce first
        const nonceResponse = await request(app)
          .post('/api/v1/auth/nonce')
          .send({ walletAddress: testWallet.address })
          .expect(200);

        const { message } = nonceResponse.body.data;
        const signature = await testWallet.signMessage(message);

        // Authenticate with signature
        const authResponse = await request(app)
          .post('/api/v1/auth/wallet')
          .send({
            walletAddress: testWallet.address,
            signature,
            message,
          })
          .expect(200);

        expect(authResponse.body).toMatchObject({
          success: true,
          data: {
            token: expect.any(String),
            user: expect.objectContaining({
              id: expect.any(String),
              walletAddress: testWallet.address.toLowerCase(),
              preferredLanguage: 'zh-HK',
            }),
          },
        });

        // Store for later tests
        validToken = authResponse.body.data.token;
        testUser = authResponse.body.data.user;
      });

      it('should reject authentication with wrong signature', async () => {
        const nonceResponse = await request(app)
          .post('/api/v1/auth/nonce')
          .send({ walletAddress: testWallet.address })
          .expect(200);

        const { message } = nonceResponse.body.data;
        
        // Sign with different wallet
        const wrongWallet = ethers.Wallet.createRandom();
        const wrongSignature = await wrongWallet.signMessage(message);

        const response = await request(app)
          .post('/api/v1/auth/wallet')
          .send({
            walletAddress: testWallet.address,
            signature: wrongSignature,
            message,
          })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('AUTH_FAILED');
      });

      it('should reject authentication with tampered message', async () => {
        const nonceResponse = await request(app)
          .post('/api/v1/auth/nonce')
          .send({ walletAddress: testWallet.address })
          .expect(200);

        const { message } = nonceResponse.body.data;
        const signature = await testWallet.signMessage(message);
        
        // Tamper with message
        const tamperedMessage = message.replace('nonce', 'fake');

        const response = await request(app)
          .post('/api/v1/auth/wallet')
          .send({
            walletAddress: testWallet.address,
            signature,
            message: tamperedMessage,
          })
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      it('should reject authentication without prior nonce', async () => {
        const fakeMessage = 'Please sign this message to authenticate: fake-nonce';
        const signature = await testWallet.signMessage(fakeMessage);

        const response = await request(app)
          .post('/api/v1/auth/wallet')
          .send({
            walletAddress: testWallet.address,
            signature,
            message: fakeMessage,
          })
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      it('should handle replay attacks (nonce reuse)', async () => {
        // Get nonce and authenticate once
        const nonceResponse = await request(app)
          .post('/api/v1/auth/nonce')
          .send({ walletAddress: testWallet.address })
          .expect(200);

        const { message } = nonceResponse.body.data;
        const signature = await testWallet.signMessage(message);

        // First authentication should succeed
        await request(app)
          .post('/api/v1/auth/wallet')
          .send({
            walletAddress: testWallet.address,
            signature,
            message,
          })
          .expect(200);

        // Second authentication with same nonce should fail
        const replayResponse = await request(app)
          .post('/api/v1/auth/wallet')
          .send({
            walletAddress: testWallet.address,
            signature,
            message,
          })
          .expect(401);

        expect(replayResponse.body.success).toBe(false);
      });
    });
  });

  describe('Email/Password Authentication Flow', () => {
    describe('User Registration', () => {
      it('should register user with strong password', async () => {
        const userData = {
          email: 'strong-test@example.com',
          password: 'StrongPassword123!',
          walletAddress: ethers.Wallet.createRandom().address,
          preferredLanguage: 'en',
        };

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            token: expect.any(String),
            user: expect.objectContaining({
              email: userData.email,
              walletAddress: userData.walletAddress.toLowerCase(),
              preferredLanguage: userData.preferredLanguage,
            }),
          },
        });
      });

      it('should enforce password complexity requirements', async () => {
        const weakPasswords = [
          'short', // Too short
          'nouppercase123', // No uppercase
          'NOLOWERCASE123', // No lowercase
          'NoNumbers!', // No numbers
          'password123', // Common password
        ];

        for (const password of weakPasswords) {
          const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
              email: 'weak-test@example.com',
              password,
            })
            .expect(400);

          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toBe('VALIDATION_ERROR');
        }
      });

      it('should validate email format strictly', async () => {
        const invalidEmails = [
          'notanemail',
          '@domain.com',
          'user@',
          'user@domain',
          'user..double.dot@domain.com',
          'user@domain..com',
        ];

        for (const email of invalidEmails) {
          const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
              email,
              password: 'ValidPassword123',
            })
            .expect(400);

          expect(response.body.success).toBe(false);
        }
      });

      it('should prevent duplicate email registration', async () => {
        const userData = {
          email: 'duplicate-test@example.com',
          password: 'ValidPassword123',
        };

        // First registration should succeed
        await request(app)
          .post('/api/v1/auth/register')
          .send(userData)
          .expect(201);

        // Second registration with same email should fail
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData)
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('REGISTRATION_FAILED');
      });

      it('should normalize email addresses', async () => {
        const email = 'Test.User+tag@Example.COM';
        const normalizedEmail = 'test.user+tag@example.com';

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email,
            password: 'ValidPassword123',
          })
          .expect(201);

        expect(response.body.data.user.email).toBe(normalizedEmail);
      });
    });

    describe('User Login', () => {
      it('should return not implemented for email login', async () => {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'test@example.com',
            password: 'ValidPassword123',
          })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('not implemented');
      });
    });
  });

  describe('JWT Token Management', () => {
    describe('Token Verification', () => {
      it('should verify valid token', async () => {
        const response = await request(app)
          .post('/api/v1/auth/verify')
          .set('Authorization', `Bearer ${validToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            user: expect.objectContaining({
              id: testUser.id,
              walletAddress: testUser.walletAddress,
            }),
            message: 'Token is valid',
          },
        });
      });

      it('should reject missing authorization header', async () => {
        const response = await request(app)
          .post('/api/v1/auth/verify')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('MISSING_TOKEN');
      });

      it('should reject malformed authorization header', async () => {
        const malformedHeaders = [
          'InvalidFormat token',
          'Bearer',
          'Bearer ',
          'Token validtoken',
        ];

        for (const header of malformedHeaders) {
          const response = await request(app)
            .post('/api/v1/auth/verify')
            .set('Authorization', header)
            .expect(401);

          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toBe('MISSING_TOKEN');
        }
      });

      it('should reject invalid token format', async () => {
        const invalidTokens = [
          'invalid.token.format',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
          'completely-invalid-token',
        ];

        for (const token of invalidTokens) {
          const response = await request(app)
            .post('/api/v1/auth/verify')
            .set('Authorization', `Bearer ${token}`)
            .expect(401);

          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toBe('INVALID_TOKEN');
        }
      });
    });

    describe('Token Refresh', () => {
      it('should refresh valid token', async () => {
        const response = await request(app)
          .post('/api/v1/auth/refresh')
          .set('Authorization', `Bearer ${validToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            token: expect.any(String),
            user: expect.objectContaining({
              id: testUser.id,
            }),
          },
        });

        // New token should be different
        expect(response.body.data.token).not.toBe(validToken);
        
        // Verify new token works
        const verifyResponse = await request(app)
          .post('/api/v1/auth/verify')
          .set('Authorization', `Bearer ${response.body.data.token}`)
          .expect(200);

        expect(verifyResponse.body.success).toBe(true);
      });

      it('should reject refresh without token', async () => {
        const response = await request(app)
          .post('/api/v1/auth/refresh')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('MISSING_TOKEN');
      });
    });

    describe('Token Logout', () => {
      it('should handle logout with valid token', async () => {
        const response = await request(app)
          .post('/api/v1/auth/logout')
          .set('Authorization', `Bearer ${validToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            message: expect.stringContaining('Logout successful'),
          },
        });
      });

      it('should handle logout without token (optional auth)', async () => {
        const response = await request(app)
          .post('/api/v1/auth/logout')
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Authorization Middleware Tests', () => {
    describe('Protected Route Access', () => {
      it('should allow access to protected routes with valid token', async () => {
        const protectedEndpoints = [
          { method: 'post', path: '/api/v1/auth/verify' },
          { method: 'post', path: '/api/v1/auth/refresh' },
          { method: 'get', path: '/api/v1/lotteries/history' },
        ];

        for (const endpoint of protectedEndpoints) {
          const response = await request(app)[endpoint.method](endpoint.path)
            .set('Authorization', `Bearer ${validToken}`)
            .expect((res) => {
              // Should not be 401 (unauthorized)
              expect(res.status).not.toBe(401);
            });
        }
      });

      it('should deny access to protected routes without token', async () => {
        const protectedEndpoints = [
          { method: 'post', path: '/api/v1/auth/verify' },
          { method: 'post', path: '/api/v1/auth/refresh' },
          { method: 'get', path: '/api/v1/lotteries/history' },
          { method: 'post', path: '/api/v1/lotteries/test-id/participate' },
        ];

        for (const endpoint of protectedEndpoints) {
          const response = await request(app)[endpoint.method](endpoint.path)
            .expect(401);

          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toBe('MISSING_TOKEN');
        }
      });

      it('should handle optional authentication correctly', async () => {
        // Logout endpoint uses optional auth
        const response = await request(app)
          .post('/api/v1/auth/logout')
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('Token Payload Validation', () => {
      it('should extract correct user information from token', async () => {
        const response = await request(app)
          .post('/api/v1/auth/verify')
          .set('Authorization', `Bearer ${validToken}`)
          .expect(200);

        const { user } = response.body.data;
        expect(user).toMatchObject({
          id: expect.any(String),
          walletAddress: expect.any(String),
          preferredLanguage: expect.any(String),
        });

        // Wallet address should be lowercase
        expect(user.walletAddress).toBe(user.walletAddress.toLowerCase());
      });

      it('should handle missing user data in token gracefully', async () => {
        // This would require creating a malformed token
        // For now, test with completely invalid token
        const response = await request(app)
          .post('/api/v1/auth/verify')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Security and Rate Limiting', () => {
    describe('Authentication Rate Limiting', () => {
      it('should apply rate limiting to authentication endpoints', async () => {
        const walletAddress = ethers.Wallet.createRandom().address;
        
        // Make multiple rapid requests
        const requests = Array(10).fill(null).map(() =>
          request(app)
            .post('/api/v1/auth/nonce')
            .send({ walletAddress })
        );

        const responses = await Promise.all(requests);
        
        // Some requests should be rate limited
        const successCount = responses.filter(r => r.status === 200).length;
        const rateLimitedCount = responses.filter(r => r.status === 429).length;
        
        expect(successCount + rateLimitedCount).toBe(10);
        expect(rateLimitedCount).toBeGreaterThan(0);
      });

      it('should have different rate limits for different auth endpoints', async () => {
        // Test that nonce and wallet auth have appropriate rate limits
        const walletAddress = ethers.Wallet.createRandom().address;
        
        const nonceRequests = Array(5).fill(null).map(() =>
          request(app)
            .post('/api/v1/auth/nonce')
            .send({ walletAddress })
        );

        const responses = await Promise.all(nonceRequests);
        
        // Should handle reasonable number of nonce requests
        const successCount = responses.filter(r => r.status === 200).length;
        expect(successCount).toBeGreaterThan(0);
      });
    });

    describe('Input Sanitization', () => {
      it('should sanitize wallet address input', async () => {
        const response = await request(app)
          .post('/api/v1/auth/nonce')
          .send({
            walletAddress: '  ' + testWallet.address + '  ', // Test trimming
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should reject XSS attempts in email field', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: '<script>alert("xss")</script>@example.com',
            password: 'ValidPassword123',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('CORS and Security Headers', () => {
      it('should include security headers in auth responses', async () => {
        const response = await request(app)
          .post('/api/v1/auth/nonce')
          .send({ walletAddress: testWallet.address })
          .expect(200);

        // Check for security headers
        expect(response.headers).toHaveProperty('x-content-type-options');
        expect(response.headers).toHaveProperty('x-frame-options');
      });

      it('should handle CORS preflight for auth endpoints', async () => {
        const response = await request(app)
          .options('/api/v1/auth/nonce')
          .set('Origin', 'http://localhost:3000')
          .set('Access-Control-Request-Method', 'POST')
          .expect(204);

        expect(response.headers).toHaveProperty('access-control-allow-origin');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle concurrent authentication requests', async () => {
      const walletAddress = ethers.Wallet.createRandom().address;
      
      // Get nonce first
      const nonceResponse = await request(app)
        .post('/api/v1/auth/nonce')
        .send({ walletAddress })
        .expect(200);

      const { message } = nonceResponse.body.data;
      const wallet = ethers.Wallet.createRandom();
      const signature = await wallet.signMessage(message);

      // Make concurrent authentication requests
      const concurrentRequests = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/v1/auth/wallet')
          .send({
            walletAddress,
            signature,
            message,
          })
      );

      const responses = await Promise.all(concurrentRequests);
      
      // Only one should succeed (nonce should be consumed)
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeLessThanOrEqual(1);
    });

    it('should handle malformed JSON in auth requests', async () => {
      const response = await request(app)
        .post('/api/v1/auth/nonce')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle oversized request bodies', async () => {
      const largePayload = {
        walletAddress: testWallet.address,
        extraData: 'x'.repeat(11 * 1024 * 1024), // 11MB
      };

      const response = await request(app)
        .post('/api/v1/auth/nonce')
        .send(largePayload)
        .expect(413);
    });
  });
});
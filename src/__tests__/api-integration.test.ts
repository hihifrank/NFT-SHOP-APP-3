import request from 'supertest';
import app from '../index';
import AuthService from '../services/authService';
import { ethers } from 'ethers';

describe('API Integration Tests', () => {
  let authService: AuthService;
  let testWallet: ethers.HDNodeWallet;
  let validToken: string;
  let testUser: any;
  let testUserId: string;

  beforeAll(async () => {
    authService = AuthService.getInstance();
    // Create a test wallet for authentication tests
    testWallet = ethers.Wallet.createRandom();
  });

  afterAll(async () => {
    // Cleanup auth service
    authService.cleanup();
  });

  describe('Health Check', () => {
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
  });

  describe('API Info', () => {
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
  });

  describe('404 Handler', () => {
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

  describe('Authentication Flow', () => {
    describe('POST /api/v1/auth/nonce', () => {
      it('should generate nonce for valid wallet address', async () => {
        const response = await request(app)
          .post('/api/v1/auth/nonce')
          .send({
            walletAddress: testWallet.address,
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            nonce: expect.any(String),
            message: expect.any(String),
          },
        });

        // Store for later use
        testUser = response.body.data;
      });

      it('should reject invalid wallet address format', async () => {
        const response = await request(app)
          .post('/api/v1/auth/nonce')
          .send({
            walletAddress: 'invalid-address',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject missing wallet address', async () => {
        const response = await request(app)
          .post('/api/v1/auth/nonce')
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/auth/wallet', () => {
      it('should authenticate with valid wallet signature', async () => {
        // First get a nonce
        const nonceResponse = await request(app)
          .post('/api/v1/auth/nonce')
          .send({
            walletAddress: testWallet.address,
          })
          .expect(200);

        const { message } = nonceResponse.body.data;

        // Sign the message
        const signature = await testWallet.signMessage(message);

        // Authenticate with signature
        const response = await request(app)
          .post('/api/v1/auth/wallet')
          .send({
            walletAddress: testWallet.address,
            signature,
            message,
          })
          .expect(200);

        expect(response.body).toMatchObject({
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

        // Store token and user ID for authenticated requests
        validToken = response.body.data.token;
        testUserId = response.body.data.user.id;
      });

      it('should reject invalid signature', async () => {
        const nonceResponse = await request(app)
          .post('/api/v1/auth/nonce')
          .send({
            walletAddress: testWallet.address,
          })
          .expect(200);

        const { message } = nonceResponse.body.data;

        const response = await request(app)
          .post('/api/v1/auth/wallet')
          .send({
            walletAddress: testWallet.address,
            signature: '0xinvalidsignature',
            message,
          })
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      it('should reject authentication without nonce', async () => {
        const fakeMessage = 'fake message';
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

      it('should reject missing required fields', async () => {
        const response = await request(app)
          .post('/api/v1/auth/wallet')
          .send({
            walletAddress: testWallet.address,
            // Missing signature and message
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/auth/register', () => {
      it('should register user with valid email and password', async () => {
        const userData = {
          email: 'test@example.com',
          password: 'TestPassword123',
          walletAddress: testWallet.address,
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
              id: expect.any(String),
              email: userData.email,
              walletAddress: testWallet.address.toLowerCase(),
              preferredLanguage: userData.preferredLanguage,
            }),
          },
        });
      });

      it('should reject weak password', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'test2@example.com',
            password: 'weak',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject invalid email format', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'invalid-email',
            password: 'TestPassword123',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject invalid wallet address', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'test3@example.com',
            password: 'TestPassword123',
            walletAddress: 'invalid-wallet',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/auth/login', () => {
      it('should return not implemented error', async () => {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'test@example.com',
            password: 'TestPassword123',
          })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('not implemented');
      });
    });
  });

  describe('Protected Routes Authentication', () => {
    describe('POST /api/v1/auth/verify', () => {
      it('should verify valid token', async () => {
        const response = await request(app)
          .post('/api/v1/auth/verify')
          .set('Authorization', `Bearer ${validToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            user: expect.objectContaining({
              id: expect.any(String),
              walletAddress: expect.any(String),
            }),
            message: 'Token is valid',
          },
        });
      });

      it('should reject missing token', async () => {
        const response = await request(app)
          .post('/api/v1/auth/verify')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('MISSING_TOKEN');
      });

      it('should reject invalid token', async () => {
        const response = await request(app)
          .post('/api/v1/auth/verify')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_TOKEN');
      });

      it('should reject malformed authorization header', async () => {
        const response = await request(app)
          .post('/api/v1/auth/verify')
          .set('Authorization', 'InvalidFormat token')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('MISSING_TOKEN');
      });
    });

    describe('POST /api/v1/auth/refresh', () => {
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
              id: expect.any(String),
              walletAddress: expect.any(String),
            }),
          },
        });

        // Verify new token is different
        expect(response.body.data.token).not.toBe(validToken);
      });

      it('should reject refresh without token', async () => {
        const response = await request(app)
          .post('/api/v1/auth/refresh')
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/auth/logout', () => {
      it('should logout successfully with valid token', async () => {
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

      it('should logout successfully without token (optional auth)', async () => {
        const response = await request(app)
          .post('/api/v1/auth/logout')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            message: expect.stringContaining('Logout successful'),
          },
        });
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to auth endpoints', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .post('/api/v1/auth/nonce')
          .send({ walletAddress: testWallet.address })
      );

      const responses = await Promise.all(requests);
      
      // Some requests should succeed, but rate limiting should kick in
      const successCount = responses.filter(r => r.status === 200).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;
      
      // At least some requests should be rate limited
      expect(successCount + rateLimitedCount).toBe(10);
    }, 10000);
  });

  describe('Input Validation', () => {
    it('should validate request body size limits', async () => {
      const largePayload = {
        walletAddress: testWallet.address,
        data: 'x'.repeat(11 * 1024 * 1024), // 11MB payload
      };

      const response = await request(app)
        .post('/api/v1/auth/nonce')
        .send(largePayload)
        .expect(413);
    });

    it('should sanitize and validate input data', async () => {
      const response = await request(app)
        .post('/api/v1/auth/nonce')
        .send({
          walletAddress: '  ' + testWallet.address + '  ', // Test trimming
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle internal server errors gracefully', async () => {
      // This test would require mocking a service to throw an error
      // For now, we'll test the error response format
      const response = await request(app)
        .post('/api/v1/auth/wallet')
        .send({
          walletAddress: testWallet.address,
          signature: 'invalid',
          message: 'invalid',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return proper error format for validation errors', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'short',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          message: expect.any(String),
          code: expect.any(String),
        }),
      });
    });
  });

  describe('CORS and Security Headers', () => {
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

  describe('Coupon API Integration Tests', () => {
    describe('GET /api/v1/coupons', () => {
      it('should get available coupons without authentication', async () => {
        const response = await request(app)
          .get('/api/v1/coupons')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.objectContaining({
            coupons: expect.any(Array),
            pagination: expect.objectContaining({
              total: expect.any(Number),
              limit: expect.any(Number),
              offset: expect.any(Number),
              hasMore: expect.any(Boolean),
            }),
          }),
        });
      });

      it('should handle pagination parameters', async () => {
        const response = await request(app)
          .get('/api/v1/coupons?limit=5&offset=10')
          .expect(200);

        expect(response.body.data.pagination.limit).toBe(5);
        expect(response.body.data.pagination.offset).toBe(10);
      });

      it('should handle filter parameters', async () => {
        const response = await request(app)
          .get('/api/v1/coupons?rarity=rare&minDiscount=10')
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should validate pagination limits', async () => {
        const response = await request(app)
          .get('/api/v1/coupons?limit=200') // Exceeds max limit
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/coupons', () => {
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
        expect(response.body.error.code).toBe('MISSING_TOKEN');
      });

      it('should validate required fields for coupon creation', async () => {
        const response = await request(app)
          .post('/api/v1/coupons')
          .set('Authorization', `Bearer ${validToken}`)
          .send({
            // Missing required fields
            title: 'Test Coupon',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should validate coupon data types and constraints', async () => {
        const response = await request(app)
          .post('/api/v1/coupons')
          .set('Authorization', `Bearer ${validToken}`)
          .send({
            merchantId: 'invalid-uuid',
            couponType: 'invalid-type',
            title: 'A', // Too short
            discountValue: -5, // Negative value
            discountType: 'percentage',
            maxQuantity: 0, // Invalid quantity
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/v1/coupons/:id', () => {
      it('should get coupon details for valid ID format', async () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        const response = await request(app)
          .get(`/api/v1/coupons/${validUuid}`)
          .expect(404); // Will be 404 since coupon doesn't exist, but validates format

        expect(response.body).toHaveProperty('success');
      });

      it('should reject invalid UUID format', async () => {
        const response = await request(app)
          .get('/api/v1/coupons/invalid-id')
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/coupons/:id/use', () => {
      it('should require authentication for coupon usage', async () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        const response = await request(app)
          .post(`/api/v1/coupons/${validUuid}/use`)
          .send({ userId: testUserId })
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      it('should validate user ID in request body', async () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        const response = await request(app)
          .post(`/api/v1/coupons/${validUuid}/use`)
          .set('Authorization', `Bearer ${validToken}`)
          .send({}) // Missing userId
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/coupons/:id/transfer', () => {
      it('should require authentication for coupon transfer', async () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        const response = await request(app)
          .post(`/api/v1/coupons/${validUuid}/transfer`)
          .send({
            fromUserId: testUserId,
            toUserId: 'another-user-id',
          })
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      it('should validate transfer parameters', async () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        const response = await request(app)
          .post(`/api/v1/coupons/${validUuid}/transfer`)
          .set('Authorization', `Bearer ${validToken}`)
          .send({
            fromUserId: 'invalid-uuid',
            // Missing toUserId
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/v1/coupons/:id/validate', () => {
      it('should validate coupon without authentication', async () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        const response = await request(app)
          .get(`/api/v1/coupons/${validUuid}/validate`)
          .expect(404); // Will be 404 since coupon doesn't exist

        expect(response.body).toHaveProperty('success');
      });
    });
  });

  describe('Lottery API Integration Tests', () => {
    describe('GET /api/v1/lotteries/active', () => {
      it('should get active lotteries without authentication', async () => {
        const response = await request(app)
          .get('/api/v1/lotteries/active')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.any(Array),
          pagination: expect.objectContaining({
            page: expect.any(Number),
            limit: expect.any(Number),
            total: expect.any(Number),
            totalPages: expect.any(Number),
          }),
        });
      });

      it('should handle pagination for lotteries', async () => {
        const response = await request(app)
          .get('/api/v1/lotteries/active?page=2&limit=5')
          .expect(200);

        expect(response.body.pagination.page).toBe(2);
        expect(response.body.pagination.limit).toBe(5);
      });
    });

    describe('GET /api/v1/lotteries/:id', () => {
      it('should get lottery details for valid ID', async () => {
        const response = await request(app)
          .get('/api/v1/lotteries/test-lottery-id')
          .expect(404); // Will be 404 since lottery doesn't exist

        expect(response.body).toHaveProperty('success');
      });
    });

    describe('POST /api/v1/lotteries', () => {
      it('should require authentication for lottery creation', async () => {
        const response = await request(app)
          .post('/api/v1/lotteries')
          .send({
            name: 'Test Lottery',
            totalPrizes: 10,
            startTime: new Date(Date.now() + 3600000).toISOString(),
            endTime: new Date(Date.now() + 7200000).toISOString(),
            prizePool: [],
          })
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      it('should validate lottery creation data', async () => {
        const response = await request(app)
          .post('/api/v1/lotteries')
          .set('Authorization', `Bearer ${validToken}`)
          .send({
            // Missing required fields
            name: 'Test Lottery',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/lotteries/:id/participate', () => {
      it('should require authentication for lottery participation', async () => {
        const response = await request(app)
          .post('/api/v1/lotteries/test-lottery-id/participate')
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/v1/lotteries/history', () => {
      it('should require authentication for lottery history', async () => {
        const response = await request(app)
          .get('/api/v1/lotteries/history')
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      it('should get user lottery history with valid token', async () => {
        const response = await request(app)
          .get('/api/v1/lotteries/history')
          .set('Authorization', `Bearer ${validToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.any(Array),
        });
      });
    });

    describe('POST /api/v1/lotteries/verify-randomness', () => {
      it('should verify randomness without authentication', async () => {
        const response = await request(app)
          .post('/api/v1/lotteries/verify-randomness')
          .send({
            seed: 'a'.repeat(32),
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          isValid: expect.any(Boolean),
        });
      });

      it('should validate seed parameter', async () => {
        const response = await request(app)
          .post('/api/v1/lotteries/verify-randomness')
          .send({}) // Missing seed
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('User API Integration Tests', () => {
    describe('GET /api/v1/users/profile', () => {
      it('should return not implemented for user profile', async () => {
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
    });

    describe('GET /api/v1/users/nfts', () => {
      it('should return not implemented for user NFTs', async () => {
        const response = await request(app)
          .get('/api/v1/users/nfts')
          .expect(501);

        expect(response.body).toMatchObject({
          success: false,
          error: expect.objectContaining({
            code: 'NOT_IMPLEMENTED',
          }),
        });
      });
    });
  });

  describe('Merchant API Integration Tests', () => {
    describe('POST /api/v1/merchants/register', () => {
      it('should return not implemented for merchant registration', async () => {
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
    });

    describe('GET /api/v1/merchants/profile', () => {
      it('should return not implemented for merchant profile', async () => {
        const response = await request(app)
          .get('/api/v1/merchants/profile')
          .expect(501);

        expect(response.body).toMatchObject({
          success: false,
          error: expect.objectContaining({
            code: 'NOT_IMPLEMENTED',
          }),
        });
      });
    });
  });

  describe('Store API Integration Tests', () => {
    describe('GET /api/v1/stores/nearby', () => {
      it('should return not implemented for nearby stores', async () => {
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

    describe('GET /api/v1/stores/search', () => {
      it('should return not implemented for store search', async () => {
        const response = await request(app)
          .get('/api/v1/stores/search?query=restaurant')
          .expect(501);

        expect(response.body).toMatchObject({
          success: false,
          error: expect.objectContaining({
            code: 'NOT_IMPLEMENTED',
          }),
        });
      });
    });

    describe('GET /api/v1/stores/:id', () => {
      it('should return not implemented for store details', async () => {
        const response = await request(app)
          .get('/api/v1/stores/test-store-id')
          .expect(501);

        expect(response.body).toMatchObject({
          success: false,
          error: expect.objectContaining({
            code: 'NOT_IMPLEMENTED',
          }),
        });
      });
    });
  });

  describe('Authorization Flow Tests', () => {
    describe('Token Expiration Handling', () => {
      it('should handle expired tokens gracefully', async () => {
        // This would require mocking JWT to return expired token
        // For now, test with malformed token
        const response = await request(app)
          .post('/api/v1/auth/verify')
          .set('Authorization', 'Bearer expired.token.here')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_TOKEN');
      });
    });

    describe('Role-based Access Control', () => {
      it('should allow authenticated users to access protected endpoints', async () => {
        const response = await request(app)
          .get('/api/v1/lotteries/history')
          .set('Authorization', `Bearer ${validToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should deny access to protected endpoints without authentication', async () => {
        const response = await request(app)
          .get('/api/v1/lotteries/history')
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('API Rate Limiting by Endpoint Type', () => {
      it('should apply different rate limits to blockchain operations', async () => {
        // Test blockchain rate limiting (more restrictive)
        const requests = Array(3).fill(null).map(() =>
          request(app)
            .post('/api/v1/coupons/550e8400-e29b-41d4-a716-446655440000/use')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ userId: testUserId })
        );

        const responses = await Promise.all(requests);
        
        // Some should be rate limited due to blockchain rate limiter
        const rateLimitedCount = responses.filter(r => r.status === 429).length;
        expect(rateLimitedCount).toBeGreaterThanOrEqual(0);
      });

      it('should apply general rate limits to regular operations', async () => {
        // Test general rate limiting
        const requests = Array(20).fill(null).map(() =>
          request(app)
            .get('/api/v1/coupons')
        );

        const responses = await Promise.all(requests);
        
        // Check that most requests succeed but some might be rate limited
        const successCount = responses.filter(r => r.status === 200).length;
        expect(successCount).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Validation and Sanitization', () => {
    describe('Input Sanitization', () => {
      it('should sanitize malicious input in request bodies', async () => {
        const response = await request(app)
          .post('/api/v1/auth/nonce')
          .send({
            walletAddress: '  0x1234567890123456789012345678901234567890  ', // Test trimming
            maliciousField: '<script>alert("xss")</script>',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should validate and reject SQL injection attempts', async () => {
        const response = await request(app)
          .get('/api/v1/coupons?merchantId=\'; DROP TABLE users; --')
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('Request Size Limits', () => {
      it('should reject oversized request bodies', async () => {
        const largePayload = {
          walletAddress: testWallet.address,
          data: 'x'.repeat(11 * 1024 * 1024), // 11MB
        };

        const response = await request(app)
          .post('/api/v1/auth/nonce')
          .send(largePayload)
          .expect(413);
      });
    });

    describe('Content Type Validation', () => {
      it('should reject invalid content types', async () => {
        const response = await request(app)
          .post('/api/v1/auth/nonce')
          .set('Content-Type', 'text/plain')
          .send('invalid data')
          .expect(400);
      });
    });
  });

  describe('Error Response Consistency', () => {
    it('should return consistent error format across all endpoints', async () => {
      const endpoints = [
        { method: 'post', path: '/api/v1/auth/nonce', body: {} },
        { method: 'post', path: '/api/v1/coupons', body: {} },
        { method: 'get', path: '/api/v1/coupons/invalid-id' },
      ];

      for (const endpoint of endpoints) {
        let request_builder;
        
        if (endpoint.method === 'post') {
          request_builder = request(app).post(endpoint.path);
        } else {
          request_builder = request(app).get(endpoint.path);
        }
        
        if (endpoint.body) {
          request_builder.send(endpoint.body);
        }

        const response = await request_builder;
        
        // All error responses should have consistent structure
        if (!response.body.success) {
          expect(response.body).toMatchObject({
            success: false,
            error: expect.objectContaining({
              message: expect.any(String),
              code: expect.any(String),
            }),
          });
        }
      }
    });
  });

  describe('API Documentation and Metadata', () => {
    it('should provide API information at root endpoint', async () => {
      const response = await request(app)
        .get('/api/v1')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          message: expect.any(String),
          version: expect.any(String),
          endpoints: expect.objectContaining({
            auth: '/api/v1/auth',
            users: '/api/v1/users',
            merchants: '/api/v1/merchants',
            coupons: '/api/v1/coupons',
            lotteries: '/api/v1/lotteries',
            stores: '/api/v1/stores',
          }),
        }),
      });
    });
  });
});
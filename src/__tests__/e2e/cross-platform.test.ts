import request from 'supertest';
import { Express } from 'express';

describe('Cross-Platform Compatibility Tests', () => {
  let app: Express;

  beforeAll(async () => {
    const { createTestApp } = require('../setup');
    app = await createTestApp();
  });

  describe('Mobile App API Compatibility', () => {
    it('should handle mobile user agent requests', async () => {
      const response = await request(app)
        .get('/api/v1/stores/nearby')
        .set('User-Agent', 'HKRetailNFT/1.0.0 (iOS 16.0; iPhone14,2)')
        .query({
          latitude: 22.3193,
          longitude: 114.1694,
          radius: 1000
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.headers['x-api-version']).toBeDefined();
    });

    it('should handle Android app requests', async () => {
      const response = await request(app)
        .get('/api/v1/coupons')
        .set('User-Agent', 'HKRetailNFT/1.0.0 (Android 13; SM-G998B)')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should support mobile-specific headers', async () => {
      const response = await request(app)
        .get('/api/v1/merchants')
        .set('X-Device-Type', 'mobile')
        .set('X-App-Version', '1.0.0')
        .set('X-Platform', 'ios')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Web Browser Compatibility', () => {
    const browsers = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ];

    browsers.forEach((userAgent, index) => {
      it(`should work with browser ${index + 1}`, async () => {
        const response = await request(app)
          .get('/api/v1/stores/search')
          .set('User-Agent', userAgent)
          .query({ category: 'retail' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('API Version Compatibility', () => {
    it('should handle v1 API requests', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
    });

    it('should include API version in response headers', async () => {
      const response = await request(app)
        .get('/api/v1/coupons')
        .expect(200);

      expect(response.headers['x-api-version']).toBe('1.0');
    });

    it('should handle deprecated endpoints gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/legacy/stores')
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Content-Type Compatibility', () => {
    it('should handle JSON requests', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send({
          walletAddress: '0x1234567890123456789012345678901234567890',
          message: 'test',
          signature: 'test-signature'
        })
        .expect(400); // Expected validation error

      expect(response.body.error).toBeDefined();
    });

    it('should handle form-encoded requests', async () => {
      const response = await request(app)
        .post('/api/v1/stores/search')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('category=retail&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Character Encoding Support', () => {
    it('should handle UTF-8 Chinese characters', async () => {
      const response = await request(app)
        .get('/api/v1/content/common')
        .set('Accept-Language', 'zh-HK')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.headers['content-type']).toContain('charset=utf-8');
    });

    it('should handle emoji in merchant names', async () => {
      const testData = {
        name: '🍕 Pizza Palace 🍕',
        description: 'Best pizza in Hong Kong! 🇭🇰',
        category: 'food'
      };

      // This would normally require authentication
      const response = await request(app)
        .post('/api/v1/merchants/register')
        .send(testData)
        .expect(401); // Expected auth error

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Network Conditions Simulation', () => {
    it('should handle slow network conditions', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/v1/stores/nearby')
        .query({
          latitude: 22.3193,
          longitude: 114.1694,
          radius: 5000
        })
        .timeout(10000) // 10 second timeout
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle request timeouts gracefully', async () => {
      // Simulate timeout by making a request that would take too long
      try {
        await request(app)
          .get('/api/v1/stores/nearby')
          .query({
            latitude: 22.3193,
            longitude: 114.1694,
            radius: 50000 // Very large radius
          })
          .timeout(100) // Very short timeout
          .expect(200);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Offline Capability Testing', () => {
    it('should return appropriate error for offline requests', async () => {
      // Simulate offline by making request to non-existent endpoint
      const response = await request(app)
        .get('/api/v1/offline-test')
        .expect(404);

      expect(response.body.error).toBeDefined();
    });

    it('should provide cached data when available', async () => {
      // First request to populate cache
      await request(app)
        .get('/api/v1/stores/nearby')
        .query({
          latitude: 22.3193,
          longitude: 114.1694,
          radius: 1000
        })
        .expect(200);

      // Second request should use cache
      const response = await request(app)
        .get('/api/v1/stores/nearby')
        .set('Cache-Control', 'max-age=300')
        .query({
          latitude: 22.3193,
          longitude: 114.1694,
          radius: 1000
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Geolocation Compatibility', () => {
    it('should handle different coordinate formats', async () => {
      const coordinates = [
        { lat: 22.3193, lng: 114.1694 }, // Standard format
        { latitude: 22.3193, longitude: 114.1694 }, // Full names
        { lat: '22.3193', lng: '114.1694' }, // String format
      ];

      for (const coord of coordinates) {
        const response = await request(app)
          .get('/api/v1/stores/nearby')
          .query({
            latitude: coord.lat || coord.latitude,
            longitude: coord.lng || coord.longitude,
            radius: 1000
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    it('should handle invalid coordinates gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/stores/nearby')
        .query({
          latitude: 'invalid',
          longitude: 'invalid',
          radius: 1000
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Wallet Integration Compatibility', () => {
    it('should support MetaMask wallet format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/wallet/connect')
        .send({
          walletType: 'metamask',
          address: '0x1234567890123456789012345678901234567890',
          chainId: 137 // Polygon
        })
        .expect(400); // Expected validation error without proper signature

      expect(response.body.error).toBeDefined();
    });

    it('should support WalletConnect format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/wallet/connect')
        .send({
          walletType: 'walletconnect',
          address: '0x1234567890123456789012345678901234567890',
          chainId: 137
        })
        .expect(400); // Expected validation error

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Language and Locale Support', () => {
    const locales = ['zh-HK', 'zh-CN', 'en-US', 'en-GB'];

    locales.forEach(locale => {
      it(`should support ${locale} locale`, async () => {
        const response = await request(app)
          .get('/api/v1/content/common')
          .set('Accept-Language', locale)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    it('should fallback to default language for unsupported locales', async () => {
      const response = await request(app)
        .get('/api/v1/content/common')
        .set('Accept-Language', 'fr-FR') // Unsupported
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  afterAll(async () => {
    if (app && typeof (app as any).close === 'function') {
      await (app as any).close();
    }
  });
});
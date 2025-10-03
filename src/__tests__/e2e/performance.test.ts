import request from 'supertest';
import { Express } from 'express';

describe('Performance and Load Tests', () => {
  let app: Express;

  beforeAll(async () => {
    const { createTestApp } = require('../setup');
    app = await createTestApp();
  });

  describe('Response Time Tests', () => {
    it('should respond to health check within 100ms', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/health')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(100);
    });

    it('should respond to store search within 500ms', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/v1/stores/nearby')
        .query({
          latitude: 22.3193,
          longitude: 114.1694,
          radius: 1000
        })
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500);
    });

    it('should respond to coupon listing within 1000ms', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/v1/coupons')
        .query({ limit: 50 })
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000);
    });
  });

  describe('Concurrent Request Tests', () => {
    it('should handle 10 concurrent health checks', async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(app).get('/health').expect(200)
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      responses.forEach(response => {
        expect(response.body.status).toBe('OK');
      });

      // All 10 requests should complete within 2 seconds
      expect(totalTime).toBeLessThan(2000);
    });

    it('should handle 20 concurrent store searches', async () => {
      const promises = Array.from({ length: 20 }, (_, index) =>
        request(app)
          .get('/api/v1/stores/nearby')
          .query({
            latitude: 22.3193 + (index * 0.001), // Slightly different coordinates
            longitude: 114.1694 + (index * 0.001),
            radius: 1000
          })
          .expect(200)
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });

      // All 20 requests should complete within 5 seconds
      expect(totalTime).toBeLessThan(5000);
    });

    it('should handle mixed concurrent requests', async () => {
      const requests = [
        ...Array.from({ length: 5 }, () => request(app).get('/health')),
        ...Array.from({ length: 5 }, () => 
          request(app).get('/api/v1/stores/nearby').query({
            latitude: 22.3193,
            longitude: 114.1694,
            radius: 1000
          })
        ),
        ...Array.from({ length: 5 }, () => 
          request(app).get('/api/v1/coupons').query({ limit: 10 })
        ),
        ...Array.from({ length: 5 }, () => 
          request(app).get('/api/v1/content/common')
        )
      ];

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });

      // All 20 mixed requests should complete within 10 seconds
      expect(totalTime).toBeLessThan(10000);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not have memory leaks during repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get('/api/v1/stores/nearby')
          .query({
            latitude: 22.3193,
            longitude: 114.1694,
            radius: 1000
          })
          .expect(200);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should handle large response payloads efficiently', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      await request(app)
        .get('/api/v1/coupons')
        .query({ limit: 1000 }) // Large limit
        .expect(200);

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable for large response
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Database Performance Tests', () => {
    it('should handle database queries efficiently', async () => {
      const promises = Array.from({ length: 50 }, () =>
        request(app)
          .get('/api/v1/stores/search')
          .query({
            category: 'retail',
            limit: 20
          })
          .expect(200)
      );

      const startTime = Date.now();
      await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // 50 database queries should complete within 10 seconds
      expect(totalTime).toBeLessThan(10000);
    });

    it('should handle complex geospatial queries efficiently', async () => {
      const promises = Array.from({ length: 20 }, (_, index) =>
        request(app)
          .get('/api/v1/stores/nearby')
          .query({
            latitude: 22.3193 + (index * 0.01),
            longitude: 114.1694 + (index * 0.01),
            radius: 5000
          })
          .expect(200)
      );

      const startTime = Date.now();
      await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // 20 geospatial queries should complete within 5 seconds
      expect(totalTime).toBeLessThan(5000);
    });
  });

  describe('Cache Performance Tests', () => {
    it('should serve cached responses faster', async () => {
      const endpoint = '/api/v1/stores/nearby';
      const query = {
        latitude: 22.3193,
        longitude: 114.1694,
        radius: 1000
      };

      // First request (cache miss)
      const startTime1 = Date.now();
      await request(app).get(endpoint).query(query).expect(200);
      const firstRequestTime = Date.now() - startTime1;

      // Second request (cache hit)
      const startTime2 = Date.now();
      await request(app).get(endpoint).query(query).expect(200);
      const secondRequestTime = Date.now() - startTime2;

      // Cached response should be faster (or at least not significantly slower)
      expect(secondRequestTime).toBeLessThanOrEqual(firstRequestTime * 1.5);
    });

    it('should handle cache invalidation properly', async () => {
      const endpoint = '/api/v1/content/common';

      // Make initial request
      const response1 = await request(app)
        .get(endpoint)
        .set('Accept-Language', 'en')
        .expect(200);

      // Make request with different language
      const response2 = await request(app)
        .get(endpoint)
        .set('Accept-Language', 'zh-HK')
        .expect(200);

      expect(response1.body.success).toBe(true);
      expect(response2.body.success).toBe(true);
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should enforce rate limits', async () => {
      const promises = Array.from({ length: 200 }, () =>
        request(app).get('/health')
      );

      const responses = await Promise.allSettled(promises);
      
      const successfulResponses = responses.filter(
        result => result.status === 'fulfilled' && 
        (result.value as any).status === 200
      );
      
      const rateLimitedResponses = responses.filter(
        result => result.status === 'fulfilled' && 
        (result.value as any).status === 429
      );

      // Should have some rate limited responses if limits are working
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      expect(successfulResponses.length).toBeGreaterThan(0);
    });

    it('should allow requests after rate limit window', async () => {
      // Make requests to trigger rate limit
      const promises = Array.from({ length: 100 }, () =>
        request(app).get('/health')
      );

      await Promise.allSettled(promises);

      // Wait for rate limit window to reset (assuming 1 minute window)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Should be able to make requests again
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
    });
  });

  describe('Stress Tests', () => {
    it('should handle sustained load', async () => {
      const duration = 10000; // 10 seconds
      const startTime = Date.now();
      const requests: Promise<any>[] = [];

      while (Date.now() - startTime < duration) {
        requests.push(
          request(app)
            .get('/api/v1/stores/nearby')
            .query({
              latitude: 22.3193,
              longitude: 114.1694,
              radius: 1000
            })
        );

        // Add small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const responses = await Promise.allSettled(requests);
      
      const successfulResponses = responses.filter(
        result => result.status === 'fulfilled' && 
        (result.value as any).status === 200
      );

      // At least 80% of requests should succeed
      const successRate = successfulResponses.length / responses.length;
      expect(successRate).toBeGreaterThan(0.8);
    });

    it('should recover from high load', async () => {
      // Generate high load
      const highLoadPromises = Array.from({ length: 100 }, () =>
        request(app).get('/health')
      );

      await Promise.allSettled(highLoadPromises);

      // Wait for system to recover
      await new Promise(resolve => setTimeout(resolve, 2000));

      // System should respond normally after load
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
    });
  });

  describe('Resource Usage Tests', () => {
    it('should not exceed CPU usage limits', async () => {
      const startCpuUsage = process.cpuUsage();

      // Generate CPU-intensive load
      const promises = Array.from({ length: 50 }, () =>
        request(app)
          .get('/api/v1/stores/search')
          .query({
            category: 'retail',
            limit: 100
          })
      );

      await Promise.all(promises);

      const endCpuUsage = process.cpuUsage(startCpuUsage);
      const totalCpuTime = endCpuUsage.user + endCpuUsage.system;

      // CPU usage should be reasonable (less than 10 seconds of CPU time)
      expect(totalCpuTime).toBeLessThan(10000000); // 10 seconds in microseconds
    });

    it('should handle file descriptor limits', async () => {
      // Make many concurrent requests that might open file descriptors
      const promises = Array.from({ length: 100 }, () =>
        request(app).get('/api/v1/content/common')
      );

      const responses = await Promise.allSettled(promises);
      
      const successfulResponses = responses.filter(
        result => result.status === 'fulfilled'
      );

      // Most requests should succeed without file descriptor issues
      expect(successfulResponses.length).toBeGreaterThan(90);
    });
  });

  afterAll(async () => {
    if (app && typeof (app as any).close === 'function') {
      await (app as any).close();
    }
  });
});
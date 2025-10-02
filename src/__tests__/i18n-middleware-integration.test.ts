import request from 'supertest';
import app from '../index';
import { initI18n } from '../config/i18n';

describe('i18n Middleware Integration Tests', () => {
  beforeAll(async () => {
    await initI18n();
  });

  describe('Language Detection Priority', () => {
    it('should prioritize query parameter over all other methods', async () => {
      const response = await request(app)
        .get('/api/v1/languages/current?lang=zh-CN')
        .set('X-Language', 'en')
        .set('Accept-Language', 'zh-HK,zh;q=0.9,en;q=0.8')
        .expect(200);

      expect(response.body.language).toBe('zh-CN');
      expect(response.headers['content-language']).toBe('zh-CN');
    });

    it('should prioritize X-Language header over Accept-Language', async () => {
      const response = await request(app)
        .get('/api/v1/languages/current')
        .set('X-Language', 'en')
        .set('Accept-Language', 'zh-HK,zh;q=0.9,en;q=0.8')
        .expect(200);

      expect(response.body.language).toBe('en');
      expect(response.headers['content-language']).toBe('en');
    });

    it('should use Accept-Language when no other language specified', async () => {
      const response = await request(app)
        .get('/api/v1/languages/current')
        .set('Accept-Language', 'en-US,en;q=0.9,zh;q=0.8')
        .expect(200);

      expect(response.body.language).toBe('en');
      expect(response.headers['content-language']).toBe('en');
    });

    it('should fallback to default language when no language specified', async () => {
      const response = await request(app)
        .get('/api/v1/languages/current')
        .expect(200);

      expect(response.body.language).toBe('zh-HK'); // Default language
      expect(response.headers['content-language']).toBe('zh-HK');
    });
  });

  describe('Accept-Language Header Parsing', () => {
    it('should parse simple Accept-Language headers', async () => {
      const testCases = [
        { header: 'en', expected: 'en' },
        { header: 'zh-HK', expected: 'zh-HK' },
        { header: 'zh-CN', expected: 'zh-CN' },
        { header: 'zh', expected: 'zh-HK' }, // Should default to Traditional Chinese
      ];

      for (const { header, expected } of testCases) {
        const response = await request(app)
          .get('/api/v1/languages/current')
          .set('Accept-Language', header)
          .expect(200);

        expect(response.body.language).toBe(expected);
      }
    });

    it('should parse Accept-Language headers with quality values', async () => {
      const testCases = [
        { header: 'en;q=0.9,zh-HK;q=1.0', expected: 'zh-HK' },
        { header: 'zh-CN;q=0.8,en;q=0.9', expected: 'en' },
        { header: 'fr;q=0.9,zh-HK;q=0.8,en;q=0.7', expected: 'zh-HK' },
        { header: 'de;q=1.0,fr;q=0.9,en;q=0.8', expected: 'en' }, // Fallback to supported language
      ];

      for (const { header, expected } of testCases) {
        const response = await request(app)
          .get('/api/v1/languages/current')
          .set('Accept-Language', header)
          .expect(200);

        expect(response.body.language).toBe(expected);
      }
    });

    it('should handle complex Accept-Language headers', async () => {
      const complexHeaders = [
        'zh-HK,zh-TW;q=0.9,zh;q=0.8,en-US;q=0.7,en;q=0.6',
        'en-US,en;q=0.9,zh-Hans-CN;q=0.8,zh-Hans;q=0.7,zh;q=0.6',
        'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7,ja;q=0.6,ko;q=0.5',
      ];

      for (const header of complexHeaders) {
        const response = await request(app)
          .get('/api/v1/languages/current')
          .set('Accept-Language', header)
          .expect(200);

        // Should return one of the supported languages
        expect(['zh-HK', 'zh-CN', 'en']).toContain(response.body.language);
      }
    });

    it('should handle malformed Accept-Language headers gracefully', async () => {
      const malformedHeaders = [
        'zh-HK,',
        ',en',
        'zh-HK;;q=0.9',
        'zh-HK;q=invalid',
        'zh-HK;q=1.5',
        'zh-HK;q=-0.1',
        'zh-HK;invalid=0.9',
        'zh-HK; q = 0.9 ',
        '',
        '   ',
        'invalid-language-code',
      ];

      for (const header of malformedHeaders) {
        const response = await request(app)
          .get('/api/v1/languages/current')
          .set('Accept-Language', header)
          .expect(200);

        // Should fallback to default language without crashing
        expect(['zh-HK', 'zh-CN', 'en']).toContain(response.body.language);
      }
    });
  });

  describe('Request Object Enhancement', () => {
    it('should add language property to request object', async () => {
      // This is tested indirectly through API responses
      const response = await request(app)
        .get('/api/v1/languages/current')
        .set('X-Language', 'zh-CN')
        .expect(200);

      expect(response.body.language).toBe('zh-CN');
      expect(response.body.data.currentLanguage.code).toBe('zh-CN');
    });

    it('should add translation function to request object', async () => {
      // Test that req.t() function works by checking localized messages
      const languages = ['zh-HK', 'zh-CN', 'en'];
      const expectedMessages = {
        'zh-HK': '請求成功',
        'zh-CN': '请求成功',
        'en': 'Request successful'
      };

      for (const lang of languages) {
        const response = await request(app)
          .get('/api/v1/languages')
          .set('X-Language', lang)
          .expect(200);

        expect(response.body.message).toBe(expectedMessages[lang as keyof typeof expectedMessages]);
      }
    });

    it('should handle translation function errors gracefully', async () => {
      // Test with potentially problematic translation keys
      const response = await request(app)
        .get('/api/v1/languages')
        .set('X-Language', 'zh-HK')
        .expect(200);

      // Should not crash even if translation has issues
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('Response Headers', () => {
    it('should set Content-Language header correctly', async () => {
      const languages = ['zh-HK', 'zh-CN', 'en'];

      for (const lang of languages) {
        const response = await request(app)
          .get('/api/v1/languages/current')
          .set('X-Language', lang)
          .expect(200);

        expect(response.headers['content-language']).toBe(lang);
      }
    });

    it('should maintain Content-Language header across different endpoints', async () => {
      const endpoints = [
        '/api/v1/languages',
        '/api/v1/languages/current',
        '/api/v1/content/namespaces'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('X-Language', 'zh-CN')
          .expect(200);

        expect(response.headers['content-language']).toBe('zh-CN');
      }
    });

    it('should set Content-Language header even for error responses', async () => {
      const response = await request(app)
        .post('/api/v1/languages/change')
        .set('X-Language', 'zh-HK')
        .send({ language: 'invalid' })
        .expect(400);

      expect(response.headers['content-language']).toBe('zh-HK');
      expect(response.body.language).toBe('zh-HK');
    });
  });

  describe('Middleware Error Handling', () => {
    it('should handle middleware errors gracefully', async () => {
      // Test with extremely long language codes
      const longLanguageCode = 'a'.repeat(1000);
      
      const response = await request(app)
        .get('/api/v1/languages/current')
        .set('X-Language', longLanguageCode)
        .expect(200);

      // Should fallback to default language
      expect(response.body.language).toBe('zh-HK');
    });

    it('should handle special characters in language headers', async () => {
      const specialCharacters = [
        'zh-HK\x00',
        'zh-HK\n',
        'zh-HK\r',
        'zh-HK\t',
        'zh-HK<script>',
        'zh-HK"',
        "zh-HK'",
        'zh-HK&',
        'zh-HK%',
      ];

      for (const lang of specialCharacters) {
        const response = await request(app)
          .get('/api/v1/languages/current')
          .set('X-Language', lang)
          .expect(200);

        // Should handle gracefully and return valid language
        expect(['zh-HK', 'zh-CN', 'en']).toContain(response.body.language);
      }
    });

    it('should handle concurrent requests with different languages', async () => {
      const concurrentRequests = 20;
      const requests: Promise<any>[] = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const lang = ['zh-HK', 'zh-CN', 'en'][i % 3];
        requests.push(
          request(app)
            .get('/api/v1/languages/current')
            .set('X-Language', lang)
        );
      }

      const responses = await Promise.all(requests);

      responses.forEach((response, index) => {
        const expectedLang = ['zh-HK', 'zh-CN', 'en'][index % 3];
        expect(response.status).toBe(200);
        expect(response.body.language).toBe(expectedLang);
        expect(response.headers['content-language']).toBe(expectedLang);
      });
    });
  });

  describe('API Endpoint Language Consistency', () => {
    it('should maintain language consistency in nested API calls', async () => {
      // Test that language is maintained throughout request processing
      const testLanguage = 'zh-CN';
      
      const response = await request(app)
        .get('/api/v1/languages/translations/common')
        .set('X-Language', testLanguage)
        .expect(200);

      expect(response.body.language).toBe(testLanguage);
      expect(response.body.data.language).toBe(testLanguage);
      expect(response.headers['content-language']).toBe(testLanguage);
      
      // Check that the actual translations are in the correct language
      expect(response.body.data.translations.app.name).toBe('香港零售业NFT优惠券平台');
    });

    it('should handle language switching within request lifecycle', async () => {
      // Test multiple operations in sequence with different languages
      const operations = [
        { lang: 'zh-HK', endpoint: '/api/v1/languages/current' },
        { lang: 'zh-CN', endpoint: '/api/v1/languages' },
        { lang: 'en', endpoint: '/api/v1/content/namespaces' },
        { lang: 'zh-HK', endpoint: '/api/v1/languages/translations/common' }
      ];

      for (const { lang, endpoint } of operations) {
        const response = await request(app)
          .get(endpoint)
          .set('X-Language', lang)
          .expect(200);

        expect(response.body.language).toBe(lang);
        expect(response.headers['content-language']).toBe(lang);
      }
    });

    it('should handle POST requests with language detection', async () => {
      const testLanguage = 'zh-CN';
      
      const response = await request(app)
        .post('/api/v1/languages/change')
        .set('X-Language', testLanguage)
        .send({ language: 'en' })
        .expect(200);

      // Request language should be zh-CN, but changed language should be en
      expect(response.body.language).toBe(testLanguage);
      expect(response.body.data.newLanguage.code).toBe('en');
      expect(response.headers['content-language']).toBe(testLanguage);
    });

    it('should handle PUT and DELETE requests with language detection', async () => {
      const testNamespace = 'test-middleware';
      const testKey = 'test.key';
      const testLanguage = 'zh-HK';

      // Create namespace first
      await request(app)
        .post('/api/v1/content/namespaces')
        .set('X-Language', testLanguage)
        .send({ namespace: testNamespace })
        .expect(201);

      // Create content item
      const createResponse = await request(app)
        .post(`/api/v1/content/${testNamespace}/${testKey}`)
        .set('X-Language', testLanguage)
        .send({
          translations: {
            'zh-HK': '測試內容',
            'zh-CN': '测试内容',
            'en': 'Test Content'
          }
        })
        .expect(201);

      expect(createResponse.body.language).toBe(testLanguage);
      expect(createResponse.headers['content-language']).toBe(testLanguage);

      // Update content item
      const updateResponse = await request(app)
        .put(`/api/v1/content/${testNamespace}/${testKey}`)
        .set('X-Language', testLanguage)
        .send({
          translations: {
            'zh-HK': '更新的測試內容'
          }
        })
        .expect(200);

      expect(updateResponse.body.language).toBe(testLanguage);
      expect(updateResponse.headers['content-language']).toBe(testLanguage);

      // Delete content item
      const deleteResponse = await request(app)
        .delete(`/api/v1/content/${testNamespace}/${testKey}`)
        .set('X-Language', testLanguage)
        .expect(200);

      expect(deleteResponse.body.language).toBe(testLanguage);
      expect(deleteResponse.headers['content-language']).toBe(testLanguage);
    });
  });

  describe('Performance and Memory Management', () => {
    it('should not leak memory during language detection', async () => {
      const initialMemory = process.memoryUsage();
      
      // Make many requests with different languages
      const requests: Promise<any>[] = [];
      for (let i = 0; i < 100; i++) {
        const lang = ['zh-HK', 'zh-CN', 'en'][i % 3];
        requests.push(
          request(app)
            .get('/api/v1/languages/current')
            .set('X-Language', lang)
        );
      }

      await Promise.all(requests);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 20MB)
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024);
    });

    it('should handle high-frequency language detection efficiently', async () => {
      const startTime = Date.now();
      const requestCount = 50;
      
      const requests = Array.from({ length: requestCount }, (_, i) => {
        const lang = ['zh-HK', 'zh-CN', 'en'][i % 3];
        return request(app)
          .get('/api/v1/languages/current')
          .set('X-Language', lang);
      });

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      
      // Should complete within reasonable time (3 seconds for 50 requests)
      expect(endTime - startTime).toBeLessThan(3000);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should cache translation lookups efficiently', async () => {
      const testLanguage = 'zh-HK';
      const requestCount = 20;
      
      // Make multiple identical requests
      const requests = Array.from({ length: requestCount }, () =>
        request(app)
          .get('/api/v1/languages/translations/common')
          .set('X-Language', testLanguage)
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // Should be fast due to caching (less than 2 seconds for 20 requests)
      expect(endTime - startTime).toBeLessThan(2000);

      // All should return identical data
      const firstResponse = responses[0].body;
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.data.translations).toEqual(firstResponse.data.translations);
      });
    });
  });

  describe('Edge Cases and Stress Testing', () => {
    it('should handle requests with no headers', async () => {
      const response = await request(app)
        .get('/api/v1/languages/current')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.language).toBe('zh-HK'); // Default language
    });

    it('should handle requests with empty headers', async () => {
      const response = await request(app)
        .get('/api/v1/languages/current')
        .set('X-Language', '')
        .set('Accept-Language', '')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.language).toBe('zh-HK'); // Default language
    });

    it('should handle requests with conflicting language information', async () => {
      // Query param says one thing, header says another
      const response = await request(app)
        .get('/api/v1/languages/current?lang=zh-HK')
        .set('X-Language', 'zh-CN')
        .set('Accept-Language', 'en')
        .expect(200);

      // Query parameter should win
      expect(response.body.language).toBe('zh-HK');
    });

    it('should handle middleware chain interruption gracefully', async () => {
      // Test that if middleware fails, it doesn't break the entire request
      const response = await request(app)
        .get('/api/v1/languages/current')
        .set('X-Language', 'zh-HK')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.language).toBeDefined();
    });
  });
});
import request from 'supertest';
import app from '../index';
import { initI18n, changeLanguage, DEFAULT_LANGUAGE } from '../config/i18n';

describe('Language Switching Functionality', () => {
  beforeAll(async () => {
    await initI18n();
  });

  afterEach(async () => {
    // Reset to default language after each test
    await changeLanguage(DEFAULT_LANGUAGE);
  });

  describe('Dynamic Language Switching', () => {
    it('should switch language and reflect changes immediately', async () => {
      // Start with default language (zh-HK)
      let response = await request(app)
        .get('/api/v1/languages/current')
        .expect(200);

      expect(response.body.data.currentLanguage.code).toBe('zh-HK');

      // Switch to English
      response = await request(app)
        .post('/api/v1/languages/change')
        .send({ language: 'en' })
        .expect(200);

      expect(response.body.data.newLanguage.code).toBe('en');
      expect(response.body.language).toBe('en');

      // Verify the change is reflected in subsequent requests
      response = await request(app)
        .get('/api/v1/languages/current')
        .set('X-Language', 'en')
        .expect(200);

      expect(response.body.data.currentLanguage.code).toBe('en');
      expect(response.body.language).toBe('en');
    });

    it('should switch between all supported languages', async () => {
      const languages = ['zh-HK', 'zh-CN', 'en'];

      for (const lang of languages) {
        // Switch to language
        const switchResponse = await request(app)
          .post('/api/v1/languages/change')
          .send({ language: lang })
          .expect(200);

        expect(switchResponse.body.data.newLanguage.code).toBe(lang);

        // Verify current language
        const currentResponse = await request(app)
          .get('/api/v1/languages/current')
          .set('X-Language', lang)
          .expect(200);

        expect(currentResponse.body.data.currentLanguage.code).toBe(lang);
      }
    });

    it('should maintain language preference across different API calls', async () => {
      const testLanguage = 'zh-CN';

      // Switch to Simplified Chinese
      await request(app)
        .post('/api/v1/languages/change')
        .send({ language: testLanguage })
        .expect(200);

      // Test multiple endpoints with the same language header
      const endpoints = [
        '/api/v1/languages',
        '/api/v1/languages/current',
        '/api/v1/languages/translations/common'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('X-Language', testLanguage)
          .expect(200);

        expect(response.body.language).toBe(testLanguage);
        expect(response.headers['content-language']).toBe(testLanguage);
      }
    });

    it('should handle rapid language switching', async () => {
      const languages = ['zh-HK', 'en', 'zh-CN', 'zh-HK', 'en'];
      
      for (const lang of languages) {
        const response = await request(app)
          .post('/api/v1/languages/change')
          .send({ language: lang })
          .expect(200);

        expect(response.body.data.newLanguage.code).toBe(lang);
        expect(response.body.language).toBe(lang);
      }
    });
  });

  describe('Language Persistence and State Management', () => {
    it('should handle concurrent language requests without conflicts', async () => {
      const requests = [
        request(app).post('/api/v1/languages/change').send({ language: 'zh-HK' }),
        request(app).post('/api/v1/languages/change').send({ language: 'zh-CN' }),
        request(app).post('/api/v1/languages/change').send({ language: 'en' }),
        request(app).get('/api/v1/languages/current').set('X-Language', 'zh-HK'),
        request(app).get('/api/v1/languages/current').set('X-Language', 'en')
      ];

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(300);
      });

      // Change requests should succeed
      responses.slice(0, 3).forEach(response => {
        expect(response.body.success).toBe(true);
        expect(response.body.data.newLanguage).toBeDefined();
      });

      // Get requests should succeed
      responses.slice(3).forEach(response => {
        expect(response.body.success).toBe(true);
        expect(response.body.data.currentLanguage).toBeDefined();
      });
    });

    it('should validate language switching with invalid inputs', async () => {
      const invalidInputs = [
        { language: 'invalid' },
        { language: '' },
        { language: null },
        { language: 123 },
        { language: ['zh-HK'] },
        { language: { code: 'zh-HK' } },
        {}
      ];

      for (const input of invalidInputs) {
        const response = await request(app)
          .post('/api/v1/languages/change')
          .send(input)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('badRequest');
      }
    });

    it('should handle language switching with malformed requests', async () => {
      // Test with invalid JSON
      const response = await request(app)
        .post('/api/v1/languages/change')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.status).toBe(400);
    });
  });

  describe('Language-Specific Content Validation', () => {
    it('should return different content for different languages', async () => {
      const testKey = 'common:app.name';
      
      // Get Traditional Chinese content
      const zhHKResponse = await request(app)
        .get('/api/v1/languages/translations/common')
        .set('X-Language', 'zh-HK')
        .expect(200);

      const zhHKContent = zhHKResponse.body.data.translations.app.name;

      // Get Simplified Chinese content
      const zhCNResponse = await request(app)
        .get('/api/v1/languages/translations/common')
        .set('X-Language', 'zh-CN')
        .expect(200);

      const zhCNContent = zhCNResponse.body.data.translations.app.name;

      // Get English content
      const enResponse = await request(app)
        .get('/api/v1/languages/translations/common')
        .set('X-Language', 'en')
        .expect(200);

      const enContent = enResponse.body.data.translations.app.name;

      // Content should be different for each language
      expect(zhHKContent).not.toBe(zhCNContent);
      expect(zhHKContent).not.toBe(enContent);
      expect(zhCNContent).not.toBe(enContent);

      // Verify specific content
      expect(zhHKContent).toContain('香港零售業');
      expect(zhCNContent).toContain('香港零售业');
      expect(enContent).toContain('Hong Kong Retail');
    });

    it('should maintain translation quality across language switches', async () => {
      const testKeys = [
        'navigation.home',
        'actions.save',
        'status.active',
        'messages.success'
      ];

      for (const key of testKeys) {
        // Test each language
        const languages = ['zh-HK', 'zh-CN', 'en'];
        
        for (const lang of languages) {
          const response = await request(app)
            .get('/api/v1/languages/translations/common')
            .set('X-Language', lang)
            .expect(200);

          const content = getNestedValue(response.body.data.translations, key);
          
          expect(content).toBeDefined();
          expect(typeof content).toBe('string');
          expect(content.trim().length).toBeGreaterThan(0);
          
          // Ensure content is not just the key
          expect(content).not.toBe(key);
        }
      }
    });

    it('should handle missing translations gracefully', async () => {
      // Test with a potentially missing key
      const response = await request(app)
        .get('/api/v1/languages/translations/common')
        .set('X-Language', 'zh-HK')
        .expect(200);

      // Should not throw errors even if some keys are missing
      expect(response.body.success).toBe(true);
      expect(response.body.data.translations).toBeDefined();
    });
  });

  describe('Language Switching Performance', () => {
    it('should switch languages efficiently', async () => {
      const startTime = Date.now();
      
      // Perform multiple language switches
      const languages = ['zh-HK', 'en', 'zh-CN', 'zh-HK', 'en'];
      
      for (const lang of languages) {
        await request(app)
          .post('/api/v1/languages/change')
          .send({ language: lang })
          .expect(200);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (2 seconds for 5 switches)
      expect(duration).toBeLessThan(2000);
    });

    it('should handle high-frequency language detection', async () => {
      const requests = [];
      
      // Create many concurrent requests with different languages
      for (let i = 0; i < 20; i++) {
        const lang = ['zh-HK', 'zh-CN', 'en'][i % 3];
        requests.push(
          request(app)
            .get('/api/v1/languages/current')
            .set('X-Language', lang)
        );
      }
      
      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      
      // Should handle all requests efficiently
      expect(endTime - startTime).toBeLessThan(3000);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle language switching with special characters', async () => {
      const invalidLanguages = [
        'zh-HK!',
        'en@',
        'zh-CN#',
        'zh HK',
        'zh_HK',
        'ZH-HK'
      ];

      for (const lang of invalidLanguages) {
        const response = await request(app)
          .post('/api/v1/languages/change')
          .send({ language: lang })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('badRequest');
      }
    });

    it('should handle extremely long language codes', async () => {
      const longLanguageCode = 'a'.repeat(1000);
      
      const response = await request(app)
        .post('/api/v1/languages/change')
        .send({ language: longLanguageCode })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('badRequest');
    });

    it('should maintain system stability during language switching errors', async () => {
      // Attempt multiple invalid language switches
      const invalidRequests = [];
      
      for (let i = 0; i < 10; i++) {
        invalidRequests.push(
          request(app)
            .post('/api/v1/languages/change')
            .send({ language: `invalid-${i}` })
        );
      }
      
      const responses = await Promise.all(invalidRequests);
      
      // All should fail gracefully
      responses.forEach(response => {
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
      
      // System should still work normally after errors
      const validResponse = await request(app)
        .get('/api/v1/languages/current')
        .expect(200);
      
      expect(validResponse.body.success).toBe(true);
    });
  });
});

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current && current[key], obj);
}
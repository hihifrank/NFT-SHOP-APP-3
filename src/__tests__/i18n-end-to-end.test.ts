import request from 'supertest';
import app from '../index';
import { initI18n } from '../config/i18n';

describe('i18n End-to-End Integration Tests', () => {
  beforeAll(async () => {
    await initI18n();
  });

  describe('Real API Endpoint Testing', () => {
    it('should handle complete user journey with language switching', async () => {
      // Step 1: Get supported languages
      const languagesResponse = await request(app)
        .get('/api/v1/languages')
        .expect(200);

      expect(languagesResponse.body.success).toBe(true);
      expect(languagesResponse.body.data.languages).toHaveLength(3);
      expect(languagesResponse.body.language).toBe('zh-HK'); // Default

      // Step 2: Switch to English
      const switchResponse = await request(app)
        .post('/api/v1/languages/change')
        .send({ language: 'en' })
        .expect(200);

      expect(switchResponse.body.success).toBe(true);
      expect(switchResponse.body.data.newLanguage.code).toBe('en');

      // Step 3: Get current language (should be English)
      const currentResponse = await request(app)
        .get('/api/v1/languages/current')
        .set('X-Language', 'en')
        .expect(200);

      expect(currentResponse.body.data.currentLanguage.code).toBe('en');
      expect(currentResponse.body.message).toBe('Request successful');

      // Step 4: Get translations in English
      const translationsResponse = await request(app)
        .get('/api/v1/languages/translations/common')
        .set('X-Language', 'en')
        .expect(200);

      expect(translationsResponse.body.data.translations.app.name).toBe('Hong Kong Retail NFT Coupon Platform');
      expect(translationsResponse.body.data.translations.navigation.home).toBe('Home');

      // Step 5: Switch to Traditional Chinese and verify
      await request(app)
        .post('/api/v1/languages/change')
        .send({ language: 'zh-HK' })
        .expect(200);

      const zhHKTranslationsResponse = await request(app)
        .get('/api/v1/languages/translations/common')
        .set('X-Language', 'zh-HK')
        .expect(200);

      expect(zhHKTranslationsResponse.body.data.translations.app.name).toBe('香港零售業NFT優惠券平台');
      expect(zhHKTranslationsResponse.body.data.translations.navigation.home).toBe('主頁');
    });

    it('should handle content management operations with localization', async () => {
      const testNamespace = 'e2e-test';
      const testKey = 'welcome.message';

      // Create namespace
      const namespaceResponse = await request(app)
        .post('/api/v1/content/namespaces')
        .set('X-Language', 'zh-HK')
        .send({ namespace: testNamespace })
        .expect(201);

      expect(namespaceResponse.body.success).toBe(true);
      expect(namespaceResponse.body.message).toBe('資源已創建');

      // Create content item
      const contentData = {
        translations: {
          'zh-HK': '歡迎使用我們的平台！',
          'zh-CN': '欢迎使用我们的平台！',
          'en': 'Welcome to our platform!'
        },
        description: 'Welcome message for users'
      };

      const createResponse = await request(app)
        .post(`/api/v1/content/${testNamespace}/${testKey}`)
        .set('X-Language', 'zh-CN')
        .send(contentData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.message).toBe('资源已创建');
      expect(createResponse.body.data.contentItem.translations['zh-HK']).toBe('歡迎使用我們的平台！');

      // Read content item in different languages
      const readZhHKResponse = await request(app)
        .get(`/api/v1/content/${testNamespace}/${testKey}`)
        .set('X-Language', 'zh-HK')
        .expect(200);

      expect(readZhHKResponse.body.message).toBe('請求成功');

      const readEnResponse = await request(app)
        .get(`/api/v1/content/${testNamespace}/${testKey}`)
        .set('X-Language', 'en')
        .expect(200);

      expect(readEnResponse.body.message).toBe('Request successful');

      // Update content item
      const updateData = {
        translations: {
          'zh-HK': '歡迎回來！'
        }
      };

      const updateResponse = await request(app)
        .put(`/api/v1/content/${testNamespace}/${testKey}`)
        .set('X-Language', 'zh-HK')
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.message).toBe('資源已更新');
      expect(updateResponse.body.data.contentItem.translations['zh-HK']).toBe('歡迎回來！');
      // Other translations should remain unchanged
      expect(updateResponse.body.data.contentItem.translations['en']).toBe('Welcome to our platform!');

      // Delete content item
      const deleteResponse = await request(app)
        .delete(`/api/v1/content/${testNamespace}/${testKey}`)
        .set('X-Language', 'en')
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);
      expect(deleteResponse.body.message).toBe('Resource deleted');

      // Verify deletion
      await request(app)
        .get(`/api/v1/content/${testNamespace}/${testKey}`)
        .set('X-Language', 'zh-HK')
        .expect(404);
    });

    it('should handle error responses with proper localization', async () => {
      // Test 404 error in different languages
      const zhHKErrorResponse = await request(app)
        .get('/api/v1/content/nonexistent/key')
        .set('X-Language', 'zh-HK')
        .expect(404);

      expect(zhHKErrorResponse.body.success).toBe(false);
      expect(zhHKErrorResponse.body.language).toBe('zh-HK');
      expect(zhHKErrorResponse.body.message).toBe('找不到資源');

      const enErrorResponse = await request(app)
        .get('/api/v1/content/nonexistent/key')
        .set('X-Language', 'en')
        .expect(404);

      expect(enErrorResponse.body.success).toBe(false);
      expect(enErrorResponse.body.language).toBe('en');
      expect(enErrorResponse.body.message).toBe('Resource not found');

      // Test 400 error with validation
      const zhCNValidationResponse = await request(app)
        .post('/api/v1/languages/change')
        .set('X-Language', 'zh-CN')
        .send({ language: 'invalid-lang' })
        .expect(400);

      expect(zhCNValidationResponse.body.success).toBe(false);
      expect(zhCNValidationResponse.body.language).toBe('zh-CN');
      expect(zhCNValidationResponse.body.message).toBe('请求格式错误');
    });

    it('should export and import translations correctly', async () => {
      // Export Traditional Chinese translations
      const exportResponse = await request(app)
        .get('/api/v1/content/export/zh-HK')
        .expect(200);

      expect(exportResponse.body.success).toBe(true);
      expect(exportResponse.body.data.language).toBe('zh-HK');
      expect(exportResponse.body.data.translations).toHaveProperty('common');
      expect(exportResponse.body.data.translations).toHaveProperty('api');
      expect(exportResponse.body.data.translations.common.app.name).toBe('香港零售業NFT優惠券平台');

      // Test import (this would typically be used for bulk updates)
      const importData = {
        translations: {
          'test-namespace': {
            'test': {
              'key': 'Test Value'
            }
          }
        }
      };

      const importResponse = await request(app)
        .post('/api/v1/content/import/en')
        .send(importData)
        .expect(200);

      expect(importResponse.body.success).toBe(true);
      expect(importResponse.body.data.language).toBe('en');
      expect(importResponse.body.data.imported).toBe(1);
    });
  });

  describe('Cross-Language Consistency Validation', () => {
    it('should have consistent API response structure across languages', async () => {
      const endpoints = [
        '/api/v1/languages',
        '/api/v1/languages/current',
        '/api/v1/content/namespaces'
      ];

      const languages = ['zh-HK', 'zh-CN', 'en'];

      for (const endpoint of endpoints) {
        const responses: Record<string, any> = {};
        
        for (const lang of languages) {
          const response = await request(app)
            .get(endpoint)
            .set('X-Language', lang)
            .expect(200);

          responses[lang] = response.body;
        }

        // Check that all responses have the same structure
        const keys = Object.keys(responses['zh-HK']);
        
        for (const lang of languages) {
          expect(Object.keys(responses[lang])).toEqual(keys);
          expect(responses[lang].success).toBe(true);
          expect(responses[lang].language).toBe(lang);
          expect(typeof responses[lang].message).toBe('string');
          expect(responses[lang].message.length).toBeGreaterThan(0);
        }

        // Messages should be different (localized)
        expect(responses['zh-HK'].message).not.toBe(responses['zh-CN'].message);
        expect(responses['zh-HK'].message).not.toBe(responses['en'].message);
        expect(responses['zh-CN'].message).not.toBe(responses['en'].message);
      }
    });

    it('should maintain translation quality standards', async () => {
      const namespaces = ['common', 'api', 'coupons', 'merchants', 'lotteries'];
      const languages = ['zh-HK', 'zh-CN', 'en'];

      for (const namespace of namespaces) {
        const translations: Record<string, any> = {};
        
        for (const lang of languages) {
          const response = await request(app)
            .get(`/api/v1/languages/translations/${namespace}`)
            .set('X-Language', lang)
            .expect(200);

          translations[lang] = response.body.data.translations;
        }

        // Validate translation completeness
        const flattenTranslations = (obj: any, prefix = ''): Record<string, string> => {
          const result: Record<string, string> = {};
          
          for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            
            if (typeof value === 'string') {
              result[fullKey] = value;
            } else if (typeof value === 'object' && value !== null) {
              Object.assign(result, flattenTranslations(value, fullKey));
            }
          }
          
          return result;
        };

        const flatTranslations: Record<string, Record<string, string>> = {};
        for (const lang of languages) {
          flatTranslations[lang] = flattenTranslations(translations[lang]);
        }

        // Check key consistency
        const baseKeys = Object.keys(flatTranslations['zh-HK']).sort();
        for (const lang of languages) {
          const currentKeys = Object.keys(flatTranslations[lang]).sort();
          expect(currentKeys).toEqual(baseKeys);
        }

        // Check translation quality
        for (const key of baseKeys) {
          for (const lang of languages) {
            const translation = flatTranslations[lang][key];
            
            // Should not be empty
            expect(translation).toBeTruthy();
            expect(translation.trim().length).toBeGreaterThan(0);
            
            // Should not be just the key
            expect(translation).not.toBe(key);
            
            // Should not contain placeholder text
            expect(translation).not.toMatch(/^[A-Z_]+$/);
            expect(translation).not.toBe('TODO');
            expect(translation).not.toBe('PLACEHOLDER');
          }
        }
      }
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle high-frequency translation requests efficiently', async () => {
      const startTime = Date.now();
      const requestCount = 30;
      
      const requests: Promise<any>[] = [];
      
      for (let i = 0; i < requestCount; i++) {
        const lang = ['zh-HK', 'zh-CN', 'en'][i % 3];
        const namespace = ['common', 'api', 'coupons'][i % 3];
        
        requests.push(
          request(app)
            .get(`/api/v1/languages/translations/${namespace}`)
            .set('X-Language', lang)
        );
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      
      // Should complete within reasonable time (5 seconds for 30 requests)
      expect(endTime - startTime).toBeLessThan(5000);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.translations).toBeDefined();
      });
    });

    it('should maintain consistency under concurrent load', async () => {
      const concurrentUsers = 10;
      const requestsPerUser = 5;
      
      const allRequests: Promise<any>[] = [];
      
      for (let user = 0; user < concurrentUsers; user++) {
        const userLanguage = ['zh-HK', 'zh-CN', 'en'][user % 3];
        
        for (let req = 0; req < requestsPerUser; req++) {
          allRequests.push(
            request(app)
              .get('/api/v1/languages/current')
              .set('X-Language', userLanguage)
          );
        }
      }

      const responses = await Promise.all(allRequests);
      
      // Group responses by expected language
      const responsesByLanguage: Record<string, any[]> = {
        'zh-HK': [],
        'zh-CN': [],
        'en': []
      };

      responses.forEach((response, index) => {
        const expectedLang = ['zh-HK', 'zh-CN', 'en'][Math.floor(index / requestsPerUser) % 3];
        responsesByLanguage[expectedLang].push(response);
      });

      // Verify consistency within each language group
      for (const [lang, langResponses] of Object.entries(responsesByLanguage)) {
        if (langResponses.length === 0) continue;
        
        const firstResponse = langResponses[0].body;
        
        langResponses.forEach(response => {
          expect(response.status).toBe(200);
          expect(response.body.language).toBe(lang);
          expect(response.body.data.currentLanguage.code).toBe(lang);
          expect(response.body.data.currentLanguage.name).toBe(firstResponse.data.currentLanguage.name);
        });
      }
    });

    it('should recover gracefully from translation errors', async () => {
      // Test with potentially problematic requests
      const problematicRequests = [
        { endpoint: '/api/v1/languages/translations/nonexistent', expectedStatus: 404 },
        { endpoint: '/api/v1/content/invalid-namespace/key', expectedStatus: 404 },
        { endpoint: '/api/v1/languages/translations/', expectedStatus: 404 }
      ];

      for (const { endpoint, expectedStatus } of problematicRequests) {
        const response = await request(app)
          .get(endpoint)
          .set('X-Language', 'zh-HK')
          .expect(expectedStatus);

        // Should return proper error structure
        expect(response.body.success).toBe(false);
        expect(response.body.language).toBe('zh-HK');
        expect(response.body.message).toBeDefined();
        expect(typeof response.body.message).toBe('string');
      }

      // System should still work normally after errors
      const normalResponse = await request(app)
        .get('/api/v1/languages/current')
        .set('X-Language', 'zh-HK')
        .expect(200);

      expect(normalResponse.body.success).toBe(true);
      expect(normalResponse.body.language).toBe('zh-HK');
    });
  });
});
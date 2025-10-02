import request from 'supertest';
import app from '../index';
import { initI18n } from '../config/i18n';

describe('Content Management System i18n Tests', () => {
  beforeAll(async () => {
    await initI18n();
  });

  describe('Content Management API', () => {
    it('should get available namespaces', async () => {
      const response = await request(app)
        .get('/api/v1/content/namespaces')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.namespaces).toContain('common');
      expect(response.body.data.namespaces).toContain('api');
      expect(response.body.data.namespaces).toContain('coupons');
      expect(response.body.data.namespaces).toContain('merchants');
      expect(response.body.data.namespaces).toContain('lotteries');
    });

    it('should get content by namespace', async () => {
      const response = await request(app)
        .get('/api/v1/content/common')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.namespace).toBe('common');
      expect(response.body.data.content).toHaveProperty('app.name');
      expect(response.body.data.content).toHaveProperty('navigation.home');
      expect(response.body.data.content).toHaveProperty('actions.save');
    });

    it('should get content in different languages', async () => {
      // Test Traditional Chinese
      const zhHKResponse = await request(app)
        .get('/api/v1/content/common')
        .set('X-Language', 'zh-HK')
        .expect(200);

      expect(zhHKResponse.body.data.content['app.name']).toBe('香港零售業NFT優惠券平台');

      // Test Simplified Chinese
      const zhCNResponse = await request(app)
        .get('/api/v1/content/common')
        .set('X-Language', 'zh-CN')
        .expect(200);

      expect(zhCNResponse.body.data.content['app.name']).toBe('香港零售业NFT优惠券平台');

      // Test English
      const enResponse = await request(app)
        .get('/api/v1/content/common')
        .set('X-Language', 'en')
        .expect(200);

      expect(enResponse.body.data.content['app.name']).toBe('Hong Kong Retail NFT Coupon Platform');
    });

    it('should create new content item', async () => {
      const newContent = {
        translations: {
          'zh-HK': '測試內容項目',
          'zh-CN': '测试内容项目',
          'en': 'Test Content Item'
        },
        description: 'Test content item for i18n testing'
      };

      const response = await request(app)
        .post('/api/v1/content/common/test.item')
        .send(newContent)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contentItem.key).toBe('test.item');
      expect(response.body.data.contentItem.translations['zh-HK']).toBe('測試內容項目');
      expect(response.body.data.contentItem.translations['zh-CN']).toBe('测试内容项目');
      expect(response.body.data.contentItem.translations['en']).toBe('Test Content Item');
    });

    it('should update existing content item', async () => {
      const updateContent = {
        translations: {
          'zh-HK': '更新的測試內容',
          'zh-CN': '更新的测试内容',
          'en': 'Updated Test Content'
        }
      };

      const response = await request(app)
        .put('/api/v1/content/common/test.item')
        .send(updateContent)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contentItem.translations['zh-HK']).toBe('更新的測試內容');
      expect(response.body.data.contentItem.translations['zh-CN']).toBe('更新的测试内容');
      expect(response.body.data.contentItem.translations['en']).toBe('Updated Test Content');
    });

    it('should partially update content item', async () => {
      const partialUpdate = {
        translations: {
          'zh-HK': '部分更新的內容'
        }
      };

      const response = await request(app)
        .put('/api/v1/content/common/test.item')
        .send(partialUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contentItem.translations['zh-HK']).toBe('部分更新的內容');
      // Other languages should remain unchanged
      expect(response.body.data.contentItem.translations['en']).toBe('Updated Test Content');
    });

    it('should validate content item creation', async () => {
      // Test missing translations
      const invalidContent = {
        description: 'Invalid content without translations'
      };

      const response = await request(app)
        .post('/api/v1/content/common/invalid.item')
        .send(invalidContent)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('badRequest');
    });

    it('should delete content item', async () => {
      const response = await request(app)
        .delete('/api/v1/content/common/test.item')
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion
      const getResponse = await request(app)
        .get('/api/v1/content/common')
        .expect(200);

      expect(getResponse.body.data.content).not.toHaveProperty('test.item');
    });

    it('should handle non-existent content item deletion', async () => {
      const response = await request(app)
        .delete('/api/v1/content/common/nonexistent.item')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('notFound');
    });

    it('should export language translations', async () => {
      const response = await request(app)
        .get('/api/v1/content/export/zh-HK')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.language).toBe('zh-HK');
      expect(response.body.data.translations).toHaveProperty('common');
      expect(response.body.data.translations).toHaveProperty('api');
      expect(response.body.data.translations.common).toHaveProperty('app');
    });

    it('should export all supported languages', async () => {
      const languages = ['zh-HK', 'zh-CN', 'en'];

      for (const lang of languages) {
        const response = await request(app)
          .get(`/api/v1/content/export/${lang}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.language).toBe(lang);
        expect(response.body.data.translations).toBeDefined();
      }
    });

    it('should handle invalid language export', async () => {
      const response = await request(app)
        .get('/api/v1/content/export/invalid-lang')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('badRequest');
    });
  });

  describe('Content Validation and Integrity', () => {
    it('should validate translation completeness', async () => {
      // Get all namespaces
      const namespacesResponse = await request(app)
        .get('/api/v1/content/namespaces')
        .expect(200);

      const namespaces = namespacesResponse.body.data.namespaces;
      const languages = ['zh-HK', 'zh-CN', 'en'];

      // Check each namespace has translations for all languages
      for (const namespace of namespaces) {
        for (const lang of languages) {
          const response = await request(app)
            .get(`/api/v1/languages/translations/${namespace}?language=${lang}`)
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.data.translations).toBeDefined();
          expect(typeof response.body.data.translations).toBe('object');
        }
      }
    });

    it('should validate key consistency across languages', async () => {
      const namespace = 'common';
      
      // Get translations for all languages
      const zhHKResponse = await request(app)
        .get(`/api/v1/languages/translations/${namespace}?language=zh-HK`)
        .expect(200);

      const zhCNResponse = await request(app)
        .get(`/api/v1/languages/translations/${namespace}?language=zh-CN`)
        .expect(200);

      const enResponse = await request(app)
        .get(`/api/v1/languages/translations/${namespace}?language=en`)
        .expect(200);

      const zhHKKeys = Object.keys(flattenObject(zhHKResponse.body.data.translations));
      const zhCNKeys = Object.keys(flattenObject(zhCNResponse.body.data.translations));
      const enKeys = Object.keys(flattenObject(enResponse.body.data.translations));

      // All languages should have the same keys
      expect(zhHKKeys.sort()).toEqual(zhCNKeys.sort());
      expect(zhHKKeys.sort()).toEqual(enKeys.sort());
    });

    it('should validate no empty translations', async () => {
      const languages = ['zh-HK', 'zh-CN', 'en'];
      const namespaces = ['common', 'api'];

      for (const lang of languages) {
        for (const namespace of namespaces) {
          const response = await request(app)
            .get(`/api/v1/languages/translations/${namespace}?language=${lang}`)
            .expect(200);

          const flatTranslations = flattenObject(response.body.data.translations);
          
          // Check no empty values
          Object.entries(flatTranslations).forEach(([key, value]) => {
            expect(value).toBeTruthy();
            expect(typeof value).toBe('string');
            expect(value.trim().length).toBeGreaterThan(0);
          });
        }
      }
    });
  });

  describe('Content Management Performance', () => {
    it('should handle bulk content operations efficiently', async () => {
      const bulkContent: Array<{
        key: string;
        translations: {
          'zh-HK': string;
          'zh-CN': string;
          'en': string;
        };
      }> = [];
      
      // Create multiple content items
      for (let i = 0; i < 10; i++) {
        bulkContent.push({
          key: `bulk.test.${i}`,
          translations: {
            'zh-HK': `批量測試 ${i}`,
            'zh-CN': `批量测试 ${i}`,
            'en': `Bulk Test ${i}`
          }
        });
      }

      const startTime = Date.now();

      // Create all items
      const createPromises = bulkContent.map(content =>
        request(app)
          .post(`/api/v1/content/common/${content.key}`)
          .send({ translations: content.translations })
      );

      const responses = await Promise.all(createPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (5 seconds for 10 items)
      expect(duration).toBeLessThan(5000);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Cleanup
      const deletePromises = bulkContent.map(content =>
        request(app).delete(`/api/v1/content/common/${content.key}`)
      );

      await Promise.all(deletePromises);
    });

    it('should cache translation requests efficiently', async () => {
      const requests: Array<any> = [];
      
      // Make multiple identical requests
      for (let i = 0; i < 5; i++) {
        requests.push(
          request(app)
            .get('/api/v1/languages/translations/common?language=zh-HK')
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // Should be fast due to caching
      expect(endTime - startTime).toBeLessThan(1000);

      // All should return the same data
      const firstResponse = responses[0].body;
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.data.translations).toEqual(firstResponse.data.translations);
      });
    });
  });
});

// Helper function to flatten nested objects for key comparison
function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const flattened: Record<string, any> = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key], newKey));
      } else {
        flattened[newKey] = obj[key];
      }
    }
  }
  
  return flattened;
}
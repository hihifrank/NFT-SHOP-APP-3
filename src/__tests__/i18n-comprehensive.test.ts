import request from 'supertest';
import app from '../index';
import { initI18n, changeLanguage, DEFAULT_LANGUAGE } from '../config/i18n';
import fs from 'fs/promises';
import path from 'path';

describe('Comprehensive i18n Testing', () => {
  beforeAll(async () => {
    await initI18n();
  });

  afterEach(async () => {
    await changeLanguage(DEFAULT_LANGUAGE);
  });

  describe('Translation File Integrity', () => {
    const languages = ['zh-HK', 'zh-CN', 'en'];
    const namespaces = ['common', 'api', 'coupons', 'merchants', 'lotteries'];

    it('should have all translation files present', async () => {
      for (const lang of languages) {
        for (const namespace of namespaces) {
          const filePath = path.join(__dirname, '../locales', lang, `${namespace}.json`);
          
          try {
            await fs.access(filePath);
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = JSON.parse(content);
            
            expect(typeof parsed).toBe('object');
            expect(parsed).not.toBeNull();
          } catch (error) {
            fail(`Translation file missing or invalid: ${lang}/${namespace}.json - ${error}`);
          }
        }
      }
    });

    it('should have consistent key structure across languages', async () => {
      for (const namespace of namespaces) {
        const keyStructures: Record<string, Set<string>> = {};
        
        for (const lang of languages) {
          const filePath = path.join(__dirname, '../locales', lang, `${namespace}.json`);
          
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = JSON.parse(content);
            keyStructures[lang] = new Set(getAllKeys(parsed));
          } catch (error) {
            console.warn(`Could not read ${lang}/${namespace}.json:`, error);
            keyStructures[lang] = new Set();
          }
        }

        // Compare key structures
        const baseKeys = keyStructures[languages[0]];
        for (let i = 1; i < languages.length; i++) {
          const currentKeys = keyStructures[languages[i]];
          
          // Check for missing keys
          const missingInCurrent = [...baseKeys].filter(key => !currentKeys.has(key));
          const missingInBase = [...currentKeys].filter(key => !baseKeys.has(key));
          
          if (missingInCurrent.length > 0) {
            console.warn(`Keys missing in ${languages[i]}/${namespace}.json:`, missingInCurrent);
          }
          
          if (missingInBase.length > 0) {
            console.warn(`Extra keys in ${languages[i]}/${namespace}.json:`, missingInBase);
          }
          
          // Allow some variance but warn about major differences
          const totalKeys = Math.max(baseKeys.size, currentKeys.size);
          const commonKeys = [...baseKeys].filter(key => currentKeys.has(key)).length;
          const similarity = commonKeys / totalKeys;
          
          expect(similarity).toBeGreaterThan(0.8); // At least 80% key similarity
        }
      }
    });

    it('should not have empty translation values', async () => {
      for (const lang of languages) {
        for (const namespace of namespaces) {
          const filePath = path.join(__dirname, '../locales', lang, `${namespace}.json`);
          
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = JSON.parse(content);
            const flatKeys = getAllKeyValuePairs(parsed);
            
            for (const [key, value] of flatKeys) {
              expect(value).toBeTruthy();
              expect(typeof value).toBe('string');
              expect(value.trim().length).toBeGreaterThan(0);
              
              // Check for placeholder values that might indicate incomplete translations
              expect(value).not.toBe('TODO');
              expect(value).not.toBe('PLACEHOLDER');
              expect(value).not.toMatch(/^[A-Z_]+$/); // All caps might indicate placeholder
            }
          } catch (error) {
            console.warn(`Could not validate ${lang}/${namespace}.json:`, error);
          }
        }
      }
    });

    it('should have proper character encoding for Chinese text', async () => {
      // Test Traditional Chinese characters
      const zhHKPath = path.join(__dirname, '../locales/zh-HK/common.json');
      const zhHKContent = await fs.readFile(zhHKPath, 'utf-8');
      const zhHKParsed = JSON.parse(zhHKContent);
      
      expect(zhHKParsed.app.name).toContain('業'); // Traditional character
      expect(zhHKParsed.navigation.home).toBe('主頁'); // Traditional
      
      // Test Simplified Chinese characters
      const zhCNPath = path.join(__dirname, '../locales/zh-CN/common.json');
      const zhCNContent = await fs.readFile(zhCNPath, 'utf-8');
      const zhCNParsed = JSON.parse(zhCNContent);
      
      expect(zhCNParsed.app.name).toContain('业'); // Simplified character
      expect(zhCNParsed.navigation.home).toBe('主页'); // Simplified
    });
  });

  describe('Language Switching Edge Cases', () => {
    it('should handle malformed Accept-Language headers', async () => {
      const malformedHeaders = [
        'zh-HK,',
        ',en',
        'zh-HK;;q=0.9',
        'zh-HK;q=invalid',
        'zh-HK;q=1.5', // Invalid quality value
        'zh-HK;q=-0.1', // Negative quality
        'zh-HK;q=0.9;q=0.8', // Duplicate quality
        'zh-HK;invalid=0.9',
        'zh-HK; q = 0.9 ', // Spaces
        'zh-HK,zh-CN,en,fr,de,es,it,pt,ru,ja,ko,ar,hi,th,vi', // Very long
        ''.repeat(1000), // Extremely long
        'zh-HK\x00en', // Null character
        'zh-HK\nen', // Newline character
      ];

      for (const header of malformedHeaders) {
        const response = await request(app)
          .get('/api/v1/languages/current')
          .set('Accept-Language', header)
          .expect(200);

        // Should not crash and should return a valid language
        expect(response.body.success).toBe(true);
        expect(['zh-HK', 'zh-CN', 'en']).toContain(response.body.language);
      }
    });

    it('should handle concurrent language switching stress test', async () => {
      const concurrentRequests = 50;
      const requests: Promise<any>[] = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const lang = ['zh-HK', 'zh-CN', 'en'][i % 3];
        requests.push(
          request(app)
            .post('/api/v1/languages/change')
            .send({ language: lang })
        );
      }

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.newLanguage.code).toBeDefined();
      });
    });

    it('should maintain language consistency during high load', async () => {
      const testLanguage = 'zh-CN';
      const requestCount = 30;
      
      // Switch to test language first
      await request(app)
        .post('/api/v1/languages/change')
        .send({ language: testLanguage });

      // Make many concurrent requests with the same language
      const requests = Array.from({ length: requestCount }, () =>
        request(app)
          .get('/api/v1/languages/current')
          .set('X-Language', testLanguage)
      );

      const responses = await Promise.all(requests);

      // All should return the same language
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.language).toBe(testLanguage);
        expect(response.headers['content-language']).toBe(testLanguage);
      });
    });
  });

  describe('Translation Quality and Completeness', () => {
    it('should have appropriate translation lengths', async () => {
      const testKeys = [
        'common:app.name',
        'common:navigation.home',
        'common:actions.save',
        'api:responses.success'
      ];

      for (const key of testKeys) {
        const translations: Record<string, string> = {};
        
        for (const lang of ['zh-HK', 'zh-CN', 'en']) {
          const response = await request(app)
            .get('/api/v1/languages/translations/common')
            .set('X-Language', lang)
            .expect(200);

          const keyParts = key.split(':')[1].split('.');
          let value = response.body.data.translations;
          for (const part of keyParts) {
            value = value[part];
          }
          
          translations[lang] = value;
        }

        // Check that translations are reasonable lengths relative to each other
        const lengths = Object.values(translations).map(t => t.length);
        const maxLength = Math.max(...lengths);
        const minLength = Math.min(...lengths);
        
        // Translations shouldn't vary by more than 300% in length
        expect(maxLength / minLength).toBeLessThan(3);
        
        // All translations should be at least 1 character
        lengths.forEach(length => {
          expect(length).toBeGreaterThan(0);
        });
      }
    });

    it('should have contextually appropriate translations', async () => {
      // Test that certain key translations make sense in context
      const contextTests = [
        {
          key: 'common:actions.save',
          zhHK: '儲存',
          zhCN: '保存',
          en: 'Save'
        },
        {
          key: 'common:actions.cancel',
          zhHK: '取消',
          zhCN: '取消',
          en: 'Cancel'
        },
        {
          key: 'common:status.active',
          zhHK: '活躍',
          zhCN: '活跃',
          en: 'Active'
        }
      ];

      for (const test of contextTests) {
        // Get Traditional Chinese
        const zhHKResponse = await request(app)
          .get('/api/v1/languages/translations/common')
          .set('X-Language', 'zh-HK')
          .expect(200);

        // Get Simplified Chinese
        const zhCNResponse = await request(app)
          .get('/api/v1/languages/translations/common')
          .set('X-Language', 'zh-CN')
          .expect(200);

        // Get English
        const enResponse = await request(app)
          .get('/api/v1/languages/translations/common')
          .set('X-Language', 'en')
          .expect(200);

        const keyParts = test.key.split(':')[1].split('.');
        
        let zhHKValue = zhHKResponse.body.data.translations;
        let zhCNValue = zhCNResponse.body.data.translations;
        let enValue = enResponse.body.data.translations;
        
        for (const part of keyParts) {
          zhHKValue = zhHKValue[part];
          zhCNValue = zhCNValue[part];
          enValue = enValue[part];
        }

        expect(zhHKValue).toBe(test.zhHK);
        expect(zhCNValue).toBe(test.zhCN);
        expect(enValue).toBe(test.en);
      }
    });

    it('should handle special characters and formatting', async () => {
      // Test that translations handle special characters properly
      const response = await request(app)
        .get('/api/v1/languages/translations/common')
        .set('X-Language', 'zh-HK')
        .expect(200);

      const translations = response.body.data.translations;
      
      // Check for proper punctuation in Chinese
      expect(translations.messages.confirmDelete).toContain('？'); // Chinese question mark
      
      // Check for proper ellipsis
      expect(translations.messages.loading).toContain('...');
    });
  });

  describe('API Response Localization', () => {
    it('should localize all API error responses', async () => {
      const errorTests = [
        {
          endpoint: '/api/v1/languages/change',
          method: 'post',
          body: { language: 'invalid' },
          expectedStatus: 400
        },
        {
          endpoint: '/api/v1/languages/change',
          method: 'post',
          body: {},
          expectedStatus: 400
        },
        {
          endpoint: '/api/v1/content/nonexistent/key',
          method: 'get',
          body: null,
          expectedStatus: 404
        }
      ];

      for (const test of errorTests) {
        for (const lang of ['zh-HK', 'zh-CN', 'en']) {
          let requestBuilder = request(app)[test.method as keyof typeof request](test.endpoint)
            .set('X-Language', lang);

          if (test.body) {
            requestBuilder = requestBuilder.send(test.body);
          }

          const response = await requestBuilder.expect(test.expectedStatus);

          expect(response.body.success).toBe(false);
          expect(response.body.language).toBe(lang);
          expect(response.body.message).toBeDefined();
          expect(typeof response.body.message).toBe('string');
          expect(response.body.message.length).toBeGreaterThan(0);
          
          // Message should be localized (not just the key)
          expect(response.body.message).not.toMatch(/^[a-z]+:[a-z.]+$/);
        }
      }
    });

    it('should localize success responses consistently', async () => {
      const successEndpoints = [
        '/api/v1/languages',
        '/api/v1/languages/current',
        '/api/v1/content/namespaces'
      ];

      for (const endpoint of successEndpoints) {
        for (const lang of ['zh-HK', 'zh-CN', 'en']) {
          const response = await request(app)
            .get(endpoint)
            .set('X-Language', lang)
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.language).toBe(lang);
          expect(response.body.message).toBeDefined();
          
          // Verify message is properly localized
          if (lang === 'zh-HK') {
            expect(response.body.message).toBe('請求成功');
          } else if (lang === 'zh-CN') {
            expect(response.body.message).toBe('请求成功');
          } else if (lang === 'en') {
            expect(response.body.message).toBe('Request successful');
          }
        }
      }
    });
  });

  describe('Performance and Memory', () => {
    it('should not leak memory during language switching', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform many language switches
      for (let i = 0; i < 100; i++) {
        const lang = ['zh-HK', 'zh-CN', 'en'][i % 3];
        await request(app)
          .post('/api/v1/languages/change')
          .send({ language: lang });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      
      // Memory usage shouldn't increase dramatically (allow 50MB increase)
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
    });

    it('should handle translation requests efficiently', async () => {
      const startTime = Date.now();
      const requestCount = 20;
      
      const requests = Array.from({ length: requestCount }, (_, i) => {
        const lang = ['zh-HK', 'zh-CN', 'en'][i % 3];
        const namespace = ['common', 'api'][i % 2];
        
        return request(app)
          .get(`/api/v1/languages/translations/${namespace}`)
          .set('X-Language', lang);
      });

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      
      // Should complete within reasonable time (5 seconds for 20 requests)
      expect(endTime - startTime).toBeLessThan(5000);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Namespace and Content Management', () => {
    it('should validate namespace operations', async () => {
      // Test creating a new namespace
      const testNamespace = 'test-namespace';
      
      const createResponse = await request(app)
        .post('/api/v1/content/namespaces')
        .send({ namespace: testNamespace })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.namespace).toBe(testNamespace);

      // Verify namespace appears in list
      const listResponse = await request(app)
        .get('/api/v1/content/namespaces')
        .expect(200);

      expect(listResponse.body.data.namespaces).toContain(testNamespace);

      // Test getting content from new namespace (should be empty)
      const contentResponse = await request(app)
        .get(`/api/v1/content/${testNamespace}`)
        .expect(200);

      expect(contentResponse.body.data.namespace).toBe(testNamespace);
      expect(contentResponse.body.data.content).toEqual({});
    });

    it('should handle content CRUD operations with proper localization', async () => {
      const testNamespace = 'test-crud';
      const testKey = 'test.item';
      
      // Create namespace first
      await request(app)
        .post('/api/v1/content/namespaces')
        .send({ namespace: testNamespace })
        .expect(201);

      // Create content item
      const createData = {
        translations: {
          'zh-HK': '測試項目',
          'zh-CN': '测试项目',
          'en': 'Test Item'
        },
        description: 'Test content item'
      };

      const createResponse = await request(app)
        .post(`/api/v1/content/${testNamespace}/${testKey}`)
        .send(createData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.contentItem.key).toBe(testKey);
      expect(createResponse.body.data.contentItem.translations['zh-HK']).toBe('測試項目');

      // Read content item
      const readResponse = await request(app)
        .get(`/api/v1/content/${testNamespace}/${testKey}`)
        .expect(200);

      expect(readResponse.body.data.contentItem.translations['zh-CN']).toBe('测试项目');
      expect(readResponse.body.data.contentItem.translations['en']).toBe('Test Item');

      // Update content item
      const updateData = {
        translations: {
          'zh-HK': '更新的測試項目'
        }
      };

      const updateResponse = await request(app)
        .put(`/api/v1/content/${testNamespace}/${testKey}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.data.contentItem.translations['zh-HK']).toBe('更新的測試項目');
      // Other translations should remain unchanged
      expect(updateResponse.body.data.contentItem.translations['en']).toBe('Test Item');

      // Delete content item
      await request(app)
        .delete(`/api/v1/content/${testNamespace}/${testKey}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/v1/content/${testNamespace}/${testKey}`)
        .expect(404);
    });
  });

});

// Helper functions
function getAllKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

function getAllKeyValuePairs(obj: any, prefix = ''): Array<[string, any]> {
  const pairs: Array<[string, any]> = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      pairs.push(...getAllKeyValuePairs(value, fullKey));
    } else {
      pairs.push([fullKey, value]);
    }
  }
  
  return pairs;
}
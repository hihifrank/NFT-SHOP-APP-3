import request from 'supertest';
import app from '../index';
import { 
  initI18n, 
  changeLanguage, 
  t, 
  isSupportedLanguage, 
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  getCurrentLanguage 
} from '../config/i18n';
import { 
  getLocalizedField, 
  formatCurrency, 
  formatDate, 
  getPlural,
  createLocalizedResponse 
} from '../utils/i18nHelper';

describe('Internationalization (i18n)', () => {
  beforeAll(async () => {
    await initI18n();
  });

  afterEach(async () => {
    // Reset to default language after each test
    await changeLanguage(DEFAULT_LANGUAGE);
  });

  describe('i18n Configuration', () => {
    it('should initialize i18n successfully', async () => {
      expect(t('common:app.name')).toBeDefined();
      expect(t('common:app.name')).not.toBe('common:app.name'); // Should not return key
    });

    it('should have correct default language', () => {
      expect(DEFAULT_LANGUAGE).toBe('zh-HK');
      expect(getCurrentLanguage()).toBe('zh-HK');
    });

    it('should support all required languages', () => {
      expect(Object.keys(SUPPORTED_LANGUAGES)).toHaveLength(3);
      expect(SUPPORTED_LANGUAGES).toHaveProperty('zh-HK');
      expect(SUPPORTED_LANGUAGES).toHaveProperty('zh-CN');
      expect(SUPPORTED_LANGUAGES).toHaveProperty('en');
    });

    it('should support language validation', () => {
      expect(isSupportedLanguage('zh-HK')).toBe(true);
      expect(isSupportedLanguage('zh-CN')).toBe(true);
      expect(isSupportedLanguage('en')).toBe(true);
      expect(isSupportedLanguage('fr')).toBe(false);
      expect(isSupportedLanguage('invalid')).toBe(false);
      expect(isSupportedLanguage('')).toBe(false);
    });

    it('should change language successfully', async () => {
      await changeLanguage('en');
      expect(t('common:app.name')).toBe('Hong Kong Retail NFT Coupon Platform');
      expect(getCurrentLanguage()).toBe('en');
      
      await changeLanguage('zh-CN');
      expect(t('common:app.name')).toBe('香港零售业NFT优惠券平台');
      expect(getCurrentLanguage()).toBe('zh-CN');
      
      await changeLanguage('zh-HK');
      expect(t('common:app.name')).toBe('香港零售業NFT優惠券平台');
      expect(getCurrentLanguage()).toBe('zh-HK');
    });

    it('should handle missing translation keys gracefully', () => {
      const missingKey = t('nonexistent:key');
      expect(missingKey).toBeDefined();
      // Should return the key or a fallback, not throw an error
    });

    it('should support nested translation keys', () => {
      expect(t('common:app.name')).toBeDefined();
      expect(t('common:navigation.home')).toBeDefined();
      expect(t('common:actions.save')).toBeDefined();
    });

    it('should support interpolation', () => {
      // Test with a key that supports interpolation
      const result = t('common:messages.success');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('Translation Content Validation', () => {
    const testTranslationKeys = [
      'common:app.name',
      'common:navigation.home',
      'common:actions.save',
      'common:status.active',
      'common:messages.success',
      'api:responses.success',
      'api:validation.required'
    ];

    it('should have consistent translations across all languages', async () => {
      for (const key of testTranslationKeys) {
        // Test Traditional Chinese
        await changeLanguage('zh-HK');
        const zhHK = t(key);
        expect(zhHK).toBeDefined();
        expect(zhHK).not.toBe(key);

        // Test Simplified Chinese
        await changeLanguage('zh-CN');
        const zhCN = t(key);
        expect(zhCN).toBeDefined();
        expect(zhCN).not.toBe(key);

        // Test English
        await changeLanguage('en');
        const en = t(key);
        expect(en).toBeDefined();
        expect(en).not.toBe(key);

        // Ensure translations are different (not just copied)
        if (key.includes('app.name')) {
          expect(zhHK).toContain('香港零售業');
          expect(zhCN).toContain('香港零售业');
          expect(en).toContain('Hong Kong Retail');
        }
      }
    });

    it('should have proper character encoding for Chinese text', async () => {
      await changeLanguage('zh-HK');
      const traditionalText = t('common:app.name');
      expect(traditionalText).toContain('業'); // Traditional character

      await changeLanguage('zh-CN');
      const simplifiedText = t('common:app.name');
      expect(simplifiedText).toContain('业'); // Simplified character
    });

    it('should handle pluralization correctly', async () => {
      // Test different languages handle plurals
      const testCases = [
        { count: 0, lang: 'en' as const },
        { count: 1, lang: 'en' as const },
        { count: 2, lang: 'en' as const },
        { count: 5, lang: 'zh-HK' as const },
        { count: 10, lang: 'zh-CN' as const }
      ];

      for (const testCase of testCases) {
        await changeLanguage(testCase.lang);
        // Test with a pluralizable key if available
        const result = t('common:messages.success', { count: testCase.count });
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      }
    });
  });

  describe('Language API Endpoints', () => {
    it('should get supported languages', async () => {
      const response = await request(app)
        .get('/api/v1/languages')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.languages).toHaveLength(3);
      
      const languages = response.body.data.languages;
      expect(languages.some((l: any) => l.code === 'zh-HK')).toBe(true);
      expect(languages.some((l: any) => l.code === 'zh-CN')).toBe(true);
      expect(languages.some((l: any) => l.code === 'en')).toBe(true);
      
      languages.forEach((lang: any) => {
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('name');
        expect(lang).toHaveProperty('isActive');
        expect(typeof lang.isActive).toBe('boolean');
      });
    });

    it('should get current language', async () => {
      const response = await request(app)
        .get('/api/v1/languages/current')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentLanguage).toHaveProperty('code');
      expect(response.body.data.currentLanguage).toHaveProperty('name');
      expect(response.body.language).toBeDefined();
    });

    it('should change language via API', async () => {
      const response = await request(app)
        .post('/api/v1/languages/change')
        .send({ language: 'en' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.newLanguage.code).toBe('en');
      expect(response.body.data.newLanguage.name).toBe('English');
      expect(response.body.language).toBe('en');
    });

    it('should reject invalid language', async () => {
      const response = await request(app)
        .post('/api/v1/languages/change')
        .send({ language: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('badRequest');
      expect(response.body.details).toHaveProperty('supportedLanguages');
    });

    it('should reject missing language parameter', async () => {
      const response = await request(app)
        .post('/api/v1/languages/change')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('badRequest');
    });

    it('should get translations for namespace', async () => {
      const response = await request(app)
        .get('/api/v1/languages/translations/common')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.namespace).toBe('common');
      expect(response.body.data.language).toBeDefined();
      expect(response.body.data.translations).toHaveProperty('app');
      expect(response.body.data.translations).toHaveProperty('navigation');
      expect(response.body.data.translations).toHaveProperty('actions');
    });

    it('should get translations for different languages', async () => {
      // Test Traditional Chinese
      const zhHKResponse = await request(app)
        .get('/api/v1/languages/translations/common?language=zh-HK')
        .expect(200);

      expect(zhHKResponse.body.data.language).toBe('zh-HK');
      expect(zhHKResponse.body.data.translations.app.name).toContain('香港零售業');

      // Test Simplified Chinese
      const zhCNResponse = await request(app)
        .get('/api/v1/languages/translations/common?language=zh-CN')
        .expect(200);

      expect(zhCNResponse.body.data.language).toBe('zh-CN');
      expect(zhCNResponse.body.data.translations.app.name).toContain('香港零售业');

      // Test English
      const enResponse = await request(app)
        .get('/api/v1/languages/translations/common?language=en')
        .expect(200);

      expect(enResponse.body.data.language).toBe('en');
      expect(enResponse.body.data.translations.app.name).toContain('Hong Kong Retail');
    });

    it('should handle invalid namespace', async () => {
      const response = await request(app)
        .get('/api/v1/languages/translations/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('notFound');
    });

    it('should get all translations', async () => {
      const response = await request(app)
        .get('/api/v1/languages/translations')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.language).toBeDefined();
      expect(response.body.data.translations).toHaveProperty('common');
      expect(response.body.data.translations).toHaveProperty('api');
      
      // Verify structure of translations
      const translations = response.body.data.translations;
      expect(translations.common).toHaveProperty('app');
      expect(translations.api).toHaveProperty('responses');
    });

    it('should get all translations for specific language', async () => {
      const response = await request(app)
        .get('/api/v1/languages/translations?language=en')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.language).toBe('en');
      expect(response.body.data.translations.common.app.name).toBe('Hong Kong Retail NFT Coupon Platform');
    });
  });

  describe('Language Detection Middleware', () => {
    it('should detect language from query parameter', async () => {
      const response = await request(app)
        .get('/api/v1/languages/current?lang=zh-CN')
        .expect(200);

      expect(response.body.language).toBe('zh-CN');
      expect(response.headers['content-language']).toBe('zh-CN');
    });

    it('should detect language from X-Language header', async () => {
      const response = await request(app)
        .get('/api/v1/languages/current')
        .set('X-Language', 'en')
        .expect(200);

      expect(response.body.language).toBe('en');
      expect(response.headers['content-language']).toBe('en');
    });

    it('should prioritize query parameter over header', async () => {
      const response = await request(app)
        .get('/api/v1/languages/current?lang=zh-HK')
        .set('X-Language', 'en')
        .expect(200);

      expect(response.body.language).toBe('zh-HK');
    });

    it('should detect language from Accept-Language header', async () => {
      const response = await request(app)
        .get('/api/v1/languages/current')
        .set('Accept-Language', 'en-US,en;q=0.9,zh;q=0.8')
        .expect(200);

      expect(response.body.language).toBe('en');
    });

    it('should handle Chinese language family in Accept-Language', async () => {
      const response = await request(app)
        .get('/api/v1/languages/current')
        .set('Accept-Language', 'zh-TW,zh;q=0.9,en;q=0.8')
        .expect(200);

      expect(response.body.language).toBe('zh-HK'); // Default Chinese variant
    });

    it('should use default language for unsupported language', async () => {
      const response = await request(app)
        .get('/api/v1/languages/current?lang=unsupported')
        .expect(200);

      expect(response.body.language).toBe('zh-HK'); // Default language
    });

    it('should handle malformed Accept-Language header', async () => {
      const response = await request(app)
        .get('/api/v1/languages/current')
        .set('Accept-Language', 'invalid-header-format')
        .expect(200);

      expect(response.body.language).toBe('zh-HK'); // Should fallback to default
    });

    it('should provide translation function in request object', async () => {
      // This is tested indirectly through API responses that use req.t()
      const response = await request(app)
        .get('/api/v1/languages')
        .set('X-Language', 'zh-HK')
        .expect(200);

      expect(response.body.message).toBe('請求成功'); // Localized message
    });
  });

  describe('i18n Helper Functions', () => {
    const mockRequest = {
      language: 'zh-HK' as const,
      t: (key: string, options?: any) => {
        // Mock translation function
        const translations: Record<string, string> = {
          'common:app.name': '香港零售業NFT優惠券平台',
          'api:responses.success': '請求成功',
          'errors:notFound': '找不到資源'
        };
        return translations[key] || key;
      }
    } as any;

    describe('getLocalizedField', () => {
      it('should get localized field value', () => {
        const obj = {
          name_zh_HK: '香港店鋪',
          name_zh_CN: '香港店铺',
          name_en: 'Hong Kong Store',
          name: 'Default Name'
        };

        const result = getLocalizedField(mockRequest, obj, 'name');
        expect(result).toBe('香港店鋪');
      });

      it('should fallback to default language', () => {
        const obj = {
          name_zh_CN: '香港店铺',
          name_en: 'Hong Kong Store'
        };

        const result = getLocalizedField(mockRequest, obj, 'name', 'zh-CN');
        expect(result).toBe('香港店铺');
      });

      it('should fallback to base field name', () => {
        const obj = {
          name: 'Base Name'
        };

        const result = getLocalizedField(mockRequest, obj, 'name');
        expect(result).toBe('Base Name');
      });
    });

    describe('formatCurrency', () => {
      it('should format currency for different languages', () => {
        const amount = 123.45;

        // Test with different request languages
        const zhHKRequest = { ...mockRequest, language: 'zh-HK' as const };
        const zhCNRequest = { ...mockRequest, language: 'zh-CN' as const };
        const enRequest = { ...mockRequest, language: 'en' as const };

        const zhHKResult = formatCurrency(zhHKRequest, amount);
        const zhCNResult = formatCurrency(zhCNRequest, amount);
        const enResult = formatCurrency(enRequest, amount);

        expect(zhHKResult).toContain('123.45');
        expect(zhCNResult).toContain('123.45');
        expect(enResult).toContain('123.45');
        
        // Should contain currency symbol or code
        expect(zhHKResult).toMatch(/HK\$|HKD/);
        expect(zhCNResult).toMatch(/HK\$|HKD/);
        expect(enResult).toMatch(/HK\$|HKD/);
      });

      it('should handle different currencies', () => {
        const result = formatCurrency(mockRequest, 100, 'USD');
        expect(result).toContain('100');
        expect(result).toMatch(/US\$|USD/);
      });
    });

    describe('formatDate', () => {
      it('should format date for different languages', () => {
        const testDate = new Date('2024-01-15T10:30:00Z');

        const zhHKRequest = { ...mockRequest, language: 'zh-HK' as const };
        const zhCNRequest = { ...mockRequest, language: 'zh-CN' as const };
        const enRequest = { ...mockRequest, language: 'en' as const };

        const zhHKResult = formatDate(zhHKRequest, testDate);
        const zhCNResult = formatDate(zhCNRequest, testDate);
        const enResult = formatDate(enRequest, testDate);

        expect(zhHKResult).toBeDefined();
        expect(zhCNResult).toBeDefined();
        expect(enResult).toBeDefined();
        
        // All should contain the year
        expect(zhHKResult).toContain('2024');
        expect(zhCNResult).toContain('2024');
        expect(enResult).toContain('2024');
      });

      it('should handle string dates', () => {
        const result = formatDate(mockRequest, '2024-01-15T10:30:00Z');
        expect(result).toContain('2024');
      });

      it('should use custom format options', () => {
        const testDate = new Date('2024-01-15T10:30:00Z');
        const options: Intl.DateTimeFormatOptions = {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        };

        const result = formatDate(mockRequest, testDate, options);
        expect(result).toContain('2024');
      });
    });

    describe('createLocalizedResponse', () => {
      it('should create success response', () => {
        const response = createLocalizedResponse(
          mockRequest,
          true,
          'api:responses.success',
          { test: 'data' }
        );

        expect(response.success).toBe(true);
        expect(response.language).toBe('zh-HK');
        expect(response.message).toBe('請求成功');
        expect(response.data).toEqual({ test: 'data' });
        expect(response.timestamp).toBeDefined();
      });

      it('should create error response', () => {
        const response = createLocalizedResponse(
          mockRequest,
          false,
          'errors:notFound',
          undefined,
          'NOT_FOUND'
        );

        expect(response.success).toBe(false);
        expect(response.language).toBe('zh-HK');
        expect(response.message).toBe('找不到資源');
        expect(response.error).toBe('NOT_FOUND');
      });
    });
  });

  describe('Localized API Responses', () => {
    it('should return localized success messages in Traditional Chinese', async () => {
      const response = await request(app)
        .get('/api/v1/languages')
        .set('X-Language', 'zh-HK')
        .expect(200);

      expect(response.body.language).toBe('zh-HK');
      expect(response.body.message).toBe('請求成功');
    });

    it('should return localized success messages in Simplified Chinese', async () => {
      const response = await request(app)
        .get('/api/v1/languages')
        .set('X-Language', 'zh-CN')
        .expect(200);

      expect(response.body.language).toBe('zh-CN');
      expect(response.body.message).toBe('请求成功');
    });

    it('should return localized success messages in English', async () => {
      const response = await request(app)
        .get('/api/v1/languages')
        .set('X-Language', 'en')
        .expect(200);

      expect(response.body.language).toBe('en');
      expect(response.body.message).toBe('Request successful');
    });

    it('should return localized error messages', async () => {
      const response = await request(app)
        .post('/api/v1/languages/change')
        .set('X-Language', 'zh-HK')
        .send({ language: 'invalid' })
        .expect(400);

      expect(response.body.language).toBe('zh-HK');
      expect(response.body.message).toBe('請求格式錯誤');
    });

    it('should return localized error messages in different languages', async () => {
      // Test Simplified Chinese error
      const zhCNResponse = await request(app)
        .post('/api/v1/languages/change')
        .set('X-Language', 'zh-CN')
        .send({ language: 'invalid' })
        .expect(400);

      expect(zhCNResponse.body.language).toBe('zh-CN');
      expect(zhCNResponse.body.message).toBe('请求格式错误');

      // Test English error
      const enResponse = await request(app)
        .post('/api/v1/languages/change')
        .set('X-Language', 'en')
        .send({ language: 'invalid' })
        .expect(400);

      expect(enResponse.body.language).toBe('en');
      expect(enResponse.body.message).toBe('Bad request format');
    });
  });

  describe('Cross-API Language Consistency', () => {
    it('should maintain language consistency across different API endpoints', async () => {
      const testLanguage = 'zh-CN';
      
      // Test multiple endpoints with the same language
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

    it('should handle language switching within a session', async () => {
      // Start with Traditional Chinese
      let response = await request(app)
        .get('/api/v1/languages/current')
        .set('X-Language', 'zh-HK')
        .expect(200);

      expect(response.body.language).toBe('zh-HK');

      // Switch to English
      response = await request(app)
        .post('/api/v1/languages/change')
        .set('X-Language', 'zh-HK')
        .send({ language: 'en' })
        .expect(200);

      expect(response.body.language).toBe('en');
      expect(response.body.data.newLanguage.code).toBe('en');

      // Verify the change took effect
      response = await request(app)
        .get('/api/v1/languages/current')
        .set('X-Language', 'en')
        .expect(200);

      expect(response.body.language).toBe('en');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle concurrent language requests', async () => {
      const requests = [
        request(app).get('/api/v1/languages/current').set('X-Language', 'zh-HK'),
        request(app).get('/api/v1/languages/current').set('X-Language', 'zh-CN'),
        request(app).get('/api/v1/languages/current').set('X-Language', 'en'),
        request(app).get('/api/v1/languages/translations/common').set('X-Language', 'zh-HK'),
        request(app).get('/api/v1/languages/translations/api').set('X-Language', 'en')
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.language).toBeDefined();
      });
    });

    it('should handle empty or null language parameters gracefully', async () => {
      const testCases = [
        { lang: '' },
        { lang: null },
        { lang: undefined }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .get('/api/v1/languages/current')
          .query(testCase.lang ? { lang: testCase.lang } : {})
          .expect(200);

        expect(response.body.language).toBe('zh-HK'); // Should use default
      }
    });

    it('should validate translation file integrity', async () => {
      const languages = ['zh-HK', 'zh-CN', 'en'];
      const namespaces = ['common', 'api'];

      for (const lang of languages) {
        for (const namespace of namespaces) {
          const response = await request(app)
            .get(`/api/v1/languages/translations/${namespace}?language=${lang}`)
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.data.translations).toBeDefined();
          expect(typeof response.body.data.translations).toBe('object');
        }
      }
    });

    it('should handle malformed translation requests', async () => {
      // Test with invalid namespace
      const response = await request(app)
        .get('/api/v1/languages/translations/invalid-namespace')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('notFound');
    });
  });
});
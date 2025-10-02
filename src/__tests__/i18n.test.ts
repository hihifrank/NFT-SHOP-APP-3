import request from 'supertest';
import app from '../index';
import { initI18n, changeLanguage, t, isSupportedLanguage } from '../config/i18n';

describe('Internationalization (i18n)', () => {
  beforeAll(async () => {
    await initI18n();
  });

  describe('i18n Configuration', () => {
    it('should initialize i18n successfully', async () => {
      expect(t('common:app.name')).toBeDefined();
    });

    it('should support language validation', () => {
      expect(isSupportedLanguage('zh-HK')).toBe(true);
      expect(isSupportedLanguage('zh-CN')).toBe(true);
      expect(isSupportedLanguage('en')).toBe(true);
      expect(isSupportedLanguage('fr')).toBe(false);
    });

    it('should change language successfully', async () => {
      await changeLanguage('en');
      expect(t('common:app.name')).toBe('Hong Kong Retail NFT Coupon Platform');
      
      await changeLanguage('zh-HK');
      expect(t('common:app.name')).toBe('香港零售業NFT優惠券平台');
    });
  });

  describe('Language API Endpoints', () => {
    it('should get supported languages', async () => {
      const response = await request(app)
        .get('/api/v1/languages')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.languages).toHaveLength(3);
      expect(response.body.data.languages[0]).toHaveProperty('code');
      expect(response.body.data.languages[0]).toHaveProperty('name');
    });

    it('should get current language', async () => {
      const response = await request(app)
        .get('/api/v1/languages/current')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentLanguage).toHaveProperty('code');
      expect(response.body.data.currentLanguage).toHaveProperty('name');
    });

    it('should change language via API', async () => {
      const response = await request(app)
        .post('/api/v1/languages/change')
        .send({ language: 'en' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.newLanguage.code).toBe('en');
    });

    it('should reject invalid language', async () => {
      const response = await request(app)
        .post('/api/v1/languages/change')
        .send({ language: 'invalid' })
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
      expect(response.body.data.translations).toHaveProperty('app');
    });

    it('should get all translations', async () => {
      const response = await request(app)
        .get('/api/v1/languages/translations')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.translations).toHaveProperty('common');
      expect(response.body.data.translations).toHaveProperty('api');
    });
  });

  describe('Language Detection Middleware', () => {
    it('should detect language from query parameter', async () => {
      const response = await request(app)
        .get('/api/v1/languages/current?lang=zh-CN')
        .expect(200);

      expect(response.body.language).toBe('zh-CN');
    });

    it('should detect language from header', async () => {
      const response = await request(app)
        .get('/api/v1/languages/current')
        .set('X-Language', 'en')
        .expect(200);

      expect(response.body.language).toBe('en');
    });

    it('should use default language for unsupported language', async () => {
      const response = await request(app)
        .get('/api/v1/languages/current?lang=unsupported')
        .expect(200);

      expect(response.body.language).toBe('zh-HK'); // Default language
    });
  });

  describe('Content Management API', () => {
    it('should get namespaces', async () => {
      const response = await request(app)
        .get('/api/v1/content/namespaces')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.namespaces).toContain('common');
      expect(response.body.data.namespaces).toContain('api');
    });

    it('should get content by namespace', async () => {
      const response = await request(app)
        .get('/api/v1/content/common')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.namespace).toBe('common');
      expect(response.body.data.content).toHaveProperty('app.name');
    });

    it('should create new content item', async () => {
      const newContent = {
        translations: {
          'zh-HK': '測試內容',
          'zh-CN': '测试内容',
          'en': 'Test Content'
        },
        description: 'Test content item'
      };

      const response = await request(app)
        .post('/api/v1/content/common/test.content')
        .send(newContent)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contentItem.key).toBe('test.content');
      expect(response.body.data.contentItem.translations['zh-HK']).toBe('測試內容');
    });

    it('should update content item', async () => {
      const updateContent = {
        translations: {
          'zh-HK': '更新的測試內容'
        }
      };

      const response = await request(app)
        .put('/api/v1/content/common/test.content')
        .send(updateContent)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contentItem.translations['zh-HK']).toBe('更新的測試內容');
    });

    it('should delete content item', async () => {
      const response = await request(app)
        .delete('/api/v1/content/common/test.content')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should export language translations', async () => {
      const response = await request(app)
        .get('/api/v1/content/export/zh-HK')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.language).toBe('zh-HK');
      expect(response.body.data.translations).toHaveProperty('common');
    });
  });

  describe('Localized Responses', () => {
    it('should return localized success messages', async () => {
      const response = await request(app)
        .get('/api/v1/languages')
        .set('X-Language', 'zh-HK')
        .expect(200);

      expect(response.body.language).toBe('zh-HK');
      expect(response.body.message).toBe('請求成功');
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
  });
});
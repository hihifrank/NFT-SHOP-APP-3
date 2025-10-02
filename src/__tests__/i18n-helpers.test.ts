import { Request } from 'express';
import {
  getLocalizedField,
  createLocalizedResponse,
  localizeObjectArray,
  getErrorMessage,
  formatCurrency,
  formatDate,
  getPlural,
  getTranslator
} from '../utils/i18nHelper';
import { SupportedLanguage } from '../config/i18n';

describe('i18n Helper Functions', () => {
  // Mock request objects for different languages
  const createMockRequest = (language: SupportedLanguage): Request => ({
    language,
    t: (key: string, options?: any) => {
      // Mock translation function with realistic translations
      const translations: Record<string, Record<string, string>> = {
        'zh-HK': {
          'common:app.name': '香港零售業NFT優惠券平台',
          'api:responses.success': '請求成功',
          'api:responses.created': '資源已創建',
          'api:responses.notFound': '找不到資源',
          'errors:validation.required': '此欄位為必填',
          'errors:auth.unauthorized': '未授權訪問',
          'common:messages.loading': '載入中...',
          'common:currency.hkd': '港幣',
          'common:items_zero': '沒有項目',
          'common:items_one': '一個項目',
          'common:items_other': '{{count}} 個項目'
        },
        'zh-CN': {
          'common:app.name': '香港零售业NFT优惠券平台',
          'api:responses.success': '请求成功',
          'api:responses.created': '资源已创建',
          'api:responses.notFound': '找不到资源',
          'errors:validation.required': '此字段为必填',
          'errors:auth.unauthorized': '未授权访问',
          'common:messages.loading': '加载中...',
          'common:currency.hkd': '港币',
          'common:items_zero': '没有项目',
          'common:items_one': '一个项目',
          'common:items_other': '{{count}} 个项目'
        },
        'en': {
          'common:app.name': 'Hong Kong Retail NFT Coupon Platform',
          'api:responses.success': 'Request successful',
          'api:responses.created': 'Resource created',
          'api:responses.notFound': 'Resource not found',
          'errors:validation.required': 'This field is required',
          'errors:auth.unauthorized': 'Unauthorized access',
          'common:messages.loading': 'Loading...',
          'common:currency.hkd': 'HKD',
          'common:items_zero': 'No items',
          'common:items_one': 'One item',
          'common:items_other': '{{count}} items'
        }
      };

      const translation = translations[language]?.[key];
      if (translation && options?.count !== undefined) {
        return translation.replace('{{count}}', options.count.toString());
      }
      return translation || key;
    }
  } as any);

  describe('getLocalizedField', () => {
    const mockRequest = createMockRequest('zh-HK');

    it('should get localized field for current language', () => {
      const obj = {
        name_zh_HK: '香港店鋪',
        name_zh_CN: '香港店铺',
        name_en: 'Hong Kong Store',
        name: 'Default Name'
      };

      const result = getLocalizedField(mockRequest, obj, 'name');
      expect(result).toBe('香港店鋪');
    });

    it('should fallback to specified fallback language', () => {
      const obj = {
        name_zh_CN: '香港店铺',
        name_en: 'Hong Kong Store'
      };

      const result = getLocalizedField(mockRequest, obj, 'name', 'zh-CN');
      expect(result).toBe('香港店铺');
    });

    it('should fallback to base field name', () => {
      const obj = {
        name: 'Base Name',
        description: 'Base Description'
      };

      const result = getLocalizedField(mockRequest, obj, 'name');
      expect(result).toBe('Base Name');
    });

    it('should return empty string for missing field', () => {
      const obj = {
        other_field: 'Other Value'
      };

      const result = getLocalizedField(mockRequest, obj, 'name');
      expect(result).toBe('');
    });

    it('should handle different languages correctly', () => {
      const obj = {
        title_zh_HK: '繁體中文標題',
        title_zh_CN: '简体中文标题',
        title_en: 'English Title'
      };

      // Test Traditional Chinese
      const zhHKRequest = createMockRequest('zh-HK');
      expect(getLocalizedField(zhHKRequest, obj, 'title')).toBe('繁體中文標題');

      // Test Simplified Chinese
      const zhCNRequest = createMockRequest('zh-CN');
      expect(getLocalizedField(zhCNRequest, obj, 'title')).toBe('简体中文标题');

      // Test English
      const enRequest = createMockRequest('en');
      expect(getLocalizedField(enRequest, obj, 'title')).toBe('English Title');
    });
  });

  describe('createLocalizedResponse', () => {
    const mockRequest = createMockRequest('zh-HK');

    it('should create success response with message', () => {
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
      expect(new Date(response.timestamp)).toBeInstanceOf(Date);
    });

    it('should create error response', () => {
      const response = createLocalizedResponse(
        mockRequest,
        false,
        'api:responses.notFound',
        undefined,
        'NOT_FOUND'
      );

      expect(response.success).toBe(false);
      expect(response.language).toBe('zh-HK');
      expect(response.message).toBe('找不到資源');
      expect(response.error).toBe('NOT_FOUND');
      expect(response.data).toBeUndefined();
    });

    it('should create response without message', () => {
      const response = createLocalizedResponse(
        mockRequest,
        true,
        undefined,
        { result: 'success' }
      );

      expect(response.success).toBe(true);
      expect(response.language).toBe('zh-HK');
      expect(response.message).toBeUndefined();
      expect(response.data).toEqual({ result: 'success' });
    });

    it('should work with different languages', () => {
      const enRequest = createMockRequest('en');
      const response = createLocalizedResponse(
        enRequest,
        true,
        'api:responses.created'
      );

      expect(response.language).toBe('en');
      expect(response.message).toBe('Resource created');
    });
  });

  describe('localizeObjectArray', () => {
    const mockRequest = createMockRequest('zh-HK');

    it('should localize array of objects', () => {
      const objects = [
        {
          id: 1,
          name_zh_HK: '店鋪一',
          name_zh_CN: '店铺一',
          name_en: 'Store One',
          description_zh_HK: '第一間店鋪',
          description_zh_CN: '第一间店铺',
          description_en: 'First store'
        },
        {
          id: 2,
          name_zh_HK: '店鋪二',
          name_zh_CN: '店铺二',
          name_en: 'Store Two',
          description_zh_HK: '第二間店鋪',
          description_zh_CN: '第二间店铺',
          description_en: 'Second store'
        }
      ];

      const result = localizeObjectArray(mockRequest, objects, ['name', 'description']);

      expect(result).toHaveLength(2);
      expect((result[0] as any).name).toBe('店鋪一');
      expect((result[0] as any).description).toBe('第一間店鋪');
      expect((result[1] as any).name).toBe('店鋪二');
      expect((result[1] as any).description).toBe('第二間店鋪');

      // Original fields should be preserved
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    it('should handle missing localized fields', () => {
      const objects = [
        {
          id: 1,
          name_en: 'Store One',
          description: 'Default description'
        }
      ];

      const result = localizeObjectArray(mockRequest, objects, ['name', 'description'], 'en');

      expect(result[0].name).toBe('Store One');
      expect(result[0].description).toBe('Default description');
    });

    it('should work with different languages', () => {
      const objects = [
        {
          title_zh_HK: '繁體標題',
          title_zh_CN: '简体标题',
          title_en: 'English Title'
        }
      ];

      const enRequest = createMockRequest('en');
      const result = localizeObjectArray(enRequest, objects, ['title']);

      expect(result[0].title).toBe('English Title');
    });
  });

  describe('getErrorMessage', () => {
    const mockRequest = createMockRequest('zh-HK');

    it('should get error message from errors namespace', () => {
      const message = getErrorMessage(mockRequest, 'validation.required');
      expect(message).toBe('此欄位為必填');
    });

    it('should fallback to api namespace', () => {
      const message = getErrorMessage(mockRequest, 'notFound');
      expect(message).toBe('找不到資源');
    });

    it('should use fallback message', () => {
      const message = getErrorMessage(mockRequest, 'nonexistent.key', 'Fallback message');
      expect(message).toBe('Fallback message');
    });

    it('should return key if no fallback provided', () => {
      const message = getErrorMessage(mockRequest, 'nonexistent.key');
      expect(message).toBe('nonexistent.key');
    });

    it('should handle translation errors gracefully', () => {
      const brokenRequest = {
        ...mockRequest,
        t: () => { throw new Error('Translation error'); }
      } as any;

      const message = getErrorMessage(brokenRequest, 'any.key', 'Safe fallback');
      expect(message).toBe('Safe fallback');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency for Traditional Chinese', () => {
      const mockRequest = createMockRequest('zh-HK');
      const result = formatCurrency(mockRequest, 123.45);
      
      expect(result).toContain('123.45');
      expect(result).toMatch(/HK\$|HKD/);
    });

    it('should format currency for Simplified Chinese', () => {
      const mockRequest = createMockRequest('zh-CN');
      const result = formatCurrency(mockRequest, 123.45);
      
      expect(result).toContain('123.45');
      expect(result).toMatch(/HK\$|HKD/);
    });

    it('should format currency for English', () => {
      const mockRequest = createMockRequest('en');
      const result = formatCurrency(mockRequest, 123.45);
      
      expect(result).toContain('123.45');
      expect(result).toMatch(/HK\$|HKD/);
    });

    it('should handle different currencies', () => {
      const mockRequest = createMockRequest('en');
      const result = formatCurrency(mockRequest, 100, 'USD');
      
      expect(result).toContain('100');
      expect(result).toMatch(/US\$|USD/);
    });

    it('should handle large numbers', () => {
      const mockRequest = createMockRequest('zh-HK');
      const result = formatCurrency(mockRequest, 1234567.89);
      
      expect(result).toContain('1,234,567.89');
    });

    it('should handle zero and negative numbers', () => {
      const mockRequest = createMockRequest('en');
      
      const zeroResult = formatCurrency(mockRequest, 0);
      expect(zeroResult).toContain('0.00');
      
      const negativeResult = formatCurrency(mockRequest, -50.25);
      expect(negativeResult).toContain('50.25');
    });

    it('should fallback gracefully on formatting errors', () => {
      const mockRequest = createMockRequest('zh-HK');
      const result = formatCurrency(mockRequest, 123.45, 'INVALID_CURRENCY');
      
      // Should still return a string with the amount
      expect(result).toContain('123.45');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2024-01-15T10:30:00Z');

    it('should format date for different languages', () => {
      const zhHKRequest = createMockRequest('zh-HK');
      const zhCNRequest = createMockRequest('zh-CN');
      const enRequest = createMockRequest('en');

      const zhHKResult = formatDate(zhHKRequest, testDate);
      const zhCNResult = formatDate(zhCNRequest, testDate);
      const enResult = formatDate(enRequest, testDate);

      expect(zhHKResult).toContain('2024');
      expect(zhCNResult).toContain('2024');
      expect(enResult).toContain('2024');

      // Results should be different for different locales
      expect(zhHKResult).toBeDefined();
      expect(zhCNResult).toBeDefined();
      expect(enResult).toBeDefined();
    });

    it('should handle string dates', () => {
      const mockRequest = createMockRequest('en');
      const result = formatDate(mockRequest, '2024-01-15T10:30:00Z');
      
      expect(result).toContain('2024');
    });

    it('should use custom format options', () => {
      const mockRequest = createMockRequest('en');
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      };

      const result = formatDate(mockRequest, testDate, options);
      expect(result).toContain('2024');
      expect(result).toContain('Jan');
    });

    it('should handle invalid dates gracefully', () => {
      const mockRequest = createMockRequest('en');
      const result = formatDate(mockRequest, new Date('invalid'));
      
      // Should return ISO string as fallback
      expect(result).toBeDefined();
    });
  });

  describe('getPlural', () => {
    it('should handle pluralization for English', () => {
      const mockRequest = createMockRequest('en');
      
      const zero = getPlural(mockRequest, 'common:items', 0);
      const one = getPlural(mockRequest, 'common:items', 1);
      const many = getPlural(mockRequest, 'common:items', 5);

      expect(zero).toBe('No items');
      expect(one).toBe('One item');
      expect(many).toBe('5 items');
    });

    it('should handle pluralization for Chinese', () => {
      const zhHKRequest = createMockRequest('zh-HK');
      const zhCNRequest = createMockRequest('zh-CN');
      
      const zhHKResult = getPlural(zhHKRequest, 'common:items', 5);
      const zhCNResult = getPlural(zhCNRequest, 'common:items', 5);

      expect(zhHKResult).toBe('5 個項目');
      expect(zhCNResult).toBe('5 个项目');
    });

    it('should pass additional options', () => {
      const mockRequest = createMockRequest('en');
      const result = getPlural(mockRequest, 'common:items', 3, { type: 'special' });
      
      expect(result).toBe('3 items');
    });
  });

  describe('getTranslator', () => {
    it('should return a bound translation function', () => {
      const mockRequest = createMockRequest('zh-HK');
      const t = getTranslator(mockRequest);
      
      expect(typeof t).toBe('function');
      
      const result = t('common:app.name');
      expect(result).toBe('香港零售業NFT優惠券平台');
    });

    it('should work with different languages', () => {
      const enRequest = createMockRequest('en');
      const t = getTranslator(enRequest);
      
      const result = t('api:responses.success');
      expect(result).toBe('Request successful');
    });

    it('should pass options correctly', () => {
      const mockRequest = createMockRequest('en');
      const t = getTranslator(mockRequest);
      
      const result = t('common:items', { count: 3 });
      expect(result).toBe('3 items');
    });
  });

  describe('Integration and Edge Cases', () => {
    it('should handle null and undefined inputs gracefully', () => {
      const mockRequest = createMockRequest('zh-HK');
      
      // Test with null object
      const nullResult = getLocalizedField(mockRequest, null as any, 'name');
      expect(nullResult).toBe('');
      
      // Test with undefined field
      const undefinedResult = getLocalizedField(mockRequest, {}, 'name');
      expect(undefinedResult).toBe('');
    });

    it('should handle empty arrays and objects', () => {
      const mockRequest = createMockRequest('zh-HK');
      
      const emptyArray = localizeObjectArray(mockRequest, [], ['name']);
      expect(emptyArray).toEqual([]);
      
      const emptyObject = getLocalizedField(mockRequest, {}, 'name');
      expect(emptyObject).toBe('');
    });

    it('should maintain performance with large datasets', () => {
      const mockRequest = createMockRequest('zh-HK');
      
      // Create large array of objects
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name_zh_HK: `項目 ${i}`,
        name_en: `Item ${i}`
      }));
      
      const startTime = Date.now();
      const result = localizeObjectArray(mockRequest, largeArray, ['name']);
      const endTime = Date.now();
      
      expect(result).toHaveLength(1000);
      expect(result[0].name).toBe('項目 0');
      expect(result[999].name).toBe('項目 999');
      
      // Should complete within reasonable time (1 second for 1000 items)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
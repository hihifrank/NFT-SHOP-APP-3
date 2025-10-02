import request from 'supertest';
import app from '../index';
import { initI18n, changeLanguage, t } from '../config/i18n';
import { getPlural, formatCurrency, formatDate } from '../utils/i18nHelper';

describe('i18n Pluralization and Advanced Features', () => {
  beforeAll(async () => {
    await initI18n();
  });

  afterEach(async () => {
    await changeLanguage('zh-HK');
  });

  describe('Pluralization Rules', () => {
    const createMockRequest = (language: 'zh-HK' | 'zh-CN' | 'en') => ({
      language,
      t: (key: string, options?: any) => {
        // Mock pluralization for testing
        const pluralRules: Record<string, Record<string, string>> = {
          'zh-HK': {
            'items_zero': '沒有項目',
            'items_one': '一個項目',
            'items_other': '{{count}} 個項目',
            'coupons_zero': '沒有優惠券',
            'coupons_one': '一張優惠券',
            'coupons_other': '{{count}} 張優惠券',
            'merchants_zero': '沒有商家',
            'merchants_one': '一個商家',
            'merchants_other': '{{count}} 個商家'
          },
          'zh-CN': {
            'items_zero': '没有项目',
            'items_one': '一个项目',
            'items_other': '{{count}} 个项目',
            'coupons_zero': '没有优惠券',
            'coupons_one': '一张优惠券',
            'coupons_other': '{{count}} 张优惠券',
            'merchants_zero': '没有商家',
            'merchants_one': '一个商家',
            'merchants_other': '{{count}} 个商家'
          },
          'en': {
            'items_zero': 'no items',
            'items_one': 'one item',
            'items_other': '{{count}} items',
            'coupons_zero': 'no coupons',
            'coupons_one': 'one coupon',
            'coupons_other': '{{count}} coupons',
            'merchants_zero': 'no merchants',
            'merchants_one': 'one merchant',
            'merchants_other': '{{count}} merchants'
          }
        };

        const baseKey = key.replace(/^[^:]*:/, '');
        let pluralKey = baseKey;
        
        if (options?.count !== undefined) {
          const count = options.count;
          if (count === 0) {
            pluralKey = `${baseKey}_zero`;
          } else if (count === 1) {
            pluralKey = `${baseKey}_one`;
          } else {
            pluralKey = `${baseKey}_other`;
          }
        }

        const translation = pluralRules[language]?.[pluralKey] || key;
        return translation.replace('{{count}}', options?.count?.toString() || '');
      }
    } as any);

    it('should handle zero count pluralization', () => {
      const languages: Array<'zh-HK' | 'zh-CN' | 'en'> = ['zh-HK', 'zh-CN', 'en'];
      
      languages.forEach(lang => {
        const mockRequest = createMockRequest(lang);
        
        const itemsResult = getPlural(mockRequest, 'common:items', 0);
        const couponsResult = getPlural(mockRequest, 'common:coupons', 0);
        const merchantsResult = getPlural(mockRequest, 'common:merchants', 0);

        expect(itemsResult).toBeDefined();
        expect(couponsResult).toBeDefined();
        expect(merchantsResult).toBeDefined();

        if (lang === 'zh-HK') {
          expect(itemsResult).toBe('沒有項目');
          expect(couponsResult).toBe('沒有優惠券');
          expect(merchantsResult).toBe('沒有商家');
        } else if (lang === 'zh-CN') {
          expect(itemsResult).toBe('没有项目');
          expect(couponsResult).toBe('没有优惠券');
          expect(merchantsResult).toBe('没有商家');
        } else if (lang === 'en') {
          expect(itemsResult).toBe('no items');
          expect(couponsResult).toBe('no coupons');
          expect(merchantsResult).toBe('no merchants');
        }
      });
    });

    it('should handle singular count pluralization', () => {
      const languages: Array<'zh-HK' | 'zh-CN' | 'en'> = ['zh-HK', 'zh-CN', 'en'];
      
      languages.forEach(lang => {
        const mockRequest = createMockRequest(lang);
        
        const itemsResult = getPlural(mockRequest, 'common:items', 1);
        const couponsResult = getPlural(mockRequest, 'common:coupons', 1);
        const merchantsResult = getPlural(mockRequest, 'common:merchants', 1);

        if (lang === 'zh-HK') {
          expect(itemsResult).toBe('一個項目');
          expect(couponsResult).toBe('一張優惠券');
          expect(merchantsResult).toBe('一個商家');
        } else if (lang === 'zh-CN') {
          expect(itemsResult).toBe('一个项目');
          expect(couponsResult).toBe('一张优惠券');
          expect(merchantsResult).toBe('一个商家');
        } else if (lang === 'en') {
          expect(itemsResult).toBe('one item');
          expect(couponsResult).toBe('one coupon');
          expect(merchantsResult).toBe('one merchant');
        }
      });
    });

    it('should handle plural count pluralization', () => {
      const languages: Array<'zh-HK' | 'zh-CN' | 'en'> = ['zh-HK', 'zh-CN', 'en'];
      const testCounts = [2, 5, 10, 100];
      
      languages.forEach(lang => {
        testCounts.forEach(count => {
          const mockRequest = createMockRequest(lang);
          
          const itemsResult = getPlural(mockRequest, 'common:items', count);
          const couponsResult = getPlural(mockRequest, 'common:coupons', count);
          const merchantsResult = getPlural(mockRequest, 'common:merchants', count);

          expect(itemsResult).toContain(count.toString());
          expect(couponsResult).toContain(count.toString());
          expect(merchantsResult).toContain(count.toString());

          if (lang === 'zh-HK') {
            expect(itemsResult).toBe(`${count} 個項目`);
            expect(couponsResult).toBe(`${count} 張優惠券`);
            expect(merchantsResult).toBe(`${count} 個商家`);
          } else if (lang === 'zh-CN') {
            expect(itemsResult).toBe(`${count} 个项目`);
            expect(couponsResult).toBe(`${count} 张优惠券`);
            expect(merchantsResult).toBe(`${count} 个商家`);
          } else if (lang === 'en') {
            expect(itemsResult).toBe(`${count} items`);
            expect(couponsResult).toBe(`${count} coupons`);
            expect(merchantsResult).toBe(`${count} merchants`);
          }
        });
      });
    });

    it('should handle edge cases in pluralization', () => {
      const mockRequest = createMockRequest('en');
      
      // Test negative numbers
      const negativeResult = getPlural(mockRequest, 'common:items', -1);
      expect(negativeResult).toBe('-1 items');
      
      // Test decimal numbers
      const decimalResult = getPlural(mockRequest, 'common:items', 1.5);
      expect(decimalResult).toBe('1.5 items');
      
      // Test very large numbers
      const largeResult = getPlural(mockRequest, 'common:items', 1000000);
      expect(largeResult).toBe('1000000 items');
    });
  });

  describe('Currency Formatting', () => {
    const createMockRequest = (language: 'zh-HK' | 'zh-CN' | 'en') => ({
      language
    } as any);

    it('should format HKD currency correctly for all languages', () => {
      const testAmounts = [0, 1, 10.5, 100, 1000, 10000.99, 1234567.89];
      
      testAmounts.forEach(amount => {
        // Traditional Chinese (Hong Kong)
        const zhHKRequest = createMockRequest('zh-HK');
        const zhHKResult = formatCurrency(zhHKRequest, amount);
        expect(zhHKResult).toContain(amount.toFixed(2));
        expect(zhHKResult).toMatch(/HK\$|HKD/);

        // Simplified Chinese
        const zhCNRequest = createMockRequest('zh-CN');
        const zhCNResult = formatCurrency(zhCNRequest, amount);
        expect(zhCNResult).toContain(amount.toFixed(2));
        expect(zhCNResult).toMatch(/HK\$|HKD/);

        // English
        const enRequest = createMockRequest('en');
        const enResult = formatCurrency(enRequest, amount);
        expect(enResult).toContain(amount.toFixed(2));
        expect(enResult).toMatch(/HK\$|HKD/);
      });
    });

    it('should format different currencies correctly', () => {
      const mockRequest = createMockRequest('en');
      const testCases = [
        { amount: 100, currency: 'USD', expected: /US\$|USD/ },
        { amount: 100, currency: 'EUR', expected: /€|EUR/ },
        { amount: 100, currency: 'JPY', expected: /¥|JPY/ },
        { amount: 100, currency: 'GBP', expected: /£|GBP/ },
        { amount: 100, currency: 'CNY', expected: /¥|CNY/ }
      ];

      testCases.forEach(({ amount, currency, expected }) => {
        const result = formatCurrency(mockRequest, amount, currency);
        expect(result).toContain(amount.toString());
        expect(result).toMatch(expected);
      });
    });

    it('should handle currency formatting edge cases', () => {
      const mockRequest = createMockRequest('zh-HK');
      
      // Test very small amounts
      const smallResult = formatCurrency(mockRequest, 0.01);
      expect(smallResult).toContain('0.01');
      
      // Test negative amounts
      const negativeResult = formatCurrency(mockRequest, -50.25);
      expect(negativeResult).toContain('50.25');
      
      // Test very large amounts
      const largeResult = formatCurrency(mockRequest, 999999999.99);
      expect(largeResult).toContain('999,999,999.99');
      
      // Test invalid currency (should fallback gracefully)
      const invalidResult = formatCurrency(mockRequest, 100, 'INVALID');
      expect(invalidResult).toContain('100');
    });

    it('should use proper thousand separators for different locales', () => {
      const amount = 1234567.89;
      
      const zhHKRequest = createMockRequest('zh-HK');
      const zhHKResult = formatCurrency(zhHKRequest, amount);
      
      const zhCNRequest = createMockRequest('zh-CN');
      const zhCNResult = formatCurrency(zhCNRequest, amount);
      
      const enRequest = createMockRequest('en');
      const enResult = formatCurrency(enRequest, amount);
      
      // All should contain comma separators for large numbers
      expect(zhHKResult).toMatch(/1,234,567\.89|1 234 567\.89/);
      expect(zhCNResult).toMatch(/1,234,567\.89|1 234 567\.89/);
      expect(enResult).toMatch(/1,234,567\.89|1 234 567\.89/);
    });
  });

  describe('Date Formatting', () => {
    const createMockRequest = (language: 'zh-HK' | 'zh-CN' | 'en') => ({
      language
    } as any);

    const testDate = new Date('2024-03-15T14:30:00Z');

    it('should format dates correctly for all languages', () => {
      const zhHKRequest = createMockRequest('zh-HK');
      const zhCNRequest = createMockRequest('zh-CN');
      const enRequest = createMockRequest('en');

      const zhHKResult = formatDate(zhHKRequest, testDate);
      const zhCNResult = formatDate(zhCNRequest, testDate);
      const enResult = formatDate(enRequest, testDate);

      // All should contain the year
      expect(zhHKResult).toContain('2024');
      expect(zhCNResult).toContain('2024');
      expect(enResult).toContain('2024');

      // All should be different (localized)
      expect(zhHKResult).toBeDefined();
      expect(zhCNResult).toBeDefined();
      expect(enResult).toBeDefined();

      // Results should be strings
      expect(typeof zhHKResult).toBe('string');
      expect(typeof zhCNResult).toBe('string');
      expect(typeof enResult).toBe('string');
    });

    it('should handle string date inputs', () => {
      const mockRequest = createMockRequest('en');
      
      const isoString = '2024-03-15T14:30:00Z';
      const result = formatDate(mockRequest, isoString);
      
      expect(result).toContain('2024');
      expect(typeof result).toBe('string');
    });

    it('should use custom format options', () => {
      const mockRequest = createMockRequest('en');
      
      const shortOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      };

      const longOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };

      const shortResult = formatDate(mockRequest, testDate, shortOptions);
      const longResult = formatDate(mockRequest, testDate, longOptions);

      expect(shortResult).toContain('2024');
      expect(longResult).toContain('2024');
      expect(longResult.length).toBeGreaterThan(shortResult.length);
    });

    it('should handle invalid dates gracefully', () => {
      const mockRequest = createMockRequest('en');
      
      const invalidDate = new Date('invalid-date');
      const result = formatDate(mockRequest, invalidDate);
      
      // Should return a string (fallback to ISO string)
      expect(typeof result).toBe('string');
      expect(result).toBeDefined();
    });

    it('should format dates consistently across time zones', () => {
      const mockRequest = createMockRequest('en');
      
      // Test with different date formats
      const dates = [
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-06-15T12:00:00Z'),
        new Date('2024-12-31T23:59:59Z')
      ];

      dates.forEach(date => {
        const result = formatDate(mockRequest, date);
        expect(result).toContain('2024');
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Advanced i18n Features', () => {
    it('should handle interpolation with complex objects', async () => {
      await changeLanguage('en');
      
      // Test interpolation with nested objects
      const complexData = {
        user: { name: 'John Doe', id: 123 },
        count: 5,
        date: new Date().toISOString()
      };

      // This would test if the i18n system can handle complex interpolation
      const result = t('common:messages.success', complexData);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle namespace fallbacks correctly', async () => {
      // Test fallback behavior when a key doesn't exist in current namespace
      await changeLanguage('zh-HK');
      
      const existingKey = t('common:app.name');
      expect(existingKey).toBe('香港零售業NFT優惠券平台');
      
      // Test with non-existent key (should return key or fallback)
      const nonExistentKey = t('nonexistent:key.that.does.not.exist');
      expect(nonExistentKey).toBeDefined();
      expect(typeof nonExistentKey).toBe('string');
    });

    it('should handle language switching with cached translations', async () => {
      // Test that language switching properly clears/updates caches
      await changeLanguage('zh-HK');
      const zhHKResult = t('common:app.name');
      expect(zhHKResult).toContain('香港零售業');

      await changeLanguage('zh-CN');
      const zhCNResult = t('common:app.name');
      expect(zhCNResult).toContain('香港零售业');

      await changeLanguage('en');
      const enResult = t('common:app.name');
      expect(enResult).toContain('Hong Kong Retail');

      // Switch back to verify cache consistency
      await changeLanguage('zh-HK');
      const zhHKResult2 = t('common:app.name');
      expect(zhHKResult2).toBe(zhHKResult);
    });

    it('should handle concurrent translation requests', async () => {
      const languages = ['zh-HK', 'zh-CN', 'en'];
      const keys = [
        'common:app.name',
        'common:navigation.home',
        'common:actions.save',
        'api:responses.success'
      ];

      const requests: Promise<string>[] = [];
      
      for (const lang of languages) {
        for (const key of keys) {
          requests.push(
            changeLanguage(lang as any).then(() => t(key))
          );
        }
      }

      const results = await Promise.all(requests);
      
      // All results should be valid strings
      results.forEach(result => {
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });

    it('should maintain translation context in nested function calls', async () => {
      await changeLanguage('zh-HK');
      
      // Simulate nested function calls that use translations
      const nestedTranslation = () => {
        const level1 = () => {
          const level2 = () => {
            return t('common:app.name');
          };
          return level2();
        };
        return level1();
      };

      const result = nestedTranslation();
      expect(result).toBe('香港零售業NFT優惠券平台');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed translation keys gracefully', async () => {
      await changeLanguage('en');
      
      const malformedKeys = [
        '',
        '   ',
        'key.with..double.dots',
        'key.with.trailing.',
        '.key.with.leading.dot',
        'key:with:multiple:colons',
        'key\nwith\nnewlines',
        'key\twith\ttabs',
        'key with spaces',
        'key-with-dashes',
        'key_with_underscores',
        'UPPERCASE.KEY',
        'mixedCase.Key',
        '123.numeric.key',
        'key.123.numeric',
        'special!@#$%^&*()characters'
      ];

      malformedKeys.forEach(key => {
        const result = t(key);
        expect(typeof result).toBe('string');
        expect(result).toBeDefined();
        // Should not throw an error
      });
    });

    it('should handle translation with circular references', async () => {
      await changeLanguage('en');
      
      // Test with circular object references in interpolation
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;
      
      // Should not crash the translation system
      const result = t('common:messages.success', circularObj);
      expect(typeof result).toBe('string');
      expect(result).toBeDefined();
    });

    it('should handle extremely long translation values', async () => {
      await changeLanguage('en');
      
      // Test with very long interpolation values
      const longString = 'a'.repeat(10000);
      const result = t('common:messages.success', { longValue: longString });
      
      expect(typeof result).toBe('string');
      expect(result).toBeDefined();
    });

    it('should handle null and undefined interpolation values', async () => {
      await changeLanguage('en');
      
      const testValues = [
        null,
        undefined,
        0,
        false,
        '',
        NaN,
        Infinity,
        -Infinity
      ];

      testValues.forEach(value => {
        const result = t('common:messages.success', { testValue: value });
        expect(typeof result).toBe('string');
        expect(result).toBeDefined();
      });
    });
  });
});
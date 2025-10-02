import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';

// Supported languages
export const SUPPORTED_LANGUAGES = {
  'zh-HK': 'Traditional Chinese',
  'zh-CN': 'Simplified Chinese', 
  'en': 'English'
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Default language
export const DEFAULT_LANGUAGE: SupportedLanguage = 'zh-HK';

// Initialize i18next
export const initI18n = async (): Promise<void> => {
  await i18next
    .use(Backend)
    .init({
      lng: DEFAULT_LANGUAGE,
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
      
      // Backend configuration
      backend: {
        loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
        addPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.missing.json')
      },
      
      // Namespace configuration
      ns: ['common', 'api', 'errors', 'merchants', 'coupons', 'lotteries'],
      defaultNS: 'common',
      
      // Interpolation options
      interpolation: {
        escapeValue: false // React already does escaping
      },
      
      // Development options
      debug: process.env.NODE_ENV === 'development',
      
      // Save missing keys
      saveMissing: true,
      
      // Key separator
      keySeparator: '.',
      nsSeparator: ':',
      
      // Pluralization
      pluralSeparator: '_',
      
      // Return objects for nested keys
      returnObjects: true
    });
};

// Get current language
export const getCurrentLanguage = (): SupportedLanguage => {
  return (i18next.language as SupportedLanguage) || DEFAULT_LANGUAGE;
};

// Change language
export const changeLanguage = async (lng: SupportedLanguage): Promise<void> => {
  await i18next.changeLanguage(lng);
};

// Translation function
export const t = (key: string, options?: any): string => {
  return i18next.t(key, options) as string;
};

// Check if language is supported
export const isSupportedLanguage = (lng: string): lng is SupportedLanguage => {
  return lng in SUPPORTED_LANGUAGES;
};

export default i18next;
import { Request } from 'express';
import { SupportedLanguage } from '../config/i18n';

/**
 * Helper functions for internationalization in controllers
 */

/**
 * Get translation function bound to request language
 */
export const getTranslator = (req: Request) => {
  return (key: string, options?: any): string => {
    return req.t(key, options);
  };
};

/**
 * Get localized field value from an object
 * Useful for database objects that store multilingual content
 */
export const getLocalizedField = (
  req: Request,
  obj: Record<string, any>,
  fieldName: string,
  fallbackLanguage: SupportedLanguage = 'zh-HK'
): string => {
  const language = req.language;
  const localizedFieldName = `${fieldName}_${language}`;
  const fallbackFieldName = `${fieldName}_${fallbackLanguage}`;
  
  return obj[localizedFieldName] || obj[fallbackFieldName] || obj[fieldName] || '';
};

/**
 * Create a localized response object
 */
export const createLocalizedResponse = (
  req: Request,
  success: boolean = true,
  messageKey?: string,
  data?: any,
  error?: string
) => {
  const response: any = {
    success,
    language: req.language,
    timestamp: new Date().toISOString()
  };

  if (messageKey) {
    response.message = req.t(messageKey);
  }

  if (data !== undefined) {
    response.data = data;
  }

  if (error) {
    response.error = error;
  }

  return response;
};

/**
 * Localize array of objects with multilingual fields
 */
export const localizeObjectArray = <T extends Record<string, any>>(
  req: Request,
  objects: T[],
  fieldsToLocalize: string[],
  fallbackLanguage: SupportedLanguage = 'zh-HK'
): T[] => {
  return objects.map(obj => {
    const localizedObj = { ...obj };
    
    fieldsToLocalize.forEach(field => {
      localizedObj[field] = getLocalizedField(req, obj, field, fallbackLanguage);
    });
    
    return localizedObj;
  });
};

/**
 * Get error message with fallback
 */
export const getErrorMessage = (
  req: Request,
  errorKey: string,
  fallbackMessage?: string
): string => {
  try {
    return req.t(`errors:${errorKey}`) || req.t(`api:responses.${errorKey}`) || fallbackMessage || errorKey;
  } catch {
    return fallbackMessage || errorKey;
  }
};

/**
 * Format currency for the current locale
 */
export const formatCurrency = (
  req: Request,
  amount: number,
  currency: string = 'HKD'
): string => {
  const language = req.language;
  
  // Map our language codes to standard locale codes
  const localeMap: Record<SupportedLanguage, string> = {
    'zh-HK': 'zh-HK',
    'zh-CN': 'zh-CN',
    'en': 'en-HK' // Use Hong Kong English for currency formatting
  };
  
  const locale = localeMap[language] || 'zh-HK';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  } catch {
    // Fallback formatting
    return `${currency} ${amount.toFixed(2)}`;
  }
};

/**
 * Format date for the current locale
 */
export const formatDate = (
  req: Request,
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const language = req.language;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const localeMap: Record<SupportedLanguage, string> = {
    'zh-HK': 'zh-HK',
    'zh-CN': 'zh-CN',
    'en': 'en-HK'
  };
  
  const locale = localeMap[language] || 'zh-HK';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  try {
    return new Intl.DateTimeFormat(locale, options || defaultOptions).format(dateObj);
  } catch {
    // Fallback formatting
    return dateObj.toISOString();
  }
};

/**
 * Get pluralized translation
 */
export const getPlural = (
  req: Request,
  key: string,
  count: number,
  options?: any
): string => {
  return req.t(key, { count, ...options });
};
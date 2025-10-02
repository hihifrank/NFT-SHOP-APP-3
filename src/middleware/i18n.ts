import { Request, Response, NextFunction } from 'express';
import { isSupportedLanguage, changeLanguage, DEFAULT_LANGUAGE, SupportedLanguage } from '../config/i18n';

// Extend Express Request interface to include language
declare global {
  namespace Express {
    interface Request {
      language: SupportedLanguage;
      t: (key: string, options?: any) => string;
    }
  }
}

/**
 * Middleware to detect and set the user's preferred language
 */
export const languageDetectionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let detectedLanguage: SupportedLanguage = DEFAULT_LANGUAGE;

    // Priority 1: Query parameter (?lang=zh-HK)
    const queryLang = req.query.lang as string;
    if (queryLang && isSupportedLanguage(queryLang)) {
      detectedLanguage = queryLang;
    }
    // Priority 2: Header (X-Language)
    else {
      const headerLang = req.headers['x-language'] as string;
      if (headerLang && isSupportedLanguage(headerLang)) {
        detectedLanguage = headerLang;
      }
      // Priority 3: Accept-Language header
      else {
        const acceptLanguage = req.headers['accept-language'];
        if (acceptLanguage) {
          const preferredLang = parseAcceptLanguage(acceptLanguage);
          if (preferredLang && isSupportedLanguage(preferredLang)) {
            detectedLanguage = preferredLang;
          }
        }
      }
    }

    // Set the language for this request
    await changeLanguage(detectedLanguage);
    req.language = detectedLanguage;

    // Add translation function to request object
    req.t = (key: string, options?: any): string => {
      const i18next = require('../config/i18n').default;
      return i18next.t(key, { ...options, lng: detectedLanguage });
    };

    // Set response header
    res.setHeader('Content-Language', detectedLanguage);

    next();
  } catch (error) {
    console.error('Language detection middleware error:', error);
    // Fallback to default language on error
    req.language = DEFAULT_LANGUAGE;
    req.t = (key: string, options?: any): string => {
      const i18next = require('../config/i18n').default;
      return i18next.t(key, { ...options, lng: DEFAULT_LANGUAGE });
    };
    next();
  }
};

/**
 * Parse Accept-Language header to get the most preferred supported language
 */
function parseAcceptLanguage(acceptLanguage: string): string | null {
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const parts = lang.trim().split(';');
      const code = parts[0];
      const quality = parts[1] ? parseFloat(parts[1].split('=')[1]) : 1.0;
      return { code, quality };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const lang of languages) {
    // Check exact match first
    if (isSupportedLanguage(lang.code)) {
      return lang.code;
    }
    
    // Check language family (e.g., 'zh' matches 'zh-HK')
    const langFamily = lang.code.split('-')[0];
    if (langFamily === 'zh') {
      // Default to Traditional Chinese for Chinese language family
      return 'zh-HK';
    }
    if (langFamily === 'en') {
      return 'en';
    }
  }

  return null;
}

/**
 * Middleware to validate language parameter in requests
 */
export const validateLanguageMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { language } = req.params;
  
  if (language && !isSupportedLanguage(language)) {
    res.status(400).json({
      success: false,
      error: 'INVALID_LANGUAGE',
      message: req.t('api:validation.invalidLanguage'),
      supportedLanguages: Object.keys(require('../config/i18n').SUPPORTED_LANGUAGES)
    });
    return;
  }
  
  next();
};

/**
 * Helper function to get localized response
 */
export const getLocalizedResponse = (
  req: Request,
  messageKey: string,
  data?: any,
  options?: any
) => {
  return {
    success: true,
    message: req.t(messageKey, options),
    data,
    language: req.language
  };
};

/**
 * Helper function to get localized error response
 */
export const getLocalizedErrorResponse = (
  req: Request,
  errorKey: string,
  statusCode: number = 400,
  details?: any
) => {
  return {
    success: false,
    error: errorKey,
    message: req.t(`api:responses.${errorKey.toLowerCase()}`) || req.t(errorKey),
    details,
    language: req.language,
    statusCode
  };
};
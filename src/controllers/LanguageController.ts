import { Request, Response } from 'express';
import { 
  SUPPORTED_LANGUAGES, 
  SupportedLanguage, 
  isSupportedLanguage,
  changeLanguage 
} from '../config/i18n';
import { getLocalizedResponse, getLocalizedErrorResponse } from '../middleware/i18n';

export class LanguageController {
  /**
   * Get all supported languages
   */
  static async getSupportedLanguages(req: Request, res: Response): Promise<void> {
    try {
      const languages = Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
        code,
        name,
        isActive: code === req.language
      }));

      const response = getLocalizedResponse(
        req,
        'api:responses.success',
        { languages }
      );

      res.status(200).json(response);
    } catch (error) {
      console.error('Get supported languages error:', error);
      const errorResponse = getLocalizedErrorResponse(
        req,
        'internalError',
        500
      );
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Get current language
   */
  static async getCurrentLanguage(req: Request, res: Response): Promise<void> {
    try {
      const currentLanguage = {
        code: req.language,
        name: SUPPORTED_LANGUAGES[req.language]
      };

      const response = getLocalizedResponse(
        req,
        'api:responses.success',
        { currentLanguage }
      );

      res.status(200).json(response);
    } catch (error) {
      console.error('Get current language error:', error);
      const errorResponse = getLocalizedErrorResponse(
        req,
        'internalError',
        500
      );
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Change language
   */
  static async changeLanguage(req: Request, res: Response): Promise<void> {
    try {
      const { language } = req.body;

      // Validate language
      if (!language || !isSupportedLanguage(language)) {
        const errorResponse = getLocalizedErrorResponse(
          req,
          'badRequest',
          400,
          { 
            field: 'language',
            supportedLanguages: Object.keys(SUPPORTED_LANGUAGES)
          }
        );
        res.status(400).json(errorResponse);
        return;
      }

      // Change language
      await changeLanguage(language);

      // Update request language for response
      req.language = language;

      const response = getLocalizedResponse(
        req,
        'api:responses.updated',
        { 
          newLanguage: {
            code: language,
            name: SUPPORTED_LANGUAGES[language]
          }
        }
      );

      res.status(200).json(response);
    } catch (error) {
      console.error('Change language error:', error);
      const errorResponse = getLocalizedErrorResponse(
        req,
        'internalError',
        500
      );
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Get translations for a specific namespace
   */
  static async getTranslations(req: Request, res: Response): Promise<void> {
    try {
      const { namespace } = req.params;
      const { language } = req.query;

      // Use provided language or current request language
      const targetLanguage = (language && isSupportedLanguage(language as string)) 
        ? language as SupportedLanguage 
        : req.language;

      // Import the translation file
      let translations;
      try {
        translations = require(`../locales/${targetLanguage}/${namespace}.json`);
      } catch (error) {
        const errorResponse = getLocalizedErrorResponse(
          req,
          'notFound',
          404,
          { namespace, language: targetLanguage }
        );
        res.status(404).json(errorResponse);
        return;
      }

      const response = getLocalizedResponse(
        req,
        'api:responses.success',
        { 
          namespace,
          language: targetLanguage,
          translations 
        }
      );

      res.status(200).json(response);
    } catch (error) {
      console.error('Get translations error:', error);
      const errorResponse = getLocalizedErrorResponse(
        req,
        'internalError',
        500
      );
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Get all translations for current language
   */
  static async getAllTranslations(req: Request, res: Response): Promise<void> {
    try {
      const { language } = req.query;
      const targetLanguage = (language && isSupportedLanguage(language as string)) 
        ? language as SupportedLanguage 
        : req.language;

      const namespaces = ['common', 'api', 'coupons', 'merchants', 'lotteries', 'errors'];
      const translations: Record<string, any> = {};

      for (const namespace of namespaces) {
        try {
          translations[namespace] = require(`../locales/${targetLanguage}/${namespace}.json`);
        } catch (error) {
          // Skip missing namespaces
          console.warn(`Translation namespace ${namespace} not found for language ${targetLanguage}`);
        }
      }

      const response = getLocalizedResponse(
        req,
        'api:responses.success',
        { 
          language: targetLanguage,
          translations 
        }
      );

      res.status(200).json(response);
    } catch (error) {
      console.error('Get all translations error:', error);
      const errorResponse = getLocalizedErrorResponse(
        req,
        'internalError',
        500
      );
      res.status(500).json(errorResponse);
    }
  }
}
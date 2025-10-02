import { Request, Response } from 'express';
import { ContentManagementService, CreateContentRequest, UpdateContentRequest } from '../services/ContentManagementService';
import { SupportedLanguage, isSupportedLanguage } from '../config/i18n';
import { getLocalizedResponse, getLocalizedErrorResponse } from '../middleware/i18n';

export class ContentManagementController {
  /**
   * Get all content for a namespace
   */
  static async getContentByNamespace(req: Request, res: Response): Promise<void> {
    try {
      const { namespace } = req.params;
      
      if (!namespace) {
        const errorResponse = getLocalizedErrorResponse(
          req,
          'badRequest',
          400,
          { field: 'namespace', message: 'Namespace is required' }
        );
        res.status(400).json(errorResponse);
        return;
      }

      const content = await ContentManagementService.getContentByNamespace(namespace);

      const response = getLocalizedResponse(
        req,
        'api:responses.success',
        { namespace, content }
      );

      res.status(200).json(response);
    } catch (error) {
      console.error('Get content by namespace error:', error);
      const errorResponse = getLocalizedErrorResponse(
        req,
        'internalError',
        500
      );
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Get specific content item
   */
  static async getContentItem(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, key } = req.params;

      if (!namespace || !key) {
        const errorResponse = getLocalizedErrorResponse(
          req,
          'badRequest',
          400,
          { message: 'Namespace and key are required' }
        );
        res.status(400).json(errorResponse);
        return;
      }

      const contentItem = await ContentManagementService.getContentItem(namespace, key);

      if (!contentItem) {
        const errorResponse = getLocalizedErrorResponse(
          req,
          'notFound',
          404,
          { namespace, key }
        );
        res.status(404).json(errorResponse);
        return;
      }

      const response = getLocalizedResponse(
        req,
        'api:responses.success',
        { contentItem }
      );

      res.status(200).json(response);
    } catch (error) {
      console.error('Get content item error:', error);
      const errorResponse = getLocalizedErrorResponse(
        req,
        'internalError',
        500
      );
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Create new content item
   */
  static async createContent(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, key } = req.params;
      const createRequest: CreateContentRequest = req.body;

      if (!namespace || !key) {
        const errorResponse = getLocalizedErrorResponse(
          req,
          'badRequest',
          400,
          { message: 'Namespace and key are required' }
        );
        res.status(400).json(errorResponse);
        return;
      }

      // Validate translations
      if (!createRequest.translations || Object.keys(createRequest.translations).length === 0) {
        const errorResponse = getLocalizedErrorResponse(
          req,
          'badRequest',
          400,
          { field: 'translations', message: 'At least one translation is required' }
        );
        res.status(400).json(errorResponse);
        return;
      }

      // Validate language codes
      for (const lang of Object.keys(createRequest.translations)) {
        if (!isSupportedLanguage(lang)) {
          const errorResponse = getLocalizedErrorResponse(
            req,
            'badRequest',
            400,
            { field: 'translations', message: `Unsupported language: ${lang}` }
          );
          res.status(400).json(errorResponse);
          return;
        }
      }

      const contentItem = await ContentManagementService.upsertContent(
        namespace,
        key,
        createRequest
      );

      const response = getLocalizedResponse(
        req,
        'api:responses.created',
        { contentItem }
      );

      res.status(201).json(response);
    } catch (error) {
      console.error('Create content error:', error);
      const errorResponse = getLocalizedErrorResponse(
        req,
        'internalError',
        500
      );
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Update content item
   */
  static async updateContent(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, key } = req.params;
      const updateRequest: UpdateContentRequest = req.body;

      if (!namespace || !key) {
        const errorResponse = getLocalizedErrorResponse(
          req,
          'badRequest',
          400,
          { message: 'Namespace and key are required' }
        );
        res.status(400).json(errorResponse);
        return;
      }

      // Check if content exists
      const existingContent = await ContentManagementService.getContentItem(namespace, key);
      if (!existingContent) {
        const errorResponse = getLocalizedErrorResponse(
          req,
          'notFound',
          404,
          { namespace, key }
        );
        res.status(404).json(errorResponse);
        return;
      }

      // Validate language codes if translations provided
      if (updateRequest.translations) {
        for (const lang of Object.keys(updateRequest.translations)) {
          if (!isSupportedLanguage(lang)) {
            const errorResponse = getLocalizedErrorResponse(
              req,
              'badRequest',
              400,
              { field: 'translations', message: `Unsupported language: ${lang}` }
            );
            res.status(400).json(errorResponse);
            return;
          }
        }
      }

      const contentItem = await ContentManagementService.upsertContent(
        namespace,
        key,
        updateRequest
      );

      const response = getLocalizedResponse(
        req,
        'api:responses.updated',
        { contentItem }
      );

      res.status(200).json(response);
    } catch (error) {
      console.error('Update content error:', error);
      const errorResponse = getLocalizedErrorResponse(
        req,
        'internalError',
        500
      );
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Delete content item
   */
  static async deleteContent(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, key } = req.params;

      if (!namespace || !key) {
        const errorResponse = getLocalizedErrorResponse(
          req,
          'badRequest',
          400,
          { message: 'Namespace and key are required' }
        );
        res.status(400).json(errorResponse);
        return;
      }

      // Check if content exists
      const existingContent = await ContentManagementService.getContentItem(namespace, key);
      if (!existingContent) {
        const errorResponse = getLocalizedErrorResponse(
          req,
          'notFound',
          404,
          { namespace, key }
        );
        res.status(404).json(errorResponse);
        return;
      }

      const success = await ContentManagementService.deleteContent(namespace, key);

      if (!success) {
        const errorResponse = getLocalizedErrorResponse(
          req,
          'internalError',
          500,
          { message: 'Failed to delete content' }
        );
        res.status(500).json(errorResponse);
        return;
      }

      const response = getLocalizedResponse(
        req,
        'api:responses.deleted',
        { namespace, key }
      );

      res.status(200).json(response);
    } catch (error) {
      console.error('Delete content error:', error);
      const errorResponse = getLocalizedErrorResponse(
        req,
        'internalError',
        500
      );
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Get all namespaces
   */
  static async getNamespaces(req: Request, res: Response): Promise<void> {
    try {
      const namespaces = await ContentManagementService.getNamespaces();

      const response = getLocalizedResponse(
        req,
        'api:responses.success',
        { namespaces }
      );

      res.status(200).json(response);
    } catch (error) {
      console.error('Get namespaces error:', error);
      const errorResponse = getLocalizedErrorResponse(
        req,
        'internalError',
        500
      );
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Create new namespace
   */
  static async createNamespace(req: Request, res: Response): Promise<void> {
    try {
      const { namespace } = req.body;

      if (!namespace || typeof namespace !== 'string') {
        const errorResponse = getLocalizedErrorResponse(
          req,
          'badRequest',
          400,
          { field: 'namespace', message: 'Valid namespace name is required' }
        );
        res.status(400).json(errorResponse);
        return;
      }

      const success = await ContentManagementService.createNamespace(namespace);

      if (!success) {
        const errorResponse = getLocalizedErrorResponse(
          req,
          'internalError',
          500,
          { message: 'Failed to create namespace' }
        );
        res.status(500).json(errorResponse);
        return;
      }

      const response = getLocalizedResponse(
        req,
        'api:responses.created',
        { namespace }
      );

      res.status(201).json(response);
    } catch (error) {
      console.error('Create namespace error:', error);
      const errorResponse = getLocalizedErrorResponse(
        req,
        'internalError',
        500
      );
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Export language translations
   */
  static async exportLanguage(req: Request, res: Response): Promise<void> {
    try {
      const { language } = req.params;

      if (!language || !isSupportedLanguage(language)) {
        const errorResponse = getLocalizedErrorResponse(
          req,
          'badRequest',
          400,
          { field: 'language', message: 'Valid language code is required' }
        );
        res.status(400).json(errorResponse);
        return;
      }

      const translations = await ContentManagementService.exportLanguage(language as SupportedLanguage);

      const response = getLocalizedResponse(
        req,
        'api:responses.success',
        { language, translations }
      );

      res.status(200).json(response);
    } catch (error) {
      console.error('Export language error:', error);
      const errorResponse = getLocalizedErrorResponse(
        req,
        'internalError',
        500
      );
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Import language translations
   */
  static async importLanguage(req: Request, res: Response): Promise<void> {
    try {
      const { language } = req.params;
      const { translations } = req.body;

      if (!language || !isSupportedLanguage(language)) {
        const errorResponse = getLocalizedErrorResponse(
          req,
          'badRequest',
          400,
          { field: 'language', message: 'Valid language code is required' }
        );
        res.status(400).json(errorResponse);
        return;
      }

      if (!translations || typeof translations !== 'object') {
        const errorResponse = getLocalizedErrorResponse(
          req,
          'badRequest',
          400,
          { field: 'translations', message: 'Valid translations object is required' }
        );
        res.status(400).json(errorResponse);
        return;
      }

      const success = await ContentManagementService.importLanguage(
        language as SupportedLanguage,
        translations
      );

      if (!success) {
        const errorResponse = getLocalizedErrorResponse(
          req,
          'internalError',
          500,
          { message: 'Failed to import translations' }
        );
        res.status(500).json(errorResponse);
        return;
      }

      const response = getLocalizedResponse(
        req,
        'api:responses.updated',
        { language, imported: Object.keys(translations).length }
      );

      res.status(200).json(response);
    } catch (error) {
      console.error('Import language error:', error);
      const errorResponse = getLocalizedErrorResponse(
        req,
        'internalError',
        500
      );
      res.status(500).json(errorResponse);
    }
  }
}
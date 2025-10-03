import { Router, Request, Response } from 'express';
import DataPrivacyService from '../services/DataPrivacyService';
import DataPrivacyProtection from '../middleware/dataPrivacy';
import { body, param } from 'express-validator';
import ValidationMiddleware from '../middleware/validation';

const router = Router();

// Apply privacy middleware to all routes
router.use(DataPrivacyProtection.addPrivacyHeaders);
router.use(DataPrivacyProtection.anonymizeRequestData);

/**
 * @swagger
 * /api/v1/privacy/export:
 *   post:
 *     summary: Export user data (GDPR Article 20)
 *     tags: [Privacy]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to export data for
 *     responses:
 *       200:
 *         description: User data exported successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/export',
  ValidationMiddleware.validate([
    body('userId').isString().notEmpty().withMessage('User ID is required'),
  ]),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;

      const result = await DataPrivacyService.exportUserData(userId);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'User data exported successfully',
        data: result.data,
        exportDate: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in data export:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to export user data',
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/privacy/delete:
 *   post:
 *     summary: Delete user data (GDPR Article 17)
 *     tags: [Privacy]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to delete data for
 *               reason:
 *                 type: string
 *                 description: Reason for deletion
 *               confirmDeletion:
 *                 type: boolean
 *                 description: Confirmation that user wants to delete data
 *     responses:
 *       200:
 *         description: User data deleted successfully
 *       400:
 *         description: Invalid request or missing confirmation
 *       500:
 *         description: Server error
 */
router.post('/delete',
  ValidationMiddleware.validate([
    body('userId').isString().notEmpty().withMessage('User ID is required'),
    body('confirmDeletion').isBoolean().custom((value) => value === true).withMessage('Deletion confirmation is required'),
    body('reason').optional().isString().withMessage('Reason must be a string'),
  ]),
  async (req: Request, res: Response) => {
    try {
      const { userId, reason = 'USER_REQUEST' } = req.body;

      const result = await DataPrivacyService.deleteUserData(userId, reason);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'User data deleted successfully',
        deletedItems: result.deletedItems,
        deletionDate: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in data deletion:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete user data',
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/privacy/anonymize:
 *   post:
 *     summary: Anonymize user data
 *     tags: [Privacy]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to anonymize data for
 *     responses:
 *       200:
 *         description: User data anonymized successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/anonymize',
  ValidationMiddleware.validate([
    body('userId').isString().notEmpty().withMessage('User ID is required'),
  ]),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;

      const result = await DataPrivacyService.anonymizeUserData(userId);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'User data anonymized successfully',
        anonymizedItems: result.anonymizedItems,
        anonymizationDate: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in data anonymization:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to anonymize user data',
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/privacy/consent:
 *   post:
 *     summary: Update user consent preferences
 *     tags: [Privacy]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *               dataProcessing:
 *                 type: boolean
 *                 description: Consent for data processing
 *               marketing:
 *                 type: boolean
 *                 description: Consent for marketing communications
 *               analytics:
 *                 type: boolean
 *                 description: Consent for analytics
 *               thirdPartySharing:
 *                 type: boolean
 *                 description: Consent for third-party data sharing
 *     responses:
 *       200:
 *         description: Consent updated successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/consent',
  ValidationMiddleware.validate([
    body('userId').isString().notEmpty().withMessage('User ID is required'),
    body('dataProcessing').isBoolean().withMessage('Data processing consent must be boolean'),
    body('marketing').isBoolean().withMessage('Marketing consent must be boolean'),
    body('analytics').isBoolean().withMessage('Analytics consent must be boolean'),
    body('thirdPartySharing').isBoolean().withMessage('Third party sharing consent must be boolean'),
  ]),
  async (req: Request, res: Response) => {
    try {
      const { userId, dataProcessing, marketing, analytics, thirdPartySharing } = req.body;
      const clientIP = (req as any).originalIP || 'unknown';

      const consentData = {
        dataProcessing,
        marketing,
        analytics,
        thirdPartySharing,
        consentDate: new Date(),
        ipAddress: clientIP,
      };

      const result = await DataPrivacyService.updateUserConsent(userId, consentData);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Consent updated successfully',
        consentDate: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating consent:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update consent',
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/privacy/consent/{userId}:
 *   get:
 *     summary: Get user consent status
 *     tags: [Privacy]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Consent status retrieved successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.get('/consent/:userId',
  ValidationMiddleware.validate([
    param('userId').isString().notEmpty().withMessage('User ID is required'),
  ]),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const result = await DataPrivacyService.getUserConsent(userId);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      return res.status(200).json({
        success: true,
        consent: result.consent,
      });
    } catch (error) {
      console.error('Error getting consent:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get consent status',
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/privacy/cleanup:
 *   post:
 *     summary: Clean up expired data (Admin only)
 *     tags: [Privacy]
 *     responses:
 *       200:
 *         description: Data cleanup completed successfully
 *       500:
 *         description: Server error
 */
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    const result = await DataPrivacyService.cleanupExpiredData();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Data cleanup completed successfully',
      cleanedItems: result.cleanedItems,
      cleanupDate: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in data cleanup:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cleanup expired data',
    });
  }
});

/**
 * @swagger
 * /api/v1/privacy/report:
 *   get:
 *     summary: Get privacy compliance report (Admin only)
 *     tags: [Privacy]
 *     responses:
 *       200:
 *         description: Privacy report generated successfully
 *       500:
 *         description: Server error
 */
router.get('/report', async (req: Request, res: Response) => {
  try {
    const result = await DataPrivacyService.generatePrivacyReport();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      report: result.report,
    });
  } catch (error) {
    console.error('Error generating privacy report:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate privacy report',
    });
  }
});

export default router;
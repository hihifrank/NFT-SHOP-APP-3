import { Router } from 'express';
import { LanguageController } from '../controllers/LanguageController';
import { validateLanguageMiddleware } from '../middleware/i18n';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Language:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *           description: Language code (ISO 639-1 with region)
 *           example: "zh-HK"
 *         name:
 *           type: string
 *           description: Language display name
 *           example: "Traditional Chinese"
 *         isActive:
 *           type: boolean
 *           description: Whether this is the current active language
 *           example: true
 *     
 *     ChangeLanguageRequest:
 *       type: object
 *       required:
 *         - language
 *       properties:
 *         language:
 *           type: string
 *           description: Target language code
 *           example: "zh-HK"
 *           enum: ["zh-HK", "zh-CN", "en"]
 */

/**
 * @swagger
 * /api/v1/languages:
 *   get:
 *     summary: Get all supported languages
 *     tags: [Languages]
 *     responses:
 *       200:
 *         description: List of supported languages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Request successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     languages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Language'
 *                 language:
 *                   type: string
 *                   example: "zh-HK"
 */
router.get('/', LanguageController.getSupportedLanguages);

/**
 * @swagger
 * /api/v1/languages/current:
 *   get:
 *     summary: Get current language
 *     tags: [Languages]
 *     responses:
 *       200:
 *         description: Current language information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Request successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentLanguage:
 *                       $ref: '#/components/schemas/Language'
 *                 language:
 *                   type: string
 *                   example: "zh-HK"
 */
router.get('/current', LanguageController.getCurrentLanguage);

/**
 * @swagger
 * /api/v1/languages/change:
 *   post:
 *     summary: Change current language
 *     tags: [Languages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangeLanguageRequest'
 *     responses:
 *       200:
 *         description: Language changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Resource updated"
 *                 data:
 *                   type: object
 *                   properties:
 *                     newLanguage:
 *                       $ref: '#/components/schemas/Language'
 *                 language:
 *                   type: string
 *                   example: "zh-HK"
 *       400:
 *         description: Invalid language code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "badRequest"
 *                 message:
 *                   type: string
 *                   example: "Bad request format"
 *                 details:
 *                   type: object
 *                   properties:
 *                     field:
 *                       type: string
 *                       example: "language"
 *                     supportedLanguages:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["zh-HK", "zh-CN", "en"]
 */
router.post('/change', LanguageController.changeLanguage);

/**
 * @swagger
 * /api/v1/languages/translations/{namespace}:
 *   get:
 *     summary: Get translations for a specific namespace
 *     tags: [Languages]
 *     parameters:
 *       - in: path
 *         name: namespace
 *         required: true
 *         schema:
 *           type: string
 *           enum: [common, api, coupons, merchants, lotteries, errors]
 *         description: Translation namespace
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [zh-HK, zh-CN, en]
 *         description: Target language (defaults to current language)
 *     responses:
 *       200:
 *         description: Translations for the namespace
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Request successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     namespace:
 *                       type: string
 *                       example: "common"
 *                     language:
 *                       type: string
 *                       example: "zh-HK"
 *                     translations:
 *                       type: object
 *                       description: Translation key-value pairs
 *       404:
 *         description: Namespace not found
 */
router.get('/translations/:namespace', validateLanguageMiddleware, LanguageController.getTranslations);

/**
 * @swagger
 * /api/v1/languages/translations:
 *   get:
 *     summary: Get all translations for current or specified language
 *     tags: [Languages]
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [zh-HK, zh-CN, en]
 *         description: Target language (defaults to current language)
 *     responses:
 *       200:
 *         description: All translations for the language
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Request successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     language:
 *                       type: string
 *                       example: "zh-HK"
 *                     translations:
 *                       type: object
 *                       description: All translation namespaces and their key-value pairs
 */
router.get('/translations', LanguageController.getAllTranslations);

export default router;
import { Router } from 'express';
import { ContentManagementController } from '../controllers/ContentManagementController';
import { validateLanguageMiddleware } from '../middleware/i18n';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ContentItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the content item
 *           example: "common.app.name"
 *         namespace:
 *           type: string
 *           description: Translation namespace
 *           example: "common"
 *         key:
 *           type: string
 *           description: Translation key
 *           example: "app.name"
 *         translations:
 *           type: object
 *           description: Translations for all supported languages
 *           properties:
 *             zh-HK:
 *               type: string
 *               example: "香港零售業NFT優惠券平台"
 *             zh-CN:
 *               type: string
 *               example: "香港零售业NFT优惠券平台"
 *             en:
 *               type: string
 *               example: "Hong Kong Retail NFT Coupon Platform"
 *         description:
 *           type: string
 *           description: Optional description of the content item
 *           example: "Application name displayed in the header"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     CreateContentRequest:
 *       type: object
 *       required:
 *         - translations
 *       properties:
 *         translations:
 *           type: object
 *           description: Translations for supported languages
 *           properties:
 *             zh-HK:
 *               type: string
 *             zh-CN:
 *               type: string
 *             en:
 *               type: string
 *         description:
 *           type: string
 *           description: Optional description
 *     
 *     UpdateContentRequest:
 *       type: object
 *       properties:
 *         translations:
 *           type: object
 *           description: Translations to update
 *           properties:
 *             zh-HK:
 *               type: string
 *             zh-CN:
 *               type: string
 *             en:
 *               type: string
 *         description:
 *           type: string
 *           description: Updated description
 */

/**
 * @swagger
 * /api/v1/content/namespaces:
 *   get:
 *     summary: Get all available namespaces
 *     tags: [Content Management]
 *     responses:
 *       200:
 *         description: List of available namespaces
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     namespaces:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["common", "api", "coupons", "merchants"]
 */
router.get('/namespaces', ContentManagementController.getNamespaces);

/**
 * @swagger
 * /api/v1/content/namespaces:
 *   post:
 *     summary: Create a new namespace
 *     tags: [Content Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - namespace
 *             properties:
 *               namespace:
 *                 type: string
 *                 example: "products"
 *     responses:
 *       201:
 *         description: Namespace created successfully
 *       400:
 *         description: Invalid namespace name
 */
router.post('/namespaces', ContentManagementController.createNamespace);

/**
 * @swagger
 * /api/v1/content/{namespace}:
 *   get:
 *     summary: Get all content items for a namespace
 *     tags: [Content Management]
 *     parameters:
 *       - in: path
 *         name: namespace
 *         required: true
 *         schema:
 *           type: string
 *         description: Translation namespace
 *     responses:
 *       200:
 *         description: Content items for the namespace
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     namespace:
 *                       type: string
 *                     content:
 *                       type: object
 *                       additionalProperties:
 *                         $ref: '#/components/schemas/ContentItem'
 */
router.get('/:namespace', ContentManagementController.getContentByNamespace);

/**
 * @swagger
 * /api/v1/content/{namespace}/{key}:
 *   get:
 *     summary: Get a specific content item
 *     tags: [Content Management]
 *     parameters:
 *       - in: path
 *         name: namespace
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Content key (can include dots for nested keys)
 *     responses:
 *       200:
 *         description: Content item details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     contentItem:
 *                       $ref: '#/components/schemas/ContentItem'
 *       404:
 *         description: Content item not found
 */
router.get('/:namespace/:key(*)', ContentManagementController.getContentItem);

/**
 * @swagger
 * /api/v1/content/{namespace}/{key}:
 *   post:
 *     summary: Create a new content item
 *     tags: [Content Management]
 *     parameters:
 *       - in: path
 *         name: namespace
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateContentRequest'
 *     responses:
 *       201:
 *         description: Content item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     contentItem:
 *                       $ref: '#/components/schemas/ContentItem'
 *       400:
 *         description: Invalid request data
 */
router.post('/:namespace/:key(*)', ContentManagementController.createContent);

/**
 * @swagger
 * /api/v1/content/{namespace}/{key}:
 *   put:
 *     summary: Update a content item
 *     tags: [Content Management]
 *     parameters:
 *       - in: path
 *         name: namespace
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateContentRequest'
 *     responses:
 *       200:
 *         description: Content item updated successfully
 *       404:
 *         description: Content item not found
 *       400:
 *         description: Invalid request data
 */
router.put('/:namespace/:key(*)', ContentManagementController.updateContent);

/**
 * @swagger
 * /api/v1/content/{namespace}/{key}:
 *   delete:
 *     summary: Delete a content item
 *     tags: [Content Management]
 *     parameters:
 *       - in: path
 *         name: namespace
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content item deleted successfully
 *       404:
 *         description: Content item not found
 */
router.delete('/:namespace/:key(*)', ContentManagementController.deleteContent);

/**
 * @swagger
 * /api/v1/content/export/{language}:
 *   get:
 *     summary: Export all translations for a language
 *     tags: [Content Management]
 *     parameters:
 *       - in: path
 *         name: language
 *         required: true
 *         schema:
 *           type: string
 *           enum: [zh-HK, zh-CN, en]
 *     responses:
 *       200:
 *         description: Exported translations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     language:
 *                       type: string
 *                     translations:
 *                       type: object
 *                       description: All translations organized by namespace
 */
router.get('/export/:language', validateLanguageMiddleware, ContentManagementController.exportLanguage);

/**
 * @swagger
 * /api/v1/content/import/{language}:
 *   post:
 *     summary: Import translations for a language
 *     tags: [Content Management]
 *     parameters:
 *       - in: path
 *         name: language
 *         required: true
 *         schema:
 *           type: string
 *           enum: [zh-HK, zh-CN, en]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - translations
 *             properties:
 *               translations:
 *                 type: object
 *                 description: Translations organized by namespace
 *                 example:
 *                   common:
 *                     app:
 *                       name: "Application Name"
 *                   api:
 *                     responses:
 *                       success: "Success"
 *     responses:
 *       200:
 *         description: Translations imported successfully
 *       400:
 *         description: Invalid language or translations data
 */
router.post('/import/:language', validateLanguageMiddleware, ContentManagementController.importLanguage);

export default router;
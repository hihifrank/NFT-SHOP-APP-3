import { Router } from 'express';
import multer from 'multer';
import { rateLimiter } from '../middleware';
import CouponController from '../controllers/CouponController';
import {
  validateCreateCoupon,
  validateUseCoupon,
  validateTransferCoupon,
  validateCouponId,
  validateUserId,
  validateMerchantId,
  validateGetCoupons,
  validateImageUpload
} from '../middleware/couponValidation';

const router = Router();
const couponController = new CouponController();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: validateImageUpload,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     CouponNFT:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         tokenId:
 *           type: string
 *         merchantId:
 *           type: string
 *           format: uuid
 *         currentOwnerId:
 *           type: string
 *           format: uuid
 *         couponType:
 *           type: string
 *           enum: [percentage, fixed_amount, buy_one_get_one, free_item]
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         discountValue:
 *           type: number
 *         discountType:
 *           type: string
 *           enum: [percentage, fixed_amount]
 *         maxQuantity:
 *           type: integer
 *         remainingQuantity:
 *           type: integer
 *         rarity:
 *           type: string
 *           enum: [common, rare, epic, legendary]
 *         expiryDate:
 *           type: string
 *           format: date-time
 *         isUsed:
 *           type: boolean
 *         isTransferable:
 *           type: boolean
 *         isActive:
 *           type: boolean
 *         metadataUri:
 *           type: string
 *         imageUrl:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/coupons:
 *   get:
 *     summary: Get available coupons with filters
 *     tags: [Coupons]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of coupons to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of coupons to skip
 *       - in: query
 *         name: merchantId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by merchant ID
 *       - in: query
 *         name: rarity
 *         schema:
 *           type: string
 *           enum: [common, rare, epic, legendary]
 *         description: Filter by rarity
 *       - in: query
 *         name: minDiscount
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum discount value
 *       - in: query
 *         name: maxDiscount
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum discount value
 *     responses:
 *       200:
 *         description: Coupons retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     coupons:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CouponNFT'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 *                         hasMore:
 *                           type: boolean
 */
router.get('/', validateGetCoupons, couponController.getCoupons.bind(couponController));

/**
 * @swagger
 * /api/v1/coupons:
 *   post:
 *     summary: Create a new NFT coupon
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - merchantId
 *               - couponType
 *               - title
 *               - discountValue
 *               - discountType
 *               - maxQuantity
 *             properties:
 *               merchantId:
 *                 type: string
 *                 format: uuid
 *               couponType:
 *                 type: string
 *                 enum: [percentage, fixed_amount, buy_one_get_one, free_item]
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *               titleEn:
 *                 type: string
 *                 maxLength: 255
 *               titleZhCn:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               descriptionEn:
 *                 type: string
 *                 maxLength: 1000
 *               descriptionZhCn:
 *                 type: string
 *                 maxLength: 1000
 *               discountValue:
 *                 type: number
 *                 minimum: 0.01
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed_amount]
 *               minimumPurchase:
 *                 type: number
 *                 minimum: 0
 *               maxQuantity:
 *                 type: integer
 *                 minimum: 1
 *               rarity:
 *                 type: string
 *                 enum: [common, rare, epic, legendary]
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *               isTransferable:
 *                 type: boolean
 *               termsAndConditions:
 *                 type: string
 *                 maxLength: 2000
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Coupon image (JPG, PNG, GIF, WebP, max 5MB)
 *     responses:
 *       201:
 *         description: Coupon NFT created successfully
 *       400:
 *         description: Validation error or creation failed
 */
router.post('/', 
  rateLimiter.blockchain, 
  upload.single('image'), 
  validateCreateCoupon, 
  couponController.createCoupon.bind(couponController)
);

/**
 * @swagger
 * /api/v1/coupons/{id}:
 *   get:
 *     summary: Get coupon details by ID
 *     tags: [Coupons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Coupon ID
 *     responses:
 *       200:
 *         description: Coupon details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     coupon:
 *                       $ref: '#/components/schemas/CouponNFT'
 *       404:
 *         description: Coupon not found
 */
router.get('/:id', validateCouponId, couponController.getCouponDetails.bind(couponController));

/**
 * @swagger
 * /api/v1/coupons/{id}/use:
 *   post:
 *     summary: Use a coupon NFT
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Coupon ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Coupon used successfully
 *       400:
 *         description: Validation error or usage failed
 */
router.post('/:id/use', 
  rateLimiter.blockchain, 
  validateUseCoupon, 
  couponController.useCoupon.bind(couponController)
);

/**
 * @swagger
 * /api/v1/coupons/{id}/transfer:
 *   post:
 *     summary: Transfer a coupon NFT to another user
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Coupon ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromUserId
 *               - toUserId
 *             properties:
 *               fromUserId:
 *                 type: string
 *                 format: uuid
 *               toUserId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Coupon transferred successfully
 *       400:
 *         description: Validation error or transfer failed
 */
router.post('/:id/transfer', 
  rateLimiter.blockchain, 
  validateTransferCoupon, 
  couponController.transferCoupon.bind(couponController)
);

/**
 * @swagger
 * /api/v1/coupons/{id}/validate:
 *   get:
 *     summary: Validate a coupon NFT
 *     tags: [Coupons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Coupon ID
 *     responses:
 *       200:
 *         description: Coupon validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     isValid:
 *                       type: boolean
 *                     couponId:
 *                       type: string
 */
router.get('/:id/validate', validateCouponId, couponController.validateCoupon.bind(couponController));

/**
 * @swagger
 * /api/v1/coupons/{id}/recycle:
 *   post:
 *     summary: Recycle a used coupon back to marketplace
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Coupon ID
 *     responses:
 *       200:
 *         description: Coupon recycled successfully
 *       400:
 *         description: Recycling failed
 */
router.post('/:id/recycle', 
  rateLimiter.blockchain, 
  validateCouponId, 
  couponController.recycleCoupon.bind(couponController)
);

/**
 * @swagger
 * /api/v1/users/{userId}/coupons:
 *   get:
 *     summary: Get user's coupons
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User coupons retrieved successfully
 */
router.get('/users/:userId/coupons', validateUserId, couponController.getUserCoupons.bind(couponController));

/**
 * @swagger
 * /api/v1/merchants/{merchantId}/coupons:
 *   get:
 *     summary: Get merchant's created coupons
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Merchant ID
 *     responses:
 *       200:
 *         description: Merchant coupons retrieved successfully
 */
router.get('/merchants/:merchantId/coupons', validateMerchantId, couponController.getMerchantCoupons.bind(couponController));

export default router;
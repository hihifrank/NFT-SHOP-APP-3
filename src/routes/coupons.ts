import { Router } from 'express';
import { rateLimiter } from '../middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/coupons:
 *   get:
 *     summary: Get available coupons
 *     tags: [Coupons]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by merchant category
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of coupons to return
 *     responses:
 *       200:
 *         description: Coupons retrieved successfully
 */
router.get('/', (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'Coupon endpoints will be implemented in task 4.3',
      code: 'NOT_IMPLEMENTED',
    },
  });
});

/**
 * @swagger
 * /api/v1/coupons/use:
 *   post:
 *     summary: Use a coupon NFT
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nftId
 *               - merchantId
 *             properties:
 *               nftId:
 *                 type: string
 *               merchantId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Coupon used successfully
 */
router.post('/use', rateLimiter.blockchain, (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'Coupon endpoints will be implemented in task 4.3',
      code: 'NOT_IMPLEMENTED',
    },
  });
});

export default router;
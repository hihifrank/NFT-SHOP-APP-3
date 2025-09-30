import { Router } from 'express';
import { rateLimiter } from '../middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/lotteries/active:
 *   get:
 *     summary: Get active lotteries
 *     tags: [Lotteries]
 *     responses:
 *       200:
 *         description: Active lotteries retrieved successfully
 */
router.get('/active', (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'Lottery endpoints will be implemented in task 4.5',
      code: 'NOT_IMPLEMENTED',
    },
  });
});

/**
 * @swagger
 * /api/v1/lotteries/participate:
 *   post:
 *     summary: Participate in a lottery
 *     tags: [Lotteries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lotteryId
 *             properties:
 *               lotteryId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lottery participation successful
 */
router.post('/participate', rateLimiter.blockchain, (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'Lottery endpoints will be implemented in task 4.5',
      code: 'NOT_IMPLEMENTED',
    },
  });
});

/**
 * @swagger
 * /api/v1/lotteries/history:
 *   get:
 *     summary: Get user's lottery history
 *     tags: [Lotteries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lottery history retrieved successfully
 */
router.get('/history', (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'Lottery endpoints will be implemented in task 4.5',
      code: 'NOT_IMPLEMENTED',
    },
  });
});

export default router;
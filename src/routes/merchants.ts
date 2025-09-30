import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /api/v1/merchants/register:
 *   post:
 *     summary: Register a new merchant
 *     tags: [Merchants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               category:
 *                 type: string
 *               isNftParticipant:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Merchant registered successfully
 */
router.post('/register', (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'Merchant endpoints will be implemented in task 4.4',
      code: 'NOT_IMPLEMENTED',
    },
  });
});

/**
 * @swagger
 * /api/v1/merchants/profile:
 *   get:
 *     summary: Get merchant profile
 *     tags: [Merchants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Merchant profile retrieved successfully
 */
router.get('/profile', (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'Merchant endpoints will be implemented in task 4.4',
      code: 'NOT_IMPLEMENTED',
    },
  });
});

export default router;
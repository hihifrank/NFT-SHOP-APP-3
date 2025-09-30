import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'User endpoints will be implemented in future tasks',
      code: 'NOT_IMPLEMENTED',
    },
  });
});

/**
 * @swagger
 * /api/v1/users/nfts:
 *   get:
 *     summary: Get user's NFT collection
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: NFT collection retrieved successfully
 */
router.get('/nfts', (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'NFT endpoints will be implemented in task 4.3',
      code: 'NOT_IMPLEMENTED',
    },
  });
});

export default router;
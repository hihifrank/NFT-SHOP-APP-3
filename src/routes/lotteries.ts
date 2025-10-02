import { Router } from 'express';
import rateLimiter from '../middleware/rateLimiter';
import AuthMiddleware from '../middleware/auth';
import { LotteryController } from '../controllers/LotteryController';
import { LotteryService } from '../services/LotteryService';
import { LotteryRepository } from '../repositories/LotteryRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { BlockchainService } from '../services/BlockchainService';
import { db } from '../database/connection';

const router = Router();

// Initialize dependencies
const lotteryRepository = new LotteryRepository(db);
const transactionRepository = new TransactionRepository();
const blockchainService = new BlockchainService();
const lotteryService = new LotteryService(lotteryRepository, transactionRepository, blockchainService);
const lotteryController = new LotteryController(lotteryService);

/**
 * @swagger
 * /api/v1/lotteries/active:
 *   get:
 *     summary: Get active lotteries
 *     tags: [Lotteries]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Active lotteries retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lottery'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/active', lotteryController.getActiveLotteries.bind(lotteryController));

/**
 * @swagger
 * /api/v1/lotteries/{id}:
 *   get:
 *     summary: Get lottery by ID
 *     tags: [Lotteries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lottery ID
 *     responses:
 *       200:
 *         description: Lottery retrieved successfully
 *       404:
 *         description: Lottery not found
 */
router.get('/:id', lotteryController.getLotteryById.bind(lotteryController));

/**
 * @swagger
 * /api/v1/lotteries:
 *   post:
 *     summary: Create a new lottery
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
 *               - name
 *               - totalPrizes
 *               - startTime
 *               - endTime
 *               - prizePool
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               entryFee:
 *                 type: number
 *                 minimum: 0
 *               totalPrizes:
 *                 type: integer
 *                 minimum: 1
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               prizePool:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/LotteryPrize'
 *     responses:
 *       201:
 *         description: Lottery created successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/', AuthMiddleware.verifyToken, rateLimiter.general, lotteryController.createLottery.bind(lotteryController));

/**
 * @swagger
 * /api/v1/lotteries/{id}/participate:
 *   post:
 *     summary: Participate in a lottery
 *     tags: [Lotteries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lottery ID
 *     responses:
 *       200:
 *         description: Lottery participation successful
 *       400:
 *         description: Cannot participate in lottery
 *       401:
 *         description: Authentication required
 */
router.post('/:id/participate', AuthMiddleware.verifyToken, rateLimiter.blockchain, lotteryController.participateInLottery.bind(lotteryController));

/**
 * @swagger
 * /api/v1/lotteries/{id}/draw:
 *   post:
 *     summary: Draw lottery winners
 *     tags: [Lotteries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lottery ID
 *     responses:
 *       200:
 *         description: Winners drawn successfully
 *       400:
 *         description: Cannot draw winners
 *       401:
 *         description: Authentication required
 */
router.post('/:id/draw', AuthMiddleware.verifyToken, rateLimiter.general, lotteryController.drawWinners.bind(lotteryController));

/**
 * @swagger
 * /api/v1/lotteries/history:
 *   get:
 *     summary: Get user's lottery history
 *     tags: [Lotteries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Lottery history retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/history', AuthMiddleware.verifyToken, lotteryController.getUserLotteryHistory.bind(lotteryController));

/**
 * @swagger
 * /api/v1/lotteries/{id}/statistics:
 *   get:
 *     summary: Get lottery statistics
 *     tags: [Lotteries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lottery ID
 *     responses:
 *       200:
 *         description: Lottery statistics retrieved successfully
 *       404:
 *         description: Lottery not found
 */
router.get('/:id/statistics', lotteryController.getLotteryStatistics.bind(lotteryController));

/**
 * @swagger
 * /api/v1/lotteries/{id}/participants:
 *   get:
 *     summary: Get lottery participants (admin only)
 *     tags: [Lotteries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lottery ID
 *     responses:
 *       200:
 *         description: Lottery participants retrieved successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Lottery not found
 */
router.get('/:id/participants', AuthMiddleware.verifyToken, lotteryController.getLotteryParticipants.bind(lotteryController));

/**
 * @swagger
 * /api/v1/lotteries/verify-randomness:
 *   post:
 *     summary: Verify lottery randomness
 *     tags: [Lotteries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - seed
 *             properties:
 *               seed:
 *                 type: string
 *     responses:
 *       200:
 *         description: Randomness verification result
 */
router.post('/verify-randomness', lotteryController.verifyRandomness.bind(lotteryController));

export default router;
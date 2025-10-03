import { Router } from 'express';
import { SocketController } from '../controllers/SocketController';

const router = Router();

/**
 * @swagger
 * /api/v1/socket/lottery/broadcast:
 *   post:
 *     summary: Broadcast lottery event to participants
 *     tags: [Socket.io]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lotteryId
 *               - type
 *             properties:
 *               lotteryId:
 *                 type: string
 *                 description: ID of the lottery
 *               type:
 *                 type: string
 *                 enum: [draw_started, draw_completed, winner_announced]
 *                 description: Type of lottery event
 *               data:
 *                 type: object
 *                 description: Additional event data
 *     responses:
 *       200:
 *         description: Lottery event broadcasted successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.post('/lottery/broadcast', SocketController.broadcastLotteryEvent);

/**
 * @swagger
 * /api/v1/socket/promotion/broadcast:
 *   post:
 *     summary: Broadcast promotion to users
 *     tags: [Socket.io]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - merchantId
 *               - type
 *               - title
 *               - description
 *             properties:
 *               merchantId:
 *                 type: string
 *                 description: ID of the merchant
 *               type:
 *                 type: string
 *                 enum: [new_promotion, limited_offer, flash_sale]
 *                 description: Type of promotion
 *               title:
 *                 type: string
 *                 description: Promotion title
 *               description:
 *                 type: string
 *                 description: Promotion description
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   radius:
 *                     type: number
 *                     description: Radius in meters
 *               data:
 *                 type: object
 *                 description: Additional promotion data
 *     responses:
 *       200:
 *         description: Promotion broadcasted successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.post('/promotion/broadcast', SocketController.broadcastPromotion);

/**
 * @swagger
 * /api/v1/socket/notification/send:
 *   post:
 *     summary: Send notification to users
 *     tags: [Socket.io]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *               - message
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [system, merchant, lottery, nft]
 *                 description: Type of notification
 *               title:
 *                 type: string
 *                 description: Notification title
 *               message:
 *                 type: string
 *                 description: Notification message
 *               data:
 *                 type: object
 *                 description: Additional notification data
 *               targetUsers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to target (optional)
 *               targetLocation:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   radius:
 *                     type: number
 *                     description: Radius in meters
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.post('/notification/send', SocketController.sendNotification);

/**
 * @swagger
 * /api/v1/socket/user/send:
 *   post:
 *     summary: Send direct message to a specific user
 *     tags: [Socket.io]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - event
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the target user
 *               event:
 *                 type: string
 *                 description: Event name
 *               data:
 *                 type: object
 *                 description: Event data
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.post('/user/send', SocketController.sendToUser);

/**
 * @swagger
 * /api/v1/socket/stats:
 *   get:
 *     summary: Get Socket.io server statistics
 *     tags: [Socket.io]
 *     responses:
 *       200:
 *         description: Socket statistics retrieved successfully
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
 *                     connectedUsers:
 *                       type: number
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Server error
 */
router.get('/stats', SocketController.getSocketStats);

/**
 * @swagger
 * /api/v1/socket/room/{roomName}/users:
 *   get:
 *     summary: Get users in a specific room
 *     tags: [Socket.io]
 *     parameters:
 *       - in: path
 *         name: roomName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the room
 *     responses:
 *       200:
 *         description: Room users retrieved successfully
 *       400:
 *         description: Invalid room name
 *       500:
 *         description: Server error
 */
router.get('/room/:roomName/users', SocketController.getRoomUsers);

/**
 * @swagger
 * /api/v1/socket/user/{userId}/status:
 *   get:
 *     summary: Check if a user is connected
 *     tags: [Socket.io]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: User connection status retrieved successfully
 *       400:
 *         description: Invalid user ID
 *       500:
 *         description: Server error
 */
router.get('/user/:userId/status', SocketController.checkUserConnection);

/**
 * @swagger
 * /api/v1/socket/system/broadcast:
 *   post:
 *     summary: Broadcast system maintenance message
 *     tags: [Socket.io]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: System message
 *               type:
 *                 type: string
 *                 enum: [info, warning, error]
 *                 default: info
 *                 description: Message type
 *     responses:
 *       200:
 *         description: System message broadcasted successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.post('/system/broadcast', SocketController.broadcastSystemMessage);

export default router;
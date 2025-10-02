import { Request, Response } from 'express';
import { LotteryService } from '../services/LotteryService';
import { LotteryConfig, LotteryPrize } from '../types';

export class LotteryController {
  constructor(private lotteryService: LotteryService) {}

  // GET /api/v1/lotteries/active
  async getActiveLotteries(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      const result = await this.lotteryService.getActiveLotteries(page, limit);

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getActiveLotteries:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching active lotteries'
      });
    }
  }

  // GET /api/v1/lotteries/:id
  async getLotteryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Lottery ID is required'
        });
        return;
      }

      const lottery = await this.lotteryService.getLotteryById(id);

      if (!lottery) {
        res.status(404).json({
          success: false,
          error: 'Lottery not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: lottery
      });
    } catch (error) {
      console.error('Error in getLotteryById:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching lottery'
      });
    }
  }

  // POST /api/v1/lotteries
  async createLottery(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        description,
        entryFee,
        totalPrizes,
        startTime,
        endTime,
        prizePool
      } = req.body;

      // Validate required fields
      if (!name || !totalPrizes || !startTime || !endTime || !prizePool) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: name, totalPrizes, startTime, endTime, prizePool'
        });
        return;
      }

      // Validate prize pool structure
      if (!Array.isArray(prizePool) || prizePool.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Prize pool must be a non-empty array'
        });
        return;
      }

      // Validate each prize in the pool
      for (const prize of prizePool) {
        if (!prize.type || !prize.value || !prize.quantity || !prize.rarity) {
          res.status(400).json({
            success: false,
            error: 'Each prize must have type, value, quantity, and rarity'
          });
          return;
        }
      }

      const lotteryConfig: LotteryConfig = {
        name,
        description,
        entryFee: parseFloat(entryFee) || 0,
        totalPrizes: parseInt(totalPrizes),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        prizePool: prizePool as LotteryPrize[]
      };

      // Get user ID from authenticated request (assuming auth middleware sets req.user)
      const createdBy = (req as any).user?.id;

      const result = await this.lotteryService.createLottery(lotteryConfig, createdBy);

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in createLottery:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while creating lottery'
      });
    }
  }

  // POST /api/v1/lotteries/:id/participate
  async participateInLottery(req: Request, res: Response): Promise<void> {
    try {
      const { id: lotteryId } = req.params;
      
      // Get user ID from authenticated request
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      if (!lotteryId) {
        res.status(400).json({
          success: false,
          error: 'Lottery ID is required'
        });
        return;
      }

      const result = await this.lotteryService.participateInLottery(lotteryId, userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in participateInLottery:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while participating in lottery'
      });
    }
  }

  // POST /api/v1/lotteries/:id/draw
  async drawWinners(req: Request, res: Response): Promise<void> {
    try {
      const { id: lotteryId } = req.params;

      if (!lotteryId) {
        res.status(400).json({
          success: false,
          error: 'Lottery ID is required'
        });
        return;
      }

      // TODO: Add authorization check - only lottery creator or admin should be able to draw
      
      const result = await this.lotteryService.drawWinners(lotteryId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in drawWinners:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while drawing winners'
      });
    }
  }

  // GET /api/v1/lotteries/history
  async getUserLotteryHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      const result = await this.lotteryService.getUserLotteryHistory(userId, page, limit);

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getUserLotteryHistory:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching lottery history'
      });
    }
  }

  // GET /api/v1/lotteries/:id/statistics
  async getLotteryStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Lottery ID is required'
        });
        return;
      }

      const statistics = await this.lotteryService.getLotteryStatistics(id);

      if (!statistics) {
        res.status(404).json({
          success: false,
          error: 'Lottery not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Error in getLotteryStatistics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching lottery statistics'
      });
    }
  }

  // GET /api/v1/lotteries/:id/participants
  async getLotteryParticipants(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Lottery ID is required'
        });
        return;
      }

      // TODO: Add authorization check - only lottery creator or admin should see participants
      
      const lottery = await this.lotteryService.getLotteryById(id);
      
      if (!lottery) {
        res.status(404).json({
          success: false,
          error: 'Lottery not found'
        });
        return;
      }

      const statistics = await this.lotteryService.getLotteryStatistics(id);

      res.status(200).json({
        success: true,
        data: {
          lottery,
          statistics: statistics?.statistics || {}
        }
      });
    } catch (error) {
      console.error('Error in getLotteryParticipants:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching lottery participants'
      });
    }
  }

  // POST /api/v1/lotteries/verify-randomness
  async verifyRandomness(req: Request, res: Response): Promise<void> {
    try {
      const { seed } = req.body;

      if (!seed) {
        res.status(400).json({
          success: false,
          error: 'Random seed is required'
        });
        return;
      }

      const result = await this.lotteryService.verifyRandomness(seed);

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in verifyRandomness:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while verifying randomness'
      });
    }
  }
}
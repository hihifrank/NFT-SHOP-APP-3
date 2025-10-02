import { LotteryController } from '../controllers/LotteryController';
import { LotteryService } from '../services/LotteryService';
import { LotteryRepository } from '../repositories/LotteryRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { BlockchainService } from '../services/BlockchainService';

// Mock the dependencies
jest.mock('../repositories/LotteryRepository');
jest.mock('../repositories/TransactionRepository');
jest.mock('../services/BlockchainService');
jest.mock('../database/connection');

describe('Lottery Controller', () => {
  let lotteryController: LotteryController;
  let mockLotteryService: jest.Mocked<LotteryService>;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    // Create a mock service with all required methods
    mockLotteryService = {
      getActiveLotteries: jest.fn(),
      getLotteryById: jest.fn(),
      participateInLottery: jest.fn(),
      verifyRandomness: jest.fn(),
      createLottery: jest.fn(),
      drawWinners: jest.fn(),
      getUserLotteryHistory: jest.fn(),
      getLotteryStatistics: jest.fn()
    } as any;
    
    lotteryController = new LotteryController(mockLotteryService);

    // Mock request and response objects
    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: { id: 'test-user-id' }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getActiveLotteries', () => {
    it('should return active lotteries successfully', async () => {
      const mockResult = {
        success: true,
        data: [
          {
            id: 'lottery-1',
            name: 'Test Lottery',
            isActive: true
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1
        }
      };

      mockLotteryService.getActiveLotteries.mockResolvedValue(mockResult as any);

      await lotteryController.getActiveLotteries(mockRequest, mockResponse);

      expect(mockLotteryService.getActiveLotteries).toHaveBeenCalledWith(1, 20);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle pagination parameters', async () => {
      mockRequest.query = { page: '2', limit: '10' };
      
      const mockResult = {
        success: true,
        data: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };

      mockLotteryService.getActiveLotteries.mockResolvedValue(mockResult as any);

      await lotteryController.getActiveLotteries(mockRequest, mockResponse);

      expect(mockLotteryService.getActiveLotteries).toHaveBeenCalledWith(2, 10);
    });
  });

  describe('getLotteryById', () => {
    it('should return lottery details for valid ID', async () => {
      const lotteryId = 'test-lottery-id';
      mockRequest.params = { id: lotteryId };
      
      const mockLottery = {
        id: lotteryId,
        name: 'Test Lottery',
        isActive: true
      };

      mockLotteryService.getLotteryById.mockResolvedValue(mockLottery as any);

      await lotteryController.getLotteryById(mockRequest, mockResponse);

      expect(mockLotteryService.getLotteryById).toHaveBeenCalledWith(lotteryId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockLottery
      });
    });

    it('should return 404 for non-existent lottery', async () => {
      const lotteryId = 'non-existent-id';
      mockRequest.params = { id: lotteryId };

      mockLotteryService.getLotteryById.mockResolvedValue(null);

      await lotteryController.getLotteryById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Lottery not found'
      });
    });

    it('should return 400 for missing lottery ID', async () => {
      mockRequest.params = {};

      await lotteryController.getLotteryById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Lottery ID is required'
      });
    });
  });

  describe('participateInLottery', () => {
    it('should allow user to participate in lottery', async () => {
      const lotteryId = 'test-lottery-id';
      mockRequest.params = { id: lotteryId };
      mockRequest.user = { id: 'test-user-id' };

      const mockResult = {
        success: true,
        participationId: `${lotteryId}-test-user-id`,
        transactionHash: 'test-hash'
      };

      mockLotteryService.participateInLottery.mockResolvedValue(mockResult);

      await lotteryController.participateInLottery(mockRequest, mockResponse);

      expect(mockLotteryService.participateInLottery).toHaveBeenCalledWith(lotteryId, 'test-user-id');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 401 for unauthenticated user', async () => {
      mockRequest.user = undefined;

      await lotteryController.participateInLottery(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
    });
  });

  describe('verifyRandomness', () => {
    it('should verify valid random seed', async () => {
      const validSeed = 'a'.repeat(32);
      mockRequest.body = { seed: validSeed };

      const mockResult = {
        success: true,
        isValid: true,
        randomValue: validSeed
      };

      mockLotteryService.verifyRandomness.mockResolvedValue(mockResult);

      await lotteryController.verifyRandomness(mockRequest, mockResponse);

      expect(mockLotteryService.verifyRandomness).toHaveBeenCalledWith(validSeed);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 400 for missing seed', async () => {
      mockRequest.body = {};

      await lotteryController.verifyRandomness(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Random seed is required'
      });
    });
  });
});
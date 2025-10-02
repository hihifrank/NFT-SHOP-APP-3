import { LotteryService } from '../services/LotteryService';
import { LotteryRepository } from '../repositories/LotteryRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { BlockchainService } from '../services/BlockchainService';
import { LotteryConfig, LotteryPrize, BusinessErrorType } from '../types';

// Mock dependencies
jest.mock('../repositories/LotteryRepository');
jest.mock('../repositories/TransactionRepository');
jest.mock('../services/BlockchainService');

describe('LotteryService', () => {
  let lotteryService: LotteryService;
  let mockLotteryRepository: jest.Mocked<LotteryRepository>;
  let mockTransactionRepository: jest.Mocked<TransactionRepository>;
  let mockBlockchainService: jest.Mocked<BlockchainService>;

  beforeEach(() => {
    mockLotteryRepository = new LotteryRepository({} as any) as jest.Mocked<LotteryRepository>;
    mockTransactionRepository = new TransactionRepository() as jest.Mocked<TransactionRepository>;
    mockBlockchainService = new BlockchainService() as jest.Mocked<BlockchainService>;
    
    lotteryService = new LotteryService(
      mockLotteryRepository,
      mockTransactionRepository,
      mockBlockchainService
    );
  });

  describe('createLottery', () => {
    it('should create a lottery successfully', async () => {
      const lotteryConfig: LotteryConfig = {
        name: 'Test Lottery',
        description: 'A test lottery',
        entryFee: 10,
        totalPrizes: 2,
        startTime: new Date(Date.now() + 3600000), // 1 hour from now
        endTime: new Date(Date.now() + 7200000), // 2 hours from now
        prizePool: [
          {
            type: 'nft',
            value: 'rare-coupon-nft',
            quantity: 1,
            rarity: 'rare'
          },
          {
            type: 'coupon',
            value: 'discount-coupon',
            quantity: 1,
            rarity: 'common'
          }
        ]
      };

      const mockLottery = {
        id: 'lottery-123',
        ...lotteryConfig,
        remainingPrizes: 2,
        currentParticipants: 0,
        isActive: true,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockLotteryRepository.createLottery.mockResolvedValue(mockLottery);

      const result = await lotteryService.createLottery(lotteryConfig, 'user-123');

      expect(result.success).toBe(true);
      expect(result.lotteryId).toBe('lottery-123');
      expect(mockLotteryRepository.createLottery).toHaveBeenCalledWith({
        ...lotteryConfig,
        createdBy: 'user-123'
      });
    });

    it('should fail to create lottery with invalid configuration', async () => {
      const invalidConfig: LotteryConfig = {
        name: '', // Invalid: empty name
        description: 'A test lottery',
        entryFee: 10,
        totalPrizes: 2,
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
        prizePool: []
      };

      const result = await lotteryService.createLottery(invalidConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Lottery name is required');
    });

    it('should fail when prize pool quantity does not match total prizes', async () => {
      const invalidConfig: LotteryConfig = {
        name: 'Test Lottery',
        description: 'A test lottery',
        entryFee: 10,
        totalPrizes: 5, // Mismatch with prize pool quantity
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
        prizePool: [
          {
            type: 'nft',
            value: 'rare-coupon-nft',
            quantity: 2, // Total quantity is 2, but totalPrizes is 5
            rarity: 'rare'
          }
        ]
      };

      const result = await lotteryService.createLottery(invalidConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Total prize quantity must match total prizes');
    });
  });

  describe('participateInLottery', () => {
    it('should allow user to participate in active lottery', async () => {
      const mockLottery = {
        id: 'lottery-123',
        name: 'Test Lottery',
        entryFee: 10,
        isActive: true,
        isCompleted: false,
        startTime: new Date(Date.now() - 3600000), // Started 1 hour ago
        endTime: new Date(Date.now() + 3600000), // Ends in 1 hour
        maxParticipants: 100,
        currentParticipants: 50,
        currency: 'HKD'
      };

      const mockTransaction = {
        id: 'tx-123',
        userId: 'user-123',
        lotteryId: 'lottery-123',
        transactionType: 'lottery_entry' as const,
        amount: 10,
        currency: 'HKD',
        status: 'confirmed' as const,
        createdAt: new Date()
      };

      mockLotteryRepository.getLotteryById.mockResolvedValue(mockLottery as any);
      mockLotteryRepository.getLotteryParticipants.mockResolvedValue([]);
      mockTransactionRepository.create.mockResolvedValue(mockTransaction as any);
      mockLotteryRepository.participateInLottery.mockResolvedValue(true);

      const result = await lotteryService.participateInLottery('lottery-123', 'user-123');

      expect(result.success).toBe(true);
      expect(result.participationId).toBe('lottery-123-user-123');
      expect(mockLotteryRepository.participateInLottery).toHaveBeenCalledWith('lottery-123', 'user-123');
    });

    it('should prevent duplicate participation', async () => {
      const mockLottery = {
        id: 'lottery-123',
        name: 'Test Lottery',
        entryFee: 0,
        isActive: true,
        isCompleted: false,
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(Date.now() + 3600000),
        maxParticipants: 100,
        currentParticipants: 50
      };

      const existingParticipant = {
        user_id: 'user-123',
        lottery_id: 'lottery-123'
      };

      mockLotteryRepository.getLotteryById.mockResolvedValue(mockLottery as any);
      mockLotteryRepository.getLotteryParticipants.mockResolvedValue([existingParticipant]);

      const result = await lotteryService.participateInLottery('lottery-123', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already participated');
    });

    it('should prevent participation in inactive lottery', async () => {
      const mockLottery = {
        id: 'lottery-123',
        name: 'Test Lottery',
        entryFee: 0,
        isActive: false, // Inactive lottery
        isCompleted: false,
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(Date.now() + 3600000)
      };

      mockLotteryRepository.getLotteryById.mockResolvedValue(mockLottery as any);

      const result = await lotteryService.participateInLottery('lottery-123', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not active');
    });
  });

  describe('drawWinners', () => {
    it('should draw winners successfully', async () => {
      const mockLottery = {
        id: 'lottery-123',
        name: 'Test Lottery',
        isCompleted: false,
        endTime: new Date(Date.now() - 3600000), // Ended 1 hour ago
        prizePool: [
          {
            type: 'nft',
            value: 'rare-coupon-nft',
            quantity: 1,
            rarity: 'rare'
          }
        ]
      };

      const mockParticipants = [
        { user_id: 'user-1', lottery_id: 'lottery-123' },
        { user_id: 'user-2', lottery_id: 'lottery-123' },
        { user_id: 'user-3', lottery_id: 'lottery-123' }
      ];

      mockLotteryRepository.getLotteryById.mockResolvedValue(mockLottery as any);
      mockLotteryRepository.getLotteryParticipants.mockResolvedValue(mockParticipants);
      mockLotteryRepository.updateLottery.mockResolvedValue(mockLottery as any);
      mockLotteryRepository.markWinners.mockResolvedValue(true);
      mockTransactionRepository.create.mockResolvedValue({} as any);

      const result = await lotteryService.drawWinners('lottery-123');

      expect(result.success).toBe(true);
      expect(result.winners).toHaveLength(1);
      expect(result.winners[0].userId).toMatch(/^user-[123]$/);
      expect(mockLotteryRepository.markWinners).toHaveBeenCalled();
    });

    it('should prevent drawing winners before lottery ends', async () => {
      const mockLottery = {
        id: 'lottery-123',
        name: 'Test Lottery',
        isCompleted: false,
        endTime: new Date(Date.now() + 3600000) // Ends in 1 hour
      };

      mockLotteryRepository.getLotteryById.mockResolvedValue(mockLottery as any);

      const result = await lotteryService.drawWinners('lottery-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('has not ended yet');
    });

    it('should prevent drawing winners for completed lottery', async () => {
      const mockLottery = {
        id: 'lottery-123',
        name: 'Test Lottery',
        isCompleted: true, // Already completed
        endTime: new Date(Date.now() - 3600000)
      };

      mockLotteryRepository.getLotteryById.mockResolvedValue(mockLottery as any);

      const result = await lotteryService.drawWinners('lottery-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already completed');
    });
  });

  describe('getActiveLotteries', () => {
    it('should return paginated active lotteries', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'lottery-1',
            name: 'Lottery 1',
            isActive: true,
            startTime: new Date(),
            endTime: new Date(Date.now() + 3600000)
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1
        }
      };

      mockLotteryRepository.getActiveLotteries.mockResolvedValue(mockResponse as any);

      const result = await lotteryService.getActiveLotteries(1, 20);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('verifyRandomness', () => {
    it('should verify valid random seed', async () => {
      const validSeed = 'a'.repeat(32); // 32 character seed

      const result = await lotteryService.verifyRandomness(validSeed);

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.randomValue).toBe(validSeed);
    });

    it('should reject invalid random seed', async () => {
      const invalidSeed = 'short'; // Too short

      const result = await lotteryService.verifyRandomness(invalidSeed);

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(false);
    });
  });
});
import { Lottery, LotteryPrize, WinnerSelectionMethod } from '../Lottery';

describe('Lottery Model', () => {
  const validLotteryData = {
    name: 'Test Lottery',
    entryFee: 10,
    totalPrizes: 5,
    startTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  };

  const samplePrizePool: LotteryPrize[] = [
    {
      type: 'nft',
      value: 'rare-coupon-nft',
      quantity: 1,
      rarity: 'legendary',
      description: 'Rare NFT coupon'
    },
    {
      type: 'coupon',
      value: '50',
      quantity: 3,
      rarity: 'rare',
      description: '$50 discount coupon'
    },
    {
      type: 'discount',
      value: '20',
      quantity: 1,
      rarity: 'common',
      description: '20% discount'
    }
  ];

  describe('Constructor', () => {
    it('should create a lottery with valid data', () => {
      const lottery = new Lottery(validLotteryData);
      
      expect(lottery.name).toBe(validLotteryData.name);
      expect(lottery.entryFee).toBe(validLotteryData.entryFee);
      expect(lottery.totalPrizes).toBe(validLotteryData.totalPrizes);
      expect(lottery.remainingPrizes).toBe(validLotteryData.totalPrizes);
      expect(lottery.startTime).toBe(validLotteryData.startTime);
      expect(lottery.endTime).toBe(validLotteryData.endTime);
      expect(lottery.currency).toBe('HKD');
      expect(lottery.currentParticipants).toBe(0);
      expect(lottery.isActive).toBe(true);
      expect(lottery.isCompleted).toBe(false);
      expect(lottery.winnerSelectionMethod).toBe('random');
      expect(lottery.prizePool).toEqual([]);
    });

    it('should set default values correctly', () => {
      const lottery = new Lottery(validLotteryData);
      
      expect(lottery.currency).toBe('HKD');
      expect(lottery.remainingPrizes).toBe(validLotteryData.totalPrizes);
      expect(lottery.currentParticipants).toBe(0);
      expect(lottery.prizePool).toEqual([]);
      expect(lottery.isActive).toBe(true);
      expect(lottery.isCompleted).toBe(false);
      expect(lottery.winnerSelectionMethod).toBe('random');
      expect(lottery.createdAt).toBeInstanceOf(Date);
      expect(lottery.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Validation', () => {
    it('should validate correct lottery data', () => {
      const { error, value } = Lottery.validate(validLotteryData);
      
      expect(error).toBeUndefined();
      expect(value).toBeDefined();
    });

    it('should reject name that is too short', () => {
      const invalidData = { ...validLotteryData, name: 'AB' };
      const { error } = Lottery.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('at least 3 characters');
    });

    it('should reject negative entry fee', () => {
      const invalidData = { ...validLotteryData, entryFee: -10 };
      const { error } = Lottery.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('cannot be negative');
    });

    it('should reject invalid currency', () => {
      const invalidData = { ...validLotteryData, currency: 'INVALID' };
      const { error } = Lottery.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('HKD, USD, CNY, ETH, MATIC');
    });

    it('should reject non-positive total prizes', () => {
      const invalidData = { ...validLotteryData, totalPrizes: 0 };
      const { error } = Lottery.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('positive');
    });

    it('should reject end time before start time', () => {
      const invalidData = {
        ...validLotteryData,
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 60 * 60 * 1000)
      };
      const { error } = Lottery.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('after start time');
    });

    it('should reject draw time before end time', () => {
      const invalidData = {
        ...validLotteryData,
        drawTime: new Date(Date.now() + 60 * 60 * 1000) // before end time
      };
      const { error } = Lottery.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('after end time');
    });

    it('should reject invalid random seed format', () => {
      const invalidData = { ...validLotteryData, randomSeed: 'invalid-seed' };
      const { error } = Lottery.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('64-character hexadecimal');
    });

    it('should reject invalid winner selection method', () => {
      const invalidData = { ...validLotteryData, winnerSelectionMethod: 'invalid-method' };
      const { error } = Lottery.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('random or first_come_first_serve');
    });
  });

  describe('Static Methods', () => {
    describe('create', () => {
      it('should create lottery with valid data', () => {
        const lottery = Lottery.create(validLotteryData);
        
        expect(lottery).toBeInstanceOf(Lottery);
        expect(lottery.name).toBe(validLotteryData.name);
      });

      it('should throw error with invalid data', () => {
        const invalidData = { ...validLotteryData, entryFee: -10 };
        
        expect(() => Lottery.create(invalidData)).toThrow('Lottery validation failed');
      });
    });

    describe('fromDatabaseRow', () => {
      it('should create lottery from database row', () => {
        const dbRow = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test Lottery',
          name_en: 'Test Lottery EN',
          name_zh_cn: 'Test Lottery CN',
          description: 'A test lottery',
          entry_fee: '10',
          currency: 'HKD',
          total_prizes: '5',
          remaining_prizes: '3',
          max_participants: '100',
          current_participants: '25',
          prize_pool: JSON.stringify(samplePrizePool),
          start_time: '2024-01-01T00:00:00Z',
          end_time: '2024-01-07T23:59:59Z',
          is_active: true,
          is_completed: false,
          winner_selection_method: 'random',
          created_at: '2023-12-01T00:00:00Z',
          updated_at: '2023-12-01T00:00:00Z'
        };

        const lottery = Lottery.fromDatabaseRow(dbRow);
        
        expect(lottery.id).toBe(dbRow.id);
        expect(lottery.name).toBe(dbRow.name);
        expect(lottery.nameEn).toBe(dbRow.name_en);
        expect(lottery.nameZhCn).toBe(dbRow.name_zh_cn);
        expect(lottery.entryFee).toBe(10);
        expect(lottery.totalPrizes).toBe(5);
        expect(lottery.remainingPrizes).toBe(3);
        expect(lottery.maxParticipants).toBe(100);
        expect(lottery.currentParticipants).toBe(25);
        expect(lottery.prizePool).toEqual(samplePrizePool);
      });
    });
  });

  describe('Instance Methods', () => {
    let lottery: Lottery;

    beforeEach(() => {
      lottery = new Lottery({
        ...validLotteryData,
        prizePool: samplePrizePool
      });
    });

    describe('update', () => {
      it('should update lottery with valid data', () => {
        const updates = { name: 'Updated Lottery', entryFee: 15 };
        
        lottery.update(updates);
        
        expect(lottery.name).toBe(updates.name);
        expect(lottery.entryFee).toBe(updates.entryFee);
      });

      it('should throw error with invalid update data', () => {
        const invalidUpdates = { entryFee: -10 };
        
        expect(() => lottery.update(invalidUpdates)).toThrow('Lottery update validation failed');
      });
    });

    describe('canAcceptParticipants', () => {
      beforeEach(() => {
        // Set lottery to be currently active
        lottery.startTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
        lottery.endTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      });

      it('should return true when lottery can accept participants', () => {
        const result = lottery.canAcceptParticipants();
        
        expect(result.canParticipate).toBe(true);
        expect(result.reason).toBeUndefined();
      });

      it('should return false when lottery is not active', () => {
        lottery.isActive = false;
        
        const result = lottery.canAcceptParticipants();
        
        expect(result.canParticipate).toBe(false);
        expect(result.reason).toBe('Lottery is not active');
      });

      it('should return false when lottery is completed', () => {
        lottery.isCompleted = true;
        
        const result = lottery.canAcceptParticipants();
        
        expect(result.canParticipate).toBe(false);
        expect(result.reason).toBe('Lottery has been completed');
      });

      it('should return false when lottery has not started', () => {
        lottery.startTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
        
        const result = lottery.canAcceptParticipants();
        
        expect(result.canParticipate).toBe(false);
        expect(result.reason).toBe('Lottery has not started yet');
      });

      it('should return false when lottery has ended', () => {
        lottery.endTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
        
        const result = lottery.canAcceptParticipants();
        
        expect(result.canParticipate).toBe(false);
        expect(result.reason).toBe('Lottery has ended');
      });

      it('should return false when max participants reached', () => {
        lottery.maxParticipants = 10;
        lottery.currentParticipants = 10;
        
        const result = lottery.canAcceptParticipants();
        
        expect(result.canParticipate).toBe(false);
        expect(result.reason).toBe('Maximum participants reached');
      });

      it('should return false when no prizes remaining', () => {
        lottery.remainingPrizes = 0;
        
        const result = lottery.canAcceptParticipants();
        
        expect(result.canParticipate).toBe(false);
        expect(result.reason).toBe('No prizes remaining');
      });
    });

    describe('isReadyForDraw', () => {
      beforeEach(() => {
        lottery.endTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
        lottery.currentParticipants = 10;
      });

      it('should return true when ready for draw', () => {
        const result = lottery.isReadyForDraw();
        
        expect(result.ready).toBe(true);
        expect(result.reason).toBeUndefined();
      });

      it('should return false when already completed', () => {
        lottery.isCompleted = true;
        
        const result = lottery.isReadyForDraw();
        
        expect(result.ready).toBe(false);
        expect(result.reason).toBe('Lottery has already been completed');
      });

      it('should return false when not active', () => {
        lottery.isActive = false;
        
        const result = lottery.isReadyForDraw();
        
        expect(result.ready).toBe(false);
        expect(result.reason).toBe('Lottery is not active');
      });

      it('should return false when lottery has not ended', () => {
        lottery.endTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
        
        const result = lottery.isReadyForDraw();
        
        expect(result.ready).toBe(false);
        expect(result.reason).toBe('Lottery has not ended yet');
      });

      it('should return false when no participants', () => {
        lottery.currentParticipants = 0;
        
        const result = lottery.isReadyForDraw();
        
        expect(result.ready).toBe(false);
        expect(result.reason).toBe('No participants in the lottery');
      });
    });

    describe('addParticipant', () => {
      beforeEach(() => {
        lottery.startTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
        lottery.endTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      });

      it('should add participant successfully', () => {
        const originalCount = lottery.currentParticipants;
        
        lottery.addParticipant();
        
        expect(lottery.currentParticipants).toBe(originalCount + 1);
      });

      it('should throw error when cannot accept participants', () => {
        lottery.isActive = false;
        
        expect(() => lottery.addParticipant()).toThrow('Lottery is not active');
      });
    });

    describe('complete', () => {
      beforeEach(() => {
        lottery.endTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
        lottery.currentParticipants = 10;
      });

      it('should complete lottery successfully', () => {
        const randomSeed = 'a'.repeat(64);
        
        lottery.complete(randomSeed);
        
        expect(lottery.isCompleted).toBe(true);
        expect(lottery.drawTime).toBeInstanceOf(Date);
        expect(lottery.randomSeed).toBe(randomSeed);
      });

      it('should throw error when not ready for draw', () => {
        lottery.currentParticipants = 0;
        
        expect(() => lottery.complete()).toThrow('No participants in the lottery');
      });
    });

    describe('getTotalPrizeValue', () => {
      it('should calculate total prize value correctly', () => {
        // samplePrizePool has prizes with values: 'rare-coupon-nft' (0), '50' (3*50=150), '20' (1*20=20)
        // Only numeric values are counted: 150 + 20 = 170
        const totalValue = lottery.getTotalPrizeValue();
        
        expect(totalValue).toBe(170);
      });

      it('should handle empty prize pool', () => {
        lottery.prizePool = [];
        
        expect(lottery.getTotalPrizeValue()).toBe(0);
      });

      it('should handle non-numeric prize values', () => {
        lottery.prizePool = [
          { type: 'nft', value: 'special-nft', quantity: 1, rarity: 'legendary' },
          { type: 'token', value: 'invalid-number', quantity: 2, rarity: 'common' }
        ];
        
        expect(lottery.getTotalPrizeValue()).toBe(0);
      });
    });

    describe('getPrizeDistribution', () => {
      it('should return correct prize distribution', () => {
        const distribution = lottery.getPrizeDistribution();
        
        expect(distribution.legendary).toBe(1);
        expect(distribution.rare).toBe(3);
        expect(distribution.common).toBe(1);
        expect(distribution.epic).toBe(0);
      });
    });

    describe('getLocalizedName', () => {
      beforeEach(() => {
        lottery.nameEn = 'Test Lottery EN';
        lottery.nameZhCn = 'Test Lottery CN';
      });

      it('should return English name for en language', () => {
        expect(lottery.getLocalizedName('en')).toBe('Test Lottery EN');
      });

      it('should return Chinese name for zh-CN language', () => {
        expect(lottery.getLocalizedName('zh-CN')).toBe('Test Lottery CN');
      });

      it('should return default name for zh-HK language', () => {
        expect(lottery.getLocalizedName('zh-HK')).toBe(lottery.name);
      });

      it('should fallback to default name when localized name not available', () => {
        lottery.nameEn = undefined;
        expect(lottery.getLocalizedName('en')).toBe(lottery.name);
      });
    });

    describe('getTimeRemaining', () => {
      it('should return completed phase when lottery is completed', () => {
        lottery.isCompleted = true;
        
        const result = lottery.getTimeRemaining();
        
        expect(result.phase).toBe('completed');
      });

      it('should return not_started phase when lottery has not started', () => {
        lottery.startTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
        
        const result = lottery.getTimeRemaining();
        
        expect(result.phase).toBe('not_started');
        expect(result.timeRemaining).toBeGreaterThan(0);
      });

      it('should return active phase when lottery is currently running', () => {
        lottery.startTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
        lottery.endTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
        
        const result = lottery.getTimeRemaining();
        
        expect(result.phase).toBe('active');
        expect(result.timeRemaining).toBeGreaterThan(0);
      });

      it('should return ended phase when lottery has ended', () => {
        lottery.startTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
        lottery.endTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
        
        const result = lottery.getTimeRemaining();
        
        expect(result.phase).toBe('ended');
      });
    });

    describe('toDatabaseRow', () => {
      it('should convert to database row format', () => {
        const dbRow = lottery.toDatabaseRow();
        
        expect(dbRow.name_en).toBe(lottery.nameEn);
        expect(dbRow.name_zh_cn).toBe(lottery.nameZhCn);
        expect(dbRow.entry_fee).toBe(lottery.entryFee);
        expect(dbRow.total_prizes).toBe(lottery.totalPrizes);
        expect(dbRow.remaining_prizes).toBe(lottery.remainingPrizes);
        expect(dbRow.max_participants).toBe(lottery.maxParticipants);
        expect(dbRow.current_participants).toBe(lottery.currentParticipants);
        expect(dbRow.prize_pool).toBe(JSON.stringify(lottery.prizePool));
        expect(dbRow.is_active).toBe(lottery.isActive);
        expect(dbRow.is_completed).toBe(lottery.isCompleted);
        expect(dbRow.winner_selection_method).toBe(lottery.winnerSelectionMethod);
      });
    });
  });
});
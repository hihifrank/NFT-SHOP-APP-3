import { User } from '../User';
import { Merchant } from '../Merchant';
import { CouponNFT } from '../CouponNFT';
import { Lottery } from '../Lottery';
import { Transaction } from '../Transaction';
import { v4 as uuidv4 } from 'uuid';

describe('Model Relationships and Integration', () => {
  describe('User-CouponNFT Relationship', () => {
    it('should handle coupon ownership transfer correctly', () => {
      const user1 = User.create({
        walletAddress: '0x742d35Cc6634C0532925a3b8D0C9964E5Bfe421e',
        email: 'user1@example.com',
        username: 'user1'
      });
      user1.id = uuidv4();

      const user2 = User.create({
        walletAddress: '0x8ba1f109551bD432803012645aac136c30C6756c',
        email: 'user2@example.com',
        username: 'user2'
      });
      user2.id = uuidv4();

      const coupon = CouponNFT.create({
        tokenId: BigInt(12345),
        merchantId: uuidv4(),
        couponType: 'percentage',
        title: 'Test Coupon',
        discountValue: 20,
        discountType: 'percentage',
        maxQuantity: 100,
        currentOwnerId: user1.id
      });

      // Transfer coupon from user1 to user2
      coupon.transfer(user1.id, user2.id);
      
      expect(coupon.currentOwnerId).toBe(user2.id);
    });

    it('should validate user eligibility for lottery participation', () => {
      const activeUser = User.create({
        walletAddress: '0x742d35Cc6634C0532925a3b8D0C9964E5Bfe421e',
        email: 'active@example.com',
        username: 'activeuser'
      });
      activeUser.isActive = true;
      activeUser.emailVerified = true;

      const inactiveUser = User.create({
        walletAddress: '0x8ba1f109551bD432803012645aac136c30C6756c',
        email: 'inactive@example.com',
        username: 'inactiveuser'
      });
      inactiveUser.isActive = false;

      expect(activeUser.canParticipateInLotteries()).toBe(true);
      expect(inactiveUser.canParticipateInLotteries()).toBe(false);
    });
  });

  describe('Merchant-CouponNFT Relationship', () => {
    it('should create coupon NFT for merchant correctly', () => {
      const merchant = Merchant.create({
        name: 'Test Restaurant',
        address: '123 Test Street, Central, Hong Kong',
        latitude: 22.2783,
        longitude: 114.1747,
        category: 'restaurant'
      });
      merchant.id = uuidv4();

      const coupon = CouponNFT.create({
        tokenId: BigInt(12345),
        merchantId: merchant.id,
        couponType: 'percentage',
        title: 'Restaurant Discount',
        discountValue: 15,
        discountType: 'percentage',
        maxQuantity: 50
      });

      expect(coupon.merchantId).toBe(merchant.id);
      expect(coupon.title).toBe('Restaurant Discount');
    });

    it('should handle merchant location-based operations', () => {
      const merchant = Merchant.create({
        name: 'Central Restaurant',
        address: '123 Central Street, Hong Kong',
        latitude: 22.2783,
        longitude: 114.1747,
        category: 'restaurant'
      });

      // Test distance calculation to Tsim Sha Tsui
      const distanceToTST = merchant.distanceFrom(22.2944, 114.1722);
      expect(distanceToTST).toBeGreaterThan(0);
      expect(distanceToTST).toBeLessThan(10); // Should be less than 10km
    });
  });

  describe('Transaction-Model Relationships', () => {
    it('should create NFT mint transaction correctly', () => {
      const user = User.create({
        walletAddress: '0x742d35Cc6634C0532925a3b8D0C9964E5Bfe421e',
        email: 'user@example.com'
      });
      user.id = uuidv4();

      const coupon = CouponNFT.create({
        tokenId: BigInt(12345),
        merchantId: uuidv4(),
        couponType: 'percentage',
        title: 'Test Coupon',
        discountValue: 20,
        discountType: 'percentage',
        maxQuantity: 100
      });
      coupon.id = uuidv4();

      const transaction = Transaction.create({
        userId: user.id,
        nftId: coupon.id,
        transactionType: 'mint',
        amount: 50,
        fromAddress: '0x0000000000000000000000000000000000000000',
        toAddress: user.walletAddress
      });

      expect(transaction.userId).toBe(user.id);
      expect(transaction.nftId).toBe(coupon.id);
      expect(transaction.transactionType).toBe('mint');
      expect(transaction.isNFTTransaction()).toBe(true);
      expect(transaction.isLotteryTransaction()).toBe(false);
    });

    it('should create lottery entry transaction correctly', () => {
      const user = User.create({
        walletAddress: '0x742d35Cc6634C0532925a3b8D0C9964E5Bfe421e',
        email: 'user@example.com'
      });
      user.id = uuidv4();

      const lottery = Lottery.create({
        name: 'Test Lottery',
        entryFee: 10,
        totalPrizes: 5,
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      lottery.id = uuidv4();

      const transaction = Transaction.create({
        userId: user.id,
        lotteryId: lottery.id,
        transactionType: 'lottery_entry',
        amount: lottery.entryFee,
        currency: lottery.currency
      });

      expect(transaction.userId).toBe(user.id);
      expect(transaction.lotteryId).toBe(lottery.id);
      expect(transaction.transactionType).toBe('lottery_entry');
      expect(transaction.amount).toBe(lottery.entryFee);
      expect(transaction.isLotteryTransaction()).toBe(true);
      expect(transaction.isNFTTransaction()).toBe(false);
    });
  });

  describe('Lottery-Prize Relationships', () => {
    it('should handle lottery completion with prize distribution', () => {
      const lottery = Lottery.create({
        name: 'Test Lottery',
        entryFee: 10,
        totalPrizes: 3,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        endTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        prizePool: [
          {
            type: 'nft',
            value: 'legendary-coupon',
            quantity: 1,
            rarity: 'legendary'
          },
          {
            type: 'coupon',
            value: '100',
            quantity: 2,
            rarity: 'rare'
          }
        ]
      });

      lottery.currentParticipants = 10;

      const randomSeed = 'a'.repeat(64);
      lottery.complete(randomSeed);

      expect(lottery.isCompleted).toBe(true);
      expect(lottery.randomSeed).toBe(randomSeed);
      expect(lottery.drawTime).toBeInstanceOf(Date);

      const prizeDistribution = lottery.getPrizeDistribution();
      expect(prizeDistribution.legendary).toBe(1);
      expect(prizeDistribution.rare).toBe(2);
    });
  });

  describe('Multi-language Support', () => {
    it('should handle localized content across models', () => {
      const merchant = Merchant.create({
        name: '測試餐廳',
        nameEn: 'Test Restaurant',
        nameZhCn: '测试餐厅',
        address: '香港中環測試街123號',
        addressEn: '123 Test Street, Central, Hong Kong',
        addressZhCn: '香港中环测试街123号',
        latitude: 22.2783,
        longitude: 114.1747,
        category: 'restaurant'
      });
      merchant.id = uuidv4();

      const coupon = CouponNFT.create({
        tokenId: BigInt(12345),
        merchantId: merchant.id,
        couponType: 'percentage',
        title: '八折優惠',
        titleEn: '20% Off Discount',
        titleZhCn: '八折优惠',
        discountValue: 20,
        discountType: 'percentage',
        maxQuantity: 100
      });

      const lottery = Lottery.create({
        name: '新年抽獎',
        nameEn: 'New Year Lottery',
        nameZhCn: '新年抽奖',
        entryFee: 10,
        totalPrizes: 5,
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      // Test Traditional Chinese (default)
      expect(merchant.getLocalizedName('zh-HK')).toBe('測試餐廳');
      expect(coupon.getLocalizedTitle('zh-HK')).toBe('八折優惠');
      expect(lottery.getLocalizedName('zh-HK')).toBe('新年抽獎');

      // Test English
      expect(merchant.getLocalizedName('en')).toBe('Test Restaurant');
      expect(coupon.getLocalizedTitle('en')).toBe('20% Off Discount');
      expect(lottery.getLocalizedName('en')).toBe('New Year Lottery');

      // Test Simplified Chinese
      expect(merchant.getLocalizedName('zh-CN')).toBe('测试餐厅');
      expect(coupon.getLocalizedTitle('zh-CN')).toBe('八折优惠');
      expect(lottery.getLocalizedName('zh-CN')).toBe('新年抽奖');
    });
  });

  describe('Data Consistency and Validation', () => {
    it('should maintain data consistency across related models', () => {
      const user = User.create({
        walletAddress: '0x742d35Cc6634C0532925a3b8D0C9964E5Bfe421e',
        email: 'user@example.com'
      });
      user.id = uuidv4();

      const merchant = Merchant.create({
        name: 'Test Restaurant',
        address: '123 Test Street, Central, Hong Kong',
        latitude: 22.2783,
        longitude: 114.1747,
        category: 'restaurant'
      });
      merchant.id = uuidv4();

      const coupon = CouponNFT.create({
        tokenId: BigInt(12345),
        merchantId: merchant.id,
        couponType: 'percentage',
        title: 'Test Coupon',
        discountValue: 20,
        discountType: 'percentage',
        maxQuantity: 100,
        currentOwnerId: user.id
      });

      // Test coupon usage
      const originalQuantity = coupon.remainingQuantity;
      coupon.use(user.id);

      expect(coupon.isUsed).toBe(true);
      expect(coupon.usedAt).toBeInstanceOf(Date);
      expect(coupon.remainingQuantity).toBe(originalQuantity - 1);
      expect(coupon.currentOwnerId).toBe(user.id);

      // Test that used coupon cannot be transferred
      const anotherUser = User.create({
        walletAddress: '0x8ba1f109551bD432803012645aac136c30C6756c',
        email: 'another@example.com'
      });
      anotherUser.id = uuidv4();

      expect(() => coupon.transfer(user.id, anotherUser.id))
        .toThrow('Used coupons cannot be transferred');
    });

    it('should validate cross-model references', () => {
      // Test that transaction references valid user and NFT IDs
      const validUserId = '123e4567-e89b-12d3-a456-426614174000';
      const validNftId = '456e7890-e89b-12d3-a456-426614174000';

      const transaction = Transaction.create({
        userId: validUserId,
        nftId: validNftId,
        transactionType: 'transfer',
        fromAddress: '0x742d35Cc6634C0532925a3b8D0C9964E5Bfe421e',
        toAddress: '0x8ba1f109551bD432803012645aac136c30C6756c'
      });

      expect(transaction.userId).toBe(validUserId);
      expect(transaction.nftId).toBe(validNftId);

      // Test validation fails with invalid UUIDs
      expect(() => Transaction.create({
        userId: 'invalid-uuid',
        transactionType: 'transfer'
      })).toThrow('Transaction validation failed');
    });
  });

  describe('Business Logic Integration', () => {
    it('should handle complete coupon lifecycle', () => {
      // Create merchant
      const merchant = Merchant.create({
        name: 'Test Restaurant',
        address: '123 Test Street, Central, Hong Kong',
        latitude: 22.2783,
        longitude: 114.1747,
        category: 'restaurant'
      });
      merchant.id = uuidv4();

      // Create user
      const user = User.create({
        walletAddress: '0x742d35Cc6634C0532925a3b8D0C9964E5Bfe421e',
        email: 'user@example.com'
      });
      user.id = uuidv4();

      // Create coupon
      const coupon = CouponNFT.create({
        tokenId: BigInt(12345),
        merchantId: merchant.id,
        couponType: 'percentage',
        title: 'Restaurant Discount',
        discountValue: 20,
        discountType: 'percentage',
        maxQuantity: 100,
        minimumPurchase: 50
      });

      // Test discount calculation
      expect(coupon.calculateDiscount(100)).toBe(20); // 20% of 100
      expect(coupon.calculateDiscount(30)).toBe(0); // Below minimum purchase

      // Assign to user
      coupon.currentOwnerId = user.id;

      // Use coupon
      coupon.use(user.id);
      expect(coupon.isUsed).toBe(true);
      expect(coupon.usedAt).toBeInstanceOf(Date);

      // Verify coupon cannot be used again
      expect(() => coupon.use(user.id)).toThrow('Coupon has already been used');
    });

    it('should handle lottery participation workflow', () => {
      // Create user
      const user = User.create({
        walletAddress: '0x742d35Cc6634C0532925a3b8D0C9964E5Bfe421e',
        email: 'user@example.com'
      });
      user.id = uuidv4();
      user.isActive = true;
      user.emailVerified = true;

      // Create lottery
      const lottery = Lottery.create({
        name: 'Test Lottery',
        entryFee: 10,
        totalPrizes: 5,
        maxParticipants: 100,
        startTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        endTime: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
      });
      lottery.id = uuidv4();

      // Check user can participate
      expect(user.canParticipateInLotteries()).toBe(true);

      // Check lottery can accept participants
      const canParticipate = lottery.canAcceptParticipants();
      expect(canParticipate.canParticipate).toBe(true);

      // Add participant
      lottery.addParticipant();
      expect(lottery.currentParticipants).toBe(1);

      // Create entry transaction
      const transaction = Transaction.create({
        userId: user.id,
        lotteryId: lottery.id,
        transactionType: 'lottery_entry',
        amount: lottery.entryFee,
        currency: lottery.currency
      });

      expect(transaction.isLotteryTransaction()).toBe(true);
      expect(transaction.amount).toBe(lottery.entryFee);
    });
  });
});
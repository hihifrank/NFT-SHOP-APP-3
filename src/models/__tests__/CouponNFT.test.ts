import { CouponNFT, CouponType, DiscountType, RarityType } from '../CouponNFT';

describe('CouponNFT Model', () => {
  const validCouponData = {
    tokenId: 12345,
    merchantId: '123e4567-e89b-12d3-a456-426614174000',
    couponType: 'percentage' as CouponType,
    title: '20% Off Discount',
    discountValue: 20,
    discountType: 'percentage' as DiscountType,
    maxQuantity: 100,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  };

  const validCouponDataWithBigInt = {
    ...validCouponData,
    tokenId: BigInt(12345)
  };

  describe('Constructor', () => {
    it('should create a coupon NFT with valid data', () => {
      const coupon = new CouponNFT(validCouponDataWithBigInt);
      
      expect(coupon.tokenId).toBe(validCouponDataWithBigInt.tokenId);
      expect(coupon.merchantId).toBe(validCouponDataWithBigInt.merchantId);
      expect(coupon.couponType).toBe(validCouponDataWithBigInt.couponType);
      expect(coupon.title).toBe(validCouponDataWithBigInt.title);
      expect(coupon.discountValue).toBe(validCouponDataWithBigInt.discountValue);
      expect(coupon.discountType).toBe(validCouponDataWithBigInt.discountType);
      expect(coupon.maxQuantity).toBe(validCouponDataWithBigInt.maxQuantity);
      expect(coupon.remainingQuantity).toBe(validCouponDataWithBigInt.maxQuantity);
      expect(coupon.isUsed).toBe(false);
      expect(coupon.isTransferable).toBe(true);
      expect(coupon.isActive).toBe(true);
      expect(coupon.rarity).toBe('common');
    });

    it('should set default values correctly', () => {
      const coupon = new CouponNFT(validCouponDataWithBigInt);
      
      expect(coupon.minimumPurchase).toBe(0);
      expect(coupon.remainingQuantity).toBe(validCouponDataWithBigInt.maxQuantity);
      expect(coupon.totalMinted).toBe(0);
      expect(coupon.rarity).toBe('common');
      expect(coupon.isUsed).toBe(false);
      expect(coupon.isTransferable).toBe(true);
      expect(coupon.isActive).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate correct coupon data', () => {
      const { error, value } = CouponNFT.validate(validCouponData);
      
      expect(error).toBeUndefined();
      expect(value).toBeDefined();
    });

    it('should accept BigInt token ID', () => {
      const dataWithBigInt = { ...validCouponData, tokenId: BigInt(12345) };
      const { error, value } = CouponNFT.validate(dataWithBigInt);
      
      expect(error).toBeUndefined();
      expect(value).toBeDefined();
    });

    it('should accept string token ID', () => {
      const dataWithString = { ...validCouponData, tokenId: '12345' };
      const { error, value } = CouponNFT.validate(dataWithString);
      
      expect(error).toBeUndefined();
      expect(value).toBeDefined();
    });

    it('should reject invalid token ID', () => {
      const invalidData = { ...validCouponData, tokenId: 'invalid' };
      const { error } = CouponNFT.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('positive integer');
    });

    it('should reject negative token ID', () => {
      const invalidData = { ...validCouponData, tokenId: -1 };
      const { error } = CouponNFT.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('positive integer');
    });

    it('should reject invalid merchant ID', () => {
      const invalidData = { ...validCouponData, tokenId: 12345, merchantId: 'invalid-uuid' };
      const { error } = CouponNFT.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details.some(d => d.message.includes('valid GUID'))).toBe(true);
    });

    it('should reject invalid coupon type', () => {
      const invalidData = { ...validCouponData, couponType: 'invalid-type' };
      const { error } = CouponNFT.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details.some(d => d.message.includes('percentage, fixed_amount, buy_one_get_one, free_item'))).toBe(true);
    });

    it('should reject title that is too short', () => {
      const invalidData = { ...validCouponData, title: 'AB' };
      const { error } = CouponNFT.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details.some(d => d.message.includes('at least 3 characters'))).toBe(true);
    });

    it('should reject negative discount value', () => {
      const invalidData = { ...validCouponData, discountValue: -10 };
      const { error } = CouponNFT.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details.some(d => d.message.includes('positive'))).toBe(true);
    });

    it('should reject invalid discount type', () => {
      const invalidData = { ...validCouponData, discountType: 'invalid-type' };
      const { error } = CouponNFT.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details.some(d => d.message.includes('percentage or fixed_amount'))).toBe(true);
    });

    it('should reject negative minimum purchase', () => {
      const invalidData = { ...validCouponData, minimumPurchase: -10 };
      const { error } = CouponNFT.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details.some(d => d.message.includes('cannot be negative'))).toBe(true);
    });

    it('should reject invalid max quantity', () => {
      const invalidData = { ...validCouponData, maxQuantity: 0 };
      const { error } = CouponNFT.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details.some(d => d.message.includes('positive'))).toBe(true);
    });

    it('should reject invalid rarity', () => {
      const invalidData = { ...validCouponData, rarity: 'invalid-rarity' };
      const { error } = CouponNFT.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details.some(d => d.message.includes('common, rare, epic, legendary'))).toBe(true);
    });

    it('should reject expiry date in the past', () => {
      const invalidData = { 
        ...validCouponData, 
        expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // yesterday
      };
      const { error } = CouponNFT.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details.some(d => d.message.includes('future'))).toBe(true);
    });
  });

  describe('Static Methods', () => {
    describe('create', () => {
      it('should create coupon with valid data', () => {
        const coupon = CouponNFT.create(validCouponDataWithBigInt);
        
        expect(coupon).toBeInstanceOf(CouponNFT);
        expect(coupon.tokenId).toBe(validCouponDataWithBigInt.tokenId);
      });

      it('should throw error with invalid data', () => {
        const invalidData = { ...validCouponDataWithBigInt, discountValue: -10 };
        
        expect(() => CouponNFT.create(invalidData)).toThrow('CouponNFT validation failed');
      });
    });

    describe('fromDatabaseRow', () => {
      it('should create coupon from database row', () => {
        const dbRow = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          token_id: '12345',
          merchant_id: '456e7890-e89b-12d3-a456-426614174000',
          current_owner_id: '789e0123-e89b-12d3-a456-426614174000',
          coupon_type: 'percentage',
          title: '20% Off Discount',
          discount_value: '20',
          discount_type: 'percentage',
          minimum_purchase: '0',
          max_quantity: '100',
          remaining_quantity: '95',
          total_minted: '5',
          rarity: 'common',
          expiry_date: '2024-12-31T23:59:59Z',
          is_used: false,
          is_transferable: true,
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        };

        const coupon = CouponNFT.fromDatabaseRow(dbRow);
        
        expect(coupon.id).toBe(dbRow.id);
        expect(coupon.tokenId).toBe(BigInt(12345));
        expect(coupon.merchantId).toBe(dbRow.merchant_id);
        expect(coupon.currentOwnerId).toBe(dbRow.current_owner_id);
        expect(coupon.discountValue).toBe(20);
        expect(coupon.maxQuantity).toBe(100);
        expect(coupon.remainingQuantity).toBe(95);
        expect(coupon.totalMinted).toBe(5);
      });
    });
  });

  describe('Instance Methods', () => {
    let coupon: CouponNFT;

    beforeEach(() => {
      coupon = new CouponNFT(validCouponDataWithBigInt);
    });

    describe('update', () => {
      it('should update coupon with valid data', () => {
        const updates = { title: 'Updated Discount', discountValue: 25 };
        
        coupon.update(updates);
        
        expect(coupon.title).toBe(updates.title);
        expect(coupon.discountValue).toBe(updates.discountValue);
      });

      it('should throw error with invalid update data', () => {
        const invalidUpdates = { discountValue: -10 };
        
        expect(() => coupon.update(invalidUpdates)).toThrow('CouponNFT update validation failed');
      });
    });

    describe('isValidForUse', () => {
      it('should return valid when coupon is usable', () => {
        const result = coupon.isValidForUse();
        
        expect(result.valid).toBe(true);
        expect(result.reason).toBeUndefined();
      });

      it('should return invalid when coupon is already used', () => {
        coupon.isUsed = true;
        
        const result = coupon.isValidForUse();
        
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('Coupon has already been used');
      });

      it('should return invalid when coupon is not active', () => {
        coupon.isActive = false;
        
        const result = coupon.isValidForUse();
        
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('Coupon is not active');
      });

      it('should return invalid when no remaining quantity', () => {
        coupon.remainingQuantity = 0;
        
        const result = coupon.isValidForUse();
        
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('No remaining quantity available');
      });

      it('should return invalid when coupon has expired', () => {
        coupon.expiryDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // yesterday
        
        const result = coupon.isValidForUse();
        
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('Coupon has expired');
      });
    });

    describe('canBeTransferred', () => {
      it('should return transferable when conditions are met', () => {
        const result = coupon.canBeTransferred();
        
        expect(result.transferable).toBe(true);
        expect(result.reason).toBeUndefined();
      });

      it('should return not transferable when coupon is used', () => {
        coupon.isUsed = true;
        
        const result = coupon.canBeTransferred();
        
        expect(result.transferable).toBe(false);
        expect(result.reason).toBe('Used coupons cannot be transferred');
      });

      it('should return not transferable when not transferable', () => {
        coupon.isTransferable = false;
        
        const result = coupon.canBeTransferred();
        
        expect(result.transferable).toBe(false);
        expect(result.reason).toBe('This coupon is not transferable');
      });

      it('should return not transferable when expired', () => {
        coupon.expiryDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // yesterday
        
        const result = coupon.canBeTransferred();
        
        expect(result.transferable).toBe(false);
        expect(result.reason).toBe('Expired coupons cannot be transferred');
      });
    });

    describe('use', () => {
      it('should use coupon successfully', () => {
        const userId = '789e0123-e89b-12d3-a456-426614174000';
        const originalQuantity = coupon.remainingQuantity;
        
        coupon.use(userId);
        
        expect(coupon.isUsed).toBe(true);
        expect(coupon.usedAt).toBeInstanceOf(Date);
        expect(coupon.currentOwnerId).toBe(userId);
        expect(coupon.remainingQuantity).toBe(originalQuantity - 1);
      });

      it('should throw error when coupon cannot be used', () => {
        coupon.isUsed = true;
        const userId = '789e0123-e89b-12d3-a456-426614174000';
        
        expect(() => coupon.use(userId)).toThrow('Coupon has already been used');
      });
    });

    describe('transfer', () => {
      it('should transfer coupon successfully', () => {
        const fromUserId = '789e0123-e89b-12d3-a456-426614174000';
        const toUserId = '012e3456-e89b-12d3-a456-426614174000';
        coupon.currentOwnerId = fromUserId;
        
        coupon.transfer(fromUserId, toUserId);
        
        expect(coupon.currentOwnerId).toBe(toUserId);
      });

      it('should throw error when not current owner', () => {
        const fromUserId = '789e0123-e89b-12d3-a456-426614174000';
        const toUserId = '012e3456-e89b-12d3-a456-426614174000';
        coupon.currentOwnerId = 'different-user';
        
        expect(() => coupon.transfer(fromUserId, toUserId))
          .toThrow('Only the current owner can transfer the coupon');
      });

      it('should throw error when coupon cannot be transferred', () => {
        const fromUserId = '789e0123-e89b-12d3-a456-426614174000';
        const toUserId = '012e3456-e89b-12d3-a456-426614174000';
        coupon.currentOwnerId = fromUserId;
        coupon.isUsed = true;
        
        expect(() => coupon.transfer(fromUserId, toUserId))
          .toThrow('Used coupons cannot be transferred');
      });
    });

    describe('calculateDiscount', () => {
      it('should calculate percentage discount correctly', () => {
        coupon.discountType = 'percentage';
        coupon.discountValue = 20;
        coupon.minimumPurchase = 100;
        
        expect(coupon.calculateDiscount(150)).toBe(30); // 20% of 150
        expect(coupon.calculateDiscount(50)).toBe(0); // Below minimum purchase
      });

      it('should calculate fixed amount discount correctly', () => {
        coupon.discountType = 'fixed_amount';
        coupon.discountValue = 50;
        coupon.minimumPurchase = 100;
        
        expect(coupon.calculateDiscount(150)).toBe(50);
        expect(coupon.calculateDiscount(30)).toBe(0); // Below minimum purchase
        expect(coupon.calculateDiscount(50)).toBe(0); // Below minimum purchase
      });

      it('should not exceed purchase amount for percentage discount', () => {
        coupon.discountType = 'percentage';
        coupon.discountValue = 150; // 150% discount
        coupon.minimumPurchase = 0;
        
        expect(coupon.calculateDiscount(100)).toBe(100); // Should not exceed purchase amount
      });

      it('should not exceed purchase amount for fixed discount', () => {
        coupon.discountType = 'fixed_amount';
        coupon.discountValue = 200; // $200 discount
        coupon.minimumPurchase = 0;
        
        expect(coupon.calculateDiscount(100)).toBe(100); // Should not exceed purchase amount
      });
    });

    describe('getRarityMultiplier', () => {
      it('should return correct multipliers for each rarity', () => {
        coupon.rarity = 'common';
        expect(coupon.getRarityMultiplier()).toBe(1);
        
        coupon.rarity = 'rare';
        expect(coupon.getRarityMultiplier()).toBe(2);
        
        coupon.rarity = 'epic';
        expect(coupon.getRarityMultiplier()).toBe(5);
        
        coupon.rarity = 'legendary';
        expect(coupon.getRarityMultiplier()).toBe(10);
      });
    });

    describe('getLocalizedTitle', () => {
      beforeEach(() => {
        coupon.titleEn = 'English Title';
        coupon.titleZhCn = 'Chinese Title';
      });

      it('should return English title for en language', () => {
        expect(coupon.getLocalizedTitle('en')).toBe('English Title');
      });

      it('should return Chinese title for zh-CN language', () => {
        expect(coupon.getLocalizedTitle('zh-CN')).toBe('Chinese Title');
      });

      it('should return default title for zh-HK language', () => {
        expect(coupon.getLocalizedTitle('zh-HK')).toBe(coupon.title);
      });

      it('should fallback to default title when localized title not available', () => {
        coupon.titleEn = undefined;
        expect(coupon.getLocalizedTitle('en')).toBe(coupon.title);
      });
    });

    describe('getDaysUntilExpiry', () => {
      it('should return null when no expiry date', () => {
        coupon.expiryDate = undefined;
        
        expect(coupon.getDaysUntilExpiry()).toBeNull();
      });

      it('should return correct days until expiry', () => {
        const daysFromNow = 10;
        coupon.expiryDate = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
        
        const result = coupon.getDaysUntilExpiry();
        expect(result).toBeGreaterThanOrEqual(daysFromNow - 1);
        expect(result).toBeLessThanOrEqual(daysFromNow + 1);
      });

      it('should return negative days for expired coupon', () => {
        coupon.expiryDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
        
        const result = coupon.getDaysUntilExpiry();
        expect(result).toBeLessThan(0);
      });
    });

    describe('toDatabaseRow', () => {
      it('should convert to database row format', () => {
        const dbRow = coupon.toDatabaseRow();
        
        expect(dbRow.token_id).toBe(coupon.tokenId.toString());
        expect(dbRow.merchant_id).toBe(coupon.merchantId);
        expect(dbRow.current_owner_id).toBe(coupon.currentOwnerId);
        expect(dbRow.coupon_type).toBe(coupon.couponType);
        expect(dbRow.discount_value).toBe(coupon.discountValue);
        expect(dbRow.discount_type).toBe(coupon.discountType);
        expect(dbRow.minimum_purchase).toBe(coupon.minimumPurchase);
        expect(dbRow.max_quantity).toBe(coupon.maxQuantity);
        expect(dbRow.remaining_quantity).toBe(coupon.remainingQuantity);
        expect(dbRow.is_used).toBe(coupon.isUsed);
        expect(dbRow.is_transferable).toBe(coupon.isTransferable);
        expect(dbRow.is_active).toBe(coupon.isActive);
      });
    });
  });
});
import { Merchant, BusinessHours } from '../Merchant';

describe('Merchant Model', () => {
  const validMerchantData = {
    name: 'Test Restaurant',
    address: '123 Test Street, Central, Hong Kong',
    latitude: 22.2783,
    longitude: 114.1747,
    category: 'restaurant' as const,
    phone: '+852 1234 5678',
    email: 'test@restaurant.com'
  };

  const businessHours: BusinessHours = {
    monday: { open: '09:00', close: '18:00', isClosed: false },
    tuesday: { open: '09:00', close: '18:00', isClosed: false },
    wednesday: { open: '09:00', close: '18:00', isClosed: false },
    thursday: { open: '09:00', close: '18:00', isClosed: false },
    friday: { open: '09:00', close: '18:00', isClosed: false },
    saturday: { open: '10:00', close: '16:00', isClosed: false },
    sunday: { open: '10:00', close: '16:00', isClosed: true }
  };

  describe('Constructor', () => {
    it('should create a merchant with valid data', () => {
      const merchant = new Merchant(validMerchantData);
      
      expect(merchant.name).toBe(validMerchantData.name);
      expect(merchant.address).toBe(validMerchantData.address);
      expect(merchant.latitude).toBe(validMerchantData.latitude);
      expect(merchant.longitude).toBe(validMerchantData.longitude);
      expect(merchant.category).toBe(validMerchantData.category);
      expect(merchant.phone).toBe(validMerchantData.phone);
      expect(merchant.email).toBe(validMerchantData.email);
      expect(merchant.isNftParticipant).toBe(false);
      expect(merchant.isVerified).toBe(false);
      expect(merchant.isActive).toBe(true);
      expect(merchant.rating).toBe(0);
      expect(merchant.totalReviews).toBe(0);
    });

    it('should set default values correctly', () => {
      const merchant = new Merchant(validMerchantData);
      
      expect(merchant.isNftParticipant).toBe(false);
      expect(merchant.isVerified).toBe(false);
      expect(merchant.isActive).toBe(true);
      expect(merchant.rating).toBe(0);
      expect(merchant.totalReviews).toBe(0);
      expect(merchant.createdAt).toBeInstanceOf(Date);
      expect(merchant.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Validation', () => {
    it('should validate correct merchant data', () => {
      const { error, value } = Merchant.validate(validMerchantData);
      
      expect(error).toBeUndefined();
      expect(value).toBeDefined();
      expect(value.name).toBe(validMerchantData.name);
    });

    it('should reject name that is too short', () => {
      const invalidData = { ...validMerchantData, name: 'A' };
      const { error } = Merchant.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('at least 2 characters');
    });

    it('should reject address that is too short', () => {
      const invalidData = { ...validMerchantData, address: 'Short' };
      const { error } = Merchant.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('at least 10 characters');
    });

    it('should reject invalid latitude', () => {
      const invalidData = { ...validMerchantData, latitude: 95 };
      const { error } = Merchant.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('between -90 and 90');
    });

    it('should reject invalid longitude', () => {
      const invalidData = { ...validMerchantData, longitude: 185 };
      const { error } = Merchant.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('between -180 and 180');
    });

    it('should reject invalid category', () => {
      const invalidData = { ...validMerchantData, category: 'invalid-category' };
      const { error } = Merchant.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('valid business category');
    });

    it('should reject invalid phone number', () => {
      const invalidData = { ...validMerchantData, phone: '123' };
      const { error } = Merchant.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('valid format');
    });

    it('should reject invalid email', () => {
      const invalidData = { ...validMerchantData, email: 'invalid-email' };
      const { error } = Merchant.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('valid email address');
    });

    it('should reject invalid website URL', () => {
      const invalidData = { ...validMerchantData, website: 'not-a-url' };
      const { error } = Merchant.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('valid URL');
    });

    it('should reject invalid rating', () => {
      const invalidData = { ...validMerchantData, rating: 6 };
      const { error } = Merchant.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('between 0 and 5');
    });
  });

  describe('Static Methods', () => {
    describe('create', () => {
      it('should create merchant with valid data', () => {
        const merchant = Merchant.create(validMerchantData);
        
        expect(merchant).toBeInstanceOf(Merchant);
        expect(merchant.name).toBe(validMerchantData.name);
      });

      it('should throw error with invalid data', () => {
        const invalidData = { ...validMerchantData, latitude: 95 };
        
        expect(() => Merchant.create(invalidData)).toThrow('Merchant validation failed');
      });
    });

    describe('fromDatabaseRow', () => {
      it('should create merchant from database row', () => {
        const dbRow = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          owner_id: '456e7890-e89b-12d3-a456-426614174000',
          name: 'Test Restaurant',
          name_en: 'Test Restaurant EN',
          name_zh_cn: 'Test Restaurant CN',
          description: 'A test restaurant',
          address: '123 Test Street, Central, Hong Kong',
          latitude: '22.2783',
          longitude: '114.1747',
          category: 'restaurant',
          phone: '+852 1234 5678',
          email: 'test@restaurant.com',
          is_nft_participant: true,
          is_verified: true,
          is_active: true,
          rating: '4.5',
          total_reviews: '10',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        };

        const merchant = Merchant.fromDatabaseRow(dbRow);
        
        expect(merchant.id).toBe(dbRow.id);
        expect(merchant.ownerId).toBe(dbRow.owner_id);
        expect(merchant.name).toBe(dbRow.name);
        expect(merchant.nameEn).toBe(dbRow.name_en);
        expect(merchant.nameZhCn).toBe(dbRow.name_zh_cn);
        expect(merchant.latitude).toBe(22.2783);
        expect(merchant.longitude).toBe(114.1747);
        expect(merchant.isNftParticipant).toBe(true);
        expect(merchant.rating).toBe(4.5);
        expect(merchant.totalReviews).toBe(10);
      });
    });
  });

  describe('Instance Methods', () => {
    let merchant: Merchant;

    beforeEach(() => {
      merchant = new Merchant(validMerchantData);
    });

    describe('update', () => {
      it('should update merchant with valid data', () => {
        const updates = { name: 'Updated Restaurant', rating: 4.5 };
        const originalUpdatedAt = merchant.updatedAt;
        
        merchant.update(updates);
        
        expect(merchant.name).toBe(updates.name);
        expect(merchant.rating).toBe(updates.rating);
        expect(merchant.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      });

      it('should throw error with invalid update data', () => {
        const invalidUpdates = { latitude: 95 };
        
        expect(() => merchant.update(invalidUpdates)).toThrow('Merchant update validation failed');
      });
    });

    describe('distanceFrom', () => {
      it('should calculate distance correctly', () => {
        // Distance from Central to Tsim Sha Tsui (approximately 2.5km)
        const distance = merchant.distanceFrom(22.2944, 114.1722);
        
        expect(distance).toBeGreaterThan(1);
        expect(distance).toBeLessThan(5);
      });

      it('should return 0 for same location', () => {
        const distance = merchant.distanceFrom(merchant.latitude, merchant.longitude);
        
        expect(distance).toBeCloseTo(0, 2);
      });
    });

    describe('isCurrentlyOpen', () => {
      beforeEach(() => {
        merchant.businessHours = businessHours;
      });

      it('should return true when no business hours specified', () => {
        merchant.businessHours = undefined;
        
        expect(merchant.isCurrentlyOpen()).toBe(true);
      });

      it('should return false when closed on current day', () => {
        // Mock Sunday (day 0)
        jest.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('Sunday');
        jest.spyOn(Date.prototype, 'toTimeString').mockReturnValue('12:00:00 GMT+0800');
        
        expect(merchant.isCurrentlyOpen()).toBe(false);
      });

      it('should return true when open during business hours', () => {
        // Mock Monday at 12:00
        jest.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('Monday');
        jest.spyOn(Date.prototype, 'toTimeString').mockReturnValue('12:00:00 GMT+0800');
        
        expect(merchant.isCurrentlyOpen()).toBe(true);
      });

      it('should return false when outside business hours', () => {
        // Mock Monday at 20:00 (8 PM)
        jest.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('Monday');
        jest.spyOn(Date.prototype, 'toTimeString').mockReturnValue('20:00:00 GMT+0800');
        
        expect(merchant.isCurrentlyOpen()).toBe(false);
      });
    });

    describe('getLocalizedName', () => {
      beforeEach(() => {
        merchant.nameEn = 'Test Restaurant EN';
        merchant.nameZhCn = 'Test Restaurant CN';
      });

      it('should return English name for en language', () => {
        expect(merchant.getLocalizedName('en')).toBe('Test Restaurant EN');
      });

      it('should return Chinese name for zh-CN language', () => {
        expect(merchant.getLocalizedName('zh-CN')).toBe('Test Restaurant CN');
      });

      it('should return default name for zh-HK language', () => {
        expect(merchant.getLocalizedName('zh-HK')).toBe(merchant.name);
      });

      it('should fallback to default name when localized name not available', () => {
        merchant.nameEn = undefined;
        expect(merchant.getLocalizedName('en')).toBe(merchant.name);
      });
    });

    describe('hasCompleteProfile', () => {
      it('should return true when profile is complete', () => {
        merchant.name = 'Test Restaurant';
        merchant.description = 'A great restaurant';
        merchant.address = '123 Test Street';
        merchant.phone = '+852 1234 5678';
        merchant.email = 'test@restaurant.com';
        merchant.logoUrl = 'https://example.com/logo.jpg';
        
        expect(merchant.hasCompleteProfile()).toBe(true);
      });

      it('should return false when profile is incomplete', () => {
        merchant.description = undefined;
        
        expect(merchant.hasCompleteProfile()).toBe(false);
      });
    });

    describe('updateRating', () => {
      it('should update rating correctly for first review', () => {
        merchant.rating = 0;
        merchant.totalReviews = 0;
        
        merchant.updateRating(4);
        
        expect(merchant.rating).toBe(4);
        expect(merchant.totalReviews).toBe(1);
        expect(merchant.updatedAt).toBeInstanceOf(Date);
      });

      it('should calculate average rating correctly', () => {
        merchant.rating = 4;
        merchant.totalReviews = 2;
        
        merchant.updateRating(5);
        
        expect(merchant.rating).toBe(4.33); // (4*2 + 5) / 3 = 4.33
        expect(merchant.totalReviews).toBe(3);
      });

      it('should throw error for invalid rating', () => {
        expect(() => merchant.updateRating(0)).toThrow('Rating must be between 1 and 5');
        expect(() => merchant.updateRating(6)).toThrow('Rating must be between 1 and 5');
      });

      it('should handle decimal ratings correctly', () => {
        merchant.rating = 3.5;
        merchant.totalReviews = 4;
        
        merchant.updateRating(2.5);
        
        // (3.5*4 + 2.5) / 5 = 16.5 / 5 = 3.3
        expect(merchant.rating).toBe(3.3);
        expect(merchant.totalReviews).toBe(5);
      });
    });

    describe('toDatabaseRow', () => {
      it('should convert to database row format', () => {
        const dbRow = merchant.toDatabaseRow();
        
        expect(dbRow.owner_id).toBe(merchant.ownerId);
        expect(dbRow.name_en).toBe(merchant.nameEn);
        expect(dbRow.name_zh_cn).toBe(merchant.nameZhCn);
        expect(dbRow.is_nft_participant).toBe(merchant.isNftParticipant);
        expect(dbRow.is_verified).toBe(merchant.isVerified);
        expect(dbRow.is_active).toBe(merchant.isActive);
        expect(dbRow.total_reviews).toBe(merchant.totalReviews);
        expect(dbRow.logo_url).toBe(merchant.logoUrl);
        expect(dbRow.cover_image_url).toBe(merchant.coverImageUrl);
      });
    });
  });
});
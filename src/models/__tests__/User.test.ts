import { User } from '../User';

describe('User Model', () => {
  const validUserData = {
    walletAddress: '0x742d35Cc6634C0532925a3b8D0C9964E5Bfe421e',
    email: 'test@example.com',
    username: 'testuser',
    preferredLanguage: 'zh-HK' as const
  };

  describe('Constructor', () => {
    it('should create a user with valid data', () => {
      const user = new User(validUserData);
      
      expect(user.walletAddress).toBe(validUserData.walletAddress);
      expect(user.email).toBe(validUserData.email);
      expect(user.username).toBe(validUserData.username);
      expect(user.preferredLanguage).toBe(validUserData.preferredLanguage);
      expect(user.isActive).toBe(true);
      expect(user.emailVerified).toBe(false);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should set default values correctly', () => {
      const minimalData = { walletAddress: validUserData.walletAddress };
      const user = new User(minimalData);
      
      expect(user.preferredLanguage).toBe('zh-HK');
      expect(user.isActive).toBe(true);
      expect(user.emailVerified).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should validate correct user data', () => {
      const { error, value } = User.validate(validUserData);
      
      expect(error).toBeUndefined();
      expect(value).toBeDefined();
      expect(value.walletAddress).toBe(validUserData.walletAddress);
    });

    it('should reject invalid wallet address', () => {
      const invalidData = { ...validUserData, walletAddress: 'invalid-address' };
      const { error } = User.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('valid Ethereum address');
    });

    it('should reject invalid email format', () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };
      const { error } = User.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('valid email address');
    });

    it('should reject username that is too short', () => {
      const invalidData = { ...validUserData, username: 'ab' };
      const { error } = User.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('at least 3 characters');
    });

    it('should reject username with invalid characters', () => {
      const invalidData = { ...validUserData, username: 'test@user' };
      const { error } = User.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('letters, numbers, underscores, and hyphens');
    });

    it('should reject invalid preferred language', () => {
      const invalidData = { ...validUserData, preferredLanguage: 'fr' };
      const { error } = User.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('zh-HK, zh-CN, en');
    });

    it('should reject invalid profile image URL', () => {
      const invalidData = { ...validUserData, profileImageUrl: 'not-a-url' };
      const { error } = User.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('valid URL');
    });
  });

  describe('Static Methods', () => {
    describe('create', () => {
      it('should create user with valid data', () => {
        const user = User.create(validUserData);
        
        expect(user).toBeInstanceOf(User);
        expect(user.walletAddress).toBe(validUserData.walletAddress);
      });

      it('should throw error with invalid data', () => {
        const invalidData = { ...validUserData, walletAddress: 'invalid' };
        
        expect(() => User.create(invalidData)).toThrow('User validation failed');
      });
    });

    describe('isValidWalletAddress', () => {
      it('should return true for valid wallet address', () => {
        expect(User.isValidWalletAddress('0x742d35Cc6634C0532925a3b8D0C9964E5Bfe421e')).toBe(true);
      });

      it('should return false for invalid wallet address', () => {
        expect(User.isValidWalletAddress('invalid-address')).toBe(false);
        expect(User.isValidWalletAddress('0x742d35Cc6634C0532925a3b8D0C9964E5Bfe421')).toBe(false); // too short
        expect(User.isValidWalletAddress('742d35Cc6634C0532925a3b8D0C9964E5Bfe421e')).toBe(false); // missing 0x
      });
    });

    describe('fromDatabaseRow', () => {
      it('should create user from database row', () => {
        const dbRow = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          wallet_address: '0x742d35Cc6634C0532925a3b8D0C9964E5Bfe421e',
          email: 'test@example.com',
          username: 'testuser',
          preferred_language: 'zh-HK',
          profile_image_url: 'https://example.com/image.jpg',
          is_active: true,
          email_verified: false,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        };

        const user = User.fromDatabaseRow(dbRow);
        
        expect(user.id).toBe(dbRow.id);
        expect(user.walletAddress).toBe(dbRow.wallet_address);
        expect(user.email).toBe(dbRow.email);
        expect(user.username).toBe(dbRow.username);
        expect(user.preferredLanguage).toBe(dbRow.preferred_language);
        expect(user.profileImageUrl).toBe(dbRow.profile_image_url);
        expect(user.isActive).toBe(dbRow.is_active);
        expect(user.emailVerified).toBe(dbRow.email_verified);
      });
    });
  });

  describe('Instance Methods', () => {
    let user: User;

    beforeEach(() => {
      user = new User(validUserData);
    });

    describe('update', () => {
      it('should update user with valid data', () => {
        const updates = { email: 'newemail@example.com', username: 'newusername' };
        const originalUpdatedAt = user.updatedAt;
        
        user.update(updates);
        
        expect(user.email).toBe(updates.email);
        expect(user.username).toBe(updates.username);
        expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      });

      it('should throw error with invalid update data', () => {
        const invalidUpdates = { email: 'invalid-email' };
        
        expect(() => user.update(invalidUpdates)).toThrow('User update validation failed');
      });

      it('should update individual fields correctly', () => {
        user.update({ isActive: false });
        expect(user.isActive).toBe(false);
        
        user.update({ emailVerified: true });
        expect(user.emailVerified).toBe(true);
        
        user.update({ preferredLanguage: 'en' });
        expect(user.preferredLanguage).toBe('en');
      });
    });

    describe('hasCompleteProfile', () => {
      it('should return true when profile is complete', () => {
        user.email = 'test@example.com';
        user.username = 'testuser';
        user.profileImageUrl = 'https://example.com/image.jpg';
        
        expect(user.hasCompleteProfile()).toBe(true);
      });

      it('should return false when profile is incomplete', () => {
        user.email = undefined;
        
        expect(user.hasCompleteProfile()).toBe(false);
      });
    });

    describe('canParticipateInLotteries', () => {
      it('should return true when user is active and email verified', () => {
        user.isActive = true;
        user.emailVerified = true;
        
        expect(user.canParticipateInLotteries()).toBe(true);
      });

      it('should return false when user is not active', () => {
        user.isActive = false;
        user.emailVerified = true;
        
        expect(user.canParticipateInLotteries()).toBe(false);
      });

      it('should return false when email is not verified', () => {
        user.isActive = true;
        user.emailVerified = false;
        
        expect(user.canParticipateInLotteries()).toBe(false);
      });
    });

    describe('getDisplayName', () => {
      it('should return username when available', () => {
        user.username = 'testuser';
        
        expect(user.getDisplayName()).toBe('testuser');
      });

      it('should return email when username not available', () => {
        user.username = undefined;
        user.email = 'test@example.com';
        
        expect(user.getDisplayName()).toBe('test@example.com');
      });

      it('should return truncated wallet address when neither username nor email available', () => {
        user.username = undefined;
        user.email = undefined;
        
        const displayName = user.getDisplayName();
        expect(displayName).toMatch(/^0x742d.*421e$/);
      });
    });

    describe('toPublicJSON', () => {
      it('should return only public fields', () => {
        const publicData = user.toPublicJSON();
        
        expect(publicData).toHaveProperty('id');
        expect(publicData).toHaveProperty('username');
        expect(publicData).toHaveProperty('preferredLanguage');
        expect(publicData).toHaveProperty('profileImageUrl');
        expect(publicData).toHaveProperty('createdAt');
        expect(publicData).not.toHaveProperty('walletAddress');
        expect(publicData).not.toHaveProperty('email');
        expect(publicData).not.toHaveProperty('emailVerified');
      });
    });

    describe('toDatabaseRow', () => {
      it('should convert to database row format', () => {
        const dbRow = user.toDatabaseRow();
        
        expect(dbRow.wallet_address).toBe(user.walletAddress);
        expect(dbRow.preferred_language).toBe(user.preferredLanguage);
        expect(dbRow.profile_image_url).toBe(user.profileImageUrl);
        expect(dbRow.is_active).toBe(user.isActive);
        expect(dbRow.email_verified).toBe(user.emailVerified);
        expect(dbRow.created_at).toBe(user.createdAt);
        expect(dbRow.updated_at).toBe(user.updatedAt);
      });
    });
  });
});
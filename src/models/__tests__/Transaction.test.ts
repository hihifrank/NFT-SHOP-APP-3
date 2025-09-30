import { Transaction, TransactionType, TransactionStatus } from '../Transaction';

describe('Transaction Model', () => {
  const validTransactionData = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    transactionType: 'mint' as TransactionType,
    nftId: '456e7890-e89b-12d3-a456-426614174000',
    amount: 100,
    currency: 'HKD',
    fromAddress: '0x742d35Cc6634C0532925a3b8D0C9964E5Bfe421e',
    toAddress: '0x8ba1f109551bD432803012645aac136c30C6756c'
  };

  describe('Constructor', () => {
    it('should create a transaction with valid data', () => {
      const transaction = new Transaction(validTransactionData);
      
      expect(transaction.userId).toBe(validTransactionData.userId);
      expect(transaction.transactionType).toBe(validTransactionData.transactionType);
      expect(transaction.nftId).toBe(validTransactionData.nftId);
      expect(transaction.amount).toBe(validTransactionData.amount);
      expect(transaction.currency).toBe(validTransactionData.currency);
      expect(transaction.fromAddress).toBe(validTransactionData.fromAddress);
      expect(transaction.toAddress).toBe(validTransactionData.toAddress);
      expect(transaction.status).toBe('pending');
      expect(transaction.createdAt).toBeInstanceOf(Date);
    });

    it('should set default values correctly', () => {
      const minimalData = {
        userId: validTransactionData.userId,
        transactionType: validTransactionData.transactionType
      };
      const transaction = new Transaction(minimalData);
      
      expect(transaction.currency).toBe('HKD');
      expect(transaction.status).toBe('pending');
      expect(transaction.createdAt).toBeInstanceOf(Date);
      expect(transaction.confirmedAt).toBeUndefined();
    });
  });

  describe('Validation', () => {
    it('should validate correct transaction data', () => {
      const { error, value } = Transaction.validate(validTransactionData);
      
      expect(error).toBeUndefined();
      expect(value).toBeDefined();
    });

    it('should reject invalid user ID', () => {
      const invalidData = { ...validTransactionData, userId: 'invalid-uuid' };
      const { error } = Transaction.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('valid GUID');
    });

    it('should reject invalid NFT ID', () => {
      const invalidData = { ...validTransactionData, nftId: 'invalid-uuid' };
      const { error } = Transaction.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('valid GUID');
    });

    it('should reject invalid transaction type', () => {
      const invalidData = { ...validTransactionData, transactionType: 'invalid-type' };
      const { error } = Transaction.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('mint, transfer, use, recycle, purchase, lottery_entry, lottery_win');
    });

    it('should reject invalid transaction hash', () => {
      const invalidData = { ...validTransactionData, transactionHash: 'invalid-hash' };
      const { error } = Transaction.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('valid Ethereum transaction hash');
    });

    it('should reject invalid block number', () => {
      const invalidData = { ...validTransactionData, blockNumber: -1 };
      const { error } = Transaction.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('positive');
    });

    it('should accept string block number', () => {
      const validData = { ...validTransactionData, blockNumber: '12345678' };
      const { error } = Transaction.validate(validData);
      
      expect(error).toBeUndefined();
    });

    it('should accept string gas values', () => {
      const validData = { 
        ...validTransactionData, 
        gasUsed: '21000',
        gasPrice: '20000000000'
      };
      const { error } = Transaction.validate(validData);
      
      expect(error).toBeUndefined();
    });

    it('should reject negative transaction fee', () => {
      const invalidData = { ...validTransactionData, transactionFee: -10 };
      const { error } = Transaction.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('cannot be negative');
    });

    it('should reject negative amount', () => {
      const invalidData = { ...validTransactionData, amount: -50 };
      const { error } = Transaction.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('cannot be negative');
    });

    it('should reject invalid currency', () => {
      const invalidData = { ...validTransactionData, currency: 'INVALID' };
      const { error } = Transaction.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('HKD, USD, CNY, ETH, MATIC');
    });

    it('should reject invalid status', () => {
      const invalidData = { ...validTransactionData, status: 'invalid-status' };
      const { error } = Transaction.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('pending, confirmed, failed, cancelled');
    });

    it('should reject invalid from address', () => {
      const invalidData = { ...validTransactionData, fromAddress: 'invalid-address' };
      const { error } = Transaction.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('valid Ethereum address');
    });

    it('should reject invalid to address', () => {
      const invalidData = { ...validTransactionData, toAddress: 'invalid-address' };
      const { error } = Transaction.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('valid Ethereum address');
    });
  });

  describe('Static Methods', () => {
    describe('create', () => {
      it('should create transaction with valid data', () => {
        const transaction = Transaction.create(validTransactionData);
        
        expect(transaction).toBeInstanceOf(Transaction);
        expect(transaction.userId).toBe(validTransactionData.userId);
      });

      it('should throw error with invalid data', () => {
        const invalidData = { ...validTransactionData, userId: 'invalid-uuid' };
        
        expect(() => Transaction.create(invalidData)).toThrow('Transaction validation failed');
      });
    });

    describe('fromDatabaseRow', () => {
      it('should create transaction from database row', () => {
        const dbRow = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          user_id: '456e7890-e89b-12d3-a456-426614174000',
          nft_id: '789e0123-e89b-12d3-a456-426614174000',
          lottery_id: '012e3456-e89b-12d3-a456-426614174000',
          merchant_id: '345e6789-e89b-12d3-a456-426614174000',
          transaction_type: 'mint',
          transaction_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          block_number: '12345678',
          gas_used: '21000',
          gas_price: '20000000000',
          transaction_fee: '10.50',
          amount: '100.00',
          currency: 'HKD',
          status: 'confirmed',
          from_address: '0x742d35Cc6634C0532925a3b8D0C9964E5Bfe421e',
          to_address: '0x8ba1f109551bD432803012645aac136c30C6756c',
          metadata: { key: 'value' },
          error_message: null,
          created_at: '2023-01-01T00:00:00Z',
          confirmed_at: '2023-01-01T00:05:00Z'
        };

        const transaction = Transaction.fromDatabaseRow(dbRow);
        
        expect(transaction.id).toBe(dbRow.id);
        expect(transaction.userId).toBe(dbRow.user_id);
        expect(transaction.nftId).toBe(dbRow.nft_id);
        expect(transaction.lotteryId).toBe(dbRow.lottery_id);
        expect(transaction.merchantId).toBe(dbRow.merchant_id);
        expect(transaction.transactionType).toBe(dbRow.transaction_type);
        expect(transaction.transactionHash).toBe(dbRow.transaction_hash);
        expect(transaction.blockNumber).toBe(BigInt(12345678));
        expect(transaction.gasUsed).toBe(BigInt(21000));
        expect(transaction.gasPrice).toBe(BigInt(20000000000));
        expect(transaction.transactionFee).toBe(10.50);
        expect(transaction.amount).toBe(100.00);
        expect(transaction.status).toBe('confirmed');
        expect(transaction.metadata).toEqual({ key: 'value' });
      });
    });
  });

  describe('Instance Methods', () => {
    let transaction: Transaction;

    beforeEach(() => {
      transaction = new Transaction(validTransactionData);
    });

    describe('update', () => {
      it('should update transaction with valid data', () => {
        const updates = { 
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          status: 'confirmed' as TransactionStatus
        };
        
        transaction.update(updates);
        
        expect(transaction.transactionHash).toBe(updates.transactionHash);
        expect(transaction.status).toBe(updates.status);
      });

      it('should throw error with invalid update data', () => {
        const invalidUpdates = { amount: -50 };
        
        expect(() => transaction.update(invalidUpdates)).toThrow('Transaction update validation failed');
      });
    });

    describe('confirm', () => {
      it('should confirm transaction successfully', () => {
        const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        const blockNumber = BigInt(12345678);
        
        transaction.confirm(txHash, blockNumber);
        
        expect(transaction.status).toBe('confirmed');
        expect(transaction.confirmedAt).toBeInstanceOf(Date);
        expect(transaction.transactionHash).toBe(txHash);
        expect(transaction.blockNumber).toBe(blockNumber);
      });

      it('should not update already confirmed transaction', () => {
        transaction.status = 'confirmed';
        transaction.confirmedAt = new Date();
        const originalConfirmedAt = transaction.confirmedAt;
        
        transaction.confirm();
        
        expect(transaction.confirmedAt).toBe(originalConfirmedAt);
      });
    });

    describe('fail', () => {
      it('should mark transaction as failed', () => {
        const errorMessage = 'Transaction failed due to insufficient gas';
        
        transaction.fail(errorMessage);
        
        expect(transaction.status).toBe('failed');
        expect(transaction.errorMessage).toBe(errorMessage);
      });

      it('should throw error when trying to fail confirmed transaction', () => {
        transaction.status = 'confirmed';
        
        expect(() => transaction.fail('Some error')).toThrow('Cannot mark confirmed transaction as failed');
      });
    });

    describe('cancel', () => {
      it('should cancel transaction successfully', () => {
        const reason = 'User cancelled transaction';
        
        transaction.cancel(reason);
        
        expect(transaction.status).toBe('cancelled');
        expect(transaction.errorMessage).toBe(reason);
      });

      it('should throw error when trying to cancel confirmed transaction', () => {
        transaction.status = 'confirmed';
        
        expect(() => transaction.cancel('User cancelled')).toThrow('Cannot cancel confirmed transaction');
      });
    });

    describe('Status Check Methods', () => {
      it('should correctly identify pending status', () => {
        transaction.status = 'pending';
        
        expect(transaction.isPending()).toBe(true);
        expect(transaction.isConfirmed()).toBe(false);
        expect(transaction.isFailed()).toBe(false);
        expect(transaction.isCancelled()).toBe(false);
      });

      it('should correctly identify confirmed status', () => {
        transaction.status = 'confirmed';
        
        expect(transaction.isPending()).toBe(false);
        expect(transaction.isConfirmed()).toBe(true);
        expect(transaction.isFailed()).toBe(false);
        expect(transaction.isCancelled()).toBe(false);
      });

      it('should correctly identify failed status', () => {
        transaction.status = 'failed';
        
        expect(transaction.isPending()).toBe(false);
        expect(transaction.isConfirmed()).toBe(false);
        expect(transaction.isFailed()).toBe(true);
        expect(transaction.isCancelled()).toBe(false);
      });

      it('should correctly identify cancelled status', () => {
        transaction.status = 'cancelled';
        
        expect(transaction.isPending()).toBe(false);
        expect(transaction.isConfirmed()).toBe(false);
        expect(transaction.isFailed()).toBe(false);
        expect(transaction.isCancelled()).toBe(true);
      });
    });

    describe('getAge', () => {
      it('should return correct age in milliseconds', () => {
        const pastDate = new Date(Date.now() - 60000); // 1 minute ago
        transaction.createdAt = pastDate;
        
        const age = transaction.getAge();
        
        expect(age).toBeGreaterThanOrEqual(59000); // Allow for small timing differences
        expect(age).toBeLessThanOrEqual(61000);
      });
    });

    describe('getConfirmationTime', () => {
      it('should return null when not confirmed', () => {
        expect(transaction.getConfirmationTime()).toBeNull();
      });

      it('should return correct confirmation time', () => {
        const createdAt = new Date(Date.now() - 60000); // 1 minute ago
        const confirmedAt = new Date(); // now
        transaction.createdAt = createdAt;
        transaction.confirmedAt = confirmedAt;
        
        const confirmationTime = transaction.getConfirmationTime();
        
        expect(confirmationTime).toBeGreaterThanOrEqual(59000);
        expect(confirmationTime).toBeLessThanOrEqual(61000);
      });
    });

    describe('getTotalCost', () => {
      it('should calculate total cost including fees', () => {
        transaction.amount = 100;
        transaction.transactionFee = 5;
        
        expect(transaction.getTotalCost()).toBe(105);
      });

      it('should handle undefined values', () => {
        transaction.amount = undefined;
        transaction.transactionFee = undefined;
        
        expect(transaction.getTotalCost()).toBe(0);
      });

      it('should handle partial undefined values', () => {
        transaction.amount = 100;
        transaction.transactionFee = undefined;
        
        expect(transaction.getTotalCost()).toBe(100);
        
        transaction.amount = undefined;
        transaction.transactionFee = 10;
        
        expect(transaction.getTotalCost()).toBe(10);
      });
    });

    describe('isNFTTransaction', () => {
      it('should return true for NFT transaction types', () => {
        const nftTypes: TransactionType[] = ['mint', 'transfer', 'use', 'recycle'];
        
        nftTypes.forEach(type => {
          transaction.transactionType = type;
          expect(transaction.isNFTTransaction()).toBe(true);
        });
      });

      it('should return false for non-NFT transaction types', () => {
        const nonNftTypes: TransactionType[] = ['purchase', 'lottery_entry', 'lottery_win'];
        
        nonNftTypes.forEach(type => {
          transaction.transactionType = type;
          expect(transaction.isNFTTransaction()).toBe(false);
        });
      });
    });

    describe('isLotteryTransaction', () => {
      it('should return true for lottery transaction types', () => {
        const lotteryTypes: TransactionType[] = ['lottery_entry', 'lottery_win'];
        
        lotteryTypes.forEach(type => {
          transaction.transactionType = type;
          expect(transaction.isLotteryTransaction()).toBe(true);
        });
      });

      it('should return false for non-lottery transaction types', () => {
        const nonLotteryTypes: TransactionType[] = ['mint', 'transfer', 'use', 'recycle', 'purchase'];
        
        nonLotteryTypes.forEach(type => {
          transaction.transactionType = type;
          expect(transaction.isLotteryTransaction()).toBe(false);
        });
      });
    });

    describe('getDescription', () => {
      it('should return correct descriptions for different languages', () => {
        transaction.transactionType = 'mint';
        
        expect(transaction.getDescription('zh-HK')).toBe('鑄造NFT優惠券');
        expect(transaction.getDescription('zh-CN')).toBe('铸造NFT优惠券');
        expect(transaction.getDescription('en')).toBe('Mint NFT Coupon');
      });

      it('should return transaction type for unknown types', () => {
        // Force an unknown type for testing
        (transaction as any).transactionType = 'unknown';
        
        expect(transaction.getDescription()).toBe('unknown');
      });
    });

    describe('Metadata Methods', () => {
      describe('addMetadata', () => {
        it('should add metadata correctly', () => {
          transaction.addMetadata('key1', 'value1');
          transaction.addMetadata('key2', { nested: 'object' });
          
          expect(transaction.metadata).toEqual({
            key1: 'value1',
            key2: { nested: 'object' }
          });
        });

        it('should initialize metadata if undefined', () => {
          transaction.metadata = undefined;
          
          transaction.addMetadata('key', 'value');
          
          expect(transaction.metadata).toEqual({ key: 'value' });
        });
      });

      describe('getMetadata', () => {
        it('should return metadata value', () => {
          transaction.metadata = { key1: 'value1', key2: 'value2' };
          
          expect(transaction.getMetadata('key1')).toBe('value1');
          expect(transaction.getMetadata('key2')).toBe('value2');
          expect(transaction.getMetadata('nonexistent')).toBeUndefined();
        });

        it('should return undefined when metadata is undefined', () => {
          transaction.metadata = undefined;
          
          expect(transaction.getMetadata('key')).toBeUndefined();
        });
      });
    });

    describe('toDatabaseRow', () => {
      it('should convert to database row format', () => {
        transaction.blockNumber = BigInt(12345678);
        transaction.gasUsed = BigInt(21000);
        transaction.gasPrice = BigInt(20000000000);
        transaction.metadata = { key: 'value' };
        
        const dbRow = transaction.toDatabaseRow();
        
        expect(dbRow.user_id).toBe(transaction.userId);
        expect(dbRow.nft_id).toBe(transaction.nftId);
        expect(dbRow.transaction_type).toBe(transaction.transactionType);
        expect(dbRow.block_number).toBe('12345678');
        expect(dbRow.gas_used).toBe('21000');
        expect(dbRow.gas_price).toBe('20000000000');
        expect(dbRow.transaction_fee).toBe(transaction.transactionFee);
        expect(dbRow.from_address).toBe(transaction.fromAddress);
        expect(dbRow.to_address).toBe(transaction.toAddress);
        expect(dbRow.metadata).toBe('{"key":"value"}');
        expect(dbRow.error_message).toBe(transaction.errorMessage);
        expect(dbRow.created_at).toBe(transaction.createdAt);
        expect(dbRow.confirmed_at).toBe(transaction.confirmedAt);
      });

      it('should handle undefined metadata', () => {
        transaction.metadata = undefined;
        
        const dbRow = transaction.toDatabaseRow();
        
        expect(dbRow.metadata).toBeNull();
      });
    });
  });
});
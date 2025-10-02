-- Migration: Create transactions table
-- Description: Table for storing blockchain transaction records

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    nft_id UUID,
    lottery_id UUID,
    merchant_id UUID,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('mint', 'transfer', 'use', 'recycle', 'purchase', 'lottery_entry', 'lottery_win')),
    transaction_hash VARCHAR(66), -- Ethereum transaction hash (0x + 64 hex chars)
    block_number BIGINT,
    gas_used BIGINT,
    gas_price BIGINT,
    transaction_fee DECIMAL(18,8), -- Support for high precision crypto amounts
    amount DECIMAL(18,8),
    currency VARCHAR(10) DEFAULT 'HKD' CHECK (currency IN ('HKD', 'USD', 'CNY', 'ETH', 'MATIC')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
    from_address VARCHAR(42), -- Ethereum address (0x + 40 hex chars)
    to_address VARCHAR(42),
    metadata JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_nft_id ON transactions(nft_id);
CREATE INDEX IF NOT EXISTS idx_transactions_lottery_id ON transactions(lottery_id);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_confirmed_at ON transactions(confirmed_at);
CREATE INDEX IF NOT EXISTS idx_transactions_block_number ON transactions(block_number);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_status ON transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_nft_type ON transactions(nft_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status_created ON transactions(status, created_at);

-- Create partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_transactions_pending ON transactions(created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_transactions_confirmed ON transactions(confirmed_at) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_transactions_failed ON transactions(created_at) WHERE status = 'failed';

-- Create GIN index for JSONB metadata queries
CREATE INDEX IF NOT EXISTS idx_transactions_metadata ON transactions USING GIN (metadata);

-- Add constraints
ALTER TABLE transactions ADD CONSTRAINT chk_transaction_hash_format 
    CHECK (transaction_hash IS NULL OR transaction_hash ~ '^0x[a-fA-F0-9]{64}$');

ALTER TABLE transactions ADD CONSTRAINT chk_ethereum_address_format 
    CHECK (
        (from_address IS NULL OR from_address ~ '^0x[a-fA-F0-9]{40}$') AND
        (to_address IS NULL OR to_address ~ '^0x[a-fA-F0-9]{40}$')
    );

ALTER TABLE transactions ADD CONSTRAINT chk_confirmed_at_logic
    CHECK (
        (status = 'confirmed' AND confirmed_at IS NOT NULL) OR
        (status != 'confirmed' AND confirmed_at IS NULL)
    );

ALTER TABLE transactions ADD CONSTRAINT chk_amounts_non_negative
    CHECK (
        (transaction_fee IS NULL OR transaction_fee >= 0) AND
        (amount IS NULL OR amount >= 0)
    );

-- Create trigger to automatically set confirmed_at when status changes to confirmed
CREATE OR REPLACE FUNCTION update_transaction_confirmed_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Set confirmed_at when status changes to confirmed
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        NEW.confirmed_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- Clear confirmed_at when status changes from confirmed to something else
    IF NEW.status != 'confirmed' AND OLD.status = 'confirmed' THEN
        NEW.confirmed_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_transaction_confirmed_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_transaction_confirmed_at();

-- Create function to get transaction statistics
CREATE OR REPLACE FUNCTION get_transaction_stats(p_user_id UUID DEFAULT NULL, p_start_date TIMESTAMP DEFAULT NULL, p_end_date TIMESTAMP DEFAULT NULL)
RETURNS TABLE(
    total_transactions BIGINT,
    pending_transactions BIGINT,
    confirmed_transactions BIGINT,
    failed_transactions BIGINT,
    total_amount DECIMAL(18,8),
    total_fees DECIMAL(18,8),
    nft_transactions BIGINT,
    lottery_transactions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_transactions,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_transactions,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_transactions,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_transactions,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(transaction_fee), 0) as total_fees,
        COUNT(*) FILTER (WHERE transaction_type IN ('mint', 'transfer', 'use', 'recycle')) as nft_transactions,
        COUNT(*) FILTER (WHERE transaction_type IN ('lottery_entry', 'lottery_win')) as lottery_transactions
    FROM transactions
    WHERE 
        (p_user_id IS NULL OR user_id = p_user_id) AND
        (p_start_date IS NULL OR created_at >= p_start_date) AND
        (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up old pending transactions
CREATE OR REPLACE FUNCTION cleanup_old_pending_transactions(p_hours_old INTEGER DEFAULT 24)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Mark old pending transactions as failed
    UPDATE transactions 
    SET 
        status = 'failed',
        error_message = 'Transaction timeout - marked as failed after ' || p_hours_old || ' hours'
    WHERE 
        status = 'pending' 
        AND created_at < (CURRENT_TIMESTAMP - INTERVAL '1 hour' * p_hours_old);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE transactions IS 'Stores blockchain transaction records for NFT operations and payments';
COMMENT ON COLUMN transactions.transaction_hash IS 'Blockchain transaction hash (null for off-chain transactions)';
COMMENT ON COLUMN transactions.block_number IS 'Block number where transaction was confirmed';
COMMENT ON COLUMN transactions.gas_used IS 'Amount of gas used for the transaction';
COMMENT ON COLUMN transactions.gas_price IS 'Gas price in wei';
COMMENT ON COLUMN transactions.metadata IS 'Additional transaction data stored as JSON';
COMMENT ON COLUMN transactions.from_address IS 'Source blockchain address';
COMMENT ON COLUMN transactions.to_address IS 'Destination blockchain address';

-- Create view for transaction summary
CREATE OR REPLACE VIEW transaction_summary AS
SELECT 
    t.id,
    t.user_id,
    t.transaction_type,
    t.status,
    t.amount,
    t.currency,
    t.transaction_fee,
    t.created_at,
    t.confirmed_at,
    CASE 
        WHEN t.confirmed_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (t.confirmed_at - t.created_at))
        ELSE NULL 
    END as confirmation_time_seconds,
    CASE 
        WHEN t.nft_id IS NOT NULL THEN 'NFT'
        WHEN t.lottery_id IS NOT NULL THEN 'Lottery'
        ELSE 'Other'
    END as category
FROM transactions t;

COMMENT ON VIEW transaction_summary IS 'Simplified view of transactions with calculated fields';
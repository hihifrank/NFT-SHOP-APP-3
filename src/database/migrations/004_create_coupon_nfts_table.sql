-- Migration: Create coupon_nfts table
-- Description: Table for storing NFT coupon data

CREATE TABLE IF NOT EXISTS coupon_nfts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id VARCHAR(255) NOT NULL UNIQUE,
    merchant_id UUID NOT NULL,
    current_owner_id UUID,
    original_owner_id UUID,
    coupon_type VARCHAR(50) NOT NULL CHECK (coupon_type IN ('percentage', 'fixed_amount', 'buy_one_get_one', 'free_item')),
    title VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    title_zh_cn VARCHAR(255),
    description TEXT,
    description_en TEXT,
    description_zh_cn TEXT,
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    minimum_purchase DECIMAL(10,2) DEFAULT 0 CHECK (minimum_purchase >= 0),
    max_quantity INTEGER NOT NULL CHECK (max_quantity > 0),
    remaining_quantity INTEGER NOT NULL CHECK (remaining_quantity >= 0),
    total_minted INTEGER DEFAULT 0 CHECK (total_minted >= 0),
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    expiry_date TIMESTAMP WITH TIME ZONE,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    is_transferable BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    metadata_uri TEXT,
    image_url TEXT,
    terms_and_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_coupon_nfts_token_id ON coupon_nfts(token_id);
CREATE INDEX IF NOT EXISTS idx_coupon_nfts_merchant_id ON coupon_nfts(merchant_id);
CREATE INDEX IF NOT EXISTS idx_coupon_nfts_current_owner_id ON coupon_nfts(current_owner_id);
CREATE INDEX IF NOT EXISTS idx_coupon_nfts_coupon_type ON coupon_nfts(coupon_type);
CREATE INDEX IF NOT EXISTS idx_coupon_nfts_rarity ON coupon_nfts(rarity);
CREATE INDEX IF NOT EXISTS idx_coupon_nfts_is_active ON coupon_nfts(is_active);
CREATE INDEX IF NOT EXISTS idx_coupon_nfts_is_used ON coupon_nfts(is_used);
CREATE INDEX IF NOT EXISTS idx_coupon_nfts_expiry_date ON coupon_nfts(expiry_date);
CREATE INDEX IF NOT EXISTS idx_coupon_nfts_created_at ON coupon_nfts(created_at);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_coupon_nfts_active_unused ON coupon_nfts(is_active, is_used) WHERE is_active = TRUE AND is_used = FALSE;
CREATE INDEX IF NOT EXISTS idx_coupon_nfts_merchant_active ON coupon_nfts(merchant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_coupon_nfts_owner_active ON coupon_nfts(current_owner_id, is_active);

-- Add constraint to ensure remaining_quantity <= max_quantity
ALTER TABLE coupon_nfts ADD CONSTRAINT chk_remaining_quantity CHECK (remaining_quantity <= max_quantity);

-- Add constraint to ensure expiry_date is in the future for new records
-- Note: This is commented out as it would prevent inserting test data with past dates
-- ALTER TABLE coupon_nfts ADD CONSTRAINT chk_expiry_date_future CHECK (expiry_date IS NULL OR expiry_date > CURRENT_TIMESTAMP);

-- Add constraint to ensure used_at is set when is_used is true
-- This is implemented as a trigger instead of a constraint for flexibility

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_coupon_nfts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_coupon_nfts_updated_at
    BEFORE UPDATE ON coupon_nfts
    FOR EACH ROW
    EXECUTE FUNCTION update_coupon_nfts_updated_at();

-- Create trigger to validate business rules
CREATE OR REPLACE FUNCTION validate_coupon_nft_business_rules()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure percentage discounts are between 0 and 100
    IF NEW.discount_type = 'percentage' AND (NEW.discount_value <= 0 OR NEW.discount_value > 100) THEN
        RAISE EXCEPTION 'Percentage discount must be between 0 and 100, got %', NEW.discount_value;
    END IF;
    
    -- Ensure used_at is set when is_used is true
    IF NEW.is_used = TRUE AND NEW.used_at IS NULL THEN
        NEW.used_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- Ensure used_at is null when is_used is false
    IF NEW.is_used = FALSE THEN
        NEW.used_at = NULL;
    END IF;
    
    -- Ensure remaining_quantity is 0 when is_used is true for single-use coupons
    IF NEW.is_used = TRUE AND NEW.max_quantity = 1 THEN
        NEW.remaining_quantity = 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_coupon_nft_business_rules
    BEFORE INSERT OR UPDATE ON coupon_nfts
    FOR EACH ROW
    EXECUTE FUNCTION validate_coupon_nft_business_rules();

-- Add comments for documentation
COMMENT ON TABLE coupon_nfts IS 'Stores NFT coupon data including metadata and usage tracking';
COMMENT ON COLUMN coupon_nfts.token_id IS 'Unique blockchain token ID for the NFT';
COMMENT ON COLUMN coupon_nfts.merchant_id IS 'ID of the merchant who created the coupon';
COMMENT ON COLUMN coupon_nfts.current_owner_id IS 'ID of the current owner of the NFT';
COMMENT ON COLUMN coupon_nfts.original_owner_id IS 'ID of the original owner when first minted';
COMMENT ON COLUMN coupon_nfts.discount_value IS 'Discount amount (percentage or fixed amount)';
COMMENT ON COLUMN coupon_nfts.remaining_quantity IS 'Number of times this coupon can still be used';
COMMENT ON COLUMN coupon_nfts.metadata_uri IS 'IPFS URI for the NFT metadata';
COMMENT ON COLUMN coupon_nfts.is_transferable IS 'Whether this NFT can be transferred between users';
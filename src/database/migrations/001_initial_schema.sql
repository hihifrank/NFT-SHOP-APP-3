-- Migration: 001_initial_schema
-- Description: Create initial database schema for HK Retail NFT Platform
-- Created: 2024-01-01

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    email VARCHAR(255),
    username VARCHAR(100),
    preferred_language VARCHAR(10) DEFAULT 'zh-HK' CHECK (preferred_language IN ('zh-HK', 'zh-CN', 'en')),
    profile_image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create merchants table
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    name_zh_cn VARCHAR(255),
    description TEXT,
    description_en TEXT,
    description_zh_cn TEXT,
    address TEXT NOT NULL,
    address_en TEXT,
    address_zh_cn TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location GEOGRAPHY(POINT, 4326), -- PostGIS geography column
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(500),
    business_hours JSONB, -- Store business hours in JSON format
    is_nft_participant BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    rating DECIMAL(3, 2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER DEFAULT 0,
    logo_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coupon_nfts table
CREATE TABLE coupon_nfts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id BIGINT UNIQUE NOT NULL,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    current_owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    original_owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    coupon_type VARCHAR(50) NOT NULL CHECK (coupon_type IN ('percentage', 'fixed_amount', 'buy_one_get_one', 'free_item')),
    title VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    title_zh_cn VARCHAR(255),
    description TEXT,
    description_en TEXT,
    description_zh_cn TEXT,
    discount_value DECIMAL(10, 2) NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    minimum_purchase DECIMAL(10, 2) DEFAULT 0,
    max_quantity INTEGER NOT NULL DEFAULT 1,
    remaining_quantity INTEGER NOT NULL,
    total_minted INTEGER DEFAULT 0,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    expiry_date TIMESTAMP WITH TIME ZONE,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    is_transferable BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    metadata_uri VARCHAR(500),
    image_url VARCHAR(500),
    terms_and_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_remaining_quantity CHECK (remaining_quantity >= 0),
    CONSTRAINT valid_max_quantity CHECK (max_quantity > 0),
    CONSTRAINT valid_discount_value CHECK (discount_value > 0)
);

-- Create lotteries table
CREATE TABLE lotteries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    name_zh_cn VARCHAR(255),
    description TEXT,
    description_en TEXT,
    description_zh_cn TEXT,
    entry_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'HKD',
    total_prizes INTEGER NOT NULL,
    remaining_prizes INTEGER NOT NULL,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    prize_pool JSONB, -- Store prize information in JSON format
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    draw_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    is_completed BOOLEAN DEFAULT false,
    random_seed VARCHAR(64),
    winner_selection_method VARCHAR(50) DEFAULT 'random' CHECK (winner_selection_method IN ('random', 'first_come_first_serve')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    image_url VARCHAR(500),
    terms_and_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_lottery_dates CHECK (start_time < end_time),
    CONSTRAINT valid_remaining_prizes CHECK (remaining_prizes >= 0),
    CONSTRAINT valid_entry_fee CHECK (entry_fee >= 0)
);

-- Create lottery_participants table
CREATE TABLE lottery_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lottery_id UUID NOT NULL REFERENCES lotteries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_count INTEGER DEFAULT 1,
    is_winner BOOLEAN DEFAULT false,
    prize_won JSONB,
    participated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate participation
    UNIQUE(lottery_id, user_id)
);

-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nft_id UUID REFERENCES coupon_nfts(id) ON DELETE SET NULL,
    lottery_id UUID REFERENCES lotteries(id) ON DELETE SET NULL,
    merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('mint', 'transfer', 'use', 'recycle', 'purchase', 'lottery_entry', 'lottery_win')),
    transaction_hash VARCHAR(66),
    block_number BIGINT,
    gas_used BIGINT,
    gas_price BIGINT,
    transaction_fee DECIMAL(18, 8),
    amount DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'HKD',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    metadata JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Create merchant_reviews table
CREATE TABLE merchant_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent multiple reviews from same user
    UNIQUE(merchant_id, user_id)
);

-- Create user_sessions table for JWT token management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization

-- Users indexes
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Merchants indexes
CREATE INDEX idx_merchants_category ON merchants(category);
CREATE INDEX idx_merchants_is_nft_participant ON merchants(is_nft_participant);
CREATE INDEX idx_merchants_is_active ON merchants(is_active);
CREATE INDEX idx_merchants_rating ON merchants(rating DESC);
CREATE INDEX idx_merchants_location ON merchants USING GIST(location); -- Geospatial index
CREATE INDEX idx_merchants_lat_lng ON merchants(latitude, longitude); -- Composite index for lat/lng queries

-- Coupon NFTs indexes
CREATE INDEX idx_coupon_nfts_token_id ON coupon_nfts(token_id);
CREATE INDEX idx_coupon_nfts_merchant_id ON coupon_nfts(merchant_id);
CREATE INDEX idx_coupon_nfts_current_owner_id ON coupon_nfts(current_owner_id);
CREATE INDEX idx_coupon_nfts_is_used ON coupon_nfts(is_used);
CREATE INDEX idx_coupon_nfts_is_active ON coupon_nfts(is_active);
CREATE INDEX idx_coupon_nfts_expiry_date ON coupon_nfts(expiry_date);
CREATE INDEX idx_coupon_nfts_rarity ON coupon_nfts(rarity);
CREATE INDEX idx_coupon_nfts_created_at ON coupon_nfts(created_at);

-- Lotteries indexes
CREATE INDEX idx_lotteries_is_active ON lotteries(is_active);
CREATE INDEX idx_lotteries_start_time ON lotteries(start_time);
CREATE INDEX idx_lotteries_end_time ON lotteries(end_time);
CREATE INDEX idx_lotteries_is_completed ON lotteries(is_completed);

-- Lottery participants indexes
CREATE INDEX idx_lottery_participants_lottery_id ON lottery_participants(lottery_id);
CREATE INDEX idx_lottery_participants_user_id ON lottery_participants(user_id);
CREATE INDEX idx_lottery_participants_is_winner ON lottery_participants(is_winner);

-- Transactions indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_nft_id ON transactions(nft_id);
CREATE INDEX idx_transactions_transaction_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_transaction_hash ON transactions(transaction_hash);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_block_number ON transactions(block_number);

-- Merchant reviews indexes
CREATE INDEX idx_merchant_reviews_merchant_id ON merchant_reviews(merchant_id);
CREATE INDEX idx_merchant_reviews_user_id ON merchant_reviews(user_id);
CREATE INDEX idx_merchant_reviews_rating ON merchant_reviews(rating);
CREATE INDEX idx_merchant_reviews_created_at ON merchant_reviews(created_at);

-- User sessions indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupon_nfts_updated_at BEFORE UPDATE ON coupon_nfts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lotteries_updated_at BEFORE UPDATE ON lotteries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_merchant_reviews_updated_at BEFORE UPDATE ON merchant_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update merchant location geography column
CREATE OR REPLACE FUNCTION update_merchant_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to merchants table for automatic location updates
CREATE TRIGGER update_merchant_location_trigger 
    BEFORE INSERT OR UPDATE OF latitude, longitude ON merchants 
    FOR EACH ROW EXECUTE FUNCTION update_merchant_location();

-- Create function to update merchant rating based on reviews
CREATE OR REPLACE FUNCTION update_merchant_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE merchants 
    SET 
        rating = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM merchant_reviews 
            WHERE merchant_id = COALESCE(NEW.merchant_id, OLD.merchant_id) 
            AND is_active = true
        ),
        total_reviews = (
            SELECT COUNT(*) 
            FROM merchant_reviews 
            WHERE merchant_id = COALESCE(NEW.merchant_id, OLD.merchant_id) 
            AND is_active = true
        )
    WHERE id = COALESCE(NEW.merchant_id, OLD.merchant_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Apply trigger to merchant_reviews table for automatic rating updates
CREATE TRIGGER update_merchant_rating_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON merchant_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_merchant_rating();
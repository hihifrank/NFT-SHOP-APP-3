// Core type definitions for HK Retail NFT Platform

export interface User {
  id: string;
  walletAddress: string;
  email?: string;
  username?: string;
  preferredLanguage: 'zh-HK' | 'zh-CN' | 'en';
  profileImageUrl?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Merchant {
  id: string;
  ownerId?: string;
  name: string;
  nameEn?: string;
  nameZhCn?: string;
  description?: string;
  descriptionEn?: string;
  descriptionZhCn?: string;
  address: string;
  addressEn?: string;
  addressZhCn?: string;
  latitude: number;
  longitude: number;
  category: string;
  subcategory?: string;
  phone?: string;
  email?: string;
  website?: string;
  businessHours?: any;
  isNftParticipant: boolean;
  isVerified?: boolean;
  isActive?: boolean;
  rating?: number;
  totalReviews?: number;
  logoUrl?: string;
  coverImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CouponNFT {
  id: string;
  tokenId: bigint;
  merchantId: string;
  currentOwnerId?: string;
  originalOwnerId?: string;
  couponType: string;
  title: string;
  titleEn?: string;
  titleZhCn?: string;
  description?: string;
  descriptionEn?: string;
  descriptionZhCn?: string;
  discountValue: number;
  discountType: 'percentage' | 'fixed_amount';
  minimumPurchase?: number;
  maxQuantity: number;
  remainingQuantity: number;
  totalMinted?: number;
  rarity?: string;
  expiryDate?: Date;
  isUsed: boolean;
  usedAt?: Date;
  isTransferable?: boolean;
  isActive?: boolean;
  metadataUri?: string;
  imageUrl?: string;
  termsAndConditions?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Lottery {
  id: string;
  name: string;
  nameEn?: string;
  nameZhCn?: string;
  description?: string;
  descriptionEn?: string;
  descriptionZhCn?: string;
  entryFee: number;
  currency?: string;
  totalPrizes: number;
  remainingPrizes: number;
  maxParticipants?: number;
  currentParticipants?: number;
  prizePool?: any[];
  startTime: Date;
  endTime: Date;
  drawTime?: Date;
  isActive: boolean;
  isCompleted?: boolean;
  randomSeed?: string;
  winnerSelectionMethod?: string;
  createdBy?: string;
  imageUrl?: string;
  termsAndConditions?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  nftId?: string;
  lotteryId?: string;
  merchantId?: string;
  transactionType: 'mint' | 'transfer' | 'use' | 'recycle' | 'purchase' | 'lottery_entry' | 'lottery_win';
  transactionHash?: string;
  blockNumber?: bigint;
  gasUsed?: bigint;
  gasPrice?: bigint;
  transactionFee?: number;
  amount?: number;
  currency?: string;
  status?: string;
  fromAddress?: string;
  toAddress?: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
  createdAt: Date;
  confirmedAt?: Date;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface SearchCriteria {
  category?: string;
  location?: GeoLocation;
  radius?: number;
  isNftParticipant?: boolean;
  sortBy?: 'distance' | 'rating' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface StoreDetails extends Merchant {
  rating?: number;
  reviewCount?: number;
  operatingHours?: string;
  contactInfo?: string;
  images?: string[];
}

export interface StoreStatus {
  isOpen: boolean;
  lastUpdated: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// NFT and Blockchain related types
export interface NFTResult {
  success: boolean;
  tokenId?: string;
  transactionHash?: string;
  metadata?: NFTMetadata;
  error?: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: NFTAttribute[];
  discount: number;
  discountType: 'percentage' | 'fixed_amount';
  merchantName: string;
  expiryDate?: string;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export interface UsageResult {
  success: boolean;
  transactionHash?: string;
  recycledTokenId?: string;
  error?: string;
}

export interface TransferResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export interface RecycleResult {
  success: boolean;
  newTokenId?: string;
  transactionHash?: string;
  error?: string;
}

// Lottery related types
export interface LotteryConfig {
  name: string;
  description?: string;
  entryFee: number;
  totalPrizes: number;
  startTime: Date;
  endTime: Date;
  prizePool: LotteryPrize[];
}

export interface LotteryPrize {
  type: 'nft' | 'coupon' | 'token';
  value: string;
  quantity: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface LotteryResult {
  success: boolean;
  lotteryId?: string;
  error?: string;
}

export interface ParticipationResult {
  success: boolean;
  participationId?: string;
  transactionHash?: string;
  error?: string;
}

export interface WinnerResult {
  success: boolean;
  winners: LotteryWinner[];
  transactionHash?: string;
  error?: string;
}

export interface LotteryWinner {
  userId: string;
  prize: LotteryPrize;
  winningNumber: number;
}

export interface VerificationResult {
  success: boolean;
  isValid: boolean;
  randomValue?: string;
  error?: string;
}

// Error types
export interface ErrorResponse {
  message: string;
  retryable: boolean;
  retryAfter?: number;
  code?: string;
}

export enum BlockchainErrorType {
  INSUFFICIENT_GAS = 'INSUFFICIENT_GAS',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  NETWORK_CONGESTION = 'NETWORK_CONGESTION',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE'
}

export enum BusinessErrorType {
  COUPON_EXPIRED = 'COUPON_EXPIRED',
  COUPON_ALREADY_USED = 'COUPON_ALREADY_USED',
  INSUFFICIENT_INVENTORY = 'INSUFFICIENT_INVENTORY',
  LOTTERY_NOT_ACTIVE = 'LOTTERY_NOT_ACTIVE'
}

export interface BlockchainError extends Error {
  type: BlockchainErrorType;
  transactionHash?: string;
  gasUsed?: number;
}

export interface BusinessError extends Error {
  type: BusinessErrorType;
  resourceId?: string;
}

// Configuration types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface BlockchainConfig {
  networkUrl: string;
  chainId: number;
  contractAddresses: {
    couponNFT: string;
    lottery: string;
  };
  privateKey?: string;
  gasLimit: number;
  gasPrice: string;
}

export interface AppConfig {
  port: number;
  environment: 'development' | 'staging' | 'production' | 'test';
  jwtSecret: string;
  database: DatabaseConfig;
  redis: RedisConfig;
  blockchain: BlockchainConfig;
  ipfs: {
    gateway: string;
    apiUrl: string;
  };
}
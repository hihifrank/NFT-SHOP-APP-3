// Service and Repository interfaces for dependency injection and testing

import { 
  User, 
  Merchant, 
  CouponNFT, 
  Lottery, 
  Transaction,
  GeoLocation,
  SearchCriteria,
  StoreDetails,
  StoreStatus,
  NFTResult,
  UsageResult,
  TransferResult,
  RecycleResult,
  LotteryConfig,
  LotteryResult,
  ParticipationResult,
  WinnerResult,
  VerificationResult
} from './index';

// Repository Interfaces
export interface IUserRepository {
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByWalletAddress(walletAddress: string): Promise<User | null>;
  update(id: string, updates: Partial<User>): Promise<User>;
  delete(id: string): Promise<boolean>;
}

export interface IMerchantRepository {
  create(merchant: Omit<Merchant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Merchant>;
  findById(id: string): Promise<Merchant | null>;
  findByLocation(location: GeoLocation, radius: number): Promise<Merchant[]>;
  search(criteria: SearchCriteria): Promise<Merchant[]>;
  update(id: string, updates: Partial<Merchant>): Promise<Merchant>;
  delete(id: string): Promise<boolean>;
}

export interface ICouponNFTRepository {
  create(couponNFT: Omit<CouponNFT, 'id' | 'createdAt'>): Promise<CouponNFT>;
  findById(id: string): Promise<CouponNFT | null>;
  findByTokenId(tokenId: bigint): Promise<CouponNFT | null>;
  findByOwner(ownerId: string): Promise<CouponNFT[]>;
  findByMerchant(merchantId: string): Promise<CouponNFT[]>;
  update(id: string, updates: Partial<CouponNFT>): Promise<CouponNFT>;
  delete(id: string): Promise<boolean>;
}

export interface ILotteryRepository {
  create(lottery: Omit<Lottery, 'id' | 'createdAt'>): Promise<Lottery>;
  findById(id: string): Promise<Lottery | null>;
  findActive(): Promise<Lottery[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Lottery[]>;
  update(id: string, updates: Partial<Lottery>): Promise<Lottery>;
  delete(id: string): Promise<boolean>;
}

export interface ITransactionRepository {
  create(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
  findByUser(userId: string): Promise<Transaction[]>;
  findByNFT(nftId: string): Promise<Transaction[]>;
  findByType(type: Transaction['transactionType']): Promise<Transaction[]>;
  findByTransactionHash(hash: string): Promise<Transaction | null>;
}

// Service Interfaces
export interface ICouponNFTManager {
  createCouponNFT(couponData: {
    merchantId: string;
    couponType: string;
    discountValue: number;
    discountType: 'percentage' | 'fixed_amount';
    maxQuantity: number;
    expiryDate?: Date;
  }): Promise<NFTResult>;
  
  useCoupon(nftId: string, userId: string): Promise<UsageResult>;
  transferNFT(from: string, to: string, nftId: string): Promise<TransferResult>;
  recycleCoupon(nftId: string): Promise<RecycleResult>;
  validateCoupon(nftId: string): Promise<boolean>;
}

export interface ILotterySystem {
  createLottery(config: LotteryConfig): Promise<LotteryResult>;
  participateInLottery(userId: string, lotteryId: string): Promise<ParticipationResult>;
  drawWinner(lotteryId: string): Promise<WinnerResult>;
  verifyRandomness(seed: string): Promise<VerificationResult>;
  getLotteryHistory(userId: string): Promise<Lottery[]>;
}

export interface IStoreDiscovery {
  findNearbyStores(location: GeoLocation, radius: number): Promise<Merchant[]>;
  searchStores(criteria: SearchCriteria): Promise<Merchant[]>;
  getStoreDetails(storeId: string): Promise<StoreDetails | null>;
  updateStoreStatus(storeId: string, status: StoreStatus): Promise<boolean>;
  getRecommendedStores(userId: string, location?: GeoLocation): Promise<Merchant[]>;
}

export interface IUserService {
  register(walletAddress: string, email?: string): Promise<User>;
  authenticate(walletAddress: string, signature: string): Promise<string>; // Returns JWT token
  getUserProfile(userId: string): Promise<User | null>;
  updateProfile(userId: string, updates: Partial<User>): Promise<User>;
  getUserNFTs(userId: string): Promise<CouponNFT[]>;
  getUserTransactions(userId: string): Promise<Transaction[]>;
}

export interface IMerchantService {
  registerMerchant(merchantData: Omit<Merchant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Merchant>;
  getMerchantProfile(merchantId: string): Promise<Merchant | null>;
  updateMerchantProfile(merchantId: string, updates: Partial<Merchant>): Promise<Merchant>;
  getMerchantCoupons(merchantId: string): Promise<CouponNFT[]>;
  getMerchantAnalytics(merchantId: string): Promise<{
    totalCoupons: number;
    usedCoupons: number;
    activeUsers: number;
    revenue: number;
  }>;
}

export interface IBlockchainService {
  deployContract(contractType: 'couponNFT' | 'lottery', params: any): Promise<string>;
  mintNFT(to: string, tokenId: string, metadata: string): Promise<string>;
  transferNFT(from: string, to: string, tokenId: string): Promise<string>;
  burnNFT(tokenId: string): Promise<string>;
  getTransactionStatus(txHash: string): Promise<'pending' | 'confirmed' | 'failed'>;
  estimateGas(operation: string, params: any): Promise<number>;
}

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl?: number): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  flush(): Promise<boolean>;
}

export interface INotificationService {
  sendPushNotification(userId: string, message: string, data?: any): Promise<boolean>;
  sendLocationBasedNotification(location: GeoLocation, radius: number, message: string): Promise<number>;
  sendLotteryResultNotification(lotteryId: string, winners: string[]): Promise<boolean>;
}

export interface IAuthService {
  generateJWT(userId: string): string;
  verifyJWT(token: string): { userId: string } | null;
  verifySignature(message: string, signature: string, address: string): boolean;
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
}

// Controller interfaces for request/response handling
export interface IController {
  handleRequest(req: any, res: any, next: any): Promise<void>;
}

export interface IUserController extends IController {
  register(req: any, res: any): Promise<void>;
  login(req: any, res: any): Promise<void>;
  getProfile(req: any, res: any): Promise<void>;
  updateProfile(req: any, res: any): Promise<void>;
  getNFTs(req: any, res: any): Promise<void>;
  getTransactions(req: any, res: any): Promise<void>;
}

export interface IMerchantController extends IController {
  register(req: any, res: any): Promise<void>;
  getProfile(req: any, res: any): Promise<void>;
  updateProfile(req: any, res: any): Promise<void>;
  createCoupon(req: any, res: any): Promise<void>;
  getCoupons(req: any, res: any): Promise<void>;
  getAnalytics(req: any, res: any): Promise<void>;
}

export interface ICouponController extends IController {
  useCoupon(req: any, res: any): Promise<void>;
  transferCoupon(req: any, res: any): Promise<void>;
  getCouponDetails(req: any, res: any): Promise<void>;
  validateCoupon(req: any, res: any): Promise<void>;
}

export interface ILotteryController extends IController {
  getActiveLotteries(req: any, res: any): Promise<void>;
  participate(req: any, res: any): Promise<void>;
  getHistory(req: any, res: any): Promise<void>;
  getResults(req: any, res: any): Promise<void>;
}

export interface IStoreController extends IController {
  searchStores(req: any, res: any): Promise<void>;
  getNearbyStores(req: any, res: any): Promise<void>;
  getStoreDetails(req: any, res: any): Promise<void>;
  getRecommendations(req: any, res: any): Promise<void>;
}
// Common types used throughout the application

export interface User {
  id: string;
  walletAddress: string;
  email?: string;
  preferredLanguage: 'zh-HK' | 'zh-CN' | 'en';
}

export interface CouponNFT {
  id: string;
  tokenId: string;
  merchantId: string;
  merchantName: string;
  couponType: string;
  discountValue: number;
  discountType: 'percentage' | 'fixed_amount';
  expiryDate: string;
  isUsed: boolean;
  metadataUri: string;
  image?: string;
}

export interface Merchant {
  id: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  isNftParticipant: boolean;
  image?: string;
  rating?: number;
  distance?: number;
}

export interface Lottery {
  id: string;
  name: string;
  description: string;
  entryFee: number;
  totalPrizes: number;
  remainingPrizes: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  prizes: string[];
}

export interface LotteryParticipation {
  lotteryId: string;
  participationTime: string;
  result?: 'won' | 'lost';
  prize?: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface SearchCriteria {
  query?: string;
  category?: string;
  location?: GeoLocation;
  radius?: number;
}

// Navigation types
export type RootStackParamList = {
  Main: undefined;
  WalletConnect: undefined;
  MerchantDetail: {merchantId: string};
  CouponDetail: {couponId: string};
  LotteryDetail: {lotteryId: string};
};

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  NFT: undefined;
  Profile: undefined;
};
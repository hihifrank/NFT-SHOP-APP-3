import dotenv from 'dotenv';
import { AppConfig } from '../types';

// Load environment variables
dotenv.config();

const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production' | 'test') || 'development',
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'hk_retail_nft_platform',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  
  blockchain: {
    networkUrl: process.env.BLOCKCHAIN_NETWORK_URL || 'https://polygon-mumbai.g.alchemy.com/v2/demo',
    chainId: parseInt(process.env.BLOCKCHAIN_CHAIN_ID || '80001', 10),
    contractAddresses: {
      couponNFT: process.env.CONTRACT_COUPON_NFT || '',
      lottery: process.env.CONTRACT_LOTTERY || '',
    },
    privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY,
    gasLimit: parseInt(process.env.BLOCKCHAIN_GAS_LIMIT || '500000', 10),
    gasPrice: process.env.BLOCKCHAIN_GAS_PRICE || '20000000000',
  },
  
  ipfs: {
    gateway: process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud',
    apiUrl: process.env.IPFS_API_URL || 'https://api.pinata.cloud',
  },
};

// Validation
if (config.environment === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'default-secret-change-in-production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
  
  if (!config.blockchain.privateKey) {
    throw new Error('BLOCKCHAIN_PRIVATE_KEY must be set in production environment');
  }
}

export default config;
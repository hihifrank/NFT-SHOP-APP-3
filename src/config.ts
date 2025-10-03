import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production' | 'test') || 'development',
  jwtSecret: process.env.JWT_SECRET || 'test-secret-for-socket-tests',
  
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
    network: process.env.BLOCKCHAIN_NETWORK || 'mumbai',
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'https://polygon-mumbai.g.alchemy.com/v2/demo',
    chainId: parseInt(process.env.BLOCKCHAIN_CHAIN_ID || '80001', 10),
    couponNFTAddress: process.env.CONTRACT_COUPON_NFT || '',
    lotteryAddress: process.env.CONTRACT_LOTTERY || '',
    privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY,
    gasLimit: parseInt(process.env.BLOCKCHAIN_GAS_LIMIT || '500000', 10),
    gasPrice: process.env.BLOCKCHAIN_GAS_PRICE || '20000000000',
  },
  
  ipfs: {
    gateway: process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretKey: process.env.PINATA_SECRET_KEY,
  },
  
  app: {
    baseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
  },
};

export default config;
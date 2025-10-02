// Global test setup

// Set test environment
process.env.NODE_ENV = 'test';

// Set required environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'test_db';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.BLOCKCHAIN_NETWORK = 'hardhat';
process.env.BLOCKCHAIN_RPC_URL = 'http://localhost:8545';
process.env.BLOCKCHAIN_CHAIN_ID = '31337';
process.env.BLOCKCHAIN_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Hardhat test key
process.env.CONTRACT_COUPON_NFT = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
process.env.CONTRACT_LOTTERY = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
process.env.PINATA_API_KEY = 'test-pinata-key';
process.env.PINATA_SECRET_KEY = 'test-pinata-secret';
process.env.ENABLE_MOCK_BLOCKCHAIN = 'true';
process.env.ENABLE_MOCK_IPFS = 'true';

// Global cleanup after all tests
afterAll(async () => {
  // Force cleanup of any remaining handles
  await new Promise(resolve => setTimeout(resolve, 100));
});
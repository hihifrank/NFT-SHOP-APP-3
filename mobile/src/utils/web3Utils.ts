import Web3 from 'web3';

/**
 * Validates if a string is a valid Ethereum address
 */
export const isValidAddress = (address: string): boolean => {
  try {
    return Web3.utils.isAddress(address);
  } catch (error) {
    return false;
  }
};

/**
 * Formats an address for display (shows first 6 and last 4 characters)
 */
export const formatAddress = (address: string, startChars = 6, endChars = 4): string => {
  if (!address || address.length < startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Converts Wei to Ether
 */
export const weiToEther = (wei: string): string => {
  try {
    return Web3.utils.fromWei(wei, 'ether');
  } catch (error) {
    return '0';
  }
};

/**
 * Converts Ether to Wei
 */
export const etherToWei = (ether: string): string => {
  try {
    return Web3.utils.toWei(ether, 'ether');
  } catch (error) {
    return '0';
  }
};

/**
 * Formats a transaction hash for display
 */
export const formatTxHash = (hash: string, startChars = 10, endChars = 8): string => {
  if (!hash || hash.length < startChars + endChars) {
    return hash;
  }
  return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
};

/**
 * Gets the block explorer URL for a transaction
 */
export const getBlockExplorerUrl = (txHash: string, chainId: number): string => {
  switch (chainId) {
    case 80001: // Polygon Mumbai
      return `https://mumbai.polygonscan.com/tx/${txHash}`;
    case 137: // Polygon Mainnet
      return `https://polygonscan.com/tx/${txHash}`;
    case 1: // Ethereum Mainnet
      return `https://etherscan.io/tx/${txHash}`;
    default:
      return `https://mumbai.polygonscan.com/tx/${txHash}`;
  }
};

/**
 * Gets the block explorer URL for an address
 */
export const getAddressExplorerUrl = (address: string, chainId: number): string => {
  switch (chainId) {
    case 80001: // Polygon Mumbai
      return `https://mumbai.polygonscan.com/address/${address}`;
    case 137: // Polygon Mainnet
      return `https://polygonscan.com/address/${address}`;
    case 1: // Ethereum Mainnet
      return `https://etherscan.io/address/${address}`;
    default:
      return `https://mumbai.polygonscan.com/address/${address}`;
  }
};

/**
 * Gets network information by chain ID
 */
export const getNetworkInfo = (chainId: number) => {
  switch (chainId) {
    case 80001:
      return {
        name: 'Polygon Mumbai',
        symbol: 'MATIC',
        decimals: 18,
        rpcUrl: 'https://rpc-mumbai.maticvigil.com/',
        blockExplorerUrl: 'https://mumbai.polygonscan.com/',
      };
    case 137:
      return {
        name: 'Polygon Mainnet',
        symbol: 'MATIC',
        decimals: 18,
        rpcUrl: 'https://polygon-rpc.com/',
        blockExplorerUrl: 'https://polygonscan.com/',
      };
    case 1:
      return {
        name: 'Ethereum Mainnet',
        symbol: 'ETH',
        decimals: 18,
        rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
        blockExplorerUrl: 'https://etherscan.io/',
      };
    default:
      return {
        name: 'Unknown Network',
        symbol: 'ETH',
        decimals: 18,
        rpcUrl: '',
        blockExplorerUrl: '',
      };
  }
};

/**
 * Formats a balance for display
 */
export const formatBalance = (balance: string, decimals = 4): string => {
  try {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    return num.toFixed(decimals);
  } catch (error) {
    return '0';
  }
};

/**
 * Calculates estimated transaction time based on network
 */
export const getEstimatedTxTime = (chainId: number): string => {
  switch (chainId) {
    case 80001: // Polygon Mumbai
    case 137: // Polygon Mainnet
      return '30-60 seconds';
    case 1: // Ethereum Mainnet
      return '2-5 minutes';
    default:
      return '1-2 minutes';
  }
};

/**
 * Generates a random transaction hash for testing
 */
export const generateMockTxHash = (): string => {
  return '0x' + Array.from({length: 64}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
};

/**
 * Checks if a transaction hash is valid
 */
export const isValidTxHash = (hash: string): boolean => {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
};

/**
 * Gets the appropriate gas limit for different transaction types
 */
export const getGasLimit = (transactionType: 'transfer' | 'mint' | 'approve' | 'use'): number => {
  switch (transactionType) {
    case 'transfer':
      return 21000;
    case 'mint':
      return 100000;
    case 'approve':
      return 50000;
    case 'use':
      return 80000;
    default:
      return 21000;
  }
};

/**
 * Formats gas price from Gwei to Wei
 */
export const gweiToWei = (gwei: string): string => {
  try {
    return Web3.utils.toWei(gwei, 'gwei');
  } catch (error) {
    return '0';
  }
};

/**
 * Formats gas price from Wei to Gwei
 */
export const weiToGwei = (wei: string): string => {
  try {
    return Web3.utils.fromWei(wei, 'gwei');
  } catch (error) {
    return '0';
  }
};
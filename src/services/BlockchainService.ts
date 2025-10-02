import { ethers, Contract, Wallet, JsonRpcProvider } from 'ethers';
import { logger } from '../utils/logger';
import config from '../config';

// Smart contract ABIs (simplified for this implementation)
const COUPON_NFT_ABI = [
  "function mintCoupon(address to, uint256 merchantId, uint8 couponType, uint256 discountValue, uint256 maxQuantity, uint256 expiryDate, uint8 rarity, string description, string uri) returns (uint256)",
  "function useCoupon(uint256 tokenId)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function isCouponValid(uint256 tokenId) view returns (bool)",
  "function getCouponData(uint256 tokenId) view returns (tuple(uint256 merchantId, uint8 couponType, uint256 discountValue, uint256 maxQuantity, uint256 remainingQuantity, uint256 expiryDate, uint8 rarity, bool isUsed, bool isRecycled, string description))",
  "function totalSupply() view returns (uint256)",
  "event CouponMinted(uint256 indexed tokenId, uint256 indexed merchantId, address indexed recipient)",
  "event CouponUsed(uint256 indexed tokenId, address indexed user, uint256 indexed merchantId)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

export class BlockchainService {
  private provider: JsonRpcProvider;
  private wallet: Wallet;
  private couponNFTContract: Contract;

  constructor() {
    // Initialize provider
    this.provider = new JsonRpcProvider(config.blockchain.rpcUrl);
    
    // Initialize wallet
    if (!config.blockchain.privateKey) {
      throw new Error('Blockchain private key not configured');
    }
    this.wallet = new Wallet(config.blockchain.privateKey, this.provider);
    
    // Initialize contracts
    if (!config.blockchain.couponNFTAddress) {
      throw new Error('CouponNFT contract address not configured');
    }
    
    this.couponNFTContract = new Contract(
      config.blockchain.couponNFTAddress,
      COUPON_NFT_ABI,
      this.wallet
    );

    logger.info('BlockchainService initialized', {
      network: config.blockchain.network,
      walletAddress: this.wallet.address
    });
  }

  /**
   * Deploy a smart contract (placeholder implementation)
   */
  async deployContract(contractType: 'couponNFT' | 'lottery', params: any): Promise<string> {
    // This would typically involve deploying a new contract
    // For now, we'll return the existing contract address
    logger.info('Contract deployment requested', { contractType, params });
    
    if (contractType === 'couponNFT') {
      return config.blockchain.couponNFTAddress!;
    }
    
    throw new Error(`Contract type ${contractType} not supported for deployment`);
  }

  /**
   * Mint a new NFT coupon
   */
  async mintNFT(
    to: string, 
    merchantId: string, 
    couponData: {
      couponType: number;
      discountValue: number;
      maxQuantity: number;
      expiryDate: number;
      rarity: number;
      description: string;
      metadataUri: string;
    }
  ): Promise<string> {
    try {
      logger.info('Minting NFT coupon', { to, merchantId, couponData });

      // Estimate gas
      const gasEstimate = await this.couponNFTContract.mintCoupon.estimateGas(
        to,
        merchantId,
        couponData.couponType,
        ethers.parseEther(couponData.discountValue.toString()),
        couponData.maxQuantity,
        couponData.expiryDate,
        couponData.rarity,
        couponData.description,
        couponData.metadataUri
      );

      // Execute transaction
      const tx = await this.couponNFTContract.mintCoupon(
        to,
        merchantId,
        couponData.couponType,
        ethers.parseEther(couponData.discountValue.toString()),
        couponData.maxQuantity,
        couponData.expiryDate,
        couponData.rarity,
        couponData.description,
        couponData.metadataUri,
        {
          gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
        }
      );

      logger.info('NFT mint transaction sent', { 
        txHash: tx.hash,
        gasLimit: gasEstimate.toString()
      });

      return tx.hash;
    } catch (error) {
      logger.error('Error minting NFT:', error);
      throw new Error(`Failed to mint NFT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transfer an NFT from one address to another
   */
  async transferNFT(from: string, to: string, tokenId: string): Promise<string> {
    try {
      logger.info('Transferring NFT', { from, to, tokenId });

      // Estimate gas
      const gasEstimate = await this.couponNFTContract.transferFrom.estimateGas(
        from,
        to,
        tokenId
      );

      // Execute transaction
      const tx = await this.couponNFTContract.transferFrom(
        from,
        to,
        tokenId,
        {
          gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
        }
      );

      logger.info('NFT transfer transaction sent', { 
        txHash: tx.hash,
        gasLimit: gasEstimate.toString()
      });

      return tx.hash;
    } catch (error) {
      logger.error('Error transferring NFT:', error);
      throw new Error(`Failed to transfer NFT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Use/burn an NFT coupon
   */
  async burnNFT(tokenId: string): Promise<string> {
    try {
      logger.info('Using NFT coupon', { tokenId });

      // Estimate gas
      const gasEstimate = await this.couponNFTContract.useCoupon.estimateGas(tokenId);

      // Execute transaction
      const tx = await this.couponNFTContract.useCoupon(
        tokenId,
        {
          gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
        }
      );

      logger.info('NFT use transaction sent', { 
        txHash: tx.hash,
        gasLimit: gasEstimate.toString()
      });

      return tx.hash;
    } catch (error) {
      logger.error('Error using NFT coupon:', error);
      throw new Error(`Failed to use NFT coupon: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txHash: string): Promise<'pending' | 'confirmed' | 'failed'> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return 'pending';
      }
      
      return receipt.status === 1 ? 'confirmed' : 'failed';
    } catch (error) {
      logger.error('Error getting transaction status:', error);
      return 'failed';
    }
  }

  /**
   * Estimate gas for an operation
   */
  async estimateGas(operation: string, params: any): Promise<number> {
    try {
      let gasEstimate: bigint;

      switch (operation) {
        case 'mintCoupon':
          gasEstimate = await this.couponNFTContract.mintCoupon.estimateGas(...params);
          break;
        case 'transferFrom':
          gasEstimate = await this.couponNFTContract.transferFrom.estimateGas(...params);
          break;
        case 'useCoupon':
          gasEstimate = await this.couponNFTContract.useCoupon.estimateGas(...params);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      return Number(gasEstimate);
    } catch (error) {
      logger.error('Error estimating gas:', error);
      throw new Error(`Failed to estimate gas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get NFT owner
   */
  async getNFTOwner(tokenId: string): Promise<string> {
    try {
      const owner = await this.couponNFTContract.ownerOf(tokenId);
      return owner;
    } catch (error) {
      logger.error('Error getting NFT owner:', error);
      throw new Error(`Failed to get NFT owner: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if coupon is valid on blockchain
   */
  async isCouponValid(tokenId: string): Promise<boolean> {
    try {
      const isValid = await this.couponNFTContract.isCouponValid(tokenId);
      return isValid;
    } catch (error) {
      logger.error('Error checking coupon validity:', error);
      return false;
    }
  }

  /**
   * Get coupon data from blockchain
   */
  async getCouponData(tokenId: string): Promise<any> {
    try {
      const couponData = await this.couponNFTContract.getCouponData(tokenId);
      return {
        merchantId: couponData.merchantId.toString(),
        couponType: couponData.couponType,
        discountValue: ethers.formatEther(couponData.discountValue),
        maxQuantity: couponData.maxQuantity.toString(),
        remainingQuantity: couponData.remainingQuantity.toString(),
        expiryDate: new Date(Number(couponData.expiryDate) * 1000),
        rarity: couponData.rarity,
        isUsed: couponData.isUsed,
        isRecycled: couponData.isRecycled,
        description: couponData.description
      };
    } catch (error) {
      logger.error('Error getting coupon data:', error);
      throw new Error(`Failed to get coupon data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get total supply of NFTs
   */
  async getTotalSupply(): Promise<number> {
    try {
      const totalSupply = await this.couponNFTContract.totalSupply();
      return Number(totalSupply);
    } catch (error) {
      logger.error('Error getting total supply:', error);
      throw new Error(`Failed to get total supply: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Listen for contract events
   */
  setupEventListeners(): void {
    // Listen for CouponMinted events
    this.couponNFTContract.on('CouponMinted', (tokenId, merchantId, recipient, event) => {
      logger.info('CouponMinted event received', {
        tokenId: tokenId.toString(),
        merchantId: merchantId.toString(),
        recipient,
        txHash: event.transactionHash
      });
    });

    // Listen for CouponUsed events
    this.couponNFTContract.on('CouponUsed', (tokenId, user, merchantId, event) => {
      logger.info('CouponUsed event received', {
        tokenId: tokenId.toString(),
        user,
        merchantId: merchantId.toString(),
        txHash: event.transactionHash
      });
    });

    // Listen for Transfer events
    this.couponNFTContract.on('Transfer', (from, to, tokenId, event) => {
      logger.info('Transfer event received', {
        from,
        to,
        tokenId: tokenId.toString(),
        txHash: event.transactionHash
      });
    });

    logger.info('Blockchain event listeners setup complete');
  }

  /**
   * Get current gas price
   */
  async getCurrentGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice || 0n;
    } catch (error) {
      logger.error('Error getting gas price:', error);
      throw new Error('Failed to get current gas price');
    }
  }

  /**
   * Get network information
   */
  async getNetworkInfo(): Promise<{ chainId: number; name: string }> {
    try {
      const network = await this.provider.getNetwork();
      return {
        chainId: Number(network.chainId),
        name: network.name
      };
    } catch (error) {
      logger.error('Error getting network info:', error);
      throw new Error('Failed to get network information');
    }
  }
}

export default BlockchainService;
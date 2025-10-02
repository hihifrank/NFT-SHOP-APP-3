import Web3 from 'web3';
import {ethers} from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import {WalletConnectModal} from '@walletconnect/modal-react-native';
import '@walletconnect/react-native-compat';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

export interface WalletConnection {
  address: string;
  chainId: number;
  provider: any;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
}

class Web3Service {
  private web3: Web3 | null = null;
  private provider: any = null;
  private currentAccount: string | null = null;
  private chainId: number | null = null;
  private walletConnectModal: any | null = null;

  // Polygon Mumbai testnet configuration
  private readonly POLYGON_MUMBAI = {
    chainId: '0x13881',
    chainName: 'Polygon Mumbai',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
    blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
  };

  // Contract addresses (these would be deployed contract addresses)
  private readonly CONTRACT_ADDRESSES = {
    COUPON_NFT: '0x742d35Cc6634C0532925a3b8D0C9C0E3C5d5c8E9', // Mock address
    LOTTERY_SYSTEM: '0x1234567890123456789012345678901234567890', // Mock address
  };

  // WalletConnect configuration
  private readonly WALLET_CONNECT_PROJECT_ID = 'your-project-id-here'; // Replace with actual project ID

  async initializeWeb3(): Promise<void> {
    try {
      // Initialize Web3 with a default provider
      this.web3 = new Web3('https://rpc-mumbai.maticvigil.com/');
      
      // Initialize WalletConnect Modal (commented out for now)
      // this.walletConnectModal = new WalletConnectModal({
      //   projectId: this.WALLET_CONNECT_PROJECT_ID,
      //   metadata: {
      //     name: 'HK Retail NFT Platform',
      //     description: 'Hong Kong Retail NFT Coupon Platform',
      //     url: 'https://hk-retail-nft.com',
      //     icons: ['https://hk-retail-nft.com/icon.png'],
      //   },
      // });
    } catch (error) {
      console.error('Failed to initialize Web3:', error);
      throw new Error('Web3 initialization failed');
    }
  }

  async connectMetaMask(): Promise<WalletConnection> {
    try {
      // Check if MetaMask is available (in a real app, you'd use react-native-metamask-sdk)
      // For now, we'll simulate the connection with enhanced error handling
      
      // Simulate network check
      await this.checkNetworkConnection();
      
      // Simulate MetaMask connection process
      const mockAddress = '0x742d35Cc6634C0532925a3b8D0C9C0E3C5d5c8E9';
      
      // Simulate chain switching to Polygon Mumbai
      await this.switchToPolygonMumbai();
      
      this.currentAccount = mockAddress;
      this.chainId = 80001; // Polygon Mumbai
      
      // Store connection info
      await AsyncStorage.setItem('wallet_address', mockAddress);
      await AsyncStorage.setItem('wallet_type', 'metamask');
      await AsyncStorage.setItem('wallet_connected_at', Date.now().toString());
      
      return {
        address: mockAddress,
        chainId: this.chainId,
        provider: this.provider,
      };
    } catch (error) {
      console.error('MetaMask connection failed:', error);
      throw new Error('Failed to connect to MetaMask: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async connectWalletConnect(): Promise<WalletConnection> {
    try {
      // For now, simulate WalletConnect connection
      // In a real implementation, you would use @walletconnect/modal-react-native
      
      // Simulate network check
      await this.checkNetworkConnection();
      
      // Simulate WalletConnect connection process
      const mockAddress = '0x1234567890123456789012345678901234567890';
      
      this.currentAccount = mockAddress;
      this.chainId = 80001; // Polygon Mumbai
      
      // Store connection info
      await AsyncStorage.setItem('wallet_address', mockAddress);
      await AsyncStorage.setItem('wallet_type', 'walletconnect');
      await AsyncStorage.setItem('wallet_connected_at', Date.now().toString());
      
      return {
        address: mockAddress,
        chainId: this.chainId,
        provider: this.provider,
      };
    } catch (error) {
      console.error('WalletConnect connection failed:', error);
      throw new Error('Failed to connect via WalletConnect: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async disconnectWallet(): Promise<void> {
    try {
      this.currentAccount = null;
      this.chainId = null;
      this.provider = null;
      
      // Clear stored connection info
      await AsyncStorage.removeItem('wallet_address');
      await AsyncStorage.removeItem('wallet_type');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw new Error('Failed to disconnect wallet');
    }
  }

  async getStoredWalletConnection(): Promise<WalletConnection | null> {
    try {
      const address = await AsyncStorage.getItem('wallet_address');
      const walletType = await AsyncStorage.getItem('wallet_type');
      
      if (address && walletType) {
        this.currentAccount = address;
        this.chainId = 80001; // Polygon Mumbai
        
        return {
          address,
          chainId: this.chainId,
          provider: this.provider,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get stored wallet connection:', error);
      return null;
    }
  }

  async getUserNFTs(address: string): Promise<any[]> {
    try {
      // In a real implementation, you would query the blockchain
      // For now, we'll return mock NFT data
      const mockNFTs = [
        {
          tokenId: '1',
          name: 'Morning Tea House NFT Coupon',
          description: '15% off at Morning Tea House',
          image: 'https://example.com/nft1.png',
          contractAddress: this.CONTRACT_ADDRESSES.COUPON_NFT,
          attributes: [
            { trait_type: 'Discount', value: '15%' },
            { trait_type: 'Rarity', value: 'Legendary' },
            { trait_type: 'Expiry', value: '2025-10-15' },
          ],
        },
        {
          tokenId: '2',
          name: 'Fashion Boutique NFT Deal',
          description: '20% off at Fashion Boutique',
          image: 'https://example.com/nft2.png',
          contractAddress: this.CONTRACT_ADDRESSES.COUPON_NFT,
          attributes: [
            { trait_type: 'Discount', value: '20%' },
            { trait_type: 'Rarity', value: 'Rare' },
            { trait_type: 'Expiry', value: '2025-11-01' },
          ],
        },
      ];
      
      return mockNFTs;
    } catch (error) {
      console.error('Failed to get user NFTs:', error);
      throw new Error('Failed to fetch NFTs');
    }
  }

  async purchaseNFT(tokenId: string, price: string): Promise<TransactionStatus> {
    try {
      if (!this.currentAccount) {
        throw new Error('Wallet not connected');
      }

      // In a real implementation, you would interact with the smart contract
      // For now, we'll simulate a transaction
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      return {
        hash: mockTxHash,
        status: 'pending',
        confirmations: 0,
      };
    } catch (error) {
      console.error('Failed to purchase NFT:', error);
      throw new Error('NFT purchase failed');
    }
  }

  async useCouponNFT(tokenId: string): Promise<TransactionStatus> {
    try {
      if (!this.currentAccount) {
        throw new Error('Wallet not connected');
      }

      // In a real implementation, you would call the smart contract's use function
      // For now, we'll simulate a transaction
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      return {
        hash: mockTxHash,
        status: 'pending',
        confirmations: 0,
      };
    } catch (error) {
      console.error('Failed to use coupon NFT:', error);
      throw new Error('Coupon usage failed');
    }
  }

  async transferNFT(to: string, tokenId: string): Promise<TransactionStatus> {
    try {
      if (!this.currentAccount) {
        throw new Error('Wallet not connected');
      }

      // In a real implementation, you would call the smart contract's transfer function
      // For now, we'll simulate a transaction
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      return {
        hash: mockTxHash,
        status: 'pending',
        confirmations: 0,
      };
    } catch (error) {
      console.error('Failed to transfer NFT:', error);
      throw new Error('NFT transfer failed');
    }
  }

  async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
    try {
      // In a real implementation, you would check the transaction status on the blockchain
      // For now, we'll simulate status updates
      const random = Math.random();
      
      if (random < 0.3) {
        return { hash: txHash, status: 'pending', confirmations: 0 };
      } else if (random < 0.9) {
        return { hash: txHash, status: 'confirmed', confirmations: 12 };
      } else {
        return { hash: txHash, status: 'failed', confirmations: 0 };
      }
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      throw new Error('Failed to check transaction status');
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      if (!this.web3) {
        await this.initializeWeb3();
      }

      // In a real implementation, you would get the actual balance
      // For now, we'll return a mock balance
      return '1.5'; // Mock MATIC balance
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw new Error('Failed to get wallet balance');
    }
  }

  getCurrentAccount(): string | null {
    return this.currentAccount;
  }

  getChainId(): number | null {
    return this.chainId;
  }

  isConnected(): boolean {
    return this.currentAccount !== null;
  }

  private async checkNetworkConnection(): Promise<void> {
    try {
      const response = await fetch('https://rpc-mumbai.maticvigil.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Network connection failed');
      }
    } catch (error) {
      throw new Error('Unable to connect to Polygon Mumbai network');
    }
  }

  private async switchToPolygonMumbai(): Promise<void> {
    // In a real implementation, this would switch the wallet to Polygon Mumbai
    // For now, we'll simulate the process
    console.log('Switching to Polygon Mumbai network...');
    
    // Simulate network switch delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async addPolygonMumbaiNetwork(): Promise<void> {
    try {
      // In a real implementation, this would add the Polygon Mumbai network to the wallet
      // For now, we'll simulate the process
      console.log('Adding Polygon Mumbai network...');
      
      // Simulate adding network
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Failed to add Polygon Mumbai network:', error);
      throw new Error('Failed to add network');
    }
  }

  async estimateGas(transaction: any): Promise<string> {
    try {
      if (!this.web3) {
        await this.initializeWeb3();
      }

      // In a real implementation, you would estimate gas for the transaction
      // For now, we'll return a mock estimate
      return '21000'; // Mock gas estimate
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      throw new Error('Gas estimation failed');
    }
  }

  async getGasPrice(): Promise<string> {
    try {
      if (!this.web3) {
        await this.initializeWeb3();
      }

      // In a real implementation, you would get current gas price
      // For now, we'll return a mock gas price
      return '20000000000'; // 20 Gwei in wei
    } catch (error) {
      console.error('Failed to get gas price:', error);
      throw new Error('Failed to get gas price');
    }
  }

  async validateAddress(address: string): Promise<boolean> {
    try {
      if (!this.web3) {
        await this.initializeWeb3();
      }

      return this.web3?.utils.isAddress(address) || false;
    } catch (error) {
      console.error('Failed to validate address:', error);
      return false;
    }
  }

  async getNetworkInfo(): Promise<{chainId: number; networkName: string}> {
    return {
      chainId: 80001,
      networkName: 'Polygon Mumbai Testnet',
    };
  }
}

export default new Web3Service();
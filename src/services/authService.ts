import { ethers } from 'ethers';
import { SiweMessage } from 'siwe';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { User } from '../types';
import { logger } from '../utils/logger';
import AuthMiddleware from '../middleware/auth';

export interface WalletAuthRequest {
  walletAddress: string;
  signature: string;
  message: string;
  nonce?: string;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  user?: Partial<User>;
  error?: string;
}

export interface NonceResult {
  nonce: string;
  message: string;
}

class AuthService {
  private static instance: AuthService;
  private nonceStore: Map<string, { nonce: string; timestamp: number }> = new Map();
  private readonly NONCE_EXPIRY = 10 * 60 * 1000; // 10 minutes

  private cleanupInterval?: NodeJS.Timeout;

  private constructor() {
    // Clean up expired nonces every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredNonces();
    }, 5 * 60 * 1000);
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Generate nonce for wallet authentication
  generateNonce(walletAddress: string): NonceResult {
    const nonce = uuidv4();
    const timestamp = Date.now();
    
    // Store nonce with expiry
    this.nonceStore.set(walletAddress.toLowerCase(), { nonce, timestamp });
    
    const message = this.createSiweMessage(walletAddress, nonce);
    
    logger.info('Generated nonce for wallet authentication', {
      walletAddress: walletAddress.toLowerCase(),
      nonce: nonce.substring(0, 8) + '...',
    });

    return {
      nonce,
      message,
    };
  }

  // Create SIWE (Sign-In with Ethereum) message
  private createSiweMessage(walletAddress: string, nonce: string): string {
    const domain = process.env.DOMAIN || 'localhost:3000';
    const origin = process.env.ORIGIN || 'http://localhost:3000';
    
    const siweMessage = new SiweMessage({
      domain,
      address: walletAddress,
      statement: 'Sign in to HK Retail NFT Platform',
      uri: origin,
      version: '1',
      chainId: 1, // Ethereum mainnet (can be changed based on requirements)
      nonce,
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + this.NONCE_EXPIRY).toISOString(),
    });

    return siweMessage.prepareMessage();
  }

  // Verify wallet signature and authenticate user
  async authenticateWallet(authRequest: WalletAuthRequest): Promise<AuthResult> {
    try {
      const { walletAddress, signature, message } = authRequest;
      const normalizedAddress = walletAddress.toLowerCase();

      // Verify the signature
      const isValidSignature = await this.verifySignature(message, signature, walletAddress);
      
      if (!isValidSignature) {
        logger.warn('Invalid wallet signature', { walletAddress: normalizedAddress });
        return {
          success: false,
          error: 'Invalid signature',
        };
      }

      // Parse and verify SIWE message
      const siweMessage = new SiweMessage(message);
      const verificationResult = await siweMessage.verify({ signature });
      
      if (!verificationResult.success) {
        logger.warn('SIWE verification failed', { 
          walletAddress: normalizedAddress,
          error: verificationResult.error 
        });
        return {
          success: false,
          error: 'Message verification failed',
        };
      }

      // Check if nonce is valid and not expired
      const storedNonce = this.nonceStore.get(normalizedAddress);
      if (!storedNonce || storedNonce.nonce !== siweMessage.nonce) {
        logger.warn('Invalid or missing nonce', { walletAddress: normalizedAddress });
        return {
          success: false,
          error: 'Invalid nonce',
        };
      }

      if (Date.now() - storedNonce.timestamp > this.NONCE_EXPIRY) {
        logger.warn('Expired nonce', { walletAddress: normalizedAddress });
        this.nonceStore.delete(normalizedAddress);
        return {
          success: false,
          error: 'Nonce expired',
        };
      }

      // Remove used nonce
      this.nonceStore.delete(normalizedAddress);

      // Here you would typically check if user exists in database
      // For now, we'll create a mock user object
      const user: Partial<User> = {
        id: uuidv4(), // In real implementation, this would come from database
        walletAddress: normalizedAddress,
        preferredLanguage: 'zh-HK',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Generate JWT token
      const token = AuthMiddleware.generateToken({
        userId: user.id!,
        walletAddress: user.walletAddress!,
        email: user.email,
        preferredLanguage: user.preferredLanguage!,
      });

      logger.info('Wallet authentication successful', {
        walletAddress: normalizedAddress,
        userId: user.id,
      });

      return {
        success: true,
        token,
        user,
      };

    } catch (error) {
      logger.error('Wallet authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed',
      };
    }
  }

  // Verify signature using ethers
  private async verifySignature(message: string, signature: string, expectedAddress: string): Promise<boolean> {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      logger.error('Signature verification error:', error);
      return false;
    }
  }

  // Register new user (for traditional email/password if needed)
  async registerUser(userData: {
    email: string;
    password: string;
    walletAddress?: string;
    preferredLanguage?: string;
  }): Promise<AuthResult> {
    try {
      const { email, password, walletAddress, preferredLanguage = 'zh-HK' } = userData;

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user object (in real implementation, save to database)
      const user: Partial<User> = {
        id: uuidv4(),
        email: email.toLowerCase(),
        walletAddress: walletAddress?.toLowerCase(),
        preferredLanguage: preferredLanguage as 'zh-HK' | 'zh-CN' | 'en',
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Generate JWT token
      const token = AuthMiddleware.generateToken({
        userId: user.id!,
        walletAddress: user.walletAddress || '',
        email: user.email,
        preferredLanguage: user.preferredLanguage!,
      });

      logger.info('User registration successful', {
        email: user.email,
        userId: user.id,
        hasWallet: !!walletAddress,
      });

      return {
        success: true,
        token,
        user,
      };

    } catch (error) {
      logger.error('User registration error:', error);
      return {
        success: false,
        error: 'Registration failed',
      };
    }
  }

  // Login with email/password
  async loginUser(email: string, password: string): Promise<AuthResult> {
    try {
      // In real implementation, fetch user from database
      // For now, return mock response
      logger.info('Email login attempt', { email: email.toLowerCase() });

      return {
        success: false,
        error: 'Email/password authentication not implemented yet',
      };

    } catch (error) {
      logger.error('User login error:', error);
      return {
        success: false,
        error: 'Login failed',
      };
    }
  }

  // Clean up expired nonces
  private cleanupExpiredNonces(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [address, data] of this.nonceStore.entries()) {
      if (now - data.timestamp > this.NONCE_EXPIRY) {
        this.nonceStore.delete(address);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cleaned up ${cleanedCount} expired nonces`);
    }
  }

  // Get nonce store size (for monitoring)
  getNonceStoreSize(): number {
    return this.nonceStore.size;
  }

  // Cleanup method for tests and graceful shutdown
  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.nonceStore.clear();
  }
}

export default AuthService;
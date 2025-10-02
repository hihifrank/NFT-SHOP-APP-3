import { logger } from '../utils/logger';
import config from '../config';

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  animation_url?: string;
}

export class IPFSService {
  private ipfsGateway: string;
  private pinataApiKey?: string;
  private pinataSecretKey?: string;

  constructor() {
    this.ipfsGateway = config.ipfs?.gateway || 'https://gateway.pinata.cloud/ipfs/';
    this.pinataApiKey = config.ipfs?.pinataApiKey;
    this.pinataSecretKey = config.ipfs?.pinataSecretKey;

    logger.info('IPFSService initialized', {
      gateway: this.ipfsGateway,
      hasPinataKeys: !!(this.pinataApiKey && this.pinataSecretKey)
    });
  }

  /**
   * Upload NFT metadata to IPFS
   */
  async uploadMetadata(metadata: NFTMetadata): Promise<string> {
    try {
      logger.info('Uploading metadata to IPFS', { name: metadata.name });

      if (this.pinataApiKey && this.pinataSecretKey) {
        return await this.uploadToPinata(metadata);
      } else {
        // Fallback to mock implementation for development
        return await this.mockUpload(metadata);
      }
    } catch (error) {
      logger.error('Error uploading metadata to IPFS:', error);
      throw new Error(`Failed to upload metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload image to IPFS
   */
  async uploadImage(imageBuffer: Buffer, filename: string): Promise<string> {
    try {
      logger.info('Uploading image to IPFS', { filename });

      if (this.pinataApiKey && this.pinataSecretKey) {
        return await this.uploadImageToPinata(imageBuffer, filename);
      } else {
        // Fallback to mock implementation for development
        return await this.mockImageUpload(filename);
      }
    } catch (error) {
      logger.error('Error uploading image to IPFS:', error);
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get content from IPFS hash
   */
  async getContent(ipfsHash: string): Promise<any> {
    try {
      const url = `${this.ipfsGateway}${ipfsHash}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const content = await response.json();
      logger.info('Retrieved content from IPFS', { ipfsHash });
      
      return content;
    } catch (error) {
      logger.error('Error getting content from IPFS:', error);
      throw new Error(`Failed to get IPFS content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload to Pinata (IPFS pinning service)
   */
  private async uploadToPinata(metadata: NFTMetadata): Promise<string> {
    const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
    
    const data = {
      pinataContent: metadata,
      pinataMetadata: {
        name: `${metadata.name}_metadata`,
        keyvalues: {
          type: 'nft_metadata',
          name: metadata.name
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': this.pinataApiKey!,
        'pinata_secret_api_key': this.pinataSecretKey!
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Pinata upload failed: ${errorData}`);
    }

    const result = await response.json() as { IpfsHash: string };
    const ipfsHash = result.IpfsHash;
    
    logger.info('Metadata uploaded to Pinata', { ipfsHash });
    return ipfsHash;
  }

  /**
   * Upload image to Pinata
   */
  private async uploadImageToPinata(imageBuffer: Buffer, filename: string): Promise<string> {
    const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
    
    const formData = new FormData();
    const blob = new Blob([imageBuffer]);
    formData.append('file', blob, filename);
    
    const metadata = JSON.stringify({
      name: filename,
      keyvalues: {
        type: 'nft_image'
      }
    });
    formData.append('pinataMetadata', metadata);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'pinata_api_key': this.pinataApiKey!,
        'pinata_secret_api_key': this.pinataSecretKey!
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Pinata image upload failed: ${errorData}`);
    }

    const result = await response.json() as { IpfsHash: string };
    const ipfsHash = result.IpfsHash;
    
    logger.info('Image uploaded to Pinata', { ipfsHash, filename });
    return ipfsHash;
  }

  /**
   * Mock upload for development (when IPFS keys are not configured)
   */
  private async mockUpload(metadata: NFTMetadata): Promise<string> {
    // Generate a mock IPFS hash
    const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    logger.warn('Using mock IPFS upload (no Pinata keys configured)', { 
      mockHash,
      metadata: metadata.name 
    });
    
    // In a real implementation, you might store this in a local cache or database
    return mockHash;
  }

  /**
   * Mock image upload for development
   */
  private async mockImageUpload(filename: string): Promise<string> {
    // Generate a mock IPFS hash
    const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    logger.warn('Using mock IPFS image upload (no Pinata keys configured)', { 
      mockHash,
      filename 
    });
    
    return mockHash;
  }

  /**
   * Create NFT metadata object
   */
  createMetadata(options: {
    name: string;
    description: string;
    imageHash: string;
    merchantName: string;
    discountValue: number;
    discountType: string;
    rarity: string;
    expiryDate?: Date;
    termsAndConditions?: string;
  }): NFTMetadata {
    const {
      name,
      description,
      imageHash,
      merchantName,
      discountValue,
      discountType,
      rarity,
      expiryDate,
      termsAndConditions
    } = options;

    const attributes = [
      {
        trait_type: 'Merchant',
        value: merchantName
      },
      {
        trait_type: 'Discount Value',
        value: discountValue
      },
      {
        trait_type: 'Discount Type',
        value: discountType
      },
      {
        trait_type: 'Rarity',
        value: rarity
      }
    ];

    if (expiryDate) {
      attributes.push({
        trait_type: 'Expiry Date',
        value: expiryDate.toISOString().split('T')[0]
      });
    }

    if (termsAndConditions) {
      attributes.push({
        trait_type: 'Terms',
        value: termsAndConditions
      });
    }

    return {
      name,
      description,
      image: `${this.ipfsGateway}${imageHash}`,
      attributes,
      external_url: `${config.app?.baseUrl || 'https://hk-retail-nft.com'}/coupon/${imageHash}`
    };
  }

  /**
   * Get IPFS URL from hash
   */
  getIPFSUrl(hash: string): string {
    return `${this.ipfsGateway}${hash}`;
  }

  /**
   * Validate IPFS hash format
   */
  isValidIPFSHash(hash: string): boolean {
    // Basic IPFS hash validation (CIDv0 and CIDv1)
    const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
    const cidv1Regex = /^[a-z2-7]{59}$/;
    
    return cidv0Regex.test(hash) || cidv1Regex.test(hash);
  }

  /**
   * Pin existing content to ensure availability
   */
  async pinContent(ipfsHash: string): Promise<boolean> {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      logger.warn('Cannot pin content: Pinata keys not configured');
      return false;
    }

    try {
      const url = 'https://api.pinata.cloud/pinning/pinByHash';
      
      const data = {
        hashToPin: ipfsHash,
        pinataMetadata: {
          name: `pinned_${ipfsHash}`,
          keyvalues: {
            type: 'pinned_content'
          }
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.text();
        logger.error('Failed to pin content:', errorData);
        return false;
      }

      logger.info('Content pinned successfully', { ipfsHash });
      return true;
    } catch (error) {
      logger.error('Error pinning content:', error);
      return false;
    }
  }
}

export default IPFSService;
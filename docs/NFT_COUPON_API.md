# NFT Coupon Management API

This document describes the NFT Coupon Management API endpoints implemented as part of task 4.3.

## Overview

The NFT Coupon Management API provides functionality for:
- Creating NFT coupons with IPFS metadata storage
- Using coupons with blockchain integration
- Transferring coupons between users
- Recycling used coupons
- Querying coupon data and transaction history

## API Endpoints

### 1. Create Coupon NFT

**POST** `/api/v1/coupons`

Creates a new NFT coupon with metadata stored on IPFS and minted on the blockchain.

#### Request Body (multipart/form-data)

```json
{
  "merchantId": "uuid",
  "couponType": "percentage|fixed_amount|buy_one_get_one|free_item",
  "title": "string (3-255 chars)",
  "titleEn": "string (optional)",
  "titleZhCn": "string (optional)",
  "description": "string (optional, max 1000 chars)",
  "descriptionEn": "string (optional)",
  "descriptionZhCn": "string (optional)",
  "discountValue": "number (positive)",
  "discountType": "percentage|fixed_amount",
  "minimumPurchase": "number (optional, >= 0)",
  "maxQuantity": "integer (positive)",
  "rarity": "common|rare|epic|legendary (optional)",
  "expiryDate": "ISO 8601 date (optional, future)",
  "isTransferable": "boolean (optional)",
  "termsAndConditions": "string (optional, max 2000 chars)",
  "image": "file (optional, JPG/PNG/GIF/WebP, max 5MB)"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "tokenId": "string",
    "transactionHash": "string",
    "coupon": {
      "id": "uuid",
      "tokenId": "string",
      "merchantId": "uuid",
      "title": "string",
      "discountValue": "number",
      "metadataUri": "string",
      "imageUrl": "string",
      "createdAt": "ISO 8601 date"
    }
  },
  "message": "Coupon NFT created successfully"
}
```

### 2. Get Available Coupons

**GET** `/api/v1/coupons`

Retrieves available coupons with optional filtering and pagination.

#### Query Parameters

- `limit` (integer, 1-100, default: 20): Number of coupons to return
- `offset` (integer, >= 0, default: 0): Number of coupons to skip
- `merchantId` (uuid, optional): Filter by merchant
- `rarity` (string, optional): Filter by rarity level
- `minDiscount` (number, optional): Minimum discount value
- `maxDiscount` (number, optional): Maximum discount value

#### Response

```json
{
  "success": true,
  "data": {
    "coupons": [
      {
        "id": "uuid",
        "tokenId": "string",
        "merchantId": "uuid",
        "title": "string",
        "discountValue": "number",
        "discountType": "string",
        "rarity": "string",
        "expiryDate": "ISO 8601 date",
        "isUsed": false,
        "isActive": true
      }
    ],
    "pagination": {
      "total": "integer",
      "limit": "integer",
      "offset": "integer",
      "hasMore": "boolean"
    }
  }
}
```

### 3. Get Coupon Details

**GET** `/api/v1/coupons/{id}`

Retrieves detailed information about a specific coupon.

#### Response

```json
{
  "success": true,
  "data": {
    "coupon": {
      "id": "uuid",
      "tokenId": "string",
      "merchantId": "uuid",
      "currentOwnerId": "uuid",
      "title": "string",
      "description": "string",
      "discountValue": "number",
      "discountType": "string",
      "maxQuantity": "integer",
      "remainingQuantity": "integer",
      "rarity": "string",
      "expiryDate": "ISO 8601 date",
      "isUsed": "boolean",
      "isTransferable": "boolean",
      "metadataUri": "string",
      "imageUrl": "string",
      "createdAt": "ISO 8601 date"
    }
  }
}
```

### 4. Use Coupon

**POST** `/api/v1/coupons/{id}/use`

Uses a coupon NFT, marking it as used and executing the blockchain transaction.

#### Request Body

```json
{
  "userId": "uuid"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "transactionHash": "string",
    "transaction": {
      "id": "uuid",
      "userId": "uuid",
      "nftId": "uuid",
      "transactionType": "use",
      "transactionHash": "string",
      "status": "pending",
      "createdAt": "ISO 8601 date"
    }
  },
  "message": "Coupon used successfully"
}
```

### 5. Transfer Coupon

**POST** `/api/v1/coupons/{id}/transfer`

Transfers a coupon NFT from one user to another.

#### Request Body

```json
{
  "fromUserId": "uuid",
  "toUserId": "uuid"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "transactionHash": "string",
    "transaction": {
      "id": "uuid",
      "userId": "uuid",
      "nftId": "uuid",
      "transactionType": "transfer",
      "transactionHash": "string",
      "status": "pending",
      "createdAt": "ISO 8601 date"
    }
  },
  "message": "Coupon transferred successfully"
}
```

### 6. Validate Coupon

**GET** `/api/v1/coupons/{id}/validate`

Validates a coupon against both database and blockchain state.

#### Response

```json
{
  "success": true,
  "data": {
    "isValid": "boolean",
    "couponId": "uuid"
  }
}
```

### 7. Recycle Coupon

**POST** `/api/v1/coupons/{id}/recycle`

Recycles a used coupon back to the marketplace.

#### Response

```json
{
  "success": true,
  "data": {
    "transactionHash": "string",
    "transaction": {
      "id": "uuid",
      "transactionType": "recycle",
      "transactionHash": "string",
      "status": "pending",
      "createdAt": "ISO 8601 date"
    }
  },
  "message": "Coupon recycled successfully"
}
```

### 8. Get User Coupons

**GET** `/api/v1/users/{userId}/coupons`

Retrieves all coupons owned by a specific user.

#### Response

```json
{
  "success": true,
  "data": {
    "coupons": [
      {
        "id": "uuid",
        "tokenId": "string",
        "title": "string",
        "discountValue": "number",
        "isUsed": "boolean",
        "expiryDate": "ISO 8601 date"
      }
    ],
    "count": "integer"
  }
}
```

### 9. Get Merchant Coupons

**GET** `/api/v1/merchants/{merchantId}/coupons`

Retrieves all coupons created by a specific merchant.

#### Response

```json
{
  "success": true,
  "data": {
    "coupons": [
      {
        "id": "uuid",
        "tokenId": "string",
        "title": "string",
        "discountValue": "number",
        "totalMinted": "integer",
        "remainingQuantity": "integer",
        "isActive": "boolean"
      }
    ],
    "count": "integer"
  }
}
```

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": []
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Request validation failed
- `COUPON_NOT_FOUND`: Coupon does not exist
- `COUPON_EXPIRED`: Coupon has expired
- `COUPON_ALREADY_USED`: Coupon has already been used
- `INSUFFICIENT_PERMISSIONS`: User not authorized for this action
- `BLOCKCHAIN_ERROR`: Blockchain transaction failed
- `IPFS_ERROR`: IPFS upload/retrieval failed

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Rate Limiting

- General API calls: 100 requests per 15 minutes
- Blockchain operations: 10 requests per 15 minutes

## IPFS Integration

- Coupon metadata is stored on IPFS via Pinata
- Images are uploaded to IPFS and referenced in metadata
- Metadata follows ERC-721 standard format

## Blockchain Integration

- Smart contracts deployed on Polygon Mumbai testnet
- All NFT operations are recorded on-chain
- Transaction hashes are returned for tracking
- Gas fees are estimated and included in responses

## Database Schema

### coupon_nfts Table

Key fields:
- `id`: UUID primary key
- `token_id`: Blockchain token ID
- `merchant_id`: Creator merchant
- `current_owner_id`: Current owner
- `discount_value`: Discount amount
- `remaining_quantity`: Usage count
- `metadata_uri`: IPFS metadata URI

### transactions Table

Key fields:
- `id`: UUID primary key
- `user_id`: Transaction initiator
- `nft_id`: Related NFT (if applicable)
- `transaction_type`: Type of operation
- `transaction_hash`: Blockchain hash
- `status`: Transaction status

## Testing

Run the test suite:

```bash
npm test
```

Integration tests require:
- PostgreSQL database
- Redis instance
- Blockchain testnet access
- IPFS/Pinata configuration

## Configuration

Required environment variables:
- `BLOCKCHAIN_RPC_URL`: Blockchain network endpoint
- `BLOCKCHAIN_PRIVATE_KEY`: Wallet private key
- `CONTRACT_COUPON_NFT`: NFT contract address
- `PINATA_API_KEY`: IPFS service API key
- `PINATA_SECRET_KEY`: IPFS service secret

See `.env.example` for complete configuration.
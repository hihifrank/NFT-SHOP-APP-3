# 設計文檔

## 概述

香港零售業NFT優惠券平台是一個基於區塊鏈技術的移動應用程序，結合NFT數字資產與傳統優惠券系統。平台採用混合架構設計，包含移動端應用、後端API服務、區塊鏈智能合約和數據庫系統，為遊客和本地零售商提供創新的優惠券交易和店鋪發現體驗。

### 核心設計理念

- **NFT與優惠券雙重價值**：每個優惠券對應唯一NFT，提供實用性和收藏價值
- **循環經濟模式**：使用後的NFT重新進入市場流通，創造持續價值
- **多語言支持**：支持繁體中文、簡體中文和英文，適應香港多元化環境
- **離線優先**：考慮網絡不穩定情況，提供離線功能

## 架構

### 系統架構圖

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   移動應用端     │    │   Web管理端     │    │   商家管理端     │
│   (React Native)│    │   (React)       │    │   (React)       │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      API Gateway          │
                    │      (Express.js)         │
                    └─────────────┬─────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
┌─────────┴─────────┐   ┌─────────┴─────────┐   ┌─────────┴─────────┐
│   用戶服務        │   │   商家服務        │   │   NFT服務         │
│   (Node.js)       │   │   (Node.js)       │   │   (Node.js)       │
└─────────┬─────────┘   └─────────┬─────────┘   └─────────┬─────────┘
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │      數據層               │
                    └─────────────┬─────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
┌─────────┴─────────┐   ┌─────────┴─────────┐   ┌─────────┴─────────┐
│   PostgreSQL      │   │   Redis Cache     │   │   區塊鏈網絡       │
│   (主數據庫)       │   │   (緩存層)        │   │   (Polygon)       │
└───────────────────┘   └───────────────────┘   └───────────────────┘
```

### 技術棧選擇

**前端技術**
- React Native：跨平台移動應用開發，支持iOS和Android
- React：Web管理界面，提供響應式設計
- TypeScript：類型安全，提高代碼質量

**後端技術**
- Node.js + Express：高性能API服務
- PostgreSQL：關係型數據庫，處理複雜查詢
- Redis：緩存層，提升響應速度
- Socket.io：實時通信，支持抽獎和通知功能

**區塊鏈技術**
- Polygon網絡：低成本、高速度的以太坊側鏈
- Solidity：智能合約開發語言
- Web3.js：區塊鏈交互庫
- IPFS：去中心化存儲NFT元數據

## 組件和接口

### 核心組件

#### 1. NFT優惠券管理組件

**CouponNFTManager**
```typescript
interface CouponNFTManager {
  createCouponNFT(couponData: CouponData): Promise<NFTResult>
  useCoupon(nftId: string, userId: string): Promise<UsageResult>
  transferNFT(from: string, to: string, nftId: string): Promise<TransferResult>
  recycleCoupon(nftId: string): Promise<RecycleResult>
}
```

**設計決策**：將NFT和優惠券邏輯封裝在單一組件中，確保狀態同步和業務邏輯一致性。

#### 2. 抽獎系統組件

**LotterySystem**
```typescript
interface LotterySystem {
  createLottery(config: LotteryConfig): Promise<LotteryResult>
  participateInLottery(userId: string, lotteryId: string): Promise<ParticipationResult>
  drawWinner(lotteryId: string): Promise<WinnerResult>
  verifyRandomness(seed: string): Promise<VerificationResult>
}
```

**設計決策**：使用可驗證隨機函數(VRF)確保抽獎公平性，結合鏈上和鏈下邏輯優化性能。

#### 3. 店鋪發現組件

**StoreDiscovery**
```typescript
interface StoreDiscovery {
  findNearbyStores(location: GeoLocation, radius: number): Promise<Store[]>
  searchStores(criteria: SearchCriteria): Promise<Store[]>
  getStoreDetails(storeId: string): Promise<StoreDetails>
  updateStoreStatus(storeId: string, status: StoreStatus): Promise<UpdateResult>
}
```

**設計決策**：支持地理位置搜索和多條件篩選，包含NFT參與和非參與店鋪。

### API接口設計

#### 用戶相關API

```typescript
// 用戶註冊和認證
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/verify

// NFT和優惠券操作
GET /api/v1/user/nfts
POST /api/v1/coupons/use
POST /api/v1/nfts/transfer

// 抽獎功能
GET /api/v1/lotteries/active
POST /api/v1/lotteries/participate
GET /api/v1/lotteries/history
```

#### 商家相關API

```typescript
// 商家管理
POST /api/v1/merchant/register
PUT /api/v1/merchant/profile
GET /api/v1/merchant/analytics

// 優惠券管理
POST /api/v1/merchant/coupons/create
PUT /api/v1/merchant/coupons/update
GET /api/v1/merchant/coupons/statistics
```

## 數據模型

### 核心實體關係

```sql
-- 用戶表
CREATE TABLE users (
    id UUID PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    email VARCHAR(255),
    preferred_language VARCHAR(10) DEFAULT 'zh-HK',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 商家表
CREATE TABLE merchants (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    category VARCHAR(100),
    is_nft_participant BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- NFT優惠券表
CREATE TABLE coupon_nfts (
    id UUID PRIMARY KEY,
    token_id BIGINT UNIQUE NOT NULL,
    merchant_id UUID REFERENCES merchants(id),
    current_owner UUID REFERENCES users(id),
    coupon_type VARCHAR(50) NOT NULL,
    discount_value DECIMAL(10, 2),
    discount_type VARCHAR(20), -- 'percentage', 'fixed_amount'
    max_quantity INTEGER,
    remaining_quantity INTEGER,
    expiry_date TIMESTAMP,
    is_used BOOLEAN DEFAULT false,
    metadata_uri VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 抽獎表
CREATE TABLE lotteries (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    entry_fee DECIMAL(10, 2),
    total_prizes INTEGER,
    remaining_prizes INTEGER,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    random_seed VARCHAR(64)
);

-- 交易記錄表
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    nft_id UUID REFERENCES coupon_nfts(id),
    transaction_type VARCHAR(50), -- 'mint', 'transfer', 'use', 'recycle'
    transaction_hash VARCHAR(66),
    block_number BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 數據關係設計決策

1. **UUID主鍵**：使用UUID避免ID猜測攻擊，提高安全性
2. **地理位置索引**：為latitude和longitude建立複合索引，優化附近店鋪查詢
3. **軟刪除機制**：重要數據採用軟刪除，保留審計追蹤
4. **分區策略**：交易記錄表按時間分區，提高查詢性能

## 錯誤處理

### 錯誤分類和處理策略

#### 1. 區塊鏈相關錯誤

```typescript
enum BlockchainErrorType {
  INSUFFICIENT_GAS = 'INSUFFICIENT_GAS',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  NETWORK_CONGESTION = 'NETWORK_CONGESTION',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE'
}

class BlockchainErrorHandler {
  static handle(error: BlockchainError): ErrorResponse {
    switch(error.type) {
      case BlockchainErrorType.NETWORK_CONGESTION:
        return { 
          message: '網絡繁忙，請稍後重試',
          retryable: true,
          retryAfter: 30000
        }
      case BlockchainErrorType.INSUFFICIENT_GAS:
        return {
          message: 'Gas費用不足，請檢查錢包餘額',
          retryable: false
        }
    }
  }
}
```

#### 2. 業務邏輯錯誤

```typescript
enum BusinessErrorType {
  COUPON_EXPIRED = 'COUPON_EXPIRED',
  COUPON_ALREADY_USED = 'COUPON_ALREADY_USED',
  INSUFFICIENT_INVENTORY = 'INSUFFICIENT_INVENTORY',
  LOTTERY_NOT_ACTIVE = 'LOTTERY_NOT_ACTIVE'
}
```

#### 3. 系統錯誤處理

- **數據庫連接失敗**：自動重試機制，最多3次
- **第三方服務不可用**：降級服務，使用緓存數據
- **內存不足**：清理緩存，記錄警告日誌

### 錯誤恢復機制

1. **事務回滾**：區塊鏈交易失敗時，回滾數據庫狀態
2. **補償機制**：NFT轉移失敗時，自動退還費用
3. **監控告警**：關鍵錯誤觸發實時通知

## 測試策略

### 測試金字塔

#### 1. 單元測試 (70%)
- **智能合約測試**：使用Hardhat框架測試合約邏輯
- **API端點測試**：Jest + Supertest測試REST API
- **業務邏輯測試**：核心算法和數據處理邏輯

```typescript
// 示例：NFT創建測試
describe('CouponNFT Creation', () => {
  it('should create NFT with correct metadata', async () => {
    const couponData = {
      merchantId: 'merchant-123',
      discountValue: 20,
      discountType: 'percentage',
      maxQuantity: 100
    }
    
    const result = await couponNFTManager.createCouponNFT(couponData)
    
    expect(result.success).toBe(true)
    expect(result.tokenId).toBeDefined()
    expect(result.metadata.discount).toBe(20)
  })
})
```

#### 2. 集成測試 (20%)
- **API集成測試**：測試完整的用戶流程
- **區塊鏈集成測試**：使用測試網絡驗證智能合約交互
- **數據庫集成測試**：驗證數據一致性和事務處理

#### 3. 端到端測試 (10%)
- **用戶旅程測試**：使用Detox測試完整用戶流程
- **跨平台測試**：iOS和Android平台兼容性測試
- **性能測試**：負載測試和壓力測試

### 測試環境配置

```yaml
# 測試環境配置
test_environments:
  unit:
    database: in_memory_sqlite
    blockchain: hardhat_local
    
  integration:
    database: postgresql_test
    blockchain: polygon_mumbai
    
  e2e:
    database: postgresql_staging
    blockchain: polygon_mumbai
    mobile_devices: [ios_simulator, android_emulator]
```

### 安全測試

1. **智能合約安全審計**：使用MythX和Slither進行自動化安全檢測
2. **API安全測試**：OWASP ZAP掃描常見漏洞
3. **數據隱私測試**：驗證個人資料保護合規性
4. **滲透測試**：定期進行第三方安全評估

### 性能測試指標

- **API響應時間**：95%請求在200ms內完成
- **區塊鏈交易確認**：平均30秒內確認
- **移動應用啟動時間**：3秒內完成初始化
- **並發用戶支持**：支持10,000並發用戶

這個設計文檔全面覆蓋了需求文檔中的所有功能點，並提供了詳細的技術實現方案。設計重點考慮了香港本地化需求、區塊鏈技術特點和移動應用的用戶體驗。
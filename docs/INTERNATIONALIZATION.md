# 國際化系統文檔 (Internationalization Documentation)

## 概述 (Overview)

香港零售業NFT優惠券平台支援多語言功能，包括繁體中文、簡體中文和英文。本文檔詳細說明如何使用和管理國際化系統。

The Hong Kong Retail NFT Coupon Platform supports multilingual functionality including Traditional Chinese, Simplified Chinese, and English. This document details how to use and manage the internationalization system.

## 支援的語言 (Supported Languages)

| 語言代碼 | 語言名稱 | Language Code | Language Name |
|---------|---------|---------------|---------------|
| zh-HK   | 繁體中文 | zh-HK         | Traditional Chinese |
| zh-CN   | 簡體中文 | zh-CN         | Simplified Chinese |
| en      | 英文     | en            | English |

## 系統架構 (System Architecture)

### 核心組件 (Core Components)

1. **i18n 配置** (`src/config/i18n.ts`)
   - 初始化 i18next
   - 語言檢測和切換
   - 翻譯函數

2. **語言檢測中間件** (`src/middleware/i18n.ts`)
   - 自動檢測用戶語言偏好
   - 設置請求語言上下文
   - 提供本地化響應助手

3. **內容管理服務** (`src/services/ContentManagementService.ts`)
   - 動態管理翻譯內容
   - 匯入/匯出翻譯
   - 命名空間管理

4. **API 端點**
   - 語言切換 API (`/api/v1/languages`)
   - 內容管理 API (`/api/v1/content`)

### 翻譯文件結構 (Translation File Structure)

```
src/locales/
├── zh-HK/          # 繁體中文
│   ├── common.json
│   ├── api.json
│   ├── coupons.json
│   ├── merchants.json
│   ├── lotteries.json
│   └── errors.json
├── zh-CN/          # 簡體中文
│   └── ... (same structure)
└── en/             # 英文
    └── ... (same structure)
```

## 使用方法 (Usage)

### 1. 在控制器中使用翻譯 (Using Translations in Controllers)

```typescript
import { Request, Response } from 'express';
import { getLocalizedResponse, getLocalizedErrorResponse } from '../middleware/i18n';

export class ExampleController {
  static async getExample(req: Request, res: Response): Promise<void> {
    try {
      // 使用翻譯函數
      const message = req.t('common:messages.success');
      
      // 使用本地化響應助手
      const response = getLocalizedResponse(
        req,
        'api:responses.success',
        { data: 'example' }
      );
      
      res.status(200).json(response);
    } catch (error) {
      const errorResponse = getLocalizedErrorResponse(
        req,
        'internalError',
        500
      );
      res.status(500).json(errorResponse);
    }
  }
}
```

### 2. 語言檢測優先級 (Language Detection Priority)

1. **查詢參數** (Query Parameter): `?lang=zh-HK`
2. **自定義標頭** (Custom Header): `X-Language: zh-HK`
3. **Accept-Language 標頭** (Accept-Language Header)
4. **預設語言** (Default Language): `zh-HK`

### 3. API 使用示例 (API Usage Examples)

#### 獲取支援的語言 (Get Supported Languages)
```bash
GET /api/v1/languages
```

#### 切換語言 (Change Language)
```bash
POST /api/v1/languages/change
Content-Type: application/json

{
  "language": "zh-CN"
}
```

#### 獲取翻譯內容 (Get Translations)
```bash
GET /api/v1/languages/translations/common?language=en
```

### 4. 內容管理 (Content Management)

#### 創建新的翻譯項目 (Create New Translation Item)
```bash
POST /api/v1/content/common/new.key
Content-Type: application/json

{
  "translations": {
    "zh-HK": "繁體中文內容",
    "zh-CN": "简体中文内容",
    "en": "English Content"
  },
  "description": "Description of the content item"
}
```

#### 更新翻譯項目 (Update Translation Item)
```bash
PUT /api/v1/content/common/existing.key
Content-Type: application/json

{
  "translations": {
    "zh-HK": "更新的繁體中文內容"
  }
}
```

## 翻譯鍵值命名規範 (Translation Key Naming Convention)

### 命名空間 (Namespaces)
- `common`: 通用翻譯（導航、按鈕、狀態等）
- `api`: API 響應消息
- `coupons`: 優惠券相關翻譯
- `merchants`: 商家相關翻譯
- `lotteries`: 抽獎相關翻譯
- `errors`: 錯誤消息

### 鍵值結構 (Key Structure)
使用點號分隔的層次結構：
```
namespace:category.subcategory.item
```

示例：
```
common:navigation.home
api:responses.success
coupons:actions.useCoupon
errors:validation.required
```

## 助手函數 (Helper Functions)

### 1. 翻譯助手 (Translation Helpers)

```typescript
import { 
  getTranslator, 
  getLocalizedField, 
  createLocalizedResponse,
  formatCurrency,
  formatDate 
} from '../utils/i18nHelper';

// 獲取翻譯函數
const t = getTranslator(req);
const message = t('common:messages.success');

// 格式化貨幣
const price = formatCurrency(req, 100.50, 'HKD');

// 格式化日期
const date = formatDate(req, new Date());
```

### 2. 多語言字段處理 (Multilingual Field Handling)

```typescript
// 假設數據庫對象有多語言字段
const merchant = {
  name_zh_HK: '商家名稱',
  name_zh_CN: '商家名称',
  name_en: 'Merchant Name',
  description_zh_HK: '商家描述',
  // ...
};

// 獲取本地化字段值
const localizedName = getLocalizedField(req, merchant, 'name');
const localizedDescription = getLocalizedField(req, merchant, 'description');
```

## 最佳實踐 (Best Practices)

### 1. 翻譯內容編寫 (Writing Translation Content)

- **保持一致性**: 在所有語言中使用相同的語調和風格
- **考慮文化差異**: 適應不同文化背景的用戶
- **簡潔明了**: 避免過長的翻譯文本
- **上下文相關**: 確保翻譯符合使用場景

### 2. 代碼實踐 (Code Practices)

- **使用命名空間**: 組織翻譯鍵值，避免衝突
- **錯誤處理**: 提供翻譯失敗時的後備方案
- **性能考慮**: 避免在循環中重複調用翻譯函數
- **類型安全**: 使用 TypeScript 確保翻譯鍵值的正確性

### 3. 測試 (Testing)

```typescript
// 測試多語言響應
describe('Multilingual API', () => {
  it('should return Chinese response', async () => {
    const response = await request(app)
      .get('/api/v1/example')
      .set('X-Language', 'zh-HK')
      .expect(200);
    
    expect(response.body.language).toBe('zh-HK');
    expect(response.body.message).toBe('請求成功');
  });
});
```

## 部署和維護 (Deployment and Maintenance)

### 1. 翻譯文件管理 (Translation File Management)

- 定期備份翻譯文件
- 使用版本控制追蹤翻譯變更
- 建立翻譯審核流程

### 2. 性能優化 (Performance Optimization)

- 啟用翻譯緩存
- 按需加載翻譯命名空間
- 壓縮翻譯文件

### 3. 監控和日誌 (Monitoring and Logging)

- 監控翻譯加載錯誤
- 記錄語言切換統計
- 追蹤缺失的翻譯鍵值

## 故障排除 (Troubleshooting)

### 常見問題 (Common Issues)

1. **翻譯不顯示**
   - 檢查翻譯鍵值是否正確
   - 確認翻譯文件是否存在
   - 驗證語言代碼是否支援

2. **語言切換失效**
   - 檢查中間件是否正確配置
   - 驗證語言檢測邏輯
   - 確認 i18n 初始化狀態

3. **性能問題**
   - 檢查翻譯文件大小
   - 優化翻譯加載策略
   - 啟用適當的緩存機制

## 擴展功能 (Extension Features)

### 1. 添加新語言 (Adding New Languages)

1. 在 `SUPPORTED_LANGUAGES` 中添加語言代碼
2. 創建對應的翻譯文件目錄
3. 複製並翻譯所有命名空間文件
4. 更新測試用例

### 2. 動態翻譯加載 (Dynamic Translation Loading)

```typescript
// 實現按需加載翻譯
const loadTranslation = async (language: string, namespace: string) => {
  const translations = await import(`../locales/${language}/${namespace}.json`);
  return translations.default;
};
```

### 3. 翻譯管理界面 (Translation Management UI)

考慮開發 Web 界面用於：
- 可視化編輯翻譯
- 批量匯入/匯出
- 翻譯進度追蹤
- 協作翻譯工作流

## 結論 (Conclusion)

本國際化系統提供了完整的多語言支援，包括自動語言檢測、動態內容管理和豐富的 API 接口。通過遵循最佳實踐和使用提供的助手函數，開發者可以輕鬆創建多語言應用程序，為不同語言背景的用戶提供優質的體驗。

This internationalization system provides comprehensive multilingual support, including automatic language detection, dynamic content management, and rich API interfaces. By following best practices and using the provided helper functions, developers can easily create multilingual applications that provide excellent experiences for users from different linguistic backgrounds.
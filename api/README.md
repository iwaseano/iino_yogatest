# ヨガレッスン予約システム API

Azure Functions (Python) を使用したヨガスタジオのレッスン予約管理システムです。

## 🏗️ アーキテクチャ

- **Azure Functions**: HTTPトリガーによるRESTful API
- **Azure Blob Storage**: JSON形式での予約データ永続化
- **Managed Identity**: セキュアな認証
- **Pydantic**: データバリデーション

## 📋 機能

### API エンドポイント

#### 1. ヘルスチェック
```
GET /api/health
```

#### 2. 新規予約作成
```
POST /api/reservations
Content-Type: application/json

{
  "class_name": "ハタヨガ",
  "class_schedule": "月・水・金 10:00-11:00",
  "booking_date": "2025-08-15",
  "customer_name": "田中太郎",
  "customer_email": "tanaka@example.com",
  "customer_phone": "090-1234-5678",
  "booking_notes": "初回参加です"
}
```

#### 3. 予約検索（ID）
```
GET /api/reservations/{reservation_id}
```

#### 4. 予約検索（メール）
```
GET /api/reservations/search?email=customer@example.com
```

#### 5. 予約キャンセル
```
POST /api/reservations/{reservation_id}/cancel
Content-Type: application/json

{
  "email": "customer@example.com"
}
```

#### 6. クラススケジュール取得
```
GET /api/classes
```

#### 7. 空き状況確認
```
GET /api/classes/{class_type}/availability?date=2025-08-15
```

## 🎯 利用可能なクラス

| クラス | スケジュール | 定員 | レベル |
|--------|--------------|------|--------|
| ハタヨガ | 月・水・金 10:00-11:00 | 12名 | 初心者〜中級者 |
| パワーヨガ | 火・木・土 19:00-20:00 | 10名 | 中級者〜上級者 |
| リストラティブヨガ | 日 17:00-18:30 | 8名 | すべてのレベル |

## 🛠️ 開発環境のセットアップ

### 1. 前提条件
- Python 3.9+
- Azure Functions Core Tools
- Azure CLI

### 2. 依存関係のインストール
```bash
pip install -r requirements.txt
```

### 3. 環境変数の設定
`local.settings.json` を編集：
```json
{
  "Values": {
    "AZURE_STORAGE_ACCOUNT_NAME": "your-storage-account",
    "AZURE_CLIENT_ID": "your-client-id",
    "AZURE_CLIENT_SECRET": "your-client-secret",
    "AZURE_TENANT_ID": "your-tenant-id"
  }
}
```

### 4. ローカル実行
```bash
func start
```

## 🔧 Azure リソースのセットアップ

### 1. ストレージアカウントの作成
```bash
az storage account create \
  --name yogastorageaccount \
  --resource-group yoga-rg \
  --location japaneast \
  --sku Standard_LRS
```

### 2. Function App の作成
```bash
az functionapp create \
  --resource-group yoga-rg \
  --consumption-plan-location japaneast \
  --runtime python \
  --runtime-version 3.9 \
  --functions-version 4 \
  --name yoga-reservation-api \
  --storage-account yogastorageaccount
```

### 3. Managed Identity の有効化
```bash
az functionapp identity assign \
  --name yoga-reservation-api \
  --resource-group yoga-rg
```

### 4. ストレージアクセス権限の付与
```bash
az role assignment create \
  --assignee <managed-identity-principal-id> \
  --role "Storage Blob Data Contributor" \
  --scope /subscriptions/<subscription-id>/resourceGroups/yoga-rg/providers/Microsoft.Storage/storageAccounts/yogastorageaccount
```

## 🔒 セキュリティ機能

- **Managed Identity**: キーレス認証
- **HTTPS**: 暗号化通信
- **データバリデーション**: Pydanticによる厳密な検証
- **CORS**: クロスオリジン制御
- **メール認証**: キャンセル時の本人確認

## 📊 ログとモニタリング

- Application Insights統合
- 構造化ログ出力
- エラートラッキング
- パフォーマンス監視

## 🧪 テスト

```bash
# ユニットテスト実行
pytest tests/

# カバレッジレポート
pytest --cov=. tests/
```

## 📦 デプロイ

```bash
# Azure Functions へのデプロイ
func azure functionapp publish yoga-reservation-api
```

## 📝 データ構造

### 予約データ例
```json
{
  "id": "uuid4-string",
  "class_name": "ハタヨガ",
  "class_schedule": "月・水・金 10:00-11:00",
  "booking_date": "2025-08-15",
  "customer_name": "田中太郎",
  "customer_email": "tanaka@example.com",
  "customer_phone": "090-1234-5678",
  "booking_notes": "初回参加です",
  "created_at": "2025-08-01T10:00:00Z",
  "status": "confirmed"
}
```

## 🚀 パフォーマンス最適化

- 接続プーリング
- 指数バックオフによるリトライ
- インデックスファイルによる検索高速化
- バッチ処理対応

## 🔄 今後の拡張予定

- [ ] リアルタイム定員管理
- [ ] メール通知機能
- [ ] 決済システム統合
- [ ] インストラクタースケジュール管理
- [ ] レポート機能
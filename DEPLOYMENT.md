# ヨガ教室予約システム - デプロイメントガイド

## アーキテクチャ概要

このシステムは以下のAzureサービスを使用します：

- **Azure Static Web Apps**: フロントエンド（HTML/CSS/JavaScript）のホスティング
- **Azure Functions (Python)**: 予約管理API
- **Azure Storage Account**: 予約データ（JSON）の保存
- **Managed Identity**: セキュアなサービス間通信
- **Application Insights**: 監視とログ管理

## 前提条件

1. Azure CLI がインストールされていること
2. Azure Developer CLI (azd) がインストールされていること
3. Python 3.11 がインストールされていること
4. Azureサブスクリプションへのアクセス権限

## デプロイ手順

### 1. プロジェクトの初期化

```powershell
# プロジェクトディレクトリに移動
cd c:\Users\owner\Documents\project\yoga

# Azure Developer CLIでログイン
azd auth login

# プロジェクトの初期化
azd init
```

### 2. 環境の設定

```powershell
# 環境変数の設定
azd env new dev

# リージョンとサブスクリプションの設定
azd env set AZURE_LOCATION japaneast
azd env set AZURE_SUBSCRIPTION_ID <your-subscription-id>
```

### 3. インフラストラクチャとアプリケーションのデプロイ

```powershell
# 全体のデプロイ（初回）
azd up

# または段階的にデプロイ
azd provision  # インフラのみ
azd deploy     # アプリケーションのみ
```

### 4. Static Web Apps の設定

デプロイ後、以下の設定を行います：

1. Azure PortalでStatic Web Appを開く
2. 「Configuration」で以下の環境変数を設定：
   ```
   FUNCTION_APP_URL=<function-app-url>
   ```

### 5. Function App の確認

1. Azure PortalでFunction Appを開く
2. 「Functions」でAPIエンドポイントが正常にデプロイされていることを確認
3. 「Application Insights」でログとメトリクスを確認

## API エンドポイント

デプロイ後、以下のAPIエンドポイントが利用可能になります：

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| POST | `/api/reservations` | 新規予約作成 |
| GET | `/api/reservations` | 予約一覧取得 |
| GET | `/api/reservations?email={email}` | メールアドレスで検索 |
| GET | `/api/reservations/{id}` | 特定予約取得 |
| PUT | `/api/reservations/{id}` | 予約更新 |
| DELETE | `/api/reservations/{id}` | 予約キャンセル |
| GET | `/api/reservations/summary` | 統計情報取得 |

## セキュリティ考慮事項

1. **Managed Identity**: Function AppはManaged Identityを使用してStorage Accountにアクセス
2. **HTTPS Only**: すべての通信はHTTPS必須
3. **CORS設定**: Static Web Appからのアクセスのみ許可
4. **入力検証**: Pydanticを使用した厳密な入力検証
5. **エラーハンドリング**: 適切なエラーレスポンスとログ出力

## 監視とメンテナンス

### Application Insights でのモニタリング

1. **パフォーマンス**: レスポンス時間とスループットを監視
2. **エラー率**: APIエラーとクライアントエラーを追跡
3. **利用状況**: 予約の傾向と利用パターンを分析

### ログの確認

```powershell
# Function Appのログを確認
azd logs

# または Azure CLIで確認
az functionapp log tail --name <function-app-name> --resource-group <resource-group-name>
```

### バックアップ

予約データは自動的にAzure Storage内でバックアップが作成されます：
- メインファイル: `reservations.json`
- バックアップ: `reservations_backup_YYYYMMDD_HHMMSS.json`

## トラブルシューティング

### よくある問題

1. **Function Appのデプロイエラー**
   - Python依存関係の確認: `requirements.txt`の内容を確認
   - Runtime設定の確認: Python 3.11が選択されているか確認

2. **Storage Accountへのアクセスエラー**
   - Managed Identityの権限確認
   - Storage Accountのファイアウォール設定確認

3. **CORS エラー**
   - Function AppのCORS設定でStatic Web AppのURLが許可されているか確認
   - ブラウザの開発者ツールでネットワークエラーを確認

### ローカル開発

```powershell
# Function Appをローカルで実行
cd api
func host start

# Static Web Appをローカルで実行（別ターミナル）
# Live Server拡張やpython -m http.serverを使用
python -m http.server 8000
```

## コスト最適化

- **Static Web App**: 無料プラン利用可能
- **Function App**: 従量課金プラン（Y1）で開始
- **Storage Account**: LRS（ローカル冗長）で十分
- **Application Insights**: サンプリング設定で調整可能

## スケーリング考慮事項

システムの成長に応じて以下の調整を検討：

1. **Function App**: Premium プラン（EP1/EP2）への移行
2. **Storage Account**: より高性能なストレージ階層への移行
3. **データベース**: 大量データの場合はCosmos DBへの移行検討
4. **CDN**: グローバル展開時のパフォーマンス向上

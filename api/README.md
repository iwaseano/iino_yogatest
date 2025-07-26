# Yoga Reservation API

## 概要
ヨガ教室のレッスン予約を管理するAzure Functions (Python) APIです。

## 機能
- 予約の作成・取得・更新・削除
- 予約情報のJSONファイルによるストレージ管理
- Managed Identityによるセキュアなストレージアクセス

## API エンドポイント

### 予約管理
- `POST /api/reservations` - 新規予約作成
- `GET /api/reservations` - 予約一覧取得
- `GET /api/reservations/{reservation_id}` - 特定予約取得
- `PUT /api/reservations/{reservation_id}` - 予約更新
- `DELETE /api/reservations/{reservation_id}` - 予約削除（キャンセル）

### 検索・フィルタリング
- `GET /api/reservations/search?email={email}` - メールアドレスによる検索
- `GET /api/reservations/date/{date}` - 日付による検索

## 環境変数
- `STORAGE_ACCOUNT_NAME` - Azureストレージアカウント名
- `STORAGE_CONTAINER_NAME` - JSONファイルを保存するコンテナ名（デフォルト: reservations）

## セキュリティ
- Managed Identityを使用したストレージアクセス
- CORSポリシーの適切な設定
- 入力値のバリデーション
- エラーハンドリングと適切なログ出力

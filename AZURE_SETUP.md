# Azure Static Web Apps セットアップガイド

## 前提条件
- Azure アカウント
- GitHub アカウント
- このリポジトリへのアクセス権限

## 1. Azure Static Web Apps リソースの作成

### Azure Portal での作成手順

1. **Azure Portal** (https://portal.azure.com) にログイン

2. **静的 Web アプリ** を検索して選択

3. **作成** をクリック

4. **基本** タブで以下を設定：
   - **リソース グループ**: 新規作成または既存のものを選択
   - **名前**: `yoga-reservation-app`（任意の名前）
   - **ホスティング プラン**: Free
   - **Azure Functions とステージングの詳細**: アジア太平洋
   - **デプロイの詳細**:
     - **ソース**: GitHub
     - **GitHub アカウント**: あなたのアカウントを接続
     - **組織**: `iwaseano`
     - **リポジトリ**: `iino_yogatest`
     - **ブランチ**: `main`

5. **ビルドの詳細** タブで以下を設定：
   - **ビルド プリセット**: カスタム
   - **アプリの場所**: `/`
   - **API の場所**: `api`
   - **出力場所**: `.`

6. **確認と作成** → **作成**

## 2. デプロイトークンの確認

作成後、Azure Portal で：

1. 作成した Static Web Apps リソースを開く
2. **概要** ページで **デプロイ トークンの管理** をクリック
3. トークンをコピー

## 3. GitHub シークレットの設定

GitHub リポジトリで：

1. **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** をクリック
3. 名前: `AZURE_STATIC_WEB_APPS_API_TOKEN_LIVELY_WATER_000D5A100`
4. 値: コピーしたデプロイトークン
5. **Add secret** をクリック

## 4. デプロイの確認

1. GitHub の **Actions** タブでワークフローの実行状況を確認
2. 成功したら Azure Portal で URL を確認
3. アプリケーションが正常に動作することを確認

## 5. API の動作確認

以下のエンドポイントが利用可能になります：

- `GET /api/reservations` - 予約一覧取得
- `POST /api/reservations` - 新規予約作成
- `GET /api/reservations/{id}` - 特定予約取得
- `PUT /api/reservations/{id}` - 予約更新
- `DELETE /api/reservations/{id}` - 予約削除
- `GET /api/summary` - 予約統計取得

## トラブルシューティング

### よくある問題

1. **API が認識されない**
   - GitHub Actions ワークフローで `api_location: "api"` が設定されているか確認
   - `api` フォルダに `function_app.py` と `requirements.txt` があるか確認

2. **デプロイが失敗する**
   - GitHub シークレットが正しく設定されているか確認
   - ワークフローファイルのトークン名が正しいか確認

3. **Function App のビルドエラー**
   - `requirements.txt` の依存関係を確認
   - Python のバージョンが 3.11 に設定されているか確認

### ログの確認方法

1. **GitHub Actions ログ**: GitHub の Actions タブで詳細ログを確認
2. **Azure ログ**: Azure Portal の Static Web Apps で Functions ログを確認
3. **Application Insights**: より詳細な分析が必要な場合

## 参考リンク

- [Azure Static Web Apps ドキュメント](https://docs.microsoft.com/ja-jp/azure/static-web-apps/)
- [Azure Functions Python ガイド](https://docs.microsoft.com/ja-jp/azure/azure-functions/functions-reference-python)
- [GitHub Actions ワークフロー](https://docs.github.com/ja/actions)

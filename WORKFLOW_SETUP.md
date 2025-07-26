# GitHub Actions ワークフロー再有効化手順

## デプロイトークン設定後の手順

### 1. Azure Static Web Apps ワークフローの再有効化

**ファイル**: `.github/workflows/azure-static-web-apps-lively-water-000d5a100.yml`

**変更箇所**:

```yaml
# 現在（無効化状態）:
on:
  workflow_dispatch: # 手動実行のみ（デプロイトークン設定後に有効化）
  # push:
  #   branches:
  #     - main
  # pull_request:
  #   types: [opened, synchronize, reopened, closed]
  #   branches:
  #     - main

# 変更後（有効化状態）:
on:
  workflow_dispatch: # 手動実行も可能
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main
```

**ジョブ条件の変更**:

```yaml
# 現在:
build_and_deploy_job:
  if: github.event_name == 'workflow_dispatch'

# 変更後:
build_and_deploy_job:
  if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed') || github.event_name == 'workflow_dispatch'
```

```yaml
# 現在:
close_pull_request_job:
  if: false # 現在無効化中

# 変更後:
close_pull_request_job:
  if: github.event_name == 'pull_request' && github.event.action == 'closed'
```

### 2. 変更をコミット・プッシュ

```bash
git add .github/workflows/azure-static-web-apps-lively-water-000d5a100.yml
git commit -m "Re-enable Azure Static Web Apps auto-deployment"
git push origin main
```

### 3. デプロイメントの確認

1. **GitHub Actions タブ**でワークフローの実行を確認
2. **Azure Portal**で Static Web Apps のデプロイメント状況を確認
3. **アプリケーションURL**でサイトの動作を確認

### 4. API エンドポイントのテスト

デプロイ完了後、以下のエンドポイントが利用可能になります：

```
https://your-static-web-app.azurestaticapps.net/api/reservations
https://your-static-web-app.azurestaticapps.net/api/summary
```

## トラブルシューティング

### よくある問題

1. **GitHub Secret の名前が間違っている**
   - 正確に `AZURE_STATIC_WEB_APPS_API_TOKEN_LIVELY_WATER_000D5A100` と入力

2. **ワークフローが実行されない**
   - on: セクションのコメントアウトが正しく解除されているか確認

3. **API のビルドに失敗する**
   - `api/requirements.txt` の依存関係を確認
   - Python 3.11 が使用されているか確認

### ログの確認

- **GitHub Actions**: リポジトリの Actions タブ
- **Azure Portal**: Static Web Apps → Functions → ログ
- **ブラウザ**: Developer Tools の Network タブでAPI呼び出しを確認

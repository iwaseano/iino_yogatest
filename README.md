# Serenity Yoga Studio

心と体のバランスを整えるヨガスタジオのウェブサイト

## 🌟 特徴

- **レスポンシブデザイン** - スマートフォン、タブレット、デスクトップ対応
- **オンライン予約システム** - データベース不要のローカルストレージベース
- **PWA対応** - オフライン機能とアプリライクな体験
- **高パフォーマンス** - 最適化されたコードと画像
- **SEO対応** - 検索エンジン最適化済み

## 🚀 Azure Static Web Apps へのデプロイ

### 前提条件

- Node.js 18以上
- Azure サブスクリプション
- GitHub アカウント

### 手順

1. **リポジトリのクローン**
   ```bash
   git clone <your-repo-url>
   cd serenity-yoga-studio
   ```

2. **依存関係のインストール**
   ```bash
   npm install
   ```

3. **ローカル開発サーバーの起動**
   ```bash
   npm run dev
   ```

4. **Azure Static Web Apps CLI のセットアップ**
   ```bash
   npx swa init --yes
   ```

5. **ビルドとデプロイ**
   ```bash
   npm run build
   npm run deploy
   ```

### 環境変数

本番環境では以下の環境変数を設定してください：

- `AZURE_STATIC_WEB_APPS_API_TOKEN` - Azure Static Web Apps の API トークン

## 📁 プロジェクト構造

```
serenity-yoga-studio/
├── index.html              # メインページ
├── admin.html              # 管理者ページ
├── 404.html               # エラーページ
├── styles.css             # スタイルシート
├── script.js              # JavaScript機能
├── sw.js                  # Service Worker
├── manifest.json          # PWA マニフェスト
├── staticwebapp.config.json # Azure Static Web Apps 設定
├── package.json           # NPM設定
├── .github/workflows/     # GitHub Actions
│   └── azure-static-web-apps.yml
└── images/               # 画像ファイル（将来追加）
```

## 🔧 開発

### NPM スクリプト

- `npm run dev` - 開発サーバー起動
- `npm run build` - 本番用ビルド
- `npm run deploy` - Azure へデプロイ
- `npm start` - ローカルサーバー起動
- `npm run clean` - ビルドファイル削除

### 機能一覧

#### ユーザー機能
- クラス予約
- 予約確認・キャンセル
- お問い合わせフォーム
- レスポンシブナビゲーション

#### 管理者機能
- 予約一覧表示
- データエクスポート（CSV）
- 統計ダッシュボード
- データ管理

## 🛠️ カスタマイズ

### スタイルの変更

`styles.css` の CSS カスタムプロパティを変更：

```css
:root {
    --primary-color: #6b8e7f;
    --secondary-color: #a8c09a;
    --accent-color: #e8b86d;
    /* その他の色設定 */
}
```

### コンテンツの更新

1. **クラス情報** - `index.html` のクラスセクションを編集
2. **インストラクター情報** - インストラクターセクションを更新
3. **料金設定** - 料金セクションを変更
4. **連絡先情報** - お問い合わせセクションを更新

## 📊 監視とAnalytics

- Service Worker によるパフォーマンス監視
- Azure Application Insights 対応準備済み
- リアルタイム使用状況トラッキング

## 🔒 セキュリティ

- Content Security Policy (CSP) 設定済み
- XSS 攻撃対策
- データ検証とサニタイゼーション
- 管理者ページの認証保護

## 📱 PWA機能

- オフライン対応
- ホーム画面への追加
- プッシュ通知対応準備
- アプリライクなユーザー体験

## 🚀 パフォーマンス最適化

- 画像最適化
- CSS/JavaScript ミニフィケーション
- キャッシュ戦略
- 遅延読み込み

## 📞 サポート

技術的な問題や質問がある場合は、GitHubのIssuesで報告してください。

## 📄 ライセンス

MIT License

---

**Serenity Yoga Studio** - 心と体のバランスを整える場所

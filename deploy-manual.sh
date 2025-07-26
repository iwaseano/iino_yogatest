#!/bin/bash

# Azure Static Web Apps 手動デプロイスクリプト
# 
# 使用方法:
# 1. Azure CLI にログイン: az login
# 2. このスクリプトを実行: ./deploy-manual.sh
#
# 注意: Azure Static Web Apps のデプロイトークンが必要です

echo "🚀 Azure Static Web Apps へのデプロイを開始します..."

# 必要な変数を設定
RESOURCE_GROUP="your-resource-group-name"
STATIC_WEB_APP_NAME="your-static-web-app-name"
APP_LOCATION="/"
API_LOCATION="api"
OUTPUT_LOCATION="."

# Azure CLI でデプロイを実行
echo "📦 アプリケーションをビルド中..."
npm run build

echo "🌐 Azure Static Web Apps にデプロイ中..."
az staticwebapp deploy \
  --name $STATIC_WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --source .

echo "✅ デプロイが完了しました！"
echo "🔗 アプリケーションURL: https://$STATIC_WEB_APP_NAME.azurestaticapps.net"

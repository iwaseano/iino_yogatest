# Azure Static Web Apps 手動セットアップスクリプト
# PowerShell用

# 設定変数
$ResourceGroupName = "yoga-reservation-rg"
$StaticWebAppName = "yoga-reservation-swa"
$Location = "eastasia"
$GitHubRepo = "iwaseano/iino_yogatest"
$GitHubBranch = "main"

Write-Host "🚀 Azure Static Web Apps リソースを作成しています..." -ForegroundColor Green

# Azure にログイン（まだログインしていない場合）
Write-Host "Azure CLI にログインしています..." -ForegroundColor Yellow
az login

# リソースグループの作成
Write-Host "リソースグループを作成しています..." -ForegroundColor Yellow
az group create --name $ResourceGroupName --location $Location

# Azure Static Web Apps の作成
Write-Host "Azure Static Web Apps を作成しています..." -ForegroundColor Yellow
$StaticWebApp = az staticwebapp create `
    --name $StaticWebAppName `
    --resource-group $ResourceGroupName `
    --source $GitHubRepo `
    --location $Location `
    --branch $GitHubBranch `
    --app-location "/" `
    --api-location "api" `
    --output-location "." `
    --login-with-github

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Azure Static Web Apps が正常に作成されました！" -ForegroundColor Green
    
    # デプロイトークンの取得
    Write-Host "デプロイトークンを取得しています..." -ForegroundColor Yellow
    $DeploymentToken = az staticwebapp secrets list --name $StaticWebAppName --resource-group $ResourceGroupName --query "properties.apiKey" --output tsv
    
    Write-Host "🔑 デプロイトークン:" -ForegroundColor Cyan
    Write-Host $DeploymentToken -ForegroundColor White
    
    Write-Host ""
    Write-Host "📋 次のステップ:" -ForegroundColor Yellow
    Write-Host "1. GitHubリポジトリ (iwaseano/iino_yogatest) を開く" -ForegroundColor White
    Write-Host "2. Settings > Secrets and variables > Actions に移動" -ForegroundColor White
    Write-Host "3. 'New repository secret' をクリック" -ForegroundColor White
    Write-Host "4. Name: AZURE_STATIC_WEB_APPS_API_TOKEN_LIVELY_WATER_000D5A100" -ForegroundColor White
    Write-Host "5. Secret: 上記のデプロイトークンを貼り付け" -ForegroundColor White
    Write-Host "6. 'Add secret' をクリック" -ForegroundColor White
    Write-Host ""
    Write-Host "✨ 設定完了後、GitHub Actions が自動的に実行されます！" -ForegroundColor Green
    
    # URL情報の表示
    $StaticWebAppUrl = az staticwebapp show --name $StaticWebAppName --resource-group $ResourceGroupName --query "defaultHostname" --output tsv
    Write-Host "🌐 アプリケーションURL: https://$StaticWebAppUrl" -ForegroundColor Cyan
    
} else {
    Write-Host "❌ Azure Static Web Apps の作成に失敗しました" -ForegroundColor Red
    Write-Host "GitHub の認証が必要な場合があります。'--login-with-github' オプションでGitHub認証を実行してください。" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📚 詳細な手順については AZURE_SETUP.md を参照してください" -ForegroundColor Blue

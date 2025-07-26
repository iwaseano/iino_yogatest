// ヨガ教室予約システム - Azure Infrastructure
// Static Web Apps + Function App + Storage Account

@description('リソースの命名プレフィックス')
param resourcePrefix string = 'yoga'

@description('環境名 (dev, staging, prod)')
param environmentName string = 'dev'

@description('デプロイするリージョン')
param location string = resourceGroup().location

@description('Static Web Appsのプラン')
@allowed(['Free', 'Standard'])
param staticWebAppSku string = 'Free'

@description('Function Appのプラン')
@allowed(['Y1', 'EP1', 'EP2'])
param functionAppSku string = 'Y1'

// 変数定義
var resourceToken = uniqueString(resourceGroup().id)
var staticWebAppName = '${resourcePrefix}-swa-${environmentName}-${resourceToken}'
var functionAppName = '${resourcePrefix}-func-${environmentName}-${resourceToken}'
var storageAccountName = '${resourcePrefix}st${environmentName}${resourceToken}'
var appServicePlanName = '${resourcePrefix}-asp-${environmentName}-${resourceToken}'
var applicationInsightsName = '${resourcePrefix}-ai-${environmentName}-${resourceToken}'
var logAnalyticsWorkspaceName = '${resourcePrefix}-law-${environmentName}-${resourceToken}'

// Log Analytics Workspace
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsWorkspaceName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
  tags: {
    'azd-env-name': environmentName
    'app-type': 'yoga-reservation-system'
  }
}

// Application Insights
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: applicationInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
  }
  tags: {
    'azd-env-name': environmentName
    'app-type': 'yoga-reservation-system'
  }
}

// Storage Account for reservations data
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false // セキュリティ強化: Managed Identityのみアクセス可能
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    encryption: {
      services: {
        blob: {
          enabled: true
        }
        file: {
          enabled: true
        }
      }
      keySource: 'Microsoft.Storage'
    }
    networkAcls: {
      defaultAction: 'Allow' // 必要に応じてRestrictに変更可能
    }
  }
  tags: {
    'azd-env-name': environmentName
    'app-type': 'yoga-reservation-system'
  }
}

// Blob Container for reservations
resource blobContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/reservations'
  properties: {
    publicAccess: 'None'
  }
}

// App Service Plan for Function App
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: functionAppSku
    tier: functionAppSku == 'Y1' ? 'Dynamic' : 'ElasticPremium'
  }
  properties: {
    reserved: true // Linux
  }
  tags: {
    'azd-env-name': environmentName
    'app-type': 'yoga-reservation-system'
  }
}

// User Assigned Managed Identity
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${resourcePrefix}-mi-${environmentName}-${resourceToken}'
  location: location
  tags: {
    'azd-env-name': environmentName
    'app-type': 'yoga-reservation-system'
  }
}

// Function App
resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    serverFarmId: appServicePlan.id
    reserved: true
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'Python|3.11'
      ftpsState: 'Disabled'
      cors: {
        allowedOrigins: [
          'https://${staticWebAppName}.azurestaticapps.net'
          'https://localhost:4280' // ローカル開発用
        ]
        supportCredentials: false
      }
      appSettings: [
        {
          name: 'AzureWebJobsStorage__accountName'
          value: storageAccount.name
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'python'
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: applicationInsights.properties.InstrumentationKey
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicationInsights.properties.ConnectionString
        }
        {
          name: 'STORAGE_ACCOUNT_NAME'
          value: storageAccount.name
        }
        {
          name: 'STORAGE_CONTAINER_NAME'
          value: 'reservations'
        }
        {
          name: 'AZURE_CLIENT_ID'
          value: managedIdentity.properties.clientId
        }
      ]
    }
  }
  tags: {
    'azd-env-name': environmentName
    'app-type': 'yoga-reservation-system'
  }
}

// Static Web App
resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: staticWebAppName
  location: location
  sku: {
    name: staticWebAppSku
    tier: staticWebAppSku
  }
  properties: {
    repositoryUrl: '' // GitHub Actionsで設定
    branch: 'main'
    buildProperties: {
      skipGithubActionWorkflowGeneration: true
    }
  }
  tags: {
    'azd-env-name': environmentName
    'app-type': 'yoga-reservation-system'
  }
}

// Role Assignment: Function App -> Storage Account (Storage Blob Data Contributor)
resource storageRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, managedIdentity.id, 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
  scope: storageAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe') // Storage Blob Data Contributor
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// Diagnostic Settings for Function App
resource functionAppDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'function-app-diagnostics'
  scope: functionApp
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    logs: [
      {
        category: 'FunctionAppLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
    ]
  }
}

// Diagnostic Settings for Storage Account
resource storageAccountDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'storage-account-diagnostics'
  scope: storageAccount
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    metrics: [
      {
        category: 'Transaction'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
    ]
  }
}

// Output values
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output storageAccountName string = storageAccount.name
output applicationInsightsConnectionString string = applicationInsights.properties.ConnectionString
output resourceGroupName string = resourceGroup().name

<#
.SYNOPSIS
    Creates/updates the Kubernetes Secrets referenced by the shopwave-microservice
    Helm chart (api-gateway-secrets, user-service-secrets, auth-service-secrets,
    cart-service-secrets, catalog-service-secrets, order-service-secrets,
    analytics-service-secrets) from local environment variables. Nothing here is
    committed to Git in plaintext.

.DESCRIPTION
    values.yaml (api-gateway), values-user-service.yaml, values-auth-service.yaml,
    values-cart-service.yaml, values-catalog-service.yaml, values-order-service.yaml,
    and values-analytics-service.yaml all reference secretKeyRef lookups that assume
    these Secrets already exist in-cluster:
      - api-gateway-secrets:      jwt-secret
      - user-service-secrets:     jwt-secret, database-url
      - auth-service-secrets:     jwt-secret, redis-url
      - cart-service-secrets:     redis-url
      - catalog-service-secrets:  mongo-uri
      - order-service-secrets:    database-url
      - analytics-service-secrets: database-url

    This script closes the Day 21 open issue, extended it on Day 23 for auth/cart,
    and extends it again on Day 24 for catalog/order/analytics. It reads secret
    values from env vars (never hardcoded in this file) and applies them
    idempotently via
    `kubectl create secret ... --dry-run=client -o yaml | kubectl apply -f -`,
    so re-running it updates existing secrets rather than failing on "already exists".

.PREREQUISITES
    - kubectl installed and pointed at the TARGET cluster context. Run
      `kubectl config current-context` yourself first and confirm it's correct —
      this script will not switch contexts for you.
    - Set the required env vars in your shell BEFORE running, e.g.:
        $env:API_GATEWAY_JWT_SECRET    = "some-strong-secret"
        $env:USER_SERVICE_JWT_SECRET   = "some-strong-secret"
        $env:USER_SERVICE_DATABASE_URL = "postgres://user:pass@host:5432/dbname"
        $env:AUTH_SERVICE_JWT_SECRET   = "some-strong-secret"
        $env:AUTH_SERVICE_REDIS_URL    = "redis://host.docker.internal:6379"
        $env:CART_SERVICE_REDIS_URL    = "redis://host.docker.internal:6379"
        $env:CATALOG_SERVICE_MONGO_URI      = "mongodb://host.docker.internal:27017/catalog-service"
        $env:ORDER_SERVICE_DATABASE_URL     = "postgres://postgres:postgres@host.docker.internal:5433/shopwave_orders"
        $env:ANALYTICS_SERVICE_DATABASE_URL = "postgres://postgres:postgres@host.docker.internal:5433/shopwave_analytics"

.USAGE
    .\generate-secrets.ps1
    .\generate-secrets.ps1 -Namespace shopwave
#>

param(
    [string]$Namespace = "default"
)

$ErrorActionPreference = "Stop"

function Require-EnvVar {
    param([string]$Name)
    $value = [Environment]::GetEnvironmentVariable($Name)
    if ([string]::IsNullOrWhiteSpace($value)) {
        Write-Error "Environment variable '$Name' is not set. Set it in this shell session before running this script. Aborting."
        exit 1
    }
    return $value
}

Write-Host "== ShopWave Secrets Generator ==" -ForegroundColor Cyan
Write-Host "Target namespace: $Namespace"

Write-Host "`nVerifying kubectl context (will NOT switch contexts for you)..."
try {
    $ctx = kubectl config current-context
    Write-Host "Current context: $ctx" -ForegroundColor Yellow
}
catch {
    Write-Error "No current kubectl context found. Point kubectl at a real cluster before running this script."
    exit 1
}

Write-Host "`nEnsuring namespace '$Namespace' exists..."
kubectl get namespace $Namespace 2>$null
if ($LASTEXITCODE -ne 0) {
    kubectl create namespace $Namespace
}

# ---------------- api-gateway-secrets ----------------
Write-Host "`n-- api-gateway-secrets --" -ForegroundColor Cyan
$apiGatewayJwtSecret = Require-EnvVar -Name "API_GATEWAY_JWT_SECRET"

kubectl create secret generic api-gateway-secrets `
    --namespace=$Namespace `
    --from-literal=jwt-secret=$apiGatewayJwtSecret `
    --dry-run=client -o yaml | kubectl apply -f -

# ---------------- user-service-secrets ----------------
Write-Host "`n-- user-service-secrets --" -ForegroundColor Cyan
$userServiceJwtSecret   = Require-EnvVar -Name "USER_SERVICE_JWT_SECRET"
$userServiceDatabaseUrl = Require-EnvVar -Name "USER_SERVICE_DATABASE_URL"

kubectl create secret generic user-service-secrets `
    --namespace=$Namespace `
    --from-literal=jwt-secret=$userServiceJwtSecret `
    --from-literal=database-url=$userServiceDatabaseUrl `
    --dry-run=client -o yaml | kubectl apply -f -

# ---------------- auth-service-secrets (NEW Day 23) ----------------
Write-Host "`n-- auth-service-secrets --" -ForegroundColor Cyan
$authServiceJwtSecret = Require-EnvVar -Name "AUTH_SERVICE_JWT_SECRET"
$authServiceRedisUrl  = Require-EnvVar -Name "AUTH_SERVICE_REDIS_URL"

kubectl create secret generic auth-service-secrets `
    --namespace=$Namespace `
    --from-literal=jwt-secret=$authServiceJwtSecret `
    --from-literal=redis-url=$authServiceRedisUrl `
    --dry-run=client -o yaml | kubectl apply -f -

# ---------------- cart-service-secrets (NEW Day 23) ----------------
Write-Host "`n-- cart-service-secrets --" -ForegroundColor Cyan
$cartServiceRedisUrl = Require-EnvVar -Name "CART_SERVICE_REDIS_URL"

kubectl create secret generic cart-service-secrets `
    --namespace=$Namespace `
    --from-literal=redis-url=$cartServiceRedisUrl `
    --dry-run=client -o yaml | kubectl apply -f -


# ---------------- catalog-service-secrets (NEW Day 24) ----------------
Write-Host "`n-- catalog-service-secrets --" -ForegroundColor Cyan
$catalogServiceMongoUri = Require-EnvVar -Name "CATALOG_SERVICE_MONGO_URI"

kubectl create secret generic catalog-service-secrets `
    --namespace=$Namespace `
    --from-literal=mongo-uri=$catalogServiceMongoUri `
    --dry-run=client -o yaml | kubectl apply -f -

# ---------------- order-service-secrets (NEW Day 24) ----------------
Write-Host "`n-- order-service-secrets --" -ForegroundColor Cyan
$orderServiceDatabaseUrl = Require-EnvVar -Name "ORDER_SERVICE_DATABASE_URL"

kubectl create secret generic order-service-secrets `
    --namespace=$Namespace `
    --from-literal=database-url=$orderServiceDatabaseUrl `
    --dry-run=client -o yaml | kubectl apply -f -

# ---------------- analytics-service-secrets (NEW Day 24) ----------------
Write-Host "`n-- analytics-service-secrets --" -ForegroundColor Cyan
$analyticsServiceDatabaseUrl = Require-EnvVar -Name "ANALYTICS_SERVICE_DATABASE_URL"

kubectl create secret generic analytics-service-secrets `
    --namespace=$Namespace `
    --from-literal=database-url=$analyticsServiceDatabaseUrl `
    --dry-run=client -o yaml | kubectl apply -f -

Write-Host "`nDone. Verify with:" -ForegroundColor Green
Write-Host "  kubectl get secrets -n $Namespace"
Write-Host "  kubectl describe secret api-gateway-secrets -n $Namespace"
Write-Host "  kubectl describe secret user-service-secrets -n $Namespace"
Write-Host "  kubectl describe secret auth-service-secrets -n $Namespace"
Write-Host "  kubectl describe secret cart-service-secrets -n $Namespace"
Write-Host "  kubectl describe secret catalog-service-secrets -n $Namespace"
Write-Host "  kubectl describe secret order-service-secrets -n $Namespace"
Write-Host "  kubectl describe secret analytics-service-secrets -n $Namespace"
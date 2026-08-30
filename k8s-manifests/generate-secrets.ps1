<#
.SYNOPSIS
    Creates/updates the Kubernetes Secrets referenced by the shopwave-microservice
    Helm chart from local environment variables. Nothing here is committed to Git
    in plaintext.

.DESCRIPTION
    Each values-<service>.yaml file references secretKeyRef lookups that assume
    these Secrets already exist in-cluster:
      - api-gateway-secrets:       jwt-secret, redis-url
      - user-service-secrets:      db-host, db-port, db-name, db-user, db-password
      - auth-service-secrets:      jwt-secret, redis-url
      - cart-service-secrets:      redis-url
      - catalog-service-secrets:   mongo-uri
      - order-service-secrets:     db-host, db-port, db-name, db-user, db-password
      - analytics-service-secrets: db-host, db-port, db-name, db-user, db-password
      - review-service-secrets:    mongo-uri
      - discount-service-secrets:  db-host, db-port, db-name, db-user, db-password
      - wishlist-service-secrets:  db-host, db-port, db-name, db-user, db-password
      - admin-service-secrets:     db-host, db-port, db-name, db-user, db-password
      - payment-service-secrets:   db-host, db-port, db-name, db-user, db-password, rabbitmq-url

    file-service and search-service need no Secret: file-service takes no
    credentials, and search-service's ELASTICSEARCH_URL is a plain (non-secret)
    value set directly in its values file.

    This script closes the Day 21 open issue, extended it on Day 23 for
    auth/cart, on Day 24 for catalog/order/analytics, and on Day 25 for
    review/discount/wishlist/admin/payment. It also corrects user-service,
    order-service, and analytics-service, which were previously (incorrectly)
    generated as a single database-url: their actual code reads 5 discrete
    DB_* env vars, not one connection string, so their secrets now use 5
    discrete keys to match.

    IMPORTANT (Day 25 finding): every database/queue used by these services
    runs as a plain Docker container on this machine, not as a Kubernetes-
    native resource. Docker container names / network aliases are NOT
    resolvable via Kubernetes DNS, even when sharing a Docker network with
    the cluster (verified directly: a live k8s pod failed to resolve both
    'shopwave-postgres' and 'shopwave-discount-postgres' by name). The
    correct host for all of these, from inside a docker-desktop k8s pod, is
    host.docker.internal, using each container's HOST-mapped port (not
    Postgres/Mongo/RabbitMQ's internal default port). This is a local-dev-only
    workaround; it will need to change if this ever targets a real cluster.

    It reads secret values from env vars (never hardcoded in this file) and
    applies them idempotently via a
    "kubectl create secret ... --dry-run=client -o yaml | kubectl apply -f -"
    pattern, so re-running it updates existing secrets rather than failing on
    "already exists".

.PREREQUISITES
    - kubectl installed and pointed at the TARGET cluster context. Run
      "kubectl config current-context" yourself first and confirm it's
      correct - this script will not switch contexts for you.
    - All local Docker containers backing these services must be running
      (docker start <container>) before any pod using these secrets will
      actually connect successfully.
    - Set the required env vars in your shell BEFORE running, e.g.:

        $env:API_GATEWAY_JWT_SECRET    = "some-strong-secret"
        $env:API_GATEWAY_REDIS_URL     = "redis://host.docker.internal:6379"

        $env:USER_SERVICE_DB_HOST      = "host.docker.internal"
        $env:USER_SERVICE_DB_PORT      = "5433"
        $env:USER_SERVICE_DB_NAME      = "shopwave_users"
        $env:USER_SERVICE_DB_USER      = "postgres"
        $env:USER_SERVICE_DB_PASSWORD  = "postgres"

        $env:AUTH_SERVICE_JWT_SECRET   = "some-strong-secret"
        $env:AUTH_SERVICE_REDIS_URL    = "redis://host.docker.internal:6379"
        $env:CART_SERVICE_REDIS_URL    = "redis://host.docker.internal:6379"

        $env:CATALOG_SERVICE_MONGO_URI = "mongodb://host.docker.internal:27017/catalog-service"

        $env:ORDER_SERVICE_DB_HOST     = "host.docker.internal"
        $env:ORDER_SERVICE_DB_PORT     = "5433"
        $env:ORDER_SERVICE_DB_NAME     = "shopwave_orders"
        $env:ORDER_SERVICE_DB_USER     = "postgres"
        $env:ORDER_SERVICE_DB_PASSWORD = "postgres"

        $env:ANALYTICS_SERVICE_DB_HOST     = "host.docker.internal"
        $env:ANALYTICS_SERVICE_DB_PORT     = "5433"
        $env:ANALYTICS_SERVICE_DB_NAME     = "shopwave_analytics"
        $env:ANALYTICS_SERVICE_DB_USER     = "postgres"
        $env:ANALYTICS_SERVICE_DB_PASSWORD = "postgres"

        $env:REVIEW_SERVICE_MONGO_URI = "mongodb://host.docker.internal:27017/shopwave_reviews"

        $env:DISCOUNT_SERVICE_DB_HOST     = "host.docker.internal"
        $env:DISCOUNT_SERVICE_DB_PORT     = "5435"
        $env:DISCOUNT_SERVICE_DB_NAME     = "shopwave_commerce"
        $env:DISCOUNT_SERVICE_DB_USER     = "admin"
        $env:DISCOUNT_SERVICE_DB_PASSWORD = "password"

        $env:WISHLIST_SERVICE_DB_HOST     = "host.docker.internal"
        $env:WISHLIST_SERVICE_DB_PORT     = "5436"
        $env:WISHLIST_SERVICE_DB_NAME     = "shopwave_wishlist"
        $env:WISHLIST_SERVICE_DB_USER     = "admin"
        $env:WISHLIST_SERVICE_DB_PASSWORD = "password"

        $env:ADMIN_SERVICE_DB_HOST     = "host.docker.internal"
        $env:ADMIN_SERVICE_DB_PORT     = "5433"
        $env:ADMIN_SERVICE_DB_NAME     = "shopwave_users"
        $env:ADMIN_SERVICE_DB_USER     = "postgres"
        $env:ADMIN_SERVICE_DB_PASSWORD = "postgres"

        $env:PAYMENT_SERVICE_DB_HOST     = "host.docker.internal"
        $env:PAYMENT_SERVICE_DB_PORT     = "5433"
        $env:PAYMENT_SERVICE_DB_NAME     = "shopwave_users"
        $env:PAYMENT_SERVICE_DB_USER     = "postgres"
        $env:PAYMENT_SERVICE_DB_PASSWORD = "postgres"
        $env:PAYMENT_SERVICE_RABBITMQ_URL = "amqp://guest:guest@host.docker.internal:5672"

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
$apiGatewayRedisUrl  = Require-EnvVar -Name "API_GATEWAY_REDIS_URL"

kubectl create secret generic api-gateway-secrets --namespace=$Namespace --from-literal=jwt-secret=$apiGatewayJwtSecret --from-literal=redis-url=$apiGatewayRedisUrl --dry-run=client -o yaml | kubectl apply -f -
# ---------------- user-service-secrets (FIXED Day 25: was single database-url, code actually reads 5 discrete DB_* vars) ----------------
Write-Host "`n-- user-service-secrets --" -ForegroundColor Cyan
$userServiceDbHost     = Require-EnvVar -Name "USER_SERVICE_DB_HOST"
$userServiceDbPort     = Require-EnvVar -Name "USER_SERVICE_DB_PORT"
$userServiceDbName     = Require-EnvVar -Name "USER_SERVICE_DB_NAME"
$userServiceDbUser     = Require-EnvVar -Name "USER_SERVICE_DB_USER"
$userServiceDbPassword = Require-EnvVar -Name "USER_SERVICE_DB_PASSWORD"

kubectl create secret generic user-service-secrets --namespace=$Namespace --from-literal=db-host=$userServiceDbHost --from-literal=db-port=$userServiceDbPort --from-literal=db-name=$userServiceDbName --from-literal=db-user=$userServiceDbUser --from-literal=db-password=$userServiceDbPassword --dry-run=client -o yaml | kubectl apply -f -

# ---------------- auth-service-secrets ----------------
Write-Host "`n-- auth-service-secrets --" -ForegroundColor Cyan
$authServiceJwtSecret = Require-EnvVar -Name "AUTH_SERVICE_JWT_SECRET"
$authServiceRedisUrl  = Require-EnvVar -Name "AUTH_SERVICE_REDIS_URL"

kubectl create secret generic auth-service-secrets --namespace=$Namespace --from-literal=jwt-secret=$authServiceJwtSecret --from-literal=redis-url=$authServiceRedisUrl --dry-run=client -o yaml | kubectl apply -f -

# ---------------- cart-service-secrets ----------------
Write-Host "`n-- cart-service-secrets --" -ForegroundColor Cyan
$cartServiceRedisUrl = Require-EnvVar -Name "CART_SERVICE_REDIS_URL"

kubectl create secret generic cart-service-secrets --namespace=$Namespace --from-literal=redis-url=$cartServiceRedisUrl --dry-run=client -o yaml | kubectl apply -f -

# ---------------- catalog-service-secrets ----------------
Write-Host "`n-- catalog-service-secrets --" -ForegroundColor Cyan
$catalogServiceMongoUri = Require-EnvVar -Name "CATALOG_SERVICE_MONGO_URI"

kubectl create secret generic catalog-service-secrets --namespace=$Namespace --from-literal=mongo-uri=$catalogServiceMongoUri --dry-run=client -o yaml | kubectl apply -f -

# ---------------- order-service-secrets (FIXED Day 25: was single database-url, code actually reads 5 discrete DB_* vars) ----------------
Write-Host "`n-- order-service-secrets --" -ForegroundColor Cyan
$orderServiceDbHost     = Require-EnvVar -Name "ORDER_SERVICE_DB_HOST"
$orderServiceDbPort     = Require-EnvVar -Name "ORDER_SERVICE_DB_PORT"
$orderServiceDbName     = Require-EnvVar -Name "ORDER_SERVICE_DB_NAME"
$orderServiceDbUser     = Require-EnvVar -Name "ORDER_SERVICE_DB_USER"
$orderServiceDbPassword = Require-EnvVar -Name "ORDER_SERVICE_DB_PASSWORD"

kubectl create secret generic order-service-secrets --namespace=$Namespace --from-literal=db-host=$orderServiceDbHost --from-literal=db-port=$orderServiceDbPort --from-literal=db-name=$orderServiceDbName --from-literal=db-user=$orderServiceDbUser --from-literal=db-password=$orderServiceDbPassword --dry-run=client -o yaml | kubectl apply -f -

# ---------------- analytics-service-secrets (FIXED Day 25: was single database-url, code actually reads 5 discrete DB_* vars) ----------------
Write-Host "`n-- analytics-service-secrets --" -ForegroundColor Cyan
$analyticsServiceDbHost     = Require-EnvVar -Name "ANALYTICS_SERVICE_DB_HOST"
$analyticsServiceDbPort     = Require-EnvVar -Name "ANALYTICS_SERVICE_DB_PORT"
$analyticsServiceDbName     = Require-EnvVar -Name "ANALYTICS_SERVICE_DB_NAME"
$analyticsServiceDbUser     = Require-EnvVar -Name "ANALYTICS_SERVICE_DB_USER"
$analyticsServiceDbPassword = Require-EnvVar -Name "ANALYTICS_SERVICE_DB_PASSWORD"

kubectl create secret generic analytics-service-secrets --namespace=$Namespace --from-literal=db-host=$analyticsServiceDbHost --from-literal=db-port=$analyticsServiceDbPort --from-literal=db-name=$analyticsServiceDbName --from-literal=db-user=$analyticsServiceDbUser --from-literal=db-password=$analyticsServiceDbPassword --dry-run=client -o yaml | kubectl apply -f -

# ---------------- review-service-secrets (NEW Day 25) ----------------
Write-Host "`n-- review-service-secrets --" -ForegroundColor Cyan
$reviewServiceMongoUri = Require-EnvVar -Name "REVIEW_SERVICE_MONGO_URI"

kubectl create secret generic review-service-secrets --namespace=$Namespace --from-literal=mongo-uri=$reviewServiceMongoUri --dry-run=client -o yaml | kubectl apply -f -

# ---------------- discount-service-secrets (NEW Day 25) ----------------
Write-Host "`n-- discount-service-secrets --" -ForegroundColor Cyan
$discountServiceDbHost     = Require-EnvVar -Name "DISCOUNT_SERVICE_DB_HOST"
$discountServiceDbPort     = Require-EnvVar -Name "DISCOUNT_SERVICE_DB_PORT"
$discountServiceDbName     = Require-EnvVar -Name "DISCOUNT_SERVICE_DB_NAME"
$discountServiceDbUser     = Require-EnvVar -Name "DISCOUNT_SERVICE_DB_USER"
$discountServiceDbPassword = Require-EnvVar -Name "DISCOUNT_SERVICE_DB_PASSWORD"

kubectl create secret generic discount-service-secrets --namespace=$Namespace --from-literal=db-host=$discountServiceDbHost --from-literal=db-port=$discountServiceDbPort --from-literal=db-name=$discountServiceDbName --from-literal=db-user=$discountServiceDbUser --from-literal=db-password=$discountServiceDbPassword --dry-run=client -o yaml | kubectl apply -f -

# ---------------- wishlist-service-secrets (NEW Day 25) ----------------
Write-Host "`n-- wishlist-service-secrets --" -ForegroundColor Cyan
$wishlistServiceDbHost     = Require-EnvVar -Name "WISHLIST_SERVICE_DB_HOST"
$wishlistServiceDbPort     = Require-EnvVar -Name "WISHLIST_SERVICE_DB_PORT"
$wishlistServiceDbName     = Require-EnvVar -Name "WISHLIST_SERVICE_DB_NAME"
$wishlistServiceDbUser     = Require-EnvVar -Name "WISHLIST_SERVICE_DB_USER"
$wishlistServiceDbPassword = Require-EnvVar -Name "WISHLIST_SERVICE_DB_PASSWORD"

kubectl create secret generic wishlist-service-secrets --namespace=$Namespace --from-literal=db-host=$wishlistServiceDbHost --from-literal=db-port=$wishlistServiceDbPort --from-literal=db-name=$wishlistServiceDbName --from-literal=db-user=$wishlistServiceDbUser --from-literal=db-password=$wishlistServiceDbPassword --dry-run=client -o yaml | kubectl apply -f -

# ---------------- admin-service-secrets (NEW Day 25) ----------------
Write-Host "`n-- admin-service-secrets --" -ForegroundColor Cyan
$adminServiceDbHost     = Require-EnvVar -Name "ADMIN_SERVICE_DB_HOST"
$adminServiceDbPort     = Require-EnvVar -Name "ADMIN_SERVICE_DB_PORT"
$adminServiceDbName     = Require-EnvVar -Name "ADMIN_SERVICE_DB_NAME"
$adminServiceDbUser     = Require-EnvVar -Name "ADMIN_SERVICE_DB_USER"
$adminServiceDbPassword = Require-EnvVar -Name "ADMIN_SERVICE_DB_PASSWORD"

kubectl create secret generic admin-service-secrets --namespace=$Namespace --from-literal=db-host=$adminServiceDbHost --from-literal=db-port=$adminServiceDbPort --from-literal=db-name=$adminServiceDbName --from-literal=db-user=$adminServiceDbUser --from-literal=db-password=$adminServiceDbPassword --dry-run=client -o yaml | kubectl apply -f -

# ---------------- payment-service-secrets (NEW Day 25) ----------------
Write-Host "`n-- payment-service-secrets --" -ForegroundColor Cyan
$paymentServiceDbHost      = Require-EnvVar -Name "PAYMENT_SERVICE_DB_HOST"
$paymentServiceDbPort      = Require-EnvVar -Name "PAYMENT_SERVICE_DB_PORT"
$paymentServiceDbName      = Require-EnvVar -Name "PAYMENT_SERVICE_DB_NAME"
$paymentServiceDbUser      = Require-EnvVar -Name "PAYMENT_SERVICE_DB_USER"
$paymentServiceDbPassword  = Require-EnvVar -Name "PAYMENT_SERVICE_DB_PASSWORD"
$paymentServiceRabbitmqUrl = Require-EnvVar -Name "PAYMENT_SERVICE_RABBITMQ_URL"

kubectl create secret generic payment-service-secrets --namespace=$Namespace --from-literal=db-host=$paymentServiceDbHost --from-literal=db-port=$paymentServiceDbPort --from-literal=db-name=$paymentServiceDbName --from-literal=db-user=$paymentServiceDbUser --from-literal=db-password=$paymentServiceDbPassword --from-literal=rabbitmq-url=$paymentServiceRabbitmqUrl --dry-run=client -o yaml | kubectl apply -f -

Write-Host "`nDone. Verify with:" -ForegroundColor Green
Write-Host "  kubectl get secrets -n $Namespace"
Write-Host "  kubectl describe secret <service>-secrets -n $Namespace"
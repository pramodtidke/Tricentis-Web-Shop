#!/bin/bash
#
# test-build.sh
#
# Quick local health check - loops through every service and runs a plain
# docker build to confirm it compiles before pushing. Does not run, tag
# for real use, or push anything; this is purely a "does it build" gate.
#
# Usage: ./test-build.sh

set -e

SERVICES=("frontend-web" "api-gateway" "auth-service" "user-service" "cart-service")

FAILED=()

echo "Testing Docker builds for ${#SERVICES[@]} services..."
echo ""

for service in "${SERVICES[@]}"; do
  echo "-- Building: $service --"

  if [ ! -f "$service/Dockerfile" ]; then
    echo "Skipping $service - no Dockerfile found"
    continue
  fi

  if docker build -t "shopwave-${service}:test" "./${service}"; then
    echo "OK: $service build succeeded"
  else
    echo "FAILED: $service build failed"
    FAILED+=("$service")
  fi

  echo ""
done

echo "----------------------------------------"

if [ ${#FAILED[@]} -eq 0 ]; then
  echo "All services built successfully. Safe to push."
  exit 0
else
  echo "${#FAILED[@]} service(s) failed to build:"
  for f in "${FAILED[@]}"; do
    echo "   - $f"
  done
  exit 1
fi
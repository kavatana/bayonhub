#!/bin/bash
echo "=== BayonHub Pre-Deploy Checklist ==="
PASS=0
FAIL=0

check() {
  if eval "$2" > /dev/null 2>&1; then
    echo "✅ $1"
    PASS=$((PASS+1))
  else
    echo "❌ $1"
    FAIL=$((FAIL+1))
  fi
}

# Frontend checks
cd bayonhub-app
check "Frontend lint passes" "npm run lint"
check "Frontend build passes" "npm run build"
check "index chunk under 500KB" "[ $(find dist/assets -name 'index-*.js' | xargs wc -c 2>/dev/null | tail -1 | awk '{print $1}') -lt 512000 ]"
check "vendor-three is isolated" "ls dist/assets/vendor-three-*.js"
check "PWA manifest exists" "ls dist/manifest.webmanifest || ls dist/manifest.json"
check "VITE_API_URL in .env.production" "grep -q VITE_API_URL .env.production"
cd ..

# Backend checks
cd bayonhub-api
check "Backend TypeScript passes" "npm run lint"
check "Backend build passes" "npm run build"
check "Dockerfile exists" "ls Dockerfile"
check ".env.production.example exists" "ls .env.production.example"
cd ..

# Security checks
check "No hardcoded secrets in frontend" "! grep -r 'JWT_SECRET\\|password123\\|admin1234' src/"
check "SECURITY.md exists" "ls bayonhub-api/SECURITY.md"
check "AGENTS.md exists" "ls AGENTS.md"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
if [ $FAIL -gt 0 ]; then
  echo "Fix failures before deploying."
  exit 1
else
  echo "All checks passed. Ready to deploy."
fi

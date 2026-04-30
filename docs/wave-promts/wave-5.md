## WAVE 5 — Release Governance

### W5-01 — CI Build Gate

Create: bayonhub-app/.github/workflows/ci.yml

name: BayonHub CI
on:
push:
branches: [main, develop]
pull_request:
branches: [main]

jobs:
build:
runs-on: ubuntu-latest
steps:
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
with:
node-version: '20'
cache: 'npm'
cache-dependency-path: bayonhub-app/package-lock.json
- name: Install
run: cd bayonhub-app && npm ci
- name: Lint
run: cd bayonhub-app && npm run lint
- name: Build (attempt 1)
run: cd bayonhub-app && npm run build
- name: Build (attempt 2 — verify stability)
run: cd bayonhub-app && npm run build
- name: Verify chunk sizes
run: |
cd bayonhub-app
INDEX_SIZE=$(find dist/assets -name "index-*.js" | xargs wc -c | tail -1 | awk '{print $1}')
MAX_SIZE=512000
if [ "$INDEX_SIZE" -gt "$MAX_SIZE" ]; then
echo "FAIL: index chunk too large: ${INDEX_SIZE} bytes (max ${MAX_SIZE})"
exit 1
fi
echo "PASS: index chunk size ${INDEX_SIZE} bytes"

Create: bayonhub-api/.github/workflows/ci.yml

name: BayonHub API CI
on:
push:
branches: [main, develop]
pull_request:
branches: [main]

jobs:
build:
runs-on: ubuntu-latest
steps:
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
with:
node-version: '20'
cache: 'npm'
cache-dependency-path: bayonhub-api/package-lock.json
- name: Install
run: cd bayonhub-api && npm ci
- name: TypeScript check
run: cd bayonhub-api && npm run lint
- name: Build
run: cd bayonhub-api && npm run build

### W5-02 — MIGRATION_NOTES.md Final Entry

Append to bayonhub-app/MIGRATION_NOTES.md:

## QA Audit Remediation Sprint — All Waves — [today's date]

Wave 1 (P0 Release Blockers):

- vite.config.js — PWA build hardened, circular chunk eliminated, function-based manualChunks
- src/api/client.js — production auth security guard, localStorage token blocked in PROD
- bayonhub-api/src/config/env.ts — production env var validation on startup

Wave 2 (P1 Flow Integrity):

- src/lib/validation.js — buildLeadPayload schema, normalizePhone, validatePhone
- src/lib/storage.js — safe localStorage abstraction with quota handling
- src/lib/rateLimiter.js — client-side contact action rate limiting
- src/store/useUIStore.js — idempotent addMessage action
- src/lib/socket.js — event deduplication with processedEvents Set
- src/pages/ListingPage.jsx — sticky CTA hysteresis (dual threshold)
- src/pages/CategoryPage.jsx — unified displayedListings data source
- src/hooks/useOnlineStatus.js — backend heartbeat, limited mode detection
- src/hooks/usePWAInstall.js — 7-day dismissal expiry
- src/components/listing/ListingDetail.jsx — structured report metadata

Wave 3 (P2 UX):

- src/components/ui/Overlay.jsx — unified overlay primitive
- src/hooks/useClickAway.js — touch-safe click-away hook
- src/lib/promotionStates.js — promotion state machine
- src/lib/seo.js — canonicalUrl helper with production guard
- src/pages/HomePage.jsx — O(n) category count aggregation

Wave 4 (P2 Accessibility):

- src/lib/translations.js — [N] new KM+EN keys added for hardcoded strings found
- Dark mode: dark:text-neutral-500 → dark:text-neutral-400 sweep
- Keyboard: [list components fixed]

Wave 5 (Governance):

- .github/workflows/ci.yml — build gate with chunk size check
- API .github/workflows/ci.yml — TypeScript + build check

Post-remediation scores:

- Build stability: HIGH (3 consecutive stable builds verified)
- Core flow reliability: HIGH
- Trust/safety: MEDIUM-HIGH
- Estimated production readiness: 7.0–7.4/10
- Estimated Khmer24 parity: 65–75%

---

## FINAL VERIFICATION

Run these in order. All must pass before reporting the sprint complete.

bayonhub-app/:

1. npm run lint — 0 errors, 0 warnings
2. npm run build — success (run 3 times, all must succeed)
3. Report all chunk sizes
4. Confirm: no circular chunk warnings in build output
5. Confirm: vendor-three chunk is isolated
6. Confirm: index chunk < 500KB

bayonhub-api/ (if running):
7. npm run lint — 0 TypeScript errors
8. npm run build — success
9. GET /health returns { status: 'ok', db: 'ok', redis: 'ok' }

Cross-cutting:
10. Confirm every new .js file created has zero hardcoded visible strings (uses t() or is a utility)
11. Confirm storage.js is imported in all 4 store files (no raw localStorage.getItem calls remain)
12. Confirm rateLimiter.js is applied to all 5 contact actions in ListingDetail.jsx
13. Confirm useClickAway is applied to all 4 dropdowns identified in W3-02
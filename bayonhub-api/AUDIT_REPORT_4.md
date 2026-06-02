# BayonHub Audit 4 — Post-Prompt-4 Verification — 2026-05-18

## Executive Summary

- Group 26 — IMPLEMENTED — All requested Listing indexes exist in schema and migration; `npx prisma migrate status` reports database schema is up to date.
- Group 27 — IMPLEMENTED — Cambodia province list, backend validation, backend slug normalization, frontend slug helper, and footer usage are present.
- Group 28 — IMPLEMENTED — OAuth callback URLs use `API_BASE_URL`; the production domain remains only as the configured fallback/default.
- Group 29 — IMPLEMENTED — App CORS and Socket.io CORS include `FRONTEND_URL_WWW` and preserve localhost/dev origins.
- Group 30 — IMPLEMENTED — Production env validation includes required refresh/R2/ABA vars and throws during production startup when missing.
- Group 31 — IMPLEMENTED — ABA webhook verification fails closed when `ABA_WEBHOOK_SECRET` is missing.
- Group 32 — IMPLEMENTED — KHQR generation checks for a recent matching pending payment before creating a new one.
- Group 33 — IMPLEMENTED — `AdminAuditLog` model/migration exist; `logAdminAction()` writes to DB; requested admin handlers are covered.
- Group 34 — PARTIAL — Admin IP allowlist is implemented and mounted in the correct order, but the “allow all” warning logs on first admin request, not startup.
- Group 35 — IMPLEMENTED — Legal pages use `legal.lastUpdated`; visible draft/pending-review legal text is gone.
- Group 36 — IMPLEMENTED — `PostingRulesPage.jsx`, `/posting-rules` route, and EN/KM `postingRules.*` keys exist.
- Group 37 — IMPLEMENTED — Featured listings, appeals, and verification requests are paginated and return `{ data, total, page, limit }`.
- Group 38 — IMPLEMENTED — Account deletion cleans KYC R2 keys; KYC resubmission writes new docs before best-effort deletion of old keys.
- Group 39 — IMPLEMENTED — Storefront pages emit OG title, description, URL, and conditional image.
- Group 40 — IMPLEMENTED — Listing-detail map is lazy-loaded and gated on lat/lng; search filter uses province dropdown; OSM attribution exists.
- Group 41 — PARTIAL — Backend admin 2FA endpoints/middleware work, but no frontend admin 2FA flow calls them, so admin UI can hit `403 Admin 2FA required`.
- Group 42 — IMPLEMENTED — Consent banner exists, is mounted, uses `bayonhub:privacy-consent`, and has EN/KM keys.
- Group 43 — IMPLEMENTED — KYC retention policy comment and daily rejected-document cleanup job exist.
- Group 44 — IMPLEMENTED — Refund fields/migration, refund endpoint/service, audit action, admin UI button/modal, and translations exist.
- Group 45 — IMPLEMENTED — `/health` and `/api/health` include db/redis/r2/uptime/timestamp and return 503 when degraded.
- Group 46 — IMPLEMENTED — `scripts/launch-check.ts` exists and package script is wired.
- Group 47 — IMPLEMENTED — `scripts/smoke-launch.ts` exists and package script is wired.
- Group 48 — IMPLEMENTED — `scripts/perf-check.ts` exists and package script is wired.

## Section 1 — Database & Migrations

### 1A — Group 26: DB indexes — IMPLEMENTED

Command result:

- `npx prisma migrate status` in `bayonhub-api` reports: `24 migrations found in prisma/migrations` and `Database schema is up to date!`.

All requested indexes are present in `prisma/schema.prisma`:

- `@@index([status, deletedAt, createdAt])` — `bayonhub-api/prisma/schema.prisma:137`
- `@@index([status, deletedAt, categorySlug, createdAt])` — `bayonhub-api/prisma/schema.prisma:138`
- `@@index([status, deletedAt, province, createdAt])` — `bayonhub-api/prisma/schema.prisma:139`
- `@@index([status, deletedAt, promoted, createdAt])` — `bayonhub-api/prisma/schema.prisma:140`
- `@@index([status, deletedAt, province, district])` — `bayonhub-api/prisma/schema.prisma:141`
- `@@index([district])` — `bayonhub-api/prisma/schema.prisma:142`
- `@@index([price])` — `bayonhub-api/prisma/schema.prisma:143`
- `@@index([viewCount])` — `bayonhub-api/prisma/schema.prisma:144`

Migration exists:

- `bayonhub-api/prisma/migrations/20260517182708_audit3_indexes/migration.sql`

### 1B — Group 33: AdminAuditLog model — IMPLEMENTED

- `User.adminAuditLogs` reverse relation exists — `bayonhub-api/prisma/schema.prisma:65`.
- `model AdminAuditLog` exists — `bayonhub-api/prisma/schema.prisma:451`.
- Migration exists — `bayonhub-api/prisma/migrations/20260517182749_audit3_admin_audit_log/migration.sql`.
- `logAdminAction()` writes to `prisma.adminAuditLog.create()` — `bayonhub-api/src/modules/admin/audit.ts:45`, `bayonhub-api/src/modules/admin/audit.ts:51`.

Admin handler coverage:

- KYC review — yes: `logAdminAction(...)` in verification/KYC review handler — `bayonhub-api/src/modules/admin/router.ts:615`.
- Listing status — yes: listing status changes log `listing.status_change` — `bayonhub-api/src/modules/admin/router.ts:315`, `bayonhub-api/src/modules/admin/router.ts:363`.
- Bulk action — yes: logs `listing.bulk_action` — `bayonhub-api/src/modules/admin/router.ts:344`.
- Image review — yes: logs `listing.image_review` — `bayonhub-api/src/modules/admin/router.ts:383`.

### 1C — Group 44: Payment refund fields — IMPLEMENTED

Payment model fields exist:

- `refundNote String?` — `bayonhub-api/prisma/schema.prisma:423`
- `refundedAt DateTime?` — `bayonhub-api/prisma/schema.prisma:424`
- `refundedByAdminId String?` — `bayonhub-api/prisma/schema.prisma:425`

Migration exists:

- `bayonhub-api/prisma/migrations/20260517182911_audit3_payment_refund/migration.sql`

## Section 2 — Backend Security & Validation

### 2A — Group 27: Province validation — IMPLEMENTED

- Backend province list exists — `bayonhub-api/src/lib/cambodiaProvinces.ts:1`.
- Slug map and normalization exist — `bayonhub-api/src/lib/cambodiaProvinces.ts:29`, `bayonhub-api/src/lib/cambodiaProvinces.ts:45`.
- Validators import `isValidCambodiaProvince` — `bayonhub-api/src/modules/listings/validators.ts:5`.
- Listing province validates against the list with message `Invalid province` — `bayonhub-api/src/modules/listings/validators.ts:25`.
- Search filters normalize province/location values — `bayonhub-api/src/modules/listings/service.ts:471`, `bayonhub-api/src/modules/listings/service.ts:511`, `bayonhub-api/src/modules/listings/service.ts:543`.
- Frontend `slugToDisplayName()` exists — `bayonhub-app/src/lib/locations.js:78`.
- Footer imports and uses `slugToDisplayName()` — `bayonhub-app/src/components/layout/Footer.jsx:5`, `bayonhub-app/src/components/layout/Footer.jsx:8`.

### 2B — Group 28: OAuth callback env-derived — IMPLEMENTED

- `apiBase` uses `process.env.API_BASE_URL ?? "https://api.bayonhub.com"` — `bayonhub-api/src/modules/auth/oauth.ts:20`.
- Google callback uses `apiBase` — `bayonhub-api/src/modules/auth/oauth.ts:30`.
- Facebook callback uses `apiBase` — `bayonhub-api/src/modules/auth/oauth.ts:74`.
- `https://api.bayonhub.com` is still hardcoded as a fallback/default in `oauth.ts` and `env.ts`, which matches the prompt’s fallback instruction — `bayonhub-api/src/modules/auth/oauth.ts:20`, `bayonhub-api/src/config/env.ts:59`.

### 2C — Group 29: CORS domains — IMPLEMENTED

- `app.ts` CORS whitelist includes `env.frontendUrlWww` and normalized trailing-slash variant — `bayonhub-api/src/app.ts:101`, `bayonhub-api/src/app.ts:102`.
- App CORS preserves localhost/dev origins — `bayonhub-api/src/app.ts:105`, `bayonhub-api/src/app.ts:106`, `bayonhub-api/src/app.ts:107`.
- Socket.io CORS includes `env.frontendUrlWww` and normalized trailing-slash variant — `bayonhub-api/src/server.ts:18`, `bayonhub-api/src/server.ts:19`.
- Socket.io CORS preserves localhost/dev origins — `bayonhub-api/src/server.ts:20`, `bayonhub-api/src/server.ts:21`, `bayonhub-api/src/server.ts:22`.

### 2D — Group 30: Env validation — IMPLEMENTED

Production-required vars include:

- `JWT_REFRESH_SECRET` — `bayonhub-api/src/config/env.ts:9`
- `ABA_WEBHOOK_SECRET` — `bayonhub-api/src/config/env.ts:12`
- `R2_ACCOUNT_ID` — `bayonhub-api/src/config/env.ts:13`
- `R2_ACCESS_KEY_ID` — `bayonhub-api/src/config/env.ts:14`
- `R2_SECRET_ACCESS_KEY` — `bayonhub-api/src/config/env.ts:15`
- `R2_BUCKET_NAME` — `bayonhub-api/src/config/env.ts:16`

Production startup fails if any are missing by throwing at config load — `bayonhub-api/src/config/env.ts:19`, `bayonhub-api/src/config/env.ts:21`.

`.env.example` includes the requested vars — `bayonhub-api/.env.example:4`, `bayonhub-api/.env.example:12`, `bayonhub-api/.env.example:13`, `bayonhub-api/.env.example:14`, `bayonhub-api/.env.example:15`, `bayonhub-api/.env.example:26`.

### 2E — Group 31: ABA webhook fail-closed — IMPLEMENTED

- `verifyWebhookSignature()` checks `!env.abaWebhookSecret` — `bayonhub-api/src/modules/payments/router.ts:227`, `bayonhub-api/src/modules/payments/router.ts:228`.
- Missing secret logs critical event and returns `false` — `bayonhub-api/src/modules/payments/router.ts:229`, `bayonhub-api/src/modules/payments/router.ts:230`.

### 2F — Group 32: KHQR idempotent — IMPLEMENTED

- KHQR path checks `prisma.payment.findFirst()` before creating — `bayonhub-api/src/modules/payments/router.ts:358`.
- Check includes `userId`, `listingId`, `plan`, `status: PaymentStatus.PENDING`, and 30-minute `createdAt` window — `bayonhub-api/src/modules/payments/router.ts:360`, `bayonhub-api/src/modules/payments/router.ts:361`, `bayonhub-api/src/modules/payments/router.ts:362`, `bayonhub-api/src/modules/payments/router.ts:363`, `bayonhub-api/src/modules/payments/router.ts:364`.
- Existing pending payment returns existing reference/QR data and exits — `bayonhub-api/src/modules/payments/router.ts:369`, `bayonhub-api/src/modules/payments/router.ts:377`, `bayonhub-api/src/modules/payments/router.ts:378`.

### 2G — Group 34: Admin IP allowlist — PARTIAL

- `adminIpAllowlist` middleware exists — `bayonhub-api/src/middleware/adminAuth.ts:26`.
- It checks real IP using Cloudflare / forwarded / Express IP — `bayonhub-api/src/middleware/adminAuth.ts:8`, `bayonhub-api/src/middleware/adminAuth.ts:10`, `bayonhub-api/src/middleware/adminAuth.ts:11`, `bayonhub-api/src/middleware/adminAuth.ts:12`.
- Denied IPs return 403 and log `admin_ip_denied` — `bayonhub-api/src/middleware/adminAuth.ts:37`, `bayonhub-api/src/middleware/adminAuth.ts:39`, `bayonhub-api/src/middleware/adminAuth.ts:40`.
- Admin router mount order is correct: `requireAuth → adminIpAllowlist → requireAdmin → requireAdmin2FA` — `bayonhub-api/src/modules/admin/router.ts:71`.
- `app.set("trust proxy", 1)` exists — `bayonhub-api/src/app.ts:34`.

Gap:

- Prompt requested a warning once at startup when `ADMIN_IP_ALLOWLIST` is unset. Current code logs the warning inside middleware on the first admin request — `bayonhub-api/src/middleware/adminAuth.ts:28`, `bayonhub-api/src/middleware/adminAuth.ts:31`.

## Section 3 — Plus/Free Tier & Payments

### 3A — Plus status check — IMPLEMENTED

Plus checks compare `plusUntil` to `new Date()`:

- Listing decoration uses `seller.plusUntil > new Date()` — `bayonhub-api/src/modules/listings/service.ts:260`, `bayonhub-api/src/modules/listings/service.ts:261`.
- Shared user service `isUserPlus()` uses `user.plusUntil > new Date()` — `bayonhub-api/src/modules/users/service.ts:80`, `bayonhub-api/src/modules/users/service.ts:85`.
- Storefront gates access with `isUserPlus(storefront.id)` — `bayonhub-api/src/modules/storefront/service.ts:80`, `bayonhub-api/src/modules/storefront/service.ts:81`, `bayonhub-api/src/modules/storefront/service.ts:115`, `bayonhub-api/src/modules/storefront/service.ts:116`.

Consistency:

- Listing creation uses `isUserPlus(userId)` — `bayonhub-api/src/modules/listings/service.ts:892`, `bayonhub-api/src/modules/listings/service.ts:897`.
- Storefront access uses the same user-service plus check — `bayonhub-api/src/modules/storefront/service.ts:81`, `bayonhub-api/src/modules/storefront/service.ts:116`.
- UI display receives `isPlusMember` from decorated listing/storefront data — `bayonhub-api/src/modules/listings/service.ts:267`, `bayonhub-api/src/modules/storefront/service.ts:20`, `bayonhub-api/src/modules/storefront/service.ts:23`.

### 3B — Free tier listing limit — IMPLEMENTED

Exact backend code:

- Photo limit is `plus ? 20 : 5` — `bayonhub-api/src/modules/listings/service.ts:905`.
- Free users are limited to 5 listings per UTC day — `bayonhub-api/src/modules/listings/service.ts:914`, `bayonhub-api/src/modules/listings/service.ts:915`, `bayonhub-api/src/modules/listings/service.ts:918`, `bayonhub-api/src/modules/listings/service.ts:921`.
- Error message says: `Free accounts can post 5 listings per day. Upgrade to Plus for unlimited.` — `bayonhub-api/src/modules/listings/service.ts:922`, `bayonhub-api/src/modules/listings/service.ts:924`.
- Plus users skip the daily listing count block — `bayonhub-api/src/modules/listings/service.ts:914`.

Free max: 5 listings per day. Plus max: unlimited listings per day. Photo max: Free 5, Plus 20.

### 3C — Pricing page display — PARTIAL

- `PricingPage.jsx` renders `PricingSection` — `bayonhub-app/src/pages/PricingPage.jsx:4`, `bayonhub-app/src/pages/PricingPage.jsx:17`.
- `PricingSection` uses hardcoded local plan definitions, not backend config/API — `bayonhub-app/src/components/sections/PricingSection.jsx:14`, `bayonhub-app/src/components/sections/PricingSection.jsx:15`, `bayonhub-app/src/components/sections/PricingSection.jsx:36`.
- Display text is translation-backed but does not mention the backend-enforced free/plus posting/photo limits — `bayonhub-app/src/lib/translations.js:1239`, `bayonhub-app/src/lib/translations.js:1240`, `bayonhub-app/src/lib/translations.js:1245`, `bayonhub-app/src/lib/translations.js:1247`.

Gap:

- Backend enforces Free 5 listings/day and Free 5 photos/listing, Plus unlimited listings/day and 20 photos/listing. Pricing UI does not display those exact limits, so display vs enforcement is incomplete.

### 3D — Payment refund endpoint — IMPLEMENTED

- Endpoint exists: `POST /api/admin/payments/:id/refund` — `bayonhub-api/src/modules/admin/router.ts:119`.
- Router calls `refundPayment(...)` and logs `payment.refund` — `bayonhub-api/src/modules/admin/router.ts:122`, `bayonhub-api/src/modules/admin/router.ts:125`.
- Service requires `refundNote` — `bayonhub-api/src/modules/admin/service.ts:395`, `bayonhub-api/src/modules/admin/service.ts:397`.
- Service sets `status: PaymentStatus.REFUNDED`, `refundNote`, `refundedAt`, and `refundedByAdminId` — `bayonhub-api/src/modules/admin/service.ts:410`, `bayonhub-api/src/modules/admin/service.ts:411`, `bayonhub-api/src/modules/admin/service.ts:412`, `bayonhub-api/src/modules/admin/service.ts:413`.

### 3E — Admin payment UI — IMPLEMENTED

- REFUNDED status label exists — `bayonhub-app/src/pages/AdminPage.jsx:469`.
- Payment status filter includes `REFUNDED` — `bayonhub-app/src/pages/AdminPage.jsx:943`.
- “Mark Refunded” button is shown only for `PAID` / `APPROVED` — `bayonhub-app/src/pages/AdminPage.jsx:1002`, `bayonhub-app/src/pages/AdminPage.jsx:1004`.
- Refund note modal and textarea exist — `bayonhub-app/src/pages/AdminPage.jsx:1163`, `bayonhub-app/src/pages/AdminPage.jsx:1166`, `bayonhub-app/src/pages/AdminPage.jsx:1171`.
- EN/KM strings exist — `bayonhub-app/src/lib/translations.js:1000`, `bayonhub-app/src/lib/translations.js:1001`, `bayonhub-app/src/lib/translations.js:1002`, `bayonhub-app/src/lib/translations.js:2409`, `bayonhub-app/src/lib/translations.js:2410`, `bayonhub-app/src/lib/translations.js:2411`.

## Section 4 — Admin Security

### 4A — Admin 2FA endpoints — PARTIAL

- Routes exist — `bayonhub-api/src/modules/auth/router.ts:47`, `bayonhub-api/src/modules/auth/router.ts:48`.
- Both routes require authentication — `bayonhub-api/src/modules/auth/router.ts:47`, `bayonhub-api/src/modules/auth/router.ts:48`.
- `/send` has `otpLimiter`; `/verify` has `otpVerifyLimiter` — `bayonhub-api/src/modules/auth/router.ts:47`, `bayonhub-api/src/modules/auth/router.ts:48`.
- Both controller handlers call `requireAdminUser(req)` — `bayonhub-api/src/modules/auth/controller.ts:81`, `bayonhub-api/src/modules/auth/controller.ts:83`, `bayonhub-api/src/modules/auth/controller.ts:91`, `bayonhub-api/src/modules/auth/controller.ts:93`.
- `requireAdminUser` rejects non-admin users — `bayonhub-api/src/modules/auth/controller.ts:73`, `bayonhub-api/src/modules/auth/controller.ts:74`, `bayonhub-api/src/modules/auth/controller.ts:76`.
- Service also rejects non-admin users — `bayonhub-api/src/modules/auth/service.ts:288`, `bayonhub-api/src/modules/auth/service.ts:301`.
- OAuth placeholder phones are rejected through `isRealVerifiedPhone()` — `bayonhub-api/src/modules/auth/service.ts:274`, `bayonhub-api/src/modules/auth/service.ts:278`, `bayonhub-api/src/modules/auth/service.ts:279`, `bayonhub-api/src/modules/auth/service.ts:289`, `bayonhub-api/src/modules/auth/service.ts:302`.
- `/verify` sets Redis key `admin:2fa:{userId}` with TTL `43_200` seconds — `bayonhub-api/src/modules/auth/service.ts:306`.

End-to-end gap:

- No frontend code calls `/api/auth/admin/2fa/send` or `/api/auth/admin/2fa/verify`; repository-wide search only finds backend references. Admin UI requests can therefore receive `403 Admin 2FA required` with no visible step-up flow.

### 4B — requireAdmin2FA middleware — IMPLEMENTED

- Middleware exists and checks Redis `admin:2fa:{userId}` — `bayonhub-api/src/middleware/adminAuth.ts:46`, `bayonhub-api/src/middleware/adminAuth.ts:52`.
- Missing key returns 403 `Admin 2FA required` — `bayonhub-api/src/middleware/adminAuth.ts:53`, `bayonhub-api/src/middleware/adminAuth.ts:54`.
- Mounted after `requireAdmin` on admin router — `bayonhub-api/src/modules/admin/router.ts:71`.
- It is not mounted on `/api/auth/admin/2fa/send` or `/api/auth/admin/2fa/verify`; those live on `auth/router.ts`, not `admin/router.ts` — `bayonhub-api/src/modules/auth/router.ts:47`, `bayonhub-api/src/modules/auth/router.ts:48`.

### 4C — Audit log coverage — IMPLEMENTED

- KYC review — yes: `bayonhub-api/src/modules/admin/router.ts:615`.
- Listing status change — yes: `bayonhub-api/src/modules/admin/router.ts:315`, `bayonhub-api/src/modules/admin/router.ts:363`.
- Listing bulk action — yes: `bayonhub-api/src/modules/admin/router.ts:344`.
- Image review — yes: `bayonhub-api/src/modules/admin/router.ts:383`.
- Payment refund — yes: `bayonhub-api/src/modules/admin/router.ts:123`, `bayonhub-api/src/modules/admin/router.ts:125`.
- User ban — yes: `bayonhub-api/src/modules/admin/router.ts:458`.

## Section 5 — Frontend Features

### 5A — Group 35: Legal pages — IMPLEMENTED

- `TermsPage.jsx` uses `legal.lastUpdated` — `bayonhub-app/src/pages/TermsPage.jsx:36`.
- `PrivacyPage.jsx` uses `legal.lastUpdated` — `bayonhub-app/src/pages/PrivacyPage.jsx:35`.
- `legal.lastUpdated` EN/KM keys exist — `bayonhub-app/src/lib/translations.js:1167`, `bayonhub-app/src/lib/translations.js:2576`.
- Legal body text no longer contains “Draft — pending legal review” prefixes. Remaining `draft` strings are unrelated post/dashboard draft-listing strings and renamed legacy keys whose values now say last updated — `bayonhub-app/src/lib/translations.js:1170`, `bayonhub-app/src/lib/translations.js:1183`, `bayonhub-app/src/lib/translations.js:2579`, `bayonhub-app/src/lib/translations.js:2592`.

### 5B — Group 36: Posting rules page — IMPLEMENTED

- `PostingRulesPage.jsx` exists — `bayonhub-app/src/pages/PostingRulesPage.jsx:5`.
- Page uses static `postingRules.rule1` through `postingRules.rule8` keys — `bayonhub-app/src/pages/PostingRulesPage.jsx:9`, `bayonhub-app/src/pages/PostingRulesPage.jsx:16`.
- Route `/posting-rules` exists — `bayonhub-app/src/App.jsx:102`.
- EN/KM posting rules keys exist — `bayonhub-app/src/lib/translations.js:1211`, `bayonhub-app/src/lib/translations.js:1220`, `bayonhub-app/src/lib/translations.js:2620`, `bayonhub-app/src/lib/translations.js:2629`.

### 5C — Group 39: Storefront OG tags — IMPLEMENTED

- `og:title` exists — `bayonhub-app/src/pages/StorefrontPage.jsx:197`.
- `og:description` exists — `bayonhub-app/src/pages/StorefrontPage.jsx:198`.
- `og:url` exists — `bayonhub-app/src/pages/StorefrontPage.jsx:200`.
- `og:image` is conditional on `logo`; if no logo/default image exists, it is omitted — `bayonhub-app/src/pages/StorefrontPage.jsx:199`.

### 5D — Group 40: Map feature — IMPLEMENTED

- `MapView` is lazy-loaded with `React.lazy` — `bayonhub-app/src/components/listing/ListingDetail.jsx:51`.
- Coordinate gate exists via `hasListingCoordinates` — `bayonhub-app/src/components/listing/ListingDetail.jsx:179`.
- Map renders only when coordinates exist — `bayonhub-app/src/components/listing/ListingDetail.jsx:619`, `bayonhub-app/src/components/listing/ListingDetail.jsx:621`.
- Map is wrapped in `Suspense` — `bayonhub-app/src/components/listing/ListingDetail.jsx:620`.
- Search filter uses existing province dropdown and “All provinces” key — `bayonhub-app/src/components/search/SearchFilters.jsx:79`.
- OSM attribution exists — `bayonhub-app/src/components/ui/MapView.jsx:69`.
- Translation keys exist for EN/KM — `bayonhub-app/src/lib/translations.js:131`, `bayonhub-app/src/lib/translations.js:262`, `bayonhub-app/src/lib/translations.js:1540`, `bayonhub-app/src/lib/translations.js:1671`.

### 5E — Group 42: Consent banner — IMPLEMENTED

- `ConsentBanner.jsx` exists — `bayonhub-app/src/components/ConsentBanner.jsx:8`.
- It uses localStorage key `bayonhub:privacy-consent` — `bayonhub-app/src/components/ConsentBanner.jsx:6`.
- It is mounted in `Layout.jsx` — `bayonhub-app/src/components/layout/Layout.jsx:9`, `bayonhub-app/src/components/layout/Layout.jsx:115`.
- Visible strings use `consent.*` translation keys — `bayonhub-app/src/components/ConsentBanner.jsx:28`, `bayonhub-app/src/components/ConsentBanner.jsx:31`, `bayonhub-app/src/components/ConsentBanner.jsx:34`, `bayonhub-app/src/components/ConsentBanner.jsx:39`, `bayonhub-app/src/components/ConsentBanner.jsx:41`, `bayonhub-app/src/components/ConsentBanner.jsx:42`.
- EN/KM consent keys exist — `bayonhub-app/src/lib/translations.js:1161`, `bayonhub-app/src/lib/translations.js:1166`, `bayonhub-app/src/lib/translations.js:2570`, `bayonhub-app/src/lib/translations.js:2575`.

## Section 6 — Backend Features

### 6A — Group 37: Admin list pagination — IMPLEMENTED

- Shared pagination normalizer exists with default 50 and max 200 — `bayonhub-api/src/modules/admin/service.ts:177`.
- Featured listings use pagination and return `{ data, total, page, limit }` — `bayonhub-api/src/modules/admin/service.ts:867`, `bayonhub-api/src/modules/admin/service.ts:868`, `bayonhub-api/src/modules/admin/service.ts:881`.
- Appeals use pagination and return `{ data, total, page, limit }` — `bayonhub-api/src/modules/admin/service.ts:901`, `bayonhub-api/src/modules/admin/service.ts:902`, `bayonhub-api/src/modules/admin/service.ts:914`.
- Verification requests use pagination and return `{ data, total, page, limit }` — `bayonhub-api/src/modules/admin/service.ts:930`, `bayonhub-api/src/modules/admin/service.ts:931`, `bayonhub-api/src/modules/admin/service.ts:943`.
- Router passes `page`/`limit` for each endpoint — `bayonhub-api/src/modules/admin/router.ts:536`, `bayonhub-api/src/modules/admin/router.ts:569`, `bayonhub-api/src/modules/admin/router.ts:595`.

### 6B — Group 38: KYC R2 cleanup — IMPLEMENTED

- Account deletion imports `deleteFromR2` — `bayonhub-api/src/modules/users/service.ts:7`.
- Account deletion deletes KYC doc keys before DB deletion work — `bayonhub-api/src/modules/users/service.ts:476`.
- KYC resubmission imports `deleteFromR2` and `uploadPrivateDocument` — `bayonhub-api/src/modules/kyc/router.ts:6`.
- Resubmission deletes old keys after new upload/DB upsert path, best effort — `bayonhub-api/src/modules/kyc/router.ts:125`.

### 6C — Group 43: KYC retention cleanup job — IMPLEMENTED

- Retention policy is documented in scheduler comments — `bayonhub-api/src/lib/scheduler.ts:147`.
- Job deletes R2 objects for document keys — `bayonhub-api/src/lib/scheduler.ts:168`.
- Cleanup logs `kyc_cleanup` counts — `bayonhub-api/src/lib/scheduler.ts:177`.

### 6D — Group 45: Health check — IMPLEMENTED

- Health handler exists — `bayonhub-api/src/app.ts:185`.
- DB check uses `prisma.$queryRaw SELECT 1` — `bayonhub-api/src/app.ts:188`.
- Redis check uses `redis.ping()` — `bayonhub-api/src/app.ts:192`.
- R2 check uses `testR2Connection()` — `bayonhub-api/src/app.ts:196`.
- Response includes `status`, `db`, `redis`, `r2`, `uptime`, `timestamp` — `bayonhub-api/src/app.ts:202`, `bayonhub-api/src/app.ts:203`, `bayonhub-api/src/app.ts:204`, `bayonhub-api/src/app.ts:205`, `bayonhub-api/src/app.ts:206`, `bayonhub-api/src/app.ts:207`, `bayonhub-api/src/app.ts:208`.
- Returns 200 when all ok, 503 when degraded — `bayonhub-api/src/app.ts:200`, `bayonhub-api/src/app.ts:202`.
- Exposed at both `/health` and `/api/health` — `bayonhub-api/src/app.ts:214`, `bayonhub-api/src/app.ts:215`.

### 6E — Group 46–48: Scripts — IMPLEMENTED

Files exist:

- `bayonhub-api/scripts/launch-check.ts`
- `bayonhub-api/scripts/smoke-launch.ts`
- `bayonhub-api/scripts/perf-check.ts`

Package scripts exist:

- `launch:check` — `bayonhub-api/package.json:15`
- `smoke` — `bayonhub-api/package.json:16`
- `perf:check` — `bayonhub-api/package.json:17`

## Section 7 — Wiring & Integration Gaps

### 7A — Frontend ↔ Backend connection — IMPLEMENTED

- Production frontend env points at `https://api.bayonhub.com` — `bayonhub-app/.env.production:1`.
- Production example env points at `https://api.bayonhub.com` — `bayonhub-app/.env.example:2`.
- Local dev env points at `http://localhost:4000` — `bayonhub-app/.env.local:1`.

### 7B — Plus/Free display vs enforcement gap — PARTIAL

Backend enforcement:

- Free listing count max is 5/day — `bayonhub-api/src/modules/listings/service.ts:914`, `bayonhub-api/src/modules/listings/service.ts:921`, `bayonhub-api/src/modules/listings/service.ts:924`.
- Photo max is Free 5, Plus 20 — `bayonhub-api/src/modules/listings/service.ts:905`, `bayonhub-api/src/modules/listings/service.ts:910`, `bayonhub-api/src/modules/listings/service.ts:911`.
- Plus is checked with `plusUntil > new Date()` or lifetime flag — `bayonhub-api/src/modules/users/service.ts:85`.

Frontend display:

- Pricing plans are hardcoded in `PricingSection`, not sourced from the backend — `bayonhub-app/src/components/sections/PricingSection.jsx:14`, `bayonhub-app/src/components/sections/PricingSection.jsx:36`.
- Pricing translations describe plans but do not state Free 5/day, Free 5 photos, Plus 20 photos, or unlimited daily listing count — `bayonhub-app/src/lib/translations.js:1239`, `bayonhub-app/src/lib/translations.js:1240`, `bayonhub-app/src/lib/translations.js:1245`, `bayonhub-app/src/lib/translations.js:1247`.

### 7C — Translation key gaps — IMPLEMENTED

All Prompt 4 keys checked and present in both EN and KM:

- `legal.lastUpdated` — `bayonhub-app/src/lib/translations.js:1167`, `bayonhub-app/src/lib/translations.js:2576`
- `postingRules.*` — EN `bayonhub-app/src/lib/translations.js:1211` through `bayonhub-app/src/lib/translations.js:1220`; KM `bayonhub-app/src/lib/translations.js:2620` through `bayonhub-app/src/lib/translations.js:2629`
- `map.listingLocation` — `bayonhub-app/src/lib/translations.js:131`, `bayonhub-app/src/lib/translations.js:1540`
- `filter.allProvinces` — `bayonhub-app/src/lib/translations.js:262`, `bayonhub-app/src/lib/translations.js:1671`
- `consent.*` — EN `bayonhub-app/src/lib/translations.js:1161` through `bayonhub-app/src/lib/translations.js:1166`; KM `bayonhub-app/src/lib/translations.js:2570` through `bayonhub-app/src/lib/translations.js:2575`
- `admin.payment.*` — `bayonhub-app/src/lib/translations.js:1000`, `bayonhub-app/src/lib/translations.js:1001`, `bayonhub-app/src/lib/translations.js:1002`, `bayonhub-app/src/lib/translations.js:2409`, `bayonhub-app/src/lib/translations.js:2410`, `bayonhub-app/src/lib/translations.js:2411`

### 7D — Dead code or incomplete stubs — PARTIAL

No Prompt 4 backend helper appears totally orphaned:

- `normalizeProvinceFilter` is imported and used — `bayonhub-api/src/modules/listings/service.ts:17`, `bayonhub-api/src/modules/listings/service.ts:471`, `bayonhub-api/src/modules/listings/service.ts:511`, `bayonhub-api/src/modules/listings/service.ts:543`.
- `slugToDisplayName` is imported and used — `bayonhub-app/src/components/layout/Footer.jsx:5`, `bayonhub-app/src/components/layout/Footer.jsx:8`.
- `sendAdminTwoFactorOTP` / `verifyAdminTwoFactorOTP` are imported by auth controller and used — `bayonhub-api/src/modules/auth/controller.ts:12`, `bayonhub-api/src/modules/auth/controller.ts:15`, `bayonhub-api/src/modules/auth/controller.ts:84`, `bayonhub-api/src/modules/auth/controller.ts:100`.
- `requireAdmin2FA` and `adminIpAllowlist` are imported and mounted — `bayonhub-api/src/modules/admin/router.ts:9`, `bayonhub-api/src/modules/admin/router.ts:71`.
- `refundPayment` is imported and used by admin router — `bayonhub-api/src/modules/admin/router.ts:36`, `bayonhub-api/src/modules/admin/router.ts:122`.

Incomplete end-to-end wiring:

- Admin 2FA is backend-only. There is no frontend caller for `/api/auth/admin/2fa/send` or `/api/auth/admin/2fa/verify`; only backend references are present in repo-wide search. This makes the protected admin panel incomplete for real admins once `requireAdmin2FA` is active.

## Priority Fix List

1. Add frontend admin 2FA step-up UI/API calls — Impact: HIGH — Group: 41
2. Surface exact Free/Plus limits on Pricing page from config or shared constants — Impact: MEDIUM — Group: 3B/3C integration
3. Move `ADMIN_IP_ALLOWLIST` unset warning to startup instead of first admin request — Impact: LOW — Group: 34
4. Consider replacing legacy `terms.draftNotice` / `privacy.draftNotice` key names with neutral names in a future translation cleanup — Impact: LOW — Group: 35

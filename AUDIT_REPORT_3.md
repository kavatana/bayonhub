# BayonHub Codebase Audit 3 — 2026-05-17

## Executive Summary

- Map/location readiness: partial
- Deployment blockers: 8 (HIGH: 3, MEDIUM: 5)
- Performance issues: 8
- Frontend launch blockers: 8
- Payment issues: 5
- Admin gaps: 5
- Missing launch features: 3 (MUST HAVE: 0, NICE TO HAVE: 3)
- Legal gaps: 4
- Overall launch readiness: 6.5/10

Scope note: this was a read-only source audit. I did not rerun build/lint because the task allowed writing only this report; Vite build health is based on the existing `bayonhub-app/dist` artifacts generated on 2026-05-17.

## Section 1 — Location & Map Readiness

Location fields found on `Listing`:

- `province String` required: `bayonhub-api/prisma/schema.prisma:92`
- `district String?` optional: `bayonhub-api/prisma/schema.prisma:93`
- `addressDetail String?` optional: `bayonhub-api/prisma/schema.prisma:94`
- `lat Float?` optional: `bayonhub-api/prisma/schema.prisma:95`
- `lng Float?` optional: `bayonhub-api/prisma/schema.prisma:96`
- `@@index([province])`: `bayonhub-api/prisma/schema.prisma:130`

MAP: `bayonhub-api/src/modules/listings/validators.ts:23` — Listing creation requires `province`, but validates it only as a non-empty sanitized string, not against a Cambodia province enum/list — MEDIUM

MAP: `bayonhub-api/src/modules/listings/validators.ts:28` — `lat` is converted with `Number()` but has no latitude range validation or Cambodia bounds validation — MEDIUM

MAP: `bayonhub-api/src/modules/listings/validators.ts:29` — `lng` is converted with `Number()` but has no longitude range validation or Cambodia bounds validation — MEDIUM

MAP: `bayonhub-api/prisma/schema.prisma:129-135` — `province` is indexed, but `district`, `(province,district)`, and geospatial/range access patterns are not indexed, so map-style or district filtering will not scale well — LOW

MAP: `bayonhub-app/src/lib/locations.js:3-29` — The frontend has a Cambodia province list with EN/KM labels and slugs — ready

MAP: `bayonhub-app/src/lib/locations.js:46-68` — District data exists only for a small subset of provinces; the fallback creates generic Central/North/South districts rather than real Cambodia district data — LOW

MAP: `bayonhub-app/package.json:26-35` — `leaflet` and `react-leaflet` are installed — ready

MAP: `bayonhub-app/src/components/ui/MapView.jsx:1-89` — A Leaflet map component exists and supports marker drag/click selection — ready

MAP: `bayonhub-app/src/components/ui/MapView.jsx:69` — Map tiles use OpenStreetMap directly; no production tile quota/provider fallback is configured — LOW

MAP: `bayonhub-app/src/components/layout/Footer.jsx:15-22` — Footer location links pass province slugs such as `phnom-penh`, while listing filters/search use province strings such as `Phnom Penh`; this can produce empty filtered category pages depending on route parsing — MEDIUM

## Section 2 — Production Deployment Readiness

DEPLOY: `bayonhub-api/.env.example:1-40` — `MERCHANT_API_KEY_BINDINGS` is referenced by the merchant API but missing from `.env.example` — MEDIUM

DEPLOY: `bayonhub-api/src/config/env.ts:5-26` — Production-required env validation omits `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `ABA_WEBHOOK_SECRET`, and R2 credentials, so production can boot with critical optional integrations missing — HIGH

DEPLOY: `bayonhub-api/src/app.ts:93-118` — API CORS allows only `FRONTEND_URL` exactly, not both `https://bayonhub.com` and `https://www.bayonhub.com` unless one is separately configured elsewhere — MEDIUM

DEPLOY: `bayonhub-api/src/server.ts:17-19` — Socket.io CORS also allows only `process.env.FRONTEND_URL`, so the www/apex domain mismatch can break realtime messaging — MEDIUM

DEPLOY: `bayonhub-api/src/modules/auth/oauth.ts:20-30` — Google OAuth callback is hardcoded to `https://api.bayonhub.com` instead of being derived from an API base URL env var — MEDIUM

DEPLOY: `bayonhub-api/src/modules/auth/oauth.ts:20-74` — Facebook OAuth callback has the same hardcoded API domain risk — MEDIUM

DEPLOY: `bayonhub-api/src/app.ts:40-80` — Helmet, HSTS, CSP, no-sniff, frameguard, and referrer policy are configured — ready

DEPLOY: `bayonhub-api/src/app.ts:54` — CSP `imgSrc` hardcodes `https://media.bayonhub.com`; if `R2_PUBLIC_URL` is changed to another CDN/custom domain, images may be blocked by CSP — MEDIUM

DEPLOY: `bayonhub-api/.env.example:1` — `DATABASE_URL` example does not document Railway pooling, `connection_limit`, or timeout parameters; Prisma uses the URL unchanged — MEDIUM

DEPLOY: `bayonhub-api/src/lib/prisma.ts:5-9` — PrismaClient has no explicit connection limit or timeout configuration; Railway pooling must be encoded in `DATABASE_URL` or it will be easy to over-open connections — MEDIUM

DEPLOY: `bayonhub-api/.env.example:2` — Redis example is `redis://HOST:PORT` and does not document TLS/`rediss://` for production Redis — LOW

DEPLOY: `bayonhub-api/src/config/redis.ts:3-7` — Redis uses `lazyConnect` and retry strategy; if Redis fails at startup the server continues serving requests — ready

DEPLOY: `bayonhub-api/src/server.ts:55-60` — Redis startup failure is caught and logged, but OTP/rate-limit/session-adjacent features will degrade without a health-state response that operators can monitor — MEDIUM

DEPLOY: `bayonhub-api/railway-start.sh:1-5` — Startup runs `prisma migrate deploy` before `node dist/server.js`, and production seed has been removed — ready

DEPLOY: `bayonhub-api/src/app.ts:212-225` — If the API serves the frontend build directly, `express.static()` is used without immutable cache headers for hashed assets — LOW

## Section 3 — Performance & Scalability

PERF: `bayonhub-api/src/modules/listings/service.ts:614-740` — Public listing feeds filter by status/deletedAt/expiresAt/category/province and order by promoted/createdAt, but schema only has single-column indexes; add compound indexes for the main feed patterns — HIGH

PERF: `bayonhub-api/src/modules/listings/service.ts:460-480` — `district` is filterable, but `Listing` has no `@@index([district])` or `@@index([province, district])` — MEDIUM

PERF: `bayonhub-api/src/modules/listings/service.ts:512-525` — Search filters and sorts by `price`, but `Listing.price` has no index; price-range category pages will degrade with larger data — MEDIUM

PERF: `bayonhub-api/src/modules/listings/service.ts:522-525` — Search can order by `viewCount`, but `Listing.viewCount` has no index — LOW

PERF: `bayonhub-api/src/modules/listings/service.ts:743-815` — Search uses offset pagination (`skip`/`OFFSET`) for page-based results; large page numbers will degrade on large listing tables — MEDIUM

PERF: `bayonhub-api/src/modules/sellers/service.ts:12-71` — Seller analytics loads all seller listings and sorts/calculates in memory; large sellers can create high memory and latency spikes — MEDIUM

PERF: `bayonhub-api/src/modules/admin/service.ts:835-843` — Admin featured listings endpoint is unbounded and returns all featured records — LOW

PERF: `bayonhub-api/src/modules/admin/service.ts:863-891` — Admin appeals and verification request endpoints are unbounded; these should be paginated before launch — MEDIUM

PERF: `bayonhub-api/prisma/migrations/20260429144500_add_search_vector/migration.sql:14` — A GIN index exists for `search_vector`, and `pg_trgm` is enabled in migrations — ready

PERF: `bayonhub-api/src/modules/listings/service.ts:761-773` — Search still combines full-text/trigram ranking with offset and count queries; without measured `EXPLAIN ANALYZE`, expect degradation around tens of thousands of active listings, especially above 50k-100k rows — MEDIUM

## Section 4 — Frontend Launch Readiness

FRONTEND: `bayonhub-app/src/App.jsx:7-31` — All route components referenced in the router exist and are lazy-loaded — ready

FRONTEND: `bayonhub-app/src/components/layout/Footer.jsx:32` — Footer links to `/posting-rules`, but `bayonhub-app/src/App.jsx:82-115` defines no `/posting-rules` route; this is a live broken navigation path — MEDIUM

FRONTEND: `bayonhub-app/src/components/layout/Footer.jsx:7-11` — Footer social links point to generic platform homepages (`facebook.com`, `t.me`, `tiktok.com`, `youtube.com`) instead of BayonHub brand accounts — LOW

FRONTEND: `bayonhub-app/src/components/layout/Footer.jsx:69-78` — Footer social touch targets are `h-10 w-10` (40px), below the 44px mobile target budget — LOW

FRONTEND: `bayonhub-app/src/pages/HomePage.jsx:127-134` — Plus/featured homepage fetch failures are swallowed and rendered as empty data; no error state is surfaced for that section — LOW

FRONTEND: `bayonhub-app/src/pages/HomePage.jsx:444-448` — Google Play and App Store CTAs are disabled with “coming soon”; acceptable pre-app-launch, but not ready if mobile app availability is part of launch messaging — LOW

FRONTEND: `bayonhub-app/src/pages/StorefrontPage.jsx:192-194` — Seller storefront pages set only a title, not a unique meta description or Open Graph tags — MEDIUM

FRONTEND: `bayonhub-app/src/pages/RecentlyViewedPage.jsx:21-23` — Recently viewed page sets only a title and no meta description — LOW

FRONTEND: `bayonhub-app/public/sitemap.xml:1-128` — Static sitemap exists but has stale fixed dates and duplicated/slugged location URLs; deployment relies on `_redirects` behavior to use the API sitemap — MEDIUM

FRONTEND: `bayonhub-app/dist/assets` — Existing build artifacts show largest JS chunk about 307 KB (`vendor-misc`), `vendor-three` about 142 KB, and no chunk above 500 KB — ready

FRONTEND: `bayonhub-app/dist/assets` — Existing build artifacts do not show circular dependency or unused import warnings in the available output, but I did not rerun `npm run build` during this read-only audit — verified from existing artifacts

## Section 5 — Payments & Subscriptions

PAY: `bayonhub-api/src/modules/payments/router.ts:227-230` — If `ABA_WEBHOOK_SECRET` is missing, ABA webhook verification returns true and processes the webhook; because the secret is optional in env validation, production can accept unsigned payment webhooks — HIGH

PAY: `bayonhub-api/src/modules/payments/router.ts:340-372` — KHQR generation always creates a new `Payment` row/reference and does not reuse an existing pending payment for the same user/listing/plan — MEDIUM

PAY: `bayonhub-api/src/modules/payments/router.ts:407-437` — Duplicate webhook after a completed payment is mostly handled, but concurrent duplicate webhooks can both observe non-PAID status before the transaction and race on `ListingPromotion.paymentId` — MEDIUM

PAY: `bayonhub-api/src/modules/payments/router.ts:438-445` — Failed webhooks set `PaymentStatus.FAILED`; this enum exists in schema, so the path is schema-valid — ready

PAY: `bayonhub-api/src/modules/admin/service.ts:306-350` — Admin-approved Plus payments extend from current `plusUntil` if active, so overlapping purchases stack; this is coherent, but the product should document whether stacking is intentional — LOW

PAY: `bayonhub-api/src/modules/users/service.ts:80-85` — Plus status is computed dynamically from `plusUntil`, so new listing limits are enforced after expiry on future actions — ready

PAY: `bayonhub-api/src/modules/listings/service.ts:888-923` — When Plus expires, existing listings above the free quota are not automatically archived or de-promoted; limits apply only to future create paths — MEDIUM

PAY: `bayonhub-api/prisma/schema.prisma:429-437` — `REFUNDED` exists as a payment status, but no refund route/service was found; refunds appear manual/out-of-band — MEDIUM

PAY: `bayonhub-api/src/modules/admin/service.ts:353-383` — Rejected payments are retained as `REJECTED` rows with review notes, not cleaned up; this is acceptable for audit history if policy confirms retention — ready

## Section 6 — Admin Panel

Admin actions found:

- Dashboard/statistics, reports, listing moderation, image review, users, payments, Plus gifting/revocation, featured listings, analytics, appeals, verification requests, KYC review, import endpoints.

ADMIN: `bayonhub-api/src/modules/admin/router.ts:69` — Admin protection is role-based through the main auth flow; no separate admin login was found — MEDIUM

ADMIN: `bayonhub-api/src/modules/admin/router.ts:69` — No admin 2FA or IP allowlist middleware was found for admin routes — HIGH

ADMIN: `bayonhub-api/src/modules/admin/audit.ts:41-74` — Admin audit logging falls back to console because no `AdminAuditLog` Prisma model/migration exists; audit history is not durable in the DB — HIGH

ADMIN: `bayonhub-api/src/modules/admin/router.ts:241-255` — KYC review mutation does not call `logAdminAction()`, even though the audit action types include KYC actions — MEDIUM

ADMIN: `bayonhub-api/src/modules/admin/router.ts:283-335` — Listing status, bulk action, and image review mutations do not write audit records — MEDIUM

ADMIN: `bayonhub-api/src/modules/admin/router.ts:304-309` — Bulk listing action accepts arbitrary `ids` array length and has no dry-run/confirmation token at the API layer — MEDIUM

ADMIN: `bayonhub-app/src/pages/AdminPage.jsx:774-779` — Admin UI has bulk approve/delete buttons, but no export action was found for users/listings/payments/reports — NICE TO HAVE

## Section 7 — Missing Launch Features

MISSING FEATURE: Listing share — exists fully. `bayonhub-app/src/components/listing/ListingDetail.jsx:269-272` uses native share, and the share modal exists at `bayonhub-app/src/components/listing/ListingDetail.jsx:847-867`.

MISSING FEATURE: Listing save/bookmark — exists fully. Store/API wiring exists in `bayonhub-app/src/store/useListingStore.js:354-374` and saved pages/components are present.

MISSING FEATURE: Seller follow — exists fully. Backend follow/unfollow routes call service methods at `bayonhub-api/src/modules/users/router.ts:252-261`, and listing/storefront UI calls follow/unfollow in `bayonhub-app/src/components/listing/ListingDetail.jsx:333-348` and `bayonhub-app/src/pages/StorefrontPage.jsx:182-186`.

MISSING FEATURE: Report listing — exists fully. Listing detail opens report flow and submits via store at `bayonhub-app/src/components/listing/ListingDetail.jsx:947-997`.

MISSING FEATURE: Price negotiation / make offer flow — exists partially — launch impact: NICE TO HAVE. `bayonhub-app/src/components/listing/ListingDetail.jsx:1001-1009` collects an offer and `bayonhub-app/src/components/listing/ListingDetail.jsx:424` creates an `OFFER` lead, but there is no structured counter-offer/negotiation workflow.

MISSING FEATURE: Listing bump / repost — exists partially — launch impact: NICE TO HAVE. Plus bump exists, but no separate repost/renew flow was found for expired listings.

MISSING FEATURE: Phone number reveal — exists fully. `bayonhub-app/src/components/listing/ListingDetail.jsx:728` uses `PhoneReveal`, and storefront has a reveal toggle at `bayonhub-app/src/pages/StorefrontPage.jsx:517`.

MISSING FEATURE: Search by image — fully missing — launch impact: NICE TO HAVE. No image-search API, UI, or store action was found.

MISSING FEATURE: Category browse page — exists fully. `bayonhub-app/src/App.jsx:89-90` routes category pages.

MISSING FEATURE: Featured/promoted listing display on homepage — exists fully. Homepage fetches featured listings at `bayonhub-app/src/pages/HomePage.jsx:127-137`.

## Section 8 — Legal & Compliance

LEGAL: `bayonhub-app/src/pages/PrivacyPage.jsx:18-20` — Privacy Policy page exists and is routed, but only sets a title and no meta description — LOW

LEGAL: `bayonhub-app/src/pages/PrivacyPage.jsx:35` — Privacy Policy visibly marks itself as draft/pending legal review — HIGH

LEGAL: `bayonhub-app/src/pages/TermsPage.jsx:18-20` — Terms page exists and is routed, but only sets title/robots and no meta description — LOW

LEGAL: `bayonhub-app/src/pages/TermsPage.jsx:36` — Terms of Service visibly marks itself as draft/pending legal review — HIGH

LEGAL: `bayonhub-app/src/components/layout/Footer.jsx:28-29` — Terms and Privacy are linked from the footer — ready

LEGAL: `bayonhub-app/src` — No cookie consent/banner component was found, despite the Privacy page discussing cookies/local storage — MEDIUM

LEGAL: `bayonhub-api/src/modules/users/service.ts:460-570` — Account deletion removes DB rows and listing images, but KYC private document objects are deleted only as DB rows at `line 539`; object storage deletion for KYC docs was not found — HIGH

LEGAL: `bayonhub-api/src/modules/kyc/router.ts:88-113` — KYC resubmission overwrites stored private document keys, but there is no cleanup of old private document objects before/after upsert — MEDIUM

## Phase G3 Recommended Priority List

1. Require `ABA_WEBHOOK_SECRET` in production and fail closed on unsigned webhooks — Impact: HIGH — Effort: LOW — Prevents forged payment approvals.
2. Add durable `AdminAuditLog` model/table and log all admin mutations — Impact: HIGH — Effort: MEDIUM — Admin accountability is a launch requirement.
3. Add admin 2FA or IP allowlist for `/api/admin/*` — Impact: HIGH — Effort: MEDIUM — Reduces takeover blast radius.
4. Finalize legal Terms and Privacy copy — Impact: HIGH — Effort: LOW — Current pages disclose draft legal status.
5. Delete KYC private document objects on account deletion and resubmission — Impact: HIGH — Effort: MEDIUM — Prevents retained PII after user deletion.
6. Add compound listing feed indexes for status/deletedAt/category/province/promoted/createdAt — Impact: HIGH — Effort: MEDIUM — Main browse pages depend on these paths.
7. Make production env validation include refresh JWT settings, ABA secret, and R2 credentials — Impact: HIGH — Effort: LOW — Avoids booting a degraded production API.
8. Add both apex and www domains to API and Socket.io CORS — Impact: HIGH — Effort: LOW — Prevents domain-specific auth/realtime failures.
9. Move OAuth API base URL to env — Impact: MEDIUM — Effort: LOW — Makes staging and domain migration safe.
10. Add Redis health/degraded-state visibility — Impact: MEDIUM — Effort: LOW — Startup currently logs but continues with broken OTP/rate-limit dependencies.
11. Add province enum/list validation and lat/lng bounds validation — Impact: MEDIUM — Effort: LOW — Prevents invalid Cambodia location data.
12. Normalize province slug vs display-name filtering — Impact: MEDIUM — Effort: MEDIUM — Fixes slugged footer/category location links.
13. Add district and province/district indexes — Impact: MEDIUM — Effort: LOW — Makes location filtering scale.
14. Replace offset pagination in search with cursor/keyset strategy where practical — Impact: MEDIUM — Effort: MEDIUM — Avoids deep-page degradation.
15. Make KHQR generation idempotent for same user/listing/plan pending payment — Impact: MEDIUM — Effort: MEDIUM — Reduces duplicate pending payment clutter.
16. Add transactional duplicate-webhook protection with atomic status transition — Impact: MEDIUM — Effort: MEDIUM — Avoids race failures under retries.
17. Add `/posting-rules` route or remove the footer link — Impact: MEDIUM — Effort: LOW — Fixes a broken launch navigation path.
18. Add Storefront meta descriptions and OG tags — Impact: MEDIUM — Effort: LOW — Improves seller-page SEO.
19. Add pagination to admin featured, appeals, and verification request lists — Impact: MEDIUM — Effort: LOW — Avoids admin performance cliffs.
20. Decide and document Plus expiry behavior for existing over-quota listings — Impact: MEDIUM — Effort: LOW — Clarifies subscription enforcement.

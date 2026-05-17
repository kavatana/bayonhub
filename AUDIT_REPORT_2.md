# BayonHub Codebase Audit 2 — 2026-05-17

## Executive Summary

- Schema issues: 20 (HIGH: 4, MEDIUM: 11, LOW: 5)
- Auth gaps: 10
- Permission gaps: 7
- Missing rate limits: 8
- Job reliability issues: 8
- Storage risks: 8
- Notification gaps: 13
- Observability gaps: 9
- PWA issues: 4
- Infrastructure issues: 8
- Overall infrastructure readiness: 6/10

Notes:
- This was a read-only, source-verified audit. The only file written is `AUDIT_REPORT_2.md`.
- I did not run lint/build because this audit forbids writes except this report, and build commands can update generated artifacts.
- I did not repeat Audit 1 findings unless this prompt explicitly asked for deeper behavior in the same area.

## Section 1 — Schema Audit

SCHEMA: `User.phone` — required/unique, but OAuth creates placeholder values like `google-${profile.id}` and `facebook-${fbId}` when a real phone is unavailable; this makes optional-login data look verified-shaped and forces fake identifiers into a phone field — severity: HIGH

SCHEMA: `User.passwordHash` — required even for OAuth users, causing empty-string password hashes for social-login accounts; model should represent "no password credential" explicitly — severity: MEDIUM

SCHEMA: `Notification.userId` — scalar string has no Prisma relation to `User`, no foreign key, and no `onDelete`; notifications can outlive deleted users and cannot use relation integrity — severity: HIGH

SCHEMA: `Review.listingId` — optional scalar string has no relation to `Listing`; reviews can reference deleted/nonexistent listings and cannot cascade or restrict consistently — severity: MEDIUM

SCHEMA: `Listing.deletedAt` — field exists but seller delete sets only `status: REMOVED`; admin bulk actions use `DELETED` or hard delete; `deletedAt` is not the canonical soft-delete marker — severity: MEDIUM

SCHEMA: `Listing.deletedAt` — public listing queries in `buildWhere()` filter status/expiresAt but do not filter `deletedAt: null`; any active row with `deletedAt` set would remain visible — severity: HIGH

SCHEMA: `Listing.deletedAt` — raw SQL search clauses filter `l.status = 'ACTIVE'` but omit `l."deletedAt" IS NULL` — severity: HIGH

SCHEMA: `Listing.deletedAt` — `getListing()`, featured listings, related/similar listings, seller listings, sitemap, stats, and storefront listing includes mainly filter `ACTIVE` but not `deletedAt: null` — severity: MEDIUM

SCHEMA: `Lead.listingId` / `Lead.userId` — relations have no `onDelete`; leads are manually deleted in account/admin hard-delete paths, but direct parent deletion can fail or leave inconsistent retention behavior — severity: MEDIUM

SCHEMA: `Conversation.buyerId` / `Conversation.sellerId` / `Message.conversationId` — no cascade/restrict policy is declared; user deletion works only through manual service cleanup, and conversation/message retention rules are not encoded in the schema — severity: MEDIUM

SCHEMA: `Payment.userId` / `Payment.listingId` — no `onDelete` policy; `listingId` is nullable and admin hard delete manually nulls it, but the schema does not enforce `SetNull` for other delete paths — severity: MEDIUM

SCHEMA: `KYCApplication.userId` / `MerchantProfile.userId` — required one-to-one relations have no cascade policy; account deletion relies on manual cleanup order — severity: MEDIUM

SCHEMA: `Listing.currency` / `Payment.currency` — raw strings instead of a Prisma enum; invalid currencies can be stored unless every caller validates perfectly — severity: LOW

SCHEMA: `Listing.condition` / `Listing.imageReviewStatus` — raw strings instead of enums; listing condition and image-review workflow states are not schema-enforced — severity: LOW

SCHEMA: `Appeal.status`, `VerificationRequest.status`, `Notification.type`, `PlusGift.giftType` — workflow state stored as raw strings despite finite state sets in code — severity: MEDIUM

SCHEMA: `Report` — has `createdAt` but no `updatedAt`; moderation records need an audit trail for status changes — severity: MEDIUM

SCHEMA: `Notification` — has `createdAt` but no `updatedAt`/`readAt`; read-state changes cannot be audited — severity: LOW

SCHEMA: `Appeal`, `PhoneOTP`, `RefreshToken`, `PlusGift`, `ListingPromotion` — no `updatedAt`; several are security or paid-feature records where lifecycle changes matter — severity: LOW

SCHEMA: `KYCApplication` — model acronym produces Prisma client access as `kYCApplication` in code; this inconsistent casing increases implementation mistakes around sensitive identity data — severity: LOW

SCHEMA: Decimal fields — `Listing.price` and `Lead.offerPrice` use `Decimal(12,2)`, and `Payment.amount` uses `Decimal(10,2)`; these do not overflow the stated ~$10M USD equivalent range — severity: LOW positive finding

## Section 2 — Auth & Session Audit

AUTH: `bayonhub-api/src/modules/auth/service.ts:91-98` — access/refresh token expiry values are hardcoded to `15m` and `30d`; `JWT_EXPIRES_IN` and `JWT_REFRESH_EXPIRES_IN` are required env vars but ignored — severity: MEDIUM

AUTH: `bayonhub-api/src/middleware/auth.ts:42` and `src/modules/auth/service.ts:321` — JWT verification checks signature/expiry only; no issuer or audience claims are signed or validated — severity: MEDIUM

AUTH: `bayonhub-api/src/middleware/auth.ts:42` and `src/modules/messages/socket.ts:15` — `jwt.verify()` has no explicit `algorithms` allowlist; `alg: none` is rejected by jsonwebtoken with a secret, but an explicit HS algorithm whitelist would narrow confusion risk — severity: LOW

AUTH: `bayonhub-api/src/modules/auth/service.ts:321-337` — refresh token rotation is implemented by deleting the matched DB token and storing a new hashed token, but reuse detection does not revoke the whole session family when an already-rotated token is replayed — severity: MEDIUM

AUTH: `bayonhub-api/src/modules/auth/service.ts:325-326` — expired refresh tokens are rejected but not deleted in this path; there is also no cleanup job for expired `RefreshToken` rows — severity: MEDIUM

AUTH: `bayonhub-api/src/modules/auth/controller.ts:110-114` and `src/modules/auth/service.ts:361-364` — logout-all deletes all refresh tokens, but existing access tokens remain usable until their 15-minute expiry — severity: MEDIUM

AUTH: `bayonhub-api/src/lib/otp.ts:21-28` — Redis OTP verification enforces expiry by Redis TTL and consumes on success, but failed attempts are not counted or locked out — severity: HIGH

AUTH: `bayonhub-api/src/modules/auth/service.ts:197-208` — DB-backed phone OTP verification enforces `expiresAt` and `used`, but failed attempts are not counted or locked out — severity: HIGH

AUTH: `bayonhub-api/src/modules/auth/oauth.ts:20-30` and `:74` — OAuth callback base is hardcoded to `https://api.bayonhub.com` instead of env-derived API origin; staging/custom domains will break callbacks — severity: MEDIUM

AUTH: `bayonhub-api/src/modules/auth/oauth.ts:38-51` and `:82-95` — Google/Facebook users with matching email are reused, but users without a real phone get placeholder phone values and remain unable to post until `/api/auth/otp/verify` replaces the phone and marks it verified — severity: LOW

AUTH: `bayonhub-app/src/api/client.js:35-40` and `src/store/useAuthStore.js:10-12` — refresh tokens are backend httpOnly cookies, not localStorage; localStorage auth tokens are disabled in production, but local/offline mode still stores mock access tokens by design — severity: LOW positive finding

## Section 3 — Role & Permission Matrix

| Capability | Guest | Free User | Plus User | Merchant | Admin | API-key |
|---|---|---|---|---|---|---|
| Browse listings | Yes: public listing/search/seller/storefront reads | Yes | Yes | Yes | Yes | No general browse API beyond public endpoints |
| Post listings | No | Yes if phone-verified; 5/day; 5 photos | Yes if phone-verified; no daily free limit; 20 photos | Same as user unless Plus/phone-verified | Yes, and can update others through admin/listing owner bypass | No |
| Message sellers | No | Yes via `/api/conversations` | Yes | Yes | Yes | No |
| Access storefront | Can view Plus sellers only | Can view Plus sellers; cannot own storefront unless Plus | Yes | Yes if Plus | Yes | Can read merchant profiles through merchant API |
| Dashboard analytics | No | Limited seller analytics returns `plusRequired` and total views | Full seller analytics | Same as Plus if Plus | Full admin analytics | No |
| Upload KYC docs | No | Yes | Yes | Yes | Admin reviews only | No |
| Access admin panel | No | No | No | No | Yes, `requireAuth` + `requireAdmin` | No |
| Call merchant API | No | Yes, because `requireAuthOrApiKey` accepts any authenticated user | Yes | Yes | Yes | Yes, if key matches `MERCHANT_API_KEYS` |

PERMISSION GAP: `PUT /api/v1/merchant/profile/:userId` — any authenticated user can update any merchant profile by UUID; ownership is checked only for API-key denial, not for normal auth — severity: HIGH

PERMISSION GAP: `POST /api/v1/merchant/onboard` — API-key callers can pass any valid `merchant_id` UUID and upsert that user's merchant profile — severity: HIGH

PERMISSION GAP: `GET /api/v1/merchant/profile/:userId` — any authenticated user or API-key can read any merchant profile by UUID; there is no owner/admin/API-key scope binding — severity: MEDIUM

PERMISSION GAP: `POST /api/storefront/review` — any authenticated user can review any seller/listing; code checks only "not yourself" and does not require a completed conversation, purchase, or active listing relationship — severity: MEDIUM

PERMISSION GAP: `POST /api/kyc/submit` — any authenticated user can submit identity documents, including accounts with unverified placeholder OAuth phones; if phone verification is a prerequisite for trusted identity, this should be enforced — severity: MEDIUM

PERMISSION GAP: `POST /api/conversations` — authenticated users can start a conversation with arbitrary `sellerId`; the route does not verify that `sellerId` owns the supplied listing or is a seller — severity: MEDIUM

PERMISSION GAP: `GET /api/sellers/me/analytics` — Free users can access partial analytics; if dashboard analytics is intended Plus-only, the endpoint should return only a Plus-gated response without metrics — severity: LOW

## Section 4 — Rate Limiting

Global limiter: yes. `bayonhub-api/src/app.ts:151-155` applies public listing read exceptions and then `apiLimiter` to `/api/` at 100 req/min per IP.

Per-route limiters found:
- `POST /api/auth/login` — `loginLimiter` 5/15 min plus IP auto-block.
- `POST /api/auth/register` — `registerLimiter` 5/hour.
- `POST /api/auth/send-otp` and `POST /api/auth/otp/send` — `forgotPasswordLimiter` plus `otpLimiter`.
- `POST /api/listings` and `POST /api/listings/draft` — `postingLimiter` plus `uploadLimiter`.
- Listing upload endpoints — `uploadLimiter` on `/upload-image`; `/upload-local` has no upload limiter but is non-production only.
- `POST /api/listings/:id/lead` — `contactLimiter`.
- Telegram user webhook — 20/min in `users/router.ts`.

MISSING RATE LIMIT: `POST /api/auth/verify-otp` — OTP verification attempts are not route-limited, and the OTP service does not count failed attempts — severity: HIGH

MISSING RATE LIMIT: `POST /api/auth/otp/verify` — authenticated phone-verification attempts have no route limiter or max-attempt lockout — severity: HIGH

MISSING RATE LIMIT: `POST /api/conversations` — conversation creation can be spammed under only the global API limit — severity: MEDIUM

MISSING RATE LIMIT: `POST /api/conversations/:id/messages` — REST message sending has no per-user/per-conversation limiter; only Socket.io has a Redis message limiter — severity: HIGH

MISSING RATE LIMIT: `POST /api/payments/submit` — payment screenshot upload has no payment/upload-specific limiter — severity: MEDIUM

MISSING RATE LIMIT: `POST /api/payments/khqr/generate` — authenticated users can generate many pending payment rows under only the global limiter — severity: MEDIUM

MISSING RATE LIMIT: `POST /api/listings/:id/report` — reports are auth-required in the controller but have no report-specific limiter — severity: MEDIUM

MISSING RATE LIMIT: `/api/admin/*` mutating endpoints — no admin-specific burst limit for destructive operations such as listing deletes, user bans, payment approvals, or imports — severity: LOW

## Section 5 — Background Jobs

Registered jobs:
- `src/lib/scheduler.ts:8` — every 30 minutes, expire active listings.
- `src/lib/scheduler.ts:26` — every 5 minutes after startup interval begins, expire pending payments.
- `src/lib/scheduler.ts:45` — every 12 hours after startup interval begins, deactivate expired promotions.
- `src/jobs/listingExpiry.ts:125` — daily 18:00 UTC / 01:00 ICT, archive expired listings and send 3-day reminders.
- `src/jobs/listingExpiry.ts:143` — daily 01:00 UTC / 08:00 ICT, daily seller view digest.
- `src/server.ts:27-30` — `startScheduler()` and `startListingExpiryJob()` are registered inside the `server.listen()` callback.

Defined but not registered: none found under `bayonhub-api/src/jobs/`; all job files discovered are registered.

JOB: `src/lib/scheduler.ts` + `src/jobs/listingExpiry.ts` — listing expiry is implemented twice, once every 30 minutes and once daily, with slightly different data updates (`archivedAt` only in the daily job) — severity: MEDIUM

JOB: `src/lib/scheduler.ts` and `src/jobs/listingExpiry.ts` — no distributed lock; every Railway/server instance will run the same cron/interval jobs and can duplicate reminders/digests or race updates — severity: HIGH

JOB: `src/jobs/listingExpiry.ts:48-58` — reminder de-dupe is `findFirst` then `notifyUser`, not atomic; two instances can both pass the check and create duplicate notifications — severity: MEDIUM

JOB: `src/jobs/listingExpiry.ts:103-112` — daily digest de-dupe is also `findFirst` then `notifyUser`, not atomic — severity: MEDIUM

JOB: `src/lib/scheduler.ts:26-67` — `setInterval` handles are not stored, cleared, or coordinated with graceful shutdown — severity: MEDIUM

JOB: `src/lib/scheduler.ts:20-22`, `:38-40`, `:64-66`, `src/jobs/listingExpiry.ts:131-135`, `:148-152` — failures are caught and logged, but there is no retry queue, admin alert, or error tracker integration — severity: MEDIUM

JOB: `src/server.ts:21-30` — Redis connection failure is swallowed and jobs are still registered; there is no DB/Redis health gate before background processing starts — severity: MEDIUM

JOB: `src/lib/scheduler.ts:5` — scheduler returns no job handles/status object, so health checks cannot report whether background jobs are registered or still alive — severity: LOW

## Section 6 — File Storage

STORAGE: `src/lib/s3.ts:37-92` — listing/avatar/payment images are normalized to WebP and stored under generated keys such as `listings/{userId}/{uuid}.webp`, `avatars/{userId}/{uuid}.webp`, and `payments/{userId}/{uuid}.webp`; original filenames are not used — severity: LOW positive finding

STORAGE: `src/modules/listings/service.ts:1087-1093` — seller delete only changes listing status to `REMOVED`; uploaded listing images remain in R2/local storage — severity: HIGH

STORAGE: `src/modules/admin/service.ts:158-166` — admin hard delete removes DB rows but does not delete listing images from R2/local storage — severity: HIGH

STORAGE: `src/modules/users/service.ts:560-570` — account deletion attempts best-effort storage cleanup, but only uses `ListingImage.url`; generated thumbnails (`thumbUrl`) are not deleted — severity: MEDIUM

STORAGE: `src/modules/kyc/router.ts:92-115` and `src/modules/admin/service.ts:1001-1022` — KYC resubmission/rejection updates keys/status but does not delete superseded or rejected documents, and no retention policy is encoded — severity: MEDIUM

STORAGE: `src/lib/scheduler.ts` / `src/jobs/listingExpiry.ts` — no orphan-upload cleanup job exists for listing images, payment screenshots, KYC documents, avatars, or failed partial uploads — severity: HIGH

STORAGE: `src/modules/payments/service.ts:117-126` — payment screenshots use public `processAndUpload()` storage and the DB stores a public URL; payment receipts should be private or signed-read only — severity: HIGH

STORAGE: `src/lib/s3.ts:131-174` — KYC documents use `uploadPrivateDocument()` and signed read URLs, but they are stored in the same configured R2 bucket without code-level ACL separation; privacy depends on bucket/domain configuration outside the code — severity: MEDIUM

STORAGE: `src/lib/s3.ts:99-104` — when R2 is missing, presigned upload URL generation still returns localhost `/api/listings/upload-local` and `/uploads/...`; in production `upload-local` returns 404 and `/uploads` is not served, so clients can receive unusable upload URLs instead of a hard 503 — severity: MEDIUM

STORAGE: `src/app.ts:147-149` and `src/lib/s3.ts:82-92` — local fallback writes under `public/uploads` and serves `/uploads` only outside production; production local fallback is intentionally unreachable — severity: LOW positive finding

## Section 7 — Notification Coverage

| Event | Current channel coverage |
|---|---|
| New message received | In-app + push + Telegram only when buyer messages seller; seller replies do not notify buyer |
| New listing approved/rejected by admin | None for status changes; image-review flag has in-app notification |
| Listing about to expire | In-app + push + Telegram via daily expiry job |
| Listing expired | None; status is updated only |
| Plus subscription activated | In-app + Telegram on manual payment approval; in-app only on gift |
| Plus subscription expiring soon | None |
| Plus subscription expired | None |
| Payment submitted | Admin email + admin Telegram; no persistent user confirmation beyond HTTP response |
| Payment approved/rejected by admin | In-app + Telegram; no email template for manual Plus approval/rejection |
| KYC submitted | None to admin beyond pending queue |
| KYC approved/rejected | None to user |
| New report filed | None to admin beyond reports queue |
| Password reset requested | SMS/local SMS path + email when user has email |
| New user registered | Welcome email only when user has email; phone-only registration has no welcome notification |
| Account banned | None to user |

NOTIFICATION GAP: New message received — buyer is not notified when seller replies through REST messaging because `notifyUser()` only runs when sender is not the seller — severity: HIGH

NOTIFICATION GAP: New listing approved/rejected by admin — no in-app, Telegram, push, or email notification on listing status approval/rejection — severity: HIGH

NOTIFICATION GAP: Listing expired — no seller notification when a listing is actually archived/expired — severity: MEDIUM

NOTIFICATION GAP: Plus subscription expiring soon — no 3-day/7-day warning job or notification — severity: HIGH

NOTIFICATION GAP: Plus subscription expired — no notification when `plusUntil` passes — severity: HIGH

NOTIFICATION GAP: Payment submitted — user receives no durable in-app/email/Telegram confirmation that the receipt entered review — severity: MEDIUM

NOTIFICATION GAP: Payment approved/rejected by admin — no email channel for manual Plus review outcomes — severity: LOW

NOTIFICATION GAP: KYC submitted — admin receives no alert when identity docs are submitted — severity: MEDIUM

NOTIFICATION GAP: KYC approved/rejected — user receives no in-app, Telegram, push, or email notification — severity: HIGH

NOTIFICATION GAP: New report filed — admin receives no alert for a newly filed report — severity: MEDIUM

NOTIFICATION GAP: New user registered — phone-only users receive no welcome notification because welcome email requires `user.email` — severity: LOW

NOTIFICATION GAP: Account banned — user receives no notification explaining ban reason or appeal path — severity: HIGH

NOTIFICATION GAP: Notification delivery failures — `notifyUser()` fire-and-forgets Telegram/push without recording failure state; email helpers return false but most callers ignore the result — severity: MEDIUM

## Section 8 — Logging & Observability

OBS: `bayonhub-api/package.json` — no Winston/Pino/Sentry/OpenTelemetry dependency found; observability is console + Morgan only — severity: MEDIUM

OBS: `src/app.ts:136-145` — production Morgan logs only requests with status >= 400 and writes plain text via `console.log`; successful request volume, latency, and route mix are not logged — severity: MEDIUM

OBS: `src/app.ts:130-134` — request IDs are generated, but Morgan/error logs do not include them and responses do not explicitly set `X-Request-Id` — severity: MEDIUM

OBS: `src/app.ts:224-240` — production 500 responses are hidden from clients, but the error handler does not log the exception before returning the generic response — severity: HIGH

OBS: `src/server.ts` — no `process.on("unhandledRejection")` or `process.on("uncaughtException")` handlers — severity: HIGH

OBS: `src/app.ts:172-201` — `/health` exists and checks DB connectivity plus Redis status; this is a positive finding — severity: LOW positive finding

OBS: `src/app.ts:172-201` — health reports R2/Twilio configuration, but does not actually verify R2 except startup `testR2Connection()`, and does not expose background job status — severity: LOW

OBS: `src/jobs/listingExpiry.ts` and `src/lib/scheduler.ts` — job failures log to console only; no metrics, retry counter, or admin alert — severity: MEDIUM

OBS: `src/modules/search/router.ts:8-20` — performs a DB extension check at module import time and logs to console; startup diagnostics are not structured and can fire before app readiness — severity: LOW

OBS: `grep -rn "console\\." src/ in bayonhub-api` — production code paths contain many console calls, including `console.log` in `rateLimiter.ts:47`, `app.ts:142`, `sms.ts`, `listings/service.ts:452`, plus widespread `console.warn/info/error`; most are not dev-gated or structured — severity: MEDIUM

## Section 9 — PWA & Offline

PWA: `bayonhub-app/vite.config.js:52-77` and `dist/manifest.webmanifest` — manifest includes name, short_name, start_url, display, background_color, theme_color, and 192/512 icons with `purpose: any maskable` — severity: LOW positive finding

PWA: `bayonhub-app/index.html:18` — references `/icons/apple-touch-icon.png`, but the file is missing from `public/icons`; iOS install/home-screen icon can 404 — severity: LOW

PWA: `bayonhub-app/dist/index.html:23` and `dist/registerSW.js` — production build registers `/sw.js` through VitePWA auto injection; main source has no manual registration, but build output confirms registration — severity: LOW positive finding

PWA: `bayonhub-app/vite.config.js:84-110` — Workbox caches `/api/listings` with `NetworkFirst` for up to 24h and `/api/search` with `StaleWhileRevalidate` for 6h; this supports offline browsing but can show stale listing/search data when the API is unreachable — severity: MEDIUM

PWA: `bayonhub-app/vite.config.js:81-83` — navigation fallback is `/index.html` with `/api/` denied, so app shell offline fallback exists — severity: LOW positive finding

PWA: `bayonhub-app/src/hooks/usePWAInstall.js:17-48` and `src/pages/HomePage.jsx:214-240` — install prompt hook is wired to a banner and CTA, with 7-day dismissal; however it appears whenever `beforeinstallprompt` fires, with no product timing rule beyond browser eligibility — severity: LOW

PWA: `bayonhub-app/src/store/useNotificationStore.js:97-100` — push subscription fallback tries to register `/sw.js` directly if no registration exists; in dev/source there is no `public/sw.js`, so this only works after the PWA build has generated `dist/sw.js` — severity: LOW

## Section 10 — Deployment & Infrastructure

INFRA: `bayonhub-api/railway.json:3-10` and `bayonhub-api/Dockerfile:1-13` — Railway uses the Dockerfile and starts `sh railway-start.sh`; Docker build runs `npm ci`, `prisma generate`, and `npm run build` — severity: LOW positive finding

INFRA: `bayonhub-api/railway-start.sh:2-4` — startup runs `prisma migrate deploy`, then `prisma db seed`, then `node dist/server.js`; running seed on every production start can mutate or duplicate production data depending on seed idempotency — severity: HIGH

INFRA: `bayonhub-api/railway-start.sh:2-4` — migrations run before server start, reducing outdated-schema deploy risk; however a failed migration prevents startup and there is no preflight/reporting wrapper — severity: LOW

INFRA: `bayonhub-api/src/server.ts` — no SIGTERM/SIGINT graceful shutdown handler; HTTP server, Socket.io, Prisma, Redis, cron jobs, and intervals are not closed deliberately — severity: HIGH

INFRA: `bayonhub-api/src/server.ts:27-47` — `server.listen()` callback starts jobs immediately after bind, not after a DB readiness check; Redis failure is caught and startup continues — severity: MEDIUM

INFRA: `bayonhub-api/src/app.ts:33` — `trust proxy` is set to `1`, which is appropriate for a single Railway-style reverse proxy; rate limiter also reads Cloudflare/X-Forwarded-For manually — severity: LOW positive finding

INFRA: `bayonhub-api/src/middleware/rateLimiter.ts:6` — in-memory `loginFailStore` is per-process and unbounded; it resets on restart and does not share blocks across Railway instances — severity: MEDIUM

INFRA: `bayonhub-api/src/modules/listings/service.ts:62` — `viewedSessions` is an unbounded in-memory `Set`; long-running containers can accumulate view-session keys indefinitely — severity: MEDIUM

INFRA: `bayonhub-api/src/lib/scheduler.ts:26-67` — interval jobs have no shutdown handles; this compounds graceful-shutdown and testability risk — severity: MEDIUM

INFRA: `bayonhub-api/Dockerfile:6` — `npm ci` installs dev dependencies in the runtime image; the image is larger than needed, though it is required here because TypeScript build and Prisma generation run inside the image — severity: LOW

INFRA: Node heap/process — no explicit Node heap size or PM2 config found; Railway restart policy handles restarts, but memory ceiling behavior is not tuned in repo config — severity: LOW

## Phase G2 Recommended Priority List

1. Add relation + cascade/restrict policies for `Notification.userId`, review/listing links, messages, leads, payments, KYC, and merchant profiles — Impact: HIGH — Effort: MEDIUM — schema should enforce the data-retention rules services currently perform manually.
2. Fix merchant API ownership checks — Impact: HIGH — Effort: LOW — any authenticated user can update arbitrary merchant profiles by UUID.
3. Add OTP verify attempt counters and route limiters — Impact: HIGH — Effort: LOW — current OTP verification can be brute-forced under the global limiter.
4. Make `deletedAt` behavior canonical or remove it — Impact: HIGH — Effort: MEDIUM — current queries mostly ignore `deletedAt`, so future soft-deleted active rows can leak.
5. Move payment screenshots to private storage — Impact: HIGH — Effort: MEDIUM — payment proof is sensitive and is currently stored as a public URL.
6. Stop running `prisma db seed` on every Railway startup — Impact: HIGH — Effort: LOW — production startup should not mutate seed data repeatedly.
7. Add graceful shutdown for HTTP, Socket.io, Redis, Prisma, cron, and intervals — Impact: HIGH — Effort: MEDIUM — deploy restarts should not drop work or leave dirty connections.
8. Add distributed locks for background jobs — Impact: HIGH — Effort: MEDIUM — multi-instance deploys will otherwise duplicate reminders/digests and race updates.
9. Add missing message/payment/report route-specific rate limits — Impact: HIGH — Effort: LOW — abuse-sensitive writes should not rely only on the global limiter.
10. Add KYC and report/admin alert notifications — Impact: MEDIUM — Effort: LOW — moderation and identity workflows need active operational signals.
11. Notify users for listing approval/rejection, KYC outcome, listing expiry, Plus expiry, and account bans — Impact: HIGH — Effort: MEDIUM — trust-critical user workflows currently change state silently.
12. Replace console/Morgan-only observability with structured logging and error tracking — Impact: HIGH — Effort: MEDIUM — production incidents need request IDs, JSON logs, and captured exceptions.
13. Add refresh-token cleanup and reuse-response policy — Impact: MEDIUM — Effort: LOW — token table growth and replay handling should be explicit.
14. Delete storage objects on seller/admin listing deletion and account deletion, including thumbnails — Impact: MEDIUM — Effort: MEDIUM — current deletion leaves billable and possibly sensitive orphan files.
15. Add the missing Apple touch icon and review PWA API cache staleness windows — Impact: MEDIUM — Effort: LOW — install polish and offline data freshness need tightening before launch.

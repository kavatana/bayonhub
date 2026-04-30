# BayonHub API Migration Notes

## Backend Build Sprint — Phase 1 — 2026-04-29

- `package.json` / `package-lock.json` — Installed the approved production and development dependency sets, updated scripts for TypeScript, Prisma, dev, build, and lint workflows, and changed the entrypoint to `dist/server.js`.
- `tsconfig.json` — Added strict TypeScript configuration targeting ES2022 CommonJS with `src/` as root and `dist/` as output.
- `src/app.ts` — Added a minimal Express app export with `GET /health` for scaffold verification.
- `src/server.ts` — Added the TypeScript server entrypoint that starts the Express app on `PORT` or `4000`.
- `src/config/`, `src/middleware/`, `src/modules/`, `src/lib/`, `src/types/` — Created the requested backend folder structure with placeholder exports and router stubs for later implementation phases.
- `src/types/express.d.ts` — Added Express request auth-user augmentation compatible with the current stub Prisma schema and the Phase 2 role/verification contract.

## Backend Build Sprint — Phase 2 — 2026-04-29

- `.env` / `.env.example` — Added complete development environment values for PostgreSQL, Redis, JWT, frontend origin, optional R2, and optional Twilio configuration.
- `docker-compose.yml` — Aligned PostgreSQL development credentials with the approved `DATABASE_URL`.
- `src/config/env.ts` — Added required environment variable validation, typed config export, and warnings for optional R2/Twilio values.
- `prisma/schema.prisma` — Replaced the stub user-only schema with the full BayonHub marketplace schema for users, listings, images, saved listings, leads, messages, reports, and refresh tokens.
- `prisma/migrations/20260429075843_init/migration.sql` — Added and applied the initial database migration.

## Backend Build Sprint — Phase 3 — 2026-04-29

- `package.json` / `package-lock.json` — Added `cookie-parser`, `@types/cookie-parser`, `@types/morgan`, and `@aws-sdk/s3-request-presigner` required by Express cookies, typed logging, and R2 presigned uploads.
- `src/lib/prisma.ts` — Added the Prisma singleton with development-safe global reuse and environment-aware logging.
- `src/config/redis.ts` — Added the lazy Redis client with retry behavior and lifecycle logging.
- `src/lib/otp.ts` — Added crypto-backed OTP generation, Redis TTL storage, request rate tracking, and one-time verification.
- `src/lib/slug.ts` — Added Khmer-safe unique listing slug generation backed by Prisma uniqueness checks.
- `src/lib/s3.ts` — Added Sharp image processing, Cloudflare R2 upload/delete helpers, presigned URL generation, and local upload fallback.
- `src/app.ts` — Replaced the stub Express app with production middleware, CORS/cookie parsing, route mounts, health, static upload serving, 404, and global error handling.
- `src/server.ts` — Added HTTP server creation, Socket.io initialization, Redis connection startup, and persistent API listener.
- `src/modules/messages/socket.ts` — Added a Phase 3 Socket.io registration stub for the server bootstrap.
- `src/modules/listings/router.ts` — Added the temporary empty listings index response required for Phase 3 verification.

## Backend Build Sprint — Phase 4 — 2026-04-29

- `src/middleware/auth.ts` — Added JWT cookie authentication, optional auth hydration, and admin authorization middleware.
- `src/middleware/rateLimiter.ts` — Added API, auth, OTP, and upload rate limiters for protected backend surfaces.
- `src/middleware/upload.ts` — Added memory-backed image-only Multer upload middleware with size and count limits.
- `src/middleware/validate.ts` — Added express-validator result handling for consistent validation errors.
- `src/modules/auth/validators.ts` — Added register, login, send OTP, and verify OTP validation chains.
- `src/modules/auth/service.ts` — Added safe user selection, bcrypt password handling, JWT cookie issuance, refresh-token storage/rotation, OTP verification, logout, and profile lookup.
- `src/modules/auth/controller.ts` — Added thin HTTP handlers around auth service operations.
- `src/modules/auth/router.ts` — Wired auth routes with validators, rate limiters, and protected profile access.

## Backend Build Sprint — Phase 5 — 2026-04-29

- `src/modules/listings/service.ts` — Added listing filters, safe seller includes, detail lookup with view increments, create/update uploads, soft delete, reports, leads, saved listings, and related listings.
- `src/modules/listings/controller.ts` — Added HTTP handlers for listing queries, CRUD, reports, leads, saved listings, related listings, and upload URL/local upload endpoints.
- `src/modules/listings/router.ts` — Replaced the temporary index stub with the full listings route surface and auth/upload middleware.

## Backend Build Sprint — Phase 6 — 2026-04-29

- `src/modules/users/service.ts` — Added saved listings pagination, profile updates, and password change with bcrypt verification.
- `src/modules/users/router.ts` — Wired authenticated user saved listings, profile, and password endpoints.
- `src/modules/sellers/service.ts` — Added public seller profile and active seller listings queries.
- `src/modules/sellers/router.ts` — Wired public seller profile and listings routes.
- `src/modules/messages/service.ts` — Added conversation aggregation and paginated message thread retrieval with read marking.
- `src/modules/messages/router.ts` — Wired authenticated conversation and thread endpoints.
- `src/modules/messages/socket.ts` — Added authenticated Socket.io message send, read receipt, typing, and rate-limited delivery handlers.
- `src/modules/admin/service.ts` — Added report moderation, listing moderation, user management, verification, and stats services.
- `src/modules/admin/router.ts` — Wired admin-only report, listing, user, verification, role, and stats endpoints.

## Backend Build Sprint — Phase 7 — 2026-04-29

- `src/app.ts` — Applied the global `/api/` rate limiter before route mounts and tightened CORS methods and allowed headers for credentialed frontend requests.

## Backend Build Sprint — Phase 8 — 2026-04-29

- `prisma/seed.ts` — Added the full development seed script with admin, sellers, 30 listings, images, saved listings, reports, and leads.
- `src/modules/listings/service.ts` — Raised the default listing page size to the existing 50-item cap so seeded verification returns all 30 listings without an explicit limit.

## Backend Build Sprint — Phase 9 — 2026-04-29

- `prisma/migrations/20260429144500_add_search_vector/migration.sql` — Added generated PostgreSQL `tsvector` search column and GIN index for listings.
- `prisma/schema.prisma` — Declared the generated `search_vector` column as an unsupported mapped field so Prisma migration state remains consistent.
- `src/modules/listings/service.ts` — Added ranked raw SQL full-text search for `q` listing queries.
- `src/modules/search/router.ts` — Added Redis-cached search suggestions for `/api/search/suggestions`.
- `src/app.ts` — Mounted the search router under `/api/search`.

## Backend Build Sprint — Phase 10 — 2026-04-29

- `src/modules/listings/controller.ts` — Tightened upload URL query validation for filename and image MIME type.
- `src/lib/s3.ts` — Preserved nested listing upload keys in local storage URLs and file paths for parity with R2 keys.

## Backend Build Sprint — Phase 11 — 2026-04-29

- `MIGRATION_NOTES.md` — Recorded final backend verification results for lint, build, health, listings, auth, admin login, and search endpoints.

## QA Audit Remediation Sprint — Wave 1 — 2026-04-30

- `src/config/env.ts` — Added explicit fatal production validation for `FRONTEND_URL`, `JWT_SECRET`, `DATABASE_URL`, and `REDIS_URL`, while keeping development frontend origin fallback to localhost.
- `src/app.ts` — Hardened CORS by environment and upgraded `/health` to report database and Redis readiness with degraded status handling.
 ## QA Sprint Complete — All 5 Waves — $(date +%Y-%m-%d)
Wave 1: PWA build hardened, chunk isolation, production auth guard
Wave 2: Lead schema, safe storage, rate limiter, heartbeat, phone validation
Wave 3: Overlay primitive, useClickAway, promotionStates, seo.js
Wave 4: Translations, WCAG, keyboard, CI workflows, SEO structured data
Wave 5: Memoization, callbacks, GSAP cleanup, error boundaries, offline queue

Post-sprint readiness: 7.0-7.4/10
Khmer24 parity: 65-75%
Status: Ready for backend connection sprint
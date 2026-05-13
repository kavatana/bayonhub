# BayonHub — Full Codebase Audit Report

**Date:** 2026-05-13  
**Scope:** `bayonhub-app/` (React 19 / Vite 5) + `bayonhub-api/` (Node 20 / Express 5 / Prisma)  
**Auditor:** Read-only. Zero files modified.

---

## Section 1 — Dead Code & Unused Files

### Frontend

| Finding | File | Detail |
|---|---|---|
| Re-export shim, nothing imports it | `src/hooks/useListings.js` | 2-line file re-exports `useListingStore as useListings`. No file imports under this alias — delete it. |
| `PostPage.jsx` is a redirect stub | `src/pages/PostPage.jsx` | Immediately calls `togglePostModal(true)` then `navigate("/", replace: true)`. Renders a skeleton for one frame then leaves. `/post` route should use `PostListingPage` directly. |
| Duplicate password-change route | `users/router.ts L98–122` | Both `PATCH /me/password` and `PUT /me/password` call the same `updatePassword()` handler. One is redundant. |
| Duplicate profile update route | `users/router.ts L80–96` | Both `PATCH /me` and `PUT /me` call `updateProfile()`. One can be removed. |
| `reports/router.ts` is empty | `modules/reports/router.ts` | 6 lines: creates a Router, exports it. Zero handlers. All report logic lives in `admin/router.ts`. |
| `escapeSvg` is an alias | `sitemap/router.ts L36–38` | Calls `escapeXml` verbatim. Not needed — use `escapeXml` directly. |

---

## Section 2 — Duplicate & Redundant Logic

| Finding | Files | Detail |
|---|---|---|
| `isPlusMember` computed in 3+ places | `DashboardPage.jsx:386`, `AccountPage.jsx:104`, `UpgradePage.jsx:13` | All repeat `Boolean(user?.plusUntil && new Date(plusUntil) > new Date())`. Extract to a `useAuthStore` selector. |
| `initials()` duplicated | `AccountPage.jsx:28` vs `StorefrontPage.jsx:223` | Same logic, different implementations. Move to `lib/utils.js`. |
| `getRelativeTime` duplicates `timeAgo` | `InboxPage.jsx:22–34` | Local function partially delegates to `timeAgo()`. Should be consolidated into `lib/utils.js`. |
| `maskPhone` has two strategies | `lib/utils.js:84–87` (Khmer style: `012 34X XXX`) vs `utils/safeUser.ts` (API style: `+855 *** *** 678`) | Two different masking formats for the same field. Unify on the API's format. |
| `createHttpError` copy-pasted | `admin/router.ts:54`, `listings/controller.ts:44`, `payments/router.ts:33` | Identical 5-line helper in 3 API files. Move to `src/lib/errors.ts`. |
| Analytics bar chart uses fake data | `DashboardPage.jsx:174` | `dayViews` is a deterministic math formula, not real per-day API data. Shown to Plus members as real analytics. |
| Leads tab uses mock buyer names | `DashboardPage.jsx:141` | `t("lead.mockBuyer", { number: … })` — placeholder data rendered in the production UI. |

---

## Section 3 — Broken & Incomplete Features

| Status | Feature | File | Detail |
|---|---|---|---|
| 🔴 BROKEN | `/post` route | `PostPage.jsx` | Navigates away immediately. Direct links to `/post` flash a skeleton then land on `/`. |
| 🔴 BROKEN | `GET /api/reports` | `modules/reports/router.ts` | Empty router — returns no data. |
| 🟡 INCOMPLETE | Leads tab | `DashboardPage.jsx:103` | No real lead data fetched. `dashboard.pendingLeads` stat is always hardcoded `0`. |
| 🟡 INCOMPLETE | Analytics chart | `DashboardPage.jsx:174` | Fake math curve, not connected to a real analytics endpoint. |
| 🟡 INCOMPLETE | Payment gateway E2E | `UpgradePage.jsx` + `payments/router.ts` | KHQR endpoint exists but frontend shows a static QR image (`/assets/aba-qr.png`) and accepts a screenshot upload. Not wired end-to-end. |
| 🟡 INCOMPLETE | Email delivery | `lib/emailTemplates.ts` | TODO comment. No provider (Resend/SES/SendGrid) is integrated. All emails (OTP, welcome, reset) fail silently. |
| 🟡 INCOMPLETE | Map integration | `translations.js:351` | `"post.mapSoon": "Map integration coming soon"` — still a placeholder in the posting wizard. |
| 🟡 INCOMPLETE | Notifications | `translations.js:29` | `"nav.notificationsSoon": "Notifications coming soon"` still visible in nav. |
| 🟡 INCOMPLETE | Canonical slug redirect | `StorefrontPage.jsx:98` | Uses `window.location.pathname` instead of `useLocation()` — rule violation and breaks SSR. |
| 🟡 INCOMPLETE | Socket.io | `package.json` | `socket.io-client` is installed but no component connects to a socket server. |

---

## Section 4 — Translation Audit

| Key | Issue |
|---|---|
| `"payment.abaQrAlt"` | Value is `"ABA QR code placeholder"` — "placeholder" is visible to screen readers as alt text |
| `"help.faq5Answer"` | Contains `"ABA KHQR placeholder payment flow"` — placeholder language leaked into user-facing FAQ |
| `"review.placeholder"` | Used as a `<p>` label in `StorefrontPage.jsx:414` — this is a textarea hint string, not a status label |
| `sort.views` vs `sort.mostViewed` | Same sort concept uses two different translation keys in `CategoryPage` vs `SearchPage` |
| `"validation.phoneFormat"` KM | Says `"0XX XXX XXX"` (local format) but the validation regex enforces `+855` international format |
| Bank account numbers | Hardcoded as translation strings in `translations.js` — changing account numbers requires a code deploy |
| Khmer strings generally | All machine-translated. No confirmed native speaker review. |

---

## Section 5 — Performance

### Frontend

| Severity | Finding | File | Detail |
|---|---|---|---|
| 🔴 HIGH | `fetchListings()` called on dashboard mount | `DashboardPage.jsx:388` | Fetches the full public listing feed just to populate Favorites/Saved tabs. Heavy unnecessary call for authenticated users. |
| 🟡 MED | `subcategoryChips` filters full listing array per chip | `CategoryPage.jsx:539–560` | Loops `listings.filter()` 4–5 times in one `useMemo`. Should derive counts from API `searchTotal`. |
| 🟡 MED | `fetchFollowers` called on every storefront navigation | `StorefrontPage.jsx:90–92` | No cache check or debounce. Re-fetches on every identifier change. |
| 🟡 MED | `sitemapCache` is in-process memory only | `sitemap/router.ts:25` | Flushed on any server restart. Move to Redis. |

### Backend

| Severity | Finding | File | Detail |
|---|---|---|---|
| 🟡 MED | `pg_trgm` extension not confirmed | `search/router.ts:23–37` | `similarity()` requires `CREATE EXTENSION pg_trgm`. Not documented anywhere. Crashes suggestions if missing. |
| 🟡 MED | Sitemap fetches up to ~50,000 listing IDs per generation | `sitemap/router.ts:72–83` | Full-table scan every hour. Consider a paginated sitemap index. |
| 🟢 LOW | Webhook HMAC uses `JSON.stringify(req.body)` | `payments/router.ts:215` | Acknowledged in a comment. Key-ordering in `JSON.stringify` can break signature comparison. Use raw body buffer. |

---

## Section 6 — Security

| Severity | Finding | Detail |
|---|---|---|
| 🔴 CRITICAL | `POST /users/telegram-webhook` has no auth | `users/router.ts:180` — No `requireAuth`, no Telegram token signature check, no rate limit. Anyone who discovers the URL can send arbitrary webhook events. |
| 🔴 CRITICAL | `console.log("[DEV OTP]…", phone)` | `api/auth.js:26` — Phone numbers logged to the browser console. Verify this is strictly gated behind `import.meta.env.DEV`. |
| 🟠 HIGH | `warn` and `unban` admin actions have no audit log | `admin/router.ts:415–433` — Only two destructive admin actions with no `logAdminAction()` call. All others are logged. |
| 🟠 HIGH | KYC document endpoint loads all pending applications to find one by ID | `admin/router.ts:226–227` — Full queue scan in JS. Also means approved/rejected KYC docs are inaccessible via this endpoint. |
| 🟠 HIGH | Webhook HMAC uses parsed body, not raw buffer | `payments/router.ts:215` — Acknowledged in a code comment. JSON.stringify key ordering is fragile. |
| 🟡 MED | `AUTH_USER_SELECT` includes `email` on every authenticated request | `middleware/auth.ts:25` — Email loaded into `req.user` on every request, available for accidental serialization. |
| 🟡 MED | `optionalAuth` swallows all JWT errors identically | `middleware/auth.ts:76–78` — Tampered tokens and missing tokens treated identically. No logging for abuse detection. |

---

## Section 7 — UX Audit

| Severity | Finding | File | Detail |
|---|---|---|---|
| 🔴 HIGH | 11-tab dashboard nav overflows on 390px | `DashboardPage.jsx:468` | `flex overflow-x-auto` with no scroll indicator. Tabs are hard to discover on mobile. |
| 🔴 HIGH | Mobile filter BottomSheet has no sticky Apply button | `CategoryPage.jsx:685` | For property/vehicle with 10+ filter sections, users must scroll past all filters to reach the Apply button. |
| 🟡 MED | `InboxPage` unauthenticated redirect is abrupt | `InboxPage.jsx:46–49` | `navigate("/")` fires without auth modal or message. Inconsistent with `DashboardPage` which shows the auth modal. |
| 🟡 MED | Password form inputs have no placeholder text | `AccountPage.jsx:371–373` | Three password inputs have `aria-label` only. Without visible labels, users cannot tell which field is which at a glance. |
| 🟡 MED | ABA QR image has no `onError` fallback | `UpgradePage.jsx:260` | `src="/assets/aba-qr.png"` — broken if file is missing. No error UI. |
| 🟡 MED | OTP submit button says "verified" not "verify" | `AccountPage.jsx:417` | `t("verify.verified")` is a past-tense confirmation string used as an action button label. |
| 🟢 LOW | `window.location.pathname` in `StorefrontPage` | `StorefrontPage.jsx:98` | AGENTS.md rule violation. Use `useLocation().pathname`. |

---

## Section 8 — Missing Launch Features

| Priority | Feature | Status | Detail |
|---|---|---|---|
| 🔴 P0 | Email delivery | ❌ NOT WORKING | `RESEND_API_KEY` in `.env.example` but Resend SDK not integrated. All emails fail silently. |
| 🔴 P0 | Telegram webhook security | ❌ MISSING | No bot token verification. Must fix before launch. |
| 🔴 P0 | `VITE_SITE_URL` and `VITE_API_URL` in `.env.example` | ❌ MISSING | Both are fatal if absent. `lib/seo.js:7` logs a FATAL for `VITE_SITE_URL`. Neither is in any env example. |
| 🟠 P1 | `pg_trgm` PostgreSQL extension | ❌ UNDOCUMENTED | Required for search suggestions. Not in migrations or setup guide. |
| 🟠 P1 | Listing expiry background job | ❌ MISSING | `expiresAt` exists on listings but no cron/worker updates `status = 'EXPIRED'`. Expired listings stay `ACTIVE` forever. |
| 🟠 P1 | Payment gateway E2E | 🟡 SCAFFOLDED | KHQR endpoint exists. Frontend not wired to it. Webhook implemented but untested against ABA sandbox. |
| 🟡 P2 | `robots.txt` | ❌ MISSING | No `public/robots.txt`. Search engines can index `/admin`, `/dashboard`, `/inbox`, and filter URLs. |
| 🟡 P2 | Dynamic OG meta on listing pages | 🟡 PARTIAL | `/og-image/:listingId` endpoint exists. Verify `ListingPage.jsx` `<Helmet>` points to it. |
| 🟡 P2 | Full-text search on main search path | 🟡 PARTIAL | `search_vector` exists. Confirm `searchListings` service uses `ts_rank` and not just `ILIKE`. |
| 🟢 P3 | PWA manifest icons | 🟡 UNVERIFIED | `vite-plugin-pwa` installed. Confirm all required sizes (192, 512) and `start_url` are configured. |
| 🟢 P3 | Prerender.io SSR | 🟡 UNVERIFIED | `PRERENDER_TOKEN` in `.env.example`. Integration not confirmed active. |

---

## Section 9 — Tech Debt Markers

| File | Type | Content |
|---|---|---|
| `lib/emailTemplates.ts` | TODO | "wire to SendGrid or AWS SES when ready" |
| `lib/s3.ts:83` | TODO | Local file-serving path unreachable in production |
| `translations.js:29` | User-visible | `"Notifications coming soon"` in nav |
| `translations.js:351` | User-visible | `"Map integration coming soon"` in posting wizard |
| `translations.js:433` | User-visible | `"Payment gateway coming soon. Your listing will be promoted after manual review."` |
| `translations.js:1003` | User-visible | `"ABA QR code placeholder"` as screen-reader alt text |
| `translations.js:1122` | User-visible | FAQ answer: "ABA KHQR placeholder payment flow" |
| `DashboardPage.jsx:141` | Mock data | Fake buyer names in Leads tab rendered to real users |
| `DashboardPage.jsx:174` | Mock data | Fake analytics chart shown to Plus members |
| `payments/router.ts:213` | NOTE comment | JSON.stringify key-ordering webhook HMAC risk, acknowledged but not fixed |

---

## Section 10 — Environment & Config

| Variable | Status | Note |
|---|---|---|
| `DATABASE_URL`, `REDIS_URL` | ✅ | Documented |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | ✅ | Documented with guidance |
| `R2_*` (5 vars) | ✅ | Documented |
| `TWILIO_*`, `PLASGATE_*` | ✅ | Documented |
| `ABA_*`, `TELEGRAM_BOT_TOKEN` | ✅ | Documented |
| `RESEND_API_KEY` | ✅ documented | Library NOT integrated |
| `VAPID_*`, `PRERENDER_TOKEN` | ✅ | Integration unconfirmed |
| `pg_trgm` extension | ❌ | Not in any setup doc or migration |
| `VITE_SITE_URL` | ❌ MISSING | Fatal if absent; not in any `.env.example` |
| `VITE_API_URL` | ❌ MISSING | Critical; not in frontend `.env.example` |

**Other dependency notes:**
- `socket.io-client` installed but never connected anywhere in the codebase
- `sharp` requires native binaries — must be pinned for the correct Docker platform
- `@gsap/react` / `browser-image-compression` — used correctly

---

## Phase G — Recommended Priority List

### P0 — Must fix before any public traffic

1. Wire **email delivery** (`RESEND_API_KEY` → Resend SDK → `emailTemplates.ts`)
2. Add **Telegram webhook bot-token signature verification** to `POST /users/telegram-webhook`
3. Add **`VITE_SITE_URL` and `VITE_API_URL`** to frontend `.env.example`
4. **Document and enable `pg_trgm`** in migrations or setup guide
5. **Fix `PostPage.jsx`** — replace the redirect stub with `PostListingPage` or redirect to `/post-listing`

### P1 — Fix before marketing launch

6. **Listing expiry cron job** — mark `status = 'EXPIRED'` where `expiresAt < NOW()`
7. **Add audit log** to `PATCH /admin/users/:id/warn` and `PATCH /admin/users/:id/unban`
8. **Replace mock lead/analytics data** with real API calls or clearly label as "coming soon"
9. **Add `public/robots.txt`** — disallow `/admin`, `/dashboard`, `/inbox`, `/search?*`
10. **Fix OTP button label** — `t("verify.verified")` → `t("verify.submitOtp")` in `AccountPage.jsx:417`
11. **Wire payment E2E** — connect `UpgradePage` to `POST /payments/khqr/generate` and poll `/payments/status/:reference`
12. **Fix webhook HMAC** — use `express.raw()` middleware for ABA webhook route

### P2 — Quality & polish

13. Consolidate `isPlusMember` into a Zustand selector
14. Consolidate `createHttpError` into `src/lib/errors.ts` in the API
15. Remove or merge duplicate routes (`PATCH`/`PUT /me` and `/me/password`)
16. Delete `hooks/useListings.js` (dead re-export)
17. Delete or implement `modules/reports/router.ts`
18. Fix `"payment.abaQrAlt"` — remove "placeholder" from alt text
19. Fix `"review.placeholder"` misuse in `StorefrontPage.jsx:414` — use a dedicated empty-state key
20. Add `onError` fallback to the ABA QR `<img>` in `UpgradePage`

### P3 — Long-term health

21. Native speaker **Khmer review** of all `km` translation strings
22. Unify `maskPhone` between `lib/utils.js` and `utils/safeUser.ts`
23. Replace `window.location.pathname` with `useLocation()` in `StorefrontPage.jsx`
24. **Dashboard mobile tab nav** — use `<select>` or collapsible nav on `< lg` screens
25. Either **wire Socket.io** or remove `socket.io-client` from `package.json`
26. Move real **bank account numbers** out of `translations.js` into env/admin config
27. Verify **PWA manifest icons** and `start_url` are correctly configured

---

*End of Audit Report — BayonHub v1.0 Pre-Launch*

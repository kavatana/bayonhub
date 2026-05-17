# BayonHub Codebase Audit — 2026-05-14

## Executive Summary
- Dead files: 4
- Duplicate code instances: 6
- Incomplete/broken features: 24
- Missing translation keys: 15 verified used keys missing EN or KM coverage; 22 additional dynamic `t()` calls cannot be statically verified
- Performance issues: 9
- Security gaps: 12
- UX issues found: 25 (HIGH: 8, MEDIUM: 13, LOW: 4)
- Missing launch features: 5/38 requested counter; 5 missing from 29 concrete checklist items provided
- Tech debt items: 19
- Overall launch readiness: 6/10

Notes:
- This was a read-only audit. The only file modified is this report.
- `npm run build` was run in `bayonhub-app` and passed. No app chunk exceeded 500 KB.
- UX section is source-only per instruction. I did not run the app or browser-check 390px overflow.
- Khmer naturalness cannot be reliably verified from source by a non-native review. I flagged concrete translation coverage and dynamic-key risks, not subjective rewrites.

## Section 1 — Dead Code

Command requested:
`grep -rn "import" src/ | awk -F"'" '{print $2}' | sort | uniq`

Result: the command returned only single-quoted imports and missed most double-quoted project imports, so I also cross-checked all JS/JSX/TS files by import resolution and basename references.

DEAD: `bayonhub-app/src/components/filters/FilterSidebar.jsx` — never imported and 0 basename references in app source.

DEAD: `bayonhub-app/src/components/listing/PostListingModal.jsx` — never imported and 0 basename references in app source; posting flow uses `PostAdWizard`.

DEAD: `bayonhub-app/src/components/three/EmptyStateOrb.jsx` — never imported and 0 basename references in app source.

DEAD: `bayonhub-api/src/modules/reports/service.ts` — never imported from any API source file; no reports router is registered.

Potentially unused exported frontend symbols:
- `src/lib/animations.js` — `heroParallax` exported but never referenced outside the file.
- `src/lib/categoryForms.js` — `getCategoryForm`, `defaultFields` exported but never referenced.
- `src/lib/locations.js` — `PHNOM_PENH_DISTRICTS`, `DISTRICTS_BY_PROVINCE` exported but never referenced.
- `src/lib/socket.js` — `getSocket`, `markMessageRead`, `sendTyping` exported but never referenced.
- `src/lib/utils.js` — `slugify`, `getListingSlug` exported but never referenced.
- `src/lib/validation.js` — `normalizePhone`, `CAMBODIA_PHONE_REGEX`, `LEAD_TYPES` exported but never referenced outside the module.
- `src/api/auth.js` — `refreshTokens` exported but never referenced.
- `src/api/listings.js` — `uploadImage`, `getRelated` exported but never referenced.
- `src/api/messages.js` — `sendMessageRest` exported but never referenced.

Hooks defined but never called: none verified. `useClickAway`, `useOnlineStatus`, `usePWAInstall`, and `useTranslation` all have external references.

Store slices/actions defined but not referenced outside store files:
- `src/store/useListingStore.js` — `hasMore`, `isFetchingMore`, `currentListingLoading`, `lastSearchParams`, `featuredListings`, `fetchMoreListings`, `getRecentlyViewedListings`, `deleteSavedSearch`.
- `src/store/useNotificationStore.js` — `refreshUnread`, `userVisibleOnly`, `applicationServerKey`.
- `src/store/useStorefrontStore.js` — `fetchReviews`, `postReview`.
- `src/store/useUIStore.js` — `notificationCount`, `currentUserId`, `setNotificationCount`, `addNotification`, `clearNotifications`.

Potentially unused exported API symbols:
- `bayonhub-api/src/lib/emailTemplates.ts` — `sendSellerInviteEmail`, `WELCOME_EMAIL`, `SELLER_INVITE_EMAIL`, `PASSWORD_RESET_EMAIL`, `PROMOTION_CONFIRMATION_EMAIL`.
- `bayonhub-api/src/lib/errors.ts` — `notFound`, `forbidden`, `badRequest`, `unauthorized`.
- `bayonhub-api/src/middleware/upload.ts` — `safeFilename`.
- `bayonhub-api/src/modules/auth/oauth.ts` — `oauthSuccessHandler`, `oauthFailureHandler`.
- `bayonhub-api/src/modules/listings/service.ts` — exported `SAFE_LISTING_INCLUDE`; used internally but no external import.
- `bayonhub-api/src/modules/messages/notifications.service.ts` — `createNotifications`.
- `bayonhub-api/src/utils/safeUser.ts` — `withMaskedPhone`.

Not counted as dead: `bayonhub-api/src/types/*.d.ts`; they have 0 import references but are TypeScript ambient declaration files.

## Section 2 — Duplicate Code

DUPLICATE: `bayonhub-app/src/lib/utils.js` + `bayonhub-api/src/utils/safeUser.ts` — `maskPhone` — recommend keeping separate only if frontend/server masking rules are intentionally allowed to diverge; otherwise keep server version as canonical and mirror tests.

DUPLICATE: `bayonhub-app/src/lib/sanitize.js` + `bayonhub-api/src/lib/sanitize.ts` + `bayonhub-api/src/modules/listings/validators.ts` — `sanitize`/`sanitizeHtml` behavior — recommend keeping shared backend sanitizer for writes and frontend sanitizer only for display.

DUPLICATE: `bayonhub-app/src/api/listings.js` + `bayonhub-app/src/api/users.js` — `fetchSavedListings` — recommend keeping `users.js` because the backend canonical route is `/api/users/me/saved`.

DUPLICATE: `bayonhub-api/src/modules/admin/service.ts` + `bayonhub-api/src/modules/listings/service.ts` — `getFeaturedListings` — recommend keeping both only if admin shape and public shape stay intentionally different; otherwise rename admin version to `getAdminFeaturedListings`.

DUPLICATE: `bayonhub-api/src/modules/auth/service.ts` + `bayonhub-api/src/modules/users/service.ts` — `getMe` — recommend keeping auth-session shape in `auth/service.ts` and profile/account shape in `users/service.ts`, with names that reflect the difference.

DUPLICATE: `bayonhub-api/src/modules/listings/service.ts` + `bayonhub-api/src/modules/users/service.ts` — `getSavedListings` — recommend keeping `users/service.ts` as account-owned and removing or renaming the listing service duplicate.

No duplicate translation keys were found inside either `en` or `km` object by source scan.

## Section 3 — Broken/Incomplete Features

Frontend routes from `src/App.jsx`: all lazy page component files exist.

INCOMPLETE: `/account` — account page fetches real user/profile data where API exists, but unauthenticated users only see the auth modal and a static unauthenticated page; no route-return-after-login is visible in this page.

INCOMPLETE: `/dashboard` — analytics tab still shows a "Detailed analytics coming soon" placeholder and uses local listing aggregates for important seller metrics.

INCOMPLETE: `/inbox` — no user-visible error state if `fetchConversations()` fails; it has loading and empty states only.

INCOMPLETE: `/seller/:id` and `/u/:slug` — frontend API caller uses `/storefront/:identifier`, but backend is mounted at `/api/storefront/:identifier`; live API storefront fetch will 404 through the Axios base URL.

INCOMPLETE: `/upgrade` — payment flow generates KHQR or local fallback, but local fallback leaves the user pending with no clear manual review completion path.

INCOMPLETE: `/pricing` — route exists but page chunk is only 0.77 KB and likely delegates to static pricing content; no evidence of real payment state integration there.

INCOMPLETE: `/notifications` — backend caller exists, but notification data shape is partly seeded/fallback in UI store; verify live behavior before launch.

INCOMPLETE: `/listing/:id` and slug routes — listing page fetches real data and has loading/error/empty states, but several buttons open external windows directly and the share preview image in the share modal lacks lazy loading.

INCOMPLETE: `/category/:slug` — has real search data, loading/error/empty states, and source-level mobile sheet handling, but the map popup image lacks `loading="lazy"` and the map markers `useMemo` dependency omits helper dependencies.

INCOMPLETE: `/search` — fetches real search endpoint when API is configured, but filter schema sends richer frontend facets than the backend search controller currently parses.

MOCK DATA: `bayonhub-app/src/api/listings.js` — large seeded listing set remains the localStorage fallback when `VITE_API_URL` is empty.

MOCK DATA: `bayonhub-app/src/api/auth.js` — mock register/login/OTP/reset behavior remains active when no backend is configured; includes `[DEV OTP]` console logging.

MOCK DATA: `bayonhub-app/src/api/notifications.js` — mock notifications are generated when no backend is configured.

MOCK DATA: `bayonhub-app/src/api/users.js` — mock profile/saved/update behavior remains active when no backend is configured.

MOCK DATA: `bayonhub-app/src/api/merchant.js` — mock merchant profile CRUD remains active when no backend is configured.

MOCK DATA: `bayonhub-app/src/components/dashboard/MessagesTab.jsx` — `mockConversations` seeds the dashboard messages tab.

NO CALLER: `GET /api/sellers/me/analytics` — no frontend API wrapper found.

NO CALLER: `GET /api/sellers/:id` — no frontend API wrapper found.

NO CALLER: `GET /api/sellers/:id/listings` — no frontend API wrapper found.

NO CALLER: `GET /api/search/suggestions` — no frontend API wrapper found.

NO CALLER: `GET /api/listings/upload-url` — no frontend API wrapper found.

NO CALLER: `POST /api/listings/upload-local` — no frontend API wrapper found.

NO CALLER: `POST /api/auth/logout-all` — no frontend API wrapper found.

NO CALLER: `POST /api/payments/submit`, `GET /api/payments/me`, `/api/payments/preauth`, `/api/payments/omw/*` — no frontend API wrappers found.

NO CALLER: several admin endpoints are called directly from `AdminPage.jsx` instead of through `src/api/`, which violates the requested "corresponding frontend caller in src/api/" check even when the UI has a direct Axios call.

API contract mismatches:
- `src/api/messages.js` calls `/api/messages/conversations`, `/api/messages/:userId`, and `/api/messages/send`, but backend registers messaging under `/api/conversations`.
- `src/api/storefront.js` calls `/storefront/...` and `/storefront/review`, but backend registers `/api/storefront/...`.
- `src/api/users.js` sends phone OTP verify through `/api/auth/otp/verify` without auth, but backend route requires `requireAuth`.

Response shape consistency:
- Backend endpoints return mixed raw objects, `{ data }`, `{ success }`, `{ applications }`, `{ error }`, and legacy aliases. This is visible across listings, admin, payments, KYC, notifications, and storefront routers.

Validation consistency:
- `src/modules/listings/validators.ts` defines a Zod `listingSchema`, but listing create/update/draft routes do not use it in `router.ts` or `controller.ts`.
- Many routers validate manually instead of Zod: users, messages, merchant, KYC, and much of admin.

## Section 4 — Translation Audit

Static used keys missing in one or both languages:
- `auth.logoutSuccess` — EN exists, KM missing.
- `hero.totalAds` — EN missing, KM missing.
- `listing.browseAll` — EN missing, KM missing.
- `listing.searchAgain` — EN missing, KM missing.
- `listing.title` — EN missing, KM missing.
- `listing.unavailableSubtitle` — EN missing, KM missing.
- `listing.unavailableTitle` — EN missing, KM missing.
- `nav.help` — EN exists, KM missing.
- `nav.search` — EN missing, KM missing.
- `post.expiresIn` — EN exists, KM missing.
- `post.postAnother` — EN exists, KM missing.
- `post.successSubtitle` — EN exists, KM missing.
- `post.successTitle` — EN exists, KM missing.
- `post.viewListing` — EN exists, KM missing.
- `ui.upload` — EN missing, KM missing.

Keys present in EN but missing KM:
- `auth.logoutSuccess`
- `nav.help`
- `nav.settings`
- `post.expiresIn`
- `post.postAnother`
- `post.successSubtitle`
- `post.successTitle`
- `post.viewListing`

Keys present in KM but missing EN: none found.

Dynamic `t()` calls that cannot be statically guaranteed:
- `src/components/dashboard/MessagesTab.jsx` — `conversation.nameKey`, `last?.textKey`, `message.textKey`.
- `src/components/dashboard/MyAdsTab.jsx` — template status key.
- `src/components/dashboard/NotificationsTab.jsx` — `notification.titleKey`, `notification.bodyKey`.
- `src/components/dashboard/VerificationTab.jsx` — `field.label`.
- `src/components/layout/Footer.jsx` — `labelKey`, `item.key`.
- `src/components/listing/PostListingModal.jsx` — `key`.
- `src/components/posting/PostAdWizard.jsx` — `submitLabelKey`.
- `src/components/search/SearchFilters.jsx` — `label`.
- `src/components/sections/PricingSection.jsx` — plan key fields.
- `src/components/storefront/ReviewModal.jsx` — `label`.
- `src/components/ui/Badge.jsx` — `badge.labelKey`.
- `src/components/ui/LoanCalculator.jsx` — `term.labelKey`, `bank.key`.
- `src/pages/CategoryPage.jsx` — `labelKey`, `option.key`, `label`, dynamic sort expression.
- `src/pages/DashboardPage.jsx` — `label`.
- `src/pages/SearchPage.jsx` — `label`.
- `src/pages/StorefrontPage.jsx` — dynamic day/review tag labels.
- `src/pages/UpgradePage.jsx` — `valueKey`, `feature`, `name`, `account`.

Dead translation keys:
- There are hundreds of keys not found by static `t("...")` scan. Many are likely intentionally used by dynamic key patterns above. High-confidence dead or placeholder keys include `auth.comingSoon`, `dashboard.mockMessage`, `dashboard.analyticsComingSoon`, `khqr.note`, `nav.notificationsSoon`, `post.mapSoon`, and `ui.comingSoon`.

KM manual review flags:
- No source-only scan can verify "Google Translate" quality. Manual native review should prioritize payment, KYC, auth errors, seller trust labels, and reporting/moderation strings because those affect conversion and user safety.

## Section 5 — Performance

Build command: `npm run build` in `bayonhub-app`.

Build result: PASS.

Chunks over 200 KB:
- `dist/assets/vendor-misc-D8fIgNWy.js` — 314.56 KB, gzip 107.41 KB.

Chunks near budget:
- `vendor-react` — 192.70 KB.
- `vendor-maps` — 160.44 KB.
- `vendor-three` — 145.45 KB.
- `index` — 116.13 KB.
- `vendor-gsap` — 116.09 KB.
- `app-translations` — 114.12 KB.

No chunk exceeded 500 KB. Three.js is isolated in `vendor-three`.

PERFORMANCE: `src/pages/CategoryPage.jsx:573` — map popup image lacks `loading="lazy"` and `srcSet`.

PERFORMANCE: `src/components/listing/ListingDetail.jsx:839` — share-preview image lacks `loading="lazy"`.

PERFORMANCE: `src/pages/StorefrontPage.jsx:381` — reviewer avatar image lacks `loading="lazy"`.

PERFORMANCE: `src/pages/AccountPage.jsx:235` — avatar image lacks `loading="lazy"`.

PERFORMANCE: `src/pages/UpgradePage.jsx:212` — QR image lacks `loading="lazy"`.

PERFORMANCE: `src/components/posting/PostAdWizard.jsx:757` — review cover image lacks `loading="lazy"`.

PERFORMANCE: `src/components/layout/Navbar.jsx:395` — suggestion image lacks `loading="lazy"`.

PERFORMANCE: `src/pages/CategoryPage.jsx:563-581` — `mapMarkers` uses `displayedListings` only as dependency while using `getListingImage`, `listingUrl`, and formatting helpers; likely safe but incomplete dependency array by strict hooks rules.

PERFORMANCE: production frontend contains logging calls including `console.log("[DEV OTP]...")`, `console.log("[Analytics]...")`, and multiple console warnings/errors. Some are DEV-gated, but `api/auth.js` mock OTP log is not explicitly gated by `import.meta.env.DEV`.

Backend performance:
- `src/modules/messages/service.ts` computes unread counts with `Promise.all(conversations.map(... prisma.message.count ...))`, an N+1 pattern for inbox loading.
- `src/jobs/listingExpiry.ts` runs `prisma.notification.findFirst` inside loops for expiring listings and seller digest notifications.
- `src/modules/admin/service.ts` import flow performs `findUnique`/`findFirst` inside a loop for every imported listing.
- `src/modules/users/service.ts` account deletion fetches user listings and then performs multiple dependent deletes; acceptable for rare deletion, but high blast-radius and should be load tested.
- Schema indexes cover many listing filters (`categorySlug`, `province`, `status`, `promoted`, `bumpedAt`, `createdAt`, `sellerId`) but not all common compound filters. Missing likely indexes: `(status, categorySlug, province, createdAt)`, `condition`, `negotiable`, `expiresAt`, `promotedUntil`, `deletedAt`.

## Section 6 — Security Gaps

SECURITY: `bayonhub-api/src/modules/listings/controller.ts:132-142` — create listing passes raw `req.body` to service; defined Zod `listingSchema` is not applied — severity: HIGH.

SECURITY: `bayonhub-api/src/modules/listings/controller.ts:148-164` — update listing passes raw `req.body`; defined Zod `listingSchema` is not applied — severity: HIGH.

SECURITY: `bayonhub-api/src/modules/listings/controller.ts:170-180` — draft save passes raw `req.body`; defined Zod `listingSchema` is not applied — severity: HIGH.

SECURITY: `bayonhub-api/src/modules/listings/controller.ts:206-218` — public/optional-auth report endpoint accepts `req.body.userId` as reporter identity — severity: HIGH.

SECURITY: `bayonhub-api/src/modules/kyc/router.ts:40-61` — KYC uploads use MIME allowlist from multer but do not call `validateMagicBytes` before private document upload — severity: HIGH.

SECURITY: `bayonhub-api/src/modules/payments/router.ts:53-56` — payment screenshot upload does not call `validateMagicBytes`; service only checks `file.mimetype.startsWith("image/")` — severity: MEDIUM.

SECURITY: `bayonhub-api/src/modules/payments/router.ts:224-233` — preauth endpoint validates manually, not Zod; fields from `req.body` directly feed builder — severity: MEDIUM.

SECURITY: `bayonhub-api/src/modules/merchant/router.ts:52-69` — `mapMerchantPayload(body: any)` accepts and maps raw body without Zod schema; API-key route can set profile fields broadly — severity: MEDIUM.

SECURITY: `bayonhub-api/src/modules/merchant/router.ts:113-119` — API-key authenticated caller can update any `profile/:userId` if they know a UUID; no per-merchant ownership check is visible — severity: HIGH.

SECURITY: `bayonhub-api/src/modules/users/router.ts:107-125` — profile/password updates consume raw body without route-level Zod validation — severity: MEDIUM.

SECURITY: `bayonhub-api/src/modules/messages/router.ts:20-31` — conversation creation validates only `sellerId` presence; no Zod schema and no UUID validation — severity: MEDIUM.

SECURITY: `bayonhub-app/src/components/auth/AuthModal.jsx:412` and `:579` — hardcoded Telegram hex colors in JSX violate project styling rules and create audit drift; not an exploit, but violates production UI policy — severity: LOW.

Positive findings:
- Admin router applies `router.use(requireAuth, requireAdmin)` before admin routes.
- CORS uses an explicit whitelist, not wildcard `*`.
- Production error handler hides 500 stack traces.
- Upload middleware has file size limits and MIME allowlist.
- Payment webhooks have signature verification when `ABA_WEBHOOK_SECRET` is configured.

## Section 7 — UX Audit

### 7A Mobile First

UX: `UpgradePage.jsx` — 7A — comparison table uses `min-w-[640px]`; horizontal scrolling is intentional but high-friction on 390px for a core upgrade decision — severity: MEDIUM.

UX: `HomePage.jsx` — 7A — multiple horizontal scrollers use `w-[70vw]`, `auto-cols-[78%]`, and text-xs chips; source suggests scan-friendly but tap density may be tight on 390px — severity: LOW.

UX: `DashboardPage.jsx` — 7A — dense tab rail uses horizontally scrolling pills and many tabs; first-time sellers may miss hidden tabs — severity: MEDIUM.

UX: `StorefrontPage.jsx` — 7A — seller stats labels use `text-[10px]`; this is below the 14px target and can be hard to read in Khmer/mobile — severity: MEDIUM.

UX: `PostAdWizard.jsx` — 7A — repeated `text-[10px]` and `text-xs` helper/status text in a critical posting flow; likely too small for mobile Khmer — severity: MEDIUM.

UX: `ListingDetail.jsx` — 7A — lightbox uses inline style for `userSelect`/`touchAction`; allowed only for GSAP/calc by project rule, and should be moved to Tailwind/class CSS — severity: LOW.

### 7B Empty States

UX: `InboxPage.jsx` — 7B — empty state explains no messages but has no CTA back to browsing/listings — severity: MEDIUM.

UX: `DashboardPage.jsx` — 7B — leads and analytics placeholders are not actionable enough for sellers beyond one upgrade CTA in analytics — severity: MEDIUM.

UX: `StorefrontPage.jsx` — 7B — listing tab delegates to `ListingGrid`; no storefront-specific CTA when seller has no listings — severity: MEDIUM.

UX: `SearchPage.jsx` and `CategoryPage.jsx` — 7B — empty search/category states are present and actionable — severity: LOW positive finding.

### 7C Loading States

UX: `HomePage.jsx` — 7C — has listing grid loading but plus featured fetch silently collapses to empty on failure; no skeleton/error for that section — severity: LOW.

UX: `InboxPage.jsx` — 7C — has skeleton list items — severity: LOW positive finding.

UX: `StorefrontPage.jsx` — 7C — has `StorefrontSkeleton` — severity: LOW positive finding.

UX: `AccountPage.jsx` — 7C — has profile skeleton, but individual account actions do not consistently show submission loading states — severity: MEDIUM.

### 7D Error States

UX: `InboxPage.jsx` — 7D — no error UI for failed conversation fetch; a failure can look like an empty inbox — severity: HIGH.

UX: `HomePage.jsx` — 7D — featured Plus fetch catches and clears state silently — severity: MEDIUM.

UX: `AccountPage.jsx` — 7D — profile store error is shown, but password/OTP/verification action failures mostly set generic saved markers or rely on store behavior — severity: MEDIUM.

UX: `PostAdWizard.jsx` — 7D — submit errors use toast and inline validation; acceptable, but upload/draft errors fall back to console/error toast patterns — severity: LOW.

### 7E Form UX

UX: `AuthModal.jsx` — 7E — OAuth buttons use `window.location.href`; external OAuth is acceptable, but it violates the broad navigation rule if interpreted strictly and bypasses route state tracking — severity: LOW.

UX: `AccountPage.jsx` — 7E — `submitProfile`, `submitPassword`, OTP, and verification submit buttons lack consistent loading/disabled state during async submission — severity: MEDIUM.

UX: `PostAdWizard.jsx` — 7E — main submit disables through `loading`, validates required fields inline, and preserves form data; positive finding — severity: LOW.

UX: `FeedbackTab.jsx` — 7E — textarea uses hardcoded placeholder `"..."` instead of `t()` and gives no contextual prompt — severity: MEDIUM.

### 7F Navigation & Flow

UX: Browse → listing → contact seller — 7F — flow exists through `ListingDetail`; contact actions are present, but unauthenticated save/report/message depends on pending action handling that is not visible in route-level code — severity: MEDIUM.

UX: Register → post first listing — 7F — `PostAdWizard` supports successful create and then "view listing/post another"; however several success keys are missing KM translations — severity: HIGH.

UX: Receive message → reply — 7F — `/inbox` and `/inbox/:conversationId` exist, but old `api/messages.js` callers still target non-existent backend routes in dashboard messaging — severity: HIGH.

UX: Upgrade to Plus → submit payment — 7F — upgrade flow has QR generation and polling, but local fallback/manual-review path is unclear after submission — severity: HIGH.

UX: `AccountPage.jsx` — 7F — unauthenticated users are not clearly returned to the account page after login — severity: MEDIUM.

### 7G Visual Consistency

UX: `AuthModal.jsx` — 7G — hardcoded Telegram colors `bg-[#2AABEE]` and `hover:bg-[#2298D6]` violate Tailwind theme-token rule — severity: MEDIUM.

UX: `StorefrontPage.jsx` — 7G — hardcoded `bg-blue-500`, `bg-amber-400`, and social text labels appear alongside tokenized design system colors — severity: LOW.

UX: `ListingDetail.jsx` — 7G — condition displays raw `listing.condition` instead of translation-backed condition label — severity: MEDIUM.

UX: `ListingListItem.jsx` — 7G — condition displays raw `listing.condition` — severity: MEDIUM.

### 7H Khmer Language UX

UX: `StorefrontPage.jsx` — 7H — stats labels use `text-[10px] uppercase tracking-widest`; this is likely poor for Khmer readability — severity: MEDIUM.

UX: `PostAdWizard.jsx` — 7H — category tiles render `item.label.en` in helper text, so Khmer mode can still show English category metadata — severity: HIGH.

UX: `AuthModal.jsx` and account/posting forms — 7H — many inline error spans use `text-xs`; Khmer error text can clip or wrap tightly — severity: MEDIUM.

UX: Global — 7H — Noto Sans Khmer is loaded in CSS import, and pages often apply `font-khmer` or `leading-8`, but coverage is not universal per source scan — severity: MEDIUM.

### 7I Plus/Upgrade UX

UX: `UpgradePage.jsx` — 7I — free-vs-Plus comparison exists and is clear, but horizontal scroll hides columns on mobile — severity: MEDIUM.

UX: `ListingDetail.jsx` — 7I — bump-to-top button is visible but disabled for non-Plus sellers; the disabled state has explanatory text nearby — severity: LOW positive finding.

UX: `DashboardPage.jsx` — 7I — analytics has Plus lock CTA, but other Plus feature locks are unevenly surfaced — severity: MEDIUM.

UX: `StorefrontPage.jsx` — 7I — Plus badge exists, but storefront API route mismatch can make paid storefront unavailable — severity: HIGH.

### UX Priority: Top 5 Conversion Killers

1. Storefront API path mismatch (`/storefront` vs `/api/storefront`) can break seller profile pages.
2. Missing KM translations on post success and listing unavailable flows undermine Khmer-first trust.
3. Upgrade flow leaves local/manual payment users in a vague pending state.
4. Inbox lacks error UI and can make messaging look empty when it fails.
5. Mobile upgrade comparison uses a 640px table, hiding the value proposition on 390px screens.

### UX Priority: Top 5 Seller Retention Issues

1. Dashboard analytics still contains "coming soon" behavior for Plus sellers.
2. Messaging has old API wrappers that do not match the backend route contract.
3. Storefront reviews/listings depend on a broken frontend API base path.
4. Seller stats and labels use very small text that is weak for repeated mobile use.
5. Listing expiry countdown is not clearly visible to sellers in the audited UI.

## Section 8 — Missing Launch Features

Frontend:
- YES — Dynamic OG meta tags per listing: `ListingPage.jsx` sets listing title, price-derived title, description, image, URL, and product schema.
- YES — SEO-friendly listing URLs: slug routes and `listingUrl()` exist, with canonical redirect.
- YES/PARTIAL — Sitemap.xml: public static file exists and `_redirects` maps `/sitemap.xml` to API sitemap; verify deployment platform honors redirect.
- YES — `robots.txt` exists.
- YES — branded 404 page exists.
- YES/PARTIAL — ErrorBoundary exists; `ErrorPage.jsx` exists but is not a normal route.
- YES — PWA manifest configured with app name and icons.
- YES — seller last seen timestamp is displayed on storefront/listing detail.
- YES — listing condition field exists in posting/filter/listing display.
- YES — price negotiable toggle and listing display exist.
- YES — seller response rate displayed on profile/storefront.
- NO — empty state on every list page is not guaranteed; inbox empty state lacks CTA and storefront lists rely on generic grid.
- NO — loading skeleton on every data-fetching page is not guaranteed for all sub-sections/actions.
- NO — toast notifications for all key actions are not consistent.
- YES — mobile bottom navigation bar exists in `Navbar.jsx`.
- NO/PARTIAL — search + filters working end-to-end with real backend data: backend search supports core params, but frontend sends richer facets than backend parses.
- YES — share button with Telegram/Facebook/copy link exists on listing detail.
- NO — listing expiry countdown visible to seller was not found.
- YES — bump to top button exists and calls backend/local fallback for Plus users.

Backend:
- YES — `GET /sitemap.xml` endpoint exists.
- YES — listing slug field and slug-based routing exist.
- YES — seller `lastSeen` field is updated on authenticated activity.
- YES — listing condition field exists in schema.
- YES — price negotiable boolean exists in schema.
- YES — full-text search exists through `search_vector` and raw SQL.
- YES — listing expiry background jobs are registered on startup.
- YES/PARTIAL — email sending code exists via Resend; env-dependent live sending unverified.
- YES/PARTIAL — Telegram notification code exists; env-dependent live sending unverified.
- YES — scheduler and listing expiry jobs are started in `server.ts`.

## Section 9 — Tech Debt

TECH DEBT: `bayonhub-api/src/lib/s3.ts:83` — TODO about production path/unreachable local upload fallback — BEFORE LAUNCH.

TECH DEBT: `bayonhub-api/src/modules/merchant/router.ts:79` — placeholder comment for API-key onboarding without a user — BEFORE LAUNCH.

TECH DEBT: `bayonhub-api/src/modules/auth/oauth.ts:44` — placeholder phone value for Google OAuth users — BEFORE LAUNCH.

TECH DEBT: `bayonhub-app/src/pages/HomePage.jsx:452` — `Phone mockup` comment/section marker — POST LAUNCH cleanup.

TECH DEBT: `bayonhub-app/src/components/home/HeroSection.jsx:234` — invisible placeholder comment for 3D orb — POST LAUNCH cleanup.

TECH DEBT: `bayonhub-app/src/lib/translations.js` — `nav.notificationsSoon` — BEFORE LAUNCH if notifications are intended live.

TECH DEBT: `bayonhub-app/src/lib/translations.js` — `ui.comingSoon` — BEFORE LAUNCH where visible in live features.

TECH DEBT: `bayonhub-app/src/lib/translations.js` — `post.mapSoon` — POST LAUNCH unless map integration is required for launch.

TECH DEBT: `bayonhub-app/src/lib/translations.js` — `khqr.note` says payment gateway coming soon — BEFORE LAUNCH for paid flows.

TECH DEBT: `bayonhub-app/src/lib/translations.js` — `auth.comingSoon` — BEFORE LAUNCH if social auth is visible.

TECH DEBT: `bayonhub-app/src/lib/translations.js` — `dashboard.analyticsComingSoon` — BEFORE LAUNCH for Plus promise.

TECH DEBT: `bayonhub-app/src/components/dashboard/MessagesTab.jsx` — `mockConversations` fallback — BEFORE LAUNCH when API is connected.

TECH DEBT: `bayonhub-app/src/components/posting/MediaUploader.jsx` — dev-only mock files button — POST LAUNCH if guarded by `!PROD`; verify production bundle strips it.

TECH DEBT: `bayonhub-app/src/api/auth.js` — mock auth/OTP fallback — BEFORE LAUNCH if production must always use backend.

TECH DEBT: `bayonhub-app/src/api/listings.js` — large hardcoded fallback data — BEFORE LAUNCH if production must use backend only.

TECH DEBT: `bayonhub-app/src/api/notifications.js` — mock notifications fallback — BEFORE LAUNCH if production notifications are required.

TECH DEBT: `bayonhub-app/src/api/users.js` — mock user/profile fallback — BEFORE LAUNCH if production auth is required.

TECH DEBT: `bayonhub-app/src/api/merchant.js` — mock merchant profile fallback — BEFORE LAUNCH for storefront/merchant launch.

TECH DEBT: `bayonhub-app/src/lib/analytics.js` — console-only analytics in dev; no production analytics sink found — POST LAUNCH unless metrics are required at launch.

LocalStorage fallback note:
- The prompt asks to check fallback that should be removed in production. Current project contract says never delete fallback paths and `VITE_API_URL` empty means fallback is live. Treat production removal as a product decision, not an automatic cleanup.

Hidden/disabled features:
- Plus analytics, map integration, notification soon labels, payment gateway note, dev media mock, and mock messaging remain visible or source-present.

## Section 10 — Environment Audit

### API env vars

REQUIRED:
- `DATABASE_URL` — required by `config/env.ts`.
- `REDIS_URL` — required by `config/env.ts`.
- `JWT_SECRET` — required by `config/env.ts` and auth middleware/service.
- `JWT_REFRESH_SECRET` — required by `config/env.ts` and refresh-token service.
- `JWT_EXPIRES_IN` — required by `config/env.ts`.
- `JWT_REFRESH_EXPIRES_IN` — required by `config/env.ts`.
- `PORT` — required by `config/env.ts`, also used by server/local upload fallback.
- `FRONTEND_URL` — required in production, optional fallback in development.
- `NODE_ENV` — operationally required for production behavior.

OPTIONAL / FEATURE-GATED:
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` — media/R2.
- `PLASGATE_PRIVATE_KEY`, `PLASGATE_SECRET`, `PLASGATE_SENDER_ID`, `PLASGATE_API_URL` — SMS.
- `ABA_MERCHANT_ID`, `ABA_API_KEY`, `ABA_WEBHOOK_SECRET` — payments/webhooks.
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` — Telegram login/notifications.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` — OAuth.
- `ADMIN_EMAIL`, `ADMIN_TELEGRAM_CHAT_ID`, `ADMIN_PANEL_URL` — payment/admin notifications.
- `RESEND_API_KEY` — email.
- `MERCHANT_API_KEYS` — merchant API auth.
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` — push notifications.
- `PRERENDER_TOKEN` — prerender middleware.

UNUSED / WEAKLY USED:
- `TWILIO_AUTH_TOKEN` — loaded into env config but no Twilio send path found.
- `TWILIO_ACCOUNT_SID`, `TWILIO_PHONE_NUMBER` — health/server warnings only; active SMS code uses PlasGate.
- `ADMIN_PANEL_URL` has fallback and is used; keep optional.

### App env vars

REQUIRED:
- `VITE_API_URL` — required for production real backend mode; app explicitly errors in production if empty.
- `VITE_SITE_URL` — required for canonical/SEO correctness.

OPTIONAL / FEATURE-GATED:
- `VITE_TELEGRAM_BOT_USERNAME` — Telegram OTP UI.
- `VITE_VAPID_PUBLIC_KEY` — push fallback when no backend.
- `VITE_APP_VERSION` — Settings page version display.

UNUSED / MISMATCH:
- `VITE_R2_PUBLIC_URL` appears in `.env.example` but no source usage was found.
- `VITE_VAPID_PUBLIC_KEY` and `VITE_APP_VERSION` are used in source but missing from `.env.example`.

### Package audit

App dependencies possibly installed but not imported in source:
- `@react-three/drei`, `@react-three/fiber` — likely pulled through dynamic Three scene helpers or planned; static scan found no direct imports.
- `@splinetool/react-spline`, `react-image-crop`, `react-infinite-scroll-component`, `react-window` — no direct imports found.
- `autoprefixer`, `postcss`, `tailwindcss` are build tooling and should be devDependencies, not production dependencies.

API dependencies possibly installed but not imported in source:
- `@aws-sdk/lib-storage`, `twilio`, `uuid`, `redis`, `pg` — no direct imports found in source scan; some may be transitive/runtime adapter assumptions.
- `@types/*` packages are in dependencies for several packages (`@types/node-cron`, `@types/passport`, `@types/passport-facebook`, `@types/passport-google-oauth20`, `@types/web-push`) and should generally be devDependencies.
- `prisma` is in dependencies; for many deployments it can be devDependency if migrations/generate do not run at runtime.

Known security update findings from `npm audit`:
- App: `vite@5.4.21` has moderate advisories through Vite/esbuild; audit says fix is `vite@8.0.12` and is semver-major.
- API: `file-type@16.5.4` has a moderate advisory; audit says fix is `file-type@22.0.1` and is semver-major.

Outdated major versions relevant to future upgrades:
- App: `vite` 5 -> 8, `react-router-dom` 6 -> 7, `tailwindcss` 3 -> 4, `@vitejs/plugin-react` 4 -> 6.
- API: `prisma`/`@prisma/client` 5 -> 7, `file-type` 16 -> 22.

## Phase G Recommended Priority List

1. Fix API path mismatches for storefront and messages — Impact: HIGH — Effort: LOW — broken live route contracts block storefront and messaging.
2. Apply Zod validation to listing create/update/draft — Impact: HIGH — Effort: MEDIUM — raw listing body reaches services despite existing schema.
3. Remove `req.body.userId` identity fallback from report creation — Impact: HIGH — Effort: LOW — public report endpoint can spoof reporter identity.
4. Add magic-byte validation to KYC and payment uploads — Impact: HIGH — Effort: LOW — sensitive uploads currently rely on weaker checks.
5. Add missing KM translations for post success/listing unavailable/account nav keys — Impact: HIGH — Effort: LOW — Khmer-first flows currently have missing keys.
6. Replace dynamic `t()` patterns with enumerated key maps where feasible — Impact: HIGH — Effort: MEDIUM — static translation coverage is not enforceable.
7. Normalize backend response envelopes for frontend-facing endpoints — Impact: HIGH — Effort: MEDIUM — mixed shapes increase integration bugs.
8. Add an inbox error state and retry CTA — Impact: HIGH — Effort: LOW — failed messaging currently risks looking empty.
9. Make Upgrade payment pending state actionable — Impact: HIGH — Effort: LOW — paid conversion path needs clear next steps.
10. Add seller-visible listing expiry countdown — Impact: MEDIUM — Effort: LOW — important seller retention feature is missing.
11. Remove or gate "coming soon" labels from launch-critical surfaces — Impact: MEDIUM — Effort: LOW — placeholders weaken trust.
12. Move build-only frontend packages from dependencies to devDependencies — Impact: MEDIUM — Effort: LOW — reduces production dependency surface.
13. Add compound DB indexes for common listing filters — Impact: MEDIUM — Effort: MEDIUM — category/province/status/sort queries need launch-scale support.
14. Fix image lazy/srcSet gaps in category map, share preview, storefront reviews, account avatar, and wizard preview — Impact: MEDIUM — Effort: LOW — improves mobile data and LCP behavior.
15. Address audit-reported Vite and file-type security upgrades with planned major-version test passes — Impact: MEDIUM — Effort: HIGH — fixes known advisories but requires compatibility work.

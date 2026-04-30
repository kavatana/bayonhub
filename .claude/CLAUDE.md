# BayonHub — Claude Code Instructions

## Project Identity
Name: BayonHub
Type: Cambodian classifieds marketplace (Khmer24 competitor)
Frontend: bayonhub-app/ — React 19, Vite 5, Tailwind v3, Zustand, GSAP 3, React Three Fiber, React Router v6, Axios, Socket.io-client, vite-plugin-pwa
Backend: bayonhub-api/ — Node.js 20, Express 5, PostgreSQL 16, Prisma, Redis, Cloudflare R2, JWT, Twilio (NOT YET CONNECTED)

## Behavior Rules

### Always
- Run `npm run lint` and `npm run build` after completing any phase and fix all errors before moving on
- Use `t("key")` via the useTranslation hook for every visible string — never hardcode English or Khmer text in JSX
- Add every new translation key to BOTH `en` and `km` objects in `src/lib/translations.js` simultaneously
- Write mobile-first: design for 390px viewport first, then scale up with sm/md/lg breakpoints
- Use Tailwind utility classes for all styling — no inline styles except GSAP transform values and dynamic calc()
- Use functional components with hooks only — no class components except ErrorBoundary
- Preserve all existing Zustand localStorage key names — never rename them
- Append a dated entry to `MIGRATION_NOTES.md` after completing any phase

### Never
- Hardcode any color hex value in JSX or CSS — use Tailwind theme tokens only
- Use `window.location.assign()` or `window.location.href =` for internal navigation — use React Router `navigate()`
- Add event listeners in module scope — always inside `useEffect` with cleanup
- Delete or rename any existing route in `App.jsx` — only add new routes
- Install new npm packages without asking first, except: packages already listed in package.json, `focus-trap-react`, and dev-only tools
- Run destructive database commands (`prisma migrate reset`, `DROP TABLE`) without explicit confirmation
- Modify any file in `bayonhub-api/` when working on a frontend-only task

## Code Style
- Prefer `const` over `let`; never use `var`
- Arrow functions for components and callbacks
- Destructure props at the function signature
- Named exports for components; default export at the bottom of the file
- File naming: PascalCase for components, camelCase for hooks/utils/stores
- Import order: React → third-party → internal (absolute) → relative → styles

## Architecture Decisions (locked — do not change)
- State: Zustand stores in `src/store/` — no Redux, no Context for global state
- Routing: React Router v6 `<BrowserRouter>` with lazy-loaded page components
- Styling: Tailwind v3 only — no CSS modules, no styled-components
- Animation: GSAP 3 for interactions/transitions; Tailwind for static hover states — never mix both on the same element
- i18n: Custom `useTranslation` hook reading from `src/lib/translations.js` — no i18next
- API calls: Axios client in `src/api/client.js` with localStorage fallback when `VITE_API_URL` is empty
- Images: All uploads go through `browser-image-compression` before storage — never store raw user files

## Offline-First Rule
The app MUST remain fully functional when `VITE_API_URL` is empty.
Every API call MUST have a localStorage fallback using the `bayonhub:*` key schema.
Never remove a localStorage fallback without adding the real API call first.

## Stop Conditions — Always Ask Before:
- Deleting any component file
- Renaming any Zustand store action or state key
- Changing the primary brand color token in `tailwind.config.js`
- Modifying JWT or auth token logic in `src/api/client.js`
- Adding a new npm package to production dependencies
- Changing any route path string in `App.jsx`
- Dropping or renaming a database table or column in `prisma/schema.prisma`

## Output Format
After each completed phase, output exactly:
✅ PHASE [N] DONE — [bullet list of every file changed and what was fixed]

If a step is blocked or ambiguous, output:
🛑 BLOCKED — [reason] — [what decision is needed from the developer]

## Performance Baseline
- No chunk over 500 KB (Three.js must be in its own `vendor-three` manualChunk)
- All listing images use `loading="lazy"` and `srcSet` where applicable
- All page-level components are lazy-loaded with `React.lazy` + `Suspense`
- All expensive computations (filtered listings, Set operations) are wrapped in `useMemo`
- All callbacks passed to memoized children are wrapped in `useCallback`

## Cambodia Market Context
- Primary language: Khmer (km) — always the first-class language, not an afterthought
- Secondary language: English (en)
- Currency: USD ($) primary, KHR (រៀល ៛) secondary — both must work in formatPrice()
- Phone format: +855 [operator prefix] [7–8 digits] — validate with Cambodia regex
- Payment: ABA KHQR is the dominant payment method — always placeholder before any real payment
- Sharing: Telegram is more important than Facebook for this market — use tg:// deep links
- Network: Assume 4G with occasional drops — offline fallback and PWA caching matter

## File Structure Reference
bayonhub-app/
├── src/
│   ├── api/          # Axios client + endpoint modules
│   ├── components/   # layout/, ui/, listing/, filters/, auth/, dashboard/, three/, posting/, payments/, seller/
│   ├── hooks/        # useListings, useTranslation
│   ├── lib/          # translations, categories, locations, utils, animations, validation, categoryForms
│   ├── pages/        # One file per route
│   ├── store/        # useListingStore, useAuthStore, useUIStore
│   └── main.jsx
├── public/
│   ├── icons/        # PWA icons (must be > 2 KB each)
│   └── noise.svg     # Static noise texture
├── .env.local        # VITE_API_URL, VITE_SITE_URL
├── MIGRATION_NOTES.md
└── tailwind.config.js
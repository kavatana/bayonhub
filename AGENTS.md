# BayonHub — Codex Agent Instructions

## Project Identity
Name: BayonHub
Type: Cambodian classifieds marketplace (Khmer24 competitor)
Frontend: bayonhub-app/ — React 19, Vite 5, Tailwind v3, Zustand, GSAP 3, React Three Fiber, React Router v6, Axios, Socket.io-client, vite-plugin-pwa
Backend: bayonhub-api/ — Node.js 20, Express 5, PostgreSQL 16, Prisma, Redis, Cloudflare R2, JWT, Twilio (NOT YET CONNECTED TO FRONTEND)
Current state: Frontend fully built. Backend scaffolded. VITE_API_URL is empty — localStorage fallback is active.

## Agent Behavior Rules

### Always
- After completing each phase run `npm run lint` then `npm run build` inside the relevant workspace folder and fix ALL errors before proceeding to the next phase
- Use `t("key")` via the useTranslation hook for every visible string in JSX — never hardcode English or Khmer text directly
- Add every new translation key to BOTH `en` and `km` objects in `src/lib/translations.js` simultaneously
- Write mobile-first: 390px viewport first, then scale up with sm/md/lg/xl Tailwind breakpoints
- Use Tailwind utility classes for all styling — no inline styles except GSAP transform values and dynamic calc() expressions
- Use functional React components with hooks only — no class components except ErrorBoundary
- Keep all existing Zustand localStorage key names exactly as they are — never rename them
- Append a dated section to `bayonhub-app/MIGRATION_NOTES.md` after every completed phase

### Never
- Hardcode any color hex value in JSX or CSS — use Tailwind theme tokens (e.g. bg-primary, text-primary-dark)
- Use `window.location.assign()`, `window.location.href =`, or `window.location.replace()` for internal app navigation — always use React Router `navigate()` or `<Link>`
- Register event listeners at module scope (outside React lifecycle) — always inside `useEffect` with a cleanup return
- Delete or rename any existing route path string in `App.jsx` — only add new routes
- Install new npm packages without stating what package and why in the phase output — then wait for confirmation if the package is not already in package.json
- Run any destructive database command (`prisma migrate reset`, `DROP TABLE`, `deleteMany` without a where clause) without explicitly asking first
- Touch any file inside `bayonhub-api/` when the task is frontend-only, and vice versa
- Mix GSAP transforms and Tailwind hover: transform classes on the same element — pick one system per element

## Code Style
- `const` over `let`; never `var`
- Arrow functions for all components and callbacks
- Destructure props at the function signature: `function Card({ title, price, onClick })`
- Named exports for all components; one default export at the bottom of each file
- File naming: PascalCase for components (`ListingCard.jsx`), camelCase for hooks/utils/stores (`useListings.js`)
- Import order: React core → third-party libraries → internal absolute paths → relative paths → CSS/assets
- No commented-out code blocks left behind — delete unused code, don't comment it out

## Architecture Rules (locked — never change these patterns)
- Global state: Zustand stores in `src/store/` only — no Redux, no React Context for global data
- Routing: React Router v6 with lazy-loaded page components wrapped in React.lazy + Suspense + ErrorBoundary
- Styling: Tailwind v3 utility classes only — no CSS Modules, no styled-components, no emotion
- Animation: GSAP 3 via useGSAP hook for all interactions and page transitions
- Translations: custom `useTranslation` hook reading `src/lib/translations.js` — do not install i18next or react-intl
- API layer: Axios instance in `src/api/client.js`; each module (listings, auth, users) has its own file in `src/api/`
- Image processing: always run through `browser-image-compression` before any storage or upload — never store raw user files

## Offline-First Rule
The entire app MUST work with zero backend when VITE_API_URL is empty or undefined.
Every API call MUST have a localStorage fallback using the existing `bayonhub:*` key schema.
Never delete a localStorage fallback path — only supplement it with a real API call above it.

## Stop and Ask Before
- Deleting any component, page, store, or hook file
- Renaming any Zustand store action name or state property
- Changing the primary brand color token in tailwind.config.js
- Modifying auth/JWT token logic in src/api/client.js
- Adding any package to production dependencies (devDependencies are fine for scripts/tooling)
- Changing any route path string in App.jsx
- Running any Prisma migration or database mutation command
- Changing the Workbox PWA cache strategy for any route pattern

## Phase Output Format
After completing each phase, output exactly this structure:

✅ PHASE [N] DONE
Files changed:
- [filepath] — [one line: what changed and why]
- [filepath] — [one line: what changed and why]
Lint: PASS / [N errors fixed]
Build: PASS / [chunk sizes if relevant]
Next: [one sentence previewing Phase N+1]

If blocked or ambiguous, output:
🛑 BLOCKED — [exact reason] — [specific question for the developer]

## Performance Non-Negotiables
- Three.js MUST live in its own Rollup manualChunk named `vendor-three` — never bundled with app code
- No single JS chunk over 500 KB in production build
- All page-level components lazy-loaded with React.lazy
- All listing images use loading="lazy" and srcSet where the host supports width params
- All filtered/sorted listing arrays wrapped in useMemo
- All callbacks passed to React.memo'd children wrapped in useCallback
- All GSAP ScrollTrigger instances stored in a ref and killed in useEffect cleanup

## Cambodia Market Context — Apply Always
- Khmer (km) is the primary language — ship KM translation simultaneously with every EN string
- Phone numbers: Cambodia format +855 [operator][7–8 digits] — validate with /^\+855[1-9][0-9]{7,8}$/
- Currency: USD ($) is primary display; KHR (រៀល / ៛) must also work in formatPrice()
- Khmer numerals (០-៩) are optional but preferred in full-Khmer UI mode
- Payment: ABA KHQR is the dominant method — always show a KHQR placeholder before any real payment flow
- Sharing: Telegram deep links use tg://msg_url?url=…&text=… (native) with https://t.me/share/url fallback
- Network: Cambodian 4G can be slow and lossy — PWA caching, skeleton loaders, and offline fallbacks are not optional

## Workspace Paths
- Frontend workspace: bayonhub-app/
- Backend workspace: bayonhub-api/
- Shared config (Docker, root scripts): project root
- Claude Code instructions: .claude/CLAUDE.md
- Codex instructions: AGENTS.md (this file)
- Migration log: bayonhub-app/MIGRATION_NOTES.md
- Environment template: bayonhub-api/.env.example

## Key Files Reference
bayonhub-app/src/
├── api/client.js              # Axios + interceptors + localStorage fallback trigger
├── lib/translations.js        # ALL KM/EN strings — always edit both languages together
├── lib/categories.js          # Full nested category tree with facets
├── lib/locations.js           # 25 provinces + Phnom Penh districts
├── lib/utils.js               # formatPrice, slugify, timeAgo, getSrcSet
├── lib/validation.js          # Cambodia phone regex, form validators
├── lib/animations.js          # GSAP reusable helpers (pageEnter, cardHover, modalEnter, counterUp)
├── store/useListingStore.js   # listings[], filters, pagination, CRUD actions
├── store/useAuthStore.js      # user, token, isAuthenticated, login/logout/verify
├── store/useUIStore.js        # language, theme, modals, selectedProvince, notificationCount
└── main.jsx                   # App entry — HelmetProvider, BrowserRouter, Toaster
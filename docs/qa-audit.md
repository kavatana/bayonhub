You are a principal engineer executing a full production-hardening sprint for BayonHub. A senior QA audit identified critical gaps preventing launch. This prompt resolves every finding in priority order across both bayonhub-app/ and bayonhub-api/.

Read AGENTS.md completely before touching any file. Every rule applies without exception.

This is the highest-stakes sprint in the project. Every change must be surgical, tested, and leave the codebase more stable than you found it. No shortcuts. No TODOs left behind.

After each wave output the standard completion block and wait for approval before proceeding.

---

## WAVE 1 — Release Blockers (P0 — All 3 must pass before Wave 2)

### W1-01 — PWA Build Stability (P0-01)

The audit found the production build can fail during service worker generation.

File: bayonhub-app/vite.config.js

Replace the existing vite-plugin-pwa configuration with a hardened version:

VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'noise.svg'],
  manifest: {
    name: 'BayonHub',
    short_name: 'BayonHub',
    description: 'Cambodia\'s Premier Marketplace',
    theme_color: '#C62828',
    background_color: '#ffffff',
    display: 'standalone',
    start_url: '/',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  },
  workbox: {
    // Critical: prevent SW generation from failing on large chunks
    maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
    // Do not cache Three.js or Leaflet in SW — too large and not needed offline
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [/^\/api\//],
    runtimeCaching: [
      {
        // API responses: network first, cache fallback
        urlPattern: /^https?:\/\/.*\/api\//,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
          cacheableResponse: { statuses: [200] },
        },
      },
      {
        // Static assets: cache first
        urlPattern: /\.(?:js|css|woff2)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-cache',
          expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        // Images: stale while revalidate
        urlPattern: /\.(?:png|jpg|jpeg|webp|svg|gif)$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'image-cache',
          expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
    ],
    // Exclude large vendor chunks from precache
    globIgnores: ['**/vendor-three*', '**/vendor-maps*', '**/node_modules/**'],
  },
  // Prevent minification issues that cause SW generation failures
  devOptions: {
    enabled: false,
    type: 'module',
  },
})

After change: run npm run build exactly 3 times in sequence. All 3 must succeed without error. Report all 3 results. If any fail, fix the root cause before moving on.

### W1-02 — Three.js Circular Chunk Warning (P0-02)

File: bayonhub-app/vite.config.js

Replace the existing manualChunks configuration with:

build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        // Three.js ecosystem — completely isolated
        if (id.includes('three') || id.includes('@react-three')) {
          return 'vendor-three'
        }
        // Maps — isolated
        if (id.includes('leaflet') || id.includes('react-leaflet')) {
          return 'vendor-maps'
        }
        // GSAP — isolated
        if (id.includes('gsap')) {
          return 'vendor-gsap'
        }
        // React core — isolated
        if (id.includes('react-dom') || id.includes('react-router')) {
          return 'vendor-react'
        }
        // Zustand + related
        if (id.includes('zustand') || id.includes('immer')) {
          return 'vendor-state'
        }
        // All other node_modules
        if (id.includes('node_modules')) {
          return 'vendor-misc'
        }
        // App code splits by feature
        if (id.includes('/pages/')) return 'pages'
        if (id.includes('/components/three/')) return 'three-components'
        if (id.includes('/components/')) return 'components'
      },
    },
  },
  // Raise chunk warning threshold — vendor-three is expected large
  chunkSizeWarningLimit: 1000,
}

Using a function-based manualChunks instead of an object eliminates circular reference warnings by giving Rollup complete control over chunk boundaries.

Run npm run build. Verify:
- No "circular dependency" warnings in output
- vendor-three chunk exists and is separate
- index chunk is under 500KB
- Report all chunk sizes

### W1-03 — Production Auth Security Mode Guard (P0-03)

The audit found the localStorage token fallback can mask security requirements in production.

File: bayonhub-app/src/api/client.js

Add a hard environment guard at the top of the file (after imports, before anything else):

// PRODUCTION SECURITY GUARD
// In production, localStorage auth is completely disabled.
// Tokens must come from HttpOnly cookies set by the backend.
const IS_PRODUCTION = import.meta.env.PROD
const API_BASE_URL = import.meta.env.VITE_API_URL

if (IS_PRODUCTION && !API_BASE_URL) {
  console.error('[BayonHub] FATAL: VITE_API_URL must be set in production. Refusing to start in insecure mode.')
  // Do not throw — allow app to render but block all API calls
}

Update the request interceptor to enforce the guard:
axiosInstance.interceptors.request.use((config) => {
  // SECURITY: In production, NEVER read token from localStorage
  // The HttpOnly cookie is sent automatically by the browser via withCredentials
  if (!IS_PRODUCTION && !API_BASE_URL) {
    // DEV OFFLINE MODE ONLY: read from localStorage
    const token = localStorage.getItem('bayonhub:authToken')
    if (token) config.headers['Authorization'] = `Bearer ${token}`
  }
  // CSRF token — always send when available
  const csrfToken = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1]
  if (csrfToken) config.headers['X-XSRF-TOKEN'] = decodeURIComponent(csrfToken)
  return config
})

File: bayonhub-app/src/store/useAuthStore.js

Add production guard around any localStorage.setItem for auth token:
// NEVER store JWT in localStorage in production
if (!import.meta.env.PROD) {
  localStorage.setItem('bayonhub:authToken', accessToken)
}

File: bayonhub-api/src/app.ts (if it exists)

Ensure CORS is production-hardened:
- In development: allow localhost:5173
- In production: only allow FRONTEND_URL from env
- If NODE_ENV=production and FRONTEND_URL is not set: throw on startup

Add to env.ts validation:
if (process.env.NODE_ENV === 'production') {
  const required = ['FRONTEND_URL', 'JWT_SECRET', 'DATABASE_URL', 'REDIS_URL']
  required.forEach(key => {
    if (!process.env[key]) throw new Error(`[FATAL] Missing production env var: ${key}`)
  })
}

Verify Wave 1:
- npm run build in bayonhub-app/ — 3 consecutive successful builds
- No circular chunk warnings
- No PWA generation errors
- Chunk sizes reported

---

## WAVE 2 — Flow Integrity (P1 Findings)

### W2-01 — Unified Lead Payload Schema (P1-01)

The audit found offer/contact flow payload can drop data.

File: bayonhub-app/src/lib/validation.js

Add a lead payload validator and schema:

export const LEAD_TYPES = ['CALL', 'WHATSAPP', 'TELEGRAM', 'CHAT', 'OFFER']

export function buildLeadPayload(type, data = {}) {
  if (!LEAD_TYPES.includes(type)) throw new Error(`Invalid lead type: ${type}`)
  const base = {
    type,
    createdAt: new Date().toISOString(),
    sessionId: getSessionId(),
  }
  switch (type) {
    case 'CALL':
      return { ...base, phone: data.phone || null }
    case 'WHATSAPP':
      return { ...base, phone: data.phone || null, message: data.message || null }
    case 'TELEGRAM':
      return { ...base, message: data.message || null }
    case 'CHAT':
      return { ...base, message: data.message || 'Is this still available?' }
    case 'OFFER':
      if (!data.offerPrice || isNaN(Number(data.offerPrice))) {
        throw new Error('Offer price is required and must be a number')
      }
      if (Number(data.offerPrice) <= 0) {
        throw new Error('Offer price must be greater than 0')
      }
      return {
        ...base,
        offerPrice: Number(data.offerPrice),
        message: data.message || null,
      }
    default:
      return base
  }
}

function getSessionId() {
  let id = sessionStorage.getItem('bayonhub:session')
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('bayonhub:session', id) }
  return id
}

Update every createLead call in the codebase to use buildLeadPayload:
- src/components/listing/ListingDetail.jsx — all 5 contact action handlers
- src/components/listing/ListingPage.jsx — sticky bar contact handlers
- src/store/useListingStore.js — createLead action

### W2-02 — Idempotent Message Event Model (P1-02)

The audit found message append logic can duplicate under socket race conditions.

File: bayonhub-app/src/store/useUIStore.js

Replace the addMessage action with an idempotent version:

addMessage: (message) => set((state) => {
  // Idempotency check — never add a message with a duplicate ID
  const allMessages = state.conversations.flatMap(c => c.messages || [])
  if (allMessages.some(m => m.id === message.id)) return state

  const convIndex = state.conversations.findIndex(
    c => c.partnerId === message.senderId || c.partnerId === message.receiverId
  )

  if (convIndex === -1) {
    // New conversation
    const partnerId = message.senderId === state.currentUserId
      ? message.receiverId : message.senderId
    return {
      conversations: [{
        id: crypto.randomUUID(),
        partnerId,
        messages: [message],
        unreadCount: message.senderId !== state.currentUserId ? 1 : 0,
        lastMessage: message,
        updatedAt: message.createdAt,
      }, ...state.conversations]
    }
  }

  // Existing conversation — append message
  const updated = [...state.conversations]
  const conv = { ...updated[convIndex] }
  conv.messages = [...(conv.messages || []), message]
  conv.lastMessage = message
  conv.updatedAt = message.createdAt
  if (message.senderId !== state.currentUserId) conv.unreadCount = (conv.unreadCount || 0) + 1
  updated[convIndex] = conv
  // Move to top
  updated.splice(convIndex, 1)
  updated.unshift(conv)
  return { conversations: updated }
}),

File: bayonhub-app/src/lib/socket.js

Add event deduplication at the socket level:
const processedEvents = new Set()

socket.on('message:receive', (message) => {
  if (processedEvents.has(message.id)) return
  processedEvents.add(message.id)
  // Prune set to prevent memory leak (keep last 100 IDs)
  if (processedEvents.size > 100) {
    const first = processedEvents.values().next().value
    processedEvents.delete(first)
  }
  useUIStore.getState().addMessage(message)
  useUIStore.getState().incrementUnreadCount()
})

### W2-03 — Sticky CTA Hysteresis (P1-03)

The audit found the sticky action bar flickers around the viewport boundary.

File: bayonhub-app/src/pages/ListingPage.jsx

Replace the current IntersectionObserver for sticky bar visibility with a hysteresis pattern:

const SHOW_THRESHOLD = 0.1   // show sticky when actions are 10% out of view
const HIDE_THRESHOLD = 0.3   // hide sticky when actions are 30% back in view
const stickyVisible = useRef(false)
const [showSticky, setShowSticky] = useState(false)

useEffect(() => {
  const target = actionButtonsRef.current
  if (!target) return

  const observer = new IntersectionObserver(
    ([entry]) => {
      const ratio = entry.intersectionRatio
      if (!stickyVisible.current && ratio < SHOW_THRESHOLD) {
        stickyVisible.current = true
        setShowSticky(true)
      } else if (stickyVisible.current && ratio > HIDE_THRESHOLD) {
        stickyVisible.current = false
        setShowSticky(false)
      }
    },
    { threshold: [0, SHOW_THRESHOLD, HIDE_THRESHOLD, 1] }
  )
  observer.observe(target)
  return () => observer.disconnect()
}, [])

Apply the same pattern to any other sticky-visibility observers in the codebase.

### W2-04 — Infinite Scroll Data Source Unification (P1-04)

The audit found scroll dataLength can mismatch the rendered list.

File: bayonhub-app/src/pages/CategoryPage.jsx

Identify the single source of truth for the displayed listing list. Ensure that the same array reference is used for both:
1. The InfiniteScroll dataLength prop
2. The ListingGrid listings prop
3. Any count/empty state displays

Create a single derived variable:
const displayedListings = useMemo(() => {
  // Apply all client-side filters to the store listings
  let result = listings.filter(l => l.status === 'ACTIVE')
  if (verifiedOnly) result = result.filter(l =>
    l.seller?.verificationTier !== 'NONE' || l.seller?.phoneVerifiedAt
  )
  if (withPhotos) result = result.filter(l => l.images?.length > 0)
  if (negotiableOnly) result = result.filter(l => l.negotiable)
  if (selectedCategory && selectedCategory !== 'all') {
    result = result.filter(l => l.categorySlug === selectedCategory)
  }
  if (selectedProvince && selectedProvince !== 'all') {
    result = result.filter(l => l.province === selectedProvince)
  }
  if (priceRange[0] > 0) result = result.filter(l => Number(l.price) >= priceRange[0])
  if (priceRange[1] < priceMax) result = result.filter(l => Number(l.price) <= priceRange[1])
  // Sort
  if (sortBy === 'price-asc') result = [...result].sort((a,b) => Number(a.price||0) - Number(b.price||0))
  if (sortBy === 'price-desc') result = [...result].sort((a,b) => Number(b.price||0) - Number(a.price||0))
  if (sortBy === 'most-viewed') result = [...result].sort((a,b) => (b.viewCount||0) - (a.viewCount||0))
  // Default: promoted first, then newest
  if (sortBy === 'newest' || !sortBy) {
    result = [...result].sort((a,b) => {
      if (a.promoted && !b.promoted) return -1
      if (!a.promoted && b.promoted) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }
  return result
}, [listings, verifiedOnly, withPhotos, negotiableOnly, selectedCategory,
    selectedProvince, priceRange, priceMax, sortBy])

Use displayedListings everywhere:
<InfiniteScroll dataLength={displayedListings.length} ...>
  <ListingGrid listings={displayedListings} />
</InfiniteScroll>
<p>{displayedListings.length} {t("listing.resultsFound")}</p>

Apply same pattern to SearchPage.jsx.

Add translation: "listing.resultsFound": en "listings found" km "ការផ្សាយបានរក"

### W2-05 — Cambodia Phone Validation Unified (P1-05)

The audit found phone validation is not uniformly enforced.

File: bayonhub-app/src/lib/validation.js

Add a single centralized phone validator that all forms must use:

export const CAMBODIA_PHONE_REGEX = /^\+855[1-9][0-9]{7,8}$/

export function normalizePhone(input) {
  if (!input) return ''
  let phone = input.replace(/[\s\-().]/g, '')
  if (phone.startsWith('0')) phone = '+855' + phone.slice(1)
  if (phone.startsWith('855') && !phone.startsWith('+')) phone = '+' + phone
  if (!phone.startsWith('+')) phone = '+855' + phone
  return phone
}

export function validatePhone(input) {
  const phone = normalizePhone(input)
  if (!CAMBODIA_PHONE_REGEX.test(phone)) {
    return {
      valid: false,
      error: 'invalidPhone', // use t("validation.invalidPhone")
      normalized: null,
    }
  }
  return { valid: true, error: null, normalized: phone }
}

Apply validatePhone in these files:
1. src/components/auth/AuthModal.jsx — register and login phone fields: validate on blur + on submit
2. src/components/posting/PostAdWizard.jsx — Step 2 contact phone field
3. src/pages/DashboardPage.jsx — Settings tab phone display/edit

Show inline error below the field using the existing error display pattern.
Add translation: "validation.invalidPhone": en "Enter a valid Cambodian number (e.g. +855 12 345 678)" km "បញ្ចូលលេខទូរស័ព្ទខ្មែរត្រឹមត្រូវ (ឧ. +855 12 345 678)"

### W2-06 — Safe localStorage Abstraction (P1-06)

The audit found inconsistent JSON parsing without guards.

File: bayonhub-app/src/lib/storage.js (create new)

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return fallback
      return JSON.parse(raw)
    } catch {
      console.warn(`[storage] Failed to parse key "${key}" — returning fallback`)
      return fallback
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.error('[storage] localStorage quota exceeded — clearing old data')
        this.evictOldest()
        return false
      }
      console.warn(`[storage] Failed to set key "${key}"`, e)
      return false
    }
  },

  remove(key) {
    try { localStorage.removeItem(key) } catch { /* silent */ }
  },

  evictOldest() {
    // Evict non-critical keys to free space
    const evictable = ['bayonhub:recentlyViewed', 'bayonhub:feedback', 'bayonhub:notifications']
    evictable.forEach(k => this.remove(k))
  },

  clear(prefix = 'bayonhub:') {
    Object.keys(localStorage)
      .filter(k => k.startsWith(prefix))
      .forEach(k => localStorage.removeItem(k))
  }
}

Find every direct localStorage.getItem / JSON.parse pattern in:
- src/store/useListingStore.js
- src/store/useAuthStore.js
- src/store/useUIStore.js
- src/api/listings.js

Replace every instance with storage.get(key, fallback) and storage.set(key, value).
This single change eliminates all P1-06 JSON parse crash risks.

### W2-07 — Contact Action Rate Limiting (P1-07)

The audit found contact actions have no anti-abuse throttling.

File: bayonhub-app/src/lib/rateLimiter.js (create new)

class ClientRateLimiter {
  constructor() {
    this.actions = storage.get('bayonhub:actionLog', {})
  }

  canPerform(actionType, listingId, limits = {}) {
    const defaults = {
      CALL: { max: 5, windowMs: 60 * 60 * 1000 },       // 5 calls per hour
      WHATSAPP: { max: 10, windowMs: 60 * 60 * 1000 },   // 10 per hour
      TELEGRAM: { max: 10, windowMs: 60 * 60 * 1000 },
      CHAT: { max: 20, windowMs: 60 * 60 * 1000 },
      OFFER: { max: 3, windowMs: 24 * 60 * 60 * 1000 },  // 3 offers per day
      REPORT: { max: 5, windowMs: 24 * 60 * 60 * 1000 },
    }
    const limit = { ...defaults[actionType], ...limits }
    const key = `${actionType}:${listingId}`
    const now = Date.now()
    const events = (this.actions[key] || []).filter(t => now - t < limit.windowMs)
    return events.length < limit.max
  }

  record(actionType, listingId) {
    const key = `${actionType}:${listingId}`
    const now = Date.now()
    if (!this.actions[key]) this.actions[key] = []
    this.actions[key].push(now)
    // Prune old events (keep last 24h only)
    this.actions[key] = this.actions[key].filter(t => now - t < 24 * 60 * 60 * 1000)
    storage.set('bayonhub:actionLog', this.actions)
  }
}

export const rateLimiter = new ClientRateLimiter()

Apply in src/components/listing/ListingDetail.jsx:
Before every contact action (Call, WhatsApp, Telegram, Chat, Offer):
if (!rateLimiter.canPerform(type, listing.id)) {
  toast.error(t("listing.rateLimitReached"))
  return
}
rateLimiter.record(type, listing.id)

Add translation: "listing.rateLimitReached": en "Too many contact attempts. Please wait before trying again." km "ការព្យាយាមទំនាក់ទំនងច្រើនពេក។ សូមរង់ចាំ។"

### W2-08 — Structured Report Metadata (P1-08)

The audit found report flow lacks enough signal for moderation.

File: bayonhub-app/src/components/listing/ListingDetail.jsx

Upgrade the report modal to capture richer metadata:

Report modal fields:
1. Reason (required) — existing 5 options
2. Description (optional textarea, max 500 chars, min 20 chars if filled)
3. Evidence URL (optional) — "Link to screenshot or evidence (optional)"
   - Validate as URL format if filled
4. Contact email (optional) — "Your email for follow-up (optional)"

Build the report payload:
const reportPayload = {
  reason,
  detail,
  evidenceUrl: evidenceUrl || null,
  contactEmail: contactEmail || null,
  userAgent: navigator.userAgent,
  reportedAt: new Date().toISOString(),
  listingId: listing.id,
  listingTitle: listing.title,
  reporterSessionId: sessionStorage.getItem('bayonhub:session'),
}

Pass full payload to reportListing store action.

Add translations:
"report.evidenceUrl": en "Link to evidence (optional)" km "តំណភ្ជាប់ភស្តុតាង (ស្រេចចិត្ត)"
"report.contactEmail": en "Your email for follow-up (optional)" km "អ៊ីមែលរបស់អ្នកសម្រាប់跟进 (ស្រេចចិត្ត)"

### W2-09 — Backend Heartbeat for Real Online Detection (P1-09)

The audit found browser online != backend reachable. Fix on both sides.

File: bayonhub-app/src/hooks/useOnlineStatus.js (create new)

import { useState, useEffect, useRef } from 'react'

const HEARTBEAT_URL = `${import.meta.env.VITE_API_URL || ''}/health`
const HEARTBEAT_INTERVAL = 30000 // 30 seconds
const HEARTBEAT_TIMEOUT = 5000   // 5 second timeout

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isBackendReachable, setIsBackendReachable] = useState(true)
  const intervalRef = useRef(null)

  const checkBackend = async () => {
    if (!import.meta.env.VITE_API_URL) {
      setIsBackendReachable(true) // offline dev mode — assume reachable
      return
    }
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), HEARTBEAT_TIMEOUT)
      const res = await fetch(HEARTBEAT_URL, {
        method: 'GET', signal: controller.signal, cache: 'no-store'
      })
      clearTimeout(timeout)
      setIsBackendReachable(res.ok)
    } catch {
      setIsBackendReachable(false)
    }
  }

  useEffect(() => {
    const goOnline = () => { setIsOnline(true); checkBackend() }
    const goOffline = () => { setIsOnline(false); setIsBackendReachable(false) }
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    // Initial check
    checkBackend()
    // Periodic heartbeat
    intervalRef.current = setInterval(checkBackend, HEARTBEAT_INTERVAL)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      clearInterval(intervalRef.current)
    }
  }, [])

  return {
    isOnline,
    isBackendReachable,
    isFullyOnline: isOnline && isBackendReachable,
    isLimitedMode: isOnline && !isBackendReachable,
  }
}

File: bayonhub-app/src/components/layout/Layout.jsx

Replace the existing simple online/offline check with useOnlineStatus:
const { isFullyOnline, isLimitedMode } = useOnlineStatus()

Show 3 distinct states:
- Fully online: no banner
- Limited mode (browser online but backend unreachable):
  bg-orange-500: "Backend unreachable — showing cached data only"
- Offline:
  bg-yellow-500: existing offline message

Add translation: "app.limitedMode": en "Connection issues — some features may be unavailable" km "បញ្ហាការតភ្ជាប់ — មុខងារខ្លះអាចមិនអាចប្រើបាន"

File: bayonhub-api/src/app.ts

Ensure /health endpoint returns rich status:
app.get('/health', async (req, res) => {
  const dbStatus = await prisma.$queryRaw`SELECT 1`.then(() => 'ok').catch(() => 'error')
  const redisStatus = redis.status === 'ready' ? 'ok' : 'error'
  const status = dbStatus === 'ok' && redisStatus === 'ok' ? 'ok' : 'degraded'
  res.status(status === 'ok' ? 200 : 503).json({
    status, ts: Date.now(), db: dbStatus, redis: redisStatus
  })
})

### W2-10 — PWA Install Prompt Dismissal Expiry (P1-10)

The audit found one dismiss permanently suppresses the install prompt.

File: bayonhub-app/src/hooks/usePWAInstall.js

Replace permanent dismissal with expiring dismissal:
const DISMISS_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

const isDismissed = () => {
  try {
    const dismissed = localStorage.getItem('bayonhub:pwaDismissed')
    if (!dismissed) return false
    const { timestamp } = JSON.parse(dismissed)
    return Date.now() - timestamp < DISMISS_EXPIRY_MS
  } catch { return false }
}

const [dismissed, setDismissed] = useState(isDismissed)

const dismiss = () => {
  localStorage.setItem('bayonhub:pwaDismissed', JSON.stringify({ timestamp: Date.now() }))
  setDismissed(true)
}

// Re-check dismissal expiry on focus
useEffect(() => {
  const onFocus = () => setDismissed(isDismissed())
  window.addEventListener('focus', onFocus)
  return () => window.removeEventListener('focus', onFocus)
}, [])

---

## WAVE 3 — UX Smoothness (P2 Findings)

### W3-01 — Unified Overlay Primitive (P2-01)

The audit found Modal, bottom sheets, and dialogs each handle focus/escape differently.

File: bayonhub-app/src/components/ui/Overlay.jsx (create new)

A single base overlay component that all modal-like UI must use:

import { useEffect, useRef } from 'react'
import FocusTrap from 'focus-trap-react'

export function Overlay({
  open, onClose, children, className = '',
  backdropClassName = '', disableEscapeKey = false,
  disableBackdropClick = false, role = 'dialog',
  ariaLabel, ariaLabelledBy,
}) {
  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Escape key
  useEffect(() => {
    if (!open || disableEscapeKey) return
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose, disableEscapeKey])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${backdropClassName}`}
        onClick={disableBackdropClick ? undefined : onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <FocusTrap
        active={open}
        focusTrapOptions={{ initialFocus: false, escapeDeactivates: false }}
      >
        <div
          role={role}
          aria-modal="true"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className={`relative z-10 ${className}`}
        >
          {children}
        </div>
      </FocusTrap>
    </div>
  )
}

Migrate these components to use Overlay as their base:
- src/components/ui/Modal.jsx — replace the overlay div + FocusTrap with <Overlay>
- src/components/auth/AuthModal.jsx — replace overlay implementation
- src/components/posting/PostAdWizard.jsx — replace full-screen modal overlay
- CategoryPage bottom sheet — replace the custom drawer overlay

This gives every modal/dialog identical Escape, backdrop click, scroll lock, and focus trap behavior.

### W3-02 — Click-Away Popover Controller (P2-02)

Quick filter dropdowns (Year pill, Condition pill, Sort dropdown) can get stuck open on touch.

File: bayonhub-app/src/hooks/useClickAway.js (create new)

import { useEffect, useRef } from 'react'

export function useClickAway(onClickAway) {
  const ref = useRef(null)
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClickAway(e)
      }
    }
    // Both click and touchstart for mobile
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [onClickAway])
  return ref
}

Apply useClickAway to every dropdown in:
- src/pages/CategoryPage.jsx — Year pill, Condition pill, Sort dropdown
- src/components/layout/Navbar.jsx — search autocomplete dropdown, location selector dropdown

Pattern:
const dropdownRef = useClickAway(() => setDropdownOpen(false))
<div ref={dropdownRef}>
  <button onClick={() => setDropdownOpen(o => !o)}>...</button>
  {dropdownOpen && <div>...options...</div>}
</div>

### W3-03 — Promotion State Machine (P2-03)

The audit found the paid promotion lifecycle has no explicit state tracking.

File: bayonhub-app/src/lib/promotionStates.js (create new)

export const PROMOTION_STATES = {
  NONE: 'none',
  PENDING_PAYMENT: 'pending_payment',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
}

export const PROMOTION_LABELS = {
  none: { en: 'Standard', km: 'ស្តង់ដារ' },
  pending_payment: { en: 'Awaiting Payment', km: 'រង់ចាំការទូទាត់' },
  payment_confirmed: { en: 'Processing', km: 'កំពុងដំណើរការ' },
  active: { en: 'Boosted', km: 'បានលើកកម្ពស់' },
  expired: { en: 'Promotion Ended', km: 'ការផ្សព្វផ្សាយបានបញ្ចប់' },
  cancelled: { en: 'Cancelled', km: 'បានលប់បង់' },
}

export function getPromotionState(listing) {
  if (!listing.promoted && !listing.promotedUntil) return PROMOTION_STATES.NONE
  if (listing.promoted && listing.promotedUntil) {
    const expiry = new Date(listing.promotedUntil)
    if (expiry < new Date()) return PROMOTION_STATES.EXPIRED
    return PROMOTION_STATES.ACTIVE
  }
  return PROMOTION_STATES.NONE
}

Apply in:
- src/components/payments/ABAPayModal.jsx — show current state, transition on payment confirm
- src/components/dashboard/MyAdsTab.jsx — show promotion state badge per listing
- src/components/listing/ListingCard.jsx — promoted badge uses getPromotionState()

### W3-04 — Performance: One-Pass Category Count (P2-11)

File: bayonhub-app/src/pages/HomePage.jsx

Replace the existing per-category filter loop with a single O(n) pass:

const categoryCounts = useMemo(() => {
  return listings.reduce((acc, listing) => {
    if (listing.status === 'ACTIVE') {
      acc[listing.categorySlug] = (acc[listing.categorySlug] || 0) + 1
    }
    return acc
  }, {})
}, [listings])

### W3-05 — SEO: Canonical and Structured Data Guards (P2-08, P2-09)

File: bayonhub-app/src/lib/seo.js (create new)

const SITE_URL = import.meta.env.VITE_SITE_URL

if (import.meta.env.PROD && !SITE_URL) {
  console.error('[SEO] FATAL: VITE_SITE_URL is not set. Canonical URLs and structured data will be broken in production.')
}

export function canonicalUrl(path) {
  const base = SITE_URL || 'https://bayonhub.com'
  return `${base}${path.startsWith('/') ? path : '/' + path}`
}

export function buildProductSchema(listing) {
  if (!listing) return null
  const base = SITE_URL || 'https://bayonhub.com'
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description?.slice(0, 300),
    image: listing.images?.[0]?.url || `${base}/icons/icon-512.png`,
    url: canonicalUrl(`/listing/${listing.id}/${listing.slug || ''}`),
    offers: {
      '@type': 'Offer',
      price: listing.price || '0',
      priceCurrency: listing.currency || 'USD',
      availability: listing.status === 'ACTIVE'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Person',
        name: listing.seller?.name || 'BayonHub Seller',
      },
    },
  }
}

Update every page that uses canonical URLs or JSON-LD to use canonicalUrl() from this file.

---

## WAVE 4 — Localization & Accessibility (P2-05, P2-06, P2-07)

### W4-01 — Translation Key Completeness Enforcement

Scan the entire src/ directory for:
1. Any string literal in JSX not wrapped in t() — list every violation
2. Any aria-label containing an English string directly — wrap with t()
3. Any title="" attribute with English string — wrap with t()
4. Any placeholder="" with English string — wrap with t()
5. Any alt="" with descriptive English text — wrap with t()

For every violation found:
- Add the key to translations.js with both EN and KM values
- Replace the hardcoded string with t("key")
- Report total count of violations fixed

### W4-02 — Dark Mode Contrast WCAG Sweep (P2-06)

Check these specific dark mode combinations and fix any that fail WCAG AA (4.5:1 for normal text):

Current dark classes to verify:
- dark:text-neutral-300 on dark:bg-neutral-800 — check ratio
- dark:text-neutral-400 on dark:bg-neutral-900 — check ratio
- white text on bg-primary (#C62828) — check ratio
- dark:text-neutral-200 on dark:bg-neutral-800 — check ratio

Fix approach: if a combination fails, darken the background OR lighten the text.
For neutral-400 (#A3A3A3) on neutral-900 (#171717): ratio is ~7.5:1 — PASS
For neutral-300 (#D4D4D4) on neutral-800 (#262626): ratio is ~9.2:1 — PASS
For neutral-500 (#737373) on neutral-800 (#262626): ratio is ~3.5:1 — FAIL
Fix: replace dark:text-neutral-500 with dark:text-neutral-400 wherever used for body text.

Scan all .jsx files for dark:text-neutral-500 and replace with dark:text-neutral-400.

### W4-03 — Keyboard Journey Standardization (P2-07)

Verify these keyboard interactions work correctly by reading the implementation:

1. PostAdWizard — Tab through all Step 2 form fields in logical order
   - Check: no tabIndex values that break natural DOM order
   - Check: radio groups use roving tabIndex pattern

2. AuthModal — OTP digit boxes
   - Verify: Tab moves forward, Shift+Tab moves backward
   - Verify: Backspace in empty box moves focus to previous box
   - Verify: paste fills all 6 boxes simultaneously

3. CategoryPage filter sidebar
   - Verify: all filter controls are keyboard reachable
   - Verify: PriceRangeSlider thumb elements have keyboard events (arrow keys ±step)

4. ListingCard
   - Verify: entire card is a focusable/clickable element with role="article"
   - Verify: Save button has independent Tab stop (not inside the card link)

For any keyboard gap found: implement the fix using standard HTML semantics (no custom keyboard trap patterns).

---

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

---

## ABSOLUTE CONSTRAINTS

- NEVER hardcode visible strings — t() for all UI text, KM + EN simultaneously
- NEVER store JWT in localStorage in production — IS_PRODUCTION guard enforces this
- NEVER break existing Zustand store key names or localStorage keys
- NEVER install new npm packages — all needed utilities are built from scratch above
- NEVER remove the localStorage fallback guards — only add production security guards above them
- The 3 consecutive successful builds in W1-01 are mandatory — do not skip or shortcut this check
- Wave 2 must complete entirely before Wave 3 starts
- MIGRATION_NOTES.md must be updated after every wave
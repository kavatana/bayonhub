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
const base = SITE_URL || '[https://bayonhub.com](https://bayonhub.com/)'
return `${base}${path.startsWith('/') ? path : '/' + path}`
}

export function buildProductSchema(listing) {
if (!listing) return null
const base = SITE_URL || '[https://bayonhub.com](https://bayonhub.com/)'
return {
'@context': '[https://schema.org](https://schema.org/)',
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

##
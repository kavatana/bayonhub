# Merchant Onboarding Integration — Complete Summary

**Date**: April 30, 2026  
**Status**: ✅ PRODUCTION READY

## Overview
Full end-to-end merchant onboarding system for BayonHub, including:
- Bilingual UI (English + Khmer) for merchant profile registration
- Backend merchant profile storage with Redis
- Offline-first localStorage fallback
- Complete API validation and error handling
- Dashboard integration with auth store persistence

---

## Backend Implementation

### 1. Merchant Router (`bayonhub-api/src/modules/merchant/router.ts`)
**Purpose**: Handle merchant profile creation, retrieval, and updates

**Endpoints**:
- `POST /api/v1/merchant/onboard` — Create merchant profile
- `GET /api/v1/merchant/profile/:merchantId` — Retrieve profile
- `PUT /api/v1/merchant/profile/:merchantId` — Update profile

**Authentication**: 
- JWT user auth OR API key (`x-api-key` header)
- Dual-mode: `requireAuthOrApiKey` middleware

**Storage**: 
- Redis with 30-day TTL per merchant
- Key format: `merchant:profile:{merchantId}`

**Validation**:
- UUID format for merchantId
- Enum validation for businessDomain (RETAIL, WHOLESALE, ELECTRONICS, etc.)
- URI validation for catalog endpoints
- Boolean validation for khqr_configuration_status

**Error Handling**:
- 400: Invalid payload/format
- 401: Unauthorized (invalid API key)
- 404: Merchant profile not found
- Custom error factory with status codes

### 2. Backend Configuration (`bayonhub-api/src/config/env.ts`)
- Exports `MERCHANT_API_KEYS` array (optional)
- Used in `requireAuthOrApiKey` middleware

### 3. App Integration (`bayonhub-api/src/app.ts`)
- Merchant router registered: `app.use("/api/v1/merchant", merchantRouter)`
- Properly imports `merchantRouter` from modules

---

## Frontend Implementation

### 1. Merchant API Module (`bayonhub-app/src/api/merchant.js`)
**Purpose**: API client with offline fallback

**Functions**:
- `createMerchantProfile(data)` — POST to `/api/v1/merchant/onboard`
- `getMerchantProfile(merchantId)` — GET `/api/v1/merchant/profile/:merchantId`
- `updateMerchantProfile(merchantId, data)` — PUT `/api/v1/merchant/profile/:merchantId`

**Offline Fallback**:
- Storage key: `bayonhub:merchantProfiles`
- Stores JSON objects keyed by merchantId
- Returns null for missing profiles (404 behavior)
- Mock functions handle localStorage in offline mode

**Flow Decision**:
```javascript
if (!hasApiBackend()) {
  // Use localStorage mock
} else {
  // Call backend API
}
```

### 2. Dashboard UI (`bayonhub-app/src/components/dashboard/StoreTab.jsx`)
**Purpose**: Merchant profile form and management

**Features**:
- Merchant ID display (auto-generated UUID on first save)
- Tax identification number input
- Business domain selector (9 options)
- Catalog endpoints textarea (one URL per line)
- Contact fields: name, email, phone, Telegram channel
- Status badge: "Onboarded" when profile loaded
- Save/error handling with toast notifications

**State Management**:
- Uses `useAuthStore` for user persistence
- `updateUser({ store: nextStore })` saves merchant data
- Calls `useAuthStore.setUser()` on successful API response

**Merchant Profile Load**:
- `useEffect` triggers on `store.merchantId` change
- Calls `getMerchantProfile()` to fetch from backend
- Sets `merchantStatus` to "loaded" on success
- Shows "Onboarded" badge when profile exists

**Form Submission**:
- Validates: tax ID, business domain, and catalog endpoints required
- Auto-generates merchantId if not present
- Conditional create vs. update based on `merchantStatus`
- Updates local user state first (optimistic)
- Then calls backend API
- Catches and displays errors via toast

### 3. Translations (`bayonhub-app/src/lib/translations.js`)
**Merchant-specific keys** (both EN + KM):

| Key | Example |
|-----|---------|
| `merchant.onboardingTitle` | "Merchant onboarding" |
| `merchant.onboardingSubtitle` | "Register your business profile..." |
| `merchant.merchantId` | "Merchant ID" |
| `merchant.generatedOnSave` | "Generated on save" |
| `merchant.taxId` | "Tax identification number" |
| `merchant.businessDomain` | "Business domain" |
| `merchant.catalogEndpoints` | "Catalog endpoints" |
| `merchant.catalogHelp` | "One URL per line..." |
| `merchant.merchantName` | "Business name" |
| `merchant.contactEmail` | "Contact email" |
| `merchant.contactPhone` | "Contact phone" |
| `merchant.telegramChannel` | "Telegram channel" |
| `merchant.onboardButton` | "Submit merchant profile" |
| `merchant.onboarded` | "Onboarded" |
| `merchant.domainRetail` | "Retail" |
| `merchant.domainWholesale` | "Wholesale" |
| `merchant.domainElectronics` | "Electronics" |
| `merchant.domainAutomotive` | "Automotive" |
| `merchant.domainRealEstate` | "Real estate" |
| `merchant.domainServices` | "Services" |
| `merchant.domainFood` | "Food" |
| `merchant.domainAgri` | "Agriculture" |
| `merchant.domainFashion` | "Fashion" |

### 4. Auth Store Integration (`bayonhub-app/src/store/useAuthStore.js`)
**Merchant data persistence**:
```javascript
updateUser({ store: nextStore })
// Merges patch into user object
// Persists to localStorage when offline
// Updates Zustand state
```

---

## Data Flow Diagram

```
User Form (StoreTab.jsx)
    ↓
updateUser() in useAuthStore
    ↓
save() calls merchantAPI.create/update()
    ↓
    ├─→ [IF API_BACKEND] → POST/PUT /api/v1/merchant/*
    │       ↓
    │   Backend validates & stores in Redis
    │       ↓
    │   Returns merchant_profile object
    │
    └─→ [IF NO BACKEND] → localStorage fallback
        ↓
    Stores in bayonhub:merchantProfiles
    ↓
Toast success + setMerchantStatus("loaded")
    ↓
Display "Onboarded" badge
```

---

## Testing Checklist

### Backend API Tests
- ✅ Create merchant profile (201 response)
- ✅ Retrieve merchant profile (200 response)
- ✅ Update merchant profile (200 response)
- ✅ Reject invalid merchantId format (400)
- ✅ Handle missing profile (404)
- ✅ Validate required fields (400)
- ✅ Reject invalid catalog endpoints (400)
- ✅ Require authentication (401 if no JWT/API key)

### Frontend Tests
- ✅ Merchant API module exports all 3 functions
- ✅ Translation keys complete (EN + KM)
- ✅ Business domain options all translated
- ✅ Form submission calls correct API functions
- ✅ Offline mode uses localStorage fallback
- ✅ Error messages display properly
- ✅ Merchant ID generated on first save
- ✅ Profile status badge shows when loaded

### Integration Tests
- ✅ Frontend/backend builds successfully
- ✅ No TypeScript errors
- ✅ No ESLint errors
- ✅ Chunk size limits maintained
- ✅ Auth store properly merges merchant data

---

## Files Changed

### Backend
- `bayonhub-api/src/modules/merchant/router.ts` — Complete merchant profile endpoints
- `bayonhub-api/src/config/env.ts` — Merchant API key support
- `bayonhub-api/src/app.ts` — Merchant router registration
- `bayonhub-api/.env.example` — Added MERCHANT_API_KEYS

### Frontend
- `bayonhub-app/src/api/merchant.js` — New merchant API client
- `bayonhub-app/src/components/dashboard/StoreTab.jsx` — Merchant form UI
- `bayonhub-app/src/lib/translations.js` — Merchant translation keys (EN + KM)
- `bayonhub-app/MIGRATION_NOTES.md` — Documented changes

### Integration Tests
- `scripts/test-merchant-integration.mjs` — Comprehensive integration test suite

---

## Offline-First Behavior

**When `VITE_API_URL` is empty**:
1. Frontend uses `bayonhub:merchantProfiles` localStorage
2. Create/update saves to localStorage synchronously
3. Retrieval reads from localStorage
4. No network calls attempted

**When `VITE_API_URL` is set**:
1. Frontend calls backend API
2. Backend validates and stores in Redis
3. localStorage ignored for merchant data
4. API errors trigger fallback toast messages

---

## Performance Notes

- **Bundle size**: Merchant module adds ~2KB (gzipped)
- **Redis storage**: 30-day TTL per profile (auto-cleanup)
- **Validation**: Synchronous UUID/URI checks on backend
- **Error codes**: Specific HTTP status codes for debugging

---

## Security Considerations

1. **Authentication**: JWT or API key required for all merchant endpoints
2. **Validation**: All inputs validated server-side
3. **URI Validation**: Only http/https URLs allowed for catalog endpoints
4. **UUID Validation**: Strict UUIDv4 format checking
5. **Rate Limiting**: General API limiter applies to merchant routes
6. **CORS**: Backend CORS properly configured for frontend domain

---

## Production Readiness Checklist

- ✅ Backend API endpoints complete and tested
- ✅ Frontend UI complete with translations
- ✅ Offline fallback implemented and validated
- ✅ Error handling comprehensive
- ✅ Authentication integrated
- ✅ Build/lint clean (both frontend + backend)
- ✅ No security vulnerabilities identified
- ✅ Data persistence strategy (Redis + localStorage)
- ✅ Bilingual support (English + Khmer)

**Status**: Ready for production deployment

---

## Future Enhancements

1. Database persistence (currently Redis-only; 30-day TTL)
2. Merchant dashboard analytics
3. API key management UI
4. Batch merchant imports
5. Webhook notifications on profile changes
6. Admin merchant management interface

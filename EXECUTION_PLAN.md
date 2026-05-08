# BayonHub Execution Plan — 30/60/90 Day Roadmap (Claude AI/Claude Code)

## ⚠️ CRITICAL: Two Agents, Independent Work Streams

**AGENT 1 (Sprint A — Other AI):** Backend listing CRUD + basic UI  
**AGENT 2 (Phases 1–3 — Claude AI/Claude Code):** Marketplace features + polish

### BOTH agents work in PARALLEL. NO dependencies between them until END of Sprint A.

---

## Sprint A Completion Checklist (for Agent 1)

**AGENT 1 must complete ALL of these before Phase 1 begins.**

Sprint A delivers:
- ✅ Backend POST /listings (create)
- ✅ Backend PATCH /listings/:id (update)
- ✅ Backend DELETE /listings/:id (delete)
- ✅ Backend GET /listings/mine (fetch user's listings)
- ✅ Backend POST /listings/:id/view (increment views)
- ✅ Frontend API: markListingAsSold(), fetchMyListings(), incrementListingView()
- ✅ Zustand store: fetchMyListings, markAsSold, clearCurrentListing, incrementView actions
- ✅ ListingPage: clearCurrentListing on unmount + incrementView posts to backend
- ✅ ListingDetail: SOLD badge overlay + seller avatar fallback
- ✅ MyAdsTab: fetchMyListings on mount + markAsSold integration
- ✅ EditListingPage: ownership guard (notOwner error)
- ✅ PostAdWizard: uploadProgress states + auto-navigate after publish
- ✅ Translations: 9 new keys (post.uploading, myAds.deleted, listing.sold, etc.)
- ✅ Build passes: npm run lint && npm run build
- ✅ All 11 checks pass (grep for endpoints, functions, translations)

**No Phase 1 work begins until all 14 items above are ✅ DONE.**

---

## Phase 1 Start Conditions (for Agent 2 / Claude)

**Before AGENT 2 starts Phase 1, verify:**

1. Sprint A is merged to main branch
2. All 14 Sprint A items above are ✅
3. Backend `/listings` endpoints tested and working
4. Frontend API functions imported and callable
5. `npm run build` succeeds on main branch
6. Zero console errors when creating a test listing

**If any of these fail: Phase 1 is BLOCKED until Sprint A fixes it.**

---

## Isolation Rules: What Each Agent Owns

### AGENT 1 (Sprint A) owns ONLY:
- `bayonhub-api/src/modules/listings/` (backend)
- `bayonhub-api/src/modules/listings/service.ts` (3 new functions)
- `bayonhub-api/src/modules/listings/router.ts` (3 new routes)
- `bayonhub-api/src/modules/listings/controller.ts` (3 new handlers)
- `src/api/listings.js` (3 new API functions)
- `src/store/useListingStore.js` (4 new store actions + 2 state fields)
- `src/pages/ListingPage.jsx` (clearCurrentListing + incrementView)
- `src/components/listing/ListingDetail.jsx` (SOLD badge + avatar fallback)
- `src/components/dashboard/MyAdsTab.jsx` (fetchMyListings + markAsSold)
- `src/pages/EditListingPage.jsx` (ownership guard)
- `src/components/posting/PostAdWizard.jsx` (upload progress + auto-navigate)
- `src/lib/translations.js` (9 keys only: post.uploading, myAds.*, listing.sold*, edit.success, errors.notOwner, validation.*)
- **Does NOT touch:** categoryForms.js, CategoryForm.jsx, CategoryPage.jsx, BottomNav.jsx, SearchPage.jsx, or anything schema-related

### AGENT 2 (Phase 1+) owns ONLY:
- `src/lib/categoryForms.js` (enhance existing schema file)
- `src/components/posting/CategoryForm.jsx` (create or enhance reusable form component)
- `src/components/posting/FormField.jsx` (create or enhance reusable input field component)
- `src/pages/CategoryPage.jsx` (ENHANCE but don't touch listing CRUD)
- `src/components/category/CategoryHero.jsx` (create if needed to extract hero UI)
- `src/components/category/CategoryFilters.jsx` (create if needed for filter panel)
- `src/components/layout/BottomNav.jsx` (refine existing mobile nav in Navbar, create only if it improves clarity)
- Phase 2+ components (search, ratings, dashboard enhancements)
- Phase 3 polish (images, PWA, UX, accessibility)
- ~25 new translation keys (NOT the 9 Sprint A keys)
- **Does NOT touch:** backend code, Sprint A modifications, API layer, or auth

### Collision Risk: ZERO (if rules above are followed)

Both agents can work in parallel on different files. No merge conflicts.

---

## Important: ⏸️ AGENT 2 (Claude) should NOT start Phase 1 until Sprint A is merged to main

**Timeline:**
- **Day 1–7:** AGENT 1 (Sprint A) works independently
- **Day 8:** Sprint A merges to main, all tests pass
- **Day 8+:** AGENT 2 (Phase 1) begins with confidence
- **Day 8–45:** Both agents can work in parallel on different features
  - AGENT 1: (idle or working on other tasks)
  - AGENT 2: Phases 1–3

---

## ⚠️ Important: Other Overlap to Avoid

### PostAdWizard component
- Sprint A: Adds upload progress state + auto-navigate after publish ✅
- Phase 1: Refactors to use category schemas (Task 1.3)
- **Risk:** If Sprint A's PostAdWizard is incomplete or placeholder, Phase 1 will build on broken foundation
- **Mitigation:** Sprint A must deliver a WORKING PostAdWizard skeleton. Phase 1 will enhance it.

### Translations
- Sprint A: Adds 9 keys (hardcoded)
- Phase 1+: Adds ~40 more keys (ongoing)
- **Risk:** None if both agents use `t()` correctly and don't overwrite keys
- **Mitigation:** Sprint A adds only its 9 keys; Phase 1+ adds new keys with different prefixes

### Zustand stores
- Sprint A: Extends useListingStore with 4 new actions + 2 state fields
- Phase 1+: Creates NEW stores (useSavedSearchStore, useRatingStore) + keeps useListingStore stable
- **Risk:** If Sprint A's store changes break existing actions, Phase 1 breaks
- **Mitigation:** Sprint A only ADDS to store, never DELETES or RENAMES existing actions

---

## Sprint A Expected Output (for handoff to Phase 1)

When AGENT 1 finishes Sprint A, deliver to AGENT 2:
1. Commit hash and branch name (e.g., `sprint-a` merged to `main`)
2. Full sweep output showing all 11 checks pass
3. Brief summary of files modified
4. Any known bugs or limitations
5. **Confirmation:** PostAdWizard v0.1 is working (users can upload photos + submit)

**Example handoff message:**
```
Sprint A Complete ✅
- Commit: a1b2c3d (merged to main)
- PostAdWizard: Working (photos upload, auto-navigate on publish)
- All 11 checks pass
- Ready for Phase 1
```

---

## Phase 1 Expected Output (for Phase 2 handoff)

When AGENT 2 completes Phase 1, deliver to stakeholders:
1. Category form schemas complete (all 5 categories)
2. PostAdWizard v2 with category-aware forms
3. Category landing pages with filters
4. Bottom navigation working
5. Build passes: npm run lint && npm run build
6. ~25 new translation keys added
7. All 5 categories testable for posting

**Example:** "Post wizard now takes 2 minutes per listing with smart forms."

---

## Exact Phase 1 Start Gate

**DO NOT start Phase 1 until:**

```bash
# In bayonhub-app directory
grep -c "myListings\|clearCurrentListing\|markAsSold" src/store/useListingStore.js
# Should return >= 3

grep -c "incrementListingView\|markListingAsSold\|fetchMyListings" src/api/listings.js
# Should return >= 3

grep -c "listing.sold\|post.uploading\|myAds.deleted" src/lib/translations.js
# Should return >= 3

npm run build
# Should succeed with no errors

npm run lint
# Should succeed with no errors
```

**If ANY check fails: Block Phase 1. Request Sprint A fix.**

---

## Exact Phase 2 Start Gate

**DO NOT start Phase 2 until:**

```bash
# In bayonhub-app directory
grep -c "CATEGORY_FORMS\|getFormSchema" src/lib/categoryForms.js
# Should return >= 2

ls -la src/components/posting/CategoryForm.jsx src/components/layout/BottomNav.jsx
# Both files should exist

npm run build
# Should succeed (Phase 1 build passes)

npm run lint
# Should succeed (Phase 1 lint passes)
```

---

## Communication Protocol Between Agents

### If AGENT 1 (Sprint A) finishes early:
- Merge to main
- Notify AGENT 2 in a comment/message: "Sprint A ready, Phase 1 can start"
- AGENT 2 pulls main and verifies all checks pass
- AGENT 2 starts Phase 1

### If AGENT 1 finds a bug in existing code (not Sprint A scope):
- **DO NOT FIX IT in Sprint A**
- Document it and add to Phase 3 bug list
- Notify AGENT 2 to include in Phase 3 accessibility/QA sweep

### If AGENT 2 (Phase 1) finds a Sprint A component is broken:
- Notify AGENT 1 immediately
- Create bug issue and assign to AGENT 1
- Phase 1 is blocked until fixed
- AGENT 2 can work on other Phase 1 tasks while waiting

---

## Resource Isolation Checklist

- [ ] Sprint A has its own branch (sprint-a or feature/sprint-a)
- [ ] Phase 1 branches off main AFTER Sprint A merges
- [ ] Each agent has their own local clone (no shared editing)
- [ ] No file merge conflicts expected (different files)
- [ ] Both agents use `npm run lint && npm run build` after each commit
- [ ] Git commits are small and focused per agent
- [ ] No .gitignore or config files changed by either agent

---

# ⬇️ EXECUTION PLAN BELOW (Phases 1–3)

---

## Phase 1: Complete Post Ad Wizard & Category Landing Pages (Days 1–30)

### Goal
Complete the post ad wizard with category-aware forms and multi-step UX. Launch category landing pages with smart defaults.

### Assumptions (Sprint A already complete):
- ✅ Backend POST /listings, PATCH /listings/:id, DELETE /listings/:id work
- ✅ Backend GET /listings/mine returns user's listings
- ✅ Backend POST /listings/:id/view increments view count
- ✅ SOLD badge and status UI exist in ListingDetail
- ✅ MyAdsTab calls fetchMyListings on mount
- ✅ EditListingPage has ownership guard

---

### Task 1.1: Refine Category-Specific Form Schemas

**Status:** Foundation — must complete first  
**File:** `src/lib/categoryForms.js` (existing file to enhance)

**Subtasks:**

1.1.1 Review and refine schema builder
- [ ] Enhance the existing category → fields mapping
- [ ] Ensure each category object has:
  - `id`: string (matches CATEGORIES.id)
  - `label`: { en: string, km: string }
  - `icon`: icon name
  - `required`: array of field names
  - `optional`: array of field names
  - `fields`: object mapping field name → { type, label_en, label_km, placeholder, options?, validation? }
- [ ] Estimate: 2 days

1.1.2 Define all 5 top categories
- [ ] Cars: make, model, year, mileage, price, fuel, transmission, condition, location
- [ ] Property Rent: type, bedrooms, bathrooms, price/month, furnishing, location, availableDate
- [ ] Property Sale: type, price, location, bedrooms, bathrooms, landSize, builtArea
- [ ] Phones: brand, model, storage, RAM, condition, price, location
- [ ] Jobs: type, category, salary range, experience, location
- [ ] Estimate: 3 days

**Example structure:**
```javascript
export const CATEGORY_FORMS = {
  cars: {
    id: 'cars',
    label: { en: 'Cars', km: 'រថយន្ត' },
    icon: 'Car',
    required: ['make', 'model', 'year', 'price', 'location', 'condition'],
    optional: ['mileage', 'fuel', 'transmission', 'bodyType', 'color'],
    fields: {
      make: {
        type: 'text',
        label: { en: 'Brand/Make', km: 'ម៉ាក' },
        placeholder: 'Toyota, Honda, etc.',
        validation: 'required'
      },
      // ... more fields
    }
  },
  // ... more categories
}

export function getFormSchema(categoryId) {
  return CATEGORY_FORMS[categoryId] || null
}

export function getRequiredFields(categoryId) {
  const schema = getFormSchema(categoryId)
  return schema?.required || []
}
```

**Total for Task 1.1: ~5 days**

---

### Task 1.2: Create Dynamic Category Form Component

**Status:** High priority  
**Files:** `src/components/posting/CategoryForm.jsx`, `src/components/posting/FormField.jsx` (new)

**Subtasks:**

1.2.1 Build generic FormField component
- [ ] Renders based on field type: text, number, select, radio, textarea, date
- [ ] Props: label_en, label_km, type, value, onChange, required, options, error
- [ ] Khmer-first labels with English secondary
- [ ] Error message display below field
- [ ] Estimate: 2 days

1.2.2 Build CategoryForm component
- [ ] Takes `categoryId` prop
- [ ] Fetches schema from CATEGORY_FORMS
- [ ] Renders required fields first, then optional in collapsible section
- [ ] Form state: { [fieldName]: value }
- [ ] onChange handler propagates up to parent
- [ ] onSubmit button with validation
- [ ] Estimate: 3 days

1.2.3 Add smart suggestions
- [ ] Auto-fill title suggestions for cars (e.g., "[Year] [Make] [Model]")
- [ ] Pre-fill last-used values for repeat posters (from localStorage)
- [ ] Estimate: 1 day

**Total for Task 1.2: ~6 days**

---

### Task 1.3: Refactor PostAdWizard to Use Schemas

**Status:** High priority  
**File:** `src/components/posting/PostAdWizard.jsx` (update existing)

**Assumption:** Sprint A already added upload progress and auto-navigate; this task builds on that.

**Subtasks:**

1.3.1 Update step flow
- [ ] Step 1: SelectCategory (icon grid, searchable)
- [ ] Step 2: UploadPhotos (1–8 photos, lazy load from storage)
- [ ] Step 3: FillForm (category-specific form using Task 1.2 component)
- [ ] Step 4: Preview (shows final listing layout)
- [ ] Step 5: Publish (calls store.createListing)
- [ ] Estimate: 2 days

1.3.2 Connect CategoryForm to wizard
- [ ] Pass selected category to Step 3
- [ ] Render CategoryForm component
- [ ] Collect form data into wizard state
- [ ] Estimate: 2 days

1.3.3 Update preview to use form fields
- [ ] Preview shows all filled form fields in listing detail layout
- [ ] Highlight missing recommended fields ("Add mileage for 20% more visibility")
- [ ] Estimate: 1 day

**Total for Task 1.3: ~5 days**

---

### Task 1.4: Polish Category Landing Pages

**Status:** High priority  
**File:** `src/pages/CategoryPage.jsx` (update), optionally `src/components/category/CategoryHero.jsx`, `src/components/category/CategoryFilters.jsx`

**Subtasks:**

1.4.1 Improve the existing category hero and filters
- [ ] Refine the hero layout on `CategoryPage.jsx`
- [ ] Add or extract a reusable category hero section with name, icon, item count, and safety tips
- [ ] Keep the current category filters but make them clearer and more mobile-friendly
- [ ] Estimate: 2 days

1.4.2 Build CategoryFilters component
- [ ] Top hero filter bar: location + price + 1 key filter
- [ ] "View all filters" button opens bottom sheet on mobile
- [ ] Sticky filter chips at results top
- [ ] Uses schema from CATEGORY_FORMS to generate UI
- [ ] Estimate: 3 days

1.4.3 Enhance CategoryPage
- [ ] Import and render CategoryHero above existing listings
- [ ] Import and render CategoryFilters
- [ ] Pass selected category ID to filter component
- [ ] Apply filters to displayed listings
- [ ] Estimate: 2 days

1.4.4 Add subcategory grid
- [ ] Show subcategories for category (e.g., "Cars: SUVs, Sedans, Pickup, Vans, Trucks")
- [ ] Each with count and link to filtered results
- [ ] Estimate: 1 day

**Total for Task 1.4: ~8 days**

---

### Task 1.5: Mobile Navigation Bottom Bar (Polish)

**Status:** Medium priority  
**File:** `src/components/layout/Navbar.jsx` (existing bottom nav to improve)

**Subtasks:**

1.5.1 Polish the existing mobile bottom nav
- [ ] Improve the current `Navbar.jsx` mobile nav block
- [ ] Ensure the FAB is prominent and routes to `/post`
- [ ] Keep desktop behavior unchanged (hidden on `lg` and above)
- [ ] Estimate: 2 days
**Assumption:** Sprint A may have started this; this ensures completion.

**Subtasks:**

1.5.1 Build BottomNav component
- [ ] File: `src/components/layout/BottomNav.jsx`
- [ ] Items: Home (icon), Search (icon), Post (FAB in center), Saved (icon), Account (icon)
- [ ] Sticky at bottom on mobile, hidden on desktop (lg: and above)
- [ ] Active state indicator (underline or highlight)
- [ ] Estimate: 2 days

1.5.2 Integrate FAB into BottomNav
- [ ] Center button is large, raised, action-focused
- [ ] Clicking opens PostAdWizard modal or navigates to /post
- [ ] Visible from all pages
- [ ] Estimate: 1 day

1.5.3 Update Layout.jsx
- [ ] Render BottomNav at bottom of all pages
- [ ] Adjust padding/margin so content doesn't hide behind nav
- [ ] Estimate: 1 day

**Total for Task 1.5: ~4 days**

---

### Task 1.6: Add Translations for Phase 1

**Status:** Ongoing  
**File:** `src/lib/translations.js` (update)

**Assume Sprint A adds 9 keys; this adds ~20 more for Phase 1:**

1.6.1 Add category and form keys
- [ ] `category.cars`, `category.property_rent`, etc. (en + km)
- [ ] `form.required`, `form.optional`, `form.selectCategory`
- [ ] Field labels for all category schemas (en + km)
- [ ] Estimate: 3 days (ongoing)

1.6.2 Add filter and discovery keys
- [ ] `filter.byCategory`, `filter.category`, `filter.featured`, `filter.nearYou`
- [ ] `discover.safetyTips`, `discover.howToBuy`, etc. (en + km)
- [ ] Estimate: 1 day

**Total for Task 1.6: ~4 days (ongoing)**

---

### Phase 1 Summary

**Total effort: ~37 days** (focuses on post wizard + categories, excludes Sprint A)

**Key deliverables:**
- ✅ Category-specific form schemas for all 5 top categories
- ✅ Dynamic CategoryForm component
- ✅ PostAdWizard refactored to use schemas
- ✅ Category landing pages with hero, filters, subcategories
- ✅ Mobile bottom navigation with FAB
- ✅ ~25 new translation keys in Khmer + English

**Success metrics (end of Phase 1):**
- Time to create listing: median < 2 minutes
- % of listings with category-specific fields filled: > 80%
- % of category page visits that use filters: > 25%
- Search filter usage rate: > 30%

---

## Phase 2: Advanced Search, Saved Searches & Ratings (Days 31–60)

### Goal
Close the discovery gap with Khmer24. Add smart search filters (per category schemas), saved searches, and seller reputation system.

### Assumptions (Phase 1 complete):
- ✅ Category-specific form schemas exist
- ✅ PostAdWizard uses schemas
- ✅ Category landing pages with hero filters exist
- ✅ Bottom navigation and FAB working

---

### Task 2.1: Advanced Search with Faceted Filters

**Status:** High priority  
**File:** `src/pages/SearchPage.jsx` (update), `src/components/search/SearchFilters.jsx` (new)

**Subtasks:**

2.1.1 Refactor SearchPage filter logic
- [ ] Replace generic price/province/condition filters with faceted system
- [ ] Load category ID from URL or user context
- [ ] Fetch schema from CATEGORY_FORMS for category-specific filters
- [ ] Build filter groups: Category → Subcategory → (category-specific fields)
- [ ] Estimate: 3 days

2.1.2 Build SearchFilters component
- [ ] Renders category-specific filters based on schema
- [ ] Show facet counts (e.g., "Toyota (24), Honda (18), Mitsubishi (12)")
- [ ] Support multi-select for some fields (e.g., fuel type)
- [ ] Estimate: 3 days

2.1.3 Add advanced sort options
- [ ] Expand sorts: "Newest", "Price: Low to High", "Price: High to Low", "Distance", "Most Viewed"
- [ ] Add distance sorting if geolocation available (show "Near me" results first)
- [ ] Estimate: 2 days

2.1.4 Optimize filter performance
- [ ] Wrap filter state and sorted results in `useMemo`
- [ ] Debounce price slider changes (500ms)
- [ ] Lazy load facet counts for slow networks
- [ ] Estimate: 2 days

**Total for Task 2.1: ~10 days**

---

### Task 2.2: Saved Searches & Notifications

**Status:** High priority  
**Files:** `src/store/useListingStore.js` (existing saved searches), `src/components/search/SaveSearchModal.jsx`, `src/components/dashboard/SavedSearchesTab.jsx`

**Subtasks:**

2.2.1 Improve existing saved search state
- [ ] Use the existing `savedSearches` state in `useListingStore.js`
- [ ] Confirm save/delete actions work and persist to `bayonhub:savedSearches`
- [ ] Estimate: 2 days

2.2.2 Build or refine "Save Search" modal
- [ ] Create or improve `src/components/search/SaveSearchModal.jsx`
- [ ] Trigger it from SearchPage or Navbar save button
- [ ] Fields: name, enable email notifications, enable SMS notifications
- [ ] Estimate: 2 days

2.2.3 Improve saved searches dashboard
- [ ] Enhance `src/components/dashboard/SavedSearchesTab.jsx`
- [ ] Show query summary, filters applied, creation date
- [ ] Add run, rename, delete, and notification badges
- [ ] Estimate: 3 days

2.2.4 Integrate saved searches into search flow
- [ ] Surface recent saved searches on SearchPage
- [ ] Allow quick re-run of saved searches
- [ ] Estimate: 1 day

2.2.5 Add notification placeholders
- [ ] Persist user preferences for email/SMS notifications
- [ ] Display a badge or status on saved searches
- [ ] Estimate: 1 day

**Total for Task 2.2: ~9 days**

---

### Task 2.3: Seller Ratings & Reviews System

**Status:** High priority  
**Files:** `src/store/useStorefrontStore.js` (existing review state), `src/components/storefront/ReviewModal.jsx`, `src/pages/StorefrontPage.jsx`

**Subtasks:**

2.3.1 Improve existing storefront review state
- [ ] Enhance `useStorefrontStore.js` to support review submission and storefront refresh
- [ ] Confirm `submitReview` and review persistence are working
- [ ] Estimate: 2 days

2.3.2 Improve ReviewModal component
- [ ] Refine the existing `src/components/storefront/ReviewModal.jsx`
- [ ] Ensure 5-star selection, optional comment, and tags work well
- [ ] Estimate: 2 days

2.3.3 Improve storefront rating display
- [ ] Polish `StorefrontPage.jsx` to show average rating, review count, and breakdown
- [ ] Add trust badges like Top Rated, Quick Responder, Verified Seller based on existing data
- [ ] Estimate: 2 days

2.3.4 Improve listing rating visibility
- [ ] Enhance rating display in `ListingCard.jsx` and `ListingDetail.jsx`
- [ ] Ensure ratings are visible and consistent across listing views
- [ ] Estimate: 2 days

**Total for Task 2.3: ~10 days**
- [ ] List all reviews for seller, sorted by newest
- [ ] Show: reviewer name (anonymous or masked), stars, review text, tags, date
- [ ] Basic moderation: flag inappropriate reviews
- [ ] Estimate: 2 days

2.3.5 Add seller badges based on ratings
- [ ] "Top Rated" (avg > 4.5 stars, > 5 reviews)
- [ ] "Trusted Seller" (avg > 4.0 stars, > 10 reviews)
- [ ] "Quick Responder" (avg response < 2 hours on chats)
- [ ] Show badges on seller profile and listing detail
- [ ] Estimate: 2 days

**Total for Task 2.3: ~10 days**

---

### Task 2.4: Seller Dashboard Enhancements

**Status:** High priority  
**Assumption:** DashboardPage exists; this builds on it.

**Subtasks:**

2.4.1 Add "Active Listings" tab
- [ ] Tab component showing all seller's listings
- [ ] Each listing card: thumbnail, title, price, views, leads count
- [ ] Status badge: Active, Sold, Pending
- [ ] Quick actions: Edit, Mark as sold (calls Sprint A's markAsSold), Delete, Promote
- [ ] Estimate: 3 days

2.4.2 Add "Messages/Leads" tab
- [ ] Show all leads grouped by listing
- [ ] Lead type badge: Call, WhatsApp, Chat, Inquiry
- [ ] Display: buyer name, timestamp, first message snippet
- [ ] Mark as "contacted", "replied", "closed", "interested"
- [ ] Estimate: 3 days

2.4.3 Add "Analytics" tab
- [ ] Simple dashboard: total views this week, new leads today, messages pending
- [ ] Bar chart: views over last 7 days
- [ ] Table: top 3 listings by views
- [ ] Uses existing view counter from Sprint A
- [ ] Estimate: 2 days

2.4.4 Add seller stats widget
- [ ] Quick summary at top: active listings, views, leads, response rate (mock)
- [ ] Estimate: 1 day

**Total for Task 2.4: ~9 days**

---

### Task 2.5: Buyer Dashboard — Favorites & Watchlist

**Status:** Medium priority  
**Assumption:** Favorites store exists from Sprint A.

**Subtasks:**

2.5.1 Create "Favorites" tab in DashboardPage
- [ ] Grid view of saved listings
- [ ] Same card layout as search results
- [ ] Filter by category, sort by date added
- [ ] Remove button / bulk delete
- [ ] Estimate: 2 days

2.5.2 Add watchlist features
- [ ] Mark listing to "watch" (notify me if price drops)
- [ ] Show price change badge (e.g., "Price ↓ 10%")
- [ ] Estimate: 2 days

**Total for Task 2.5: ~4 days**

---

### Task 2.6: Add Translations for Phase 2

**Status:** Ongoing  
**File:** `src/lib/translations.js` (update)

**~15 new keys for Phase 2:**

2.6.1 Search and filter keys
- [ ] `search.advanced`, `search.saveSearch`, `search.viewSavedSearches`
- [ ] `filter.facets`, `filter.showMore`, `filter.noResults`
- [ ] Estimate: 1 day

2.6.2 Rating and seller keys
- [ ] `seller.topRated`, `seller.trustedSeller`, `seller.reviews`, `seller.leaveReview`
- [ ] `rating.stars`, `rating.tags`, `rating.sentiment`
- [ ] Estimate: 1 day

2.6.3 Dashboard keys
- [ ] `dashboard.myListings`, `dashboard.leads`, `dashboard.analytics`
- [ ] `lead.interested`, `lead.contacted`, `lead.closed`
- [ ] Estimate: 1 day

**Total for Task 2.6: ~3 days (ongoing)**

---

### Phase 2 Summary

**Total effort: ~45 days** (assumes Phase 1 complete)

**Key deliverables:**
- ✅ Advanced faceted search with category-specific filters
- ✅ Saved searches and notification placeholders
- ✅ Ratings & reviews system for sellers
- ✅ Seller dashboard with leads and analytics
- ✅ Buyer favorites and watchlist
- ✅ ~15 new translation keys

**Success metrics (end of Phase 2):**
- Filter usage rate: > 50%
- Saved search adoption: > 25% of active users
- Average seller rating: > 4.0 stars
- Seller dashboard: > 40% of sellers visit weekly
- Repeat buyer rate: > 30%

## Phase 3: Polish, Performance & Accessibility (Days 61–90)

### Goal
Make BayonHub feel polished, fast, and trustworthy. Optimize for slow networks and low-end devices. Finalize Khmer-first UX.

### Assumptions (Phase 2 complete):
- ✅ All core marketplace features built
- ✅ Search, ratings, dashboard working
- ✅ Offline fallback and PWA functional

---

### Task 3.1: UX Polish & Visual Consistency

**Status:** Medium priority  
**Files:** Multiple components across app

**Subtasks:**

3.1.1 Audit spacing and padding
- [ ] Review all components for consistent padding/margin
- [ ] Use Tailwind scale: 2, 3, 4, 6, 8, 12 units consistently
- [ ] Apply to cards, lists, sections, modals
- [ ] Test on mobile (390px) and desktop (1440px)
- [ ] Estimate: 3 days

3.1.2 Standardize typography
- [ ] h1–h6 sizes, body text sizes, weights
- [ ] Use consistent weights: 400 (regular), 600 (semibold), 700 (bold), 900 (black)
- [ ] Ensure Khmer text is readable (sometimes needs larger size)
- [ ] Estimate: 2 days

3.1.3 Polish buttons and CTAs
- [ ] Review all button variants (primary, secondary, tertiary)
- [ ] Add consistent focus/active/disabled states
- [ ] Add loading spinners to async actions
- [ ] Estimate: 2 days

3.1.4 Refine form inputs
- [ ] Consistent input height (44px or 40px)
- [ ] Consistent border radius and focus rings
- [ ] Error state styling
- [ ] Placeholder text color and opacity
- [ ] Estimate: 2 days

**Total for Task 3.1: ~9 days**

---

### Task 3.2: Image Optimization & Lazy Loading

**Status:** High priority  
**Files:** `src/lib/utils.js`, listing components, category components

**Subtasks:**

3.2.1 Add lazy loading to all listing images
- [ ] Add `loading="lazy"` to `<img>` tags in:
  - ListingCard, ListingListItem, ListingDetail (carousel)
  - CategoryPage listings
  - DashboardPage listings
- [ ] Implement intersection observer for blur-up effect
- [ ] Estimate: 2 days

3.2.2 Implement responsive srcSet
- [ ] Create `getSrcSet()` utility in `src/lib/utils.js` (if not present)
- [ ] Breakpoints: 200px (mobile), 400px (tablet), 600px (desktop)
- [ ] Update all listing images to use srcSet
- [ ] Estimate: 2 days

3.2.3 Add skeleton loaders
- [ ] Create `SkeletonCard.jsx`, `SkeletonListItem.jsx`, `SkeletonDetail.jsx`
- [ ] Show skeletons during loading state
- [ ] Apply to: search results, category pages, dashboard
- [ ] Estimate: 2 days

3.2.4 Optimize image sizes in R2 / storage
- [ ] Ensure images are compressed before upload
- [ ] Limit max upload size (5 MB per photo)
- [ ] Estimate: 1 day

**Total for Task 3.2: ~7 days**

---

### Task 3.3: PWA & Offline Optimization

**Status:** High priority  
**Files:** `vite.config.js`, service worker config, store files

**Subtasks:**

3.3.1 Configure Workbox caching
- [ ] Review `vite.config.js` PWA plugin
- [ ] Cache strategy:
  - Listing pages: stale-while-revalidate
  - Search results: cache-first (with fallback to network)
  - Images: cache-first, 30 day expiry
  - API data: network-first, cache fallback
- [ ] Precache critical assets (nav, home hero)
- [ ] Estimate: 2 days

3.3.2 Add offline listing search
- [ ] Cache recent search results
- [ ] Allow filtering/sorting cached listings without network
- [ ] Show "Offline mode" indicator when searching local cache
- [ ] Estimate: 2 days

3.3.3 Optimize for low bandwidth
- [ ] Use lower image quality on slow networks
- [ ] Lazy load non-critical components (maps, related listings)
- [ ] Add network status indicator (online/offline badge)
- [ ] Estimate: 2 days

3.3.4 Test offline functionality
- [ ] Verify listings visible offline after cache
- [ ] Verify search works on cached data
- [ ] Verify images load from cache
- [ ] Estimate: 1 day

**Total for Task 3.3: ~7 days**

---

### Task 3.4: Khmer-First UX & Microcopy

**Status:** High priority  
**Files:** All components, translations.js

**Subtasks:**

3.4.1 Audit all error and empty states
- [ ] Review error messages in forms, network, listings
- [ ] Ensure Khmer text is clear, friendly, local (not literal translations)
- [ ] Add contextual help in Khmer
- [ ] Estimate: 2 days

3.4.2 Refine form validation messages
- [ ] Phone number: show Cambodia format hint
- [ ] Price: show KHR and USD examples
- [ ] All field labels: Khmer-first, English secondary
- [ ] Estimate: 2 days

3.4.3 Polish empty states
- [ ] "No listings found" → helpful tips in Khmer + search suggestions
- [ ] "No saved listings" → "Save favorites to find them later"
- [ ] "No messages" → "Respond to buyer messages here"
- [ ] Each with icon and CTA
- [ ] Estimate: 2 days

3.4.4 Refine all microcopy
- [ ] Button labels, tooltips, help text
- [ ] Ensure Khmer feels natural and local
- [ ] Use idiomatic Khmer where standard English would be awkward
- [ ] Estimate: 2 days

3.4.5 Add Khmer numerals (optional)
- [ ] Allow users to toggle Khmer numerals (០-៩) in settings
- [ ] Display prices, counts, dates in Khmer numerals if enabled
- [ ] Estimate: 2 days

**Total for Task 3.4: ~10 days**

---

### Task 3.5: Analytics & Tracking

**Status:** Medium priority  
**Files:** `src/lib/analytics.js` (new), component hooks

**Subtasks:**

3.5.1 Set up event tracking framework
- [ ] Install analytics library (Google Analytics, Mixpanel, or simple custom logger)
- [ ] Create `src/lib/analytics.js` utility
- [ ] Define core events: pageView, listingView, listingPosted, leadCreated, search, filterApplied, saved
- [ ] Estimate: 2 days

3.5.2 Add conversion funnel tracking
- [ ] Track post wizard: category selected → photos uploaded → form completed → published
- [ ] Track search funnel: search executed → filter applied → listing clicked → contact
- [ ] Identify drop-off points
- [ ] Estimate: 2 days

3.5.3 Instrument key flows
- [ ] Add event calls to SearchPage, ListingPage, PostAdWizard, DashboardPage
- [ ] Track user IDs (anonymized) for retention analysis
- [ ] Estimate: 2 days

**Total for Task 3.5: ~6 days**

---

### Task 3.6: Performance Audit & Optimization

**Status:** High priority  
**Files:** Build config, component optimization

**Subtasks:**

3.6.1 Run Lighthouse audit
- [ ] Test on mobile and desktop
- [ ] Target: Lighthouse > 80 (Performance, Accessibility, Best Practices, SEO)
- [ ] Fix issues: unused CSS, JS execution time, accessibility warnings
- [ ] Use Chrome DevTools to profile
- [ ] Estimate: 3 days

3.6.2 Optimize bundle size
- [ ] Verify Three.js in separate `vendor-three` chunk
- [ ] Ensure no single chunk exceeds 500 KB
- [ ] Use `npm run build --report` or webpack-bundle-analyzer
- [ ] Identify and remove dead code
- [ ] Estimate: 2 days

3.6.3 Test on slow networks
- [ ] Throttle to "Slow 4G" and "Fast 3G" in Chrome DevTools
- [ ] Verify listings load and filters work
- [ ] Verify app works completely offline
- [ ] Create performance baseline report
- [ ] Estimate: 2 days

**Total for Task 3.6: ~7 days**

---

### Task 3.7: Accessibility & Browser Testing

**Status:** Medium priority

**Subtasks:**

3.7.1 Keyboard navigation audit
- [ ] Test tab through all pages (home, search, listing, post wizard, dashboard)
- [ ] Ensure all buttons and links are focusable
- [ ] Test screen reader (VoiceOver on Mac, NVDA on Windows)
- [ ] Estimate: 2 days

3.7.2 Color contrast and readability
- [ ] Check all text meets WCAG AA standards (4.5:1 for body, 3:1 for headings)
- [ ] Audit on light and dark modes
- [ ] Estimate: 1 day

3.7.3 Cross-browser testing
- [ ] Test on Chrome, Firefox, Safari (desktop)
- [ ] Test on Chrome Android, Safari iOS
- [ ] Check forms, modals, navigation on each
- [ ] Estimate: 2 days

**Total for Task 3.7: ~5 days**

---

### Task 3.8: Final Translations & QA

**Status:** Ongoing  
**File:** `src/lib/translations.js`

**~10 final keys for Phase 3:**

3.8.1 Add missing UI strings
- [ ] Error states, empty states, validation messages (en + km)
- [ ] Analytics and tracking events (optional)
- [ ] Estimate: 2 days

3.8.2 Final QA sweep
- [ ] Test all flows end-to-end on mobile and desktop
- [ ] Verify all text is Khmer-first where applicable
- [ ] Check no console warnings or errors
- [ ] Test offline mode thoroughly
- [ ] Estimate: 2 days

**Total for Task 3.8: ~4 days (ongoing)**

---

### Phase 3 Summary

**Total effort: ~56 days**

**Key deliverables:**
- ✅ Consistent spacing, typography, button styles
- ✅ Lazy-loaded images with srcSet and responsive sizing
- ✅ Skeleton loaders on all data-heavy pages
- ✅ Aggressive PWA caching for offline access
- ✅ Khmer-first error states, validation, empty states
- ✅ Khmer numerals option (optional)
- ✅ Event tracking and analytics instrumentation
- ✅ Lighthouse score > 80 (all categories)
- ✅ Full keyboard and screen-reader support
- ✅ Cross-browser tested

**Success metrics (end of Phase 3):**
- Lighthouse score: > 80 on desktop, > 75 on mobile
- App load time: < 2s on 4G, < 4s on 3G
- Image load time: < 1s on average connection
- Offline listing access: 100%
- User-reported app crashes: < 1%
- Pages per session: increase to > 4 (up from 2–3)

---

## Phase 4: Deferred — Payment & Subscriptions

This phase is intentionally deferred pending business decision. The foundation built in Phases 1–3 makes Phase 4 implementation straightforward.

### Placeholder items (for future sprints):
- 4.1 Add listing package selection UI in PostAdWizard
- 4.2 Implement ABA KHQR payment placeholder  
- 4.3 Build subscription flow for sellers
- 4.4 Add promoted listing and bumping features
- 4.5 KYC / ID verification flow

---

## Critical Path & Dependencies

```
Phase 1 (Days 1–37, excluding Sprint A):
├── Task 1.1 (categoryForms schema) [5 days] — FOUNDATION
├── Task 1.2 (CategoryForm component) [6 days] — depends on 1.1
├── Task 1.3 (PostAdWizard refactor) [5 days] — depends on 1.2
├── Task 1.4 (Category pages) [8 days] — parallel with 1.3
├── Task 1.5 (Bottom nav) [4 days] — parallel
└── Task 1.6 (Translations) [4 days ongoing] — throughout

Phase 2 (Days 31–75, assuming Phase 1 done):
├── Task 2.1 (Advanced search) [10 days]
├── Task 2.2 (Saved searches) [9 days] — parallel with 2.1
├── Task 2.3 (Ratings system) [10 days] — parallel
├── Task 2.4 (Seller dashboard) [9 days] — depends on 2.3
├── Task 2.5 (Buyer favorites) [4 days] — parallel
└── Task 2.6 (Translations) [3 days ongoing]

Phase 3 (Days 61–116, can overlap Phase 2):
├── Task 3.1 (UX polish) [9 days]
├── Task 3.2 (Images) [7 days] — parallel with 3.1
├── Task 3.3 (PWA/offline) [7 days] — parallel
├── Task 3.4 (Khmer UX) [10 days] — parallel
├── Task 3.5 (Analytics) [6 days] — parallel
├── Task 3.6 (Performance) [7 days] — parallel
├── Task 3.7 (Accessibility) [5 days] — parallel
└── Task 3.8 (Final QA) [4 days]
```

**Fastest timeline (Phase 1 + 2 + 3 serial):**
- ~37 days Phase 1
- ~45 days Phase 2
- ~56 days Phase 3
- **= ~138 calendar days total** (with 2 FTE devs + designer part-time)

**Optimized timeline (Phase 2 starts when Phase 1 core done, Phase 3 overlaps):**
- Start Phase 2 on day 20 (categories + forms done)
- Start Phase 3 on day 50 (search done)
- **= ~100 calendar days total** with good parallelization

---

## Resource Allocation (for Claude AI / Claude Code execution)

**Recommended team:**
- 1 full-stack React developer (Claude Code) — 5 days/week, Phases 1–3
- 1 mid-level React developer (Claude AI) — 3–5 days/week, Phases 1–3
- 1 UI/UX designer — 2–3 days/week for Phase 3 polish
- 1 QA tester — part-time, ongoing

**AI Agent execution:**
- Claude Code: Complex component builds, state management, API integration (Tasks 1.2, 1.3, 2.1, 2.4, 3.1, 3.2, 3.6)
- Claude AI: Schema design, documentation, translations, testing (Tasks 1.1, 1.4, 2.2, 2.3, 3.4, 3.5, 3.7, 3.8)

---

## Acceptance Criteria Per Phase

### Phase 1 Acceptance:
- [ ] Users can create a listing in < 2 minutes end-to-end
- [ ] At least 5 test listings created with category-specific fields
- [ ] Category landing pages render with hero and filters
- [ ] Bottom navigation visible and clickable on mobile
- [ ] All new UI strings in Khmer + English
- [ ] No console errors on main flows
- [ ] Build passes: `npm run build` succeeds, bundle < 500KB per chunk

### Phase 2 Acceptance:
- [ ] Search filters work for all 5 categories
- [ ] Saved searches persist and load without errors
- [ ] Seller profile shows ratings and badges
- [ ] Seller dashboard displays leads and analytics
- [ ] Favorites persist and sync across sessions
- [ ] All new components tested on mobile
- [ ] Build + lint pass: `npm run lint && npm run build`

### Phase 3 Acceptance:
- [ ] Lighthouse score > 80 (desktop), > 75 (mobile)
- [ ] App fully functional on Slow 4G throttle
- [ ] All app features work offline (listings visible, search works)
- [ ] All error states in Khmer
- [ ] Keyboard navigation works on all pages
- [ ] No console warnings or errors on main flows
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Android Chrome, iOS Safari)
- [ ] Final commit passes all tests

---

## Git & Release Strategy

**Branch naming:**
- `feature/category-forms` (Task 1.1)
- `feature/category-page-filters` (Task 1.4)
- etc.

**Release versions:**
- Phase 1 = v0.2.0 (post wizard + categories)
- Phase 2 = v0.3.0 (search + ratings + dashboard)
- Phase 3 = v0.4.0 (polish + performance + offline)

**Commit message format:**
```
feat(phase-1): category-specific forms and PostAdWizard refactor
feat(phase-2): advanced search with faceted filters
fix(phase-2): saved search persistence issue
docs: add category form schema documentation
test: add analytics event tracking
```

**Pull request template:**
- Phase and task reference
- Description of changes
- Testing done (manual flows, Lighthouse score, etc.)
- Checklist: lint passes, build succeeds, no console errors, Khmer strings present

---

## Success Definition

By end of Phase 3 (day 100):

✅ **Marketplace is complete & functional**
- Post, search, filter, view listings all work smoothly
- Category-specific forms reduce time to publish
- Seller and buyer dashboards support key workflows

✅ **Trust is differentiated vs Khmer24**
- Seller ratings and badges visible throughout
- Verification badges and safety tips prominent
- Reports and fraud prevention UX working

✅ **Performance & reliability**
- Lighthouse > 80 on desktop
- Works offline with PWA caching
- Fast on 4G and 3G connections

✅ **Khmer-first UX is polished**
- All errors, validation, empty states in Khmer
- No awkward English-first text
- Forms accept Khmer input naturally

✅ **Ready for growth**
- Analytics tracking major flows
- Code is clean and well-organized
- Team can hand off to future developers or scale

BayonHub is now positioned as a credible, modern, user-friendly alternative to Khmer24 for Cambodian buyers and sellers.

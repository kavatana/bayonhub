# Claude Code: Phase 1-3 Execution Prompt

**Status:** Ready to start after Sprint A merges (approximately Day 8)  
**Duration:** 100+ days (Phases 1, 2, 3)  
**Scope:** Frontend only — NO backend changes  
**Focus:** polish and complete existing marketplace features, not rebuild them from scratch

### Current app baseline
- `src/lib/categoryForms.js` already exists and provides core category field schemas
- `src/components/posting/PostAdWizard.jsx` already uses schema-driven fields and draft saving
- `src/pages/CategoryPage.jsx` and `src/pages/SearchPage.jsx` already have category filters and faceted UI
- Mobile bottom navigation already exists in `src/components/layout/Navbar.jsx`
- Saved searches already exist in `src/store/useListingStore.js` and dashboard UI
- Storefront reviews and ratings are already shown in `src/pages/StorefrontPage.jsx`

---

## ⚠️ CRITICAL RULES

### DO NOT TOUCH (Sprint A is working on these)
- ❌ `bayonhub-api/` — ANY backend file
- ❌ `src/api/listings.js` — DO NOT modify (Sprint A adds functions here)
- ❌ `src/store/useListingStore.js` — Only use existing actions (Sprint A adds 4 actions)
- ❌ `src/pages/ListingPage.jsx` — DO NOT modify (Sprint A adds clearCurrentListing + incrementView)
- ❌ `src/components/listing/ListingDetail.jsx` — DO NOT modify (Sprint A adds SOLD badge)
- ❌ `src/components/dashboard/MyAdsTab.jsx` — DO NOT modify (Sprint A creates this)
- ❌ `src/pages/EditListingPage.jsx` — DO NOT modify (Sprint A creates ownership guard)
- ❌ `src/components/posting/PostAdWizard.jsx` — DO NOT modify UNTIL Phase 1 Task 1.3
- ❌ First 9 translation keys in `src/lib/translations.js` (Sprint A adds these)

### DO TOUCH (Your responsibility)
- ✅ Enhance existing schema logic in `src/lib/categoryForms.js`
- ✅ Improve existing flows in `PostAdWizard.jsx`, `CategoryPage.jsx`, `SearchPage.jsx`, and `DashboardPage.jsx`
- ✅ Create only missing UI components when needed, not duplicate existing features
- ✅ Modify PostAdWizard ONLY in Phase 1 Task 1.3 (after Sprint A merges)
- ✅ Add Phase 1-3 translation keys (starting from key #10 onward)

---

## ✅ READINESS CHECK (Do this FIRST)

Run these commands to verify Sprint A is complete and merged:

```bash
cd bayonhub-app

# Check 1: Sprint A endpoints exist in backend
grep -c "POST /api/listings/mine\|PATCH /api/listings\|DELETE /api/listings" package.json || echo "Backend not visible here, check manually"

# Check 2: Sprint A store actions exist
grep -c "myListings\|clearCurrentListing\|incrementView\|markAsSold" src/store/useListingStore.js
# Expected output: >= 4

# Check 3: Sprint A API functions exist
grep -c "fetchMyListings\|fetchListingById\|incrementListingView\|markListingAsSold" src/api/listings.js
# Expected output: >= 4

# Check 4: Build passes
npm run lint && npm run build
# Expected: PASS

# Check 5: No merge conflicts
git status | grep "conflict" || echo "No conflicts"
```

**If any check fails:** WAIT — Sprint A is not complete. Do not proceed.  
**If all checks pass:** ✅ Ready to start Phase 1.

---

## PHASE 1: Category Forms + Post Wizard Refactor + Bottom Nav (Days 8–44)

### Task 1.1: Refine the existing CATEGORY_FORMS schema system (3 days)

**Objective:** Polish and complete the category field schema definitions for the top categories

**File to Enhance:** `src/lib/categoryForms.js`

**Requirements:**
- Validate and normalize the existing `CATEGORY_FORMS` object so it covers the main top-level categories used today
- Ensure every category has clear required/optional semantics and the fields needed for Khmer24-style listings
- Add helper exports if missing:
  - `getFormSchema(categoryId)` — returns full category schema
  - `getRequiredFields(categoryId)` — returns required field names array
  - `getOptionalFields(categoryId)` — returns optional field names array
  - `validateFieldValue(categoryId, fieldName, value)` — boolean or error message
- Keep the existing field definitions; enhance them rather than rewrite them from scratch

**Testing:**
```js
const carSchema = getFormSchema("cars");
console.log(carSchema.length !== undefined || carSchema.fields);  // schema exists
console.log(carSchema.fields.year.max);  // verify current year bound
```

**Do NOT modify:** Any other file yet.

---

### Task 1.2: Improve the existing PostAdWizard form flow and reusable fields (5 days)

**Objective:** Refine the existing form rendering in `PostAdWizard.jsx` using reusable components and better schema handling

**Files to Create or Enhance:**
1. `src/components/posting/FormField.jsx` (if missing) or enhance the existing field handling
2. `src/components/posting/CategoryForm.jsx` (create only if it improves reuse)

**FormField Requirements:**
- Props: `name`, `label`, `type`, `value`, `onChange`, `error`, `optional`, `options` (for select)
- Types supported: `text`, `number`, `select`, `radio`, `textarea`, `date`
- Features:
  - Khmer-first labels (use `t("field.label")` pattern)
  - Show "Required" or "(Optional)" indicator
  - Display error message in red if present
  - Input styling via Tailwind (focus ring, border color)
  - Mobile-friendly (full width by default)

**CategoryForm Requirements:**
- Props: `categoryId`, `onSubmit`, `initialValues = {}`, `submitLabel`
- Features:
  - Load schema via `getFormSchema(categoryId)`
  - Render required fields first (section header "Essential info")
  - Render optional fields in collapsible "More details" section
  - Show validation errors real-time
  - Submit button calls `onSubmit(formValues)`
  - Auto-suggestions for title field (e.g., "Toyota Camry 2020" based on make/model/year)
  - Use FormField component for each input

**Testing:**
```jsx
<CategoryForm 
  categoryId="cars" 
  onSubmit={(data) => console.log(data)}
  submitLabel="Post listing"
/>
```

**Do NOT modify:** `PostAdWizard.jsx` layout or step count yet.

---

### Task 1.3: Polish the existing PostAdWizard flow (5 days)

**Objective:** Improve the current PostAdWizard step flow, validation, and schema-driven details page

**File to Modify:** `src/components/posting/PostAdWizard.jsx`

**Changes:**
- Keep the current step structure and media upload flow
- Improve step 3 detail rendering with reusable field components or a `CategoryForm` wrapper
- Add stronger validation for required fields, phone/address, and Khmer/English localization
- Improve draft restore, review summary, and post-submit UX
- Keep the existing `createListing` action and step transitions

**Key improvements:**
- Validate category-specific required fields before advancing
- Better user guidance for missing fields and price input
- Preserve images and form drafts across refresh
- Keep preview + publish flow intact

**Testing:**
- Post a car listing: category → photos → fill make/model/year/price → preview → publish ✅
- Post a property: category → photos → fill bedrooms/bathrooms/price → preview → publish ✅
- Draft save/load works ✅

**Do NOT modify:** ListingPage, ListingDetail, MyAdsTab (Sprint A owns these).

---

### Task 1.4: Enhance Category Landing Pages (8 days)

**Objective:** Polish the existing category pages with a stronger hero section and smarter filters

**Files to Enhance:**
1. `src/pages/CategoryPage.jsx` — Refine hero layout, filter UX, and listing load logic
2. `src/components/filters/FacetedFilter.jsx` / `BodyTypeFilter.jsx` / `BrandLogoFilter.jsx` — Improve or add missing filter components
3. `src/lib/categories.js` / `src/lib/categoryForms.js` — Ensure category metadata and filters align

**Optional UI Components:**
- `src/components/category/CategoryHero.jsx` — if a reusable hero wrapper improves the page
- `src/components/category/CategoryFilters.jsx` — if a component extracts the filter panel clearly

**CategoryHero Requirements:**
- Display category name (e.g., "🚗 Cars for Sale")
- Show item count (e.g., "2,345 listings")
- Show 2-3 safety tips in expandable section (e.g., "Meet in public", "Inspect before payment")
- Mobile: Full width, smaller text; Desktop: Centered, larger heading

**CategoryFilters Requirements:**
- **Top filter bar** (sticky on mobile): Location dropdown + Price range + 1 key category field
  - Car example: Brand dropdown
  - Property example: Min bedrooms
- **Full filters** (bottom sheet on mobile, sidebar on desktop): All category fields
- **Faceted counts:** Show how many listings match each filter option
- **Smart chips:** Show active filters as removable chips
- Load listings from store and filter client-side OR API (via Sprint A endpoint)

**CategoryPage Enhancement:**
```jsx
// src/pages/CategoryPage.jsx
const { categoryId } = useParams();
const [filters, setFilters] = useState({});
const listings = useListingStore((s) => 
  s.listings.filter(l => l.categoryId === categoryId && matchFilters(l, filters))
);

return (
  <div>
    <CategoryHero categoryId={categoryId} />
    <CategoryFilters 
      categoryId={categoryId} 
      onFilterChange={setFilters}
    />
    <ListingGrid listings={listings} />
  </div>
);
```

**Testing:**
- Visit `/category/cars` → Hero shows, filter works, listings appear ✅
- Change filters → Listings update ✅
- Mobile: Filters in bottom sheet ✅

---

### Task 1.5: Refine existing mobile bottom navigation (4 days)

**Objective:** Improve the current mobile bottom nav and FAB experience

**Files to Enhance:**
1. `src/components/layout/Navbar.jsx` — refine the existing bottom nav block
2. `src/store/useUIStore.js` — ensure bottom nav visibility is managed cleanly

**Requirements:**
- 5 items: Home, Categories, Post (FAB center), Messages, Profile
- FAB should remain prominent and always go to `/post` or open PostAdWizard
- Active state should clearly highlight the current route
- Desktop: bottom nav remains hidden on `lg` and above
- Mobile: always visible, with safe-area padding and high z-index

**Styling:**
- Height: 80px (5 items + spacing)
- Background: white with shadow
- Icons: Use existing icon library or simple Heroicons
- Colors: Icon is gray, active page icon is primary color

**Integration:**
```jsx
// In src/components/layout/Layout.jsx
<Layout>
  <Routes>
    {/* ... all routes ... */}
  </Routes>
  <BottomNav />  {/* Add here */}
</Layout>
```

**Testing:**
- Mobile (390px): Bottom nav visible ✅
- Desktop (1024px): Bottom nav hidden ✅
- Click each nav item → Page updates, nav highlight updates ✅
- Click FAB → Redirects to /post ✅

---

### Task 1.6: Add Phase 1 Translation Keys (4 days ongoing)

**File to Modify:** `src/lib/translations.js`

**Keys to Add:** (Start from key #10, Sprint A used keys 1-9)

```js
// Category form labels
"form.required": "Required",
"form.optional": "Optional",
"form.essentialInfo": "Essential information",
"form.moreDetails": "More details",

// Category names & fields
"category.cars": "Cars & Vehicles",
"category.property_rent": "Rentals",
"category.property_sale": "Property for Sale",
"category.phones": "Phones & Tablets",
"category.jobs": "Jobs",

// Car fields
"field.make": "Brand",
"field.model": "Model",
"field.year": "Year",
"field.mileage": "Mileage (km)",
"field.transmission": "Transmission",

// Property fields
"field.bedrooms": "Bedrooms",
"field.bathrooms": "Bathrooms",
"field.squareMeter": "Square meter",

// Search & filters
"filter.byCategory": "By category",
"filter.byLocation": "By location",
"filter.byPrice": "By price",
"filter.apply": "Apply filters",
"filter.reset": "Reset filters",

// Safety tips
"safety.meetInPublic": "Meet in a public place",
"safety.inspectBefore": "Inspect before payment",
"safety.trustInstinct": "Trust your instinct",

// Bottom nav
"nav.home": "Home",
"nav.search": "Search",
"nav.post": "Post",
"nav.saved": "Saved",
"nav.account": "Account",

// Buttons & actions
"button.postListing": "Post listing",
"button.nextStep": "Next step",
"button.previous": "Previous",
```

**CRITICAL:** Always add to BOTH `en` and `km` objects simultaneously.  
**Example:**
```js
export const translations = {
  en: {
    // ...existing...
    "category.cars": "Cars & Vehicles",
    "form.required": "Required",
    // ...new Phase 1 keys...
  },
  km: {
    // ...existing...
    "category.cars": "ឡើងក្រោយ និងរថយន្ត",
    "form.required": "ត្រូវការ",
    // ...new Phase 1 keys in Khmer...
  },
};
```

**Testing:**
```bash
npm run lint  # No errors about missing translation keys
npm run build  # No build errors
```

---

## Phase 1 Completion Gate (Day 44)

Run these commands to verify Phase 1 is complete:

```bash
# Check 1: All new files exist
test -f src/lib/categoryForms.js && echo "✅ categoryForms.js"
test -f src/components/posting/CategoryForm.jsx && echo "✅ CategoryForm.jsx"
test -f src/components/posting/FormField.jsx && echo "✅ FormField.jsx"
test -f src/components/category/CategoryHero.jsx && echo "✅ CategoryHero.jsx"
test -f src/components/category/CategoryFilters.jsx && echo "✅ CategoryFilters.jsx"
test -f src/components/layout/BottomNav.jsx && echo "✅ BottomNav.jsx"

# Check 2: PostAdWizard was refactored
grep -c "CategoryForm\|getFormSchema" src/components/posting/PostAdWizard.jsx
# Expected: >= 2

# Check 3: Bottom nav integrated
grep -c "<BottomNav" src/components/layout/Layout.jsx || echo "Check Layout.jsx manually"

# Check 4: Build passes
npm run lint && npm run build

# Check 5: Can post in each category
# Manual test: Post a car, property, phone listing end-to-end ✅
```

**Phase 1 SUCCESS CRITERIA:**
- ✅ `categoryForms.js` defined with all 5 categories
- ✅ Category-specific forms work (make/model for cars, bedrooms for property, etc.)
- ✅ PostAdWizard v2 uses schema-driven forms
- ✅ Category landing pages show hero + filters
- ✅ Bottom navigation visible on mobile, hidden on desktop
- ✅ All Phase 1 translation keys added (25+ keys)
- ✅ `npm run lint && npm run build` passes
- ✅ No conflicts with Sprint A files
- ✅ Can post a listing from start to finish in < 2 minutes

**Outcome:** Commit all changes to `feature/phase-1-*` branch, create PR, merge to main.

---

## PHASE 2: Search + Ratings + Seller Dashboard (Days 45–89)

### Task 2.1: Advanced Faceted Search (10 days)

**File to Enhance:** `src/pages/SearchPage.jsx`

**Objective:** Make search filters category-aware using CATEGORY_FORMS schema

**Changes:**
- Load category schema from URL param (e.g., `?category=cars`)
- Render dynamic filters based on category schema
- Show faceted counts (e.g., "Automatic (234) / Manual (156)")
- Filter-to-URL sync (changing filters updates URL params)
- Load listings from store and filter client-side OR call Sprint A backend endpoint

**Example:** Search for cars
- Top bar: Brand dropdown + Price range slider
- Sidebar/bottom sheet: Transmission, Fuel type, Color, Year range, etc.
- Each filter option shows count: "Automatic (234)"
- Active filters show as chips at top

**Testing:**
- Search cars with filters → Listings match ✅
- Change filter → URL updates + listings update ✅
- Mobile bottom sheet filters work ✅

---

### Task 2.2: Complete saved search UX using the existing store state (9 days)

**Objective:** Polish saved search behavior and surface the existing saved search feature clearly

**Files to Enhance:**
1. `src/store/useListingStore.js` — use existing `savedSearches` state and save/delete actions
2. `src/components/search/SaveSearchModal.jsx` — create or improve the modal for saving searches
3. `src/components/dashboard/SavedSearchesTab.jsx` — improve the saved-searches dashboard experience
4. `src/pages/SearchPage.jsx` — ensure save-search action is visible and works from search

**Requirements:**
- Save a search with a name and optional notification preference
- Persist saved searches in localStorage via existing store methods
- Allow users to browse and apply saved searches from dashboard
- Enable edit/delete actions and clear filter navigation

**SaveSearchModal Requirements:**
- Shows when user clicks "Save search" button on SearchPage
- Input: Name this search (e.g., "Budget cars under $5000")
- Checkboxes: Notify me by email, Notify me by SMS
- Button: Save
- After save: Navigate to SavedSearchesPage

**SavedSearchesPage:**
- List all saved searches with edit/delete buttons
- Click search → Go back to SearchPage with filters applied
- Edit → Update name or notification settings

**Testing:**
- Save a search on SearchPage ✅
- View saved searches on SavedSearchesPage ✅
- Click saved search → SearchPage loads with filters ✅
- Edit notification settings ✅

---

### Task 2.3: Improve the existing seller ratings and review UX (10 days)

**Files to Enhance:**
1. `src/store/useStorefrontStore.js` — improve storefront review/posting state and persistence
2. `src/components/storefront/ReviewModal.jsx` — enhance the existing review submission modal
3. `src/pages/StorefrontPage.jsx` — strengthen rating display, badges, and review UX
4. `src/components/listing/ListingCard.jsx` and `src/components/listing/ListingDetail.jsx` — improve rating visibility

**Objective:** Make seller review and rating flows more complete and Khmer24-competitive

**Requirements:**
- Ensure users can submit reviews from storefront or listing flows
- Show average seller rating, total review count, and review breakdown clearly
- Add trust badges like Top Rated, Quick Responder, and Verified Seller based on existing data
- Improve the review list display and seller reputation section

**Store State:**
```js
export const useRatingStore = create((set) => ({
  ratings: [],  // Array of { id, listingId, sellerId, buyerId, stars (1-5), reviewText, tags, createdAt }
  
  addRating: (rating) => { /* ... */ },
  getRatingsForSeller: (sellerId) => { /* ... */ },
  deleteRating: (id) => { /* ... */ },
  loadRatings: () => { /* from localStorage bayonhub:ratings */ },
}));
```

**ReviewForm Modal:**
- Shows on ListingPage after successful purchase (or "Rate seller" link on MyLeads)
- Inputs:
  - Star rating (1–5)
  - Review text (optional, max 500 chars)
  - Tags: "Quick responder", "Honest", "Great condition", "Rude", "Scam"
- Submit button: Post review

**SellerRating Component:**
- Display on StorefrontPage (seller profile)
- Show: Average star rating, total reviews count, breakdown (5★ 60%, 4★ 30%, etc.)
- Show top 5 recent reviews with text + tags
- "View all reviews" link → RatingsPage

**Seller Badges (on StorefrontPage):**
- 🏅 Top Rated (avg rating >= 4.5, >= 10 reviews)
- ⚡ Quick Responder (avg response time < 2 hours)
- ✅ Trusted Seller (>= 50 sales, no disputes)

**Testing:**
- Submit review → Rating appears on seller profile ✅
- View seller page → Average rating + reviews displayed ✅
- View all reviews → Full list with pagination ✅

---

### Task 2.4: Seller Dashboard (9 days)

**File to Enhance:** `src/pages/DashboardPage.jsx`

**Objective:** Give sellers overview of their listings, leads, performance

**New Tabs:**
1. **Active Listings** — Table of my listings (title, status, views, leads, actions)
2. **Leads** — Table of buyer inquiries (buyer, listing, date, status, action buttons)
3. **Analytics** — Stats (total listings, total views this month, avg response time, rating)
4. **Settings** — Seller info (name, avatar, description, response time preference)

**Active Listings Tab:**
- Columns: Listing photo (thumbnail), Title, Status (Active/Sold), Views, Leads, Actions (Edit/Mark Sold/Relist)
- Status badge: Green for Active, Gray for Sold
- Click row → ListingPage
- "Mark as sold" → Move to Sold tab

**Leads Tab:**
- Columns: Buyer avatar + name, Listing title, Lead type (Call/WhatsApp/Chat), Date, Status (New/Responded/Closed)
- Click "Respond" → WhatsApp/call or chat modal
- Filter: All / New / Responded / Closed

**Analytics Tab:**
- Cards: Total listings posted, Total views (this month), Total leads (this month), Avg response time
- Chart: Views over time (last 30 days)
- Chart: Leads by category (pie chart)

**Testing:**
- DashboardPage loads ✅
- "My listings" tab shows my active listings ✅
- Click "Mark sold" → Listing moves to Sold section ✅
- "Leads" tab shows inquiries from buyers ✅
- "Analytics" shows stats ✅

---

### Task 2.5: Buyer Favorites (4 days)

**File to Enhance:** `src/pages/SavedPage.jsx`

**Objective:** Let buyers create multiple wishlists (e.g., "Budget cars", "Dream house")

**New Feature:**
- Rename "Saved" to "Favorites"
- Show all wishlists + quick-access counts
- Drag-drop listings between wishlists
- Share wishlist via link (public or private)

**Example:**
- Wishlist 1: "Budget cars under $5000" (5 items)
- Wishlist 2: "Dream properties" (3 items)
- Wishlist 3: "Phones to check out" (8 items)

**Testing:**
- Create wishlist ✅
- Add listing to wishlist ✅
- View wishlist ✅

---

### Task 2.6: Phase 2 Translation Keys (3 days ongoing)

**File to Modify:** `src/lib/translations.js`

**Add ~15 new keys:**
- "search.advancedFilters": "Advanced filters"
- "search.savedSearches": "Saved searches"
- "rating.addReview": "Add review"
- "rating.stars": "Stars"
- "dashboard.activeListings": "Active listings"
- "dashboard.leads": "Leads"
- "dashboard.analytics": "Analytics"
- etc.

**Remember:** Add to BOTH en and km.

---

## Phase 2 Completion Gate (Day 89)

```bash
# Check 1: All new Phase 2 files exist
test -f src/store/useSavedSearchStore.js && echo "✅ saved searches store"
test -f src/store/useRatingStore.js && echo "✅ ratings store"
test -f src/components/rating/ReviewForm.jsx && echo "✅ ReviewForm"
test -f src/components/seller/SellerRating.jsx && echo "✅ SellerRating"

# Check 2: SearchPage was enhanced
grep -c "CategoryFilters\|getFormSchema" src/pages/SearchPage.jsx
# Expected: >= 1

# Check 3: Build passes
npm run lint && npm run build

# Check 4: Manual testing
# Post car → Search by category → Faceted filters work ✅
# Save a search ✅
# Submit review ✅
# View seller dashboard ✅
```

---

## PHASE 3: Polish + Performance + Offline (Days 90–145)

### Task 3.1: UX Polish (9 days)

**Objective:** Consistent spacing, typography, button styles, empty states

**Changes:**
- Audit all components for consistent spacing (use Tailwind gap, p, m utilities)
- Consistent button styles (sm, md, lg sizes)
- Consistent form field styles
- Empty state illustrations (no listings, no favorites, no saved searches)
- Loading skeletons for all list pages
- Micro-interactions (button hover feedback, toast notifications)

---

### Task 3.2: Image Optimization (7 days)

**Objective:** Fast image loading, responsive sizes, lazy loading

**Changes:**
- All listing images use `loading="lazy"`
- All images use `srcSet` with responsive sizes
- Implement image compression on upload (already in code, ensure used)
- Add low-quality placeholder (LQIP) for images while loading
- Test on slow 4G network (throttle in DevTools)

---

### Task 3.3: PWA Offline Support (7 days)

**Objective:** App works fully offline

**Changes:**
- Cache all listing data on first load
- Cache all category schemas
- Search works offline (search cached listings)
- View saved listings offline
- Disable post/edit when offline (or queue for sync)
- Show offline banner at bottom of screen
- Test: Turn off internet → App still works

---

### Task 3.4: Khmer-First UX (10 days)

**Objective:** All error states, validation, empty states in idiomatic Khmer

**Changes:**
- Audit all error messages (form validation, API errors, network errors)
- Audit all empty states ("No listings found", "No favorites yet")
- Audit all success messages ("Listing posted!", "Review submitted!")
- Add Khmer numerals option (0-9 → ០-៩) for full KM mode
- Phone number display with Khmer formatting
- Date formatting respects locale (KM uses different date format)
- Test on Khmer-language device

---

### Task 3.5: Analytics & Event Tracking (6 days)

**File to Create:** `src/lib/analytics.js`

**Objective:** Track user behavior (opt-in, no PII)

**Events to track:**
- Page views
- Search queries
- Listing views (already implemented)
- Lead submissions (call/WhatsApp/chat)
- Reviews submitted
- Listings posted
- Saved searches created

**Implementation:** Simple event logger that stores in localStorage, ready for GA4 integration later.

---

### Task 3.6: Performance Audit (7 days)

**Objective:** Lighthouse score > 80 (desktop), > 75 (mobile)

**Changes:**
- Run `npm run build` and check bundle sizes
- Verify Three.js in separate chunk (vendor-three)
- Verify no chunk > 500 KB
- Lazy-load all page components (verify React.lazy used)
- Optimize CSS: remove unused Tailwind utilities (PurgeCSS)
- Minify all images
- Test on Lighthouse (DevTools Audit tab)
- Fix any issues until score > 80

---

### Task 3.7: Accessibility (5 days)

**Objective:** WCAG 2.1 AA compliance

**Changes:**
- Add `aria-labels` to all buttons/icons
- Ensure color contrast >= 4.5:1
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader testing (VoiceOver on macOS)
- Form field labels properly associated (via `htmlFor`)
- Semantic HTML (use `<button>`, not `<div onclick>`)

---

### Task 3.8: Final QA (4 days)

**Objective:** End-to-end smoke test

**Manual tests:**
- Post a car listing start-to-finish ✅
- Search and filter by category ✅
- Save a listing ✅
- Leave a review ✅
- View seller dashboard ✅
- Mobile layout on 390px ✅
- Offline mode (turn off internet) ✅
- Lighthouse score ✅

**Automated tests:**
- Run Playwright E2E tests (if any)
- Run ESLint and TypeScript (if any)
- No console errors on main flows

---

## Phase 3 Completion Gate (Day 145)

```bash
# Check 1: Build passes
npm run lint && npm run build

# Check 2: Lighthouse score
npm run lighthouse  # Or run manual audit in DevTools

# Check 3: Manual QA checklist all pass
# (See list above)

# Check 4: No critical bugs in console
# Open DevTools → Console → No red errors
```

---

## SUCCESS CRITERIA: End of Phase 3

- ✅ 100+ days of implementation complete
- ✅ Phases 1, 2, 3 all merged to main
- ✅ No conflicts with Sprint A code
- ✅ All translation keys added (50+ total)
- ✅ Build passes: `npm run lint && npm run build`
- ✅ Lighthouse score > 80 desktop / > 75 mobile
- ✅ App works fully offline
- ✅ All Khmer UX polished
- ✅ Post wizard 5-step flow working
- ✅ Search with faceted filters working
- ✅ Seller dashboard + ratings working
- ✅ No technical debt accumulated
- ✅ Ready for production deployment

---

## Key Commands (Use Frequently)

```bash
# Check for lint errors
npm run lint

# Build production bundle
npm run build

# Check build size
npm run build -- --analyze  # if analyzer installed

# Run Playwright tests
npm run test:e2e

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json && npm install

# Check TypeScript errors (if .ts files)
npx tsc --noEmit
```

---

## If Blocked

**Problem:** "useListingStore doesn't have the action I expected"  
**Solution:** Check `src/store/useListingStore.js` to see what Sprint A actually added. Adapt to use what's available.

**Problem:** "Build fails with error"  
**Solution:** Run `npm run lint` to see detailed errors. Fix or ask for help.

**Problem:** "Phase 2 depends on Phase 1 completion"  
**Solution:** This is expected. Finish all Phase 1 tasks before starting Phase 2.

---

## Do NOT Do

- ❌ Modify backend files
- ❌ Rename any Zustand action
- ❌ Delete any existing component
- ❌ Use inline styles (only Tailwind)
- ❌ Hardcode English text (always use `t()`)
- ❌ Leave console.log() statements in production code
- ❌ Create merge conflicts with Sprint A

---

## Ready?

1. ✅ Read this entire prompt
2. ✅ Run readiness check (above)
3. ✅ Start Phase 1 Task 1.1 (categoryForms.js)
4. ✅ Follow task sequence
5. ✅ Run `npm run lint && npm run build` after each task
6. ✅ Commit and push regularly

**GO!**

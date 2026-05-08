# BayonHub: Two Independent Agent Workstreams

## 🚀 Quick Overview

| Aspect | Agent 1 (Sprint A) | Agent 2 (Phases 1–3) |
|--------|-------------------|----------------------|
| **Duration** | Days 1–7 | Days 8–100+ (can start day 8) |
| **Dependency** | None | Depends on Sprint A completion |
| **Backend** | ✅ Own all backend | ❌ Frontend only |
| **Files modified** | ~10 files | ~30 files |
| **Branch strategy** | sprint-a → main | feature/phase-1-* → main |
| **Conflict risk** | ✅ Zero (different files) | ✅ Zero (different files) |
| **Can work in parallel?** | Yes (Agent 1 starts day 1) | Yes (Agent 1 must finish first) |

---

## Agent 1: Sprint A Workstream (Days 1–7)

### What Agent 1 Builds
- Backend listing CRUD (POST, PATCH, DELETE, GET)
- Basic listing UI (SOLD badge, MyAdsTab, ownership guard)
- View counter
- Upload progress + auto-navigate in PostAdWizard
- 9 translation keys

### Agent 1 Files (ONLY these)
```
bayonhub-api/
├── src/modules/listings/service.ts (+3 functions)
├── src/modules/listings/router.ts (+3 routes)
└── src/modules/listings/controller.ts (+3 handlers)

bayonhub-app/
├── src/api/listings.js (+3 functions)
├── src/store/useListingStore.js (+4 actions, +2 state fields)
├── src/pages/ListingPage.jsx (clearCurrentListing, incrementView)
├── src/components/listing/ListingDetail.jsx (SOLD badge, avatar)
├── src/components/dashboard/MyAdsTab.jsx (fetchMyListings, markAsSold)
├── src/pages/EditListingPage.jsx (ownership guard)
├── src/components/posting/PostAdWizard.jsx (progress, navigate)
└── src/lib/translations.js (9 keys only)
```

### Agent 1 Deliverable
- ✅ Merged to main branch
- ✅ All 11 checks pass (see EXECUTION_PLAN.md Phase 10)
- ✅ PostAdWizard v0.1 working (photos + submit)
- ✅ Build succeeds: `npm run lint && npm run build`

### Agent 1 Timeline
- Day 1–2: Backend endpoints + controllers
- Day 3–4: Frontend API functions + store actions
- Day 5–6: ListingPage, ListingDetail, MyAdsTab, EditListingPage
- Day 7: PostAdWizard, translations, testing

---

## Agent 2: Phases 1–3 Workstream (Days 8–100+)

### What Agent 2 Builds

#### Phase 1 (Days 8–44): Post Wizard + Categories
- Category form schemas (all 5 top categories)
- CategoryForm component (dynamic, category-aware)
- PostAdWizard v2 (refactored to use schemas)
- Category landing pages (hero, filters, subcategories)
- Bottom navigation with FAB
- ~25 translation keys

#### Phase 2 (Days 45–89): Search + Ratings + Dashboard
- Advanced faceted search with category-specific filters
- Saved searches + notification placeholders
- Seller ratings & reviews system
- Seller dashboard (leads, analytics)
- Buyer favorites & watchlist
- ~15 translation keys

#### Phase 3 (Days 90–145): Polish + Performance
- UX polish & consistency (spacing, typography, buttons)
- Image optimization & lazy loading
- PWA offline caching strategy
- Khmer-first UX & microcopy (error states, empty states)
- Analytics & event tracking
- Accessibility & performance audit (Lighthouse > 80)
- ~10 final translation keys

### Agent 2 Files (ONLY these)
```
bayonhub-app/src/

Phase 1:
├── lib/categoryForms.js (NEW — schema system)
├── components/posting/CategoryForm.jsx (NEW)
├── components/posting/FormField.jsx (NEW)
├── components/category/CategoryHero.jsx (NEW)
├── components/category/CategoryFilters.jsx (NEW)
├── components/layout/BottomNav.jsx (NEW)
└── pages/CategoryPage.jsx (ENHANCE)

Phase 2:
├── store/useSavedSearchStore.js (NEW)
├── store/useRatingStore.js (NEW)
├── components/search/SearchFilters.jsx (NEW)
├── components/search/SaveSearchModal.jsx (NEW)
├── components/rating/ReviewForm.jsx (NEW)
├── components/seller/SellerRating.jsx (NEW)
├── pages/SavedSearchesPage.jsx (NEW)
└── pages/SearchPage.jsx (ENHANCE)

Phase 3:
├── lib/analytics.js (NEW)
└── (many component updates for polish, images, offline)
```

### Agent 2 Deliverables

**Phase 1 (Day 44):**
- ✅ categoryForms.js with all 5 categories defined
- ✅ CategoryForm component renders category-specific fields
- ✅ PostAdWizard v2 uses schemas
- ✅ Category landing pages have hero + filters
- ✅ Bottom navigation visible and working
- ✅ Build passes: `npm run lint && npm run build`
- ✅ Can post a car listing in < 2 minutes

**Phase 2 (Day 89):**
- ✅ Search filters work for all 5 categories
- ✅ Saved searches persist and load
- ✅ Seller ratings display on profiles
- ✅ Seller dashboard shows leads and analytics
- ✅ Build passes

**Phase 3 (Day 145):**
- ✅ Lighthouse score > 80 (desktop), > 75 (mobile)
- ✅ App works fully offline
- ✅ All error states in Khmer-first
- ✅ No console errors or warnings
- ✅ Build passes

### Agent 2 Timeline
- Days 8–44: Phase 1 (category schemas, forms, post wizard, bottom nav)
- Days 45–89: Phase 2 (search, ratings, dashboard)
- Days 90–145: Phase 3 (polish, performance, offline, analytics)

---

## Handoff Points

### Handoff 1: Sprint A → Phase 1 (Day 7–8)

**Agent 1 completes Sprint A:**
```bash
git add .
git commit -m "feat(sprint-a): sold badge, fetchMyListings, markAsSold, view counter"
git push origin sprint-a
# Create PR to main
```

**Agent 2 verifies readiness:**
```bash
git checkout main
git pull
grep -c "myListings\|clearCurrentListing" src/store/useListingStore.js  # >= 2
grep -c "incrementListingView\|fetchMyListings" src/api/listings.js     # >= 2
npm run build                                                             # passes
npm run lint                                                              # passes
```

**If all checks pass:** Agent 2 starts Phase 1  
**If any check fails:** Agent 1 fixes before Phase 1 begins

---

### Handoff 2: Phase 1 → Phase 2 (Day 44–45)

**Agent 2 completes Phase 1:**
```bash
git checkout -b feature/phase-1-categories-and-wizard
# ... implement Tasks 1.1–1.6 ...
git commit -m "feat(phase-1): category schemas, CategoryForm, PostAdWizard v2, bottom nav"
git push origin feature/phase-1-categories-and-wizard
# Create PR to main, merge after review
```

**Phase 2 can start immediately** (no external dependency)

---

### Handoff 3: Phase 2 → Phase 3 (Day 89–90)

**Agent 2 completes Phase 2:**
```bash
git checkout -b feature/phase-2-search-ratings-dashboard
# ... implement Tasks 2.1–2.6 ...
git commit -m "feat(phase-2): search filters, ratings, dashboard"
git push origin feature/phase-2-search-ratings-dashboard
# Merge to main
```

**Phase 3 can start immediately** (no external dependency)

---

## Potential Issues & Resolutions

### Issue 1: Agent 1 (Sprint A) finds a bug in existing code
**Resolution:** Document it but DON'T fix it. Add to Phase 3 bug list for Agent 2 to fix during accessibility sweep.  
**Why:** Minimize scope creep; keep Sprint A focused.

### Issue 2: Agent 2 (Phase 1) discovers Sprint A implementation is incomplete
**Resolution:** Notify Agent 1 immediately. Phase 1 is BLOCKED until Sprint A finishes that component.  
**Example:** "PostAdWizard photo upload isn't working" → Agent 1 fixes before Phase 1 continues.

### Issue 3: Both agents need to modify `src/lib/translations.js`
**Resolution:** No conflict if each agent adds DIFFERENT keys:
- Sprint A adds: `post.uploading`, `myAds.deleted`, `listing.sold`, etc. (9 keys)
- Phase 1 adds: `category.cars`, `form.required`, `filter.byCategory`, etc. (25 keys)
- No overlapping key names → Git merge succeeds automatically

### Issue 4: Build fails mid-Phase 2
**Resolution:** Check `npm run lint` output. If error is in Agent 1's code, notify Agent 1 to fix. If error is in Agent 2's code, Agent 2 fixes it.

---

## File Modification Checklist

### Files Agent 1 MUST modify:
- [ ] `bayonhub-api/src/modules/listings/service.ts` ← Add 3 functions
- [ ] `bayonhub-api/src/modules/listings/router.ts` ← Add 3 routes
- [ ] `bayonhub-api/src/modules/listings/controller.ts` ← Add 3 handlers
- [ ] `src/api/listings.js` ← Add 3 API functions
- [ ] `src/store/useListingStore.js` ← Add 4 actions + 2 state fields
- [ ] `src/pages/ListingPage.jsx` ← Add clearCurrentListing + incrementView
- [ ] `src/components/listing/ListingDetail.jsx` ← Add SOLD badge + avatar
- [ ] `src/components/dashboard/MyAdsTab.jsx` ← Add fetchMyListings + markAsSold
- [ ] `src/pages/EditListingPage.jsx` ← Add ownership guard
- [ ] `src/components/posting/PostAdWizard.jsx` ← Add upload progress + auto-navigate
- [ ] `src/lib/translations.js` ← Add 9 keys ONLY

### Files Agent 1 MUST NOT modify:
- ❌ `src/lib/categoryForms.js` (will be created by Agent 2)
- ❌ `src/components/posting/CategoryForm.jsx` (will be created by Agent 2)
- ❌ `src/components/layout/BottomNav.jsx` (will be created by Agent 2)
- ❌ `src/pages/SearchPage.jsx` (Agent 2 enhances it)
- ❌ `src/pages/DashboardPage.jsx` (Agent 2 enhances it)
- ❌ Any Phase 2+ files

### Files Agent 2 MUST create:
- [ ] `src/lib/categoryForms.js` ← NEW (Phase 1)
- [ ] `src/components/posting/CategoryForm.jsx` ← NEW (Phase 1)
- [ ] `src/components/posting/FormField.jsx` ← NEW (Phase 1)
- [ ] `src/components/category/CategoryHero.jsx` ← NEW (Phase 1)
- [ ] `src/components/category/CategoryFilters.jsx` ← NEW (Phase 1)
- [ ] `src/components/layout/BottomNav.jsx` ← NEW (Phase 1)
- [ ] `src/store/useSavedSearchStore.js` ← NEW (Phase 2)
- [ ] `src/store/useRatingStore.js` ← NEW (Phase 2)
- [ ] `src/lib/analytics.js` ← NEW (Phase 3)
- [ ] And more in Phase 2–3

### Files Agent 2 MUST NOT modify:
- ❌ Backend files (`bayonhub-api/src/modules/`)
- ❌ Sprint A files (listed above under "Agent 1 Files")
- ❌ `src/api/client.js` (core Axios setup)
- ❌ `src/store/useAuthStore.js` (core auth)
- ❌ `src/App.jsx` (routing — only ADD new routes, never RENAME existing)

---

## Success Criteria: Zero Conflict Execution

**Agent 1 succeeds if:**
- ✅ All 11 checks pass (Phase 10 in EXECUTION_PLAN.md)
- ✅ Code merged to main without conflicts
- ✅ Build passes: `npm run lint && npm run build`
- ✅ Agent 2 can pull main and immediately start Phase 1

**Agent 2 succeeds if:**
- ✅ Phase 1 tasks complete with no wait for Agent 1
- ✅ Phase 2 tasks complete with no wait on Phase 1
- ✅ Phase 3 polish brings app to production quality
- ✅ Each phase build passes and integrates cleanly

**Both succeed if:**
- ✅ No merge conflicts between their work
- ✅ No circular dependencies
- ✅ Code is isolated and composable
- ✅ Final app works end-to-end

---

## Communication Template

### Daily Check-in (Agents)
```
Agent 1 (Sprint A):
- ✅ Completed: service functions
- 🔄 In progress: router + controller
- 🚫 Blocked: (none)

Agent 2 (Phase 1):
- ✅ Status: Waiting for Sprint A to merge
- 🔄 Prep: Reviewing EXECUTION_PLAN.md
- 🚫 Blocked: On Sprint A (dependency)
```

### Handoff Confirmation
```
Agent 1 → Agent 2:
✅ Sprint A complete and merged to main
✅ All 11 checks pass
✅ Build succeeds
📝 Known limitations: (if any)
→ Phase 1 ready to start
```

### Issue Escalation
```
Agent 2 → Agent 1:
🚨 Phase 1 blocked: MyAdsTab.fetchMyListings not working
📝 Error: "fetchMyListings is not a function"
🔗 File: src/store/useListingStore.js
→ Please fix in Sprint A before Phase 1 continues
```

---

## Final Notes

✅ **Both agents work independently from day 1**  
✅ **Zero file conflicts if rules are followed**  
✅ **Clear handoff points and verification checks**  
✅ **If either agent completes early, they can start prep for next phase**

**Recommended:** Assign both agents on Day 1. Agent 2 can read documentation and design schemas while waiting for Sprint A to merge.

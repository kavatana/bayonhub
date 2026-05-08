import { create } from "zustand"
import {
  createListing as createListingApi,
  createLead as createLeadApi,
  deleteListing as deleteListingApi,
  getListingById,
  getListings,
  reportListing as reportListingApi,
  saveListing as saveListingApi,
  unsaveListing as unsaveListingApi,
  updateListing as updateListingApi,
  markListingAsSold as apiMarkSold,
  fetchMyListings as apiFetchMyListings,
  incrementListingView as apiIncrementView,
  searchListings as searchListingsApi,
  fetchLocations as fetchLocationsApi,
  fetchSimilarListings as fetchSimilarListingsApi,
  saveDraft as saveDraftApi,
  publishDraft as publishDraftApi,
  fetchHomepage as fetchHomepageApi,
  bumpListing as bumpListingApi,
} from "../api/listings"
import { API_BASE_URL, STORAGE_KEYS } from "../api/client"
import { storage, asyncStorage } from "../lib/storage"
import { buildLeadPayload } from "../lib/validation"

const defaultFilters = {
  q: "",
  category: "",
  subcategory: "",
  location: "",
  minPrice: "",
  maxPrice: "",
  condition: "",
  sort: "newest",
}

const RECENTLY_VIEWED_KEY = "bayonhub:recentlyViewed"
const SAVED_SEARCHES_KEY = "bayonhub:savedSearches"
const FAVORITES_KEY = "bayonhub:favorites"
const WATCHLIST_KEY = "bayonhub:watchlist"
const LISTING_LIMIT = 24
let sessionRecentlyViewed = []

function normalizeListingsResponse(result) {
  const listings = Array.isArray(result) ? result : result.listings || result.data || []
  const total = Number(result.total ?? result.pagination?.total ?? listings.length)
  return {
    listings,
    total,
    nextCursor: result.nextCursor ?? result.pagination?.nextCursor ?? null,
  }
}

export const useListingStore = create((set, get) => ({
  listings: [],
  currentListing: null,
  filters: { ...defaultFilters },
  limit: LISTING_LIMIT,
  total: 0,
  nextCursor: null,
  hasMore: true,
  isFetchingMore: false,
  loading: false,
  error: null,
  currentListingLoading: false,
  similarListings: [],
  searchResults: [],
  searchTotal: 0,
  searchPage: 1,
  searchTotalPages: 1,
  searchLoading: false,
  lastSearchParams: {},
  locations: [],
  savedIds: [], // Will be loaded in initialize()
  savedSnapshots: {},
  recentlyViewed: [],
  savedSearches: [],
  favorites: [],
  watchlist: [],
  myListings: [],
  myListingsLoading: false,
  draftListing: null,
  featuredListings: [],
  recentListings: [],
  trendingCategories: [],
  newTodayCount: 0,
  homepageLoading: false,

  initialize: async () => {
    const savedIds = await asyncStorage.get(STORAGE_KEYS.saved, [])
    const savedSnapshots = await asyncStorage.get(STORAGE_KEYS.savedSnapshots, {})
    const recentlyViewed = await asyncStorage.get(RECENTLY_VIEWED_KEY, [])
    const savedSearches = await asyncStorage.get(SAVED_SEARCHES_KEY, [])
    const favorites = await asyncStorage.get(FAVORITES_KEY, [])
    const watchlist = await asyncStorage.get(WATCHLIST_KEY, [])
    
    set({ 
      savedIds, 
      savedSnapshots, 
      recentlyViewed, 
      savedSearches,
      favorites,
      watchlist,
    })
  },

  fetchListings: async (filters = {}) => {
    const selectedProvince = storage.get("bayonhub:selectedProvince", "all")
    const provinceFilter = selectedProvince && selectedProvince !== "all" ? { location: selectedProvince } : {}
    const mergedFilters = { ...get().filters, ...provinceFilter, ...filters }
    set({ loading: true, error: null, filters: mergedFilters })
    try {
      if (!API_BASE_URL) {
        const result = await getListings({
          ...mergedFilters,
          page: 1,
          limit: get().limit,
        })
        const { listings, total } = normalizeListingsResponse(result)
        set({
          listings,
          total,
          nextCursor: null,
          hasMore: listings.length < total,
          loading: false,
        })
        return listings
      }

      const result = await getListings({
        ...mergedFilters,
        limit: get().limit,
      })
      const { listings, total, nextCursor } = normalizeListingsResponse(result)
      set({
        listings,
        total,
        nextCursor,
        hasMore: nextCursor !== null,
        loading: false,
      })
      return listings
    } catch (error) {
      set({ error: error.message, loading: false })
      return []
    }
  },

  fetchHomepage: async (province) => {
    set({ homepageLoading: true, error: null })
    try {
      const result = await fetchHomepageApi(province)
      set({
        featuredListings: result.featured || [],
        recentListings: result.recent || [],
        trendingCategories: result.trending || [],
        newTodayCount: Number(result.newToday || 0),
        homepageLoading: false,
      })
      return result
    } catch (error) {
      set({ error: error.message, homepageLoading: false })
      return { featured: [], recent: [], trending: [], newToday: 0 }
    }
  },

  fetchMoreListings: async () => {
    const { filters, hasMore, isFetchingMore, limit, nextCursor } = get()
    if (!hasMore || isFetchingMore) return []
    set({ isFetchingMore: true, error: null })
    try {
      if (!API_BASE_URL) {
        const nextPage = Math.floor(get().listings.length / limit) + 1
        const result = await getListings({
          ...filters,
          page: nextPage,
          limit,
        })
        const { listings: newListings, total } = normalizeListingsResponse(result)
        const listings = [...get().listings, ...newListings]
        set({
          listings,
          total,
          nextCursor: null,
          hasMore: listings.length < total,
          isFetchingMore: false,
        })
        return newListings
      }

      const result = await getListings({
        ...filters,
        cursor: nextCursor,
        limit,
      })
      const { listings: newListings, total, nextCursor: newCursor } = normalizeListingsResponse(result)
      set((state) => ({
        listings: [...state.listings, ...newListings],
        total,
        nextCursor: newCursor,
        hasMore: newCursor !== null,
        isFetchingMore: false,
      }))
      return newListings
    } catch (error) {
      set({ error: error.message, isFetchingMore: false })
      return []
    }
  },

  fetchListingById: async (id) => {
    set({ loading: true, currentListingLoading: true, error: null })
    try {
      const listing = await getListingById(id)
      set({ currentListing: listing, loading: false, currentListingLoading: false })
      return listing
    } catch (error) {
      set({ error: error.message, loading: false, currentListingLoading: false })
      return null
    }
  },

  fetchSimilarListings: async (id) => {
    try {
      const listings = await fetchSimilarListingsApi(id)
      set({ similarListings: listings })
      return listings
    } catch (error) {
      set({ error: error.message, similarListings: [] })
      return []
    }
  },

  searchListings: async (params = {}) => {
    const page = Number(params.page || get().searchPage || 1)
    const limit = Number(params.limit || 20)
    const requestParams = { ...params, page, limit }
    set({ searchLoading: true, error: null, searchPage: page, lastSearchParams: requestParams })
    try {
      const result = await searchListingsApi(requestParams)
      set({
        searchResults: result.data || [],
        searchTotal: Number(result.total || 0),
        searchPage: Number(result.page || page),
        searchTotalPages: Number(result.totalPages || 1),
        searchLoading: false,
      })
      return result
    } catch (error) {
      set({ error: error.message, searchLoading: false })
      return { data: [], total: 0, page, limit, totalPages: 1 }
    }
  },

  fetchLocations: async () => {
    try {
      const locations = await fetchLocationsApi()
      set({ locations })
      return locations
    } catch (error) {
      set({ error: error.message })
      return []
    }
  },

  setSearchPage: async (page) => {
    const nextPage = Math.max(1, Number(page) || 1)
    set({ searchPage: nextPage })
    return get().searchListings({ ...get().lastSearchParams, page: nextPage })
  },

  clearSearchResults: () => set({
    searchResults: [],
    searchTotal: 0,
    searchPage: 1,
    searchTotalPages: 1,
    searchLoading: false,
    lastSearchParams: {},
  }),

  setFilter: async (key, value) => {
    const nextFilters = { ...get().filters, [key]: value }
    set({
      filters: nextFilters,
      nextCursor: null,
      hasMore: true,
    })
    return get().fetchListings(nextFilters)
  },

  resetFilters: async () => {
    set({
      filters: { ...defaultFilters },
      nextCursor: null,
      hasMore: true,
    })
    return get().fetchListings({ ...defaultFilters })
  },

  createListing: async (data) => {
    set({ loading: true, error: null })
    try {
      const listing = await createListingApi(data)
      set({
        listings: [listing, ...get().listings],
        loading: false,
      })
      return listing
    } catch (error) {
      set({ error: error.message, loading: false })
      return null
    }
  },

  updateListing: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const listing = await updateListingApi(id, data)
      const listings = get().listings.map((item) =>
        String(item.id) === String(id) ? { ...item, ...listing } : item,
      )
      set({
        listings,
        currentListing:
          String(get().currentListing?.id) === String(id)
            ? { ...get().currentListing, ...listing }
            : get().currentListing,
        loading: false,
      })
      return listing
    } catch (error) {
      set({ error: error.message, loading: false })
      return null
    }
  },

  deleteListing: async (id) => {
    set({ loading: true, error: null })
    try {
      await deleteListingApi(id)
      set({
        listings: get().listings.filter((item) => String(item.id) !== String(id)),
        currentListing: String(get().currentListing?.id) === String(id) ? null : get().currentListing,
        loading: false,
      })
      return true
    } catch (error) {
      set({ error: error.message, loading: false })
      return false
    }
  },

  reportListing: async (id, reason, detail = "") => {
    try {
      return await reportListingApi(id, reason, detail)
    } catch (error) {
      set({ error: error.message })
      return null
    }
  },

  createLead: (listingId, action, leadType, metadata = {}) => {
    const listing = get().listings.find((item) => String(item.id) === String(listingId)) || get().currentListing
    const leads = storage.get(STORAGE_KEYS.leads, [])
    const leadPayload = typeof action === "object" && action !== null ? action : buildLeadPayload(String(leadType || action || "CHAT").toUpperCase(), metadata)
    const lead = {
      id: crypto.randomUUID(),
      listingId,
      sellerId: listing?.sellerId,
      type: leadType || leadPayload.type || leadPayload.action,
      action: leadPayload.action,
      phone: leadPayload.phone,
      offerPrice: leadPayload.offerPrice,
      message: leadPayload.message,
      metadata,
      source: "react-web",
      createdAt: leadPayload.createdAt || new Date().toISOString(),
      sessionId: leadPayload.sessionId,
    }
    if (API_BASE_URL) {
      createLeadApi(listingId, leadPayload, leadPayload.type, metadata).catch((error) => {
        set({ error: error.message })
      })
    }
    asyncStorage.set(STORAGE_KEYS.leads, [lead, ...leads])
    return lead
  },

  incrementView: async (id, sessionId) => {
    const result = await apiIncrementView(id, sessionId)
    if (!result?.views) return result
    const views = Number(result.views)
    const updateViews = (listing) =>
      String(listing?.id) === String(id) ? { ...listing, views, viewCount: views } : listing
    set((state) => ({
      currentListing: updateViews(state.currentListing),
      listings: state.listings.map(updateViews),
      searchResults: state.searchResults.map(updateViews),
      similarListings: state.similarListings.map(updateViews),
    }))
    return result
  },

  fetchMyListings: async (status) => {
    set({ myListingsLoading: true })
    try {
      const listings = await apiFetchMyListings(status)
      set({ myListings: listings })
      return listings
    } catch (err) {
      set({ error: err?.message || "Failed to load your listings" })
      return []
    } finally {
      set({ myListingsLoading: false })
    }
  },

  markAsSold: async (id) => {
    set({ submitting: true })
    try {
      const updated = await apiMarkSold(id)
      const updateInArray = (arr) => arr.map((l) => (String(l.id) === String(id) ? { ...l, status: "sold" } : l))
      set({
        listings: updateInArray(get().listings),
        myListings: updateInArray(get().myListings),
        currentListing:
          String(get().currentListing?.id) === String(id)
            ? { ...get().currentListing, status: "sold" }
            : get().currentListing,
      })
      return { success: true, listing: updated }
    } catch (err) {
      return { success: false, error: err?.message }
    } finally {
      set({ submitting: false })
    }
  },

  bumpListing: async (id) => {
    set({ submitting: true, error: null })
    try {
      const result = await bumpListingApi(id)
      const listing = result.listing || { id, bumpedAt: result.bumpedAt }
      const updateBump = (item) => (String(item?.id) === String(id) ? { ...item, ...listing, bumpedAt: result.bumpedAt } : item)
      set((state) => ({
        currentListing: updateBump(state.currentListing),
        listings: state.listings.map(updateBump),
        searchResults: state.searchResults.map(updateBump),
        myListings: state.myListings.map(updateBump),
      }))
      return { success: true, ...result }
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    } finally {
      set({ submitting: false })
    }
  },

  saveDraft: async (data) => {
    try {
      const draft = await saveDraftApi(data)
      set({ draftListing: draft })
      return draft
    } catch (error) {
      set({ error: error.message })
      return null
    }
  },

  publishDraft: async (id) => {
    try {
      const listing = await publishDraftApi(id)
      set({
        draftListing: null,
        currentListing: listing,
        listings: [listing, ...get().listings.filter((item) => String(item.id) !== String(id))],
      })
      return listing
    } catch (error) {
      set({ error: error.message })
      return null
    }
  },

  clearCurrentListing: () => set({ currentListing: null, similarListings: [], error: null }),


  toggleSaved: (id, listing) => {
    const exists = get().savedIds.includes(id)
    const savedIds = exists
      ? get().savedIds.filter((savedId) => savedId !== id)
      : [...get().savedIds, id]
    const snapshots = { ...get().savedSnapshots }
    if (exists) {
      delete snapshots[id]
    } else {
      const sourceListing =
        listing || get().listings.find((item) => String(item.id) === String(id)) || get().currentListing
      snapshots[id] = {
        listingId: id,
        savedPrice: Number(sourceListing?.price || 0),
        savedAt: new Date().toISOString(),
      }
    }
    asyncStorage.set(STORAGE_KEYS.saved, savedIds)
    asyncStorage.set(STORAGE_KEYS.savedSnapshots, snapshots)
    set({ savedIds, savedSnapshots: snapshots })
    if (API_BASE_URL) {
      const request = exists ? unsaveListingApi(id) : saveListingApi(id)
      request.catch((error) => {
        set({ error: error.message })
      })
    }
  },

  addRecentlyViewed: (id) => {
    const normalizedId = String(id)
    const recentlyViewed = [
      normalizedId,
      ...get().recentlyViewed.filter((item) => String(item) !== normalizedId),
    ].slice(0, 10)
    storage.set(RECENTLY_VIEWED_KEY, recentlyViewed)
    set({ recentlyViewed })
  },

  addToRecentlyViewed: (listing) => {
    if (!listing?.id) return
    sessionRecentlyViewed = [
      listing,
      ...sessionRecentlyViewed.filter((item) => String(item.id) !== String(listing.id)),
    ].slice(0, 20)
    set({ recentlyViewed: sessionRecentlyViewed })
  },

  clearRecentlyViewed: () => {
    sessionRecentlyViewed = []
    storage.set(RECENTLY_VIEWED_KEY, [])
    set({ recentlyViewed: [] })
  },

  getRecentlyViewedListings: () => {
    const listings = get().listings
    return get().recentlyViewed
      .map((id) => listings.find((listing) => String(listing.id) === String(id)))
      .filter(Boolean)
  },

  saveSearch: (searchObject, filters = {}) => {
    const isObject = typeof searchObject === "object" && searchObject !== null
    const trimmed = isObject ? String(searchObject.name || searchObject.query || "").trim() : String(searchObject || "").trim()
    const search = {
      id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}`,
      name: trimmed,
      query: isObject ? String(searchObject.query || "").trim() : trimmed,
      filters: isObject ? searchObject.filters || {} : filters,
      createdAt: new Date().toISOString(),
      notifyEmail: Boolean(isObject ? searchObject.notifyEmail : false),
      notifySMS: Boolean(isObject ? searchObject.notifySMS : false),
      alertEnabled: Boolean(isObject ? searchObject.alertEnabled : false),
    }
    const savedSearches = [search, ...get().savedSearches]
    storage.set(SAVED_SEARCHES_KEY, savedSearches)
    set({ savedSearches })
    return search
  },

  deleteSavedSearch: (id) => {
    const savedSearches = get().savedSearches.filter((search) => search.id !== id)
    storage.set(SAVED_SEARCHES_KEY, savedSearches)
    set({ savedSearches })
  },

  deleteSearch: (id) => {
    get().deleteSavedSearch(id)
  },

  toggleSearchAlert: (id) => {
    const savedSearches = get().savedSearches.map((search) =>
      search.id === id ? { ...search, alertEnabled: !search.alertEnabled } : search,
    )
    storage.set(SAVED_SEARCHES_KEY, savedSearches)
    set({ savedSearches })
  },

  toggleFavorite: (listingId) => {
    const normalizedId = String(listingId)
    const favorites = get().favorites
    const exists = favorites.some((item) => String(item.listingId || item) === normalizedId)
    const nextFavorites = exists
      ? favorites.filter((item) => String(item.listingId || item) !== normalizedId)
      : [{ listingId: normalizedId, addedAt: new Date().toISOString() }, ...favorites]
    storage.set(FAVORITES_KEY, nextFavorites)
    set({ favorites: nextFavorites })
  },

  toggleWatchlist: (listingId) => {
    const normalizedId = String(listingId)
    const listing = get().listings.find((item) => String(item.id) === normalizedId) || get().currentListing
    const watchlist = get().watchlist
    const exists = watchlist.some((item) => String(item.listingId || item) === normalizedId)
    const nextWatchlist = exists
      ? watchlist.filter((item) => String(item.listingId || item) !== normalizedId)
      : [
          {
            listingId: normalizedId,
            addedAt: new Date().toISOString(),
            watchedPrice: Number(listing?.price || 0),
          },
          ...watchlist,
        ]
    storage.set(WATCHLIST_KEY, nextWatchlist)
    set({ watchlist: nextWatchlist })
  },
}))

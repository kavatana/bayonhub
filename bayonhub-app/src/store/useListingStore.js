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
} from "../api/listings"
import { API_BASE_URL, STORAGE_KEYS } from "../api/client"
import { storage } from "../lib/storage"
import { buildLeadPayload } from "../lib/validation"

const defaultFilters = {
  q: "",
  category: "",
  subcategory: "",
  location: "",
  minPrice: "",
  maxPrice: "",
}

const RECENTLY_VIEWED_KEY = "bayonhub:recentlyViewed"
const SAVED_SEARCHES_KEY = "bayonhub:savedSearches"
const LISTING_LIMIT = 24

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
  savedIds: storage.get(STORAGE_KEYS.saved, []),
  savedSnapshots: storage.get(STORAGE_KEYS.savedSnapshots, {}),
  recentlyViewed: storage.get(RECENTLY_VIEWED_KEY, []),
  savedSearches: storage.get(SAVED_SEARCHES_KEY, []),

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
    set({ loading: true, error: null })
    try {
      const listing = await getListingById(id)
      set({ currentListing: listing, loading: false })
      return listing
    } catch (error) {
      set({ error: error.message, loading: false })
      return null
    }
  },

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
    storage.set(STORAGE_KEYS.leads, [lead, ...leads])
    return lead
  },

  incrementView: (id) => {
    const bumpListing = (listing) => {
      if (String(listing.id) !== String(id)) return listing
      const nextViews = Number(listing.viewCount ?? listing.views ?? 0) + 1
      return { ...listing, viewCount: nextViews, views: nextViews }
    }
    const persistedListings = storage.get(STORAGE_KEYS.listings, [])
    const persistedHasListing = persistedListings.some((listing) => String(listing.id) === String(id))
    if (persistedHasListing) {
      storage.set(STORAGE_KEYS.listings, persistedListings.map(bumpListing))
    }
    const listings = get().listings.map((listing) => {
      const persistedListing = persistedHasListing
        ? persistedListings.map(bumpListing).find((item) => String(item.id) === String(listing.id))
        : null
      return persistedListing || bumpListing(listing)
    })
    if (!persistedHasListing && listings.some((listing) => String(listing.id) === String(id))) {
      storage.set(STORAGE_KEYS.listings, listings)
    }
    const currentListing =
      String(get().currentListing?.id) === String(id)
        ? bumpListing(get().currentListing)
        : get().currentListing
    set({ listings, currentListing })
  },

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
    storage.set(STORAGE_KEYS.saved, savedIds)
    storage.set(STORAGE_KEYS.savedSnapshots, snapshots)
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

  clearRecentlyViewed: () => {
    storage.set(RECENTLY_VIEWED_KEY, [])
    set({ recentlyViewed: [] })
  },

  getRecentlyViewedListings: () => {
    const listings = get().listings
    return get().recentlyViewed
      .map((id) => listings.find((listing) => String(listing.id) === String(id)))
      .filter(Boolean)
  },

  saveSearch: (query, filters = {}) => {
    const trimmed = String(query || "").trim()
    const search = {
      id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}`,
      query: trimmed,
      filters,
      createdAt: new Date().toISOString(),
      alertEnabled: false,
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

  toggleSearchAlert: (id) => {
    const savedSearches = get().savedSearches.map((search) =>
      search.id === id ? { ...search, alertEnabled: !search.alertEnabled } : search,
    )
    storage.set(SAVED_SEARCHES_KEY, savedSearches)
    set({ savedSearches })
  },
}))

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Helmet } from "react-helmet-async"
import { useSearchParams } from "react-router-dom"
import { SearchX, Star } from "lucide-react"
import toast from "react-hot-toast"
import ListingCard from "../components/listing/ListingCard"
import ListingListItem from "../components/listing/ListingListItem"
import SaveSearchModal from "../components/search/SaveSearchModal"
import SearchFilters from "../components/search/SearchFilters"
import Button from "../components/ui/Button"
import PageTransition from "../components/ui/PageTransition"
import SkeletonCard from "../components/ui/SkeletonCard"
import ViewToggle from "../components/ui/ViewToggle"
import { useTranslation } from "../hooks/useTranslation"
import { trackEvent } from "../lib/analytics"
import { getFormSchema } from "../lib/categoryForms"
import { canonicalUrl } from "../lib/seo"
import { useAuthStore } from "../store/useAuthStore"
import { useListingStore } from "../store/useListingStore"
import { useUIStore } from "../store/useUIStore"

const sortOptions = [
  ["newest", "sort.newest"],
  ["price_asc", "sort.priceLow"],
  ["price_desc", "sort.priceHigh"],
  ["most_viewed", "sort.mostViewed"],
]

const schemaRouteMap = {
  cars: "cars",
  vehicles: "cars",
  "phones-tablets": "phones",
  smartphones: "phones",
  phones: "phones",
  jobs: "jobs",
  "house-land": "property_rent",
  rent: "property_rent",
  property_rent: "property_rent",
  sale: "property_sale",
  property_sale: "property_sale",
}

const filterKeys = [
  "category",
  "province",
  "condition",
  "minPrice",
  "maxPrice",
  "fuel",
  "transmission",
  "yearMin",
  "yearMax",
  "bedrooms",
  "furnishing",
  "brand",
  "storage",
  "jobType",
  "experience",
]

function getSchemaId(category) {
  return schemaRouteMap[category] || null
}

function buildSearchParams(params) {
  const values = Object.fromEntries(params.entries())
  return {
    q: values.q || "",
    category: values.category || "",
    location: values.province || "",
    priceMin: values.minPrice || "",
    priceMax: values.maxPrice || "",
    condition: values.condition || "",
    sortBy: values.sort || "newest",
    page: Number(values.page || 1),
    limit: 20,
  }
}

export default function SearchPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState("grid")
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const lastSearchEventRef = useRef("")
  const query = params.get("q") || ""
  const category = params.get("category") || ""
  const sort = params.get("sort") || "newest"
  const filters = useMemo(
    () =>
      filterKeys.reduce(
        (current, key) => ({
          ...current,
          [key]: params.get(key) || "",
        }),
        {},
      ),
    [params],
  )
  const [priceDraft, setPriceDraft] = useState({
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
  })

  const searchResults = useListingStore((state) => state.searchResults)
  const searchTotal = useListingStore((state) => state.searchTotal)
  const searchPage = useListingStore((state) => state.searchPage)
  const searchTotalPages = useListingStore((state) => state.searchTotalPages)
  const searchLoading = useListingStore((state) => state.searchLoading)
  const locations = useListingStore((state) => state.locations)
  const searchListings = useListingStore((state) => state.searchListings)
  const fetchLocations = useListingStore((state) => state.fetchLocations)
  const setSearchPage = useListingStore((state) => state.setSearchPage)
  const clearSearchResults = useListingStore((state) => state.clearSearchResults)
  const error = useListingStore((state) => state.error)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const setPendingAction = useUIStore((state) => state.setPendingAction)
  const schemaId = getSchemaId(category)
  const schema = getFormSchema(schemaId)
  const activeCount = useMemo(
    () => filterKeys.filter((key) => key !== "category" && key !== "minPrice" && key !== "maxPrice" && filters[key]).length +
      (filters.category ? 1 : 0) +
      (filters.minPrice || filters.maxPrice ? 1 : 0),
    [filters],
  )
  const requestParams = useMemo(() => buildSearchParams(params), [params])
  const searchSummary = query || schema?.label?.en || t("search.advanced")
  const saveFilters = useMemo(() => Object.fromEntries(params.entries()), [params])
  const searchTitle = query ? t("seo.searchTitle", { query }) : t("page.searchTitle")
  const searchDescription = t("seo.searchDescription", { query: query || t("search.advanced"), count: searchTotal.toLocaleString() })
  const canonicalSearchUrl = canonicalUrl(`/search${params.toString() ? `?${params.toString()}` : ""}`)

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      searchListings(requestParams)
    }, 500)
    return () => window.clearTimeout(timer)
  }, [requestParams, searchListings])

  useEffect(() => {
    return () => clearSearchResults()
  }, [clearSearchResults])

  useEffect(() => {
    const signature = JSON.stringify({ query, category, filters, sort })
    if (lastSearchEventRef.current === signature) return
    lastSearchEventRef.current = signature
    trackEvent("search_executed", { query, categoryId: schemaId })
  }, [category, filters, query, schemaId, sort])

  const updateParam = useCallback(
    (key, value) => {
      const next = new URLSearchParams(params)
      if (value) next.set(key, value)
      else next.delete(key)
      next.delete("page")
      setParams(next)
    },
    [params, setParams],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (priceDraft.minPrice === filters.minPrice && priceDraft.maxPrice === filters.maxPrice) return
      const next = new URLSearchParams(params)
      if (priceDraft.minPrice) next.set("minPrice", priceDraft.minPrice)
      else next.delete("minPrice")
      if (priceDraft.maxPrice) next.set("maxPrice", priceDraft.maxPrice)
      else next.delete("maxPrice")
      next.delete("page")
      setParams(next)
    }, 500)
    return () => window.clearTimeout(timer)
  }, [filters.maxPrice, filters.minPrice, params, priceDraft.maxPrice, priceDraft.minPrice, setParams])

  const resetAll = useCallback(() => {
    setPriceDraft({ minPrice: "", maxPrice: "" })
    setParams(new URLSearchParams())
  }, [setParams, setPriceDraft])

  const handleFilterChange = useCallback(
    (key, value) => {
      trackEvent("filter_applied", { filterName: key, value })
      updateParam(key, value)
    },
    [updateParam],
  )

  const handlePriceDraftChange = useCallback((key, value) => {
    setPriceDraft((current) => ({ ...current, [key]: value }))
  }, [setPriceDraft])

  const goToPage = useCallback(
    (page) => {
      const nextPage = Math.min(Math.max(1, page), searchTotalPages)
      const next = new URLSearchParams(params)
      next.set("page", String(nextPage))
      setParams(next)
      setSearchPage(nextPage)
      window.scrollTo({ top: 0, behavior: "smooth" })
    },
    [params, searchTotalPages, setParams, setSearchPage],
  )

  function saveCurrentSearch() {
    if (!isAuthenticated) {
      toast.info(t("auth.signInToSaveSearch"), { duration: 3000 })
      setPendingAction({
        type: "saveSearch",
        params: Object.fromEntries(params.entries()),
      })
      toggleAuthModal(true)
      return
    }
    trackEvent("search_saved")
    setSaveModalOpen(true)
  }

  return (
    <PageTransition className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Helmet>
        <title>{searchTitle}</title>
        <meta name="description" content={searchDescription} />
        <meta property="og:title" content={searchTitle} />
        <meta property="og:description" content={searchDescription} />
        <meta property="og:image" content={canonicalUrl("/og-home.png")} />
        <meta property="og:url" content={canonicalSearchUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="BayonHub" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={searchTitle} />
        <meta name="twitter:description" content={searchDescription} />
        <meta name="twitter:image" content={canonicalUrl("/og-home.png")} />
        <link rel="canonical" href={canonicalSearchUrl} />
      </Helmet>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 sm:text-3xl">
            {query ? t("search.resultsFor", { query }) : t("search.advanced")}
          </h1>
          <p className="mt-1 text-sm font-bold text-neutral-500">
            {searchTotal.toLocaleString()} {t("search.found")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={saveCurrentSearch} size="sm" variant="secondary">
            <Star className="h-4 w-4" aria-hidden="true" />
            {t("search.saveSearch")}
          </Button>
          <select
            className="min-h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-bold outline-none focus:border-primary"
            onChange={(event) => updateParam("sort", event.target.value)}
            value={sort}
          >
            {sortOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {t(label)}
              </option>
            ))}
          </select>
          <ViewToggle onChange={setView} view={view} />
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <SearchFilters
          activeCount={activeCount}
          filters={filters}
          locations={locations}
          onFilterChange={handleFilterChange}
          onPriceDraftChange={handlePriceDraftChange}
          onReset={resetAll}
          priceDraft={priceDraft}
          schema={schema}
        />

        <div className="min-w-0 flex-1">
          {searchLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="grid min-h-64 place-items-center rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
              <div>
                <h3 className="text-lg font-black text-red-700">{t("ui.error")}</h3>
                <p className="mt-1 text-sm font-semibold text-red-600">{error}</p>
                <Button className="mt-5" onClick={() => searchListings(requestParams)} variant="secondary">
                  {t("ui.retry")}
                </Button>
              </div>
            </div>
          ) : searchResults.length ? (
            <>
              {view === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map((listing, index) => (
                    <div
                      key={listing.id}
                      onClickCapture={() => trackEvent("search_listing_clicked", { listingId: listing.id, position: index + 1 })}
                    >
                      <ListingCard listing={listing} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3">
                  {searchResults.map((listing, index) => (
                    <div
                      key={listing.id}
                      onClickCapture={() => trackEvent("search_listing_clicked", { listingId: listing.id, position: index + 1 })}
                    >
                      <ListingListItem highlightQuery={query} listing={listing} />
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
                <Button disabled={searchPage <= 1} onClick={() => goToPage(searchPage - 1)} size="sm" variant="secondary">
                  {t("pagination.previous")}
                </Button>
                <p className="text-sm font-black text-neutral-700">
                  {t("pagination.pageOf")} {searchPage} {t("pagination.of")} {searchTotalPages}
                </p>
                <Button disabled={searchPage >= searchTotalPages} onClick={() => goToPage(searchPage + 1)} size="sm" variant="secondary">
                  {t("pagination.next")}
                </Button>
              </div>
            </>
          ) : (
            <div className="grid min-h-[400px] place-items-center rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 p-8 text-center">
              <div className="max-w-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
                  <SearchX className="h-12 w-12" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">{t("search.noResults")}</h3>
                <p className="mt-2 text-sm font-bold text-neutral-500">{t("search.tryAgain")}</p>
                <Button className="mt-6" onClick={resetAll} variant="secondary">
                  {t("filter.clearAll")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <SaveSearchModal defaultName={searchSummary} filters={saveFilters} onClose={() => setSaveModalOpen(false)} open={saveModalOpen} />
    </PageTransition>
  )
}

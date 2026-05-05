import { useEffect, useMemo, useState } from "react"
import { Helmet } from "react-helmet-async"
import InfiniteScroll from "react-infinite-scroll-component"
import { useSearchParams } from "react-router-dom"
import { Search as SearchIcon, X, SlidersHorizontal, Star } from "lucide-react"
import ListingCard from "../components/listing/ListingCard"
import ListingListItem from "../components/listing/ListingListItem"
import Button from "../components/ui/Button"
import PageTransition from "../components/ui/PageTransition"
import SkeletonCard from "../components/ui/SkeletonCard"
import ViewToggle from "../components/ui/ViewToggle"
import { useTranslation } from "../hooks/useTranslation"
import { PROVINCES } from "../lib/locations"
import { useListingStore } from "../store/useListingStore"
import { useAuthStore } from "../store/useAuthStore"
import { useUIStore } from "../store/useUIStore"
import { cn } from "../lib/utils"
import { CATEGORIES } from "../lib/categories"
import toast from "react-hot-toast"

const sortOptions = [
  ["newest", "sort.newestFirst"],
  ["priceLow", "sort.priceLow"],
  ["priceHigh", "sort.priceHigh"],
  ["views", "sort.views"],
]

export default function SearchPage() {
  const { t, language } = useTranslation()
  const [params, setParams] = useSearchParams()
  
  const query = params.get("q") || ""
  const minPrice = params.get("minPrice") || ""
  const maxPrice = params.get("maxPrice") || ""
  const province = params.get("province") || ""
  const condition = params.get("condition") || ""
  const category = params.get("category") || ""
  const sort = params.get("sort") || "newest"

  const listings = useListingStore((state) => state.listings)
  const loading = useListingStore((state) => state.loading)
  const fetchListings = useListingStore((state) => state.fetchListings)
  const fetchMoreListings = useListingStore((state) => state.fetchMoreListings)
  const hasMore = useListingStore((state) => state.hasMore)
  const error = useListingStore((state) => state.error)
  const resetStoreFilters = useListingStore((state) => state.resetFilters)
  const total = useListingStore((state) => state.total)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const setPendingAction = useUIStore((state) => state.setPendingAction)
  const [view, setView] = useState("grid")
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  useEffect(() => {
    fetchListings({ 
      q: query,
      minPrice,
      maxPrice,
      province,
      condition,
      category,
      sort
    })
  }, [fetchListings, query, minPrice, maxPrice, province, condition, category, sort])

  function updateParam(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  function resetAll() {
    setParams(new URLSearchParams())
    resetStoreFilters()
  }
  
  function saveCurrentSearch() {
    if (!isAuthenticated) {
      toast.info(t("auth.signInToSaveSearch"), { duration: 3000 })
      setPendingAction({ 
        type: "saveSearch", 
        params: Object.fromEntries(params.entries()) 
      })
      toggleAuthModal(true)
      return
    }
    toast.success(t("search.saved"))
  }

  const displayedListings = useMemo(() => {
    return listings.filter((listing) => !listing.status || String(listing.status).toUpperCase() === "ACTIVE").sort((a, b) => {
      if (sort === "priceLow") return Number(a.price || 0) - Number(b.price || 0)
      if (sort === "priceHigh") return Number(b.price || 0) - Number(a.price || 0)
      if (sort === "views") return Number(b.viewCount || 0) - Number(a.viewCount || 0)
      return new Date(b.postedAt || 0) - new Date(a.postedAt || 0)
    })
  }, [listings, sort])

  return (
    <PageTransition className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Helmet>
        <title>{query ? t("seo.searchTitle", { query }) : t("page.searchTitle")}</title>
      </Helmet>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar Filters - Desktop */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-neutral-900">{t("filter.title")}</h2>
              <button onClick={resetAll} className="text-xs font-bold text-primary hover:underline">
                {t("filter.clearAll")}
              </button>
            </div>

            {/* Price Filter */}
            <div className="space-y-3">
              <p className="text-sm font-black uppercase tracking-widest text-neutral-400">{t("filter.price")}</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder={t("filter.minPrice")}
                  className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-primary"
                  value={minPrice}
                  onChange={(e) => updateParam("minPrice", e.target.value)}
                />
                <span className="text-neutral-300">-</span>
                <input
                  type="number"
                  placeholder={t("filter.maxPrice")}
                  className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-primary"
                  value={maxPrice}
                  onChange={(e) => updateParam("maxPrice", e.target.value)}
                />
              </div>
            </div>

            {/* Province Filter */}
            <div className="space-y-3">
              <p className="text-sm font-black uppercase tracking-widest text-neutral-400">{t("filter.location")}</p>
              <select
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-bold outline-none focus:border-primary"
                value={province}
                onChange={(e) => updateParam("province", e.target.value)}
              >
                <option value="">{t("nav.allCambodia")}</option>
                {PROVINCES.map((p) => (
                  <option key={p.id} value={p.label.en}>{p.label[language]}</option>
                ))}
              </select>
            </div>

            {/* Condition Filter */}
            <div className="space-y-3">
              <p className="text-sm font-black uppercase tracking-widest text-neutral-400">{t("filter.condition")}</p>
              <div className="flex flex-col gap-2">
                {["New", "Used"].map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm font-bold text-neutral-700 cursor-pointer">
                    <input
                      type="radio"
                      name="condition"
                      className="accent-primary"
                      checked={condition === c}
                      onChange={() => updateParam("condition", c)}
                    />
                    {t(`filter.condition${c}`)}
                  </label>
                ))}
                {condition && (
                  <button onClick={() => updateParam("condition", "")} className="text-left text-xs font-bold text-primary">
                    {t("ui.clear")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black text-neutral-900 sm:text-3xl">
                {query ? t("search.resultsFor", { query }) : t("page.searchTitle")}
              </h1>
              <p className="mt-1 text-sm font-bold text-neutral-500">
                {(total || displayedListings.length).toLocaleString()} {t("listing.resultsFound")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={saveCurrentSearch}
                className="hidden sm:flex"
              >
                <Star className="mr-2 h-4 w-4" />
                {t("search.saveSearch")}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                className="lg:hidden"
                onClick={() => setShowMobileFilters(true)}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                {t("filter.title")}
                {params.size > 0 && <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">{params.size}</span>}
              </Button>
              
              <select
                className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-bold outline-none focus:border-primary"
                onChange={(event) => updateParam("sort", event.target.value)}
                value={sort}
              >
                {sortOptions.map(([value, label]) => (
                  <option key={value} value={value}>{t(label)}</option>
                ))}
              </select>
              <ViewToggle onChange={setView} view={view} />
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : error ? (
            <div className="grid min-h-64 place-items-center rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
              <div>
                <h3 className="text-lg font-black text-red-700">{t("ui.error")}</h3>
                <p className="mt-1 text-sm font-semibold text-red-600">{error}</p>
                <Button className="mt-5" onClick={() => fetchListings({ q: query, minPrice, maxPrice, province, condition, category, sort })} variant="secondary">
                  {t("ui.retry")}
                </Button>
              </div>
            </div>
          ) : displayedListings.length ? (
            <InfiniteScroll
              dataLength={displayedListings.length}
              hasMore={hasMore}
              loader={<p className="py-6 text-center text-sm font-bold text-neutral-500">{t("filter.loadingMore")}</p>}
              next={fetchMoreListings}
              scrollThreshold={0.85}
            >
              {view === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {displayedListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
                </div>
              ) : (
                <div className="grid gap-3">
                  {displayedListings.map((listing) => <ListingListItem highlightQuery={query} key={listing.id} listing={listing} />)}
                </div>
              )}
            </InfiniteScroll>
          ) : (
            <div className="grid min-h-[400px] place-items-center rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 p-8 text-center">
              <div className="max-w-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
                  <SearchIcon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-black text-neutral-900">
                  {query ? t("filter.noResultsFor", { query }) : t("filter.noAdsFound")}
                </h3>
                <p className="mt-2 text-sm font-bold text-neutral-500">
                  {t("filter.tryAdjusting")}
                </p>
                <Button className="mt-6" onClick={resetAll} variant="secondary">
                  {t("filter.resetAll")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
          <div className="relative flex max-h-[85vh] w-full flex-col rounded-t-[2.5rem] bg-white p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <header className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-neutral-900">{t("filter.title")}</h2>
                <p className="text-xs font-bold text-neutral-500">{t("filter.refineResults")}</p>
              </div>
              <button onClick={() => setShowMobileFilters(false)} className="grid h-11 w-10 place-items-center rounded-full bg-neutral-100 text-neutral-500">
                <X className="h-6 w-6" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto space-y-8 pb-8">
              {/* Price range */}
              <div className="space-y-3">
                <p className="text-sm font-black uppercase tracking-widest text-neutral-400">{t("filter.price")} (KHR)</p>
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder={t("filter.minPrice")}
                    className="h-12 w-full rounded-2xl border border-neutral-200 px-4 text-sm font-bold"
                    value={minPrice}
                    onChange={(e) => updateParam("minPrice", e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder={t("filter.maxPrice")}
                    className="h-12 w-full rounded-2xl border border-neutral-200 px-4 text-sm font-bold"
                    value={maxPrice}
                    onChange={(e) => updateParam("maxPrice", e.target.value)}
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-3">
                <p className="text-sm font-black uppercase tracking-widest text-neutral-400">{t("filter.category")}</p>
                <select
                  className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-bold"
                  value={category}
                  onChange={(e) => updateParam("category", e.target.value)}
                >
                  <option value="">{t("nav.allCategories")}</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.slug}>{t(`category.${c.id}`)}</option>
                  ))}
                </select>
              </div>

              {/* Condition */}
              <div className="space-y-3">
                <p className="text-sm font-black uppercase tracking-widest text-neutral-400">{t("filter.condition")}</p>
                <div className="grid grid-cols-3 gap-2">
                  {["New", "Used", "For Parts"].map((c) => (
                    <label key={c} className={cn(
                      "flex h-12 items-center justify-center rounded-2xl border px-3 text-xs font-bold transition cursor-pointer",
                      condition === c ? "border-primary bg-primary text-white" : "border-neutral-200 bg-white text-neutral-700"
                    )}>
                      <input
                        type="radio"
                        className="sr-only"
                        checked={condition === c}
                        onChange={() => updateParam("condition", c)}
                      />
                      {t(`filter.condition${c.replace(' ', '')}`)}
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Posted */}
              <div className="space-y-3">
                <p className="text-sm font-black uppercase tracking-widest text-neutral-400">{t("filter.posted")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["any", t("filter.postedAny")],
                    ["24h", t("filter.posted24h")],
                    ["7d", t("filter.posted7d")],
                    ["30d", t("filter.posted30d")],
                  ].map(([val, label]) => (
                    <label key={val} className={cn(
                      "flex h-12 items-center justify-center rounded-2xl border px-3 text-xs font-bold transition cursor-pointer",
                      (params.get("posted") || "any") === val ? "border-primary bg-primary text-white" : "border-neutral-200 bg-white text-neutral-700"
                    )}>
                      <input
                        type="radio"
                        className="sr-only"
                        checked={(params.get("posted") || "any") === val}
                        onChange={() => updateParam("posted", val)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <footer className="mt-6 grid grid-cols-2 gap-3 pt-6 border-t">
              <Button variant="secondary" onClick={resetAll} className="w-full rounded-2xl">
                {t("filter.resetAll")}
              </Button>
              <Button onClick={() => setShowMobileFilters(false)} className="w-full rounded-2xl">
                {t("ui.apply")}
              </Button>
            </footer>
          </div>
        </div>
      )}
    </PageTransition>
  )
}

import { useEffect, useMemo, useState } from "react"
import { Helmet } from "react-helmet-async"
import InfiniteScroll from "react-infinite-scroll-component"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import ListingCard from "../components/listing/ListingCard"
import ListingListItem from "../components/listing/ListingListItem"
import Button from "../components/ui/Button"
import PageTransition from "../components/ui/PageTransition"
import SkeletonCard from "../components/ui/SkeletonCard"
import ViewToggle from "../components/ui/ViewToggle"
import { useTranslation } from "../hooks/useTranslation"
import { CATEGORIES } from "../lib/categories"
import { useListingStore } from "../store/useListingStore"
import { useUIStore } from "../store/useUIStore"

const sortOptions = [
  ["newest", "sort.newestFirst"],
  ["priceLow", "sort.priceLow"],
  ["priceHigh", "sort.priceHigh"],
  ["views", "sort.views"],
]

export default function SearchPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const query = params.get("q") || ""
  const listings = useListingStore((state) => state.listings)
  const loading = useListingStore((state) => state.loading)
  const fetchListings = useListingStore((state) => state.fetchListings)
  const fetchMoreListings = useListingStore((state) => state.fetchMoreListings)
  const hasMore = useListingStore((state) => state.hasMore)
  const resetFilters = useListingStore((state) => state.resetFilters)
  const setSearchQuery = useUIStore((state) => state.setSearchQuery)
  const [view, setView] = useState("grid")
  const [sort, setSort] = useState("newest")

  useEffect(() => {
    fetchListings({ q: query })
  }, [fetchListings, query])

  const displayedListings = useMemo(() => {
    return listings.filter((listing) => !listing.status || String(listing.status).toUpperCase() === "ACTIVE").sort((a, b) => {
      if (sort === "priceLow") return Number(a.price || 0) - Number(b.price || 0)
      if (sort === "priceHigh") return Number(b.price || 0) - Number(a.price || 0)
      if (sort === "views") return Number(b.views || 0) - Number(a.views || 0)
      return new Date(b.updatedAt || b.postedAt || 0) - new Date(a.updatedAt || a.postedAt || 0)
    })
  }, [listings, sort])

  const suggestion = useMemo(() => {
    if (displayedListings.length >= 3 || !query) return null
    const match = CATEGORIES.find((category) => t(`category.${category.id}`).toLowerCase().includes(query.toLowerCase()))
    return match ? t(`category.${match.id}`) : t(`category.${CATEGORIES[0].id}`)
  }, [query, displayedListings.length, t])

  return (
    <PageTransition className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Helmet>
        <title>{t("seo.searchTitle", { query })}</title>
        {!query ? <meta name="robots" content="noindex" /> : null}
      </Helmet>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-neutral-900">
            {query ? t("search.resultsFor", { query }) : t("page.searchTitle")}
          </h1>
          <p className="mt-2 text-sm font-black text-neutral-600">
            {displayedListings.length.toLocaleString()} {t("listing.resultsFound")}
          </p>
          {suggestion ? (
            <Link className="mt-2 inline-block text-sm font-black text-primary" to={`/search?q=${encodeURIComponent(suggestion)}`}>
              {t("search.didYouMean", { suggestion })}
            </Link>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <select className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-black outline-none" onChange={(event) => setSort(event.target.value)} value={sort}>
            {sortOptions.map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
          </select>
          <ViewToggle onChange={setView} view={view} />
        </div>
      </div>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => <SkeletonCard key={index} />)}
        </div>
      ) : displayedListings.length ? (
        <InfiniteScroll
          dataLength={displayedListings.length}
          hasMore={hasMore}
          loader={<p className="py-4 text-center text-sm font-bold text-neutral-500">{t("filter.loadingMore")}</p>}
          next={fetchMoreListings}
          scrollThreshold={0.85}
        >
          {view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayedListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
            </div>
          ) : (
            <div className="grid gap-3">
              {displayedListings.map((listing) => <ListingListItem highlightQuery={query} key={listing.id} listing={listing} />)}
            </div>
          )}
        </InfiniteScroll>
      ) : (
        <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <div>
            <h3 className="text-xl font-black text-neutral-900">{t("filter.noAdsFound")}</h3>
            <p className="mt-2 text-sm font-bold text-neutral-500">{t("filter.tryRemoving")}</p>
            <Button
              className="mt-5"
              onClick={() => {
                setSearchQuery("")
                resetFilters()
                navigate("/search")
              }}
              variant="secondary"
            >
              {t("filter.resetAll")}
            </Button>
          </div>
        </div>
      )}
    </PageTransition>
  )
}

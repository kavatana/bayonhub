import { useEffect, useMemo, useRef, useState } from "react"
import { Helmet } from "react-helmet-async"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Bookmark, Flag, SearchX, Share2 } from "lucide-react"
import ListingCard from "../components/listing/ListingCard"
import ListingDetail from "../components/listing/ListingDetail"
import PageTransition from "../components/ui/PageTransition"
import Button from "../components/ui/Button"
import ListingPageSkeleton from "../components/listing/ListingPageSkeleton"
import { useTranslation } from "../hooks/useTranslation"
import { trackEvent } from "../lib/analytics"
import { CATEGORIES } from "../lib/categories"
import { buildProductSchema, canonicalUrl } from "../lib/seo"
import { formatPrice, getListingImage, listingUrl as getListingUrl } from "../lib/utils"
import { useListingStore } from "../store/useListingStore"
import { useAuthStore } from "../store/useAuthStore"
import { useUIStore } from "../store/useUIStore"

let _sessionId = null
function getSessionId() {
  if (!_sessionId) _sessionId = crypto.randomUUID()
  return _sessionId
}

function categoryForListing(listing) {
  return CATEGORIES.find(
    (category) =>
      category.label.en === listing?.category ||
      category.subcategories.some((subcategory) => subcategory.label.en === listing?.subcategory),
  )
}

function extractListingId(...values) {
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  for (const value of values) {
    if (!value) continue
    const match = String(value).match(uuidPattern)
    if (match) return match[0]
  }
  return values.find(Boolean)
}

export default function ListingPage() {
  const { id, slugAndId, titleSlug } = useParams()
  const listingId = extractListingId(id, slugAndId, titleSlug)
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const listing = useListingStore((state) => state.currentListing)
  const similarListings = useListingStore((state) => state.similarListings)
  const loading = useListingStore((state) => state.loading)
  const error = useListingStore((state) => state.error)
  const fetchListingById = useListingStore((state) => state.fetchListingById)
  const fetchListings = useListingStore((state) => state.fetchListings)
  const addRecentlyViewed = useListingStore((state) => state.addRecentlyViewed)
  const addToRecentlyViewed = useListingStore((state) => state.addToRecentlyViewed)
  const fetchSimilarListings = useListingStore((state) => state.fetchSimilarListings)
  const incrementView = useListingStore((state) => state.incrementView)
  const clearCurrentListing = useListingStore((state) => state.clearCurrentListing)
  const savedIds = useListingStore((state) => state.savedIds)
  const toggleSaved = useListingStore((state) => state.toggleSaved)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const setPendingAction = useUIStore((state) => state.setPendingAction)
  const setOpenReportListingId = useUIStore((state) => state.setOpenReportListingId)
  const setHideBottomNav = useUIStore((state) => state.setHideBottomNav)
  const hideBottomNav = useUIStore((state) => state.hideBottomNav)
  const stickyVisible = useRef(false)
  const [showSticky, setShowSticky] = useState(false)
  const trackedListingRef = useRef(null)
  const viewEventRef = useRef(null)

  useEffect(() => {
    fetchListingById(listingId)
    fetchSimilarListings(listingId)
    fetchListings()
    return () => clearCurrentListing()
  }, [fetchListingById, fetchListings, fetchSimilarListings, listingId, clearCurrentListing])

  useEffect(() => {
    if (!listingId) return
    if (trackedListingRef.current === listingId) return
    trackedListingRef.current = listingId
    incrementView(listingId, getSessionId())
    addRecentlyViewed(listingId)
  }, [addRecentlyViewed, listingId, incrementView])

  useEffect(() => {
    if (!listing?.id || viewEventRef.current === listing.id) return
    viewEventRef.current = listing.id
    addToRecentlyViewed(listing)
    trackEvent("listing_viewed", { listingId: listing.id, categoryId: listing.categorySlug || listing.category })
  }, [addToRecentlyViewed, listing])

  useEffect(() => {
    if (listing && id && !titleSlug) {
      const canonical = getListingUrl(listing)
      if (window.location.pathname !== canonical) {
        navigate(canonical, { replace: true })
      }
    }
  }, [id, listing, navigate, titleSlug])

  const related = useMemo(() => similarListings.slice(0, 6), [similarListings])
  const category = categoryForListing(listing)
  const listingPath = listing ? getListingUrl(listing) : ""
  const listingUrl = listing ? canonicalUrl(listingPath) : ""
  const description = listing?.description || listing?.title || ""
  const listingTitle = listing ? t("seo.listingTitle", { title: listing.title, price: formatPrice(listing.price, listing.currency) }) : ""
  const listingImage = listing ? getListingImage(listing) : ""
  const rawListingImageUrl = typeof listingImage === "string" ? listingImage : listingImage?.url || listingImage?.thumbUrl || ""
  const listingImageUrl = rawListingImageUrl.startsWith("/") ? canonicalUrl(rawListingImageUrl) : rawListingImageUrl
  const descriptionPreview = description.slice(0, 160)
  const productJson = listing
    ? {
        ...buildProductSchema(listing),
        description,
        image: listingImageUrl,
        url: listingUrl,
      }
    : null

  useEffect(() => {
    if (!listing) return undefined
    const actions = document.getElementById("listing-actions")
    if (!actions) return undefined
    const showThreshold = 0.1
    const hideThreshold = 0.3
    const observer = new IntersectionObserver(([entry]) => {
      const ratio = entry.intersectionRatio
      if (!stickyVisible.current && ratio < showThreshold) {
        stickyVisible.current = true
        setShowSticky(true)
      } else if (stickyVisible.current && ratio > hideThreshold) {
        stickyVisible.current = false
        setShowSticky(false)
      }
    }, {
      threshold: [0, showThreshold, hideThreshold, 1],
    })
    observer.observe(actions)
    return () => observer.disconnect()
  }, [listing])

  useEffect(() => {
    setHideBottomNav(true)
    return () => setHideBottomNav(false)
  }, [setHideBottomNav])

  const isSaved = listing ? savedIds.some((id) => String(id) === String(listing.id)) : false

  function saveFromSticky() {
    if (!isAuthenticated) {
      setPendingAction({ type: "save", listingId: listing.id })
      toggleAuthModal(true)
      return
    }
    toggleSaved(listing.id, listing)
  }

  async function shareFromSticky() {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: listing.title, text: listing.description, url })
      return
    }
    await navigator.clipboard?.writeText(url)
  }

  function reportFromSticky() {
    if (!isAuthenticated) {
      setPendingAction({ type: "report", listingId: listing.id })
      toggleAuthModal(true)
      return
    }
    setOpenReportListingId(listing.id)
  }

  if (loading && !listing) {
    return <ListingPageSkeleton />
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <div className="mx-auto inline-flex flex-col items-center gap-4 rounded-3xl border border-red-100 bg-red-50 p-10 text-red-700 shadow-sm sm:px-16">
          <h2 className="text-2xl font-black">{t("ui.error")}</h2>
          <p className="max-w-xl text-sm font-bold">{error}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => fetchListingById(listingId)} variant="secondary">{t("ui.retry")}</Button>
            <Button onClick={() => navigate("/")}>{t("listing.browseAll")}</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <div className="mx-auto inline-flex flex-col items-center gap-4 rounded-3xl border border-dashed border-neutral-300 bg-white p-10 text-neutral-600 shadow-sm sm:px-16">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-neutral-100 text-primary">
            <SearchX className="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-black text-neutral-900">{t("listing.unavailableTitle")}</h2>
          <p className="max-w-xl text-sm font-bold text-neutral-500">{t("listing.unavailableSubtitle")}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => navigate("/")}>{t("listing.browseAll")}</Button>
            <Button variant="secondary" onClick={() => navigate("/search")}>{t("listing.searchAgain")}</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PageTransition className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Helmet>
        <meta charSet="UTF-8" />
        <title>{listingTitle}</title>
        <meta name="description" content={descriptionPreview} />
        <meta property="og:title" content={listingTitle} />
        <meta property="og:description" content={descriptionPreview} />
        <meta property="og:image" content={listingImageUrl} />
        <meta property="og:url" content={listingUrl} />
        <meta property="og:type" content="product" />
        <meta property="og:site_name" content="BayonHub" />
        <meta property="og:locale" content={language === "km" ? "km_KH" : "en_US"} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={listingTitle} />
        <meta name="twitter:description" content={descriptionPreview} />
        <meta name="twitter:image" content={listingImageUrl} />
        <link rel="canonical" href={listingUrl} />
        {productJson ? <script type="application/ld+json">{JSON.stringify(productJson)}</script> : null}
      </Helmet>
      <ListingDetail listing={listing} />
      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-neutral-900">{t("listing.similar")}</h2>
          {category ? (
            <Link className="text-sm font-black text-primary" to={`/category/${category.slug}`}>
              {t("listing.seeMoreCategory", { category: t(`category.${category.id}`) })}
            </Link>
          ) : null}
        </div>
        {related.length ? (
          <div className="mt-5 grid auto-cols-[78%] grid-flow-col gap-4 overflow-x-auto pb-3 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-2">
            {related.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-700">
            <p className="text-lg font-black text-neutral-900">{t("listing.noSimilarTitle")}</p>
            <p className="mt-2 text-sm font-bold text-neutral-500">{t("listing.noSimilarSubtitle")}</p>
            <div className="mt-6 flex justify-center">
              <Button variant="secondary" onClick={() => navigate(`/search?category=${category?.slug || ""}`)}>
                {t("listing.searchCategory", { category: category ? t(`category.${category.id}`) : t("listing.allCategories") })}
              </Button>
            </div>
          </div>
        )}
      </section>
      <div
        className={`fixed inset-x-0 ${hideBottomNav ? "bottom-0" : "bottom-20"} z-40 border-t border-neutral-200 bg-white p-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(0,0,0,0.08)] transition-transform lg:hidden ${
          showSticky ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          <Button onClick={saveFromSticky} size="sm" variant="secondary">
            <Bookmark className={isSaved ? "h-4 w-4 fill-primary" : "h-4 w-4"} aria-hidden="true" />
            {isSaved ? t("listing.saved") : t("listing.save")}
          </Button>
          <Button onClick={shareFromSticky} size="sm" variant="secondary">
            <Share2 className="h-4 w-4" aria-hidden="true" />
            {t("listing.share")}
          </Button>
          <Button onClick={reportFromSticky} size="sm" variant="secondary">
            <Flag className="h-4 w-4" aria-hidden="true" />
            {t("listing.report")}
          </Button>
        </div>
      </div>
    </PageTransition>
  )
}

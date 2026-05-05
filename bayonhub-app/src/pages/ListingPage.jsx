import { useEffect, useMemo, useRef, useState } from "react"
import { Helmet } from "react-helmet-async"
import { Link, useNavigate, useParams } from "react-router-dom"
import { MessageCircle, SearchX } from "lucide-react"
import ListingCard from "../components/listing/ListingCard"
import ListingDetail from "../components/listing/ListingDetail"
import PageTransition from "../components/ui/PageTransition"
import Button from "../components/ui/Button"
import PhoneReveal from "../components/ui/PhoneReveal"
import ListingPageSkeleton from "../components/listing/ListingPageSkeleton"
import { useTranslation } from "../hooks/useTranslation"
import { CATEGORIES } from "../lib/categories"
import { buildProductSchema, canonicalUrl } from "../lib/seo"
import { formatPrice, getListingImage, listingUrl as getListingUrl } from "../lib/utils"
import { buildLeadPayload } from "../lib/validation"
import { useListingStore } from "../store/useListingStore"
import { useAuthStore } from "../store/useAuthStore"
import { useUIStore } from "../store/useUIStore"

function categoryForListing(listing) {
  return CATEGORIES.find(
    (category) =>
      category.label.en === listing?.category ||
      category.subcategories.some((subcategory) => subcategory.label.en === listing?.subcategory),
  )
}

export default function ListingPage() {
  const { id, titleSlug } = useParams()
  const listingId = id || titleSlug?.split("-").pop()
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const listing = useListingStore((state) => state.currentListing)
  const listings = useListingStore((state) => state.listings)
  const loading = useListingStore((state) => state.loading)
  const error = useListingStore((state) => state.error)
  const fetchListingById = useListingStore((state) => state.fetchListingById)
  const fetchListings = useListingStore((state) => state.fetchListings)
  const createLead = useListingStore((state) => state.createLead)
  const addRecentlyViewed = useListingStore((state) => state.addRecentlyViewed)
  const incrementView = useListingStore((state) => state.incrementView)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const setPendingAction = useUIStore((state) => state.setPendingAction)
  const setHideBottomNav = useUIStore((state) => state.setHideBottomNav)
  const hideBottomNav = useUIStore((state) => state.hideBottomNav)
  const stickyVisible = useRef(false)
  const [showSticky, setShowSticky] = useState(false)
  const trackedListingRef = useRef(null)

  useEffect(() => {
    fetchListingById(listingId)
    fetchListings()
  }, [fetchListingById, fetchListings, listingId])

  useEffect(() => {
    if (!listingId) return
    if (trackedListingRef.current === listingId) return
    trackedListingRef.current = listingId
    incrementView(listingId)
    addRecentlyViewed(listingId)
  }, [addRecentlyViewed, listingId, incrementView])

  useEffect(() => {
    if (listing && id && !titleSlug) {
      const canonical = getListingUrl(listing)
      if (window.location.pathname !== canonical) {
        navigate(canonical, { replace: true })
      }
    }
  }, [id, listing, navigate, titleSlug])

  const related = useMemo(
    () =>
      listings
        .filter((item) => item.id !== listing?.id && item.subcategory === listing?.subcategory)
        .slice(0, 4),
    [listing, listings],
  )
  const category = categoryForListing(listing)
  const listingPath = listing ? getListingUrl(listing) : ""
  const listingUrl = listing ? canonicalUrl(listingPath) : ""
  const description = listing?.description || listing?.title || ""
  const productJson = listing
    ? {
        ...buildProductSchema(listing),
        description,
        image: getListingImage(listing),
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

  function chatFromSticky() {
    if (!isAuthenticated) {
      setPendingAction({ type: "message", listingId: listing.id })
      toggleAuthModal(true)
      return
    }
    createLead(listing.id, buildLeadPayload("CHAT", { message: t("listing.quickAskMessage") }))
    navigate("/dashboard")
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
        <title>{t("seo.listingTitle", { title: listing.title, price: formatPrice(listing.price, listing.currency) })}</title>
        <meta name="description" content={description.slice(0, 160)} />
        <meta property="og:title" content={t("seo.listingTitle", { title: listing.title, price: formatPrice(listing.price, listing.currency) })} />
        <meta property="og:description" content={description.slice(0, 160)} />
        <meta property="og:image" content={getListingImage(listing)} />
        <meta property="og:url" content={listingUrl} />
        <meta property="og:type" content="product" />
        <meta property="og:site_name" content="BayonHub" />
        <meta property="og:locale" content={language === "km" ? "km_KH" : "en_US"} />
        <link rel="canonical" href={listingUrl} />
        {productJson ? <script type="application/ld+json">{JSON.stringify(productJson)}</script> : null}
      </Helmet>
      <ListingDetail listing={listing} />
      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-neutral-900">{t("listing.related")}</h2>
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
          <PhoneReveal
            phone={listing.phone}
            onReveal={() => {
              createLead(listing.id, buildLeadPayload("CALL", { phone: listing.phone }))
            }}
            className="!h-11 !text-xs"
          />
          <Button
            disabled={!listing.phone}
            onClick={() => {
              if (!listing.phone) return
              createLead(listing.id, buildLeadPayload("WHATSAPP", { phone: listing.phone }))
              window.open(`https://wa.me/${listing.phone.replace(/\D/g, "")}`, "_blank")
            }}
            size="sm"
            title={listing.phone ? undefined : t("auth.noPhone")}
            variant="secondary"
          >
            {t("listing.whatsapp")}
          </Button>
          <Button onClick={chatFromSticky} size="sm" variant="secondary">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {t("listing.chat")}
          </Button>
        </div>
      </div>
    </PageTransition>
  )
}

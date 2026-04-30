import { useEffect, useMemo, useRef, useState } from "react"
import { Helmet } from "react-helmet-async"
import { Link, useNavigate, useParams } from "react-router-dom"
import { MessageCircle, Phone } from "lucide-react"
import ListingCard from "../components/listing/ListingCard"
import ListingDetail from "../components/listing/ListingDetail"
import Spinner from "../components/ui/Spinner"
import PageTransition from "../components/ui/PageTransition"
import Button from "../components/ui/Button"
import { useTranslation } from "../hooks/useTranslation"
import { CATEGORIES } from "../lib/categories"
import { buildProductSchema, canonicalUrl } from "../lib/seo"
import { formatPrice, getListingImage, getListingSlug } from "../lib/utils"
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
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const listing = useListingStore((state) => state.currentListing)
  const listings = useListingStore((state) => state.listings)
  const loading = useListingStore((state) => state.loading)
  const fetchListingById = useListingStore((state) => state.fetchListingById)
  const fetchListings = useListingStore((state) => state.fetchListings)
  const createLead = useListingStore((state) => state.createLead)
  const addRecentlyViewed = useListingStore((state) => state.addRecentlyViewed)
  const incrementView = useListingStore((state) => state.incrementView)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const setPendingAction = useUIStore((state) => state.setPendingAction)
  const stickyVisible = useRef(false)
  const [showSticky, setShowSticky] = useState(false)
  const [stickyPhoneVisible, setStickyPhoneVisible] = useState(false)
  const trackedListingRef = useRef(null)

  useEffect(() => {
    fetchListingById(id)
    fetchListings()
  }, [fetchListingById, fetchListings, id])

  useEffect(() => {
    if (!id) return
    if (trackedListingRef.current === id) return
    trackedListingRef.current = id
    incrementView(id)
    addRecentlyViewed(id)
  }, [addRecentlyViewed, id, incrementView])

  const related = useMemo(
    () =>
      listings
        .filter((item) => item.id !== listing?.id && item.subcategory === listing?.subcategory)
        .slice(0, 4),
    [listing, listings],
  )
  const category = categoryForListing(listing)
  const listingPath = listing ? `/listing/${listing.id}/${getListingSlug(listing)}` : ""
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
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    )
  }

  if (!listing) {
    return <div className="mx-auto max-w-7xl px-4 py-12 text-center">{t("listing.empty")}</div>
  }

  return (
    <PageTransition className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Helmet>
        <title>{t("seo.listingTitle", { title: listing.title, price: formatPrice(listing.price, listing.currency) })}</title>
        <meta name="description" content={description.slice(0, 160)} />
        <meta property="og:image" content={getListingImage(listing)} />
        <meta property="og:type" content="product" />
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
          <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center font-bold text-neutral-500">
            {t("listing.noRelated")}
          </div>
        )}
      </section>
      <div
        className={`fixed inset-x-0 bottom-20 z-40 border-t border-neutral-200 bg-white p-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] transition-transform lg:hidden ${
          showSticky ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          <Button
            disabled={!listing.phone}
            onClick={() => {
              if (!listing.phone) return
              createLead(listing.id, buildLeadPayload("CALL", { phone: listing.phone }))
              setStickyPhoneVisible(true)
            }}
            size="sm"
            title={listing.phone ? undefined : t("auth.noPhone")}
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {stickyPhoneVisible && listing.phone ? listing.phone : t("listing.showPhone")}
          </Button>
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

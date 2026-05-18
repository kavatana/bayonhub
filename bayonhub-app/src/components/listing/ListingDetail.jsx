import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react"
import gsap from "gsap"
import { formatDistanceToNow } from "date-fns"
import { Link } from "react-router-dom"
import {
  BadgeCheck,
  Bookmark,
  Camera,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Flag,
  Fuel,
  Gauge,
  Hash,
  MapPin,
  MessageCircle,
  Send,
  Share2,
  ShieldCheck,
  Star,
  Store,
  Tag,
  TrendingDown,
} from "lucide-react"
import toast from "react-hot-toast"
import { useTranslation } from "../../hooks/useTranslation"
import { trackEvent } from "../../lib/analytics"
import { CATEGORIES } from "../../lib/categories"
import { rateLimiter } from "../../lib/rateLimiter"
import { cn, formatPrice, getImageSizes, getListingImage, getSrcSet, telegramShare, sellerUrl, timeAgo } from "../../lib/utils"
import { sanitizeText } from "../../lib/sanitize"
import { buildLeadPayload } from "../../lib/validation"
import { revealListingPhone } from "../../api/listings"
import { useAuthStore } from "../../store/useAuthStore"
import { useListingStore } from "../../store/useListingStore"
import { useUIStore } from "../../store/useUIStore"
import { useUserStore } from "../../store/useUserStore"
import Badge from "../ui/Badge"
import Breadcrumb from "../ui/Breadcrumb"
import Button from "../ui/Button"
import LoanCalculator from "../ui/LoanCalculator"
import Modal from "../ui/Modal"
import SafetyWarning from "../ui/SafetyWarning"
import StarRating from "../ui/StarRating"
import PhoneReveal from "../ui/PhoneReveal"
import ReviewModal from "../storefront/ReviewModal"
import MessageModal from "../messaging/MessageModal"

const MapView = lazy(() => import("../ui/MapView"))

const reportReasons = [
  "SCAM",
  "WRONG_CATEGORY",
  "DUPLICATE",
  "INAPPROPRIATE",
  "OTHER",
]

const facetIcons = {
  mileage: Gauge,
  year: Calendar,
  fuel: Fuel,
  make: Tag,
  model: Tag,
}

function normalizeImages(listing) {
  const images = Array.isArray(listing.images) && listing.images.length ? listing.images : [getListingImage(listing)]
  return images.map((image) => (typeof image === "string" ? image : image.url)).filter(Boolean)
}

function findCategoryForListing(listing) {
  return CATEGORIES.find(
    (category) =>
      category.label.en === listing.category ||
      category.subcategories.some((subcategory) => subcategory.label.en === listing.subcategory),
  )
}

function sellerLastSeenText(value, language, t) {
  if (!value) return ""
  const diffMs = Date.now() - new Date(value).getTime()
  if (diffMs < 60 * 60 * 1000) return t("seller.lastSeenRecently")
  return t("seller.lastSeenAgo", { time: timeAgo(value, language) })
}

function conditionLabel(condition, t) {
  const normalized = String(condition || "").trim().toLowerCase()
  if (normalized === "new") return t("condition.new")
  if (normalized === "used") return t("condition.used")
  if (normalized === "like new") return t("condition.likeNew")
  if (normalized === "good") return t("condition.good")
  if (normalized === "refurbished") return t("condition.refurbished")
  if (normalized === "for rent") return t("condition.forRent")
  return condition
}

export default function ListingDetail({ listing }) {
  const { t, language } = useTranslation()
  const images = useMemo(() => normalizeImages(listing), [listing])
  const [activeImage, setActiveImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [selectedReason, setSelectedReason] = useState("SCAM")
  const [reportDetail, setReportDetail] = useState("")
  const [evidenceUrl, setEvidenceUrl] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [offerOpen, setOfferOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [messageModalOpen, setMessageModalOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [descriptionLanguage, setDescriptionLanguage] = useState(language)
  const [offer, setOffer] = useState({ price: "", message: "" })
  const [brokenImages, setBrokenImages] = useState({})
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false)
  const [revealedPhone, setRevealedPhone] = useState("")
  const mainImageRef = useRef(null)
  const createLead = useListingStore((state) => state.createLead)
  const reportListing = useListingStore((state) => state.reportListing)
  const bumpListing = useListingStore((state) => state.bumpListing)
  const favorites = useListingStore((state) => state.favorites)
  const watchlist = useListingStore((state) => state.watchlist)
  const toggleFavorite = useListingStore((state) => state.toggleFavorite)
  const toggleWatchlist = useListingStore((state) => state.toggleWatchlist)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const following = useAuthStore((state) => state.following)
  const followSellerLocal = useAuthStore((state) => state.followSeller)
  const unfollowSellerLocal = useAuthStore((state) => state.unfollowSeller)
  const user = useAuthStore((state) => state.user)
  const followSeller = useUserStore((state) => state.followSeller)
  const unfollowSeller = useUserStore((state) => state.unfollowSeller)
  const fetchFollowers = useUserStore((state) => state.fetchFollowers)
  const followerCounts = useUserStore((state) => state.followerCounts)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const setPendingAction = useUIStore((state) => state.setPendingAction)
  const openReportListingId = useUIStore((state) => state.openReportListingId)
  const setOpenReportListingId = useUIStore((state) => state.setOpenReportListingId)

  // Open report modal after login completes a pending report action for this listing
  useEffect(() => {
    if (openReportListingId && openReportListingId === listing.id) {
      setOpenReportListingId(null)
      Promise.resolve().then(() => setReportOpen(true))
    }
  }, [openReportListingId, listing.id, setOpenReportListingId])
  const phone = revealedPhone || listing.phone || null
  const hasPhone = Boolean(phone)
  const telegramUsername = listing.seller?.telegramUsername || listing.username
  const whatsappNumber = listing.seller?.whatsappNumber || phone
  const isSold = listing?.status === "sold" || listing?.status === "SOLD"
  const sellerId = listing.sellerId || listing.seller?.id
  const activeImageUrl = images[activeImage]

  function markImageBroken(image) {
    setBrokenImages((current) => ({ ...current, [image]: true }))
  }

  function trackLead(type) {
    trackEvent("lead_created", { listingId: listing.id, type })
  }
  const isSeller = user?.id && sellerId && String(user.id) === String(sellerId)
  const isFollowingSeller = sellerId ? following.includes(String(sellerId)) : false
  const followersCount = sellerId
    ? followerCounts[sellerId] ?? listing.seller?.followersCount ?? listing.followers ?? 0
    : 0
  const isFavorite = favorites.some((item) => String(item.listingId || item) === String(listing.id))
  const isWatching = watchlist.some((item) => String(item.listingId || item) === String(listing.id))
  const sellerReviewCount = Number(listing.sellerReviewCount || listing.seller?.reviewCount || listing.seller?.reviewsCount || 0)
  const sellerRating = Number(listing.sellerRating || listing.seller?.rating || 0)
  const sellerVerified = Boolean(listing.seller?.isVerifiedSeller || listing.isVerifiedSeller)
  const sellerIsPlusMember = Boolean(listing.seller?.isPlusMember || listing.isPlusMember)
  const isBumpedToday = listing.bumpedAt && new Date(listing.bumpedAt) >= new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()))
  const sellerResponseRate = Number(listing.seller?.responseRate ?? listing.responseRate ?? 0)
  const sellerConversationCount = Number(listing.seller?.totalSellerConversations || listing.totalSellerConversations || 0)
  const sellerLastSeen = sellerLastSeenText(listing.seller?.lastSeen || listing.lastSeen, language, t)
  const hasListingCoordinates = listing.lat != null && listing.lng != null
  const category = findCategoryForListing(listing)
  const subcategory = category?.subcategories.find((item) => item.label.en === listing.subcategory)
  const isVehicleListing =
    listing.categorySlug === "vehicles" ||
    listing.subcategorySlug === "cars" ||
    category?.slug === "vehicles" ||
    subcategory?.slug === "cars"
  const description = descriptionLanguage === "km" && listing.descriptionKm ? listing.descriptionKm : listing.description
  const safeDescription = sanitizeText(description)
  const TRUNCATION_BY_CATEGORY = {
    vehicles: 600,
    "real-estate": 700,
    electronics: 350,
    default: 400,
  }

  const truncationLimit = TRUNCATION_BY_CATEGORY[listing.categorySlug?.toLowerCase()] ?? TRUNCATION_BY_CATEGORY.default

  const shortDescription =
    !descriptionExpanded && safeDescription.length > truncationLimit
      ? `${safeDescription.slice(0, truncationLimit)}${t("ui.ellipsis")}`
      : safeDescription
  const postedText =
    language === "en"
      ? formatDistanceToNow(new Date(listing.postedAt || "2026-01-01T00:00:00Z"), { addSuffix: true })
      : timeAgo(listing.postedAt, language)
  const crumbs = [
    { label: t("breadcrumb.home"), href: "/" },
    category ? { label: t(`category.${category.id}`), href: `/category/${category.slug}` } : null,
    category && subcategory
      ? { label: t(`category.${subcategory.id}`), href: `/category/${category.slug}/${subcategory.slug}` }
      : null,
    { label: listing.title.length > 30 ? `${listing.title.slice(0, 30)}...` : listing.title },
  ].filter(Boolean)

  useEffect(() => {
    if (sellerId) fetchFollowers(sellerId)
  }, [fetchFollowers, sellerId])

  useEffect(() => {
    if (!mainImageRef.current) return
    gsap.fromTo(mainImageRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" })
  }, [activeImage])

  useEffect(() => {
    if (!lightboxOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === "ArrowLeft") setActiveImage((value) => (value - 1 + images.length) % images.length)
      if (event.key === "ArrowRight") setActiveImage((value) => (value + 1) % images.length)
      if (event.key === "Escape") setLightboxOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [images.length, lightboxOpen])

  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [lightboxOpen])

  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diffX = touchStartX.current - e.changedTouches[0].clientX
    const diffY = Math.abs(touchStartY.current - e.changedTouches[0].clientY)
    
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > diffY) {
      if (diffX > 0) {
        setActiveImage((value) => (value + 1) % images.length)
      } else {
        setActiveImage((value) => (value - 1 + images.length) % images.length)
      }
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  async function shareListing() {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: listing.title, text: listing.description, url })
      return
    }
    setShareOpen(true)
  }

  async function copyListingLink() {
    await navigator.clipboard?.writeText(window.location.href)
    toast.success(t("listing.linkCopied"))
  }

  function requireAuth(action) {
    if (isAuthenticated) return true
    setPendingAction(action)
    toggleAuthModal(true)
    return false
  }

  function handleFavorite() {
    if (!requireAuth({ type: "favorite", listingId: listing.id })) return
    toggleFavorite(listing.id)
  }

  function handleWatchlist() {
    if (!requireAuth({ type: "watchlist", listingId: listing.id })) return
    toggleWatchlist(listing.id)
  }

  function canPerformContact(type) {
    if (!rateLimiter.canPerform(type, listing.id)) {
      toast.error(t("listing.rateLimitReached"))
      return false
    }
    return true
  }

  function recordContact(type) {
    rateLimiter.record(type, listing.id)
  }

  function sendQuickAsk() {
    if (!canPerformContact("CHAT")) return
    createLead(listing.id, buildLeadPayload("CHAT", { message: t("listing.quickAskMessage") }))
    trackLead("CHAT")
    recordContact("CHAT")
    toast.success(t("listing.quickAskSent"))
  }

  function sendMessage() {
    if (!isAuthenticated) {
      toast.info(t("auth.signInToMessage"), { duration: 3000 })
      setPendingAction({ type: "message", listingId: listing.id })
      toggleAuthModal(true)
      return
    }
    setMessageModalOpen(true)
  }

  function handleOpenReport() {
    if (!isAuthenticated) {
      toast.info(t("auth.signInToReport"), { duration: 3000 })
      setPendingAction({ type: "report", listingId: listing.id })
      toggleAuthModal(true)
      return
    }
    setReportOpen(true)
  }

  async function handleFollowSeller() {
    if (!sellerId) return
    if (!requireAuth({ type: "follow", sellerId })) return
    if (isFollowingSeller) {
      unfollowSellerLocal(sellerId)
      await unfollowSeller(sellerId)
    } else {
      followSellerLocal(sellerId)
      await followSeller(sellerId)
    }
  }

  async function handleBumpListing() {
    if (!requireAuth({ type: "bump", listingId: listing.id })) return
    const result = await bumpListing(listing.id)
    if (result.success) {
      toast.success(t("bump.bumpedToday"))
      return
    }
    toast.error(result.error === "BUMP_LIMIT" ? t("bump.limit") : t("plus.plusRequired"))
  }

  async function handleRevealPhone() {
    if (!hasPhone) return
    if (!isAuthenticated) return
    if (!canPerformContact("CALL")) return
    try {
      const result = await revealListingPhone(listing.id)
      if (result?.phone) {
        setRevealedPhone(result.phone)
        trackLead("CALL")
        recordContact("CALL")
        return
      }
      toast.error(t("ui.error"))
    } catch {
      toast.error(t("ui.error"))
    }
  }

  async function submitReport(event) {
    event.preventDefault()
    if (reportDetail.trim() && reportDetail.trim().length < 20) {
      toast.error(t("report.detailTooShort"))
      return
    }
    if (evidenceUrl.trim()) {
      try {
        new URL(evidenceUrl)
      } catch {
        toast.error(t("report.invalidUrl"))
        return
      }
    }
    setIsSubmittingReport(true)
    try {
      const reportPayload = {
        reason: selectedReason,
        detail: reportDetail.trim() || null,
        evidenceUrl: evidenceUrl.trim() || null,
        contactEmail: contactEmail.trim() || null,
        userAgent: navigator.userAgent,
        reportedAt: new Date().toISOString(),
        listingId: listing.id,
        listingTitle: listing.title,
        reporterSessionId: sessionStorage.getItem("bayonhub:session"),
      }
      const result = await reportListing(listing.id, reportPayload)
      if (!result) {
        toast.error(t("ui.error"))
        return
      }
      setReportOpen(false)
      setReportDetail("")
      setEvidenceUrl("")
      setContactEmail("")
      setSelectedReason("SCAM")
      toast.success(t("report.submitted"))
    } catch {
      toast.error(t("ui.error"))
    } finally {
      setIsSubmittingReport(false)
    }
  }

  function submitOffer(event) {
    event.preventDefault()
    if (!offer.price || Number(offer.price) <= 0) {
      toast.error(t("post.validationPrice"))
      return
    }
    if (!canPerformContact("OFFER")) return
    setIsSubmittingOffer(true)
    try {
      createLead(listing.id, buildLeadPayload("OFFER", { offerPrice: offer.price, message: offer.message }))
      trackLead("OFFER")
      recordContact("OFFER")
      setOfferOpen(false)
      toast.success(t("ui.success"))
    } catch {
      toast.error(t("post.validationPrice"))
    } finally {
      setIsSubmittingOffer(false)
    }
  }

  return (
    <article className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0 space-y-6">
        <Breadcrumb crumbs={crumbs} />
        <div className="relative overflow-hidden rounded-2xl bg-neutral-100">
          {isSold && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-xl pointer-events-none">
              <span className="bg-red-500 text-white font-bold text-xl px-6 py-3 rounded-full rotate-[-12deg] shadow-lg select-none">
                {t("listing.sold")}
              </span>
            </div>
          )}
          <button className="block w-full" onClick={() => setLightboxOpen(true)} type="button">
            {brokenImages[activeImageUrl] ? (
              <div className="grid aspect-[4/3] w-full place-items-center bg-neutral-200 text-neutral-400">
                <Camera className="h-12 w-12" aria-hidden="true" />
              </div>
            ) : (
              <img
                ref={mainImageRef}
                alt={listing.title}
                className="aspect-[4/3] w-full object-cover"
                decoding="async"
                height="600"
                loading="lazy"
                onError={() => markImageBroken(activeImageUrl)}
                sizes={getImageSizes()}
                src={activeImageUrl}
                srcSet={getSrcSet(activeImageUrl)}
                width="800"
              />
            )}
            <span className="sr-only">{t("listing.zoomImage")}</span>
          </button>
          <span className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-black text-white">
            {t("listing.imageCount", { current: activeImage + 1, total: images.length })}
          </span>
        </div>
        {images.length > 1 ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                className={cn(
                  "h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 bg-neutral-100",
                  activeImage === index ? "border-primary" : "border-transparent",
                )}
                key={`${image}-${index}`}
                onClick={() => setActiveImage(index)}
                type="button"
              >
                {brokenImages[image] ? (
                  <span className="grid h-full w-full place-items-center bg-neutral-200 text-neutral-400">
                    <Camera className="h-6 w-6" aria-hidden="true" />
                  </span>
                ) : (
                  <img
                    alt={listing.title}
                    className="h-full w-full object-cover"
                    decoding="async"
                    height="80"
                    loading="lazy"
                    onError={() => markImageBroken(image)}
                    sizes="96px"
                    src={image}
                    srcSet={getSrcSet(image)}
                    width="96"
                  />
                )}
              </button>
            ))}
          </div>
        ) : null}

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap gap-2">
            {listing.negotiable ? <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{t("listing.negotiable")}</span> : null}
            {listing.condition ? <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-700">{conditionLabel(listing.condition, t)}</span> : null}
          </div>
          <h1 className="font-sans text-2xl font-semibold leading-tight text-neutral-950">{sanitizeText(listing.title)}</h1>
          {listing.previousPrice && Number(listing.previousPrice) > Number(listing.price) ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-600">
              <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {t("listing.priceWas")} {formatPrice(listing.previousPrice, listing.currency)}
              </span>
            </div>
          ) : null}
          <p className="mt-3 font-display text-3xl font-bold text-primary">{formatPrice(listing.price, listing.currency)}</p>
          {isSold && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              <span className="text-sm font-medium text-red-700">{t("listing.soldBanner")}</span>
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-semibold text-neutral-500">
            <span>{t("listing.postedAgo", { time: postedText })}</span>
            <span className="flex items-center gap-1 text-xs text-neutral-400">
              <Hash className="h-2.5 w-2.5" aria-hidden="true" />
              {t("listing.id")}: {String(listing.id).slice(0, 8).toUpperCase()}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-4 w-4" aria-hidden="true" />
              {Number(listing.views || 0).toLocaleString()}
            </span>
            <button className="inline-flex items-center gap-1 text-primary" onClick={shareListing} type="button">
              <Share2 className="h-4 w-4" aria-hidden="true" />
              {t("listing.share")}
            </button>
            <button className="inline-flex items-center gap-1 text-primary" onClick={copyListingLink} type="button">
              <Copy className="h-4 w-4" aria-hidden="true" />
              {t("listing.copyLink")}
            </button>
            <button className="inline-flex items-center gap-1 text-primary" onClick={() => telegramShare(window.location.href, listing.title)} type="button">
              <Send className="h-4 w-4" aria-hidden="true" />
              {t("listing.telegramShare")}
            </button>
            <button aria-label={t("a11y.saveListing")} className="inline-flex items-center gap-1 text-primary" onClick={handleFavorite} type="button">
              <Bookmark className={cn("h-4 w-4", isFavorite ? "fill-primary" : "")} aria-hidden="true" />
              {isFavorite ? t("listing.saved") : t("dashboard.favorites")}
            </button>
            <button aria-label={t("dashboard.priceWatch")} className="inline-flex items-center gap-1 text-primary" onClick={handleWatchlist} type="button">
              <Eye className={cn("h-4 w-4", isWatching ? "fill-primary" : "")} aria-hidden="true" />
              {t("dashboard.priceWatch")}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-neutral-900">{t("listing.description")}</h2>
            {listing.descriptionKm ? (
              <div className="rounded-full bg-neutral-100 p-1">
                {["en", "km"].map((code) => (
                  <button
                    className={cn("rounded-full px-3 py-1 text-xs font-black", descriptionLanguage === code ? "bg-primary text-white" : "text-neutral-500")}
                    key={code}
                    onClick={() => setDescriptionLanguage(code)}
                    type="button"
                  >
                    {t(`lang.${code}`)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <p className="whitespace-pre-line leading-8 text-neutral-600">{shortDescription}</p>
          {description?.length > truncationLimit ? (
            <button className="mt-3 text-sm font-black text-primary" onClick={() => setDescriptionExpanded((value) => !value)} type="button">
              {descriptionExpanded ? t("listing.showLess") : t("listing.showMore")}
            </button>
          ) : null}
          <div className="mt-5 border-t border-neutral-100 pt-4">
            {/* Report button moved to contact section above */}
          </div>
        </section>

        {listing.facets && Object.keys(listing.facets).length ? (
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-neutral-900">{t("listing.specs")}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Object.entries(listing.facets).map(([key, value]) => {
                const Icon = facetIcons[key] || Tag
                return (
                  <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3" key={key}>
                    <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span className="text-sm font-bold text-neutral-500">{t(`facet.${key}`)}</span>
                    <span className="ml-auto text-sm font-black text-neutral-900">{String(value)}</span>
                  </div>
                )
              })}
            </div>
          </section>
        ) : null}

        {isVehicleListing ? (
          <div className="mt-6">
            <LoanCalculator defaultPrice={Number(listing.price) || 10000} currency={listing.currency} />
          </div>
        ) : null}

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-neutral-900">{hasListingCoordinates ? t("map.listingLocation") : t("listing.map")}</h2>
          {hasListingCoordinates ? (
            <Suspense fallback={<div className="mt-4 h-[220px] w-full animate-pulse rounded-xl bg-neutral-100 sm:h-[300px]" />}>
              <MapView
                className="mt-4 h-[220px] w-full rounded-xl sm:h-[300px]"
                interactive={false}
                lat={listing.lat}
                lng={listing.lng}
                markers={[{ id: listing.id, lat: listing.lat, lng: listing.lng, popup: listing.title }]}
                zoom={15}
              />
            </Suspense>
          ) : null}
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-neutral-500">
            <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
            {listing.location}
            {listing.district ? `, ${listing.district}` : ""}
          </p>
          {hasListingCoordinates ? <p className="mt-1 text-xs font-semibold text-neutral-400">{t("listing.approximateLocation")}</p> : null}
        </section>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <img
                src={listing.sellerAvatar || listing.seller?.avatarUrl || "fallback"}
                alt={`${t("a11y.sellerAvatar")} ${listing.sellerName || t("listing.seller")}`}
                className="h-14 w-14 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                  e.currentTarget.nextElementSibling?.style.removeProperty("display")
                }}
              />
              <div
                className="hidden h-14 w-14 place-items-center rounded-full bg-primary/10 text-lg font-black text-primary flex justify-center items-center"
                aria-hidden="true"
              >
                {String(listing.sellerName || t("listing.seller")).slice(0, 2).toUpperCase()}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-widest text-primary">{t("listing.seller")}</p>
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="truncate text-xl font-black text-neutral-900">{sanitizeText(listing.sellerName || t("listing.seller"))}</h2>
                {sellerReviewCount > 0 ? (
                  <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-xs font-black text-amber-700">
                    {sellerRating.toFixed(1)}
                  </span>
                ) : null}
              </div>
              {(listing.seller?.createdAt || listing.memberSince || listing.postedAt) ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-neutral-400">
                  <Calendar className="h-2.5 w-2.5" aria-hidden="true" />
                  {t("seller.memberSince")} {new Date(listing.seller?.createdAt || listing.memberSince || listing.postedAt).getFullYear()}
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {sellerIsPlusMember ? <Badge type="plus" /> : null}
            {sellerVerified ? <Badge type="verified" /> : null}
            {listing.phoneVerified ? <Badge type="phone-verified" /> : null}
            {listing.verified ? <Badge type="id-verified" /> : null}
            {sellerVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {t("seller.verified")}
              </span>
            ) : null}
            {listing.premium ? <Badge type="promoted" /> : null}
          </div>
          <div className="mt-4 grid gap-3 rounded-xl bg-neutral-50 p-3 text-sm font-semibold text-neutral-600">
            <Link className="inline-flex items-center gap-2 text-primary" to={sellerUrl(listing.seller || { id: listing.sellerId })}>
              <Store className="h-4 w-4" aria-hidden="true" />
              {listing.seller?.totalActiveListings || listing.totalListings || 1} {t("listing.activeListings")}
            </Link>
            <span className="inline-flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" aria-hidden="true" />
              {Number(followersCount).toLocaleString()} {t("social.followers")}
            </span>
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              {t("listing.responseTime")}: {listing.responseTime ? listing.responseTime : t("listing.responseTimeUnknown")}
            </span>
            {sellerConversationCount >= 3 ? (
              <span className="inline-flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" aria-hidden="true" />
                {t("seller.respondsPct", { pct: Math.round(sellerResponseRate) })}
              </span>
            ) : null}
            {sellerLastSeen ? (
              <span className="inline-flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" aria-hidden="true" />
                {sellerLastSeen}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              {sellerReviewCount > 0 ? (
                <>
                  <StarRating rating={sellerRating} />
                  {sellerReviewCount} {t("seller.reviews")}
                </>
              ) : (
                t("review.noReviews")
              )}
            </span>
          </div>
          <SafetyWarning className="mt-4" />
          <div id="listing-actions" className="mt-4 grid gap-2">
            {hasPhone ? (
                <PhoneReveal 
                  phone={phone} 
                  onReveal={handleRevealPhone} 
                />
            ) : (
              <span className="text-sm text-neutral-400">{t("listing.phoneNotProvided")}</span>
            )}
            {sellerIsPlusMember ? (
              <Button
                aria-label={hasPhone ? undefined : t("auth.noPhone")}
                disabled={!hasPhone || isSold}
                onClick={() => {
                  if (!hasPhone) return
                  if (!canPerformContact("WHATSAPP")) return
                  createLead(listing.id, buildLeadPayload("WHATSAPP", { phone: whatsappNumber }))
                  trackLead("WHATSAPP")
                  recordContact("WHATSAPP")
                  window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`, "_blank")
                }}
                title={hasPhone ? undefined : t("auth.noPhone")}
                variant="secondary"
              >
                {t("listing.whatsapp")}
              </Button>
            ) : null}
            {sellerIsPlusMember && telegramUsername ? (
              <Button
                disabled={isSold}
                onClick={() => {
                  if (!canPerformContact("TELEGRAM")) return
                  createLead(listing.id, buildLeadPayload("TELEGRAM", { message: listing.title }))
                  trackLead("TELEGRAM")
                  recordContact("TELEGRAM")
                  window.open(`https://t.me/${String(telegramUsername).replace(/^@/, "")}`, "_blank")
                }}
                variant="secondary"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                {t("listing.telegram")}
              </Button>
            ) : null}
            {listing.facebookPage ? (
              <Button disabled={isSold} onClick={() => window.open(`https://m.me/${listing.facebookPage}`, "_blank")} variant="secondary">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {t("listing.messenger")}
              </Button>
            ) : null}
            {!isSeller ? (
              <Button onClick={handleFollowSeller} variant={isFollowingSeller ? "secondary" : "primary"}>
                {isFollowingSeller ? t("social.following") : t("social.follow")}
              </Button>
            ) : null}
            {!isSeller ? (
              <Button disabled={isSold} onClick={sendMessage} variant="secondary">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {t("messaging.sendMessage")}
              </Button>
            ) : null}
            {isSeller ? (
              <Button
                disabled={isSold || isBumpedToday || !sellerIsPlusMember}
                onClick={handleBumpListing}
                title={!sellerIsPlusMember ? t("plus.plusRequired") : undefined}
                variant={sellerIsPlusMember ? "primary" : "secondary"}
              >
                {isBumpedToday ? t("bump.bumpedToday") : t("bump.bumpToTop")}
              </Button>
            ) : null}

            {/* Safety Messaging */}
            <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-600" />
                <div>
                  <h4 className="text-sm font-black text-amber-900">{t("listing.safetyTitle")}</h4>
                  <ul className="mt-2 space-y-1.5 text-xs font-bold text-amber-800">
                    <li>• {t("listing.safetyTip1")}</li>
                    <li>• {t("listing.safetyTip2")}</li>
                    <li>• {t("listing.safetyTip3")}</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button disabled={isSold} onClick={sendQuickAsk} variant="ghost">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {t("listing.quickAsk")}
            </Button>
            <Button disabled={isSold} onClick={() => setOfferOpen(true)} variant="secondary">
              {t("listing.makeOffer")}
            </Button>
            {!isSeller ? (
              <Button
                disabled={isSold}
                onClick={() => {
                  if (!requireAuth({ type: "review", listingId: listing.id, sellerId })) return
                  setReviewOpen(true)
                }}
                variant="secondary"
              >
                <Star className="h-4 w-4" aria-hidden="true" />
                {t("seller.leaveReview")}
              </Button>
            ) : null}
            <div className="mt-2 border-t border-neutral-100 pt-3">
              <Button
                onClick={handleOpenReport}
                size="sm"
                variant="ghost"
                className="w-full justify-start text-neutral-500 hover:text-neutral-700"
              >
                <Flag className="h-4 w-4" aria-hidden="true" />
                {t("listing.reportListing")}
              </Button>
            </div>
          </div>
        </section>
      </aside>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title={t("listing.share")} size="md">
        <div className="grid gap-4">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <img alt={listing.title} className="aspect-video w-full object-cover" loading="lazy" src={activeImageUrl} />
            <div className="p-4">
              <p className="text-xs font-black uppercase tracking-widest text-primary">{t("app.name")}</p>
              <h3 className="mt-1 text-lg font-black text-neutral-900">{sanitizeText(listing.title)}</h3>
              <p className="mt-2 text-xl font-black text-primary">{formatPrice(listing.price, listing.currency)}</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Button onClick={copyListingLink} type="button" variant="secondary">
              <Copy className="h-4 w-4" aria-hidden="true" />
              {t("listing.copyLink")}
            </Button>
            <Button onClick={() => telegramShare(window.location.href, listing.title)} type="button" variant="secondary">
              <Send className="h-4 w-4" aria-hidden="true" />
              {t("listing.telegramShare")}
            </Button>
            <Button
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank", "noopener,noreferrer")}
              type="button"
              variant="secondary"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              {t("listing.facebook")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={lightboxOpen} onClose={() => setLightboxOpen(false)} title={listing.title} size="xl">
        <div 
          className="relative outline-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ userSelect: 'none', touchAction: 'pan-y' }}
          tabIndex={-1}
        >
          {/* Counter Badge */}
          <div className="absolute right-4 top-4 z-10 rounded-full bg-black/60 px-3 py-1 text-sm font-bold tracking-widest text-white backdrop-blur-md">
            {activeImage + 1} / {images.length}
          </div>

          {brokenImages[activeImageUrl] ? (
            <div className="grid min-h-80 w-full place-items-center rounded-2xl bg-neutral-200 text-neutral-400">
              <Camera className="h-12 w-12" aria-hidden="true" />
            </div>
          ) : (
            <img
              alt={listing.title}
              className="max-h-[76vh] w-full rounded-2xl object-contain select-none pointer-events-none"
              decoding="async"
              height="900"
              loading="lazy"
              onError={() => markImageBroken(activeImageUrl)}
              sizes="100vw"
              src={activeImageUrl}
              srcSet={getSrcSet(activeImageUrl)}
              width="1200"
            />
          )}
          
          <button
            aria-label={t("listing.previousImage")}
            className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-neutral-900 shadow hover:bg-white sm:grid"
            onClick={() => setActiveImage((value) => (value - 1 + images.length) % images.length)}
            type="button"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          
          <button
            aria-label={t("listing.nextImage")}
            className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-neutral-900 shadow hover:bg-white sm:grid"
            onClick={() => setActiveImage((value) => (value + 1) % images.length)}
            type="button"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Dots Indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  aria-label={t("hero.goToSlide", { number: index + 1 })}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    index === activeImage ? "bg-white w-4" : "bg-white/40 hover:bg-white/60"
                  }`}
                  onClick={() => setActiveImage(index)}
                  type="button"
                />
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title={t("listing.reportTitle")} size="sm">
        <form className="grid gap-3" onSubmit={submitReport}>
          {reportReasons.map((value) => {
            const labels = {
              SCAM: t("report.scam"),
              WRONG_CATEGORY: t("report.wrongCategory"),
              DUPLICATE: t("report.duplicate"),
              INAPPROPRIATE: t("report.offensive"),
              OTHER: t("report.other"),
            }
            return (
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700" key={value}>
                <input
                  checked={selectedReason === value}
                  className="accent-primary"
                  onChange={() => setSelectedReason(value)}
                  type="radio"
                />
                {labels[value]}
              </label>
            )
          })}
          <label className="grid gap-2 text-sm font-bold text-neutral-700">
            {t("report.detail")}
            <textarea
              className="min-h-24 rounded-xl border border-neutral-200 p-3 outline-none focus:border-primary"
              maxLength={500}
              onChange={(event) => setReportDetail(event.target.value)}
              placeholder={t("report.detail")}
              value={reportDetail}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-neutral-700">
            {t("report.evidenceUrl")}
            <input
              className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary"
              onChange={(event) => setEvidenceUrl(event.target.value)}
              type="url"
              value={evidenceUrl}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-neutral-700">
            {t("report.contactEmail")}
            <input
              className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary"
              onChange={(event) => setContactEmail(event.target.value)}
              type="email"
              value={contactEmail}
            />
          </label>
          <Button disabled={isSubmittingReport} loading={isSubmittingReport} type="submit">{t("report.submit")}</Button>
        </form>
      </Modal>

      <Modal open={offerOpen} onClose={() => setOfferOpen(false)} title={t("listing.offerTitle")} size="sm">
        <form className="grid gap-3" onSubmit={submitOffer}>
          <label className="grid gap-2 text-sm font-bold text-neutral-700">
            {t("listing.offerPrice")}
            <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" onChange={(event) => setOffer((current) => ({ ...current, price: event.target.value }))} type="number" value={offer.price} />
          </label>
          <label className="grid gap-2 text-sm font-bold text-neutral-700">
            {t("listing.offerMessage")}
            <textarea className="min-h-24 rounded-xl border border-neutral-200 p-3 outline-none focus:border-primary" onChange={(event) => setOffer((current) => ({ ...current, message: event.target.value }))} value={offer.message} />
          </label>
          <Button disabled={isSubmittingOffer} loading={isSubmittingOffer} type="submit">{t("listing.submitOffer")}</Button>
        </form>
      </Modal>
      <ReviewModal listingId={listing.id} onClose={() => setReviewOpen(false)} open={reviewOpen} sellerId={sellerId} />
      <MessageModal listing={listing} onClose={() => setMessageModalOpen(false)} open={messageModalOpen} />
    </article>
  )
}

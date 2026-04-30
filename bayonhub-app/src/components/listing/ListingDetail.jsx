import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react"
import gsap from "gsap"
import { formatDistanceToNow } from "date-fns"
import { Link, useNavigate } from "react-router-dom"
import {
  BadgeCheck,
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
  Phone,
  Send,
  Share2,
  Star,
  Store,
  Tag,
  TrendingDown,
} from "lucide-react"
import toast from "react-hot-toast"
import { useTranslation } from "../../hooks/useTranslation"
import { CATEGORIES } from "../../lib/categories"
import { rateLimiter } from "../../lib/rateLimiter"
import { cn, formatPrice, getListingImage, telegramShare, timeAgo } from "../../lib/utils"
import { buildLeadPayload } from "../../lib/validation"
import { useAuthStore } from "../../store/useAuthStore"
import { useListingStore } from "../../store/useListingStore"
import { useUIStore } from "../../store/useUIStore"
import Badge from "../ui/Badge"
import Breadcrumb from "../ui/Breadcrumb"
import Button from "../ui/Button"
import LoanCalculator from "../ui/LoanCalculator"
import Modal from "../ui/Modal"
import SafetyWarning from "../ui/SafetyWarning"
import StarRating from "../ui/StarRating"

const MapView = lazy(() => import("../ui/MapView"))

const reportReasons = [
  "SCAM",
  "WRONG_CATEGORY",
  "INAPPROPRIATE",
  "SPAM",
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

function maskedPhone(phone) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, "")
  return phone.replace(digits.slice(-4), "xxxx")
}

export default function ListingDetail({ listing }) {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const images = useMemo(() => normalizeImages(listing), [listing])
  const [activeImage, setActiveImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [phoneRevealed, setPhoneRevealed] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [selectedReason, setSelectedReason] = useState("SCAM")
  const [reportDetail, setReportDetail] = useState("")
  const [evidenceUrl, setEvidenceUrl] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [offerOpen, setOfferOpen] = useState(false)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [descriptionLanguage, setDescriptionLanguage] = useState(language)
  const [offer, setOffer] = useState({ price: "", message: "" })
  const mainImageRef = useRef(null)
  const createLead = useListingStore((state) => state.createLead)
  const reportListing = useListingStore((state) => state.reportListing)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const setPendingAction = useUIStore((state) => state.setPendingAction)
  const phone = listing.phone || null
  const hasPhone = Boolean(phone)
  const category = findCategoryForListing(listing)
  const subcategory = category?.subcategories.find((item) => item.label.en === listing.subcategory)
  const isVehicleListing =
    listing.categorySlug === "vehicles" ||
    listing.subcategorySlug === "cars" ||
    category?.slug === "vehicles" ||
    subcategory?.slug === "cars"
  const description = descriptionLanguage === "km" && listing.descriptionKm ? listing.descriptionKm : listing.description
  const shortDescription =
    !descriptionExpanded && description?.length > 300
      ? `${description.slice(0, 300)}${t("ui.ellipsis")}`
      : description
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

  async function shareListing() {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: listing.title, text: listing.description, url })
      return
    }
    await navigator.clipboard?.writeText(url)
    toast.success(t("listing.shareCopied"))
  }

  async function copyListingLink() {
    await navigator.clipboard?.writeText(window.location.href)
    toast.success(t("listing.linkCopied"))
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
    recordContact("CHAT")
    toast.success(t("listing.quickAskSent"))
  }

  function sendMessage() {
    if (!canPerformContact("CHAT")) return
    if (!isAuthenticated) {
      setPendingAction({ type: "message", listingId: listing.id })
      toggleAuthModal(true)
      return
    }
    createLead(listing.id, buildLeadPayload("CHAT", { message: t("listing.quickAskMessage") }))
    recordContact("CHAT")
    navigate("/dashboard")
  }

  function handleRevealPhone() {
    if (!hasPhone) return
    if (!canPerformContact("CALL")) return
    setPhoneRevealed(true)
    createLead(listing.id, buildLeadPayload("CALL", { phone }))
    recordContact("CALL")
    toast.success(t("listing.phoneRevealed"))
  }

  function handleOpenReport() {
    if (!isAuthenticated) {
      setPendingAction({ type: "report", listingId: listing.id })
      toggleAuthModal(true)
      return
    }
    setReportOpen(true)
  }

  async function submitReport(event) {
    event.preventDefault()
    if (reportDetail.trim() && reportDetail.trim().length < 20) {
      toast.error(t("ui.error"))
      return
    }
    if (evidenceUrl.trim()) {
      try {
        new URL(evidenceUrl)
      } catch {
        toast.error(t("ui.error"))
        return
      }
    }
    const reportPayload = {
      reason: selectedReason,
      detail: reportDetail,
      evidenceUrl: evidenceUrl || null,
      contactEmail: contactEmail || null,
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
  }

  function submitOffer(event) {
    event.preventDefault()
    if (!canPerformContact("OFFER")) return
    try {
      createLead(listing.id, buildLeadPayload("OFFER", { offerPrice: offer.price, message: offer.message }))
      recordContact("OFFER")
    } catch {
      toast.error(t("post.validationPrice"))
      return
    }
    setOfferOpen(false)
    toast.success(t("ui.success"))
  }

  return (
    <article className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0 space-y-6">
        <Breadcrumb crumbs={crumbs} />
        <div className="relative overflow-hidden rounded-2xl bg-neutral-100">
          <button className="block w-full" onClick={() => setLightboxOpen(true)} type="button">
            <img
              ref={mainImageRef}
              alt={listing.title}
              className="aspect-[4/3] w-full object-cover"
              src={images[activeImage]}
            />
            <span className="sr-only">{t("listing.zoomImage")}</span>
          </button>
          <span className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-black text-white">
            {t("listing.imageCount", { current: activeImage + 1, total: images.length })}
          </span>
        </div>
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
              <img alt={listing.title} className="h-full w-full object-cover" loading="lazy" src={image} />
            </button>
          ))}
        </div>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap gap-2">
            {listing.negotiable ? <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{t("listing.negotiable")}</span> : null}
            {listing.condition ? <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-700">{listing.condition}</span> : null}
          </div>
          <h1 className="font-sans text-2xl font-semibold leading-tight text-neutral-950">{listing.title}</h1>
          {listing.previousPrice && Number(listing.previousPrice) > Number(listing.price) ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-600">
              <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {t("listing.priceWas")} {formatPrice(listing.previousPrice, listing.currency)}
              </span>
            </div>
          ) : null}
          <p className="mt-3 font-display text-3xl font-bold text-primary">{formatPrice(listing.price, listing.currency)}</p>
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
          {description?.length > 300 ? (
            <button className="mt-3 text-sm font-black text-primary" onClick={() => setDescriptionExpanded((value) => !value)} type="button">
              {descriptionExpanded ? t("listing.showLess") : t("listing.showMore")}
            </button>
          ) : null}
          <div className="mt-5 border-t border-neutral-100 pt-4">
            <Button onClick={handleOpenReport} size="sm" variant="ghost">
              <Flag className="h-4 w-4" aria-hidden="true" />
              {t("listing.reportListing")}
            </Button>
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
          <h2 className="text-xl font-black text-neutral-900">{t("listing.map")}</h2>
          <Suspense fallback={<div className="mt-4 h-48 w-full animate-pulse rounded-xl bg-neutral-100" />}>
            <MapView
              className="mt-4 h-48 w-full rounded-xl"
              interactive={false}
              lat={listing.lat || 11.5564}
              lng={listing.lng || 104.9282}
              markers={listing.lat && listing.lng ? [{ id: listing.id, lat: listing.lat, lng: listing.lng, popup: listing.location }] : []}
              zoom={listing.lat && listing.lng ? 15 : 7}
            />
          </Suspense>
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-neutral-500">
            <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
            {listing.location}
            {listing.district ? `, ${listing.district}` : ""}
          </p>
          <p className="mt-1 text-xs font-semibold text-neutral-400">{t("listing.approximateLocation")}</p>
        </section>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary/10 text-lg font-black text-primary">
              {String(listing.sellerName || t("listing.seller")).slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-widest text-primary">{t("listing.seller")}</p>
              <h2 className="truncate text-xl font-black text-neutral-900">{listing.sellerName}</h2>
              {(listing.seller?.createdAt || listing.memberSince || listing.postedAt) ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-neutral-400">
                  <Calendar className="h-2.5 w-2.5" aria-hidden="true" />
                  {t("seller.memberSince")} {new Date(listing.seller?.createdAt || listing.memberSince || listing.postedAt).getFullYear()}
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {listing.phoneVerified ? <Badge type="phone-verified" /> : null}
            {listing.verified ? <Badge type="id-verified" /> : null}
            {listing.premium ? <Badge type="promoted" /> : null}
          </div>
          <div className="mt-4 grid gap-3 rounded-xl bg-neutral-50 p-3 text-sm font-semibold text-neutral-600">
            <Link className="inline-flex items-center gap-2 text-primary" to={`/seller/${listing.sellerId}`}>
              <Store className="h-4 w-4" aria-hidden="true" />
              {listing.totalListings || 1} {t("listing.activeListings")}
            </Link>
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              {t("listing.responseTime")}: {listing.responseTime ? listing.responseTime : t("listing.responseTimeUnknown")}
            </span>
            <span className="inline-flex items-center gap-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              <StarRating rating={listing.sellerRating || listing.seller?.rating || 4} />
            </span>
          </div>
          <SafetyWarning className="mt-4" />
          <div id="listing-actions" className="mt-4 grid gap-2">
            {hasPhone ? (
              phoneRevealed ? (
                <a className="font-mono font-bold text-primary" href={`tel:${phone}`}>
                  {phone}
                </a>
              ) : (
                <Button onClick={handleRevealPhone}>
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {maskedPhone(phone)} - {t("listing.showPhone")}
                </Button>
              )
            ) : (
              <span className="text-sm text-neutral-400">{t("listing.phoneNotProvided")}</span>
            )}
            <Button
              aria-label={hasPhone ? undefined : t("auth.noPhone")}
              disabled={!hasPhone}
              onClick={() => {
                if (!hasPhone) return
                if (!canPerformContact("WHATSAPP")) return
                createLead(listing.id, buildLeadPayload("WHATSAPP", { phone }))
                recordContact("WHATSAPP")
                window.open(`https://wa.me/${phone.replace(/\D/g, "")}`, "_blank")
              }}
              title={hasPhone ? undefined : t("auth.noPhone")}
              variant="secondary"
            >
              {t("listing.whatsapp")}
            </Button>
            <Button
              onClick={() => {
                if (!canPerformContact("TELEGRAM")) return
                createLead(listing.id, buildLeadPayload("TELEGRAM", { message: listing.title }))
                recordContact("TELEGRAM")
                telegramShare(window.location.href, listing.title)
              }}
              variant="secondary"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {t("listing.telegram")}
            </Button>
            {listing.facebookPage ? (
              <Button onClick={() => window.open(`https://m.me/${listing.facebookPage}`, "_blank")} variant="secondary">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {t("listing.messenger")}
              </Button>
            ) : null}
            <Button onClick={sendMessage} variant="secondary">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {t("listing.sendMessage")}
            </Button>
            <Button onClick={sendQuickAsk} variant="ghost">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {t("listing.quickAsk")}
            </Button>
            <Button onClick={() => setOfferOpen(true)} variant="secondary">
              {t("listing.makeOffer")}
            </Button>
            <Button onClick={handleOpenReport} variant="ghost">
              <Flag className="h-4 w-4" aria-hidden="true" />
              {t("listing.reportListing")}
            </Button>
          </div>
        </section>
      </aside>

      <Modal open={lightboxOpen} onClose={() => setLightboxOpen(false)} title={listing.title} size="xl">
        <div className="relative">
          <img alt={listing.title} className="max-h-[76vh] w-full rounded-2xl object-contain" src={images[activeImage]} />
          <button
            aria-label={t("listing.previousImage")}
            className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-neutral-900 shadow"
            onClick={() => setActiveImage((value) => (value - 1 + images.length) % images.length)}
            type="button"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            aria-label={t("listing.nextImage")}
            className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-neutral-900 shadow"
            onClick={() => setActiveImage((value) => (value + 1) % images.length)}
            type="button"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </Modal>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title={t("listing.reportTitle")} size="sm">
        <form className="grid gap-3" onSubmit={submitReport}>
          {reportReasons.map((value) => {
            const labels = {
              SCAM: t("report.scam"),
              WRONG_CATEGORY: t("report.wrongCategory"),
              INAPPROPRIATE: t("report.inappropriate"),
              SPAM: t("report.spam"),
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
          <Button type="submit">{t("report.submit")}</Button>
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
          <Button type="submit">{t("listing.submitOffer")}</Button>
        </form>
      </Modal>
    </article>
  )
}

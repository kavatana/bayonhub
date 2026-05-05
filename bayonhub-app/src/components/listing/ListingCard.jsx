import { memo, useRef } from "react"
import { useGSAP } from "@gsap/react"
import { Link } from "react-router-dom"
import { Camera, Heart, MapPin, Share2, TrendingDown } from "lucide-react"
import { useTranslation } from "../../hooks/useTranslation"
import { cardHover } from "../../lib/animations"
import { getPromotionState, isPromotedListing, PROMOTION_LABELS } from "../../lib/promotionStates"
import { cn, formatPrice, getListingImage, getSrcSet, listingUrl, timeAgo } from "../../lib/utils"
import { sanitizeText } from "../../lib/sanitize"
import { useListingStore } from "../../store/useListingStore"
import { useAuthStore } from "../../store/useAuthStore"
import { useUIStore } from "../../store/useUIStore"
import Badge from "../ui/Badge"
import StarRating from "../ui/StarRating"

function ListingCard({ listing }) {
  const cardRef = useRef(null)
  const { t, language } = useTranslation()
  const saved = useListingStore((state) => state.savedIds.includes(listing?.id || ""))
  const toggleSaved = useListingStore((state) => state.toggleSaved)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const setPendingAction = useUIStore((state) => state.setPendingAction)
  
  useGSAP(() => cardHover(cardRef), { scope: cardRef })

  if (!listing) return null
  const image = getListingImage(listing)
  const imageCount = Array.isArray(listing.images) ? listing.images.length : 0
  const hasPriceDrop = Number(listing.previousPrice || 0) > Number(listing.price || 0)
  const discountPercent = hasPriceDrop
    ? Math.round(((listing.previousPrice - listing.price) / listing.previousPrice) * 100)
    : 0
  const promotionState = getPromotionState(listing)
  const promotionLabel = PROMOTION_LABELS[promotionState]?.[language]
  const promoted = isPromotedListing(listing)

  async function shareListing(event) {
    event.preventDefault()
    const url = `${window.location.origin}${listingUrl(listing)}`
    if (navigator.share) {
      await navigator.share({ title: sanitizeText(listing.title), text: sanitizeText(listing.description), url })
    } else {
      await navigator.clipboard?.writeText(url)
    }
  }

  return (
    <article
      ref={cardRef}
      className={cn(
        // Base — clean white card with warm hover shadow + subtle lift
        "group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white",
        "shadow-sm transition-all duration-300",
        "hover:shadow-[0_12px_40px_-8px_rgba(229,57,53,0.18)] hover:-translate-y-0.5",
        "dark:bg-neutral-800 dark:border-neutral-700",
        // Promoted — gold left-bar accent instead of broken glass-card
        promoted && "border-amber-300/60 shadow-[0_4px_20px_-4px_rgba(251,191,36,0.25)] dark:border-amber-500/30",
      )}
    >
      {/* Promoted accent bar */}
      {promoted && (
        <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-amber-400 to-amber-300/30 z-10" />
      )}

      <Link to={listingUrl(listing)} className="block">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-700">
          <img
            alt={sanitizeText(listing.title)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            src={image}
            srcSet={getSrcSet(image)}
          />
          {/* Price pill — top right */}
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-sm font-black text-primary shadow-md backdrop-blur-sm dark:bg-neutral-900/90 dark:text-primary">
            {formatPrice(listing.price, listing.currency, language)}
          </span>
          {/* Badges — top left */}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            <div className="flex flex-wrap gap-1.5">
              {listing.urgent ? <Badge label={t("listing.urgent")} type="urgent" /> : null}
              {promoted ? <Badge label={promotionLabel} type="promoted" /> : null}
            </div>
            {hasPriceDrop && discountPercent > 0 ? (
              <span className="rounded-lg bg-red-600 px-2 py-1 text-xs font-black text-white shadow">
                -{discountPercent}%
              </span>
            ) : null}
          </div>
          {/* Photo count — bottom left */}
          {imageCount > 1 ? (
            <span
              aria-label={t("listing.imageCountPhotos", { count: imageCount })}
              className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white backdrop-blur-sm"
            >
              <Camera className="h-2.5 w-2.5" aria-hidden="true" />
              {imageCount}
            </span>
          ) : null}
          {/* Hover gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
        </div>

        {/* Body */}
        <div className="space-y-2.5 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 min-h-12 text-base font-bold leading-6 text-neutral-900 dark:text-neutral-100">
              {sanitizeText(listing.title)}
            </h3>
            {/* Save / heart button */}
            <button
              aria-label={saved ? t("listing.saved") : t("listing.save")}
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-all duration-200",
                saved
                  ? "border-primary/30 bg-primary/5 text-primary shadow-[0_0_8px_rgba(229,57,53,0.2)]"
                  : "border-neutral-200 text-neutral-400 hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
              )}
              onClick={(event) => {
                event.preventDefault()
                if (!isAuthenticated) {
                  setPendingAction({ type: "save", listingId: listing.id })
                  toggleAuthModal(true)
                  return
                }
                toggleSaved(listing.id, listing)
              }}
              type="button"
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-transform duration-200 active:scale-90",
                  saved ? "fill-primary text-primary scale-110" : "",
                )}
              />
            </button>
          </div>

          {/* Price drop */}
          {hasPriceDrop ? (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-neutral-400 line-through">
                {formatPrice(listing.previousPrice, listing.currency, language)}
              </span>
              <span className="flex items-center gap-0.5 font-semibold text-emerald-600">
                <TrendingDown className="h-3 w-3" aria-hidden="true" />
                {t("listing.priceDropAlert")}
              </span>
            </div>
          ) : null}

          {/* Seller row */}
          <div className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-300">
            <span className="truncate font-semibold text-neutral-700 dark:text-neutral-300">
              {sanitizeText(listing.sellerName || t("listing.seller"))}
            </span>
            {(listing.seller?.verificationTier === "PHONE" ||
              listing.seller?.verificationTier === "IDENTITY" ||
              listing.phoneVerified) ? (
              <Badge
                className="origin-left scale-75"
                type={listing.seller?.verificationTier === "IDENTITY" ? "id-verified" : "phone-verified"}
              />
            ) : null}
            {listing.topSeller ? <Badge className="origin-left scale-75" type="top-seller" /> : null}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-300">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {listing.location}
              {listing.district ? `, ${listing.district}` : ""}
            </span>
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between gap-3 border-t border-neutral-100 pt-2.5 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-300">
            <div className="flex items-center gap-3">
              <span className="text-xs">{timeAgo(listing.postedAt, language)}</span>
              <span className="text-xs">
                {Number(listing.views || 0).toLocaleString()} {t("listing.views")}
              </span>
            </div>
            <button
              aria-label={t("listing.share")}
              className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-500 transition hover:border-primary/40 hover:text-primary"
              onClick={shareListing}
              type="button"
            >
              <Share2 className="h-3 w-3" aria-hidden="true" />
              {t("listing.share")}
            </button>
          </div>
          <StarRating rating={listing.sellerRating} />
        </div>
      </Link>
    </article>
  )
}

export default memo(ListingCard)

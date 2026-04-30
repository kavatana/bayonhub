import { memo, useRef } from "react"
import { useGSAP } from "@gsap/react"
import { Link } from "react-router-dom"
import { Camera, Heart, MapPin, Share2, TrendingDown } from "lucide-react"
import { useTranslation } from "../../hooks/useTranslation"
import { cardHover } from "../../lib/animations"
import { getPromotionState, isPromotedListing, PROMOTION_LABELS } from "../../lib/promotionStates"
import { cn, formatPrice, getListingImage, getListingSlug, getSrcSet, timeAgo } from "../../lib/utils"
import { useListingStore } from "../../store/useListingStore"
import { useAuthStore } from "../../store/useAuthStore"
import { useUIStore } from "../../store/useUIStore"
import Badge from "../ui/Badge"
import StarRating from "../ui/StarRating"

function ListingCard({ listing }) {
  const cardRef = useRef(null)
  const { t, language } = useTranslation()
  const savedIds = useListingStore((state) => state.savedIds)
  const toggleSaved = useListingStore((state) => state.toggleSaved)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const setPendingAction = useUIStore((state) => state.setPendingAction)
  const saved = savedIds.includes(listing.id)
  const image = getListingImage(listing)
  const imageCount = Array.isArray(listing.images) ? listing.images.length : 0
  const hasPriceDrop = Number(listing.previousPrice || 0) > Number(listing.price || 0)
  const discountPercent = hasPriceDrop
    ? Math.round(((listing.previousPrice - listing.price) / listing.previousPrice) * 100)
    : 0
  const promotionState = getPromotionState(listing)
  const promotionLabel = PROMOTION_LABELS[promotionState]?.[language]
  const promoted = isPromotedListing(listing)

  useGSAP(() => cardHover(cardRef), { scope: cardRef })

  async function shareListing(event) {
    event.preventDefault()
    const url = `${window.location.origin}/listing/${listing.id}/${getListingSlug(listing)}`
    if (navigator.share) {
      await navigator.share({ title: listing.title, text: listing.description, url })
    } else {
      await navigator.clipboard?.writeText(url)
    }
  }

  return (
    <article
      ref={cardRef}
      className={cn(
        "group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition duration-300 hover:shadow-xl dark:bg-neutral-800 dark:border-neutral-700",
        promoted && "glass-card",
      )}
    >
      <Link to={`/listing/${listing.id}/${getListingSlug(listing)}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
          <img
            alt={listing.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
            src={image}
            srcSet={getSrcSet(image)}
          />
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-sm font-black text-primary shadow dark:text-neutral-300">
            {formatPrice(listing.price, listing.currency)}
          </span>
          <div className="absolute left-3 top-3 flex flex-col items-start gap-2">
            <div className="flex flex-wrap gap-2">
              {listing.urgent ? <Badge label={t("listing.urgent")} type="urgent" /> : null}
              {promoted ? <Badge label={promotionLabel} type="promoted" /> : null}
            </div>
            {hasPriceDrop && discountPercent > 0 ? (
              <span className="rounded bg-red-600 px-2 py-1 text-xs font-black text-white shadow">
                -{discountPercent}%
              </span>
            ) : null}
          </div>
          {imageCount > 1 ? (
            <span
              aria-label={t("listing.imageCountPhotos", { count: imageCount })}
              className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white"
            >
              <Camera className="h-2.5 w-2.5" aria-hidden="true" />
              {imageCount}
            </span>
          ) : null}
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 min-h-12 text-base font-bold leading-6 text-neutral-900 dark:text-neutral-100">
              {listing.title}
            </h3>
            <button
              aria-label={saved ? t("listing.saved") : t("listing.save")}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-neutral-200 text-neutral-500 transition hover:border-primary hover:text-primary"
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
              <Heart className={saved ? "h-5 w-5 fill-primary text-primary" : "h-5 w-5"} />
            </button>
          </div>
          {hasPriceDrop ? (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-neutral-400 line-through">
                {formatPrice(listing.previousPrice, listing.currency)}
              </span>
              <span className="flex items-center gap-0.5 font-medium text-green-600">
                <TrendingDown className="h-2.5 w-2.5" aria-hidden="true" />
                {t("listing.priceDropAlert")}
              </span>
            </div>
          ) : null}
          <div className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-300">
            <span className="truncate font-semibold text-neutral-700 dark:text-neutral-300">{listing.sellerName || t("listing.seller")}</span>
            {(listing.seller?.verificationTier === "PHONE" || listing.seller?.verificationTier === "IDENTITY" || listing.phoneVerified) ? (
              <Badge
                className="origin-left scale-75"
                type={listing.seller?.verificationTier === "IDENTITY" ? "id-verified" : "phone-verified"}
              />
            ) : null}
            {listing.topSeller ? <Badge className="origin-left scale-75" type="top-seller" /> : null}
          </div>
          <div className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-300">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <span>
              {listing.location}
              {listing.district ? `, ${listing.district}` : ""}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm text-neutral-500 dark:text-neutral-300">
            <span>{timeAgo(listing.postedAt, language)}</span>
            <span>
              {Number(listing.views || 0).toLocaleString()} {t("listing.views")}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <StarRating rating={listing.sellerRating} />
            </div>
            <button
              aria-label={t("listing.share")}
              className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:border-primary hover:text-primary"
              onClick={shareListing}
              type="button"
            >
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t("listing.share")}
            </button>
          </div>
        </div>
      </Link>
    </article>
  )
}

export default memo(ListingCard)

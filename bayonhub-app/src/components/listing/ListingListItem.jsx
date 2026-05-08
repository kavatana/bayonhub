import { memo, useState } from "react"
import { Link } from "react-router-dom"
import { BadgeCheck, Camera, MapPin } from "lucide-react"
import { useTranslation } from "../../hooks/useTranslation"
import { formatPrice, getImageSizes, getListingImage, getSrcSet, listingUrl, timeAgo } from "../../lib/utils"
import { useListingStore } from "../../store/useListingStore"
import { useAuthStore } from "../../store/useAuthStore"
import { useUIStore } from "../../store/useUIStore"
import Badge from "../ui/Badge"
import HeartButton from "../ui/HeartButton"

function Highlight({ text, query }) {
  if (!query?.trim()) return text
  const index = text.toLowerCase().indexOf(query.toLowerCase())
  if (index === -1) return text
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-yellow-200 px-0.5 text-neutral-950">{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  )
}

const ListingListItem = memo(function ListingListItem({ listing, highlightQuery = "" }) {
  const { t, language } = useTranslation()
  const saved = useListingStore((state) => state.savedIds.includes(listing.id))
  const toggleSaved = useListingStore((state) => state.toggleSaved)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const setPendingAction = useUIStore((state) => state.setPendingAction)
  const image = getListingImage(listing)
  const [imageBroken, setImageBroken] = useState(false)
  const sellerIsPlusMember = Boolean(listing.isPlusMember || listing.seller?.isPlusMember)
  const sellerVerified = Boolean(listing.isVerifiedSeller || listing.seller?.isVerifiedSeller || listing.verified)

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm transition hover:border-primary">
      <div className="flex gap-3">
        <Link className="shrink-0" to={listingUrl(listing)}>
          {imageBroken ? (
            <div className="grid h-[90px] w-[120px] place-items-center rounded-xl bg-neutral-200 text-neutral-400">
              <Camera className="h-8 w-8" aria-hidden="true" />
            </div>
          ) : (
            <img
              alt={listing.title}
              className="h-[90px] w-[120px] rounded-xl object-cover"
              decoding="async"
              height="90"
              loading="lazy"
              onError={() => setImageBroken(true)}
              sizes={getImageSizes()}
              src={image}
              srcSet={getSrcSet(image)}
              width="120"
            />
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex gap-3">
            <Link className="min-w-0 flex-1" to={listingUrl(listing)}>
              <h3 className="line-clamp-2 text-sm font-black leading-5 text-neutral-900 sm:text-base">
                <Highlight query={highlightQuery} text={listing.title} />
              </h3>
            </Link>
            <HeartButton
              saved={saved}
              size="sm"
              onToggle={(event) => {
                event.preventDefault()
                if (!isAuthenticated) {
                  setPendingAction({ type: "save", listingId: listing.id })
                  toggleAuthModal(true)
                  return
                }
                toggleSaved(listing.id, listing)
              }}
            />
          </div>
          <p className="mt-1 text-lg font-black text-primary">{formatPrice(listing.price, listing.currency, language)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {listing.location}
            </span>
            <span>{timeAgo(listing.postedAt, language)}</span>
            {listing.condition ? (
              <span className="rounded-full bg-neutral-100 px-2 py-1 text-neutral-700">{listing.condition}</span>
            ) : null}
            {listing.verified ? (
              <span className="inline-flex items-center gap-1 text-primary">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {t("auth.verified")}
              </span>
            ) : null}
            {sellerIsPlusMember ? <Badge className="origin-left scale-75" type="plus" /> : null}
            {sellerVerified ? <Badge className="origin-left scale-75" type="verified" /> : null}
          </div>
        </div>
      </div>
    </article>
  )
})

export default ListingListItem

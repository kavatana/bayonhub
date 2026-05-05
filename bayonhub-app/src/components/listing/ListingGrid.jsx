
import { SearchX } from "lucide-react"
import { useTranslation } from "../../hooks/useTranslation"
import { useUIStore } from "../../store/useUIStore"
import Button from "../ui/Button"
import ListingCard from "./ListingCard"
import SellCTACard from "./SellCTACard"


function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <div className="aspect-[4/3] bg-neutral-200" />
      <div className="space-y-3 p-4">
        <div className="h-5 rounded bg-neutral-200" />
        <div className="h-4 w-2/3 rounded bg-neutral-200" />
        <div className="h-4 w-1/2 rounded bg-neutral-200" />
      </div>
    </div>
  )
}

export default function ListingGrid({ listings = [], loading = false, error = null, onRetry = null, emptyMessage, showSellCTA = false }) {
  const { t } = useTranslation()
  const togglePostModal = useUIStore((state) => state.togglePostModal)

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid min-h-64 place-items-center rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
        <div>
          <h3 className="text-lg font-black text-red-700">{t("ui.error")}</h3>
          <p className="mt-1 text-sm font-semibold text-red-600">{error}</p>
          {onRetry && (
            <Button className="mt-5" onClick={onRetry} variant="secondary">
              {t("ui.retry")}
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (!listings.length) {
    return (
      <div className="grid min-h-80 place-items-center gap-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
        <div className="flex flex-col items-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary mb-4">
            <SearchX className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-black text-neutral-900">
            {emptyMessage || t("listing.empty")}
          </h3>
          <p className="mt-1 text-sm font-semibold text-neutral-500">
            {t("listing.emptyDesc")}
          </p>
          <Button className="mt-5" onClick={() => togglePostModal(true)}>
            {t("listing.postFirst")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3 xl:columns-4">
      {showSellCTA && (
        <div className="break-inside-avoid">
          <SellCTACard />
        </div>
      )}
      {listings.map((listing) => (
        <div key={listing.id} className="break-inside-avoid">
          <ListingCard listing={listing} />
        </div>
      ))}
    </div>
  )
}

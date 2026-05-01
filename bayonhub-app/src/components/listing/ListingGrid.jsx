import React, { Suspense } from "react"
import { SearchX } from "lucide-react"
import { useTranslation } from "../../hooks/useTranslation"
import { useUIStore } from "../../store/useUIStore"
import Button from "../ui/Button"
import ListingCard from "./ListingCard"
import SellCTACard from "./SellCTACard"

const EmptyStateOrb = React.lazy(() => import("../three/EmptyStateOrb"))

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

export default function ListingGrid({ listings = [], loading = false, emptyMessage, showSellCTA = false }) {
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

  if (!listings.length) {
    return (
      <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center bg-bayon-line bg-bayon-line-8 bg-bayon-line-empty">
        <div>
          <Suspense fallback={<div className="h-32 w-32 rounded-full bg-neutral-100 animate-pulse dark:bg-neutral-800" />}>
            <EmptyStateOrb />
          </Suspense>
          <SearchX className="sr-only" aria-hidden="true" />
          <h3 className="mt-4 text-xl font-bold text-neutral-900">
            {emptyMessage || t("listing.empty")}
          </h3>
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

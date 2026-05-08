import { useMemo } from "react"
import { Helmet } from "react-helmet-async"
import { Clock3 } from "lucide-react"
import ListingCard from "../components/listing/ListingCard"
import PageTransition from "../components/ui/PageTransition"
import Button from "../components/ui/Button"
import { useTranslation } from "../hooks/useTranslation"
import { useListingStore } from "../store/useListingStore"

export default function RecentlyViewedPage() {
  const { t } = useTranslation()
  const recentlyViewed = useListingStore((state) => state.recentlyViewed)
  const clearRecentlyViewed = useListingStore((state) => state.clearRecentlyViewed)
  const listings = useMemo(
    () => recentlyViewed.filter((item) => typeof item === "object" && item?.id).slice(0, 20),
    [recentlyViewed],
  )

  return (
    <PageTransition className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Helmet>
        <title>{t("recent.title")} | BayonHub</title>
      </Helmet>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-neutral-900">{t("recent.title")}</h1>
        {listings.length ? (
          <Button onClick={clearRecentlyViewed} size="sm" variant="secondary">
            {t("recent.clear")}
          </Button>
        ) : null}
      </div>
      {!listings.length ? (
        <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
          <div>
            <Clock3 className="mx-auto h-12 w-12 text-neutral-300" aria-hidden="true" />
            <p className="mt-4 text-lg font-black text-neutral-900">{t("recent.empty")}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </PageTransition>
  )
}

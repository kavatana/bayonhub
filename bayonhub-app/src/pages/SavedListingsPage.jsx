import { useEffect } from "react"
import { Helmet } from "react-helmet-async"
import { BookmarkX } from "lucide-react"
import ListingCard from "../components/listing/ListingCard"
import PageTransition from "../components/ui/PageTransition"
import Button from "../components/ui/Button"
import { useTranslation } from "../hooks/useTranslation"
import { useAuthStore } from "../store/useAuthStore"
import { useUIStore } from "../store/useUIStore"
import { useUserStore } from "../store/useUserStore"

function formatSavedDate(value, language) {
  if (!value) return ""
  return new Date(value).toLocaleDateString(language === "km" ? "km-KH" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function SavedListingsPage() {
  const { t, language } = useTranslation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const savedListings = useUserStore((state) => state.savedListings)
  const loading = useUserStore((state) => state.profileLoading)
  const error = useUserStore((state) => state.error)
  const fetchSavedListings = useUserStore((state) => state.fetchSavedListings)
  const unsaveListing = useUserStore((state) => state.unsaveListing)

  useEffect(() => {
    if (!isAuthenticated) {
      toggleAuthModal(true)
      return
    }
    fetchSavedListings()
  }, [fetchSavedListings, isAuthenticated, toggleAuthModal])

  if (!isAuthenticated) {
    return (
      <PageTransition className="mx-auto grid min-h-[60vh] max-w-7xl place-items-center px-4 py-10 text-center">
        <p className="font-bold text-neutral-500">{t("auth.unauthenticated")}</p>
      </PageTransition>
    )
  }

  return (
    <PageTransition className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Helmet>
        <title>{t("saved.title")} | BayonHub</title>
      </Helmet>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-neutral-900">{t("saved.title")}</h1>
      </div>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="h-72 animate-pulse rounded-2xl bg-neutral-100" key={index} />
          ))}
        </div>
      ) : null}
      {!loading && error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}
      {!loading && !error && !savedListings.length ? (
        <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
          <div>
            <BookmarkX className="mx-auto h-12 w-12 text-neutral-300" aria-hidden="true" />
            <p className="mt-4 text-lg font-black text-neutral-900">{t("saved.empty")}</p>
          </div>
        </div>
      ) : null}
      {!loading && savedListings.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {savedListings.map((listing) => (
            <article className="grid gap-3" key={listing.id}>
              <ListingCard listing={listing} />
              <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 p-3">
                <span className="text-xs font-bold text-neutral-500">
                  {t("saved.savedOn")}: {formatSavedDate(listing.savedAt || listing.createdAt, language)}
                </span>
                <Button onClick={() => unsaveListing(listing.id)} size="sm" variant="secondary">
                  {t("saved.remove")}
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </PageTransition>
  )
}

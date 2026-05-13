import React, { Suspense, useEffect, useMemo, useRef } from "react"
import { useGSAP } from "@gsap/react"
import { Helmet } from "react-helmet-async"
import gsap from "gsap"
import { BarChart3, Bookmark, Eye, Heart, MessageCircle, TrendingDown, X } from "lucide-react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { getSavedListings } from "../api/users"
import ListingCard from "../components/listing/ListingCard"
import ListingGrid from "../components/listing/ListingGrid"
import PageTransition from "../components/ui/PageTransition"
import { DashboardSkeleton } from "../components/ui/Skeletons"
import SkeletonListItem from "../components/ui/SkeletonListItem"
import Button from "../components/ui/Button"
import { useTranslation } from "../hooks/useTranslation"
import { trackEvent } from "../lib/analytics"
import { selectIsPlusMember, useAuthStore } from "../store/useAuthStore"
import { API_BASE_URL } from "../api/client"
import { useListingStore } from "../store/useListingStore"
import { useUIStore } from "../store/useUIStore"


const MyAdsTab = React.lazy(() => import("../components/dashboard/MyAdsTab"))
const MessagesTab = React.lazy(() => import("../components/dashboard/MessagesTab"))
const NotificationsTab = React.lazy(() => import("../components/dashboard/NotificationsTab"))
const SavedSearchesTab = React.lazy(() => import("../components/dashboard/SavedSearchesTab"))
const SettingsTab = React.lazy(() => import("../components/dashboard/SettingsTab"))
const StoreTab = React.lazy(() => import("../components/dashboard/StoreTab"))
const VerificationTab = React.lazy(() => import("../components/dashboard/VerificationTab"))

const tabs = [
  ["ads", "dashboard.myListings"],
  ["leads", "dashboard.leads"],
  ["analytics", "dashboard.analytics"],
  ["favorites", "dashboard.favorites"],
  ["saved", "dashboard.saved"],
  ["savedSearches", "dashboard.savedSearches"],
  ["messages", "dashboard.messages"],
  ["notifications", "dashboard.notifications"],
  ["store", "dashboard.store"],
  ["verification", "dashboard.verification"],
  ["settings", "dashboard.settings"],
]

const categoryFilters = [
  ["all", "dashboard.all"],
  ["cars", "category.cars"],
  ["property", "category.house-land"],
  ["phones", "category.phones"],
  ["jobs", "category.jobs"],
]

function getEntryId(entry) {
  return String(entry.listingId || entry)
}

function listingCategoryKey(listing) {
  const value = String(listing.categorySlug || listing.category || listing.subcategorySlug || "").toLowerCase()
  if (value.includes("vehicle") || value.includes("car")) return "cars"
  if (value.includes("house") || value.includes("property") || value.includes("rent") || value.includes("sale")) return "property"
  if (value.includes("phone") || value.includes("smartphone")) return "phones"
  if (value.includes("job")) return "jobs"
  return "all"
}

function StatsWidget({ listings, t }) {
  const activeListings = listings.filter((listing) => String(listing.status || "active").toLowerCase() === "active").length
  const totalViews = listings.reduce((sum, listing) => sum + Number(listing.views || listing.viewCount || 0), 0)
  const stats = [
    [t("dashboard.activeListings"), activeListings],
    [t("dashboard.totalViewsWeek"), totalViews],
    [t("dashboard.pendingLeads"), 0],
  ]

  return (
    <section className="mb-6 grid gap-3 sm:grid-cols-3">
      {stats.map(([label, value]) => (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm" key={label}>
          <p className="text-2xl font-black text-neutral-900">{Number(value).toLocaleString()}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-widest text-neutral-500">{label}</p>
        </div>
      ))}
    </section>
  )
}

function LeadsTab({ t }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
      <div>
        <MessageCircle className="mx-auto mb-4 h-12 w-12 text-neutral-300" aria-hidden="true" />
        <h3 className="text-lg font-black text-neutral-900">{t("dashboard.leadsEmpty")}</h3>
        <p className="mt-1 text-sm font-semibold text-neutral-500">{t("dashboard.noLeadsYet")}</p>
      </div>
    </div>
  )
}

function AnalyticsTab({ isPlusMember, listings, navigate, t }) {
  const totalViews = listings.reduce((sum, listing) => sum + Number(listing.views || listing.viewCount || 0), 0)
  const activeListings = listings.filter((listing) => String(listing.status || "active").toLowerCase() === "active").length
  const topListings = [...listings]
    .sort((a, b) => Number(b.views || b.viewCount || 0) - Number(a.views || a.viewCount || 0))
    .slice(0, 3)

  if (!isPlusMember) {
    return (
      <div className="grid gap-4">
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-black text-neutral-900">{Number(totalViews).toLocaleString()}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-widest text-neutral-500">{t("dashboard.totalViewsWeek")}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-black text-neutral-900">{Number(activeListings).toLocaleString()}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-widest text-neutral-500">{t("dashboard.activeListings")}</p>
          </div>
        </section>
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-black text-neutral-900">{t("plus.unlockWith")}</h2>
          </div>
          <Button className="mt-4" onClick={() => navigate("/pricing")}>{t("plus.upgradeCta")}</Button>
        </section>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          [t("dashboard.totalViewsWeek"), totalViews],
          [t("dashboard.newLeadsToday"), 0],
          [t("dashboard.activeListings"), activeListings],
        ].map(([label, value]) => (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm" key={label}>
            <p className="text-2xl font-black text-neutral-900">{Number(value).toLocaleString()}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-widest text-neutral-500">{label}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-black text-neutral-900">{t("dashboard.viewsPerDay")}</h2>
        </div>
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-neutral-400">
          <BarChart3 size={24} aria-hidden="true" />
          <p className="text-sm font-semibold">{t("dashboard.analyticsComingSoon")}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-neutral-900">{t("dashboard.topListings")}</h2>
        <div className="mt-4 grid gap-2">
          {topListings.map((listing) => (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 p-3" key={listing.id}>
              <span className="truncate font-bold text-neutral-800">{listing.title}</span>
              <span className="inline-flex items-center gap-1 text-sm font-black text-neutral-500">
                <Eye className="h-4 w-4" aria-hidden="true" />
                {Number(listing.views || listing.viewCount || 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function FavoritesTab({ listings, t }) {
  const favorites = useListingStore((state) => state.favorites)
  const watchlist = useListingStore((state) => state.watchlist)
  const toggleFavorite = useListingStore((state) => state.toggleFavorite)
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [sortMode, setSortMode] = React.useState("date")
  const favoriteListings = useMemo(() => {
    const items = favorites
      .map((entry) => {
        const listing = listings.find((item) => String(item.id) === getEntryId(entry))
        return listing ? { ...listing, favoriteAddedAt: entry.addedAt || "" } : null
      })
      .filter(Boolean)
      .filter((listing) => categoryFilter === "all" || listingCategoryKey(listing) === categoryFilter)
    return items.sort((a, b) => {
      if (sortMode === "price") return Number(a.price || 0) - Number(b.price || 0)
      return new Date(b.favoriteAddedAt || 0) - new Date(a.favoriteAddedAt || 0)
    })
  }, [categoryFilter, favorites, listings, sortMode])

  const watchedListings = watchlist
    .map((entry) => {
      const listing = listings.find((item) => String(item.id) === getEntryId(entry))
      if (!listing) return null
      const watchedPrice = Number(entry.watchedPrice || listing.price || 0)
      const currentPrice = Number(listing.price || 0)
      const dropPercent = watchedPrice > currentPrice ? Math.round(((watchedPrice - currentPrice) / watchedPrice) * 100) : 0
      return { ...listing, dropPercent }
    })
    .filter(Boolean)

  return (
    <div className="grid gap-6">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {categoryFilters.map(([value, label]) => (
              <button
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-black ${
                  categoryFilter === value ? "bg-primary text-white" : "bg-white text-neutral-600"
                }`}
                key={value}
                onClick={() => setCategoryFilter(value)}
                type="button"
              >
                {t(label)}
              </button>
            ))}
          </div>
          <select
            className="min-h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-bold"
            onChange={(event) => setSortMode(event.target.value)}
            value={sortMode}
          >
            <option value="date">{t("dashboard.dateAdded")}</option>
            <option value="price">{t("post.price")}</option>
          </select>
        </div>

        {favoriteListings.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {favoriteListings.map((listing) => (
              <div className="relative" key={listing.id}>
                <ListingCard listing={listing} />
                <button
                  aria-label={t("ui.delete")}
                  className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white text-neutral-600 shadow"
                  onClick={() => toggleFavorite(listing.id)}
                  type="button"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
            <div>
              <Bookmark className="mx-auto mb-4 h-12 w-12 text-neutral-300" aria-hidden="true" />
              <h3 className="text-lg font-black text-neutral-900">{t("dashboard.favoritesEmpty")}</h3>
              <p className="mt-1 text-sm font-semibold text-neutral-500">{t("dashboard.favoritesEmptyDesc")}</p>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-black text-neutral-900">{t("dashboard.priceWatch")}</h2>
        </div>
        {watchedListings.length ? (
          <div className="grid gap-3">
            {watchedListings.map((listing) => (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 p-3" key={listing.id}>
                <span className="truncate font-bold text-neutral-800">{listing.title}</span>
                {listing.dropPercent > 0 ? (
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                    {t("dashboard.priceDropPercent", { percent: listing.dropPercent })}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-neutral-500">{t("dashboard.watching")}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-neutral-50 p-4 text-sm font-bold text-neutral-500">{t("dashboard.watchlistEmpty")}</p>
        )}
      </section>
    </div>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [apiSavedListings, setApiSavedListings] = React.useState([])
  const [savedLoading, setSavedLoading] = React.useState(false)
  const [savedError, setSavedError] = React.useState("")
  const [searchParams, setSearchParams] = useSearchParams()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isPlusMember = useAuthStore(selectIsPlusMember)
  const listings = useListingStore((state) => state.listings)
  const myListings = useListingStore((state) => state.myListings)
  const myListingsLoading = useListingStore((state) => state.myListingsLoading)
  const savedIds = useListingStore((state) => state.savedIds)
  const savedSnapshots = useListingStore((state) => state.savedSnapshots)
  const fetchListings = useListingStore((state) => state.fetchListings)
  const fetchMyListings = useListingStore((state) => state.fetchMyListings)
  const queryTab = searchParams.get("tab")
  const activeTab = tabs.some(([id]) => id === queryTab) ? queryTab : "ads"
  const contentRef = useRef(null)
  const hasRedirected = useRef(false)
  const dashboardListings = myListings.length ? myListings : listings

  useEffect(() => {
    fetchListings()
    fetchMyListings()
  }, [fetchListings, fetchMyListings])

  useEffect(() => {
    if (isAuthenticated || hasRedirected.current) return
    hasRedirected.current = true
    const { setPendingAction, toggleAuthModal } = useUIStore.getState()
    setPendingAction({ type: "dashboard" })
    toggleAuthModal(true)
  }, [isAuthenticated])

  useGSAP(
    () => {
      if (!contentRef.current) return
      gsap.fromTo(contentRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" })
    },
    { scope: contentRef, dependencies: [activeTab] },
  )

  const savedListings = useMemo(
    () => {
      const source = API_BASE_URL
        ? apiSavedListings
        : listings.filter((listing) => savedIds.includes(listing.id))
      return source
        .map((listing) => ({
          ...listing,
          priceDropped: savedSnapshots[listing.id]?.savedPrice > Number(listing.price || 0),
        }))
    },
    [apiSavedListings, listings, savedIds, savedSnapshots],
  )

  useEffect(() => {
    if (!API_BASE_URL || activeTab !== "saved") return undefined
    let cancelled = false
    const frame = window.requestAnimationFrame(() => {
      if (cancelled) return
      setSavedLoading(true)
      setSavedError("")
    })
    getSavedListings()
      .then((items) => {
        if (cancelled) return
        setApiSavedListings(items)
      })
      .catch(() => {
        if (cancelled) return
        setSavedError(t("dashboard.savedLoadError"))
      })
      .finally(() => {
        if (!cancelled) setSavedLoading(false)
      })
    return () => {
      cancelled = true
      window.cancelAnimationFrame(frame)
    }
  }, [activeTab, t])

  if (!isAuthenticated) {
    return (
      <PageTransition>
        <div className="mx-auto grid min-h-[60vh] max-w-7xl place-items-center px-4 py-10 text-center">
          <p className="font-bold text-neutral-500">{t("auth.unauthenticated")}</p>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition className="noise-overlay relative mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Helmet>
        <title>{t("dashboard.title")} | BayonHub</title>
      </Helmet>
      <StatsWidget listings={dashboardListings} t={t} />
      <div className="grid min-w-0 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="noise-overlay relative min-w-0 rounded-2xl border border-neutral-200 bg-white/80 p-2 shadow-sm backdrop-blur">
          <h1 className="px-3 py-4 text-2xl font-black text-neutral-900">{t("dashboard.title")}</h1>
          <div className="relative">
            <nav className="flex max-w-full gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0" role="tablist">
              {tabs.map(([id, label]) => (
                <button
                  aria-selected={activeTab === id}
                  className={`flex-shrink-0 whitespace-nowrap rounded-xl px-4 py-3 text-left text-sm font-black transition ${
                    activeTab === id ? "bg-primary text-white" : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                  key={id}
                  onClick={() => {
                    trackEvent("dashboard_tab_viewed", { tab: id })
                    setSearchParams(id === "ads" ? {} : { tab: id })
                  }}
                  role="tab"
                  type="button"
                >
                  {t(label)}
                </button>
              ))}
            </nav>
            <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white/90 to-transparent lg:hidden" />
          </div>
        </aside>
        <section ref={contentRef} className="min-w-0">
          <Suspense
            fallback={
              <DashboardSkeleton />
            }
          >
            {activeTab === "ads" ? (
              myListingsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }, (_, index) => (
                    <SkeletonListItem key={index} />
                  ))}
                </div>
              ) : (
                <MyAdsTab />
              )
            ) : null}
            {activeTab === "leads" ? <LeadsTab listings={dashboardListings} t={t} /> : null}
            {activeTab === "analytics" ? <AnalyticsTab isPlusMember={isPlusMember} listings={dashboardListings} navigate={navigate} t={t} /> : null}
            {activeTab === "favorites" ? <FavoritesTab listings={listings} t={t} /> : null}
            {activeTab === "saved" ? (
              savedLoading ? (
                  <DashboardSkeleton />
              ) : savedError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
                  {savedError}
                </div>
              ) : savedListings.length ? (
                <div className="space-y-3">
                  {savedListings.some((listing) => listing.priceDropped) ? (
                    <p className="rounded-xl bg-primary/10 p-3 text-sm font-black text-primary">{t("dashboard.priceDrop")}</p>
                  ) : null}
                  <ListingGrid listings={savedListings} />
                </div>
              ) : (
                <div className="grid min-h-64 place-items-center gap-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
                    <Heart className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-neutral-900">{t("dashboard.savedEmpty")}</h3>
                    <p className="mt-1 text-sm font-semibold text-neutral-500">{t("dashboard.savedEmptyDesc")}</p>
                  </div>
                  <Button onClick={() => navigate("/")} variant="secondary">
                    {t("nav.home")}
                  </Button>
                </div>
              )
            ) : null}
            {activeTab === "messages" ? <MessagesTab /> : null}
            {activeTab === "savedSearches" ? <SavedSearchesTab /> : null}
            {activeTab === "notifications" ? <NotificationsTab /> : null}
            {activeTab === "store" ? <StoreTab /> : null}
            {activeTab === "verification" ? <VerificationTab /> : null}
            {activeTab === "settings" ? <SettingsTab /> : null}
          </Suspense>
        </section>
      </div>
    </PageTransition>
  )
}

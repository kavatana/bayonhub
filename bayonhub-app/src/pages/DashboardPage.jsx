import React, { Suspense, useEffect, useMemo, useRef } from "react"
import { useGSAP } from "@gsap/react"
import { Helmet } from "react-helmet-async"
import gsap from "gsap"
import { Heart } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { getSavedListings } from "../api/users"
import ListingGrid from "../components/listing/ListingGrid"
import PageTransition from "../components/ui/PageTransition"
import Spinner from "../components/ui/Spinner"
import { useTranslation } from "../hooks/useTranslation"
import { useAuthStore } from "../store/useAuthStore"
import { API_BASE_URL } from "../api/client"
import { useListingStore } from "../store/useListingStore"
import { useUIStore } from "../store/useUIStore"

const EmptyStateOrb = React.lazy(() => import("../components/three/EmptyStateOrb"))
const MyAdsTab = React.lazy(() => import("../components/dashboard/MyAdsTab"))
const MessagesTab = React.lazy(() => import("../components/dashboard/MessagesTab"))
const NotificationsTab = React.lazy(() => import("../components/dashboard/NotificationsTab"))
const SavedSearchesTab = React.lazy(() => import("../components/dashboard/SavedSearchesTab"))
const SettingsTab = React.lazy(() => import("../components/dashboard/SettingsTab"))
const StoreTab = React.lazy(() => import("../components/dashboard/StoreTab"))
const VerificationTab = React.lazy(() => import("../components/dashboard/VerificationTab"))

const tabs = [
  ["ads", "dashboard.myAds"],
  ["saved", "dashboard.saved"],
  ["savedSearches", "dashboard.savedSearches"],
  ["messages", "dashboard.messages"],
  ["notifications", "dashboard.notifications"],
  ["store", "dashboard.store"],
  ["verification", "dashboard.verification"],
  ["settings", "dashboard.settings"],
]

export default function DashboardPage() {
  const { t } = useTranslation()
  const [apiSavedListings, setApiSavedListings] = React.useState([])
  const [savedLoading, setSavedLoading] = React.useState(false)
  const [savedError, setSavedError] = React.useState("")
  const [searchParams, setSearchParams] = useSearchParams()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const listings = useListingStore((state) => state.listings)
  const savedIds = useListingStore((state) => state.savedIds)
  const savedSnapshots = useListingStore((state) => state.savedSnapshots)
  const fetchListings = useListingStore((state) => state.fetchListings)
  const queryTab = searchParams.get("tab")
  const activeTab = tabs.some(([id]) => id === queryTab) ? queryTab : "ads"
  const contentRef = useRef(null)
  const hasRedirected = useRef(false)

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

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
      <div className="grid min-w-0 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="noise-overlay relative min-w-0 rounded-2xl border border-neutral-200 bg-white/80 p-2 shadow-sm backdrop-blur">
          <h1 className="px-3 py-4 text-2xl font-black text-neutral-900">{t("dashboard.title")}</h1>
          <nav className="flex max-w-full gap-2 overflow-x-auto lg:grid">
            {tabs.map(([id, label]) => (
              <button
                className={`whitespace-nowrap rounded-xl px-4 py-3 text-left text-sm font-black transition ${
                  activeTab === id ? "bg-primary text-white" : "text-neutral-600 hover:bg-neutral-100"
                }`}
                key={id}
                onClick={() => {
                  setSearchParams(id === "ads" ? {} : { tab: id })
                }}
                type="button"
              >
                {t(label)}
              </button>
            ))}
          </nav>
        </aside>
        <section ref={contentRef} className="min-w-0">
          <Suspense
            fallback={
              <div className="grid min-h-64 place-items-center">
                <Spinner className="h-8 w-8 text-primary" />
              </div>
            }
          >
            {activeTab === "ads" ? <MyAdsTab /> : null}
            {activeTab === "saved" ? (
              savedLoading ? (
                <div className="grid min-h-64 place-items-center">
                  <Spinner className="h-8 w-8 text-primary" />
                </div>
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
                <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
                  <Suspense fallback={<div className="h-32 w-32 rounded-full bg-neutral-100 animate-pulse dark:bg-neutral-800" />}>
                    <EmptyStateOrb />
                  </Suspense>
                  <Heart className="sr-only" aria-hidden="true" />
                  <p className="mt-3 font-bold text-neutral-500">{t("dashboard.savedEmpty")}</p>
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

import { useEffect, useMemo, useRef } from "react"
import { useGSAP } from "@gsap/react"
import { Helmet } from "react-helmet-async"
import { Link } from "react-router-dom"
import gsap from "gsap"
import {
  BookOpen,
  BriefcaseBusiness,
  Car,
  Grid2X2,
  Home,
  PawPrint,
  Shirt,
  Smartphone,
  Download,
  Sofa,
  Tv,
  Utensils,
  Wrench,
  X,
} from "lucide-react"
import { usePWAInstall } from "../hooks/usePWAInstall"
import HeroSection from "../components/home/HeroSection"
import ListingCard from "../components/listing/ListingCard"
import ListingGrid from "../components/listing/ListingGrid"
import PricingSection from "../components/sections/PricingSection"
import PageTransition from "../components/ui/PageTransition"
import { useTranslation } from "../hooks/useTranslation"
import { CATEGORIES } from "../lib/categories"
import { PROVINCES } from "../lib/locations"
import { useListingStore } from "../store/useListingStore"
import { useUIStore } from "../store/useUIStore"
import Button from "../components/ui/Button"

const iconMap = {
  BookOpen,
  BriefcaseBusiness,
  Car,
  Grid2X2,
  Home,
  PawPrint,
  Shirt,
  Smartphone,
  Sofa,
  Tv,
  Utensils,
  Wrench,
}

export default function HomePage() {
  const { t, language } = useTranslation()
  const listings = useListingStore((state) => state.listings)
  const loading = useListingStore((state) => state.loading)
  const fetchListings = useListingStore((state) => state.fetchListings)
  const recentlyViewed = useListingStore((state) => state.recentlyViewed)
  const getRecentlyViewedListings = useListingStore((state) => state.getRecentlyViewedListings)
  const clearRecentlyViewed = useListingStore((state) => state.clearRecentlyViewed)
  const selectedProvince = useUIStore((state) => state.selectedProvince)
  const setSelectedProvince = useUIStore((state) => state.setSelectedProvince)
  const locationSelectorOpen = useUIStore((state) => state.locationSelectorOpen)
  const toggleLocationSelector = useUIStore((state) => state.toggleLocationSelector)
  const { canInstall, promptInstall, dismiss } = usePWAInstall()
  const categoriesRef = useRef(null)
  const featured = useMemo(() => listings.filter((listing) => listing.premium), [listings])
  const categoryCounts = useMemo(() => {
    const categoryByLabel = CATEGORIES.reduce((acc, category) => {
      acc[category.label.en] = category.slug
      return acc
    }, {})
    return listings.reduce((acc, listing) => {
      const isActive = !listing.status || String(listing.status).toUpperCase() === "ACTIVE"
      if (!isActive) return acc
      const key = listing.categorySlug || categoryByLabel[listing.category]
      if (key) acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
  }, [listings])
  const recentlyViewedListings = getRecentlyViewedListings().slice(0, 4)
  const province = useMemo(
    () => PROVINCES.find((item) => item.label.en === selectedProvince),
    [selectedProvince],
  )
  const nearYouListings = useMemo(() => {
    if (!selectedProvince || selectedProvince === "all") return []
    return listings
      .filter((listing) => {
        const active = !listing.status || String(listing.status).toUpperCase() === "ACTIVE"
        return active && listing.location === selectedProvince
      })
      .slice(0, 8)
  }, [listings, selectedProvince])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  useGSAP(
    () => {
      if (!categoriesRef.current) return
      gsap.fromTo(
        categoriesRef.current.querySelectorAll("[data-category-card]"),
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          ease: "power2.out",
          stagger: 0.07,
          scrollTrigger: {
            trigger: categoriesRef.current,
            start: "top 80%",
          },
        },
      )
    },
    { scope: categoriesRef },
  )

  return (
    <PageTransition>
      <Helmet>
        <title>{t("seo.homeTitle")}</title>
        <meta name="description" content={t("seo.homeDescription")} />
        <meta property="og:image" content="/og-home.png" />
      </Helmet>

      {canInstall && (
        <div
          role="banner"
          className="bg-primary text-white py-3 px-4 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Smartphone size={16} aria-hidden="true" />
            <span>{t("home.installBanner")}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="secondary" size="sm" onClick={promptInstall}>
              {t("home.installNow")}
            </Button>
            <button
              onClick={dismiss}
              className="text-white/70 hover:text-white transition"
              aria-label={t("ui.dismiss")}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <HeroSection />

      <section ref={categoriesRef} className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="text-2xl font-black text-neutral-900">{t("home.categoriesTitle")}</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((category) => {
            const Icon = iconMap[category.icon] || Grid2X2
            return (
              <Link
                data-category-card
                className="relative rounded-xl border border-neutral-200 bg-white p-4 pr-14 shadow-sm transition hover:border-primary"
                key={category.id}
                to={`/category/${category.slug}`}
              >
                <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <span className="mt-3 block text-sm font-bold text-neutral-900">
                  {t(`category.${category.id}`)}
                </span>
                <span className={`absolute bottom-3 right-3 rounded-full px-2 py-0.5 text-xs font-black ${categoryCounts[category.slug] ? "bg-primary/10 text-primary" : "bg-neutral-100 text-neutral-400"}`}>
                  {categoryCounts[category.slug] > 999 ? "999+" : categoryCounts[category.slug] || 0}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h2 className="text-2xl font-black text-neutral-900">{t("listing.featured")}</h2>
        <div className="mt-5">
          <ListingGrid listings={featured.slice(0, 4)} loading={loading} />
        </div>
      </section>

      {recentlyViewed.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-neutral-900">{t("home.recentlyViewed")}</h2>
            <Button onClick={clearRecentlyViewed} size="sm" variant="ghost">
              {t("home.clearHistory")}
            </Button>
          </div>
          {recentlyViewedListings.length ? (
            <div className="mt-5 grid auto-cols-[78%] grid-flow-col gap-4 overflow-x-auto pb-3 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-2 lg:grid-cols-4">
              {recentlyViewedListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <ListingGrid listings={[]} loading={loading} emptyMessage={t("listing.empty")} />
            </div>
          )}
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {selectedProvince && selectedProvince !== "all" ? (
          <>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <h2 className="text-2xl font-black text-neutral-900">
                {t("home.nearYou", { province: province?.label[language] || selectedProvince })}
              </h2>
              <Link className="text-sm font-black text-primary" to={`/category/all?province=${encodeURIComponent(selectedProvince)}`}>
                {t("home.seeAllInProvince", { province: province?.label[language] || selectedProvince })}
              </Link>
            </div>
            <div className="mt-5">
              <ListingGrid listings={nearYouListings} loading={loading} emptyMessage={t("listing.empty")} />
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black text-neutral-900">{t("home.nearYouEmptyTitle")}</h2>
            <p className="mt-2 text-sm text-neutral-600">{t("home.nearYouEmptyText")}</p>
            <Button className="mt-4 rounded-full" onClick={() => toggleLocationSelector(true)} variant="secondary">
              {t("home.setLocation")}
            </Button>
            {locationSelectorOpen ? (
              <label className="mt-4 grid max-w-sm gap-2 text-sm font-bold text-neutral-700">
                {t("nav.location")}
                <select
                  className="h-11 rounded-xl border border-neutral-200 bg-white px-3 outline-none focus:border-primary"
                  onChange={(event) => {
                    setSelectedProvince(event.target.value)
                    toggleLocationSelector(false)
                  }}
                  value={selectedProvince || "all"}
                >
                  <option value="all">{t("nav.allCambodia")}</option>
                  {PROVINCES.map((item) => (
                    <option key={item.id} value={item.label.en}>
                      {item.label[language]}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        )}
      </section>

      <section className="noise-overlay mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/10 to-white p-6 shadow-sm lg:grid-cols-[1fr_340px] lg:items-center">
          <div>
            <h2 className="text-2xl font-black text-neutral-900">{t("home.downloadApp")}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">{t("home.appSubtitle")}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              {canInstall ? (
                <Button onClick={promptInstall}>
                  <Download className="h-4 w-4" aria-hidden="true" />
                  {t("home.installPwa")}
                </Button>
              ) : null}
              <Button disabled title={t("ui.comingSoon")} variant="secondary">
                {t("home.googlePlay")}
              </Button>
              <Button disabled title={t("ui.comingSoon")} variant="secondary">
                {t("home.appStore")}
              </Button>
            </div>
          </div>
          <div className="mx-auto grid h-72 w-40 rounded-[2rem] border-8 border-neutral-900 bg-neutral-950 p-3 shadow-2xl">
            <div className="rounded-[1.4rem] bg-white p-3">
              <div className="mx-auto h-1.5 w-12 rounded-full bg-neutral-200" />
              <div className="mt-6 grid gap-3">
                <Smartphone className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
                <div className="h-4 rounded bg-primary/20" />
                <div className="h-4 w-3/4 rounded bg-neutral-200" />
                <div className="h-20 rounded-xl bg-neutral-100" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h2 className="text-2xl font-black text-neutral-900">{t("listing.latest")}</h2>
        <div className="mt-5">
          <ListingGrid listings={listings} loading={loading} />
        </div>
      </section>

      <section id="trust" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="text-2xl font-black text-neutral-900">{t("home.trustTitle")}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[t("trust.verifiedSellers"), t("trust.safePayments"), `${PROVINCES.length} ${t("hero.provinces")}`].map(
            (item) => (
              <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm" key={item}>
                <strong className="text-lg text-neutral-900">{item}</strong>
              </div>
            ),
          )}
        </div>
      </section>
      <PricingSection />
    </PageTransition>
  )
}

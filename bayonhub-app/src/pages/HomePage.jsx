import { useEffect, useMemo, useRef } from "react"
import { useGSAP } from "@gsap/react"
import { Helmet } from "react-helmet-async"
import { Link } from "react-router-dom"
import gsap from "gsap"
import {
  BookOpen,
  BriefcaseBusiness,
  Car,
  CheckCircle2,
  Download,
  Grid2X2,
  Home,
  MapPin,
  PawPrint,
  Shield,
  Shirt,
  Smartphone,
  Sofa,
  Tv,
  Utensils,
  Wrench,
  X,
  Zap,
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
import { canonicalUrl } from "../lib/seo"
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
  const error = useListingStore((state) => state.error)
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

  // Trust section data with icons
  const trustItems = [
    {
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-200 dark:border-emerald-800",
      title: t("trust.verifiedSellers"),
      desc: t("trust.verifiedSellersDesc"),
    },
    {
      icon: Shield,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800",
      title: t("trust.safePayments"),
      desc: t("trust.safePaymentsDesc"),
    },
    {
      icon: MapPin,
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/20",
      title: `${PROVINCES.length} ${t("hero.provinces")}`,
      desc: t("trust.provincesCoveredDesc"),
    },
  ]

  return (
    <PageTransition>
      <Helmet>
        <meta charSet="UTF-8" />
        <title>{t("seo.homeTitle")}</title>
        <meta name="description" content={t("seo.homeDescription")} />
        <meta property="og:title" content={t("seo.homeTitle")} />
        <meta property="og:description" content={t("seo.homeDescription")} />
        <meta property="og:image" content="/og-home.png" />
        <meta property="og:url" content={canonicalUrl("/")} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="BayonHub" />
        <meta property="og:locale" content={language === "km" ? "km_KH" : "en_US"} />
        <link rel="canonical" href={canonicalUrl("/")} />
      </Helmet>

      {/* PWA install banner — premium gradient */}
      {canInstall && (
        <div
          role="banner"
          className="relative overflow-hidden bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 py-3 px-4"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(229,57,53,0.15)_0%,transparent_70%)]" />
          <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm font-medium text-white">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <span>{t("home.installBanner")}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={promptInstall}
                className="rounded-full bg-primary px-4 py-1.5 text-xs font-black text-white transition hover:bg-primary/90"
              >
                {t("home.installNow")}
              </button>
              <button
                onClick={dismiss}
                className="grid h-7 w-7 place-items-center rounded-full text-neutral-400 transition hover:text-white"
                aria-label={t("ui.dismiss")}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      <HeroSection />

      {/* Category grid */}
      <section ref={categoriesRef} className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
          {t("home.categoriesTitle")}
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((category) => {
            const Icon = iconMap[category.icon] || Grid2X2
            const count = categoryCounts[category.slug] || 0
            return (
              <Link
                data-category-card
                className={
                  "group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 pr-12 shadow-sm " +
                  "transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 " +
                  "dark:bg-neutral-800 dark:border-neutral-700"
                }
                key={category.id}
                to={`/category/${category.slug}`}
              >
                {/* Icon with color-tinted bg on hover */}
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 transition-colors duration-200 group-hover:bg-primary/15">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <span className="mt-3 block text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {t(`category.${category.id}`)}
                </span>
                {/* Count badge */}
                <span
                  className={
                    "absolute bottom-3 right-3 rounded-full px-2 py-0.5 text-xs font-black transition-colors duration-200 " +
                    (count ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white" : "bg-neutral-100 text-neutral-400 dark:bg-neutral-700")
                  }
                >
                  {count > 999 ? "999+" : count}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Featured listings */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
          {t("listing.featured")}
        </h2>
        <div className="mt-5">
          <ListingGrid listings={featured.slice(0, 4)} loading={loading} error={error} onRetry={fetchListings} />
        </div>
      </section>

      {/* Recently viewed */}
      {recentlyViewed.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
              {t("home.recentlyViewed")}
            </h2>
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
              <ListingGrid listings={[]} loading={loading} error={error} onRetry={fetchListings} emptyMessage={t("listing.empty")} />
            </div>
          )}
        </section>
      ) : null}

      {/* Near you */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {selectedProvince && selectedProvince !== "all" ? (
          <>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
                {t("home.nearYou", { province: province?.label[language] || selectedProvince })}
              </h2>
              <Link
                className="text-sm font-black text-primary"
                to={`/category/all?province=${encodeURIComponent(selectedProvince)}`}
              >
                {t("home.seeAllInProvince", { province: province?.label[language] || selectedProvince })}
              </Link>
            </div>
            <div className="mt-5">
              <ListingGrid listings={nearYouListings} loading={loading} error={error} onRetry={fetchListings} emptyMessage={t("listing.empty")} />
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
            <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
              {t("home.nearYouEmptyTitle")}
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {t("home.nearYouEmptyText")}
            </p>
            <Button className="mt-4 rounded-full" onClick={() => toggleLocationSelector(true)} variant="secondary">
              {t("home.setLocation")}
            </Button>
            {locationSelectorOpen ? (
              <label className="mt-4 grid max-w-sm gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-300">
                {t("nav.location")}
                <select
                  className="h-11 rounded-xl border border-neutral-200 bg-white px-3 outline-none focus:border-primary dark:bg-neutral-700 dark:border-neutral-600"
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

      {/* PWA app download card */}
      <section className="noise-overlay mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="relative grid gap-8 overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/8 via-white to-neutral-50 p-6 shadow-sm lg:grid-cols-[1fr_340px] lg:items-center">
          <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-primary to-primary/20 rounded-l-2xl" />
          <div>
            <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
              {t("home.downloadApp")}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600 dark:text-neutral-400">
              {t("home.appSubtitle")}
            </p>
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
          {/* Phone mockup */}
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

      {/* Latest listings */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
          {t("listing.latest")}
        </h2>
        <div className="mt-5">
          <ListingGrid listings={listings} loading={loading} />
        </div>
      </section>

      {/* Trust section — premium with icons + descriptions */}
      <section
        id="trust"
        className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 bg-skyline bg-skyline-8"
      >
        <div className="mb-8">
          <h2 className="text-3xl font-black text-neutral-900 dark:text-neutral-100">
            {t("home.trustTitle")}
          </h2>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            {t("trust.subtitle")}
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {trustItems.map(({ icon: Icon, color, bg, border, title, desc }) => (
            <div
              key={title}
              className={`relative overflow-hidden rounded-2xl border ${border} bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md dark:bg-neutral-800`}
            >
              <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-6 w-6 ${color}`} aria-hidden="true" />
              </div>
              <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-100">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">{desc}</p>
              {/* Subtle bottom gradient accent */}
              <span className="pointer-events-none absolute bottom-0 left-6 right-6 h-[2px] rounded-full bg-gradient-to-r from-transparent via-current to-transparent opacity-20" />
            </div>
          ))}
        </div>
      </section>

      <PricingSection />
    </PageTransition>
  )
}

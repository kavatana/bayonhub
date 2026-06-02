import { useEffect, useMemo, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import { Helmet } from "react-helmet-async"
import { Link } from "react-router-dom"
import gsap from "gsap"
import {
  BookOpen,
  BriefcaseBusiness,
  Car,
  CheckCircle2,
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
} from "lucide-react"
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
  const recentListings = useListingStore((state) => state.recentListings)
  const homepageLoading = useListingStore((state) => state.homepageLoading)
  const loading = useListingStore((state) => state.loading)
  const fetchListings = useListingStore((state) => state.fetchListings)
  const fetchHomepage = useListingStore((state) => state.fetchHomepage)
  const selectedProvince = useUIStore((state) => state.selectedProvince)
  const categoriesRef = useRef(null)
  const [plusFeaturedListings, setPlusFeaturedListings] = useState([])
  const plusFeaturedCards = useMemo(
    () => plusFeaturedListings.map((listing) => ({
      ...listing,
      isPlusMember: true,
      seller: {
        ...listing.seller,
        isPlusMember: true,
      },
    })),
    [plusFeaturedListings],
  )

  useEffect(() => {
    fetchListings()
    fetchHomepage(selectedProvince)
  }, [fetchHomepage, fetchListings, selectedProvince])

  useEffect(() => {
    let mounted = true

    async function fetchPlusFeaturedListings() {
      try {
        const { getFeaturedListings } = await import("../api/listings")
        const results = await getFeaturedListings()
        if (mounted) setPlusFeaturedListings(Array.isArray(results) ? results : [])
      } catch {
        if (mounted) setPlusFeaturedListings([])
      }
    }

    fetchPlusFeaturedListings()
    return () => {
      mounted = false
    }
  }, [])

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
        <meta property="og:image" content={canonicalUrl("/og-home.png")} />
        <meta property="og:url" content={canonicalUrl("/")} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="BayonHub" />
        <meta property="og:locale" content={language === "km" ? "km_KH" : "en_US"} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t("seo.homeTitle")} />
        <meta name="twitter:description" content={t("seo.homeDescription")} />
        <meta name="twitter:image" content={canonicalUrl("/og-home.png")} />
        <link rel="canonical" href={canonicalUrl("/")} />
      </Helmet>

      <HeroSection />

      {/* Category grid */}
      <section ref={categoriesRef} className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
          {t("home.categoriesTitle")}
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((category) => {
            const Icon = iconMap[category.icon] || Grid2X2
            return (
              <Link
                data-category-card
                className={
                  "group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 shadow-sm " +
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
                  {category.label[language]}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {plusFeaturedCards.length ? (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <h2
            className={`text-2xl font-black text-amber-600 dark:text-amber-400 ${
              language === "km" ? "font-khmer leading-[2]" : ""
            }`}
          >
            {t("plus.featuredSection")}
          </h2>
          <div className="-mx-4 mt-5 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0">
            {plusFeaturedCards.map((listing) => (
              <div key={listing.id} className="w-[70vw] shrink-0 snap-start sm:w-auto">
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Latest listings */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
          {t("home.recent")}
        </h2>
        <div className="mt-5">
          <ListingGrid listings={recentListings.length ? recentListings : listings.slice(0, 12)} loading={homepageLoading || loading} />
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
        <p className="mt-5 max-w-3xl text-sm font-semibold leading-7 text-neutral-500 dark:text-neutral-400">
          {t("trust.supportingLine")}
        </p>
      </section>

      <PricingSection />
    </PageTransition>
  )
}

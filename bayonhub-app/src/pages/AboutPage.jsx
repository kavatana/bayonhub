import { useEffect, useMemo, useRef } from "react"
import { BadgeCheck, Gauge, Languages } from "lucide-react"
import { Helmet } from "react-helmet-async"
import PageTransition from "../components/ui/PageTransition"
import { useTranslation } from "../hooks/useTranslation"
import { CATEGORIES } from "../lib/categories"
import { PROVINCES } from "../lib/locations"
import { useListingStore } from "../store/useListingStore"

export default function AboutPage() {
  const { t, language } = useTranslation()
  const listings = useListingStore((state) => state.listings)
  const fetchListings = useListingStore((state) => state.fetchListings)
  const statRefs = useRef([])
  const pageClass = language === "km" ? "font-khmer leading-8" : ""
  const verifiedSellers = useMemo(
    () => new Set(listings.filter((listing) => listing.verified).map((listing) => listing.sellerId)).size,
    [listings],
  )

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  useEffect(() => {
    let cleanup = () => {}
    let cancelled = false
    async function animateCounters() {
      const { counterUp } = await import("../lib/animations")
      if (cancelled) return
      const cleanups = statRefs.current.map((element) => counterUp(element, element?.dataset.value || 0))
      cleanup = () => cleanups.forEach((fn) => fn())
    }
    animateCounters()
    return () => {
      cancelled = true
      cleanup()
    }
  }, [listings.length, verifiedSellers])

  const stats = [
    { value: listings.length || CATEGORIES.length * 120, label: t("hero.totalListings") },
    { value: verifiedSellers || 8, label: t("hero.verifiedSellers") },
    { value: PROVINCES.length, label: t("hero.provincesCovered") },
  ]
  const missions = [
    { icon: BadgeCheck, title: t("about.trusted"), body: t("about.trustedText") },
    { icon: Gauge, title: t("about.fast"), body: t("about.fastText") },
    { icon: Languages, title: t("about.bilingual"), body: t("about.bilingualText") },
  ]

  return (
    <PageTransition className={pageClass}>
      <Helmet>
        <title>{t("about.pageTitle")}</title>
        <meta name="description" content={t("about.pageDesc")} />
      </Helmet>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <section className="rounded-2xl bg-neutral-950 px-5 py-10 text-white sm:px-8" data-animate>
          <p className="text-sm font-black uppercase tracking-wide text-primary-light">{t("about.founded")}</p>
          <h1 className="mt-3 font-display text-4xl font-black sm:text-5xl">{t("app.name")}</h1>
          <p className="mt-4 max-w-3xl text-base text-neutral-300 sm:text-lg">{t("footer.tagline")}</p>
        </section>

        <section className="py-10" data-animate>
          <h2 className="text-2xl font-black text-neutral-900">{t("about.mission")}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {missions.map(({ icon: Icon, title, body }) => (
              <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm" key={title}>
                <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-black text-neutral-900">{title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm sm:grid-cols-3" data-animate>
          {stats.map((stat, index) => (
            <div className="relative px-4 py-6 text-center" key={stat.label}>
              {index > 0 ? <span className="absolute bottom-6 left-0 top-6 hidden w-px bg-neutral-200 sm:block" /> : null}
              <strong
                aria-label={String(stat.value)}
                className="block text-3xl font-black text-neutral-950"
                data-value={stat.value}
                ref={(element) => {
                  statRefs.current[index] = element
                }}
              >
                0
              </strong>
              <span className="mt-2 block text-xs font-bold uppercase tracking-wide text-neutral-500">{stat.label}</span>
            </div>
          ))}
        </section>

        <section className="py-12 text-center" data-animate>
          <p className="text-xl font-black text-neutral-900">{t("about.teamPlaceholder")}</p>
        </section>
      </main>
    </PageTransition>
  )
}

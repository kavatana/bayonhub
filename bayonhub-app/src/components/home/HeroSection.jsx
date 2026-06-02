import { useEffect, useMemo, useRef, useState } from "react"
import gsap from "gsap"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "../../hooks/useTranslation"
import { useListingStore } from "../../store/useListingStore"
import { useUIStore } from "../../store/useUIStore"
import { CATEGORIES } from "../../lib/categories"
import { formatPrice, getImageSizes, getSrcSet } from "../../lib/utils"
import Button from "../ui/Button"

function getHeroImage(listing) {
  const image = listing?.images?.[0]
  if (typeof image === "string") return image
  return image?.thumbUrl || image?.url || listing?.imageUrl || ""
}

function getCategoryLabel(value, language) {
  const category = CATEGORIES.find(
    (item) =>
      item.slug === value ||
      item.id === value ||
      item.label.en === value ||
      item.subcategories.some((subcategory) => subcategory.slug === value || subcategory.id === value || subcategory.label.en === value),
  )
  const subcategory = category?.subcategories.find(
    (item) => item.slug === value || item.id === value || item.label.en === value,
  )
  return subcategory?.label?.[language] || category?.label?.[language] || ""
}

export default function HeroSection() {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const listings = useListingStore((state) => state.listings)
  const setPendingAction = useUIStore((state) => state.setPendingAction)
  const togglePostModal = useUIStore((state) => state.togglePostModal)
  const [activeSlide, setActiveSlide] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const slideRef = useRef(null)

  const titleClass = language === "km" ? "font-khmer text-3xl sm:text-4xl lg:text-5xl" : "font-display text-4xl sm:text-5xl lg:text-6xl"
  const heroListings = useMemo(
    () => listings
      .filter((listing) => !listing.status || String(listing.status).toUpperCase() === "ACTIVE")
      .slice(0, 3),
    [listings],
  )

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((value) => (value + 1) % 2)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!slideRef.current) return
    gsap.fromTo(
      slideRef.current,
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" },
    )
  }, [activeSlide])

  function openPostFlow(prefill = null) {
    const pendingAction = prefill ? { type: "post", prefill } : { type: "post" }
    setPendingAction(pendingAction)
    togglePostModal(true)
  }

  function handleSearch(event) {
    event.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const slides = [
    {
      title: t("hero.slide1Title"),
      subtitle: t("hero.slide1Sub"),
    },
    {
      title: t("hero.slide2Title"),
      subtitle: t("hero.slide2Sub"),
    },
  ]
  const currentSlide = slides[activeSlide]

  return (
    <section
      className="noise-overlay relative isolate overflow-hidden bg-white px-4 py-10 dark:bg-neutral-950 sm:px-6 lg:py-16 bg-bayon-sketch bg-bayon-sketch-7 bg-bayon-sketch-hero"
    >
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl border border-neutral-200/80 bg-gradient-to-br from-neutral-50 via-white to-primary/5 p-5 shadow-[0_8px_60px_-12px_rgba(229,57,53,0.15)] dark:border-neutral-800 dark:from-neutral-900 dark:via-neutral-950 dark:to-primary/10 sm:p-10">
          <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] rounded-l-3xl bg-gradient-to-b from-primary via-primary/50 to-transparent" />

          <div className="grid min-h-[460px] items-center gap-12 lg:grid-cols-[60fr_40fr]">
            <div ref={slideRef} className="min-w-0" data-animate>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                {t("hero.eyebrow")}
              </div>

              <h1 className={`${titleClass} mt-6 max-w-full break-words leading-[1.1] text-neutral-950 dark:text-white [overflow-wrap:anywhere]`}>
                {currentSlide.title}
              </h1>
              <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-neutral-600 dark:text-neutral-300">
                {currentSlide.subtitle}
              </p>

              <div className="mt-10 flex flex-col gap-4">
                <form onSubmit={handleSearch} className="group relative max-w-2xl">
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/25 to-primary/10 opacity-0 blur transition duration-500 group-focus-within:opacity-100 group-hover:opacity-40" />
                  <div className="relative flex items-center rounded-2xl border border-neutral-200 bg-white/90 p-2 shadow-sm backdrop-blur-md transition focus-within:border-primary/40 focus-within:shadow-md dark:border-neutral-700 dark:bg-neutral-900/90">
                    <input
                      className="w-full border-none bg-transparent px-4 py-3 text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white dark:placeholder-neutral-500"
                      placeholder={t("nav.searchPlaceholder")}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button className="hidden h-12 min-w-32 sm:flex" size="md" type="submit">
                      {t("hero.searchButton") || t("ui.search")}
                    </Button>
                  </div>
                </form>

                <div className="flex flex-col gap-3 xs:flex-row">
                  <Button className="min-w-40" onClick={() => openPostFlow()} size="lg">
                    {t("hero.postFreeAd")}
                  </Button>
                  <Link to="/search" className="contents">
                    <Button className="w-full min-w-40" size="lg" variant="secondary">
                      {t("hero.browseListings")}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Slide indicator dots */}
              <div className="mt-10 flex gap-2">
                {slides.map((slide, index) => (
                  <button
                    aria-label={t("hero.goToSlide", { number: index + 1 })}
                    className={`h-2 rounded-full transition-all duration-500 ${
                      activeSlide === index
                        ? "w-10 bg-primary shadow-[0_0_10px_rgba(229,57,53,0.5)]"
                        : "w-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                    }`}
                    key={slide.title}
                    onClick={() => setActiveSlide(index)}
                    type="button"
                  />
                ))}
              </div>
            </div>

            <div className="relative hidden min-h-[460px] md:block" data-animate>
              <div className="absolute inset-4 rounded-[2rem] bg-gradient-to-br from-primary/10 via-white to-neutral-100 shadow-2xl shadow-primary/10 dark:from-primary/20 dark:via-neutral-900 dark:to-neutral-950" />
              <div className="absolute right-8 top-8 w-72 rotate-2 rounded-[2rem] border border-neutral-200 bg-neutral-950 p-3 shadow-2xl dark:border-neutral-700">
                <div className="overflow-hidden rounded-[1.35rem] bg-neutral-50 dark:bg-neutral-900">
                  <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                    <span className="text-xs font-black text-neutral-900 dark:text-white">{t("app.name")}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-black text-primary">{t("hero.browseListings")}</span>
                  </div>
                  <div className="grid gap-3 p-3">
                    {heroListings.map((listing, index) => {
                      const image = getHeroImage(listing)
                      const title = language === "km" && listing.titleKm ? listing.titleKm : listing.title
                      return (
                        <article
                          className={`grid grid-cols-[4.5rem_1fr] gap-3 rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 ${
                            index === 1 ? "-ml-5" : index === 2 ? "ml-5" : ""
                          }`}
                          key={listing.id}
                        >
                          <div className="h-20 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
                            {image ? (
                              <img
                                alt={title}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                sizes={getImageSizes()}
                                src={image}
                                srcSet={getSrcSet(image)}
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 py-1">
                            <p className="line-clamp-2 text-xs font-black leading-5 text-neutral-900 dark:text-white">{title}</p>
                            <p className="mt-1 text-sm font-black text-primary">{formatPrice(listing.price, listing.currency, language)}</p>
                            <p className="mt-1 truncate text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                              {listing.location || listing.province}
                            </p>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="absolute bottom-8 left-8 w-56 -rotate-3 rounded-3xl border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
                <p className="text-xs font-black uppercase tracking-widest text-primary">{t("home.categoriesTitle")}</p>
                <div className="mt-3 grid gap-2">
                  {heroListings.slice(0, 2).map((listing) => (
                    <div className="rounded-xl bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200" key={`${listing.id}-category`}>
                      {getCategoryLabel(listing.categorySlug || listing.category, language)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

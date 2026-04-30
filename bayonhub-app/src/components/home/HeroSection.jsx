import React, { Suspense, useEffect, useMemo, useRef, useState } from "react"
import gsap from "gsap"
import { Link } from "react-router-dom"
import { useTranslation } from "../../hooks/useTranslation"
import { PROVINCES } from "../../lib/locations"
import { useAuthStore } from "../../store/useAuthStore"
import { useListingStore } from "../../store/useListingStore"
import { useUIStore } from "../../store/useUIStore"
import Button from "../ui/Button"

const HeroOrb = React.lazy(() => import("../three/HeroOrb"))

export default function HeroSection() {
  const { t, language } = useTranslation()
  const listings = useListingStore((state) => state.listings)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const togglePostModal = useUIStore((state) => state.togglePostModal)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const setPendingAction = useUIStore((state) => state.setPendingAction)
  const [activeSlide, setActiveSlide] = useState(0)
  const sectionRef = useRef(null)
  const slideRef = useRef(null)
  const statRefs = useRef([])
  const verifiedSellers = useMemo(
    () => new Set(listings.filter((listing) => listing.verified).map((listing) => listing.sellerId)).size,
    [listings],
  )
  const titleClass = language === "km" ? "font-khmer text-3xl sm:text-4xl lg:text-5xl" : "font-display text-4xl sm:text-5xl lg:text-6xl"

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        statRefs.current.forEach((element) => {
          const state = { value: 0 }
          gsap.to(state, {
            value: Number(element?.dataset.value || 0),
            duration: 1.4,
            ease: "power2.out",
            onUpdate: () => {
              if (element) element.textContent = Math.round(state.value).toLocaleString()
            },
          })
        })
        observer.disconnect()
      },
      { threshold: 0.35 },
    )
    observer.observe(section)
    return () => observer.disconnect()
  }, [listings.length, verifiedSellers])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((value) => (value + 1) % 3)
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
    if (!isAuthenticated) {
      setPendingAction(pendingAction)
      toggleAuthModal(true)
      return
    }
    setPendingAction(pendingAction)
    togglePostModal(true)
  }

  const slides = [
    {
      title: t("hero.slide1Title"),
      subtitle: t("hero.slide1Sub"),
      cta: t("hero.postFreeAd"),
      action: () => openPostFlow(),
    },
    {
      title: t("hero.slide2Title"),
      subtitle: t("hero.slide2Sub"),
      cta: t("hero.browseHouses"),
      to: "/category/house-land",
    },
    {
      title: t("hero.slide3Title"),
      subtitle: t("hero.slide3Sub"),
      cta: t("hero.postCar"),
      action: () => openPostFlow({ categoryId: "vehicles", subcategoryId: "cars" }),
    },
  ]
  const currentSlide = slides[activeSlide]

  const stats = [
    { value: (listings.length > 0 ? listings.length : 0) + 5420, label: t("hero.totalListings") },
    { value: (verifiedSellers > 0 ? verifiedSellers : 0) + 1240, label: t("hero.verifiedSellers") },
    { value: PROVINCES.length, label: t("hero.provincesCovered") },
  ]

  return (
    <section ref={sectionRef} className="noise-overlay relative isolate overflow-hidden bg-white px-4 py-10 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-gradient-to-br from-neutral-50 via-white to-primary/10 p-5 shadow-2xl sm:p-10">
          <div className="grid min-h-[460px] items-center gap-12 lg:grid-cols-[60fr_40fr]">
            <div ref={slideRef} className="min-w-0" data-animate>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                {t("hero.eyebrow")}
              </div>
              <h1 className={`${titleClass} mt-6 max-w-full break-words leading-[1.1] text-neutral-950 [overflow-wrap:anywhere]`}>
                {currentSlide.title}
              </h1>
              <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-neutral-500">
                {currentSlide.subtitle}
              </p>
              
              <div className="mt-10 flex flex-col gap-4">
                <div className="group relative max-w-2xl">
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 opacity-25 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200" />
                  <div className="relative flex items-center rounded-2xl border border-neutral-200 bg-white/80 p-2 shadow-sm backdrop-blur-md">
                    <input
                      className="w-full border-none bg-transparent px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:ring-0"
                      placeholder={t("nav.searchPlaceholder")}
                      type="text"
                    />
                    <Button className="hidden h-12 min-w-32 sm:flex" size="md">
                      {t("hero.searchButton") || t("ui.search")}
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 xs:flex-row">
                  {currentSlide.to ? (
                    <Link to={currentSlide.to}>
                      <Button className="w-full min-w-40" size="lg">
                        {currentSlide.cta}
                      </Button>
                    </Link>
                  ) : (
                    <Button className="min-w-40" onClick={currentSlide.action} size="lg">
                      {currentSlide.cta}
                    </Button>
                  )}
                  <Link to="/category/vehicles">
                    <Button className="w-full min-w-40" size="lg" variant="secondary">
                      {t("hero.browseListings")}
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="mt-10 flex gap-2">
                {slides.map((slide, index) => (
                  <button
                    aria-label={t("hero.goToSlide", { number: index + 1 })}
                    className={`h-2 rounded-full transition-all duration-300 ${activeSlide === index ? "w-10 bg-primary" : "w-2 bg-neutral-200 hover:bg-neutral-300"}`}
                    key={slide.title}
                    onClick={() => setActiveSlide(index)}
                    type="button"
                  />
                ))}
              </div>
            </div>
            <div className="relative hidden min-h-[460px] md:block" data-animate>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-30 blur-3xl" />
              <Suspense fallback={<div className="mx-auto h-80 w-80 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 animate-pulse" />}>
                <HeroOrb />
              </Suspense>
            </div>
          </div>
        </div>
        <div className="mt-6 grid max-w-full grid-cols-3 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm sm:max-w-2xl">
          {stats.map((stat, index) => (
            <div className="relative px-3 py-4 text-center sm:px-5" key={stat.label}>
              {index > 0 ? <span className="absolute bottom-4 left-0 top-4 w-px bg-neutral-200" /> : null}
              <strong
                className="block text-2xl font-black text-neutral-950 sm:text-3xl"
                data-value={stat.value}
                ref={(element) => {
                  statRefs.current[index] = element
                }}
              >
                0
              </strong>
              <span className="mt-1 block break-words text-xs font-bold uppercase leading-5 tracking-wide text-neutral-500 [overflow-wrap:anywhere]">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

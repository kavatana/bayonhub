import { useEffect, useMemo, useRef, useState } from "react"
import gsap from "gsap"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  Settings,
  Shield,
  HelpCircle,
  Bell,
  CheckCheck,
  Bookmark,
  BookmarkPlus,
  BookOpen,
  BriefcaseBusiness,
  Car,
  ChevronDown,
  Grid2X2,
  Home,
  LogIn,
  LogOut,
  MapPin,
  PawPrint,
  Plus,
  Search,
  Shirt,
  Smartphone,
  Sofa,
  Store,
  Tv,
  User,
  Utensils,
  Wrench,
  X,
  Sun,
  Moon,
} from "lucide-react"
import toast from "react-hot-toast"
import { useClickAway } from "../../hooks/useClickAway"
import { useTranslation } from "../../hooks/useTranslation"
import { CATEGORIES } from "../../lib/categories"
import { PROVINCES } from "../../lib/locations"
import { cn, listingUrl, timeAgo } from "../../lib/utils"
import { useAuthStore } from "../../store/useAuthStore"
import { useListingStore } from "../../store/useListingStore"
import { useUIStore } from "../../store/useUIStore"
import { useNotificationStore } from "../../store/useNotificationStore"
import Button from "../ui/Button"

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
  Store,
  Tv,
  Utensils,
  Wrench,
}

const recentStorageKey = "bayonhub:recentSearches"

function readRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(recentStorageKey) || "[]")
  } catch {
    return []
  }
}

function getSuggestionImage(listing) {
  const image = listing.images?.[0]
  if (typeof image === "string") return image
  return image?.thumbUrl || image?.url || listing.imageUrl || ""
}

function getCategoryLabel(categorySlug, language) {
  const category = CATEGORIES.find((item) => item.slug === categorySlug || item.id === categorySlug || item.label.en === categorySlug)
  return category?.label?.[language] || categorySlug
}

function hasActiveFilters(filters) {
  return Object.values(filters).some((value) => {
    if (Array.isArray(value)) return value.length > 0
    return Boolean(value)
  })
}

function notificationLabel(type, t) {
  if (type === "message") return t("notif.newMessage")
  if (type === "price_drop") return t("notif.priceDrop")
  if (type === "expiry") return t("notif.expiry")
  return t("notif.digest")
}

export default function Navbar() {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setLanguage = useUIStore((state) => state.setLanguage)
  const selectedProvince = useUIStore((state) => state.selectedProvince)
  const setSelectedProvince = useUIStore((state) => state.setSelectedProvince)
  const togglePostModal = useUIStore((state) => state.togglePostModal)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const setPendingAction = useUIStore((state) => state.setPendingAction)
  const hideBottomNav = useUIStore((state) => state.hideBottomNav)
  const setSearchQuery = useUIStore((state) => state.setSearchQuery)
  const theme = useUIStore((state) => state.theme)
  const toggleTheme = useUIStore((state) => state.toggleTheme)
  const listings = useListingStore((state) => state.listings)
  const filters = useListingStore((state) => state.filters)
  const saveSearch = useListingStore((state) => state.saveSearch)
  const [scrolled, setScrolled] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState(() => readRecentSearches())
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(0)
  const [bottomHidden, setBottomHidden] = useState(false)
  const navRef = useRef(null)
  const searchRef = useClickAway(() => setSearchOpen(false))
  const locationRef = useClickAway(() => setLocationOpen(false))
  const userMenuRef = useClickAway(() => setUserMenuOpen(false))
  const notificationRef = useClickAway(() => setNotificationOpen(false))
  const mobileLocationRef = useClickAway(() => setLocationOpen(false))
  const megaRef = useRef(null)
  const closeTimerRef = useRef(null)
  const isHome = location.pathname === "/"
  const heroTop = false
  const notifications = useNotificationStore((state) => state.notifications)
  const unreadCount = useNotificationStore((state) => state.unreadTotal)
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications)
  const markAllRead = useNotificationStore((state) => state.markAllRead)
  const markRead = useNotificationStore((state) => state.markRead)

  const trending = useMemo(
    () => [
      t("nav.trendPhone"),
      t("nav.trendCar"),
      t("nav.trendCondo"),
      t("nav.trendJob"),
      t("nav.trendLaptop"),
    ],
    [t],
  )

  const popularSearches = useMemo(
    () => [
      t("search.popularIphone"),
      t("search.popularToyotaCamry"),
      t("search.popularBkk1Apartment"),
      t("search.popularHondaWave"),
      t("search.popularSamsungGalaxy"),
      t("search.popularPhnomPenhJob"),
    ],
    [t],
  )

  const suggestions = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return []
    const needle = debouncedQuery.toLowerCase()
    return listings
      .filter((listing) => listing.title?.toLowerCase().includes(needle) || listing.titleKm?.includes(debouncedQuery))
      .slice(0, 6)
      .map((listing) => ({
        id: listing.id,
        title: listing.title,
        titleKm: listing.titleKm,
        image: getSuggestionImage(listing),
        category: listing.categorySlug || listing.category,
        listing: listing,
      }))
  }, [debouncedQuery, listings])

  const suggestionList = useMemo(() => {
    if (query.trim()) return trending
    return recentSearches.length ? recentSearches : trending
  }, [query, recentSearches, trending])

  const canSaveSearch = query.trim() || hasActiveFilters(filters)

  const selectedProvinceLabel = useMemo(() => {
    if (!selectedProvince || selectedProvince === "all") return t("nav.allCambodia")
    return PROVINCES.find((province) => province.label.en === selectedProvince)?.label[language] || selectedProvince
  }, [language, selectedProvince, t])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!navRef.current) return
    gsap.to(navRef.current, {
      backgroundColor: scrolled || !isHome ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0)",
      duration: 0.3,
      ease: "power2.out",
    })
  }, [isHome, scrolled])

  useEffect(() => {
    document.documentElement.classList.toggle("font-khmer", language === "km")
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 250)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!megaOpen || !megaRef.current) return
    gsap.fromTo(
      megaRef.current.querySelectorAll("[data-mega-column]"),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", stagger: 0.08 },
    )
  }, [megaOpen])

  useEffect(() => {
    if (!searchRef.current) return
    gsap.to(searchRef.current, {
      width: searchOpen ? 420 : 320,
      duration: 0.25,
      ease: "power2.out",
    })
  }, [searchOpen, searchRef])

  useEffect(() => {
    if (!window.visualViewport) return undefined
    const initialHeight = window.visualViewport.height
    const onResize = () => setBottomHidden(initialHeight - window.visualViewport.height > 120)
    window.visualViewport.addEventListener("resize", onResize)
    return () => window.visualViewport.removeEventListener("resize", onResize)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return undefined
    fetchNotifications({ page: 1, limit: 10 })
    const timer = window.setInterval(() => fetchNotifications({ page: 1, limit: 10 }), 30000)
    return () => window.clearInterval(timer)
  }, [fetchNotifications, isAuthenticated])

  function saveRecentSearch(value) {
    const trimmed = value.trim()
    if (!trimmed) return
    const next = [trimmed, ...readRecentSearches().filter((item) => item !== trimmed)].slice(0, 5)
    localStorage.setItem(recentStorageKey, JSON.stringify(next))
    setRecentSearches(next)
  }

  function navigateSearch(value = query) {
    const trimmed = value.trim()
    if (!trimmed) return
    saveRecentSearch(trimmed)
    setSearchQuery(trimmed)
    setSearchOpen(false)
    setMobileSearchOpen(false)
    navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  function navigateSuggestion(item) {
    saveRecentSearch(item.title)
    setSearchOpen(false)
    setMobileSearchOpen(false)
    navigate(listingUrl(item.listing))
  }

  function saveCurrentSearch() {
    const trimmed = query.trim()
    const activeFilters = { ...filters }
    if (!isAuthenticated) {
      toast.info(t("auth.signInToSaveSearch"), { duration: 3000 })
      setPendingAction({ type: "saveSearch", query: trimmed, filters: activeFilters })
      toggleAuthModal(true)
      return
    }
    saveSearch(trimmed, activeFilters)
  }

  function handleSearchKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      const count = suggestions.length || suggestionList.length
      setActiveSuggestion((value) => Math.min(value + 1, Math.max(count - 1, 0)))
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveSuggestion((value) => Math.max(value - 1, 0))
    }
    if (event.key === "Enter") {
      event.preventDefault()
      if (suggestions[activeSuggestion]) {
        navigateSuggestion(suggestions[activeSuggestion])
        return
      }
      navigateSearch(suggestionList[activeSuggestion] || query)
    }
    if (event.key === "Escape") {
      setSearchOpen(false)
      setMobileSearchOpen(false)
    }
  }

  function openMega() {
    window.clearTimeout(closeTimerRef.current)
    setMegaOpen(true)
  }

  function closeMega() {
    closeTimerRef.current = window.setTimeout(() => setMegaOpen(false), 150)
  }

  function openPostFlow() {
    if (!isAuthenticated) {
      setPendingAction({ type: "post" })
    }
    togglePostModal(true)
  }

  async function openNotification(notification) {
    if (!notification.read) await markRead(notification.id)
    setNotificationOpen(false)
    if (notification.link) navigate(notification.link)
  }

  function openDashboard() {
    if (!isAuthenticated) {
      setPendingAction({ type: "dashboard" })
      toggleAuthModal(true)
      return
    }
    navigate("/dashboard")
    setUserMenuOpen(false)
  }

  function openSaved() {
    if (!isAuthenticated) {
      setPendingAction({ type: "dashboard" })
      toggleAuthModal(true)
      return
    }
    navigate("/dashboard?tab=saved")
  }

  const handleLogout = async () => {
    try {
      await useAuthStore.getState().logout()
      setUserMenuOpen(false)
      navigate("/")
      toast.success(t("auth.logoutSuccess"))
    } catch {
      toast.error(t("auth.logoutError"))
    }
  }

  const navTone = heroTop ? "text-white hover:text-white/80" : "text-neutral-700 hover:text-primary dark:text-neutral-300 dark:hover:text-white"

  const searchDropdown = (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-neutral-200 bg-white p-4 text-neutral-900 shadow-2xl">
      <div className="grid gap-4">
        {query.trim() ? (
          <section>
            <p className="text-xs font-black uppercase tracking-widest text-neutral-400">{t("nav.liveSuggestions")}</p>
            <div className="mt-2 grid gap-1">
              {suggestions.length ? (
                suggestions.map((item, index) => {
                  const title = language === "km" && item.titleKm ? item.titleKm : item.title
                  return (
                    <button
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-left transition",
                        activeSuggestion === index ? "bg-primary text-white" : "hover:bg-neutral-100",
                      )}
                      key={item.id}
                      onMouseDown={(event) => {
                        event.preventDefault()
                        navigateSuggestion(item)
                      }}
                      type="button"
                    >
                      {item.image ? (
                        <img alt={title} className="h-8 w-8 rounded-lg object-cover" src={item.image} />
                      ) : (
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-neutral-100 text-xs font-black text-neutral-400">
                          {t("footer.logoMark")}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black">{title}</span>
                        <span className={cn("block truncate text-xs font-bold", activeSuggestion === index ? "text-white/80" : "text-neutral-400")}>
                          {getCategoryLabel(item.category, language)}
                        </span>
                      </span>
                    </button>
                  )
                })
              ) : (
                <p className="px-3 py-2 text-sm font-semibold text-neutral-500">{t("search.noSuggestions")}</p>
              )}
            </div>
          </section>
        ) : null}
        {!query.trim() ? (
          <section>
            <p className="text-xs font-black uppercase tracking-widest text-neutral-400">{t("search.popular")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {popularSearches.map((item) => (
                <button
                  className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
                  key={item}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    navigateSearch(item)
                  }}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </section>
        ) : null}
        {recentSearches.length ? (
          <section>
            <p className="text-xs font-black uppercase tracking-widest text-neutral-400">{t("nav.recentSearches")}</p>
            <div className="mt-2 grid gap-1">
              {recentSearches.map((item) => (
                <button
                  className="rounded-xl px-3 py-2 text-left text-sm font-semibold transition hover:bg-neutral-100"
                  key={item}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    navigateSearch(item)
                  }}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </section>
        ) : null}
        <section>
          <p className="text-xs font-black uppercase tracking-widest text-neutral-400">{t("nav.trending")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {trending.map((item) => (
              <button
                className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-700 transition hover:bg-primary hover:text-white"
                key={item}
                onMouseDown={(event) => {
                  event.preventDefault()
                  navigateSearch(item)
                }}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )

  return (
    <>
      <header
        ref={navRef}
        className={cn(
          "sticky top-0 z-50 border-b transition-colors backdrop-blur-md dark:bg-neutral-900/90 dark:border-neutral-800",
          scrolled || !isHome ? "border-neutral-100 shadow-sm" : "border-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link className="flex items-center gap-3" to="/">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-sm font-black text-white shadow-lg shadow-primary/20">
              BH
            </span>
            <span className="hidden xs:block">
              <strong className={cn("block text-base font-black leading-none", heroTop ? "text-white" : "text-neutral-900")}>
                {t("app.name")}
              </strong>
              <small className={cn("block text-[11px] font-semibold", heroTop ? "text-white/75" : "text-neutral-500")}>
                {t("app.tagline")}
              </small>
            </span>
          </Link>

          <nav className="hidden items-center gap-5 lg:flex">
            <Link className={cn("text-sm font-bold transition", navTone)} to="/">
              {t("nav.home")}
            </Link>
            <div onMouseEnter={openMega} onMouseLeave={closeMega}>
              <button className={cn("inline-flex items-center gap-1 text-sm font-bold transition", navTone)} type="button">
                {t("nav.categories")}
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <Link className={cn("text-sm font-bold transition", navTone)} to="/pricing">
              {t("nav.pricing")}
            </Link>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <div ref={locationRef} className="relative">
              <button
                aria-expanded={locationOpen}
                aria-label={t("nav.location")}
                className="inline-flex h-10 max-w-52 items-center gap-2 rounded-full border border-neutral-200 bg-white/95 px-3 text-sm font-bold text-neutral-700 outline-none transition hover:border-primary focus:border-primary dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300"
                onClick={() => setLocationOpen((current) => !current)}
                type="button"
              >
                <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate">{selectedProvinceLabel}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </button>
              {locationOpen ? (
                <div className="absolute right-0 z-50 mt-2 grid max-h-80 min-w-56 gap-1 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-2 text-neutral-900 shadow-2xl dark:bg-neutral-900 dark:border-neutral-700 dark:text-white">
                  <button
                    className={cn(
                      "rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800",
                      selectedProvince === "all" && "bg-primary/10 text-primary",
                    )}
                    onClick={() => {
                      setSelectedProvince("all")
                      setLocationOpen(false)
                    }}
                    type="button"
                  >
                    {t("nav.allCambodia")}
                  </button>
                {PROVINCES.map((province) => (
                  <button
                    className={cn(
                      "rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800",
                      selectedProvince === province.label.en && "bg-primary/10 text-primary",
                    )}
                    key={province.id}
                    onClick={() => {
                      setSelectedProvince(province.label.en)
                      setLocationOpen(false)
                    }}
                    type="button"
                  >
                    {province.label[language]}
                  </button>
                ))}
                </div>
              ) : null}
            </div>

            <form
              ref={searchRef}
              className="relative hidden w-80 lg:block"
              onSubmit={(event) => {
                event.preventDefault()
                navigateSearch(query)
              }}
            >
              <button type="submit" className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary transition-colors" aria-label={t("nav.search")}>
                <Search className="h-4 w-4" />
              </button>
              <input
                className="h-10 w-full rounded-full border border-neutral-200 bg-white/95 pl-11 pr-20 text-sm font-semibold text-neutral-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActiveSuggestion(0)
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder={t("nav.searchPlaceholder")}
                value={query}
              />
              {canSaveSearch ? (
                <button
                  aria-label={t("search.saveSearch")}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary",
                    query ? "right-10" : "right-3",
                  )}
                  onClick={saveCurrentSearch}
                  type="button"
                >
                  <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
              {query ? (
                <button
                  aria-label={t("nav.clearSearch")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary"
                  onClick={() => setQuery("")}
                  type="button"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
              {searchOpen ? searchDropdown : null}
            </form>
          </div>

          <div className="flex items-center gap-2">
            <button
              aria-label={t("nav.openSearch")}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-full border transition lg:hidden",
                heroTop ? "border-white/30 text-white" : "border-neutral-200 bg-white text-neutral-700",
              )}
              onClick={() => setMobileSearchOpen(true)}
              type="button"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
            <div ref={notificationRef} className="relative hidden sm:block">
              <button
                aria-label={t("nav.notifications")}
                className={cn(
                  "relative grid h-10 w-10 place-items-center rounded-full border transition",
                  heroTop ? "border-white/30 text-white" : "border-neutral-200 bg-white text-neutral-700",
                )}
                onClick={() => {
                  if (!isAuthenticated) {
                    toggleAuthModal(true)
                    return
                  }
                  setNotificationOpen((current) => !current)
                }}
                type="button"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </button>
              {notificationOpen ? (
                <div className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-neutral-200 bg-white text-neutral-900 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
                  <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
                    <p className="text-sm font-black">{t("nav.notifications")}</p>
                    <button className="inline-flex items-center gap-1 text-xs font-black text-primary" onClick={markAllRead} type="button">
                      <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("notif.markAllRead")}
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-2">
                    {notifications.length ? notifications.slice(0, 10).map((notification) => (
                      <button
                        className={cn(
                          "flex w-full gap-3 rounded-xl p-3 text-left transition hover:bg-neutral-50 dark:hover:bg-neutral-800",
                          !notification.read && "bg-primary/5",
                        )}
                        key={notification.id}
                        onClick={() => openNotification(notification)}
                        type="button"
                      >
                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                          <Bell className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-black uppercase tracking-widest text-primary">
                            {notificationLabel(notification.type, t)}
                          </span>
                          <span className="mt-1 block truncate text-sm font-black text-neutral-900 dark:text-white">
                            {notification.title}
                          </span>
                          <span className="mt-1 block line-clamp-2 text-xs font-semibold leading-5 text-neutral-500">
                            {notification.body}
                          </span>
                          <span className="mt-1 block text-[11px] font-bold text-neutral-400">
                            {timeAgo(notification.createdAt, language)}
                          </span>
                        </span>
                      </button>
                    )) : (
                      <div className="px-4 py-8 text-center text-sm font-bold text-neutral-500">
                        {t("notif.empty")}
                      </div>
                    )}
                  </div>
                  <Link
                    className="block border-t border-neutral-100 px-4 py-3 text-center text-sm font-black text-primary dark:border-neutral-800"
                    onClick={() => setNotificationOpen(false)}
                    to="/notifications"
                  >
                    {t("notif.viewAll")}
                  </Link>
                </div>
              ) : null}
            </div>
            <button
              className={cn(
                "hidden rounded-full border px-3 py-2 text-sm font-black transition sm:block",
                heroTop ? "border-white/30 text-white" : "border-neutral-200 bg-white text-neutral-700",
              )}
              onClick={() => setLanguage(language === "km" ? "en" : "km")}
              type="button"
            >
              {t("nav.languageToggle")}
            </button>
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t("ui.lightMode") : t("ui.darkMode")}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {theme === 'dark'
                ? <Sun size={16} className="text-yellow-400" />
                : <Moon size={16} className="text-neutral-600" />
              }
            </button>
            <Button className="hidden lg:inline-flex" onClick={openPostFlow}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("nav.postFreeAd")}
            </Button>
            <div ref={userMenuRef} className="relative hidden lg:block">
              {isAuthenticated ? (
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white pl-1.5 pr-4 text-sm font-bold text-neutral-700 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-black text-primary">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span className="max-w-[100px] truncate">{user?.name}</span>
                  <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", userMenuOpen && "rotate-180")} />
                </button>
              ) : (
                <Button onClick={() => toggleAuthModal(true)} variant="secondary" className="h-11">
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  {t("nav.login")}
                </Button>
              )}

              {userMenuOpen && isAuthenticated && (
                <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 dark:bg-neutral-900 dark:border-neutral-800">
                  <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/50">
                    <p className="truncate font-black text-neutral-900 dark:text-white">{user?.name}</p>
                    <p className="truncate text-xs font-semibold text-neutral-500">{user?.phone || user?.email || t("nav.profile")}</p>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={openDashboard}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      <User className="h-4 w-4 opacity-50" />
                      {t("nav.profile")}
                    </button>
                    <button
                      onClick={() => { navigate("/dashboard?tab=settings"); setUserMenuOpen(false); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      <Settings className="h-4 w-4 opacity-50" />
                      {t("dashboard.settings")}
                    </button>
                    {user?.isAdmin === true ? (
                      <button
                        onClick={() => { navigate("/admin"); setUserMenuOpen(false); }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        <Shield className="h-4 w-4 opacity-50" />
                        {t("admin.dashboard")}
                      </button>
                    ) : null}
                    <button
                      onClick={() => { navigate("/help"); setUserMenuOpen(false); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      <HelpCircle className="h-4 w-4 opacity-50" />
                      {t("nav.help")}
                    </button>
                    <div className="my-1 h-px bg-neutral-100 dark:bg-neutral-800" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <LogOut className="h-4 w-4" />
                      {t("nav.logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {megaOpen ? (
          <div
            ref={megaRef}
            className="absolute left-0 right-0 top-full hidden border-y border-neutral-100 bg-white shadow-2xl lg:block"
            onMouseEnter={openMega}
            onMouseLeave={closeMega}
          >
            <div className="mx-auto grid max-w-7xl grid-cols-4 gap-5 px-6 py-6">
              {CATEGORIES.map((category) => {
                const Icon = iconMap[category.icon] || Grid2X2
                return (
                  <section data-mega-column key={category.id} className="rounded-xl p-3 hover:bg-neutral-50">
                    <Link className="flex items-center gap-3 font-black text-neutral-900" to={`/category/${category.slug}`}>
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      {t(`category.${category.id}`)}
                    </Link>
                    <div className="mt-3 grid gap-2 pl-12">
                      {category.subcategories.slice(0, 5).map((subcategory) => (
                        <Link
                           className="text-sm font-semibold text-neutral-500 transition hover:text-primary"
                           key={subcategory.id}
                           to={`/category/${category.slug}/${subcategory.slug}`}
                        >
                          {t(`category.${subcategory.id}`)}
                        </Link>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          </div>
        ) : null}
      </header>

      {mobileSearchOpen ? (
        <div className="fixed inset-0 z-[70] bg-white p-4 md:hidden">
          <div className="flex items-center gap-3">
            <button
              aria-label={t("nav.searchBack")}
              className="grid h-11 w-11 place-items-center rounded-full border border-neutral-200"
              onClick={() => setMobileSearchOpen(false)}
              type="button"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <h2 className="text-lg font-black text-neutral-900">{t("nav.mobileSearchTitle")}</h2>
          </div>
          <form
            className="relative mt-5"
            onSubmit={(event) => {
              event.preventDefault()
              navigateSearch(query)
            }}
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input
              autoFocus
              className="h-12 w-full rounded-2xl border border-neutral-200 bg-neutral-50 pl-12 pr-20 text-base font-semibold outline-none focus:border-primary focus:bg-white dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500"
              onChange={(event) => {
                setQuery(event.target.value)
                setActiveSuggestion(0)
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={t("nav.searchPlaceholder")}
              value={query}
            />
            {canSaveSearch ? (
              <button
                aria-label={t("search.saveSearch")}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary",
                  query ? "right-10" : "right-4",
                )}
                onClick={saveCurrentSearch}
                type="button"
              >
                <BookmarkPlus className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : null}
            {query ? (
              <button
                aria-label={t("nav.clearSearch")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary"
                onClick={() => setQuery("")}
                type="button"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : null}
          </form>
          <div className="relative mt-3">{searchDropdown}</div>
        </div>
      ) : null}

      {!hideBottomNav ? (
        <nav
          aria-label={t("nav.mobileNavigation")}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] transition-transform lg:hidden",
            bottomHidden && "translate-y-full",
          )}
        >
        <div className="grid grid-cols-5 items-end gap-1">
          {[
            { label: t("nav.home"), icon: Home, path: "/", col: "col-start-1" },
            { label: t("ui.search"), icon: Search, path: "/search", col: "col-start-2" },
            { label: t("dashboard.saved"), icon: Bookmark, path: "/dashboard?tab=saved", col: "col-start-4", action: openSaved },
            { label: t("nav.profile"), icon: User, path: "/dashboard", col: "col-start-5", action: openDashboard },
          ].map((item) => {
            const Icon = item.icon
            const active =
              item.path === "/"
                ? location.pathname === "/"
                : item.path.includes("?tab=saved")
                  ? location.pathname === "/dashboard" && location.search.includes("tab=saved")
                  : location.pathname.startsWith(item.path)
            return (
              <button
                aria-label={item.label}
                key={item.label}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-black transition-all",
                  item.col,
                  active ? "text-teal-600" : "text-neutral-500 hover:text-neutral-900",
                )}
                onClick={() => (item.action ? item.action() : navigate(item.path))}
                type="button"
              >
                {active ? <span className="absolute top-1 h-1 w-6 rounded-full bg-teal-600" aria-hidden="true" /> : null}
                <div className={cn("grid h-8 w-14 place-items-center rounded-full transition-colors", active && "bg-teal-50")}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className={cn("transition-opacity", active ? "opacity-100" : "opacity-80")}>{item.label}</span>
              </button>
            )
          })}
          <button
            aria-label={t("a11y.postFAB")}
            className="col-start-3 row-start-1 mx-auto -mt-7 grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full bg-teal-600 text-white shadow-2xl shadow-teal-600/30 transition active:scale-95"
            onClick={() => navigate("/post")}
            type="button"
          >
            <span className="sr-only">{t("nav.postFreeAd")}</span>
            <Plus className="h-8 w-8" aria-hidden="true" />
          </button>
        </div>
      </nav>
      ) : null}
      <div className="h-20 lg:hidden" aria-hidden="true" />
      <div className="fixed left-4 top-20 z-40 md:hidden">
        <div ref={mobileLocationRef} className="relative">
          <button
            onClick={() => setLocationOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/95 px-3 py-2 text-xs font-bold text-neutral-600 shadow-sm backdrop-blur-md active:scale-95 transition-transform"
          >
            <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            {selectedProvinceLabel}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </button>
          {locationOpen ? (
            <div className="absolute left-0 mt-2 grid max-h-80 min-w-56 gap-1 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-2 text-neutral-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <button
                className={cn(
                  "rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-neutral-50",
                  selectedProvince === "all" && "bg-primary/10 text-primary",
                )}
                onClick={() => {
                  setSelectedProvince("all")
                  setLocationOpen(false)
                }}
                type="button"
              >
                {t("nav.allCambodia")}
              </button>
              {PROVINCES.map((province) => (
                <button
                  className={cn(
                    "rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-neutral-50",
                    selectedProvince === province.label.en && "bg-primary/10 text-primary",
                  )}
                  key={province.id}
                  onClick={() => {
                    setSelectedProvince(province.label.en)
                    setLocationOpen(false)
                  }}
                  type="button"
                >
                  {province.label[language]}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

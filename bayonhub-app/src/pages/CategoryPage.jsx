import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import InfiniteScroll from "react-infinite-scroll-component"
import { Building2, ChevronDown, Home, Map as MapIcon, PlusCircle, SlidersHorizontal, Store, X } from "lucide-react"
import BodyTypeFilter from "../components/filters/BodyTypeFilter"
import BrandLogoFilter from "../components/filters/BrandLogoFilter"
import FacetedFilter from "../components/filters/FacetedFilter"
import ListingGrid from "../components/listing/ListingGrid"
import ListingListItem from "../components/listing/ListingListItem"
import PageTransition from "../components/ui/PageTransition"
import PriceRangeSlider from "../components/ui/PriceRangeSlider"
import MultiSelectFilter from "../components/ui/MultiSelectFilter"
import Overlay from "../components/ui/Overlay"
import SkeletonCard from "../components/ui/SkeletonCard"
import ViewToggle from "../components/ui/ViewToggle"
import Button from "../components/ui/Button"
import Breadcrumb from "../components/ui/Breadcrumb"
import { useClickAway } from "../hooks/useClickAway"
import { useTranslation } from "../hooks/useTranslation"
import { CAR_BODY_TYPES, CAR_BRANDS, findCategory, findSubcategory } from "../lib/categories"
import { getDistrictsForProvince, PROVINCES } from "../lib/locations"
import { canonicalUrl } from "../lib/seo"
import { cn, formatPrice, getListingImage, listingUrl } from "../lib/utils"
import { useListingStore } from "../store/useListingStore"
import { useUIStore } from "../store/useUIStore"

const MapView = lazy(() => import("../components/ui/MapView"))

const conditionOptions = [
  { value: "New", key: "condition.new" },
  { value: "Used", key: "condition.used" },
  { value: "Refurbished", key: "condition.refurbished" },
]

const sortOptions = [
  ["newest", "sort.newestFirst"],
  ["priceLow", "sort.priceLow"],
  ["priceHigh", "sort.priceHigh"],
  ["views", "sort.views"],
]

const vehicleFacetIds = ["make", "bodyType"]
const propertyFacetIds = ["type", "bedrooms", "bathrooms", "size_sqm", "floor"]
const propertyIconMap = {
  apartment: Building2,
  villa: Home,
  shophouse: Store,
  land: MapIcon,
  office: Building2,
  condo: Building2,
}

function getPriceMax(categorySlug) {
  if (categorySlug === "house-land") return 1000000
  if (categorySlug === "vehicles") return 100000
  if (categorySlug === "electronics") return 5000
  if (categorySlug === "phones-tablets") return 3000
  return 20000
}

function EmptyIllustration() {
  return (
    <svg aria-hidden="true" className="mx-auto h-28 w-28 text-neutral-300" fill="none" viewBox="0 0 120 120">
      <rect className="fill-current opacity-20" height="70" rx="14" width="92" x="14" y="26" />
      <path className="stroke-current" d="M38 48h44M38 62h28M38 76h36" strokeLinecap="round" strokeWidth="6" />
    </svg>
  )
}

function ToggleFilter({ checked, label, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 p-3 text-sm font-bold text-neutral-700">
      <span>{label}</span>
      <input checked={checked} className="peer sr-only" onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      <span className="relative h-6 w-11 rounded-full bg-neutral-300 transition peer-checked:bg-primary after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
    </label>
  )
}

function getOptionValue(option) {
  return typeof option === "string" ? option : option.value
}

function getOptionLabel(option, language) {
  return typeof option === "string" ? option : option.label?.[language] || option.value
}

function getFacetValue(listing, key) {
  return listing.facets?.[key] ?? listing[key]
}

function matchesNumericOption(value, option) {
  const numericValue = Number(value || 0)
  if (!option) return true
  if (String(option).endsWith("+")) return numericValue >= Number(String(option).replace("+", ""))
  return String(value) === String(option)
}

function getBrandIds(value) {
  if (Array.isArray(value)) return value
  return value ? [value] : []
}

function QuickFilterDropdown({ label, activeLabel, options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useClickAway(() => setOpen(false))
  const active = Boolean(value)

  return (
    <div ref={dropdownRef} className="relative">
      <button
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-full border border-neutral-200 px-3 text-sm font-black transition",
          active && "border-primary bg-primary text-white",
        )}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {activeLabel || label}
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 grid min-w-44 gap-1 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl">
          {options.map((option) => (
            <button
              className={cn(
                "rounded-lg px-3 py-2 text-left text-sm font-bold text-neutral-700 hover:bg-neutral-50",
                value === option.value && "bg-primary/10 text-primary",
              )}
              key={option.value || "all"}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function PropertyTypeFilter({ options, selected, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => {
        const Icon = propertyIconMap[option.value] || Building2
        const isSelected = selected === option.value
        return (
          <button
            aria-pressed={isSelected}
            className={cn(
              "grid min-h-20 place-items-center gap-2 rounded-xl border border-neutral-200 bg-white p-3 text-xs font-black text-neutral-700 transition",
              isSelected && "border-primary bg-primary text-white",
            )}
            key={option.value}
            onClick={() => onChange(isSelected ? "" : option.value)}
            type="button"
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function BottomSheet({ open, onClose, children, title, returnFocusRef }) {
  const [startY, setStartY] = useState(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const returnFocusTarget = returnFocusRef?.current
    const frame = window.requestAnimationFrame(() => {
      panelRef.current?.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")?.focus()
    })
    return () => {
      window.cancelAnimationFrame(frame)
      returnFocusTarget?.focus()
    }
  }, [open, returnFocusRef])

  if (!open || typeof document === "undefined") return null
  return createPortal(
    <Overlay
      ref={panelRef}
      ariaLabel={title}
      backdropClassName="z-[70] bg-black/40 lg:hidden"
      className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-hidden rounded-t-2xl bg-white shadow-2xl"
      disableBackdropClick
      onClose={onClose}
      open={open}
    >
      <div
        onTouchEnd={(event) => {
          if (startY !== null && event.changedTouches[0].clientY - startY > 80) onClose()
          setStartY(null)
        }}
        onTouchStart={(event) => setStartY(event.touches[0].clientY)}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-neutral-300" />
        <div className="border-b border-neutral-100 p-4">
          <h2 className="font-black text-neutral-900">{title}</h2>
        </div>
        <div className="max-h-[72vh] overflow-y-auto p-4">{children}</div>
      </div>
    </Overlay>,
    document.body,
  )
}

export default function CategoryPage() {
  const { slug, subcategory } = useParams()
  const { t, language } = useTranslation()
  const category = findCategory(slug)
  const activeSubcategory = subcategory ? findSubcategory(slug, subcategory) : null
  const listings = useListingStore((state) => state.listings)
  const togglePostModal = useUIStore((state) => state.togglePostModal)
  const fetchListings = useListingStore((state) => state.fetchListings)
  const fetchMoreListings = useListingStore((state) => state.fetchMoreListings)
  const hasMore = useListingStore((state) => state.hasMore)
  const selectedProvince = useUIStore((state) => state.selectedProvince)
  const setSelectedProvince = useUIStore((state) => state.setSelectedProvince)
  const [searchParams, setSearchParams] = useSearchParams()
  const [view, setView] = useState(() => searchParams.get("view") || "grid")
  const [sort, setSort] = useState(() => searchParams.get("sort") || "newest")
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const filterTriggerRef = useRef(null)
  const [price, setPrice] = useState(() => [
    Number(searchParams.get("minPrice") || 0),
    searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null,
  ])
  const [conditions, setConditions] = useState(() => {
    const val = searchParams.get("condition")
    return val ? val.split(",") : []
  })
  const [districts, setDistricts] = useState(() => {
    const val = searchParams.get("district")
    return val ? val.split(",") : []
  })
  const [facetFilters, setFacetFilters] = useState(() => {
    const val = searchParams.get("facets")
    try {
      return val ? JSON.parse(val) : {}
    } catch {
      return {}
    }
  })
  const [verifiedOnly, setVerifiedOnly] = useState(() => searchParams.get("verified") === "true")
  const [withPhotos, setWithPhotos] = useState(() => searchParams.get("photos") === "true")
  const [negotiableOnly, setNegotiableOnly] = useState(() => searchParams.get("negotiable") === "true")
  const [yearRange, setYearRange] = useState(() => searchParams.get("year") || "")
  const [quickCondition, setQuickCondition] = useState(() => searchParams.get("qcondition") || "")
  const [bedrooms, setBedrooms] = useState(() => searchParams.get("bedrooms") || "")
  const [bathrooms, setBathrooms] = useState(() => searchParams.get("bathrooms") || "")
  const [sizeRange, setSizeRange] = useState(() => [
    Number(searchParams.get("minSize") || 0),
    Number(searchParams.get("maxSize") || 2000),
  ])
  const [floorNumber, setFloorNumber] = useState(() => searchParams.get("floor") || "")
  const title = activeSubcategory ? t(`category.${activeSubcategory.id}`) : category ? t(`category.${category.id}`) : t("page.notFound")
  const provinceLabel = selectedProvince === "all" ? t("nav.allCambodia") : selectedProvince
  const activeCategory = category?.slug || slug
  const isVehicleCategory = activeCategory === "vehicles"
  const isHouseLandCategory = activeCategory === "house-land"
  const priceMax = useMemo(() => getPriceMax(activeCategory), [activeCategory])
  const priceValue = useMemo(() => [price[0], price[1] ?? priceMax], [price, priceMax])
  const visibleFacets = useMemo(() => {
    const source = activeSubcategory ? activeSubcategory.facets : category?.subcategories.flatMap((item) => item.facets) || []
    const uniqueFacets = new Map()
    source.forEach((facet) => {
      if (!uniqueFacets.has(facet.id)) uniqueFacets.set(facet.id, facet)
    })
    return Array.from(uniqueFacets.values())
  }, [activeSubcategory, category])
  const districtOptions = useMemo(() => {
    const province = PROVINCES.find((item) => item.label.en === selectedProvince)
    return getDistrictsForProvince(province?.slug).map((district) => ({
      value: district.label.en,
      label: district.label[language],
    }))
  }, [language, selectedProvince])
  const yearOptions = useMemo(
    () => [
      { value: "", label: t("filter.yearAll") },
      { value: "2024-2026", label: t("filter.year2024") },
      { value: "2020-2023", label: t("filter.year2020") },
      { value: "2015-2019", label: t("filter.year2015") },
      { value: "2010-2014", label: t("filter.year2010") },
      { value: "before-2010", label: t("filter.yearBefore2010") },
    ],
    [t],
  )
  const quickConditionOptions = useMemo(
    () => [
      { value: "", label: t("filter.conditionAll") },
      { value: "New", label: t("condition.new") },
      { value: "Used", label: t("condition.used") },
      { value: "Refurbished", label: t("condition.refurbished") },
    ],
    [t],
  )
  const roomOptions = useMemo(
    () => [
      { value: "", label: t("filter.any") },
      { value: "1", label: "1" },
      { value: "2", label: "2" },
      { value: "3", label: "3" },
      { value: "4", label: "4" },
      { value: "5+", label: "5+" },
    ],
    [t],
  )
  const bathroomOptions = useMemo(
    () => [
      { value: "", label: t("filter.any") },
      { value: "1", label: "1" },
      { value: "2", label: "2" },
      { value: "3+", label: "3+" },
    ],
    [t],
  )
  const propertyTypeOptions = useMemo(
    () => [
      { value: "apartment", label: t("property.apartment") },
      { value: "villa", label: t("property.house") },
      { value: "shophouse", label: t("property.shophouse") },
      { value: "land", label: t("property.land") },
      { value: "office", label: t("property.office") },
      { value: "condo", label: t("property.condo") },
    ],
    [t],
  )
  const hiddenFacetIds = useMemo(
    () => [
      ...(isVehicleCategory ? vehicleFacetIds : []),
      ...(isHouseLandCategory ? propertyFacetIds : []),
    ],
    [isHouseLandCategory, isVehicleCategory],
  )

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    
    // Sync to URL
    if (view !== "grid") next.set("view", view); else next.delete("view")
    if (sort !== "newest") next.set("sort", sort); else next.delete("sort")
    if (price[0] > 0) next.set("minPrice", String(price[0])); else next.delete("minPrice")
    if (price[1] !== null) next.set("maxPrice", String(price[1])); else next.delete("maxPrice")
    if (conditions.length) next.set("condition", conditions.join(",")); else next.delete("condition")
    if (districts.length) next.set("district", districts.join(",")); else next.delete("district")
    if (Object.keys(facetFilters).length) next.set("facets", JSON.stringify(facetFilters)); else next.delete("facets")
    if (verifiedOnly) next.set("verified", "true"); else next.delete("verified")
    if (withPhotos) next.set("photos", "true"); else next.delete("photos")
    if (negotiableOnly) next.set("negotiable", "true"); else next.delete("negotiable")
    if (yearRange) next.set("year", yearRange); else next.delete("year")
    if (quickCondition) next.set("qcondition", quickCondition); else next.delete("qcondition")
    if (bedrooms) next.set("bedrooms", bedrooms); else next.delete("bedrooms")
    if (bathrooms) next.set("bathrooms", bathrooms); else next.delete("bathrooms")
    if (sizeRange[0] > 0) next.set("minSize", String(sizeRange[0])); else next.delete("minSize")
    if (sizeRange[1] < 2000) next.set("maxSize", String(sizeRange[1])); else next.delete("maxSize")
    if (floorNumber) next.set("floor", floorNumber); else next.delete("floor")

    // Avoid redundant updates
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [view, sort, price, conditions, districts, facetFilters, verifiedOnly, withPhotos, negotiableOnly, yearRange, quickCondition, bedrooms, bathrooms, sizeRange, floorNumber, setSearchParams, searchParams])

  useEffect(() => {
    fetchListings({
      category: activeSubcategory?.label.en || category?.label.en || "",
    })
  }, [activeSubcategory, category, fetchListings])

  const displayedListings = useMemo(() => {
    const scoped = listings.filter((listing) => {
      const matchesStatus = !listing.status || String(listing.status).toUpperCase() === "ACTIVE"
      const matchesCategory = !category || listing.category === category.label.en || listing.subcategory === activeSubcategory?.label.en
      const matchesPrice = Number(listing.price || 0) >= priceValue[0] && Number(listing.price || 0) <= priceValue[1]
      const matchesCondition = !conditions.length || conditions.includes(listing.condition)
      const matchesQuickCondition = !quickCondition || listing.condition === quickCondition
      const matchesDistrict = !districts.length || districts.includes(listing.district)
      const listingYear = Number(getFacetValue(listing, "year") || 0)
      const matchesYear =
        !yearRange ||
        (yearRange === "2024-2026" && listingYear >= 2024 && listingYear <= 2026) ||
        (yearRange === "2020-2023" && listingYear >= 2020 && listingYear <= 2023) ||
        (yearRange === "2015-2019" && listingYear >= 2015 && listingYear <= 2019) ||
        (yearRange === "2010-2014" && listingYear >= 2010 && listingYear <= 2014) ||
        (yearRange === "before-2010" && listingYear > 0 && listingYear < 2010)
      const matchesBedrooms = !bedrooms || matchesNumericOption(getFacetValue(listing, "bedrooms"), bedrooms)
      const matchesBathrooms = !bathrooms || matchesNumericOption(getFacetValue(listing, "bathrooms"), bathrooms)
      const matchesFloor = !floorNumber || Number(getFacetValue(listing, "floor") || 0) === Number(floorNumber)
      const listingSize = Number(getFacetValue(listing, "size_sqm") || 0)
      const matchesSize =
        !isHouseLandCategory ||
        (listingSize >= sizeRange[0] && listingSize <= sizeRange[1])
      const matchesVerified =
        !verifiedOnly ||
        (listing.seller?.verificationTier && listing.seller.verificationTier !== "NONE") ||
        listing.seller?.phoneVerified === true ||
        listing.phoneVerified === true ||
        listing.verified === true
      const matchesPhotos = !withPhotos || listing.images?.length > 0
      const matchesNegotiable = !negotiableOnly || listing.negotiable === true
      const matchesFacets = Object.entries(facetFilters).every(([key, value]) => {
        if (!value || (Array.isArray(value) && !value.length)) return true
        if (key === "size_sqmMin" || key === "size_sqmMax") return true
        if (key.endsWith("Min")) {
          const facetId = key.slice(0, -3)
          return Number(getFacetValue(listing, facetId) || 0) >= Number(value)
        }
        if (key.endsWith("Max")) {
          const facetId = key.slice(0, -3)
          return Number(getFacetValue(listing, facetId) || 0) <= Number(value)
        }
        const listingValue = getFacetValue(listing, key)
        if (Array.isArray(value)) {
          return value.some((item) => String(listingValue).toLowerCase() === String(item).toLowerCase())
        }
        return String(listingValue).toLowerCase() === String(value).toLowerCase()
      })
      return matchesStatus && matchesCategory && matchesPrice && matchesCondition && matchesQuickCondition && matchesDistrict && matchesYear && matchesBedrooms && matchesBathrooms && matchesFloor && matchesSize && matchesVerified && matchesPhotos && matchesNegotiable && matchesFacets
    })
    return [...scoped].sort((a, b) => {
      if (sort === "priceLow") return Number(a.price || 0) - Number(b.price || 0)
      if (sort === "priceHigh") return Number(b.price || 0) - Number(a.price || 0)
      if (sort === "views") return Number(b.views || 0) - Number(a.views || 0)
      return new Date(b.updatedAt || b.postedAt || 0) - new Date(a.updatedAt || a.postedAt || 0)
    })
  }, [activeSubcategory, bathrooms, bedrooms, category, conditions, districts, facetFilters, floorNumber, isHouseLandCategory, listings, negotiableOnly, priceValue, quickCondition, sizeRange, sort, verifiedOnly, withPhotos, yearRange])

  const clearFacetFilter = useCallback((key) => {
    setFacetFilters((current) => {
      const nextFilters = { ...current }
      delete nextFilters[key]
      return nextFilters
    })
  }, [])

  const setFacetValue = useCallback((key, value) => {
    setFacetFilters((current) => ({ ...current, [key]: value }))
  }, [])

  const activeFilters = useMemo(() => {
    const filters = []
    if (selectedProvince !== "all") {
      filters.push({ id: "province", label: selectedProvince, onClear: () => setSelectedProvince("all") })
    }
    if (conditions.length) {
      filters.push({ id: "conditions", label: `${t("filter.condition")}: ${conditions.length}`, onClear: () => setConditions([]) })
    }
    if (quickCondition) {
      const conditionOption = quickConditionOptions.find((option) => option.value === quickCondition)
      filters.push({ id: "quickCondition", label: `${t("filter.condition")}: ${conditionOption?.label || quickCondition}`, onClear: () => setQuickCondition("") })
    }
    if (yearRange) {
      const yearOption = yearOptions.find((option) => option.value === yearRange)
      filters.push({ id: "yearRange", label: `${t("filter.year")}: ${yearOption?.label || yearRange}`, onClear: () => setYearRange("") })
    }
    if (bedrooms) {
      filters.push({ id: "bedrooms", label: `${t("filter.bedrooms")}: ${bedrooms}`, onClear: () => setBedrooms("") })
    }
    if (bathrooms) {
      filters.push({ id: "bathrooms", label: `${t("filter.bathrooms")}: ${bathrooms}`, onClear: () => setBathrooms("") })
    }
    if (isHouseLandCategory && (sizeRange[0] > 0 || sizeRange[1] < 2000)) {
      filters.push({ id: "sizeRange", label: `${t("filter.sizeRange")}: ${sizeRange[0]} - ${sizeRange[1]}`, onClear: () => setSizeRange([0, 2000]) })
    }
    if (floorNumber) {
      filters.push({ id: "floorNumber", label: `${t("filter.floorNumber")}: ${floorNumber}`, onClear: () => setFloorNumber("") })
    }
    if (districts.length) {
      filters.push({ id: "districts", label: `${t("filter.district")}: ${districts.length}`, onClear: () => setDistricts([]) })
    }
    if (priceValue[0] > 0 || price[1] !== null) {
      filters.push({ id: "price", label: `${formatPrice(priceValue[0])} - ${formatPrice(priceValue[1])}`, onClear: () => setPrice([0, null]) })
    }
    if (verifiedOnly) filters.push({ id: "verifiedOnly", label: t("filter.verifiedOnly"), onClear: () => setVerifiedOnly(false) })
    if (withPhotos) filters.push({ id: "withPhotos", label: t("filter.withPhotos"), onClear: () => setWithPhotos(false) })
    if (negotiableOnly) filters.push({ id: "negotiableOnly", label: t("filter.negotiable"), onClear: () => setNegotiableOnly(false) })
    Object.entries(facetFilters).forEach(([key, value]) => {
      if (!value) return
      const facetId = key.replace(/(Min|Max)$/, "")
      const facet = visibleFacets.find((item) => item.id === facetId)
      const option = Array.isArray(value) ? null : facet?.options?.find((item) => getOptionValue(item) === value)
      const facetLabel = facet?.label?.[language] || key
      const valueLabel = Array.isArray(value) ? value.join(", ") : option ? getOptionLabel(option, language) : value
      filters.push({
        id: `facet-${key}`,
        label: `${facetLabel}: ${valueLabel}`,
        onClear: () => clearFacetFilter(key),
      })
    })
    return filters
  }, [bathrooms, bedrooms, clearFacetFilter, conditions.length, districts.length, facetFilters, floorNumber, isHouseLandCategory, language, negotiableOnly, price, priceValue, quickCondition, quickConditionOptions, selectedProvince, setSelectedProvince, sizeRange, t, verifiedOnly, visibleFacets, withPhotos, yearOptions, yearRange])

  const mapMarkers = useMemo(
    () =>
      displayedListings
        .filter((listing) => listing.lat && listing.lng)
        .map((listing) => ({
          id: listing.id,
          lat: listing.lat,
          lng: listing.lng,
          popup: (
            <div className="w-44">
              <img alt={listing.title} className="mb-2 h-20 w-full rounded-lg object-cover" src={getListingImage(listing)} />
              <Link className="block text-sm font-black text-neutral-900 hover:text-primary" to={listingUrl(listing)}>
                {listing.title}
              </Link>
              <p className="mt-1 text-sm font-black text-primary">{formatPrice(listing.price, listing.currency)}</p>
            </div>
          ),
        })),
    [displayedListings],
  )

  const closeFilters = useCallback(() => setFilterOpen(false), [])

  function resetFilters() {
    setPrice([0, null])
    setConditions([])
    setDistricts([])
    setFacetFilters({})
    setVerifiedOnly(false)
    setWithPhotos(false)
    setNegotiableOnly(false)
    setYearRange("")
    setQuickCondition("")
    setBedrooms("")
    setBathrooms("")
    setSizeRange([0, 2000])
    setFloorNumber("")
    setSelectedProvince("all")
  }

  const filterPanel = (
    <div className="grid gap-4">
      <label className="grid gap-2 text-sm font-bold text-neutral-700">
        {t("post.province")}
        <select className="h-11 rounded-xl border border-neutral-200 bg-white px-3 outline-none focus:border-primary" onChange={(event) => setSelectedProvince(event.target.value)} value={selectedProvince}>
          <option value="all">{t("nav.allCambodia")}</option>
          {PROVINCES.map((province) => (
            <option key={province.id} value={province.label.en}>{province.label[language]}</option>
          ))}
        </select>
      </label>
      {selectedProvince !== "all" ? (
        <MultiSelectFilter label={t("filter.district")} onChange={setDistricts} options={districtOptions} searchable selected={districts} />
      ) : null}
      <div className="grid gap-2">
        <ToggleFilter checked={verifiedOnly} label={t("filter.verifiedOnly")} onChange={setVerifiedOnly} />
        <ToggleFilter checked={withPhotos} label={t("filter.withPhotos")} onChange={setWithPhotos} />
        <ToggleFilter checked={negotiableOnly} label={t("filter.negotiable")} onChange={setNegotiableOnly} />
      </div>
      <PriceRangeSlider max={priceMax} min={0} onChange={setPrice} value={priceValue} />
      <MultiSelectFilter
        label={t("filter.condition")}
        onChange={setConditions}
        options={conditionOptions.map((option) => ({ value: option.value, label: t(option.key) }))}
        selected={conditions}
      />
      {isVehicleCategory ? (
        <div className="grid gap-3">
          <h3 className="text-sm font-bold text-neutral-700">{t("filter.make")}</h3>
          <BrandLogoFilter brands={CAR_BRANDS} onChange={(nextSelected) => setFacetValue("make", nextSelected)} selected={getBrandIds(facetFilters.make)} />
        </div>
      ) : null}
      {isHouseLandCategory ? (
        <div className="grid gap-4">
          <div className="grid gap-3">
            <h3 className="text-sm font-bold text-neutral-700">{t("filter.propertyType")}</h3>
            <PropertyTypeFilter onChange={(value) => setFacetValue("type", value)} options={propertyTypeOptions} selected={facetFilters.type || ""} />
          </div>
          <div className="grid gap-3">
            <h3 className="text-sm font-bold text-neutral-700">{t("filter.sizeRange")}</h3>
            <div className="grid grid-cols-2 gap-2">
              <input
                aria-label={t("filter.minSize")}
                className="h-10 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary"
                max="2000"
                min="0"
                onChange={(event) => setSizeRange([Number(event.target.value), sizeRange[1]])}
                type="number"
                value={sizeRange[0]}
              />
              <input
                aria-label={t("filter.maxSize")}
                className="h-10 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary"
                max="2000"
                min="0"
                onChange={(event) => setSizeRange([sizeRange[0], Number(event.target.value)])}
                type="number"
                value={sizeRange[1]}
              />
            </div>
            <input
              aria-label={t("filter.sizeRange")}
              className="accent-primary"
              max="2000"
              min="0"
              onChange={(event) => setSizeRange([sizeRange[0], Number(event.target.value)])}
              type="range"
              value={sizeRange[1]}
            />
          </div>
          <label className="grid gap-2 text-sm font-bold text-neutral-700">
            {t("filter.floorNumber")}
            <input
              className="h-10 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary"
              min="0"
              onChange={(event) => setFloorNumber(event.target.value)}
              type="number"
              value={floorNumber}
            />
          </label>
        </div>
      ) : null}
      <FacetedFilter category={activeSubcategory?.slug || category?.slug} currentFilters={facetFilters} hiddenFacetIds={hiddenFacetIds} onChange={setFacetFilters} />
      <Button onClick={() => setFilterOpen(false)}>{t("filter.applyFilters")}</Button>
      <Button onClick={resetFilters} variant="secondary">{t("filter.resetAll")}</Button>
    </div>
  )

  return (
    <PageTransition>
      <Helmet>
        <title>{t("seo.categoryTitle", { category: title, province: provinceLabel })}</title>
        <meta name="description" content={t("seo.categoryDescription", { count: displayedListings.length, category: title, province: provinceLabel })} />
        <link rel="canonical" href={canonicalUrl(`/category/${slug}`)} />
      </Helmet>
      <div className="noise-overlay relative border-b border-neutral-100 bg-white px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <Breadcrumb crumbs={[{ label: t("breadcrumb.home"), href: "/" }, { label: title }]} />
          <h1 className="mt-3 text-3xl font-black text-neutral-900">{title}</h1>
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm lg:block">{filterPanel}</aside>
        <main className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
            <p className="text-sm font-black text-neutral-700">
              {displayedListings.length.toLocaleString()} {t("listing.resultsFound")}
            </p>
            <div className="flex max-w-full flex-wrap items-center gap-2">
              {isVehicleCategory ? (
                <QuickFilterDropdown
                  activeLabel={yearOptions.find((option) => option.value === yearRange)?.label}
                  label={t("filter.year")}
                  onChange={setYearRange}
                  options={yearOptions}
                  value={yearRange}
                />
              ) : null}
              <QuickFilterDropdown
                activeLabel={quickConditionOptions.find((option) => option.value === quickCondition)?.label}
                label={t("filter.condition")}
                onChange={setQuickCondition}
                options={quickConditionOptions}
                value={quickCondition}
              />
              {isHouseLandCategory ? (
                <>
                  <QuickFilterDropdown
                    activeLabel={bedrooms ? bedrooms : ""}
                    label={t("filter.bedrooms")}
                    onChange={setBedrooms}
                    options={roomOptions}
                    value={bedrooms}
                  />
                  <QuickFilterDropdown
                    activeLabel={bathrooms ? bathrooms : ""}
                    label={t("filter.bathrooms")}
                    onChange={setBathrooms}
                    options={bathroomOptions}
                    value={bathrooms}
                  />
                </>
              ) : null}
              <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 px-3 text-sm font-black lg:hidden" onClick={() => setSortOpen(true)} type="button">
                {t("filter.sortButton")}
              </button>
              <button ref={filterTriggerRef} className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 px-3 text-sm font-black lg:hidden" onClick={() => setFilterOpen(true)} type="button">
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                {t("filter.filters")}
                {activeFilters.length ? <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">{activeFilters.length}</span> : null}
              </button>
              <div className="hidden lg:block">
                <QuickFilterDropdown
                  activeLabel={t(sortOptions.find(([value]) => value === sort)?.[1] || "sort.newestFirst")}
                  label={t("filter.sortButton")}
                  onChange={setSort}
                  options={sortOptions.map(([value, label]) => ({ value, label: t(label) }))}
                  value={sort}
                />
              </div>
              <ViewToggle includeMap onChange={setView} view={view} />
            </div>
          </div>
          {isVehicleCategory ? (
            <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
              <h2 className="mb-3 text-sm font-black text-neutral-700">{t("filter.bodyType")}</h2>
              <BodyTypeFilter onChange={(value) => setFacetValue("bodyType", value)} selected={facetFilters.bodyType || ""} types={CAR_BODY_TYPES} />
            </div>
          ) : null}
          {activeFilters.length ? (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {activeFilters.map((filter) => (
                <button className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-black text-primary" key={filter.id} onClick={filter.onClear} type="button">
                  {filter.label}
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              ))}
              <button className="px-2 py-1.5 text-xs font-black text-neutral-500 transition hover:text-neutral-900" onClick={resetFilters} type="button">
                {t("filter.clearAll")}
              </button>
            </div>
          ) : null}
          {displayedListings.length ? (
            view === "map" ? (
              <Suspense fallback={<div className="h-[60vh] w-full animate-pulse rounded-2xl bg-neutral-100" />}>
                <MapView
                  className="h-[60vh] w-full rounded-2xl"
                  interactive
                  lat={mapMarkers[0]?.lat || 11.5564}
                  lng={mapMarkers[0]?.lng || 104.9282}
                  markers={mapMarkers}
                  zoom={mapMarkers.length ? 12 : 7}
                />
              </Suspense>
            ) : (
              <InfiniteScroll
                dataLength={displayedListings.length}
                hasMore={hasMore}
                loader={<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <SkeletonCard key={index} />)}</div>}
                next={fetchMoreListings}
                scrollThreshold={0.85}
              >
                {view === "grid" ? (
                  <ListingGrid listings={displayedListings} showSellCTA={true} />
                ) : (
                  <div className="grid gap-3">
                    {displayedListings.map((listing) => <ListingListItem key={listing.id} listing={listing} />)}
                  </div>
                )}
              </InfiniteScroll>
            )
          ) : (
            <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
              <div>
                <EmptyIllustration />
                <h3 className="mt-4 text-xl font-black text-neutral-900">{t("filter.noAdsFound")}</h3>
                <p className="mt-2 text-sm font-bold text-neutral-500">{t("filter.tryRemoving")}</p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button onClick={resetFilters} variant="secondary">{t("filter.resetAll")}</Button>
                  <Button onClick={() => togglePostModal(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                    {t("nav.postFreeAd")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <BottomSheet onClose={closeFilters} open={filterOpen} returnFocusRef={filterTriggerRef} title={t("filters.title")}>{filterPanel}</BottomSheet>
      <BottomSheet onClose={() => setSortOpen(false)} open={sortOpen} title={t("filter.sortButton")}>
        <div className="grid gap-2">
          {sortOptions.map(([value, label]) => (
            <label className="flex items-center justify-between rounded-xl bg-neutral-50 p-3 text-sm font-black text-neutral-700" key={value}>
              {t(label)}
              <input checked={sort === value} onChange={() => setSort(value)} type="radio" />
            </label>
          ))}
          <Button onClick={() => setSortOpen(false)}>{t("ui.confirm")}</Button>
        </div>
      </BottomSheet>
    </PageTransition>
  )
}

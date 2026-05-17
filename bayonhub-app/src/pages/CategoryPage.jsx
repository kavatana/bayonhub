import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { BriefcaseBusiness, Building2, Car, ChevronDown, Home, Map as MapIcon, PlusCircle, ShieldCheck, SlidersHorizontal, Smartphone, Store, X } from "lucide-react"
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
import { getFormSchema } from "../lib/categoryForms"
import { getDistrictsForProvince, PROVINCES } from "../lib/locations"
import { canonicalUrl } from "../lib/seo"
import { cn, formatPrice, getListingImage, listingUrl } from "../lib/utils"
import { translate } from "../lib/translations"
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
  ["views", "sort.mostViewed"],
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

const categoryHeroIcons = {
  vehicles: Car,
  "house-land": Home,
  "phones-tablets": Smartphone,
  jobs: BriefcaseBusiness,
}

const schemaIdByRoute = {
  vehicles: "cars",
  "phones-tablets": "phones",
  jobs: "jobs",
}

const subcategoryPresets = {
  cars: [
    ["discover.subcategorySuvs", "bodyType", "suv"],
    ["discover.subcategorySedans", "bodyType", "sedan"],
    ["discover.subcategoryPickup", "bodyType", "pickup"],
    ["discover.subcategoryVans", "bodyType", "van"],
    ["discover.subcategoryTrucks", "bodyType", "truck"],
  ],
  property_rent: [
    ["discover.subcategoryApartment", "type", "apartment"],
    ["discover.subcategoryVilla", "type", "villa"],
    ["discover.subcategoryLand", "type", "land"],
    ["discover.subcategoryOffice", "type", "office"],
    ["discover.subcategoryShop", "type", "shop"],
  ],
  property_sale: [
    ["discover.subcategoryApartment", "type", "apartment"],
    ["discover.subcategoryVilla", "type", "villa"],
    ["discover.subcategoryLand", "type", "land"],
    ["discover.subcategoryOffice", "type", "office"],
    ["discover.subcategoryShop", "type", "shop"],
  ],
  phones: [
    ["discover.subcategorySamsung", "brand", "Samsung"],
    ["discover.subcategoryIphone", "brand", "Apple"],
    ["discover.subcategoryHuawei", "brand", "Huawei"],
    ["discover.subcategoryOppo", "brand", "Oppo"],
    ["discover.subcategoryOther", "brand", "Other"],
  ],
  jobs: [
    ["discover.subcategoryFullTime", "jobType", "Full-time"],
    ["discover.subcategoryPartTime", "jobType", "Part-time"],
    ["discover.subcategoryFreelance", "jobType", "Freelance"],
    ["discover.subcategoryInternship", "jobType", "Internship"],
  ],
}

function getSchemaId(categorySlug, subcategorySlug) {
  if (categorySlug === "house-land") {
    return subcategorySlug === "sale" ? "property_sale" : "property_rent"
  }
  return schemaIdByRoute[categorySlug] || null
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
          "inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 px-3 text-sm font-black transition",
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
        className="flex max-h-[86vh] flex-col"
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
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
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
  const listings = useListingStore((state) => state.searchResults)
  const searchTotal = useListingStore((state) => state.searchTotal)
  const searchPage = useListingStore((state) => state.searchPage)
  const searchTotalPages = useListingStore((state) => state.searchTotalPages)
  const searchListings = useListingStore((state) => state.searchListings)
  const setSearchPage = useListingStore((state) => state.setSearchPage)
  const togglePostModal = useUIStore((state) => state.togglePostModal)
  const loading = useListingStore((state) => state.searchLoading)
  const error = useListingStore((state) => state.error)
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
  const schemaId = useMemo(() => getSchemaId(activeCategory, activeSubcategory?.slug), [activeCategory, activeSubcategory?.slug])
  const categorySchema = useMemo(() => getFormSchema(schemaId), [schemaId])
  const categoryLabelKey = schemaId ? `category.${schemaId}` : activeSubcategory ? `category.${activeSubcategory.id}` : category ? `category.${category.id}` : "page.notFound"
  const CategoryIcon = categoryHeroIcons[activeCategory] || Building2
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
  const fuelOptions = useMemo(
    () => (categorySchema?.fields.fuel?.options || []).map((option) => ({ value: getOptionValue(option), label: getOptionLabel(option, language) })),
    [categorySchema, language],
  )
  const transmissionOptions = useMemo(
    () => (categorySchema?.fields.transmission?.options || []).map((option) => ({ value: getOptionValue(option), label: getOptionLabel(option, language) })),
    [categorySchema, language],
  )
  const furnishingOptions = useMemo(
    () => (categorySchema?.fields.furnishing?.options || []).map((option) => ({ value: getOptionValue(option), label: getOptionLabel(option, language) })),
    [categorySchema, language],
  )
  const hasCarFilters = Boolean(categorySchema?.fields.fuel && categorySchema?.fields.transmission)
  const hasPropertyFilters = Boolean(categorySchema?.fields.bedrooms || categorySchema?.fields.furnishing)
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

    const filtersChanged = next.toString() !== searchParams.toString()
    if (filtersChanged) next.delete("page")

    // Avoid redundant updates
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [view, sort, price, conditions, districts, facetFilters, verifiedOnly, withPhotos, negotiableOnly, yearRange, quickCondition, bedrooms, bathrooms, sizeRange, floorNumber, setSearchParams, searchParams])

  const searchRequestParams = useMemo(() => ({
    category: activeSubcategory?.slug || activeCategory,
    location: selectedProvince === "all" ? "" : selectedProvince,
    priceMin: price[0] > 0 ? price[0] : "",
    priceMax: price[1] ?? "",
    condition: quickCondition || conditions[0] || "",
    sortBy: sort,
    page: Number(searchParams.get("page") || 1),
    limit: 20,
  }), [activeCategory, activeSubcategory?.slug, conditions, price, quickCondition, searchParams, selectedProvince, sort])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      searchListings(searchRequestParams)
    }, 500)
    return () => window.clearTimeout(timer)
  }, [searchListings, searchRequestParams])

  const displayedListings = listings

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

  const subcategoryChips = useMemo(() => {
    const presets = subcategoryPresets[schemaId] || []
    return presets.map(([labelKey, filterKey, value]) => {
      const nextFacets = { ...facetFilters, [filterKey]: value }
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set("facets", JSON.stringify(nextFacets))
      const count = listings.filter((listing) => {
        const matchesStatus = !listing.status || String(listing.status).toUpperCase() === "ACTIVE"
        const matchesCategory = !category || listing.category === category.label.en || listing.subcategory === activeSubcategory?.label.en
        const listingValue = getFacetValue(listing, filterKey)
        const matchesValue = String(listingValue || "").toLowerCase() === String(value).toLowerCase()
        return matchesStatus && matchesCategory && matchesValue
      }).length
      return {
        count,
        filterKey,
        label: t(labelKey),
        search: `?${nextParams.toString()}`,
        value,
      }
    })
  }, [activeSubcategory, category, facetFilters, listings, schemaId, searchParams, t])

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
              <img alt={listing.title} className="mb-2 h-20 w-full rounded-lg object-cover" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.onerror = null }} src={getListingImage(listing)} />
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
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
                    className="h-11 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary"
                    max="2000"
                    min="0"
                    onChange={(event) => setSizeRange([Number(event.target.value), sizeRange[1]])}
                    type="number"
                    value={sizeRange[0]}
                  />
                  <input
                    aria-label={t("filter.maxSize")}
                    className="h-11 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary"
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
                  className="h-11 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary"
                  min="0"
                  onChange={(event) => setFloorNumber(event.target.value)}
                  type="number"
                  value={floorNumber}
                />
              </label>
            </div>
          ) : null}
          <FacetedFilter category={activeSubcategory?.slug || category?.slug} currentFilters={facetFilters} hiddenFacetIds={hiddenFacetIds} onChange={setFacetFilters} />
        </div>
      </div>
      <div className="flex flex-shrink-0 gap-3 border-t border-neutral-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button className="flex-1" onClick={resetFilters} variant="secondary">{t("filter.resetAll")}</Button>
        <Button className="flex-1" onClick={() => setFilterOpen(false)}>
          {t("filter.apply")} {activeFilters.length > 0 ? `(${activeFilters.length})` : ""}
        </Button>
      </div>
    </div>
  )

  const activeFilterChips = activeFilters.length ? (
    <div className="sticky top-16 z-30 mb-4 flex flex-wrap items-center gap-2 border-b border-neutral-100 bg-neutral-50/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2">
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
    </div>
  ) : null
  const categoryPath = activeSubcategory ? `/category/${slug}/${subcategory}` : `/category/${slug}`

  return (
    <PageTransition>
      <Helmet>
        <title>{t("seo.categoryTitle", { category: title, province: provinceLabel })}</title>
        <meta name="description" content={t("seo.categoryDescription", { count: displayedListings.length, category: title, province: provinceLabel })} />
        <link rel="canonical" href={canonicalUrl(`/category/${slug}`)} />
      </Helmet>
      <section className="relative border-b border-neutral-100 bg-white px-4 py-6 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-5">
          <Breadcrumb crumbs={[{ label: t("breadcrumb.home"), href: "/" }, { label: title }]} />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <CategoryIcon className="h-8 w-8" aria-hidden="true" />
              </span>
              <div>
                <h1 className={cn("text-3xl font-black leading-10 text-neutral-900 sm:text-4xl", language === "km" && "font-khmer leading-[2]")}>
                  {translate("km", categoryLabelKey)}
                </h1>
                <p className="text-sm font-bold text-neutral-500">{translate("en", categoryLabelKey)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-black text-neutral-700">
                {searchTotal.toLocaleString()} {t("listing.resultsFound")}
              </span>
              <Link className="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-black text-neutral-700 transition hover:border-primary hover:text-primary" to="/help">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                {t("discover.safetyTips")}
              </Link>
            </div>
          </div>
          <div className="lg:hidden">
            <button ref={filterTriggerRef} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 text-sm font-black" onClick={() => setFilterOpen(true)} type="button">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              {t("filter.allFilters")}
              {activeFilters.length ? <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">{activeFilters.length}</span> : null}
            </button>
          </div>
          <div className="hidden rounded-2xl border border-neutral-200 bg-neutral-50 p-3 shadow-sm lg:grid lg:grid-cols-6 lg:items-end lg:gap-3">
            <label className="grid gap-1 text-xs font-black text-neutral-500">
              {t("filter.location")}
              <select className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-bold text-neutral-800 outline-none focus:border-primary" onChange={(event) => setSelectedProvince(event.target.value)} value={selectedProvince}>
                <option value="all">{t("nav.allCambodia")}</option>
                {PROVINCES.map((province) => (
                  <option key={province.id} value={province.label.en}>{province.label[language]}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-1 text-xs font-black text-neutral-500">
              {t("filter.priceRange")}
              <div className="grid grid-cols-2 gap-2">
                <input aria-label={t("filter.minPrice")} className="h-11 min-w-0 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-bold outline-none focus:border-primary" min="0" onChange={(event) => setPrice([Number(event.target.value || 0), price[1]])} type="number" value={price[0]} />
                <input aria-label={t("filter.maxPrice")} className="h-11 min-w-0 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-bold outline-none focus:border-primary" min="0" onChange={(event) => setPrice([price[0], event.target.value ? Number(event.target.value) : null])} type="number" value={price[1] ?? ""} />
              </div>
            </div>
            <div className="grid gap-1 text-xs font-black text-neutral-500">
              {t("filter.condition")}
              <div className="grid h-11 grid-cols-2 overflow-hidden rounded-xl border border-neutral-200 bg-white" role="radiogroup" aria-label={t("filter.condition")}>
                {["New", "Used"].map((condition) => (
                  <button
                    aria-checked={quickCondition === condition}
                    className={cn("text-sm font-black transition", quickCondition === condition ? "bg-primary text-white" : "text-neutral-600 hover:bg-neutral-100")}
                    key={condition}
                    onClick={() => setQuickCondition(quickCondition === condition ? "" : condition)}
                    role="radio"
                    type="button"
                  >
                    {t(condition === "New" ? "condition.new" : "condition.used")}
                  </button>
                ))}
              </div>
            </div>
            {hasCarFilters ? (
              <>
                <label className="grid gap-1 text-xs font-black text-neutral-500">
                  {t("facet.fuel")}
                  <select className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-bold outline-none focus:border-primary" onChange={(event) => setFacetValue("fuel", event.target.value)} value={facetFilters.fuel || ""}>
                    <option value="">{t("filter.any")}</option>
                    {fuelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-black text-neutral-500">
                  {t("facet.transmission")}
                  <select className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-bold outline-none focus:border-primary" onChange={(event) => setFacetValue("transmission", event.target.value)} value={facetFilters.transmission || ""}>
                    <option value="">{t("filter.any")}</option>
                    {transmissionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </>
            ) : null}
            {hasPropertyFilters ? (
              <>
                <label className="grid gap-1 text-xs font-black text-neutral-500">
                  {t("filter.bedrooms")}
                  <select className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-bold outline-none focus:border-primary" onChange={(event) => setBedrooms(event.target.value)} value={bedrooms}>
                    {roomOptions.map((option) => <option key={option.value || "any"} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-black text-neutral-500">
                  {t("facet.furnishing")}
                  <select className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-bold outline-none focus:border-primary" onChange={(event) => setFacetValue("furnishing", event.target.value)} value={facetFilters.furnishing || ""}>
                    <option value="">{t("filter.any")}</option>
                    {furnishingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </>
            ) : null}
            <div className="flex gap-2">
              <Button className="h-11" onClick={() => setFilterOpen(false)}>{t("filter.apply")}</Button>
              <Button className="h-11" onClick={resetFilters} variant="secondary">{t("filter.clear")}</Button>
            </div>
          </div>
        </div>
      </section>
      {activeFilterChips}
      {subcategoryChips.length ? (
        <section className="border-b border-neutral-100 bg-white px-4 py-4 sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-3">
            <h2 className="text-sm font-black text-neutral-700">{t("discover.subcategories")}</h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {subcategoryChips.map((chip) => (
                <Link
                  className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-black text-neutral-700 transition hover:border-primary hover:text-primary"
                  key={`${chip.filterKey}-${chip.value}`}
                  onClick={() => setFacetValue(chip.filterKey, chip.value)}
                  to={`${categoryPath}${chip.search}`}
                >
                  {chip.label}
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">{chip.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <main className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
            <p className="text-sm font-black text-neutral-700">
              {searchTotal.toLocaleString()} {t("listing.resultsFound")}
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
              <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-neutral-200 px-3 text-sm font-black lg:hidden" onClick={() => setSortOpen(true)} type="button">
                {t("filter.sortButton")}
              </button>
              <button ref={filterTriggerRef} className="inline-flex h-11 items-center gap-2 rounded-xl border border-neutral-200 px-3 text-sm font-black lg:hidden" onClick={() => setFilterOpen(true)} type="button">
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
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="grid min-h-64 place-items-center rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
              <div>
                <h3 className="text-lg font-black text-red-700">{t("ui.error")}</h3>
                <p className="mt-1 text-sm font-semibold text-red-600">{error}</p>
                <Button className="mt-5" onClick={() => searchListings(searchRequestParams)} variant="secondary">
                  {t("ui.retry")}
                </Button>
              </div>
            </div>
          ) : displayedListings.length ? (
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
              <>
                {view === "grid" ? (
                  <ListingGrid listings={displayedListings} showSellCTA={true} />
                ) : (
                  <div className="grid gap-3">
                    {displayedListings.map((listing) => <ListingListItem key={listing.id} listing={listing} />)}
                  </div>
                )}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-3">
                  <Button
                    disabled={searchPage <= 1}
                    onClick={() => {
                      const next = new URLSearchParams(searchParams)
                      next.set("page", String(searchPage - 1))
                      setSearchParams(next)
                      setSearchPage(searchPage - 1)
                    }}
                    size="sm"
                    variant="secondary"
                  >
                    {t("pagination.previous")}
                  </Button>
                  <p className="text-sm font-black text-neutral-700">
                    {t("pagination.pageOf")} {searchPage} {t("pagination.of")} {searchTotalPages}
                  </p>
                  <Button
                    disabled={searchPage >= searchTotalPages}
                    onClick={() => {
                      const next = new URLSearchParams(searchParams)
                      next.set("page", String(searchPage + 1))
                      setSearchParams(next)
                      setSearchPage(searchPage + 1)
                    }}
                    size="sm"
                    variant="secondary"
                  >
                    {t("pagination.next")}
                  </Button>
                </div>
              </>
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
        <div className="grid gap-2 p-4">
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

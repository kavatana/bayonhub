import { useCallback } from "react"
import { CATEGORIES } from "../../lib/categories"
import { PROVINCES } from "../../lib/locations"
import { useTranslation } from "../../hooks/useTranslation"
import { useListingStore } from "../../store/useListingStore"
import Button from "../ui/Button"
import FacetedFilter from "./FacetedFilter"

export default function FilterSidebar({ activeCategory = "" }) {
  const { language, t } = useTranslation()
  const filters = useListingStore((state) => state.filters)
  const setFilter = useListingStore((state) => state.setFilter)
  const resetFilters = useListingStore((state) => state.resetFilters)

  const updateFacets = useCallback(
    (nextFilters) => {
      Object.entries(nextFilters).forEach(([key, value]) => setFilter(key, value))
    },
    [setFilter],
  )

  return (
    <aside className="noise-overlay relative rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-bold text-neutral-900">{t("filter.title")}</h2>
      <div className="mt-4 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-neutral-700">
          {t("filter.search")}
          <input
            className="h-11 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary"
            onChange={(event) => setFilter("q", event.target.value)}
            placeholder={t("filter.searchPlaceholder")}
            value={filters.q}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-neutral-700">
          {t("filter.category")}
          <select
            className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-primary"
            onChange={(event) => setFilter("category", event.target.value)}
            value={filters.category}
          >
            <option value="" />
            {CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label[language]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-neutral-700">
          {t("filter.location")}
          <select
            className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-primary"
            onChange={(event) => setFilter("location", event.target.value)}
            value={filters.location}
          >
            <option value="" />
            {PROVINCES.map((province) => (
              <option key={province.id} value={province.label.en}>
                {province.label[language]}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-2 text-sm font-semibold text-neutral-700">
            {t("filter.minPrice")}
            <input
              className="h-11 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary"
              min="0"
              onChange={(event) => setFilter("minPrice", event.target.value)}
              type="number"
              value={filters.minPrice}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-neutral-700">
            {t("filter.maxPrice")}
            <input
              className="h-11 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary"
              min="0"
              onChange={(event) => setFilter("maxPrice", event.target.value)}
              type="number"
              value={filters.maxPrice}
            />
          </label>
        </div>
        <FacetedFilter category={activeCategory} currentFilters={filters} onChange={updateFacets} />
        <Button onClick={resetFilters} variant="secondary">
          {t("filter.reset")}
        </Button>
      </div>
    </aside>
  )
}

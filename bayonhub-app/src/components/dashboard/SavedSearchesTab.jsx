import { memo, useMemo } from "react"
import { Bell, Bookmark, Search, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "../../hooks/useTranslation"
import { CATEGORIES } from "../../lib/categories"
import { PROVINCES } from "../../lib/locations"
import { formatPrice, timeAgo } from "../../lib/utils"
import { useListingStore } from "../../store/useListingStore"
import Button from "../ui/Button"

function getCategoryLabel(categoryValue, language) {
  const category = CATEGORIES.find(
    (item) => item.id === categoryValue || item.slug === categoryValue || item.label.en === categoryValue,
  )
  return category?.label?.[language] || categoryValue
}

function getProvinceLabel(provinceValue, language) {
  const province = PROVINCES.find((item) => item.label.en === provinceValue || item.slug === provinceValue)
  return province?.label?.[language] || provinceValue
}

function buildSearchPath(search) {
  const params = new URLSearchParams()
  if (search.query) params.set("q", search.query)
  Object.entries(search.filters || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(","))
      return
    }
    if (value) params.set(key, value)
  })
  return `/search?${params.toString()}`
}

function getFilterPills(search, language, t) {
  const filters = search.filters || {}
  const pills = []
  if (filters.category) pills.push(`${t("filter.category")}: ${getCategoryLabel(filters.category, language)}`)
  if (filters.location) pills.push(`${t("filter.location")}: ${getProvinceLabel(filters.location, language)}`)
  if (filters.minPrice || filters.maxPrice) {
    pills.push(`${t("filter.price")}: ${formatPrice(filters.minPrice || 0)} - ${formatPrice(filters.maxPrice || 0)}`)
  }
  return pills
}

function SavedSearchesTab() {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const savedSearches = useListingStore((state) => state.savedSearches)
  const deleteSavedSearch = useListingStore((state) => state.deleteSavedSearch)
  const toggleSearchAlert = useListingStore((state) => state.toggleSearchAlert)
  const sortedSearches = useMemo(
    () => [...savedSearches].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [savedSearches],
  )

  function deleteSearch(id) {
    if (window.confirm(t("search.confirmDelete"))) deleteSavedSearch(id)
  }

  if (!sortedSearches.length) {
    return (
      <div className="grid min-h-64 place-items-center gap-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          <Bookmark className="h-8 w-8" />
        </div>
        <div>
          <h3 className="text-lg font-black text-neutral-900">{t("search.noSavedSearches")}</h3>
          <p className="mt-1 text-sm font-semibold text-neutral-500">{t("search.noSavedSearchesDesc")}</p>
        </div>
        <Button onClick={() => navigate("/")} variant="secondary">
          {t("nav.home")}
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {sortedSearches.map((search) => {
        const filterPills = getFilterPills(search, language, t)
        return (
          <article className="min-w-0 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm" key={search.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-widest text-primary">{t("dashboard.savedSearches")}</p>
                <h2 className="mt-1 truncate text-xl font-black text-neutral-900">
                  {search.query || t("search.savedSearches")}
                </h2>
                <p className="mt-1 text-xs font-bold text-neutral-400">{timeAgo(search.createdAt, language)}</p>
              </div>
              <button
                className="grid h-10 w-10 place-items-center rounded-xl text-red-600 transition hover:bg-red-50"
                onClick={() => deleteSearch(search.id)}
                type="button"
                aria-label={t("ui.delete")}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            {filterPills.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {filterPills.map((pill) => (
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-600" key={pill}>
                    {pill}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-4 flex min-w-0 flex-wrap items-center gap-3">
              <label className="inline-flex min-w-0 items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-sm font-bold text-neutral-700">
                <input checked={search.alertEnabled} onChange={() => toggleSearchAlert(search.id)} type="checkbox" />
                <Bell className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="min-w-0">{search.alertEnabled ? t("dashboard.priceAlertOn") : t("dashboard.priceAlert")}</span>
              </label>
              <Button onClick={() => navigate(buildSearchPath(search))} size="sm" variant="secondary">
                <Search className="h-4 w-4" aria-hidden="true" />
                {t("search.searchNow")}
              </Button>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export default memo(SavedSearchesTab)

import { useMemo } from "react"
import { useTranslation } from "../../hooks/useTranslation"
import { CATEGORIES } from "../../lib/categories"

const makes = ["Toyota", "Honda", "Ford", "Hyundai", "Kia", "Lexus", "BMW", "Mercedes-Benz"]

function getOptionValue(option) {
  return typeof option === "string" ? option : option.value
}

function getOptionLabel(option, language) {
  return typeof option === "string" ? option : option.label?.[language] || option.value
}

function getFacets(categorySlug) {
  for (const category of CATEGORIES) {
    if (category.slug === categorySlug) {
      return category.subcategories.flatMap((subcategory) => subcategory.facets)
    }
    const subcategory = category.subcategories.find((item) => item.slug === categorySlug)
    if (subcategory) return subcategory.facets
  }
  return []
}

export default function FacetedFilter({ category, currentFilters = {}, hiddenFacetIds = [], onChange }) {
  const { language, t } = useTranslation()
  const facets = useMemo(
    () => getFacets(category).filter((facet) => !hiddenFacetIds.includes(facet.id)),
    [category, hiddenFacetIds],
  )

  if (!facets.length) return null

  function updateFacet(id, value) {
    onChange?.({ ...currentFilters, [id]: value })
  }

  return (
    <div className="grid gap-4">
      {facets.map((facet) => {
        if (facet.type === "number-range") {
          return (
            <div key={facet.id}>
              <label className="text-sm font-semibold text-neutral-700">{facet.label[language]}</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  className="h-11 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary"
                  min="0"
                  onChange={(event) => updateFacet(`${facet.id}Min`, event.target.value)}
                  placeholder={t("filter.minPrice")}
                  type="number"
                  value={currentFilters[`${facet.id}Min`] || ""}
                />
                <input
                  className="h-11 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary"
                  min="0"
                  onChange={(event) => updateFacet(`${facet.id}Max`, event.target.value)}
                  placeholder={t("filter.maxPrice")}
                  type="number"
                  value={currentFilters[`${facet.id}Max`] || ""}
                />
              </div>
              <div className="mt-2 grid gap-1">
                <input
                  className="accent-primary"
                  max="500000"
                  min="0"
                  onChange={(event) => updateFacet(`${facet.id}Min`, event.target.value)}
                  type="range"
                  value={currentFilters[`${facet.id}Min`] || 0}
                />
                <input
                  className="accent-primary"
                  max="500000"
                  min="0"
                  onChange={(event) => updateFacet(`${facet.id}Max`, event.target.value)}
                  type="range"
                  value={currentFilters[`${facet.id}Max`] || 500000}
                />
              </div>
            </div>
          )
        }

        if (facet.type === "select") {
          return (
            <div key={facet.id}>
              <label className="text-sm font-semibold text-neutral-700">{facet.label[language]}</label>
              <select
                className="mt-2 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-primary"
                onChange={(event) => updateFacet(facet.id, event.target.value)}
                value={currentFilters[facet.id] || ""}
              >
                <option value="" />
                {facet.options.map((option) => (
                  <option key={getOptionValue(option)} value={getOptionValue(option)}>
                    {getOptionLabel(option, language)}
                  </option>
                ))}
              </select>
            </div>
          )
        }

        if (facet.type === "boolean") {
          return (
            <label key={facet.id} className="flex items-center justify-between gap-3 text-sm font-semibold text-neutral-700">
              {facet.label[language]}
              <input
                checked={Boolean(currentFilters[facet.id])}
                className="h-5 w-10 rounded-full accent-primary"
                onChange={(event) => updateFacet(facet.id, event.target.checked)}
                type="checkbox"
              />
            </label>
          )
        }

        return (
          <div key={facet.id}>
            <label className="text-sm font-semibold text-neutral-700">{facet.label[language]}</label>
            <input
              className="mt-2 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary"
              list={facet.id === "make" || facet.id === "model" ? "vehicle-makes" : undefined}
              onChange={(event) => updateFacet(facet.id, event.target.value)}
              value={currentFilters[facet.id] || ""}
            />
            <datalist id="vehicle-makes">
              {makes.map((make) => (
                <option key={make} value={make} />
              ))}
            </datalist>
          </div>
        )
      })}
    </div>
  )
}

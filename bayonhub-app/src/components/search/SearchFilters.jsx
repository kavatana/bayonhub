import { useMemo, useState } from "react"
import { SlidersHorizontal, X } from "lucide-react"
import Button from "../ui/Button"
import { useTranslation } from "../../hooks/useTranslation"
import { PROVINCES } from "../../lib/locations"
import { cn } from "../../lib/utils"

function normalizeOptions(options = []) {
  return options.map((option) => {
    if (typeof option === "string") {
      return { value: option, label: { en: option, km: option } }
    }
    return {
      value: option.value,
      label: option.label || { en: option.value, km: option.value },
    }
  })
}

function SelectFilter({ id, label, options, value, onChange }) {
  const { language, t } = useTranslation()

  return (
    <label className="grid gap-2 text-sm font-black text-neutral-700">
      <span>{label?.[language] || label?.en || id}</span>
      <select
        className="min-h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-bold outline-none focus:border-primary"
        onChange={(event) => onChange(id, event.target.value)}
        value={value || ""}
      >
        <option value="">{t("filter.any")}</option>
        {normalizeOptions(options).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label?.[language] || option.label?.en || option.value}
          </option>
        ))}
      </select>
    </label>
  )
}

function FilterFields({ schema, filters, priceDraft, locations = [], onFilterChange, onPriceDraftChange, onReset, onApply }) {
  const { language, t } = useTranslation()
  const fields = schema?.fields || {}
  const isCars = schema?.id === "cars"
  const isProperty = schema?.id === "property_rent" || schema?.id === "property_sale"
  const isPhones = schema?.id === "phones"
  const isJobs = schema?.id === "jobs"
  const locationOptions = useMemo(
    () =>
      locations.length
        ? locations.map((location) => ({ value: location, label: { en: location, km: location } }))
        : PROVINCES.map((province) => ({
            value: province.label.en,
            label: province.label,
          })),
    [locations],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-neutral-900">{t("filter.facets")}</h2>
          <p className="text-xs font-bold text-neutral-500">{t("search.advanced")}</p>
        </div>
        <button className="text-xs font-black text-primary hover:underline" onClick={onReset} type="button">
          {t("filter.clearAll")}
        </button>
      </div>

      <label className="grid gap-2 text-sm font-black text-neutral-700">
        <span>{t("filter.location")}</span>
        <select
          className="min-h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-bold outline-none focus:border-primary"
          onChange={(event) => onFilterChange("province", event.target.value)}
          value={filters.province || ""}
        >
          <option value="">{t("filter.allProvinces")}</option>
          {locationOptions.map((location) => (
            <option key={location.value} value={location.value}>
              {location.label[language] || location.label.en || location.value}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-2 text-sm font-black text-neutral-700">
        <span>{t("filter.priceRange")}</span>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="min-h-11 rounded-xl border border-neutral-200 px-3 text-sm font-bold outline-none focus:border-primary"
            inputMode="numeric"
            onChange={(event) => onPriceDraftChange("minPrice", event.target.value)}
            placeholder={t("filter.minPrice")}
            type="number"
            value={priceDraft.minPrice || ""}
          />
          <input
            className="min-h-11 rounded-xl border border-neutral-200 px-3 text-sm font-bold outline-none focus:border-primary"
            inputMode="numeric"
            onChange={(event) => onPriceDraftChange("maxPrice", event.target.value)}
            placeholder={t("filter.maxPrice")}
            type="number"
            value={priceDraft.maxPrice || ""}
          />
        </div>
      </div>

      <div className="grid gap-2 text-sm font-black text-neutral-700">
        <span>{t("filter.condition")}</span>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["New", "filter.conditionNew"],
            ["Used", "filter.conditionUsed"],
          ].map(([value, label]) => (
            <label
              className={cn(
                "grid min-h-11 cursor-pointer place-items-center rounded-xl border px-3 text-center text-xs font-black",
                filters.condition === value ? "border-primary bg-primary text-white" : "border-neutral-200 bg-white text-neutral-700",
              )}
              key={value}
            >
              <input
                checked={filters.condition === value}
                className="sr-only"
                onChange={() => onFilterChange("condition", value)}
                type="radio"
              />
              {t(label)}
            </label>
          ))}
        </div>
      </div>

      {isCars ? (
        <>
          <SelectFilter id="fuel" label={fields.fuel?.label} onChange={onFilterChange} options={fields.fuel?.options} value={filters.fuel} />
          <SelectFilter
            id="transmission"
            label={fields.transmission?.label}
            onChange={onFilterChange}
            options={fields.transmission?.options}
            value={filters.transmission}
          />
          <div className="grid gap-2 text-sm font-black text-neutral-700">
            <span>{fields.year?.label?.[language] || t("filter.year")}</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="min-h-11 rounded-xl border border-neutral-200 px-3 text-sm font-bold outline-none focus:border-primary"
                onChange={(event) => onFilterChange("yearMin", event.target.value)}
                placeholder={t("filter.yearMin")}
                type="number"
                value={filters.yearMin || ""}
              />
              <input
                className="min-h-11 rounded-xl border border-neutral-200 px-3 text-sm font-bold outline-none focus:border-primary"
                onChange={(event) => onFilterChange("yearMax", event.target.value)}
                placeholder={t("filter.yearMax")}
                type="number"
                value={filters.yearMax || ""}
              />
            </div>
          </div>
        </>
      ) : null}

      {isProperty ? (
        <>
          <SelectFilter id="bedrooms" label={fields.bedrooms?.label} onChange={onFilterChange} options={fields.bedrooms?.options} value={filters.bedrooms} />
          <SelectFilter
            id="furnishing"
            label={fields.furnishing?.label}
            onChange={onFilterChange}
            options={fields.furnishing?.options}
            value={filters.furnishing}
          />
        </>
      ) : null}

      {isPhones ? (
        <>
          <SelectFilter id="brand" label={fields.brand?.label} onChange={onFilterChange} options={fields.brand?.options} value={filters.brand} />
          <SelectFilter id="storage" label={fields.storage?.label} onChange={onFilterChange} options={fields.storage?.options} value={filters.storage} />
        </>
      ) : null}

      {isJobs ? (
        <>
          <SelectFilter id="jobType" label={fields.jobType?.label} onChange={onFilterChange} options={fields.jobType?.options} value={filters.jobType} />
          <SelectFilter
            id="experience"
            label={fields.experience?.label}
            onChange={onFilterChange}
            options={fields.experience?.options}
            value={filters.experience}
          />
        </>
      ) : null}

      {onApply ? (
        <Button className="w-full" onClick={onApply}>
          {t("filter.apply")}
        </Button>
      ) : null}
    </div>
  )
}

export default function SearchFilters({ schema, filters, priceDraft, locations = [], onFilterChange, onPriceDraftChange, onReset, activeCount = 0 }) {
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const badgeText = useMemo(() => (activeCount > 9 ? "9+" : String(activeCount)), [activeCount])

  return (
    <>
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-24 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <FilterFields
            filters={filters}
            locations={locations}
            onFilterChange={onFilterChange}
            onPriceDraftChange={onPriceDraftChange}
            onReset={onReset}
            priceDraft={priceDraft}
            schema={schema}
          />
        </div>
      </aside>

      <Button className="lg:hidden" onClick={() => setMobileOpen(true)} size="sm" variant="secondary">
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        {t("filter.facets")}
        {activeCount ? (
          <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-black text-white">
            {badgeText}
          </span>
        ) : null}
      </Button>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[100] flex items-end lg:hidden">
          <button
            aria-label={t("ui.close")}
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <div className="relative max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl">
            <button
              aria-label={t("ui.close")}
              className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-neutral-100 text-neutral-600"
              onClick={() => setMobileOpen(false)}
              type="button"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <FilterFields
              filters={filters}
              locations={locations}
              onApply={() => setMobileOpen(false)}
              onFilterChange={onFilterChange}
              onPriceDraftChange={onPriceDraftChange}
              onReset={onReset}
              priceDraft={priceDraft}
              schema={schema}
            />
          </div>
        </div>
      ) : null}
    </>
  )
}

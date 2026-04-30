import { memo, useMemo, useState } from "react"
import { useTranslation } from "../../hooks/useTranslation"
import { cn } from "../../lib/utils"

const brandClasses = {
  toyota: "bg-red-50 text-red-700",
  honda: "bg-red-50 text-red-700",
  hyundai: "bg-blue-50 text-blue-800",
  kia: "bg-red-50 text-red-800",
  mazda: "bg-neutral-100 text-neutral-900",
  ford: "bg-blue-50 text-blue-800",
  bmw: "bg-blue-50 text-blue-700",
  mercedes: "bg-neutral-100 text-neutral-900",
  lexus: "bg-neutral-100 text-neutral-900",
  mitsubishi: "bg-red-50 text-red-700",
  nissan: "bg-red-50 text-red-700",
  isuzu: "bg-red-50 text-red-700",
  suzuki: "bg-neutral-100 text-neutral-900",
  mg: "bg-red-50 text-red-700",
  byd: "bg-blue-50 text-blue-700",
  other: "bg-neutral-100 text-neutral-600",
}

function getInitials(label) {
  return label.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase()
}

function BrandLogoFilter({ brands = [], selected = [], onChange }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const visibleBrands = useMemo(() => (expanded ? brands : brands.slice(0, 8)), [brands, expanded])

  function toggleBrand(brandId) {
    const nextSelected = selected.includes(brandId)
      ? selected.filter((item) => item !== brandId)
      : [...selected, brandId]
    onChange?.(nextSelected)
  }

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-4">
        {visibleBrands.map((brand) => {
          const isSelected = selected.includes(brand.id)
          return (
            <button
              aria-pressed={isSelected}
              className="grid justify-items-center gap-1 text-xs font-bold text-neutral-600"
              key={brand.id}
              onClick={() => toggleBrand(brand.id)}
              type="button"
            >
              <span
                className={cn(
                  "grid h-14 w-14 place-items-center rounded-full border border-neutral-200 text-sm font-black transition",
                  brandClasses[brand.id] || brandClasses.other,
                  isSelected && "border-primary bg-primary text-white ring-2 ring-primary/25",
                )}
              >
                {getInitials(brand.label)}
              </span>
              <span className="max-w-16 truncate">{brand.label}</span>
            </button>
          )
        })}
      </div>
      {brands.length > 8 ? (
        <button className="justify-self-start text-sm font-black text-primary" onClick={() => setExpanded((value) => !value)} type="button">
          {expanded ? t("filter.showLess") : t("filter.showMore")}
        </button>
      ) : null}
    </div>
  )
}

export default memo(BrandLogoFilter)

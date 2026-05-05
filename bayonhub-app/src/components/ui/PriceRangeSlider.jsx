import { useMemo } from "react"
import { useTranslation } from "../../hooks/useTranslation"
import { cn, formatPrice } from "../../lib/utils"

export default function PriceRangeSlider({
  min = 0,
  max = 10000,
  value = [0, 10000],
  onChange,
  currency = "USD",
  loading = false,
  error = null,
}) {
  const { t } = useTranslation()
  const [low, high] = value
  const range = Math.max(max - min, 1)
  const lowPercent = ((low - min) / range) * 100
  const highPercent = ((high - min) / range) * 100
  const fillStyle = useMemo(
    () => ({
      left: `calc(${lowPercent}% + 0px)`,
      right: `calc(${100 - highPercent}% + 0px)`,
    }),
    [highPercent, lowPercent],
  )

  function updateLow(nextLow) {
    onChange?.([Math.min(Number(nextLow), high), high])
  }

  function updateHigh(nextHigh) {
    onChange?.([low, Math.max(Number(nextHigh), low)])
  }

  return (
    <div className="space-y-4" aria-invalid={Boolean(error)}>
      <div className="flex items-center justify-between gap-4 text-sm font-semibold text-neutral-700">
        <span>{t("filter.minPrice")}</span>
        <span>{t("filter.maxPrice")}</span>
      </div>
      <div className="relative h-11">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-neutral-200" />
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary" style={fillStyle} />
        <input
          aria-label={t("filter.minPrice")}
          className={cn("pointer-events-none absolute inset-x-0 top-0 h-8 w-full appearance-none bg-transparent", "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-primary")}
          disabled={loading}
          max={max}
          min={min}
          onChange={(event) => updateLow(event.target.value)}
          type="range"
          value={low}
        />
        <input
          aria-label={t("filter.maxPrice")}
          className={cn("pointer-events-none absolute inset-x-0 top-0 h-8 w-full appearance-none bg-transparent", "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-primary")}
          disabled={loading}
          max={max}
          min={min}
          onChange={(event) => updateHigh(event.target.value)}
          type="range"
          value={high}
        />
      </div>
      <div className="flex items-center justify-between gap-4 text-sm font-bold text-neutral-900">
        <span>{formatPrice(low, currency)}</span>
        <span>{formatPrice(high, currency)}</span>
      </div>
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
    </div>
  )
}

import { Heart } from "lucide-react"
import { useEffect, useRef } from "react"
import { useTranslation } from "../../hooks/useTranslation"
import { cn } from "../../lib/utils"

const sizes = {
  sm: "h-9 w-9",
  md: "h-10 w-10",
  lg: "h-12 w-12",
}

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
}

export default function HeartButton({ saved = false, onToggle, size = "md", className = "", loading = false, error = null }) {
  const { t } = useTranslation()
  const iconRef = useRef(null)
  const previousSaved = useRef(saved)

  useEffect(() => {
    if (!previousSaved.current && saved && iconRef.current) {
      iconRef.current.classList.remove("animate-heartBurst")
      window.requestAnimationFrame(() => iconRef.current?.classList.add("animate-heartBurst"))
    }
    previousSaved.current = saved
  }, [saved])

  return (
    <button
      aria-label={saved ? t("listing.saved") : t("listing.save")}
      aria-invalid={Boolean(error)}
      className={cn(
        "grid shrink-0 place-items-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60",
        saved
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-neutral-200 bg-white text-neutral-500 hover:border-primary hover:text-primary",
        sizes[size] || sizes.md,
        className,
      )}
      disabled={loading}
      onClick={onToggle}
      type="button"
    >
      <Heart
        ref={iconRef}
        aria-hidden="true"
        className={cn(iconSizes[size] || iconSizes.md, saved ? "fill-red-600" : "fill-neutral-100")}
      />
    </button>
  )
}

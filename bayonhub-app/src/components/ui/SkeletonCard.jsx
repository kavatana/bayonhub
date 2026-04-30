import { memo } from "react"
import { useTranslation } from "../../hooks/useTranslation"
import { cn } from "../../lib/utils"

function SkeletonBlock({ className = "" }) {
  return (
    <span
      className={cn(
        "block rounded-lg bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-100 bg-[length:200%_100%] animate-shimmer",
        className,
      )}
    />
  )
}

const SkeletonCard = memo(function SkeletonCard({ className = "", loading = true, error = null, empty = false }) {
  const { t } = useTranslation()

  if (error) {
    return (
      <div className={cn("rounded-2xl border border-red-100 bg-white p-4 text-sm text-red-600", className)}>
        {error}
      </div>
    )
  }

  if (empty) {
    return (
      <div className={cn("rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500", className)}>
        {t("listing.empty")}
      </div>
    )
  }

  if (!loading) return null

  return (
    <article
      aria-label={t("ui.loading")}
      aria-busy="true"
      className={cn("overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm", className)}
    >
      <SkeletonBlock className="aspect-[4/3] rounded-none" />
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="w-full space-y-2">
            <SkeletonBlock className="h-4 w-11/12" />
            <SkeletonBlock className="h-4 w-7/12" />
          </div>
          <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
        </div>
        <SkeletonBlock className="h-4 w-2/3" />
        <div className="flex items-center justify-between gap-4">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-4 w-20" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <SkeletonBlock className="h-5 w-28" />
          <SkeletonBlock className="h-8 w-20 rounded-full" />
        </div>
      </div>
    </article>
  )
})

export default SkeletonCard

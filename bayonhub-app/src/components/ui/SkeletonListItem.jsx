import { memo } from "react"
import { useTranslation } from "../../hooks/useTranslation"
import { cn } from "../../lib/utils"

function SkeletonBlock({ className = "" }) {
  return (
    <span
      className={cn(
        "block rounded-lg bg-gray-200 motion-safe:animate-pulse motion-safe:bg-gradient-to-r motion-safe:from-gray-200 motion-safe:via-gray-100 motion-safe:to-gray-200 motion-safe:bg-[length:200%_100%]",
        className,
      )}
    />
  )
}

const SkeletonListItem = memo(function SkeletonListItem({ className = "" }) {
  const { t } = useTranslation()

  return (
    <article
      aria-busy="true"
      aria-label={t("ui.loading")}
      className={cn("rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm", className)}
    >
      <div className="flex gap-3">
        <SkeletonBlock className="h-[90px] w-[120px] shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-3 py-1">
          <SkeletonBlock className="h-4 w-11/12" />
          <SkeletonBlock className="h-4 w-7/12" />
          <SkeletonBlock className="h-5 w-24" />
          <div className="flex flex-wrap gap-2">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-4 w-20" />
            <SkeletonBlock className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </article>
  )
})

export default SkeletonListItem

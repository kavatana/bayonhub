import { ShieldAlert } from "lucide-react"
import { useTranslation } from "../../hooks/useTranslation"
import { cn } from "../../lib/utils"

export default function SafetyWarning({ className = "", loading = false, error = null }) {
  const { t } = useTranslation()
  const tips = [
    t("safety.tip1"),
    t("safety.tip2"),
    t("safety.tip3"),
    t("safety.tip4"),
  ]

  if (loading) return <div className={cn("h-20 animate-pulse rounded-xl bg-yellow-100", className)} />
  if (error) return <div className={cn("rounded-xl bg-red-50 p-4 text-sm text-red-700", className)}>{error}</div>

  return (
    <aside className={cn("flex gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-950", className)}>
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold leading-6">{t("safety.warning")}</p>
        <ul className="mt-2 space-y-1">
          {tips.map((tip, index) => (
            <li className="flex items-start gap-2 text-xs" key={tip}>
              <span className="shrink-0 font-bold text-amber-700">{index + 1}.</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

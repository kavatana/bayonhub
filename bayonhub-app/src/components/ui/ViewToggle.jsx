import { LayoutGrid, List, Map } from "lucide-react"
import { useTranslation } from "../../hooks/useTranslation"
import { cn } from "../../lib/utils"

export default function ViewToggle({ view = "grid", onChange, loading = false, error = null, includeMap = false }) {
  const { t } = useTranslation()
  const options = [
    { value: "grid", label: t("ui.gridView"), icon: LayoutGrid },
    { value: "list", label: t("ui.listView"), icon: List },
    ...(includeMap ? [{ value: "map", label: t("filter.mapView"), icon: Map }] : []),
  ]

  return (
    <div
      aria-invalid={Boolean(error)}
      className={cn("inline-grid rounded-xl border border-neutral-200 bg-white p-1", includeMap ? "grid-cols-3" : "grid-cols-2")}
      role="group"
    >
      {options.map((option) => {
        const Icon = option.icon
        const active = view === option.value
        return (
          <button
            key={option.value}
            aria-label={option.label}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-60",
              active ? "bg-primary text-white" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
            )}
            disabled={loading}
            onClick={() => onChange?.(option.value)}
            title={option.label}
            type="button"
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}

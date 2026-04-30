import { BadgeCheck, Bolt, ShieldCheck, Star, Zap } from "lucide-react"
import { useTranslation } from "../../hooks/useTranslation"
import { cn } from "../../lib/utils"

const config = {
  "phone-verified": {
    icon: BadgeCheck,
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    labelKey: "trust.phoneVerified",
  },
  "id-verified": {
    icon: ShieldCheck,
    className: "bg-blue-50 text-blue-700 ring-blue-200",
    labelKey: "trust.idVerified",
  },
  "top-seller": {
    icon: Star,
    className: "bg-amber-500 text-white ring-amber-500",
    labelKey: "listing.topSeller",
  },
  urgent: {
    icon: Zap,
    className: "bg-red-600 text-white ring-red-600",
    labelKey: "listing.urgent",
  },
  promoted: {
    icon: Bolt,
    className: "bg-red-50 text-primary ring-red-200",
    labelKey: "trust.promoted",
  },
  new: {
    icon: Star,
    className: "bg-neutral-100 text-neutral-700 ring-neutral-200",
    labelKey: "trust.new",
  },
}

export default function Badge({ type = "new", label, className = "" }) {
  const { t } = useTranslation()
  const badge = config[type] || config.new
  const Icon = badge.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        badge.className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label || t(badge.labelKey)}
    </span>
  )
}

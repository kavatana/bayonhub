import { Loader2 } from "lucide-react"
import { useTranslation } from "../../hooks/useTranslation"
import { cn } from "../../lib/utils"

export default function Spinner({ className = "" }) {
  const { t } = useTranslation()
  return (
    <Loader2
      aria-label={t("ui.loading")}
      className={cn("h-4 w-4 animate-spin", className)}
      role="status"
    />
  )
}

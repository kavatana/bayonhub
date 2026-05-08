import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"
import { useTranslation } from "../../hooks/useTranslation"

export default function OfflineIndicator() {
  const { t } = useTranslation()
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine))

  useEffect(() => {
    function handleOnline() {
      setOnline(true)
    }

    function handleOffline() {
      setOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (online) return null

  return (
    <div
      aria-live="polite"
      className="sticky top-0 z-[60] flex items-center justify-center gap-2 bg-yellow-100 px-4 py-3 text-center text-sm font-semibold text-yellow-900"
      role="status"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{t("offline.banner")}</span>
    </div>
  )
}

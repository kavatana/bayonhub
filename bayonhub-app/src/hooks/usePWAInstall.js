import { useEffect, useRef, useState } from "react"
import { storage } from "../lib/storage"

const DISMISS_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

const isDismissed = () => {
  const dismissed = storage.get("bayonhub:pwaDismissed", null)
  if (!dismissed?.timestamp) return false
  return Date.now() - dismissed.timestamp < DISMISS_EXPIRY_MS
}

export function usePWAInstall() {
  const deferredPrompt = useRef(null)
  const [canInstall, setCanInstall] = useState(false)
  const [dismissed, setDismissed] = useState(isDismissed)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      deferredPrompt.current = e
      setCanInstall(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  useEffect(() => {
    const onFocus = () => setDismissed(isDismissed())
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt.current) return
    deferredPrompt.current.prompt()
    const { outcome } = await deferredPrompt.current.userChoice
    if (outcome === "accepted") {
      deferredPrompt.current = null
      setCanInstall(false)
    }
  }

  const dismiss = () => {
    storage.set("bayonhub:pwaDismissed", { timestamp: Date.now() })
    setDismissed(true)
  }

  return { canInstall: canInstall && !dismissed, promptInstall, dismiss }
}

import { useCallback, useEffect, useRef, useState } from "react"

const HEARTBEAT_URL = `${import.meta.env.VITE_API_URL || ""}/health`
const HEARTBEAT_INTERVAL = 30000
const HEARTBEAT_TIMEOUT = 5000

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isBackendReachable, setIsBackendReachable] = useState(true)
  const intervalRef = useRef(null)

  const checkBackend = useCallback(async () => {
    if (!import.meta.env.VITE_API_URL) {
      setIsBackendReachable(true)
      return
    }
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), HEARTBEAT_TIMEOUT)
      const response = await fetch(HEARTBEAT_URL, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      })
      clearTimeout(timeout)
      setIsBackendReachable(response.ok)
    } catch {
      setIsBackendReachable(false)
    }
  }, [])

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true)
      void checkBackend()
    }
    const goOffline = () => {
      setIsOnline(false)
      setIsBackendReachable(false)
    }
    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)
    const frame = window.requestAnimationFrame(() => {
      void checkBackend()
    })
    intervalRef.current = setInterval(checkBackend, HEARTBEAT_INTERVAL)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("online", goOnline)
      window.removeEventListener("offline", goOffline)
      clearInterval(intervalRef.current)
    }
  }, [checkBackend])

  return {
    isOnline,
    isBackendReachable,
    isFullyOnline: isOnline && isBackendReachable,
    isLimitedMode: isOnline && !isBackendReachable,
  }
}

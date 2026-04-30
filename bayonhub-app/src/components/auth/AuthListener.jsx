import { useEffect } from "react"
import { getProfile } from "../../api/auth"
import { API_BASE_URL } from "../../api/client"
import { connectSocket, disconnectSocket } from "../../lib/socket"
import { useAuthStore } from "../../store/useAuthStore"
import { useUIStore } from "../../store/useUIStore"

export default function AuthListener() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    if (API_BASE_URL) {
      getProfile().then((user) => {
        if (user) useAuthStore.getState().setUser(user)
      })
    }

    const handleAuthExpired = () => {
      useAuthStore.getState().clearAuthState()
      useUIStore.getState().toggleAuthModal(true)
    }

    window.addEventListener("bayonhub:auth-expired", handleAuthExpired)
    return () => window.removeEventListener("bayonhub:auth-expired", handleAuthExpired)
  }, [])

  useEffect(() => {
    if (!API_BASE_URL) return undefined
    if (isAuthenticated) {
      connectSocket()
      return () => disconnectSocket()
    }
    disconnectSocket()
    return undefined
  }, [isAuthenticated])

  return null
}

import axios from "axios"
import { storage } from "../lib/storage"

// PRODUCTION SECURITY GUARD
// In production, localStorage auth is completely disabled.
// Tokens must come from HttpOnly cookies set by the backend.
export const IS_PRODUCTION = import.meta.env.PROD
let rawApiUrl = import.meta.env.VITE_API_URL || ""

// Normalization Guard: Fixes issues where the variable name is accidentally included in the value
if (rawApiUrl.startsWith("VITE_API_URL=")) {
  rawApiUrl = rawApiUrl.replace("VITE_API_URL=", "")
}

export const API_BASE_URL = rawApiUrl

if (IS_PRODUCTION && !API_BASE_URL) {
  console.error("[BayonHub] FATAL: VITE_API_URL must be set in production. Refusing to start in insecure mode.")
}

function getCookieValue(name) {
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[2]) : ""
}

export const STORAGE_KEYS = {
  listings: "bayonhub:listings",
  saved: "bayonhub:saved",
  savedSnapshots: "bayonhub:savedSnapshots",
  leads: "bayonhub:leads",
  reports: "bayonhub:reports",
  messages: "bayonhub:messages",
  notificationPrefs: "bayonhub:notificationPrefs",
  language: "bayonhub:language",
  // SECURITY NOTE — authToken:
  //   Currently stored in localStorage for offline-first / mock-API mode.
  //   Before go-live this MUST be replaced with Secure; HttpOnly; SameSite=Strict
  //   cookies issued by the Express backend.
  //   Action: see SECURITY.md § "JWT Storage Migration"
  authToken: "bayonhub:authToken",
  authUser: "bayonhub:authUser",
  ui: "bayonhub:ui",
}

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
})

if (import.meta.env.DEV && import.meta.env.VITE_API_URL) {
  fetch(`${import.meta.env.VITE_API_URL}/health`)
    .then((response) => response.json())
    .then((data) => console.info("[API] Backend connected:", data.status))
    .catch(() => console.warn("[API] Backend unreachable — using localStorage fallback"))
}

let isRefreshing = false
let refreshQueue = []

function resolveRefreshQueue() {
  refreshQueue.forEach((pending) => pending.resolve())
  refreshQueue = []
}

function rejectRefreshQueue(error) {
  refreshQueue.forEach((pending) => pending.reject(error))
  refreshQueue = []
}

client.interceptors.request.use((config) => {
  if (IS_PRODUCTION && !API_BASE_URL) {
    return Promise.reject(new Error("[BayonHub] API disabled: VITE_API_URL is required in production."))
  }
  
  // Use dynamically imported store to avoid circular dependency if possible, 
  // or just use a getter if we can't import it here.
  // Actually, we can just import it at the top.
  const { token } = window.authStore?.getState() || {}
  if (token) config.headers["Authorization"] = `Bearer ${token}`
  
  const csrfToken = getCookieValue("XSRF-TOKEN")
  if (csrfToken) config.headers["x-xsrf-token"] = csrfToken
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {}

    if (!error.response) {
      console.warn("[API] Network error — activating localStorage fallback")
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("bayonhub:api-unavailable"))
      }
      return Promise.reject(error)
    }

    // CSRF Retry Logic: If 403 Forbidden, we likely missing a CSRF cookie.
    // Fetch it from /health and retry once.
    if (error.response?.status === 403 && !originalRequest._csrfRetry) {
      originalRequest._csrfRetry = true
      try {
        await client.get("/health")
        return client(originalRequest)
      } catch (csrfError) {
        return Promise.reject(csrfError)
      }
    }

    if (error.response?.status !== 401 || originalRequest._retry || originalRequest.skipAuthRefresh) {
      return Promise.reject(error)
    }

    const authUrl = String(originalRequest.url || "")
    const isAuthRequest = ["/api/auth/login", "/api/auth/register", "/api/auth/refresh"].some((path) =>
      authUrl.includes(path),
    )
    if (isAuthRequest) return Promise.reject(error)

    if (!API_BASE_URL) {
      localStorage.removeItem(STORAGE_KEYS.authToken)
      if (!originalRequest.skipAuthExpired) {
        localStorage.removeItem(STORAGE_KEYS.authUser)
        window.dispatchEvent(new CustomEvent("bayonhub:auth-expired"))
      }
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      })
        .then(() => client(originalRequest))
        .catch((refreshError) => Promise.reject(refreshError))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      await client.post("/api/auth/refresh", null, {
        skipAuthRefresh: true,
        skipAuthExpired: true,
      })
      resolveRefreshQueue()
      return client(originalRequest)
    } catch (refreshError) {
      rejectRefreshQueue(refreshError)
      if (!originalRequest.skipAuthExpired) {
        localStorage.removeItem(STORAGE_KEYS.authUser)
        window.dispatchEvent(new CustomEvent("bayonhub:auth-expired"))
      }
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export function hasApiBackend() {
  return Boolean(API_BASE_URL)
}

export function readStorage(key, fallback) {
  return storage.get(key, fallback)
}

export function writeStorage(key, value) {
  if (IS_PRODUCTION && key === STORAGE_KEYS.authToken) {
    console.error("[BayonHub] Refused to store auth token in localStorage in production.")
    return
  }
  storage.set(key, value)
}

export default client

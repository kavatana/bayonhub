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
  timeout: 60000, // 60 seconds (Required for Render Free Tier cold starts)
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
const ADMIN_2FA_MESSAGE = "Admin 2FA required"
const ADMIN_2FA_EVENT = "bayonhub:admin-2fa-required"

const ENVELOPE_PATH_PREFIXES = [
  "/api/listings",
  "/api/kyc",
  "/api/users",
  "/api/conversations",
  "/api/notifications",
  "/api/payments",
  "/api/storefront",
]
const ENVELOPE_PATH_EXCLUSIONS = new Set([
  "/api/users/telegram-webhook",
  "/api/payments/aba-webhook",
  "/api/payments/khqr/webhook",
])

function requestPath(url = "") {
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost"
    return new URL(url, origin).pathname
  } catch {
    return url
  }
}

function shouldUnwrapEnvelope(response) {
  const pathname = requestPath(response.config?.url || "")
  if (ENVELOPE_PATH_EXCLUSIONS.has(pathname)) return false
  return ENVELOPE_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function normalizeResponseEnvelope(response) {
  if (!shouldUnwrapEnvelope(response)) return response
  const body = response.data
  if (body && typeof body === "object" && !Array.isArray(body) && body.error !== true && Object.prototype.hasOwnProperty.call(body, "data")) {
    response.data = body.data
  }
  return response
}

function normalizeErrorEnvelope(error) {
  if (!shouldUnwrapEnvelope(error.response || {})) return error
  const body = error.response?.data
  if (body?.error === true && typeof body.message === "string") {
    error.response.data = { ...body, error: body.message }
  }
  return error
}

function isAdminTwoFactorRequired(error) {
  const message = error.response?.data?.message || error.response?.data?.error
  return error.response?.status === 403 && message === ADMIN_2FA_MESSAGE
}

function requestAdminTwoFactor(originalRequest) {
  if (typeof window === "undefined" || originalRequest._admin2faRetry) {
    return Promise.reject(new Error(ADMIN_2FA_MESSAGE))
  }
  originalRequest._admin2faRetry = true
  return new Promise((resolve, reject) => {
    const request = { originalRequest, resolve, reject }
    window.__bayonhubAdmin2FAQueue = [...(window.__bayonhubAdmin2FAQueue || []), request]
    window.dispatchEvent(new CustomEvent(ADMIN_2FA_EVENT, { detail: request }))
  })
}

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
  
  const csrfToken = (typeof window !== "undefined" && window.__csrfToken) || getCookieValue("XSRF-TOKEN")
  if (csrfToken) config.headers["x-xsrf-token"] = csrfToken
  return config
})

client.interceptors.response.use(
  (response) => normalizeResponseEnvelope(response),
  async (error) => {
    normalizeErrorEnvelope(error)
    const originalRequest = error.config || {}

    if (!error.response) {
      console.warn("[API] Network error — activating localStorage fallback")
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("bayonhub:api-unavailable"))
      }
      return Promise.reject(error)
    }

    if (isAdminTwoFactorRequired(error)) {
      return requestAdminTwoFactor(originalRequest)
    }

    // CSRF Retry Logic: If 403 Forbidden, we likely missing a CSRF cookie.
    // Fetch it from /health and retry once.
    if (error.response?.status === 403 && !originalRequest._csrfRetry) {
      originalRequest._csrfRetry = true
      try {
        const res = await client.get("/health")
        if (res.data?.csrfToken && typeof window !== "undefined") {
          window.__csrfToken = res.data.csrfToken
        }
      } catch (csrfError) {
        if (csrfError.response?.data?.csrfToken && typeof window !== "undefined") {
          window.__csrfToken = csrfError.response.data.csrfToken
        }
        // Ignore errors from /health (e.g. 503 Degraded).
        // The browser still processes the Set-Cookie header!
      }
      return client(originalRequest)
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

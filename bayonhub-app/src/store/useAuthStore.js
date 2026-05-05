import { create } from "zustand"
import toast from "react-hot-toast"
import { getProfile, login as loginApi, logout as logoutApi, register as registerApi, sendOtp as sendOtpApi, verifyOTP as verifyOTPApi, resetPassword as resetPasswordApi } from "../api/auth"
import { API_BASE_URL, IS_PRODUCTION, STORAGE_KEYS } from "../api/client"
import { storage } from "../lib/storage"
import { translate } from "../lib/translations"
import { useUIStore } from "./useUIStore"

const FOLLOWING_KEY = "bayonhub:following"
const canUseLocalAuthToken = !IS_PRODUCTION && !API_BASE_URL
const initialToken = canUseLocalAuthToken ? storage.get(STORAGE_KEYS.authToken, null) : null
const initialUser = API_BASE_URL ? null : storage.get(STORAGE_KEYS.authUser, null)

function persistUser(user) {
  if (!API_BASE_URL) {
    storage.set(STORAGE_KEYS.authUser, user)
  }
}

function authErrorMessage(key) {
  const language = useUIStore.getState().language
  return key?.includes(".") ? translate(language, key) : translate(language, "ui.error")
}

export const useAuthStore = create((set, get) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: API_BASE_URL ? Boolean(initialUser) : Boolean(initialToken),
  loading: false,
  error: null,
  following: storage.get(FOLLOWING_KEY, []),

  login: async (phone, password) => {
    set({ loading: true, error: null })
    try {
      const { user, accessToken } = await loginApi(phone, password)
      get().setUser(user)
      set({
        token: accessToken,
        isAuthenticated: true,
        loading: false,
        error: null,
      })
      return user
    } catch (err) {
      set({ loading: false, error: err.message })
      throw err // MUST re-throw so AuthModal can handle it
    }
  },

  register: async (data) => {
    set({ loading: true, error: null })
    try {
      const { user, accessToken } = await registerApi(data)
      get().setUser(user)
      set({
        token: accessToken,
        isAuthenticated: true,
        loading: false,
      })
      return user
    } catch (err) {
      set({ loading: false, error: err.message })
      throw err // MUST re-throw
    }
  },

  sendOtp: async (phone) => {
    await sendOtpApi(phone)
    return { success: true }
  },

  verifyOTP: async (phone, code) => {
    set({ loading: true, error: null })
    try {
      const result = await verifyOTPApi(phone, code)
      const user = result.user || result
      const verifiedUser = {
        ...user,
        verificationTier: user.verificationTier || "PHONE",
        verified: true,
      }
      persistUser(verifiedUser)
      set({
        user: verifiedUser,
        isAuthenticated: true,
      })
      return verifiedUser
    } catch (error) {
      const message = error instanceof Error ? error.message : "ui.error"
      set({ error: message })
      toast.error(authErrorMessage(message))
      throw error
    } finally {
      set({ loading: false })
    }
  },

  resetPassword: async (phone, code, newPassword) => {
    set({ loading: true, error: null })
    try {
      await resetPasswordApi(phone, code, newPassword)
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : "ui.error"
      set({ error: message })
      toast.error(authErrorMessage(message))
      throw error
    } finally {
      set({ loading: false })
    }
  },

  loadProfile: async () => {
    set({ loading: true })
    try {
      const { user, accessToken } = await getProfile()
      persistUser(user)
      set({ 
        user, 
        token: accessToken, 
        isAuthenticated: Boolean(user), 
        loading: false 
      })
      return user
    } catch {
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false, 
        loading: false 
      })
      return null
    }
  },

  logout: async () => {
    try {
      await logoutApi()
    } finally {
      storage.remove(STORAGE_KEYS.authUser)
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      })
    }
  },

  clearAuthState: () => {
    if (!API_BASE_URL) {
      storage.remove(STORAGE_KEYS.authToken)
    }
    storage.remove(STORAGE_KEYS.authUser)
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
    })
  },

  clearUser: () => {
    get().clearAuthState()
  },

  setUser: (user) => {
    persistUser(user)
    set({ user, isAuthenticated: Boolean(user) })
  },

  updateUser: (patch) => {
    const current = API_BASE_URL ? get().user : storage.get(STORAGE_KEYS.authUser, null)
    const user = { ...current, ...patch }
    persistUser(user)
    set({ user, isAuthenticated: Boolean(user) })
    return user
  },

  followSeller: (sellerId) => {
    const normalizedId = String(sellerId)
    const following = get().following.includes(normalizedId)
      ? get().following
      : [...get().following, normalizedId]
    storage.set(FOLLOWING_KEY, following)
    set({ following })
    return following
  },

  unfollowSeller: (sellerId) => {
    const normalizedId = String(sellerId)
    const following = get().following.filter((id) => id !== normalizedId)
    storage.set(FOLLOWING_KEY, following)
    set({ following })
    return following
  },

  isFollowing: (sellerId) => get().following.includes(String(sellerId)),
}))

if (typeof window !== "undefined") {
  window.authStore = useAuthStore
}

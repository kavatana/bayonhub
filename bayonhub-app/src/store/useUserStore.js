import { create } from "zustand"
import {
  changePassword as changePasswordApi,
  connectTelegram as connectTelegramApi,
  deleteAccount as deleteAccountApi,
  fetchFollowers as fetchFollowersApi,
  fetchFollowing as fetchFollowingApi,
  fetchMe as fetchMeApi,
  fetchReferral as fetchReferralApi,
  fetchSavedListings as fetchSavedListingsApi,
  fetchSellerVerification as fetchSellerVerificationApi,
  followSeller as followSellerApi,
  generateReferral as generateReferralApi,
  sendPhoneOTP as sendPhoneOTPApi,
  submitSellerVerification as submitSellerVerificationApi,
  updateProfile as updateProfileApi,
  uploadAvatar as uploadAvatarApi,
  unfollowSeller as unfollowSellerApi,
  verifyPhoneOTP as verifyPhoneOTPApi,
} from "../api/users"
import {
  saveListing as saveListingApi,
  unsaveListing as unsaveListingApi,
} from "../api/listings"

export const useUserStore = create((set, get) => ({
  profile: null,
  profileLoading: false,
  savedListings: [],
  followingSellers: [],
  referral: null,
  followerCounts: {},
  verificationStatus: null,
  error: null,

  fetchMe: async () => {
    set({ profileLoading: true, error: null })
    try {
      const profile = await fetchMeApi()
      set({ profile, profileLoading: false })
      return profile
    } catch (error) {
      set({ error: error.message, profileLoading: false })
      return null
    }
  },

  updateProfile: async (data) => {
    set({ profileLoading: true, error: null })
    try {
      const profile = await updateProfileApi(data)
      set({ profile, profileLoading: false })
      return profile
    } catch (error) {
      set({ error: error.message, profileLoading: false })
      return null
    }
  },

  changePassword: async (data) => {
    try {
      return await changePasswordApi(data)
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    }
  },

  deleteAccount: async () => {
    try {
      const result = await deleteAccountApi()
      set({
        profile: null,
        savedListings: [],
        followingSellers: [],
        referral: null,
        followerCounts: {},
        verificationStatus: null,
        error: null,
      })
      return result
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    }
  },

  uploadAvatar: async (file) => {
    set({ profileLoading: true, error: null })
    try {
      const result = await uploadAvatarApi(file)
      const profile = result.user || { ...get().profile, avatarUrl: result.url, avatar: result.url }
      set({ profile, profileLoading: false })
      return result
    } catch (error) {
      set({ error: error.message, profileLoading: false })
      return null
    }
  },

  fetchSavedListings: async () => {
    set({ profileLoading: true, error: null })
    try {
      const savedListings = await fetchSavedListingsApi()
      set({ savedListings, profileLoading: false })
      return savedListings
    } catch (error) {
      set({ error: error.message, profileLoading: false })
      return []
    }
  },

  saveListing: async (id) => {
    await saveListingApi(id)
    return get().fetchSavedListings()
  },

  unsaveListing: async (id) => {
    await unsaveListingApi(id)
    set({
      savedListings: get().savedListings.filter((listing) => String(listing.id) !== String(id)),
    })
    return { success: true }
  },

  sendPhoneOTP: async (phone) => {
    try {
      return await sendPhoneOTPApi(phone)
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    }
  },

  verifyPhoneOTP: async (phone, code) => {
    try {
      const result = await verifyPhoneOTPApi(phone, code)
      if (result.user) set({ profile: result.user })
      return result
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    }
  },

  fetchSellerVerification: async () => {
    try {
      const verificationStatus = await fetchSellerVerificationApi()
      set({ verificationStatus })
      return verificationStatus
    } catch (error) {
      set({ error: error.message })
      return null
    }
  },

  submitSellerVerification: async (data) => {
    try {
      const verificationStatus = await submitSellerVerificationApi(data)
      set({ verificationStatus })
      return verificationStatus
    } catch (error) {
      set({ error: error.message })
      return null
    }
  },

  connectTelegram: async () => {
    try {
      return await connectTelegramApi()
    } catch (error) {
      set({ error: error.message })
      return null
    }
  },

  fetchReferral: async () => {
    try {
      const referral = await fetchReferralApi()
      set({ referral })
      return referral
    } catch (error) {
      set({ error: error.message })
      return null
    }
  },

  generateReferral: async () => {
    try {
      const result = await generateReferralApi()
      const referral = { ...(get().referral || {}), ...result }
      set({ referral })
      return referral
    } catch (error) {
      set({ error: error.message })
      return null
    }
  },

  fetchFollowing: async () => {
    set({ profileLoading: true, error: null })
    try {
      const result = await fetchFollowingApi()
      set({ followingSellers: result.following || [], profileLoading: false })
      return result.following || []
    } catch (error) {
      set({ error: error.message, profileLoading: false })
      return []
    }
  },

  followSeller: async (id) => {
    try {
      const result = await followSellerApi(id)
      set((state) => ({
        followerCounts: { ...state.followerCounts, [id]: result.followersCount },
      }))
      return result
    } catch (error) {
      set({ error: error.message })
      return null
    }
  },

  unfollowSeller: async (id) => {
    try {
      const result = await unfollowSellerApi(id)
      set((state) => ({
        followingSellers: state.followingSellers.filter((item) => String(item.seller?.id || item.id) !== String(id)),
        followerCounts: { ...state.followerCounts, [id]: result.followersCount },
      }))
      return result
    } catch (error) {
      set({ error: error.message })
      return null
    }
  },

  fetchFollowers: async (id) => {
    try {
      const result = await fetchFollowersApi(id)
      set((state) => ({
        followerCounts: { ...state.followerCounts, [id]: result.followersCount || 0 },
      }))
      return result
    } catch (error) {
      set({ error: error.message })
      return null
    }
  },
}))

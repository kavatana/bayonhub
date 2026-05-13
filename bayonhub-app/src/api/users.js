import client, { hasApiBackend, readStorage, STORAGE_KEYS, writeStorage } from "./client"
import { fetchSavedListings as fetchSavedListingsApi, normalizeListing } from "./listings"

function mockGetSaved() {
  const savedIds = readStorage(STORAGE_KEYS.saved, [])
  const listings = readStorage(STORAGE_KEYS.listings, [])
  return listings
    .filter((listing) => savedIds.some((id) => String(id) === String(listing.id)))
    .map(normalizeListing)
}

function mockUpdateProfile(data) {
  const currentUser = readStorage(STORAGE_KEYS.authUser, {})
  const user = { ...currentUser, ...data, avatarUrl: data.avatarUrl || data.avatar || currentUser.avatarUrl }
  writeStorage(STORAGE_KEYS.authUser, user)
  return user
}

function mockProfile() {
  const currentUser = readStorage(STORAGE_KEYS.authUser, null)
  const listings = readStorage(STORAGE_KEYS.listings, [])
  const userListings = listings.filter((listing) => String(listing.sellerId) === String(currentUser?.id))
  return {
    ...currentUser,
    avatar: currentUser?.avatar || currentUser?.avatarUrl || null,
    memberSince: currentUser?.createdAt || new Date().toISOString(),
    totalListings: userListings.length,
    totalViews: userListings.reduce((sum, listing) => sum + Number(listing.views || listing.viewCount || 0), 0),
  }
}

function followingIds() {
  return readStorage("bayonhub:following", []).map((id) => String(id))
}

function normalizeSavedResponse(data) {
  if (Array.isArray(data)) return data.map(normalizeListing)
  if (Array.isArray(data.listings)) return data.listings.map(normalizeListing)
  if (Array.isArray(data.savedListings)) {
    return data.savedListings
      .map((saved) => saved.listing || saved)
      .filter(Boolean)
      .map(normalizeListing)
  }
  return []
}

export async function getSavedListings() {
  if (!hasApiBackend()) return mockGetSaved()
  try {
    const response = await client.get("/api/users/me/saved")
    return normalizeSavedResponse(response.data)
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "users.loadError", { cause: err })
  }
}

export async function fetchMe() {
  if (!hasApiBackend()) return mockProfile()
  try {
    const response = await client.get("/api/users/me")
    return response.data.user || response.data
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "users.loadError", { cause: err })
  }
}

export async function updateProfile(data) {
  if (!hasApiBackend()) return mockUpdateProfile(data)
  try {
    const response = await client.patch("/api/users/me", {
      name: data.name,
      phone: data.phone,
      bio: data.bio,
      avatarUrl: data.avatarUrl || data.avatar,
      language: data.language,
      province: data.province,
    })
    return response.data.user || response.data
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "ui.error", { cause: err })
  }
}

export async function deleteAccount() {
  if (!hasApiBackend()) {
    localStorage.removeItem(STORAGE_KEYS.authToken)
    localStorage.removeItem(STORAGE_KEYS.authUser)
    return { success: true }
  }
  try {
    const response = await client.delete("/api/users/me")
    return response.data
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "ui.error", { cause: err })
  }
}

export async function changePassword(currentPasswordOrData, newPasswordValue) {
  const data = typeof currentPasswordOrData === "object"
    ? currentPasswordOrData
    : { currentPassword: currentPasswordOrData, newPassword: newPasswordValue }
  if (!hasApiBackend()) return { success: true }
  try {
    await client.patch("/api/users/me/password", {
      currentPassword: data.currentPassword || data.oldPassword,
      newPassword: data.newPassword,
    })
    return { success: true }
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "ui.error", { cause: err })
  }
}

export async function uploadAvatar(file) {
  const { default: imageCompression } = await import("browser-image-compression")
  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
  })

  if (!hasApiBackend()) {
    const url = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(compressed)
    })
    return { url, user: mockUpdateProfile({ avatarUrl: url }) }
  }

  try {
    const formData = new FormData()
    formData.append("file", compressed)
    const response = await client.post("/api/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "ui.error", { cause: err })
  }
}

export async function fetchSavedListings() {
  return fetchSavedListingsApi()
}

export async function sendPhoneOTP(phone) {
  if (!hasApiBackend()) return { success: true, code: "123456" }
  try {
    const response = await client.post("/api/auth/otp/send", { phone })
    return response.data
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "ui.error", { cause: err })
  }
}

export async function verifyPhoneOTP(phone, code) {
  if (!hasApiBackend()) {
    const currentUser = readStorage(STORAGE_KEYS.authUser, {})
    const user = { ...currentUser, phone, phoneVerified: true, phoneVerifiedAt: new Date().toISOString() }
    writeStorage(STORAGE_KEYS.authUser, user)
    return { success: true, user }
  }
  try {
    const response = await client.post("/api/auth/otp/verify", { phone, code })
    return response.data
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "ui.error", { cause: err })
  }
}

export async function fetchSellerVerification() {
  if (!hasApiBackend()) return { status: "not_submitted", adminNote: null }
  try {
    const response = await client.get("/api/users/me/verify-seller")
    return response.data
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "ui.error", { cause: err })
  }
}

export async function submitSellerVerification({ idFront, idBack }) {
  if (!hasApiBackend()) return { status: "pending" }
  try {
    const { default: imageCompression } = await import("browser-image-compression")
    const formData = new FormData()
    if (idFront) {
      const compressedFront = await imageCompression(idFront, { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: true })
      formData.append("idFront", compressedFront)
    }
    if (idBack) {
      const compressedBack = await imageCompression(idBack, { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: true })
      formData.append("idBack", compressedBack)
    }
    const response = await client.post("/api/users/me/verify-seller", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "ui.error", { cause: err })
  }
}

export async function connectTelegram() {
  if (!hasApiBackend()) return { link: "https://t.me/BayonHub_Bot", botUsername: "BayonHub_Bot" }
  try {
    const response = await client.post("/api/users/me/connect-telegram")
    return response.data
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "ui.error", { cause: err })
  }
}

export async function fetchReferral() {
  if (!hasApiBackend()) {
    const currentUser = readStorage(STORAGE_KEYS.authUser, {})
    const referralCode = currentUser.referralCode || null
    return {
      referralCode,
      referralCount: readStorage("bayonhub:referrals", []).length,
      rewardEarned: Boolean(currentUser.plusUntil),
    }
  }
  const response = await client.get("/api/users/me/referral")
  return response.data
}

export async function generateReferral() {
  if (!hasApiBackend()) {
    const currentUser = readStorage(STORAGE_KEYS.authUser, {})
    const referralCode = currentUser.referralCode || `BH${String(currentUser.id || Date.now()).slice(0, 8).toUpperCase()}`
    const user = { ...currentUser, referralCode }
    writeStorage(STORAGE_KEYS.authUser, user)
    return { referralCode }
  }
  const response = await client.post("/api/users/me/referral/generate")
  return response.data
}

export async function followSeller(id) {
  if (!hasApiBackend()) {
    const next = followingIds().includes(String(id)) ? followingIds() : [...followingIds(), String(id)]
    writeStorage("bayonhub:following", next)
    return { success: true, followersCount: next.length }
  }
  const response = await client.post(`/api/users/${id}/follow`)
  return response.data
}

export async function unfollowSeller(id) {
  if (!hasApiBackend()) {
    const next = followingIds().filter((sellerId) => sellerId !== String(id))
    writeStorage("bayonhub:following", next)
    return { success: true, followersCount: next.length }
  }
  const response = await client.delete(`/api/users/${id}/follow`)
  return response.data
}

export async function fetchFollowing() {
  if (!hasApiBackend()) {
    const listings = readStorage(STORAGE_KEYS.listings, [])
    const ids = followingIds()
    const following = ids.map((id) => {
      const sellerListings = listings.filter((listing) => String(listing.sellerId) === id)
      const latestListing = sellerListings[0] ? normalizeListing(sellerListings[0]) : null
      return {
        id,
        followedAt: new Date().toISOString(),
        seller: {
          id,
          name: latestListing?.sellerName || latestListing?.seller?.name || id,
          avatarUrl: latestListing?.seller?.avatarUrl || null,
          followersCount: ids.length,
          latestListing,
        },
      }
    })
    return { following }
  }
  const response = await client.get("/api/users/me/following")
  return response.data
}

export async function fetchFollowers(id) {
  if (!hasApiBackend()) {
    return { followersCount: followingIds().filter((sellerId) => sellerId === String(id)).length }
  }
  const response = await client.get(`/api/users/${id}/followers`)
  return response.data
}

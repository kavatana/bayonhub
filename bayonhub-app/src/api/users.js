import client, { hasApiBackend, readStorage, STORAGE_KEYS, writeStorage } from "./client"
import { normalizeListing } from "./listings"

function mockGetSaved() {
  const savedIds = readStorage(STORAGE_KEYS.saved, [])
  const listings = readStorage(STORAGE_KEYS.listings, [])
  return listings
    .filter((listing) => savedIds.some((id) => String(id) === String(listing.id)))
    .map(normalizeListing)
}

function mockUpdateProfile(data) {
  const currentUser = readStorage(STORAGE_KEYS.authUser, {})
  const user = { ...currentUser, ...data }
  writeStorage(STORAGE_KEYS.authUser, user)
  return user
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

export async function updateProfile(data) {
  if (!hasApiBackend()) return mockUpdateProfile(data)
  try {
    const response = await client.put("/api/users/me", {
      name: data.name,
      bio: data.bio,
      avatarUrl: data.avatarUrl || data.avatar,
      language: data.language,
    })
    return response.data.user || response.data
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "ui.error", { cause: err })
  }
}

export async function changePassword(oldPassword, newPassword) {
  if (!hasApiBackend()) return { success: true }
  try {
    await client.put("/api/users/me/password", { oldPassword, newPassword })
    return { success: true }
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "ui.error", { cause: err })
  }
}

import client, { hasApiBackend } from "./client"
import { storage } from "../lib/storage"

const STORAGE_KEY = "bayonhub:merchantProfiles"

function readLocalProfiles() {
  return storage.get(STORAGE_KEY, {})
}

function writeLocalProfiles(profiles) {
  storage.set(STORAGE_KEY, profiles)
}

function mockGetMerchantProfile(merchantId) {
  const profiles = readLocalProfiles()
  return profiles[merchantId] || null
}

function mockCreateMerchantProfile(data) {
  const merchantId = String(data.merchant_id)
  const profile = {
    ...data,
    created_at: new Date().toISOString(),
    onboarded_by: "local",
  }
  const profiles = readLocalProfiles()
  writeLocalProfiles({ ...profiles, [merchantId]: profile })
  return profile
}

function mockUpdateMerchantProfile(merchantId, data) {
  const profiles = readLocalProfiles()
  const existing = profiles[merchantId]
  if (!existing) return null
  const profile = { ...existing, ...data, merchant_id: merchantId }
  writeLocalProfiles({ ...profiles, [merchantId]: profile })
  return profile
}

export async function getMerchantProfile(merchantId) {
  if (!hasApiBackend()) return mockGetMerchantProfile(merchantId)
  try {
    const response = await client.get(`/api/v1/merchant/profile/${merchantId}`)
    return response.data.merchant_profile || response.data
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "ui.error", { cause: err })
  }
}

export async function createMerchantProfile(data) {
  if (!hasApiBackend()) return mockCreateMerchantProfile(data)
  try {
    const response = await client.post("/api/v1/merchant/onboard", data)
    return response.data.merchant_profile || response.data
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "ui.error", { cause: err })
  }
}

export async function updateMerchantProfile(merchantId, data) {
  if (!hasApiBackend()) return mockUpdateMerchantProfile(merchantId, data)
  try {
    const response = await client.put(`/api/v1/merchant/profile/${merchantId}`, data)
    return response.data.merchant_profile || response.data
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "ui.error", { cause: err })
  }
}

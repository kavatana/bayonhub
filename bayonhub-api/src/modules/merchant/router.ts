import { NextFunction, Request, Response, Router } from "express"

import { env } from "../../config/env"
import { redis } from "../../config/redis"
import { requireAuth } from "../../middleware/auth"
import { getMerchantProfile, upsertMerchantProfile } from "../sellers/service"

const router = Router()

interface MerchantRequest extends Request {
  merchantAuth?: {
    type: "apiKey" | "oauth"
    identity: string
  }
}

function createHttpError(status: number, message: string): Error & { status: number } {
  const error = new Error(message) as Error & { status: number }
  error.status = status
  return error
}

function getMerchantApiKeys(): string[] {
  return env.merchantApiKeys
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value)
}

function validateMerchantApiKey(value: unknown): boolean {
  return typeof value === "string" && getMerchantApiKeys().includes(value.trim())
}

async function requireAuthOrApiKey(req: MerchantRequest, res: Response, next: NextFunction) {
  const apiKeyHeader = req.headers["x-api-key"]
  if (typeof apiKeyHeader === "string") {
    if (!validateMerchantApiKey(apiKeyHeader)) {
      return res.status(401).json({ error: "Unauthorized" })
    }
    req.merchantAuth = { type: "apiKey", identity: apiKeyHeader }
    return next()
  }
  
  return requireAuth(req, res, next)
}

/**
 * Validates and maps the incoming merchant payload to the new schema.
 * Supports legacy field names from the frontend for backward compatibility.
 */
function mapMerchantPayload(body: any) {
  return {
    storeName: body.storeName || body.merchant_name || body.name || "My Store",
    storeNameKm: body.storeNameKm || null,
    tagline: body.tagline || null,
    taglineKm: body.taglineKm || null,
    bannerKey: body.bannerKey || body.banner || null,
    logoKey: body.logoKey || body.logo || null,
    businessPhone: body.businessPhone || body.contact_phone || body.phone || null,
    telegramHandle: body.telegramHandle || body.telegram_channel || body.telegram || null,
    facebookPage: body.facebookPage || null,
    businessHours: body.businessHours || body.hours || null,
    aboutUs: body.aboutUs || body.aboutEn || null,
    aboutUsKm: body.aboutUsKm || body.aboutKm || null,
    taxId: body.taxId || body.tax_identification_number || null,
    catalogConfig: body.catalogConfig || (body.initial_catalog_endpoints ? { endpoints: body.initial_catalog_endpoints } : null),
    isActive: body.isActive !== undefined ? body.isActive : true,
  }
}

router.post("/onboard", requireAuthOrApiKey, async (req, res, next) => {
  try {
    const userId = req.user?.id
    if (!userId && (req as MerchantRequest).merchantAuth?.type !== "apiKey") {
      throw createHttpError(401, "Authentication required for onboarding")
    }

    // In case of API key onboarding without a user, we might need a placeholder or specific logic.
    // For now, we assume a userId is available if it's a real user.
    const targetUserId = userId || (req.body.merchant_id && isValidUuid(req.body.merchant_id) ? req.body.merchant_id : null)
    
    if (!targetUserId) {
      throw createHttpError(400, "Missing userId or merchant_id for onboarding")
    }

    const profileData = mapMerchantPayload(req.body)
    const profile = await upsertMerchantProfile(targetUserId, profileData)

    res.status(201).json({
      success: true,
      merchant_profile: profile,
    })
  } catch (error) {
    next(error)
  }
})

router.get("/profile/:userId", requireAuthOrApiKey, async (req, res, next) => {
  try {
    const userId = String(req.params.userId || "").trim()
    if (!isValidUuid(userId)) throw createHttpError(400, "Invalid userId")

    const profile = await getMerchantProfile(userId)
    if (!profile) throw createHttpError(404, "Merchant profile not found")

    res.status(200).json({ merchant_profile: profile })
  } catch (error) {
    next(error)
  }
})

router.put("/profile/:userId", requireAuthOrApiKey, async (req, res, next) => {
  try {
    const userId = String(req.params.userId || "").trim()
    if (!isValidUuid(userId)) throw createHttpError(400, "Invalid userId")

    const profileData = mapMerchantPayload(req.body)
    const profile = await upsertMerchantProfile(userId, profileData)

    res.status(200).json({
      success: true,
      merchant_profile: profile,
    })
  } catch (error) {
    next(error)
  }
})

export default router

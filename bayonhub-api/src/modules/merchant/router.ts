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

const MERCHANT_PUBLIC_FIELDS = [
  "storeName",
  "storeNameKm",
  "tagline",
  "taglineKm",
  "logoKey",
  "aboutUs",
  "aboutUsKm",
  "isActive",
] as const

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

function getMerchantApiKeyBindings(): Record<string, string> {
  const raw = process.env.MERCHANT_API_KEY_BINDINGS
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    )
  } catch {
    return Object.fromEntries(
      raw
        .split(",")
        .map((pair) => pair.split(":").map((part) => part.trim()))
        .filter((parts): parts is [string, string] => parts.length === 2 && Boolean(parts[0]) && Boolean(parts[1])),
    )
  }
}

function pickMerchantPublicFields<T extends Record<string, unknown>>(profile: T) {
  return Object.fromEntries(MERCHANT_PUBLIC_FIELDS.map((field) => [field, profile[field]]))
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
    const merchantAuth = (req as MerchantRequest).merchantAuth
    if (!userId && merchantAuth?.type !== "apiKey") {
      throw createHttpError(401, "Authentication required for onboarding")
    }

    const bindings = getMerchantApiKeyBindings()
    const apiKeyBoundUserId = merchantAuth?.type === "apiKey" ? bindings[merchantAuth.identity] : null
    if (merchantAuth?.type === "apiKey" && !apiKeyBoundUserId) {
      console.warn({ event: "merchant_onboard_denied", reason: "no key binding", keyPrefix: merchantAuth.identity.slice(0, 8) })
      throw createHttpError(403, "Merchant API key is not bound to a user")
    }

    const requestedMerchantId = typeof req.body.merchant_id === "string" && isValidUuid(req.body.merchant_id)
      ? req.body.merchant_id
      : null
    if (merchantAuth?.type === "apiKey" && requestedMerchantId && requestedMerchantId !== apiKeyBoundUserId) {
      console.warn({ event: "merchant_onboard_denied", reason: "binding mismatch", keyPrefix: merchantAuth.identity.slice(0, 8) })
      throw createHttpError(403, "Merchant API key cannot onboard this user")
    }

    const targetUserId = apiKeyBoundUserId || userId || requestedMerchantId
    
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

    const merchantAuth = (req as MerchantRequest).merchantAuth
    const requesterId = req.user?.id
    const isOwner = requesterId === userId
    const isAdmin = Boolean(req.user?.isAdmin)
    const canReadFull = merchantAuth?.type === "apiKey" || isOwner || isAdmin

    res.status(200).json({ merchant_profile: canReadFull ? profile : pickMerchantPublicFields(profile) })
  } catch (error) {
    next(error)
  }
})

router.put("/profile/:userId", requireAuthOrApiKey, async (req, res, next) => {
  try {
    const userId = String(req.params.userId || "").trim()
    if (!isValidUuid(userId)) throw createHttpError(400, "Invalid userId")
    const merchantAuth = (req as MerchantRequest).merchantAuth
    if (merchantAuth?.type === "apiKey") {
      console.warn("[Merchant] API key profile update denied", { apiKeyIdentity: merchantAuth.identity, targetUserId: userId })
      throw createHttpError(403, "API key callers cannot update merchant profiles")
    }
    if (req.user?.id !== userId && !req.user?.isAdmin) {
      console.warn({ event: "merchant_update_denied", userId: req.user?.id, targetId: userId })
      throw createHttpError(403, "Forbidden")
    }

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

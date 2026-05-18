import { randomUUID } from "crypto"
import type { RequestHandler } from "express"
import { LeadType, ReportReason } from "@prisma/client"

import { getPresignedUploadUrl, processAndUpload } from "../../lib/s3"
import { createHttpError } from "../../lib/errors"
import { validateMagicBytes } from "../../middleware/upload"
import { maskPhone, withoutEmail } from "../../utils/safeUser"
import { listingSchema } from "./validators"
import {
  bumpListing as bumpListingService,
  createLead as createLeadService,
  createListing as createListingService,
  deleteListing as deleteListingService,
  getFeaturedListings as getFeaturedListingsService,
  getListing as getListingService,
  getListingLocations as getListingLocationsService,
  getListings as getListingsService,
  getListingsByUser as getListingsByUserService,
  getSavedListings as getSavedListingsService,
  getRelated as getRelatedService,
  getSimilarListings as getSimilarListingsService,
  incrementView as incrementViewService,
  markSold as markSoldService,
  publishDraft as publishDraftService,
  reportListing as reportListingService,
  revealListingPhone as revealListingPhoneService,
  saveDraft as saveDraftService,
  saveListing as saveListingService,
  searchListings as searchListingsService,
  unsaveListing as unsaveListingService,
  updateListing as updateListingService,
} from "./service"

function parseNumber(value: unknown): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseBoolean(value: unknown): boolean | undefined {
  if (value === "true" || value === "1") return true
  if (value === "false" || value === "0") return false
  return undefined
}

function getParamId(value: string | string[] | undefined): string {
  if (typeof value === "string" && value.length > 0) return value
  throw createHttpError(400, "Invalid listing id")
}

function getFiles(req: Parameters<RequestHandler>[0]): Express.Multer.File[] {
  return Array.isArray(req.files) ? req.files : []
}

function normalizeListingRequestBody(input: unknown) {
  const data = { ...((input as Record<string, unknown>) || {}) }
  if (data.categoryId && !data.categorySlug) data.categorySlug = data.categoryId
  if (data.location && !data.province) data.province = data.location
  if (data.metadata !== undefined && data.facets === undefined) data.facets = data.metadata
  if (data.price !== undefined && Number(data.price) === 0 && data.negotiable === undefined) {
    data.negotiable = true
  }
  return data
}

function validateListingRequestBody(input: unknown, partial = false) {
  const normalized = normalizeListingRequestBody(input)
  const parsed = partial ? listingSchema.partial().parse(normalized) : listingSchema.parse(normalized)
  return { ...normalized, ...parsed }
}

export const getListings: RequestHandler = async (req, res, next) => {
  try {
    const result = await getListingsService({
      category: req.query.category as string | undefined,
      subcategory: req.query.subcategory as string | undefined,
      province: req.query.province as string | undefined,
      district: req.query.district as string | undefined,
      minPrice: parseNumber(req.query.minPrice),
      maxPrice: parseNumber(req.query.maxPrice),
      q: req.query.q as string | undefined,
      promoted: parseBoolean(req.query.promoted),
      cursor: req.query.cursor as string | undefined,
      limit: parseNumber(req.query.limit),
    })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export const searchListings: RequestHandler = async (req, res, next) => {
  try {
    const result = await searchListingsService({
      q: req.query.q as string | undefined,
      category: req.query.category as string | undefined,
      location: (req.query.location || req.query.province) as string | undefined,
      priceMin: parseNumber(req.query.priceMin ?? req.query.minPrice),
      priceMax: parseNumber(req.query.priceMax ?? req.query.maxPrice),
      condition: req.query.condition as string | undefined,
      negotiable: parseBoolean(req.query.negotiable),
      sortBy: (req.query.sortBy || req.query.sort) as string | undefined,
      page: parseNumber(req.query.page),
      limit: parseNumber(req.query.limit),
    })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export const getFeaturedListings: RequestHandler = async (_req, res, next) => {
  try {
    const listings = await getFeaturedListingsService()
    res.status(200).json({ data: listings })
  } catch (error) {
    next(error)
  }
}

export const getListingLocations: RequestHandler = async (_req, res, next) => {
  try {
    const locations = await getListingLocationsService()
    res.status(200).json(locations)
  } catch (error) {
    next(error)
  }
}

export const getListing: RequestHandler = async (req, res, next) => {
  try {
    const listing = await getListingService(getParamId(req.params.id))
    const isAuth = Boolean(req.user)
    // F4.1 — mask seller phone for unauthenticated callers
    // F4.2 — FULL_LISTING_INCLUDE does not select email, so no stripping needed here;
    //         email guard is applied at the user profile endpoint (users router /:id)
    const sellerPhone = (listing.seller as { phone?: string | null }).phone
    const whatsappNumber = (listing as { whatsappNumber?: string | null }).whatsappNumber
    const seller = isAuth
      ? listing.seller
      : {
          ...listing.seller,
          phone: maskPhone(sellerPhone),
        }
    res.status(200).json({ ...listing, seller, whatsappNumber: isAuth ? whatsappNumber : maskPhone(whatsappNumber) })
  } catch (error) {
    next(error)
  }
}

export const createListing: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw createHttpError(401, "Unauthorized")
    const files = getFiles(req)
    for (const file of files) {
      if (!(await validateMagicBytes(file.buffer, file.mimetype))) {
        throw createHttpError(400, `Invalid image format for file: ${file.originalname}`)
      }
    }
    const body = validateListingRequestBody(req.body)
    const listing = await createListingService(req.user.id, body, files)
    res.status(201).json(listing)
  } catch (error) {
    next(error)
  }
}

export const updateListing: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw createHttpError(401, "Unauthorized")
    const files = getFiles(req)
    for (const file of files) {
      if (!(await validateMagicBytes(file.buffer, file.mimetype))) {
        throw createHttpError(400, `Invalid image format for file: ${file.originalname}`)
      }
    }
    const body = validateListingRequestBody(req.body, true)
    const listing = await updateListingService(
      req.user.id,
      req.user.role,
      getParamId(req.params.id),
      body,
      files,
    )
    res.status(200).json(listing)
  } catch (error) {
    next(error)
  }
}

export const saveDraft: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw createHttpError(401, "Unauthorized")
    const files = getFiles(req)
    for (const file of files) {
      if (!(await validateMagicBytes(file.buffer, file.mimetype))) {
        throw createHttpError(400, `Invalid image format for file: ${file.originalname}`)
      }
    }
    const normalizedBody = normalizeListingRequestBody(req.body)
    const body = validateListingRequestBody(normalizedBody, typeof normalizedBody.id === "string")
    const listing = await saveDraftService(req.user.id, req.user.role, body, files)
    res.status(200).json(listing)
  } catch (error) {
    next(error)
  }
}

export const publishDraft: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw createHttpError(401, "Unauthorized")
    const listing = await publishDraftService(req.user.id, req.user.role, getParamId(req.params.id))
    res.status(200).json(listing)
  } catch (error) {
    next(error)
  }
}

export const deleteListing: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw createHttpError(401, "Unauthorized")
    const result = await deleteListingService(req.user.id, req.user.role, getParamId(req.params.id))
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export const reportListing: RequestHandler = async (req, res, next) => {
  try {
    const reporterId = req.user?.id
    if (!reporterId) throw createHttpError(401, "Authentication required to report a listing")
    const reason = req.body.reason as ReportReason
    if (!Object.values(ReportReason).includes(reason)) {
      throw createHttpError(400, "Invalid report reason")
    }
    const { detail, evidenceUrl, contactEmail, userAgent, reporterSessionId, listingTitle } = req.body
    const report = await reportListingService(reporterId, getParamId(req.params.id), reason, {
      detail,
      evidenceUrl,
      contactEmail,
      userAgent,
      reporterSessionId,
      listingTitle,
    })
    res.status(201).json({ success: true, report })
  } catch (error) {
    next(error)
  }
}

export const createLead: RequestHandler = async (req, res, next) => {
  try {
    const type = req.body.type as LeadType
    if (!Object.values(LeadType).includes(type)) {
      throw createHttpError(400, "Invalid lead type")
    }
    const lead = await createLeadService(getParamId(req.params.id), req.user?.id, type, {
      phone: req.body.phone,
      message: req.body.message,
      offerPrice: req.body.offerPrice,
    })
    res.status(201).json(lead)
  } catch (error) {
    next(error)
  }
}

export const revealListingPhone: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw createHttpError(401, "Unauthorized")
    const result = await revealListingPhoneService(getParamId(req.params.id), req.user.id)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export const saveListing: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw createHttpError(401, "Unauthorized")
    const savedListing = await saveListingService(req.user.id, getParamId(req.params.id))
    res.status(200).json(savedListing)
  } catch (error) {
    next(error)
  }
}

export const unsaveListing: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw createHttpError(401, "Unauthorized")
    const result = await unsaveListingService(req.user.id, getParamId(req.params.id))
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export const getSavedListings: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw createHttpError(401, "Unauthorized")
    const listings = await getSavedListingsService(req.user.id)
    res.status(200).json({ data: listings })
  } catch (error) {
    next(error)
  }
}

export const getRelated: RequestHandler = async (req, res, next) => {
  try {
    const listings = await getRelatedService(
      getParamId(req.params.id),
      parseNumber(req.query.limit) || 4,
    )
    res.status(200).json({ listings })
  } catch (error) {
    next(error)
  }
}

export const getSimilarListings: RequestHandler = async (req, res, next) => {
  try {
    const listings = await getSimilarListingsService(getParamId(req.params.id))
    res.status(200).json({ data: listings })
  } catch (error) {
    next(error)
  }
}

export const getUploadUrl: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw createHttpError(401, "Unauthorized")
    const filename = typeof req.query.filename === "string" ? req.query.filename : ""
    const type = typeof req.query.type === "string" ? req.query.type : ""
    if (!filename) throw createHttpError(400, "filename is required")
    if (!type.startsWith("image/")) throw createHttpError(400, "type must be an image MIME type")
    const key = `listings/${req.user.id}/${randomUUID()}.webp`
    const result = await getPresignedUploadUrl(key, type)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export const uploadLocal: RequestHandler = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === "production") {
      res.status(404).json({ error: "Not found" })
      return
    }
    if (!req.file) throw createHttpError(400, "File is required")
    if (!(await validateMagicBytes(req.file.buffer, req.file.mimetype))) {
      throw createHttpError(400, "Invalid image format")
    }
    // F3.4 — storage key scoped to userId so uploads are isolated per user
    const result = await processAndUpload(req.file.buffer, `listings/${req.user!.id}/${randomUUID()}.webp`)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export const uploadImage: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw createHttpError(401, "Unauthorized")
    if (!req.file) throw createHttpError(400, "File is required")
    if (!(await validateMagicBytes(req.file.buffer, req.file.mimetype))) {
      throw createHttpError(400, "Invalid image format")
    }
    const result = await processAndUpload(req.file.buffer, `listings/${req.user.id}/${randomUUID()}.webp`)
    res.status(201).json({ url: result.url })
  } catch (error) {
    next(error)
  }
}

export const getMyListings: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw createHttpError(401, "Unauthorized")
    const listings = await getListingsByUserService(req.user.id, req.query.status as string | undefined)
    res.status(200).json(listings)
  } catch (error) {
    next(error)
  }
}

export const markAsSold: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw createHttpError(401, "Unauthorized")
    const listing = await markSoldService(req.user.id, req.user.role, getParamId(req.params.id))
    res.status(200).json(listing)
  } catch (error) {
    next(error)
  }
}

export const bumpListing: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw createHttpError(401, "Unauthorized")
    const result = await bumpListingService(req.user.id, req.user.role, getParamId(req.params.id))
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export const incrementView: RequestHandler = async (req, res, next) => {
  try {
    const views = await incrementViewService(getParamId(req.params.id), req.body.sessionId)
    res.status(200).json({ views })
  } catch {
    res.status(200).json({ views: 0 }) // Always succeed — non-critical
  }
}

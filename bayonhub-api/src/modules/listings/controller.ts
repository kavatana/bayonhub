import { randomUUID } from "crypto"
import type { RequestHandler } from "express"
import { LeadType, ReportReason } from "@prisma/client"

import { getPresignedUploadUrl, processAndUpload } from "../../lib/s3"
import {
  createLead as createLeadService,
  createListing as createListingService,
  deleteListing as deleteListingService,
  getListing as getListingService,
  getListings as getListingsService,
  getRelated as getRelatedService,
  reportListing as reportListingService,
  saveListing as saveListingService,
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

function createHttpError(status: number, message: string): Error & { status: number } {
  const error = new Error(message) as Error & { status: number }
  error.status = status
  return error
}

function getParamId(value: string | string[] | undefined): string {
  if (typeof value === "string" && value.length > 0) return value
  throw createHttpError(400, "Invalid listing id")
}

function getFiles(req: Parameters<RequestHandler>[0]): Express.Multer.File[] {
  return Array.isArray(req.files) ? req.files : []
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

export const getListing: RequestHandler = async (req, res, next) => {
  try {
    const listing = await getListingService(getParamId(req.params.id))
    res.status(200).json(listing)
  } catch (error) {
    next(error)
  }
}

export const createListing: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw createHttpError(401, "Unauthorized")
    const listing = await createListingService(req.user.id, req.body, getFiles(req))
    res.status(201).json(listing)
  } catch (error) {
    next(error)
  }
}

export const updateListing: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw createHttpError(401, "Unauthorized")
    const listing = await updateListingService(
      req.user.id,
      req.user.role,
      getParamId(req.params.id),
      req.body,
      getFiles(req),
    )
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
    if (!req.user) throw createHttpError(401, "Unauthorized")
    const reason = req.body.reason as ReportReason
    if (!Object.values(ReportReason).includes(reason)) {
      throw createHttpError(400, "Invalid report reason")
    }
    const report = await reportListingService(
      req.user.id,
      getParamId(req.params.id),
      reason,
      req.body.detail,
    )
    res.status(201).json(report)
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
    const result = await processAndUpload(req.file.buffer, `listings/${randomUUID()}.webp`)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

import { Router } from "express"
import fs from "fs"
import { KYCStatus, ListingStatus, ReportStatus, Role, VerificationTier } from "@prisma/client"

import { getLocalPrivateDocumentPath, getPrivateDocumentReadUrl } from "../../lib/s3"
import { requireAdmin, requireAuth } from "../../middleware/auth"
import {
  getAdminListings,
  getPendingKycApplications,
  getReports,
  getStats,
  getUsers,
  importListings,
  updateKycApplication,
  updateListingStatus,
  updateReport,
  updateUserRole,
  updateUserVerification,
} from "./service"

const router = Router()

function createHttpError(status: number, message: string): Error & { status: number } {
  const error = new Error(message) as Error & { status: number }
  error.status = status
  return error
}

function getParam(value: string | string[] | undefined, label: string): string {
  if (typeof value === "string" && value.length > 0) return value
  throw createHttpError(400, `Invalid ${label}`)
}

function getQueryString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

router.use(requireAuth, requireAdmin)

router.get("/reports", async (req, res, next) => {
  try {
    const result = await getReports(getQueryString(req.query.cursor), Number(req.query.limit || 20))
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.put("/reports/:id", async (req, res, next) => {
  try {
    const status = req.body.status as ReportStatus
    const listingStatus = req.body.listingStatus as ListingStatus | undefined
    const allowedReportStatuses: ReportStatus[] = [ReportStatus.RESOLVED, ReportStatus.DISMISSED]
    if (!allowedReportStatuses.includes(status)) {
      throw createHttpError(400, "Invalid report status")
    }
    if (listingStatus && !Object.values(ListingStatus).includes(listingStatus)) {
      throw createHttpError(400, "Invalid listing status")
    }
    const report = await updateReport(getParam(req.params.id, "report id"), {
      status,
      listingStatus,
    })
    res.status(200).json(report)
  } catch (error) {
    next(error)
  }
})

router.get("/kyc", async (_req, res, next) => {
  try {
    const applications = await getPendingKycApplications()
    res.status(200).json({ applications })
  } catch (error) {
    next(error)
  }
})

router.get("/kyc/:id/document/:field", async (req, res, next) => {
  try {
    const field = req.params.field
    if (field !== "idFront" && field !== "idBack" && field !== "selfie") {
      throw createHttpError(400, "Invalid KYC document field")
    }
    const applicationId = getParam(req.params.id, "KYC application id")
    const application = await getPendingKycApplications().then((applications) =>
      applications.find((item: { id: string }) => item.id === applicationId),
    )
    if (!application) throw createHttpError(404, "KYC application not found")
    const key =
      field === "idFront" ? application.idFrontKey : field === "idBack" ? application.idBackKey : application.selfieKey
    if (!key) throw createHttpError(404, "KYC document not found")
    const signedUrl = await getPrivateDocumentReadUrl(key)
    if (signedUrl) {
      res.redirect(signedUrl)
      return
    }
    const filepath = getLocalPrivateDocumentPath(key)
    if (!fs.existsSync(filepath)) throw createHttpError(404, "KYC document not found")
    res.sendFile(filepath)
  } catch (error) {
    next(error)
  }
})

router.put("/kyc/:id", async (req, res, next) => {
  try {
    const rawStatus = req.body.status as KYCStatus
    const allowedKycStatuses: KYCStatus[] = [KYCStatus.APPROVED, KYCStatus.REJECTED, KYCStatus.NEEDS_RESUBMIT]
    if (!allowedKycStatuses.includes(rawStatus)) {
      throw createHttpError(400, "Invalid KYC status")
    }
    const status = rawStatus
    const application = await updateKycApplication(
      getParam(req.params.id, "KYC application id"),
      req.user!.id,
      status,
      typeof req.body.note === "string" ? req.body.note : undefined,
    )
    res.status(200).json({ application })
  } catch (error) {
    next(error)
  }
})

router.get("/listings", async (req, res, next) => {
  try {
    const result = await getAdminListings(
      getQueryString(req.query.cursor),
      Number(req.query.limit || 20),
    )
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.put("/listings/:id/status", async (req, res, next) => {
  try {
    const status = req.body.status as ListingStatus
    if (!Object.values(ListingStatus).includes(status)) {
      throw createHttpError(400, "Invalid listing status")
    }
    const listing = await updateListingStatus(getParam(req.params.id, "listing id"), status)
    res.status(200).json(listing)
  } catch (error) {
    next(error)
  }
})

router.post("/listings/import", async (req, res, next) => {
  try {
    const result = await importListings(req.body.listings)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.get("/users", async (req, res, next) => {
  try {
    const result = await getUsers(getQueryString(req.query.cursor), Number(req.query.limit || 20))
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.put("/users/:id/role", async (req, res, next) => {
  try {
    const role = req.body.role as Role
    if (!Object.values(Role).includes(role)) throw createHttpError(400, "Invalid role")
    const user = await updateUserRole(getParam(req.params.id, "user id"), role)
    res.status(200).json({ user })
  } catch (error) {
    next(error)
  }
})

router.put("/users/:id/verify", async (req, res, next) => {
  try {
    const verificationTier = req.body.verificationTier as VerificationTier
    if (!Object.values(VerificationTier).includes(verificationTier)) {
      throw createHttpError(400, "Invalid verification tier")
    }
    const user = await updateUserVerification(
      getParam(req.params.id, "user id"),
      verificationTier,
    )
    res.status(200).json({ user })
  } catch (error) {
    next(error)
  }
})

router.get("/stats", async (_req, res, next) => {
  try {
    const stats = await getStats()
    res.status(200).json(stats)
  } catch (error) {
    next(error)
  }
})

export default router

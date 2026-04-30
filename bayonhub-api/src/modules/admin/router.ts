import { Router } from "express"
import { ListingStatus, ReportStatus, Role, VerificationTier } from "@prisma/client"

import { requireAdmin, requireAuth } from "../../middleware/auth"
import {
  getAdminListings,
  getReports,
  getStats,
  getUsers,
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

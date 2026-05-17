import { Router } from "express"
import fs from "fs"
import { KYCStatus, ListingStatus, ReportStatus, Role, VerificationTier } from "@prisma/client"
import { z } from "zod"

import { getLocalPrivateDocumentPath, getPrivateDocumentReadUrl } from "../../lib/s3"
import { createHttpError } from "../../lib/errors"
import { requireAdmin, requireAuth } from "../../middleware/auth"
import { adminIpAllowlist, requireAdmin2FA } from "../../middleware/adminAuth"
import { logAdminAction } from "./audit"
import {
  addFeaturedListing,
  approvePayment,
  banUser,
  bulkListingAction,
  getAnalytics,
  getAdminListings,
  getAdminListingsPage,
  getAppeals,
  getBannedUsers,
  getDashboard,
  getFeaturedListings,
  getAdminPayments,
  getGiftPlusLog,
  getPendingKycApplications,
  getReports,
  getReportsPage,
  getStats,
  getUserDetail,
  getUsers,
  getUsersPage,
  getVerificationRequests,
  hardDeleteListing,
  importListings,
  removeFeaturedListing,
  refundPayment,
  revokePlus,
  rejectPayment,
  resolveAppeal,
  resolveReport,
  resolveVerificationRequest,
  giftPlus,
  searchGiftUsers,
  unbanUser,
  updateAdminListing,
  updateListingImageReviewStatus,
  updateKycApplication,
  updateListingStatus,
  updateReport,
  updateUserRole,
  updateUserVerification,
  warnUser,
} from "./service"

const router = Router()

function getParam(value: string | string[] | undefined, label: string): string {
  if (typeof value === "string" && value.length > 0) return value
  throw createHttpError(400, `Invalid ${label}`)
}

function getQueryString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

// F2.1 — Zod schema for POST /admin/listings/import
const importListingsSchema = z.object({
  listings: z.array(z.record(z.string(), z.unknown())).min(1).max(100),
})

router.use(requireAuth, adminIpAllowlist, requireAdmin, requireAdmin2FA)

router.get("/dashboard", async (_req, res, next) => {
  try {
    const result = await getDashboard()
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.get("/payments", async (req, res, next) => {
  try {
    const result = await getAdminPayments({
      status: getQueryString(req.query.status),
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 20),
    })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.post("/payments/:id/approve", async (req, res, next) => {
  try {
    const result = await approvePayment(getParam(req.params.id, "payment id"), req.user!.id)
    // F4.4 — audit log
    logAdminAction({ adminId: req.user!.id, action: "payment.approve", targetId: req.params.id, targetType: "payment" })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.post("/payments/:id/reject", async (req, res, next) => {
  try {
    const reviewNote = typeof req.body.reviewNote === "string" ? req.body.reviewNote : ""
    if (!reviewNote.trim()) throw createHttpError(400, "reviewNote is required")
    const result = await rejectPayment(getParam(req.params.id, "payment id"), req.user!.id, reviewNote)
    // F4.4 — audit log
    logAdminAction({ adminId: req.user!.id, action: "payment.reject", targetId: req.params.id, targetType: "payment", note: reviewNote })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.post("/payments/:id/refund", async (req, res, next) => {
  try {
    const refundNote = typeof req.body.refundNote === "string" ? req.body.refundNote : ""
    const result = await refundPayment(getParam(req.params.id, "payment id"), req.user!.id, refundNote)
    logAdminAction({
      adminId: req.user!.id,
      action: "payment.refund",
      targetId: req.params.id,
      targetType: "payment",
      note: refundNote,
    })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.post("/gift-plus", async (req, res, next) => {
  try {
    const result = await giftPlus(req.user!.id, {
      userId: typeof req.body.userId === "string" ? req.body.userId : undefined,
      giftType: typeof req.body.giftType === "string" ? req.body.giftType : undefined,
      note: typeof req.body.note === "string" ? req.body.note : undefined,
    })
    // F4.4 — audit log
    logAdminAction({ adminId: req.user!.id, action: "plus.gift", targetId: req.body.userId, targetType: "user", note: req.body.note })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.get("/gift-plus/log", async (req, res, next) => {
  try {
    const result = await getGiftPlusLog({
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 20),
    })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.post("/gift-plus/:userId/revoke", async (req, res, next) => {
  try {
    const note = typeof req.body.note === "string" ? req.body.note : undefined
    const result = await revokePlus(getParam(req.params.userId, "user id"), note)
    // F4.4 — audit log
    logAdminAction({ adminId: req.user!.id, action: "plus.revoke", targetId: req.params.userId, targetType: "user", note })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.get("/reports", async (req, res, next) => {
  try {
    if (req.query.cursor) {
      const legacy = await getReports(getQueryString(req.query.cursor), Number(req.query.limit || 20))
      res.status(200).json(legacy)
      return
    }
    const result = await getReportsPage({
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 20),
      status: getQueryString(req.query.status),
    })
    res.status(200).json({ ...result, reports: result.data })
  } catch (error) {
    next(error)
  }
})

router.patch("/reports/:id", async (req, res, next) => {
  try {
    const action = typeof req.body.action === "string" ? req.body.action : ""
    const report = await resolveReport(getParam(req.params.id, "report id"), action)
    res.status(200).json(report)
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
    const auditAction = status === KYCStatus.APPROVED ? "kyc.approve" : status === KYCStatus.REJECTED ? "kyc.reject" : "kyc.needs_resubmit"
    logAdminAction({
      adminId: req.user!.id,
      action: auditAction,
      targetId: req.params.id,
      targetType: "kyc",
      note: typeof req.body.note === "string" ? req.body.note : undefined,
      meta: { status },
    })
    res.status(200).json({ application })
  } catch (error) {
    next(error)
  }
})

router.get("/listings", async (req, res, next) => {
  try {
    if (req.query.cursor) {
      const legacy = await getAdminListings(getQueryString(req.query.cursor), Number(req.query.limit || 20))
      res.status(200).json(legacy)
      return
    }
    const result = await getAdminListingsPage({
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 20),
      status: getQueryString(req.query.status),
      category: getQueryString(req.query.category),
      flagged: getQueryString(req.query.flagged),
      imageReview: getQueryString(req.query.imageReview),
      search: getQueryString(req.query.search),
    })
    res.status(200).json({ ...result, listings: result.data })
  } catch (error) {
    next(error)
  }
})

router.patch("/listings/:id", async (req, res, next) => {
  try {
    const status = typeof req.body.status === "string" ? req.body.status : ""
    const listing = await updateAdminListing(getParam(req.params.id, "listing id"), status)
    logAdminAction({
      adminId: req.user!.id,
      action: "listing.status_change",
      targetId: req.params.id,
      targetType: "listing",
      meta: { status: listing.status },
    })
    res.status(200).json(listing)
  } catch (error) {
    next(error)
  }
})

router.delete("/listings/:id", async (req, res, next) => {
  try {
    const result = await hardDeleteListing(getParam(req.params.id, "listing id"))
    // F4.4 — audit log
    logAdminAction({ adminId: req.user!.id, action: "listing.delete", targetId: req.params.id, targetType: "listing" })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.post("/listings/bulk", async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.filter((id: unknown): id is string => typeof id === "string") : []
    const action = typeof req.body.action === "string" ? req.body.action : ""
    const result = await bulkListingAction(ids, action)
    logAdminAction({
      adminId: req.user!.id,
      action: "listing.bulk_action",
      targetType: "listing",
      meta: { action, ids, result },
    })
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
    logAdminAction({
      adminId: req.user!.id,
      action: "listing.status_change",
      targetId: req.params.id,
      targetType: "listing",
      meta: { status: listing.status },
    })
    res.status(200).json(listing)
  } catch (error) {
    next(error)
  }
})

router.patch("/listings/:id/image-review", async (req, res, next) => {
  try {
    const status = req.body.status
    if (status !== "approved" && status !== "flagged") {
      throw createHttpError(400, "Invalid image review status")
    }
    const listing = await updateListingImageReviewStatus(getParam(req.params.id, "listing id"), status)
    logAdminAction({
      adminId: req.user!.id,
      action: "listing.image_review",
      targetId: req.params.id,
      targetType: "listing",
      meta: { status: listing.imageReviewStatus },
    })
    res.status(200).json(listing)
  } catch (error) {
    next(error)
  }
})

router.post("/listings/import", async (req, res, next) => {
  try {
    const body = importListingsSchema.parse(req.body) // F2.1 validate
    const result = await importListings(body.listings as unknown as Parameters<typeof importListings>[0])
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.get("/users", async (req, res, next) => {
  try {
    if (req.query.cursor) {
      const legacy = await getUsers(getQueryString(req.query.cursor), Number(req.query.limit || 20))
      res.status(200).json(legacy)
      return
    }
    const result = await getUsersPage({
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 20),
      search: getQueryString(req.query.search),
    })
    res.status(200).json({ ...result, users: result.data })
  } catch (error) {
    next(error)
  }
})

router.get("/users/search", async (req, res, next) => {
  try {
    const result = await searchGiftUsers(getQueryString(req.query.q))
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.get("/users/banned", async (_req, res, next) => {
  try {
    const result = await getBannedUsers()
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.get("/users/:id", async (req, res, next) => {
  try {
    const result = await getUserDetail(getParam(req.params.id, "user id"))
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.patch("/users/:id/ban", async (req, res, next) => {
  try {
    const reason = typeof req.body.reason === "string" ? req.body.reason : ""
    if (!reason.trim()) throw createHttpError(400, "reason is required")
    const duration = req.body.duration === null || req.body.duration === undefined ? null : Number(req.body.duration)
    const result = await banUser(getParam(req.params.id, "user id"), reason.trim(), duration)
    // F4.4 — audit log
    logAdminAction({ adminId: req.user!.id, action: "user.ban", targetId: req.params.id, targetType: "user", note: reason, meta: { duration } })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.patch("/users/:id/warn", async (req, res, next) => {
  try {
    const reason = typeof req.body.reason === "string" ? req.body.reason : ""
    if (!reason.trim()) throw createHttpError(400, "reason is required")
    const result = await warnUser(getParam(req.params.id, "user id"), reason.trim())
    // F4.4 — audit log
    logAdminAction({ adminId: req.user!.id, action: "user.warn", targetId: req.params.id, targetType: "user", note: reason })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.patch("/users/:id/unban", async (req, res, next) => {
  try {
    const result = await unbanUser(getParam(req.params.id, "user id"))
    // F4.4 — audit log
    logAdminAction({ adminId: req.user!.id, action: "user.unban", targetId: req.params.id, targetType: "user" })
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

router.get("/analytics", async (req, res, next) => {
  try {
    const result = await getAnalytics(getQueryString(req.query.period))
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.get("/featured", async (req, res, next) => {
  try {
    const result = await getFeaturedListings({
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 50),
    })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.post("/featured", async (req, res, next) => {
  try {
    if (!req.body.listingId || typeof req.body.listingId !== "string") {
      throw createHttpError(400, "listingId is required")
    }
    const result = await addFeaturedListing(req.body.listingId, req.user!.id)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
})

router.delete("/featured/:id", async (req, res, next) => {
  try {
    const result = await removeFeaturedListing(getParam(req.params.id, "featured id"))
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.get("/appeals", async (req, res, next) => {
  try {
    const result = await getAppeals({
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 50),
    })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.patch("/appeals/:id", async (req, res, next) => {
  try {
    const action = typeof req.body.action === "string" ? req.body.action : ""
    const result = await resolveAppeal(
      getParam(req.params.id, "appeal id"),
      action,
      typeof req.body.adminNote === "string" ? req.body.adminNote : undefined,
    )
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.get("/verifications", async (req, res, next) => {
  try {
    const result = await getVerificationRequests({
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 50),
    })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.patch("/verifications/:id", async (req, res, next) => {
  try {
    const action = typeof req.body.action === "string" ? req.body.action : ""
    const result = await resolveVerificationRequest(
      getParam(req.params.id, "verification id"),
      action,
      typeof req.body.adminNote === "string" ? req.body.adminNote : undefined,
    )
    // F4.4 — audit log: action is "approve" or "reject"
    const auditAction = action === "approve" ? "verification.approve" : "verification.reject"
    logAdminAction({ adminId: req.user!.id, action: auditAction, targetId: req.params.id, targetType: "verification", note: req.body.adminNote })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

export default router

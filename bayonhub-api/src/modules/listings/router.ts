import { Router, type RequestHandler } from "express"

import { optionalAuth, requireAuth } from "../../middleware/auth"
import { contactLimiter, postingLimiter, reportLimiter, uploadLimiter } from "../../middleware/rateLimiter"
import { upload } from "../../middleware/upload"
import {
  bumpListing,
  createLead,
  createListing,
  deleteListing,
  getFeaturedListings,
  getListing,
  getListingLocations,
  getListings,
  getMyListings,
  getRelated,
  getSavedListings,
  getSimilarListings,
  getUploadUrl,
  incrementView,
  markAsSold,
  publishDraft,
  reportListing,
  saveDraft,
  saveListing,
  searchListings,
  unsaveListing,
  updateListing,
  uploadImage,
  uploadLocal,
} from "./controller"

const router = Router()

const responseEnvelope: RequestHandler = (_req, res, next) => {
  const originalJson = res.json.bind(res)
  res.json = (body?: unknown) => {
    if (res.statusCode >= 400) {
      const errorBody = body && typeof body === "object" ? body as { message?: unknown; error?: unknown } : {}
      const message = typeof errorBody.message === "string"
        ? errorBody.message
        : typeof errorBody.error === "string"
          ? errorBody.error
          : "An error occurred"
      return originalJson({ error: true, message })
    }
    return originalJson({ data: body ?? null })
  }
  next()
}

router.use(responseEnvelope)

router.get("/", optionalAuth, getListings)
router.get("/search", searchListings)
router.get("/featured", getFeaturedListings)
router.get("/locations", getListingLocations)
router.get("/upload-url", requireAuth, getUploadUrl)
router.get("/mine", requireAuth, getMyListings)
router.get("/saved", requireAuth, getSavedListings)
router.post("/draft", requireAuth, postingLimiter, uploadLimiter, upload.array("images", 20), saveDraft)
router.post("/upload-image", requireAuth, uploadLimiter, upload.single("file"), uploadImage)
router.post("/upload-local", requireAuth, upload.single("file"), uploadLocal)
router.get("/:id/similar", getSimilarListings)
router.get("/:id/related", getRelated)
router.get("/:id", optionalAuth, getListing)
router.post("/", requireAuth, postingLimiter, uploadLimiter, upload.array("images", 20), createListing)
router.put("/:id", requireAuth, upload.array("images", 20), updateListing)
router.patch("/:id", requireAuth, upload.array("images", 20), updateListing)
router.patch("/:id/publish", requireAuth, publishDraft)
router.patch("/:id/sold", requireAuth, markAsSold)
router.post("/:id/bump", requireAuth, bumpListing)
router.delete("/:id", requireAuth, deleteListing)
router.post("/:id/report", optionalAuth, reportLimiter, reportListing)
router.post("/:id/lead", optionalAuth, contactLimiter, createLead)
router.post("/:id/save", requireAuth, saveListing)
router.delete("/:id/save", requireAuth, unsaveListing)
router.post("/:id/view", incrementView)

export default router

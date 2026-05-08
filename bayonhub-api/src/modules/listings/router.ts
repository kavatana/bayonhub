import { Router } from "express"

import { optionalAuth, requireAuth } from "../../middleware/auth"
import { contactLimiter, postingLimiter, uploadLimiter } from "../../middleware/rateLimiter"
import { upload } from "../../middleware/upload"
import {
  bumpListing,
  createLead,
  createListing,
  deleteListing,
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

router.get("/", optionalAuth, getListings)
router.get("/search", searchListings)
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
router.post("/:id/report", optionalAuth, reportListing)
router.post("/:id/lead", optionalAuth, contactLimiter, createLead)
router.post("/:id/save", requireAuth, saveListing)
router.delete("/:id/save", requireAuth, unsaveListing)
router.post("/:id/view", incrementView)

export default router

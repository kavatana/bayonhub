import { Router } from "express"

import { optionalAuth, requireAuth } from "../../middleware/auth"
import { contactLimiter, postingLimiter, uploadLimiter } from "../../middleware/rateLimiter"
import { upload } from "../../middleware/upload"
import {
  createLead,
  createListing,
  deleteListing,
  getListing,
  getListings,
  getRelated,
  getUploadUrl,
  reportListing,
  saveListing,
  unsaveListing,
  updateListing,
  uploadLocal,
} from "./controller"

const router = Router()

router.get("/", optionalAuth, getListings)
router.get("/upload-url", requireAuth, getUploadUrl)
router.post("/upload-local", requireAuth, upload.single("file"), uploadLocal)
router.get("/:id", optionalAuth, getListing)
router.post("/", requireAuth, postingLimiter, uploadLimiter, upload.array("images", 8), createListing)
router.put("/:id", requireAuth, upload.array("images", 8), updateListing)
router.delete("/:id", requireAuth, deleteListing)
router.post("/:id/report", requireAuth, reportListing)
router.post("/:id/lead", optionalAuth, contactLimiter, createLead)
router.post("/:id/save", requireAuth, saveListing)
router.delete("/:id/save", requireAuth, unsaveListing)
router.get("/:id/related", getRelated)

export default router

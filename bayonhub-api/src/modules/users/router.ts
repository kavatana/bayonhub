import { Router } from "express"

import { requireAuth } from "../../middleware/auth"
import { upload } from "../../middleware/upload"
import { validateMagicBytes } from "../../middleware/upload"
import {
  createTelegramConnectLink,
  followSeller,
  generateReferralCode,
  getFollowerSummary,
  getFollowing,
  getMe,
  getPublicUserProfile,
  getReferralSummary,
  getSavedListings,
  getSellerVerification,
  handleTelegramWebhook,
  submitAppeal,
  submitSellerVerification,
  unfollowSeller,
  updatePassword,
  updateProfile,
  uploadAvatar,
} from "./service"

const router = Router()

function getQueryString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

router.get("/me/saved", requireAuth, async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 20)
    const result = await getSavedListings(req.user!.id, getQueryString(req.query.cursor), limit)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.get("/me/referral", requireAuth, async (req, res, next) => {
  try {
    const result = await getReferralSummary(req.user!.id)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.post("/me/referral/generate", requireAuth, async (req, res, next) => {
  try {
    const result = await generateReferralCode(req.user!.id)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.get("/me/following", requireAuth, async (req, res, next) => {
  try {
    const result = await getFollowing(req.user!.id)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await getMe(req.user!.id)
    res.status(200).json(user)
  } catch (error) {
    next(error)
  }
})

router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await updateProfile(req.user!.id, req.body)
    res.status(200).json(user)
  } catch (error) {
    next(error)
  }
})

router.put("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await updateProfile(req.user!.id, req.body)
    res.status(200).json({ user })
  } catch (error) {
    next(error)
  }
})

router.patch("/me/password", requireAuth, async (req, res, next) => {
  try {
    const result = await updatePassword(
      req.user!.id,
      req.body.currentPassword || req.body.oldPassword,
      req.body.newPassword,
    )
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.put("/me/password", requireAuth, async (req, res, next) => {
  try {
    const result = await updatePassword(
      req.user!.id,
      req.body.currentPassword || req.body.oldPassword,
      req.body.newPassword,
    )
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.post("/me/avatar", requireAuth, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "File is required" })
      return
    }
    if (!(await validateMagicBytes(req.file.buffer, req.file.mimetype))) {
      res.status(400).json({ error: "Invalid image format" })
      return
    }
    const result = await uploadAvatar(req.user!.id, req.file)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
})

router.post(
  "/me/verify-seller",
  requireAuth,
  upload.fields([{ name: "idFront", maxCount: 1 }, { name: "idBack", maxCount: 1 }]),
  async (req, res, next) => {
    try {
      const files = req.files as { idFront?: Express.Multer.File[]; idBack?: Express.Multer.File[] }
      for (const file of [...(files.idFront || []), ...(files.idBack || [])]) {
        if (!(await validateMagicBytes(file.buffer, file.mimetype))) {
          res.status(400).json({ error: "Invalid image format" })
          return
        }
      }
      const result = await submitSellerVerification(req.user!.id, files)
      res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  },
)

router.get("/me/verify-seller", requireAuth, async (req, res, next) => {
  try {
    const result = await getSellerVerification(req.user!.id)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.post("/me/connect-telegram", requireAuth, async (req, res, next) => {
  try {
    const result = await createTelegramConnectLink(req.user!.id)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.post("/telegram-webhook", async (req, res, next) => {
  try {
    const result = await handleTelegramWebhook(req.body)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.post("/me/appeal", requireAuth, async (req, res, next) => {
  try {
    if (!req.body.reason || typeof req.body.reason !== "string") {
      res.status(400).json({ error: "reason is required" })
      return
    }
    const result = await submitAppeal(req.user!.id, req.body.reason)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
})

router.post("/:id/follow", requireAuth, async (req, res, next) => {
  try {
    const result = await followSeller(req.user!.id, getQueryString(req.params.id) || "")
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
})

router.delete("/:id/follow", requireAuth, async (req, res, next) => {
  try {
    const result = await unfollowSeller(req.user!.id, getQueryString(req.params.id) || "")
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.get("/:id/followers", async (req, res, next) => {
  try {
    const result = await getFollowerSummary(getQueryString(req.params.id) || "")
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.get("/:id", async (req, res, next) => {
  try {
    const result = await getPublicUserProfile(getQueryString(req.params.id) || "")
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

export default router

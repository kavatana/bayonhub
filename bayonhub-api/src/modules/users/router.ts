import { Router } from "express"

import { requireAuth } from "../../middleware/auth"
import { getSavedListings, updatePassword, updateProfile } from "./service"

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

router.put("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await updateProfile(req.user!.id, req.body)
    res.status(200).json({ user })
  } catch (error) {
    next(error)
  }
})

router.put("/me/password", requireAuth, async (req, res, next) => {
  try {
    const result = await updatePassword(req.user!.id, req.body.oldPassword, req.body.newPassword)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

export default router

import { Router } from "express"

import { requireAuth } from "../../middleware/auth"
import { getSellerAnalytics, getSellerListings, getSellerProfile } from "./service"

const router = Router()

function getParam(value: string | string[] | undefined): string {
  if (typeof value === "string" && value.length > 0) return value
  const error = new Error("Invalid seller id") as Error & { status: number }
  error.status = 400
  throw error
}

function getQueryString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

// Must be before /:id to avoid "me" being matched as a seller UUID
router.get("/me/analytics", requireAuth, async (req, res, next) => {
  try {
    const analytics = await getSellerAnalytics(req.user!.id)
    res.status(200).json(analytics)
  } catch (error) {
    next(error)
  }
})

router.get("/:id", async (req, res, next) => {
  try {
    const seller = await getSellerProfile(getParam(req.params.id))
    res.status(200).json(seller)
  } catch (error) {
    next(error)
  }
})

router.get("/:id/listings", async (req, res, next) => {
  try {
    const result = await getSellerListings(
      getParam(req.params.id),
      getQueryString(req.query.cursor),
      Number(req.query.limit || 20),
    )
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

export default router

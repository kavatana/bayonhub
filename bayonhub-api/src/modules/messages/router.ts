import { Router } from "express"

import { requireAuth } from "../../middleware/auth"
import { getConversations, getThread } from "./service"

const router = Router()

function getParam(value: string | string[] | undefined): string {
  if (typeof value === "string" && value.length > 0) return value
  const error = new Error("Invalid user id") as Error & { status: number }
  error.status = 400
  throw error
}

function getQueryString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

router.get("/conversations", requireAuth, async (req, res, next) => {
  try {
    const result = await getConversations(req.user!.id)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.get("/:userId", requireAuth, async (req, res, next) => {
  try {
    const result = await getThread(
      req.user!.id,
      getParam(req.params.userId),
      getQueryString(req.query.cursor),
      Number(req.query.limit || 50),
    )
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

export default router

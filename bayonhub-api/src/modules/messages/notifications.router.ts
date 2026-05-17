import { Router, type RequestHandler } from "express"

import { requireAuth } from "../../middleware/auth"
import { getVapidPublicKey, savePushSubscription } from "../../lib/push"
import { getUnreadCount } from "../messages/service"
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./notifications.service"

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

function queryNumber(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function routeId(value: unknown) {
  return typeof value === "string" ? value : ""
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const result = await getNotifications(req.user!.id, {
      page: queryNumber(req.query.page, 1),
      limit: queryNumber(req.query.limit, 20),
      unreadOnly: req.query.filter === "unread",
    })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

// GET /api/notifications/unread-count
router.get("/unread-count", requireAuth, async (req, res, next) => {
  try {
    const result = await getUnreadCount(req.user!.id)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.patch("/read-all", requireAuth, async (req, res, next) => {
  try {
    const result = await markAllNotificationsRead(req.user!.id)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

router.get("/vapid-public-key", requireAuth, async (_req, res) => {
  res.status(200).json({ publicKey: getVapidPublicKey() })
})

router.post("/subscribe", requireAuth, async (req, res, next) => {
  try {
    await savePushSubscription(req.user!.id, req.body)
    res.status(201).json({ success: true })
  } catch (error) {
    next(error)
  }
})

router.patch("/:id/read", requireAuth, async (req, res, next) => {
  try {
    const notification = await markNotificationRead(req.user!.id, routeId(req.params.id))
    res.status(200).json(notification)
  } catch (error) {
    next(error)
  }
})

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const result = await deleteNotification(req.user!.id, routeId(req.params.id))
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

export default router

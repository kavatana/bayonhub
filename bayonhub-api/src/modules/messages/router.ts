import { Router } from "express"

import { requireAuth } from "../../middleware/auth"
import {
  getOrCreateConversation,
  getMyConversations,
  getMessages,
  sendMessage,
  markAsRead,
} from "./service"

const router = Router()

function getRouteId(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || ""
  return value || ""
}

// POST /api/conversations — create or get existing conversation
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { listingId, sellerId } = req.body
    if (!sellerId) {
      res.status(400).json({ error: "sellerId is required" })
      return
    }
    const buyerId = req.user!.id
    if (buyerId === sellerId) {
      res.status(400).json({ error: "Cannot message yourself" })
      return
    }
    const conversation = await getOrCreateConversation(listingId || null, buyerId, sellerId)
    res.status(200).json(conversation)
  } catch (error) {
    next(error)
  }
})

// GET /api/conversations/mine — get all conversations for current user
router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const result = await getMyConversations(req.user!.id)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

// GET /api/conversations/:id/messages — get all messages in a conversation
router.get("/:id/messages", requireAuth, async (req, res, next) => {
  try {
    const conversationId = getRouteId(req.params.id)
    const result = await getMessages(conversationId, req.user!.id)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

// POST /api/conversations/:id/messages — send a message
router.post("/:id/messages", requireAuth, async (req, res, next) => {
  try {
    const conversationId = getRouteId(req.params.id)
    const { body } = req.body
    if (!body || typeof body !== "string" || body.trim().length === 0) {
      res.status(400).json({ error: "body is required" })
      return
    }
    if (body.length > 2000) {
      res.status(400).json({ error: "Message too long" })
      return
    }
    const message = await sendMessage(conversationId, req.user!.id, body.trim())
    res.status(201).json(message)
  } catch (error) {
    next(error)
  }
})

// PATCH /api/conversations/:id/read — mark all messages in conversation as read
router.patch("/:id/read", requireAuth, async (req, res, next) => {
  try {
    const conversationId = getRouteId(req.params.id)
    const result = await markAsRead(conversationId, req.user!.id)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

export default router

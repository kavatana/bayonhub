import jwt from "jsonwebtoken"
import type { Server, Socket } from "socket.io"

import { redis } from "../../config/redis"
import { prisma } from "../../lib/prisma"
import { notifyUser } from "./notifications.service"

export function registerSocketHandlers(io: Server): void {
  io.use((socket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie
      const token =
        socket.handshake.auth.token ||
        rawCookie?.match(/(?:^|;\s*)accessToken=([^;]+)/)?.[1]
      if (!token) return next(new Error("Unauthorized"))
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
      socket.data.userId = payload.userId
      next()
    } catch {
      next(new Error("Unauthorized"))
    }
  })

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string
    socket.join(`user:${userId}`)
    console.info(`[Socket] User ${userId} connected`)

    socket.on("message:send", async ({ conversationId, body }) => {
      if (!body || body.length > 1000) return
      const rateLimitKey = `msg:rate:${userId}`
      const count = await redis.incr(rateLimitKey)
      if (count === 1) await redis.expire(rateLimitKey, 60)
      if (count > 20) {
        socket.emit("error", { message: "Rate limit exceeded" })
        return
      }

      // Verify user is participant
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      })
      if (!conversation || (conversation.buyerId !== userId && conversation.sellerId !== userId)) {
        socket.emit("error", { message: "Not a participant" })
        return
      }

      const message = await prisma.message.create({
        data: { conversationId, senderId: userId, body },
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
        },
      })

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      })

      const receiverId = conversation.buyerId === userId ? conversation.sellerId : conversation.buyerId
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { telegramChatId: true },
      })
      const preview = body.length > 120 ? `${body.slice(0, 117)}...` : body
      void notifyUser({
        userId: receiverId,
        type: "message",
        title: "New message on BayonHub",
        body: preview,
        link: `/inbox/${conversationId}`,
        telegramChatId: receiver?.telegramChatId,
      })
      io.to(`user:${receiverId}`).emit("message:receive", message)
      socket.emit("message:sent", message)
    })

    socket.on("message:read", async ({ conversationId }) => {
      await prisma.message.updateMany({
        where: { conversationId, senderId: { not: userId }, read: false },
        data: { read: true },
      })
    })

    socket.on("message:typing", ({ conversationId }) => {
      // Find the other participant and notify them
      prisma.conversation.findUnique({ where: { id: conversationId } }).then((conv) => {
        if (!conv) return
        const receiverId = conv.buyerId === userId ? conv.sellerId : conv.buyerId
        io.to(`user:${receiverId}`).emit("message:typing", { senderId: userId, conversationId })
      })
    })

    socket.on("disconnect", () => {
      console.info(`[Socket] User ${userId} disconnected`)
    })
  })
}

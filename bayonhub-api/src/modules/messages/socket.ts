import jwt from "jsonwebtoken"
import type { Server, Socket } from "socket.io"

import { redis } from "../../config/redis"
import { prisma } from "../../lib/prisma"

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

    socket.on("message:send", async ({ receiverId, listingId, body }) => {
      if (!body || body.length > 1000) return
      const rateLimitKey = `msg:rate:${userId}`
      const count = await redis.incr(rateLimitKey)
      if (count === 1) await redis.expire(rateLimitKey, 60)
      if (count > 20) {
        socket.emit("error", { message: "Rate limit exceeded" })
        return
      }
      const message = await prisma.message.create({
        data: { senderId: userId, receiverId, listingId, body },
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
        },
      })
      io.to(`user:${receiverId}`).emit("message:receive", message)
      socket.emit("message:sent", message)
    })

    socket.on("message:read", async ({ messageId }) => {
      await prisma.message.updateMany({
        where: { id: messageId, receiverId: userId },
        data: { readAt: new Date() },
      })
      const message = await prisma.message.findUnique({ where: { id: messageId } })
      if (message) io.to(`user:${message.senderId}`).emit("message:read_receipt", { messageId })
    })

    socket.on("message:typing", ({ receiverId }) => {
      io.to(`user:${receiverId}`).emit("message:typing", { senderId: userId })
    })

    socket.on("disconnect", () => {
      console.info(`[Socket] User ${userId} disconnected`)
    })
  })
}

import type { RequestHandler } from "express"
import jwt from "jsonwebtoken"

import { prisma } from "../lib/prisma"

interface JWTPayload {
  userId: string
  role: string
  verificationTier: string
}

const AUTH_USER_SELECT = {
  id: true,
  role: true,
  verificationTier: true,
  isActive: true,
  isAdmin: true,
  banReason: true,
  bannedUntil: true,
  phoneVerified: true,
  isVerifiedSeller: true,
  lastSeen: true,
  responseRate: true,
  telegramChatId: true,
  email: true,
  name: true,
  phone: true,
  avatarUrl: true,
} as const

function touchLastSeen(userId: string) {
  void prisma.user.update({ where: { id: userId }, data: { lastSeen: new Date() } }).catch(() => null)
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const authorization = typeof req.headers.authorization === "string" ? req.headers.authorization : undefined
    const bearer = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined
    const token = req.cookies?.accessToken || bearer
    if (!token) return res.status(401).json({ error: "Unauthorized" })

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: AUTH_USER_SELECT,
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    req.user = user
    touchLastSeen(user.id)
    next()
  } catch {
    res.status(401).json({ error: "Invalid or expired token" })
  }
}

export const optionalAuth: RequestHandler = async (req, _res, next) => {
  try {
    const authorization = typeof req.headers.authorization === "string" ? req.headers.authorization : undefined
    const bearer = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined
    const token = req.cookies?.accessToken || bearer
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: AUTH_USER_SELECT,
      })
      if (user?.isActive) {
        req.user = user
        touchLastSeen(user.id)
      }
    }
  } catch {
    // Continue without auth.
  }
  next()
}

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" })
  next()
}

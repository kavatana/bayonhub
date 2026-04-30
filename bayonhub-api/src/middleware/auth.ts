import type { RequestHandler } from "express"
import jwt from "jsonwebtoken"

import { prisma } from "../lib/prisma"

interface JWTPayload {
  userId: string
  role: string
  verificationTier: string
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken
    if (!token) return res.status(401).json({ error: "Unauthorized" })

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, verificationTier: true, isActive: true },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    req.user = user
    next()
  } catch {
    res.status(401).json({ error: "Invalid or expired token" })
  }
}

export const optionalAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = req.cookies?.accessToken
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, role: true, verificationTier: true, isActive: true },
      })
      if (user?.isActive) req.user = user
    }
  } catch {
    // Continue without auth.
  }
  next()
}

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" })
  next()
}

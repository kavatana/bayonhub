import type { Request, RequestHandler } from "express"

import { env } from "../config/env"
import { redis } from "../config/redis"

let allowlistWarningLogged = false

function getRealClientIp(req: Request): string {
  return (
    (req.headers["cf-connecting-ip"] as string) ||
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
    req.ip ||
    ""
  )
}

function adminIpSet(): Set<string> {
  return new Set(
    env.adminIpAllowlist
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean),
  )
}

export const adminIpAllowlist: RequestHandler = (req, res, next) => {
  const allowedIps = adminIpSet()
  if (!allowedIps.size) {
    if (!allowlistWarningLogged) {
      allowlistWarningLogged = true
      console.warn("[admin] ADMIN_IP_ALLOWLIST is not set - admin routes are accessible from any IP")
    }
    next()
    return
  }

  const ip = getRealClientIp(req)
  if (!allowedIps.has(ip)) {
    console.warn(JSON.stringify({ event: "admin_ip_denied", ip }))
    res.status(403).json({ error: true, message: "Access denied" })
    return
  }
  next()
}

export const requireAdmin2FA: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: true, message: "Unauthorized" })
      return
    }
    const verified = await redis.get(`admin:2fa:${req.user.id}`)
    if (!verified) {
      res.status(403).json({ error: true, message: "Admin 2FA required" })
      return
    }
    next()
  } catch (error) {
    next(error)
  }
}

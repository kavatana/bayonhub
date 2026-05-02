import type { Request } from "express"
import rateLimit from "express-rate-limit"

function cloudflareKeyGenerator(req: Request): string {
  return (req.headers["cf-connecting-ip"] as string) ||
    (req.headers["x-forwarded-for"] as string) ||
    req.ip ||
    "unknown"
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: cloudflareKeyGenerator,
  message: { error: "Too many requests" },
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: cloudflareKeyGenerator,
  message: { error: "Too many auth attempts" },
})

export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  keyGenerator: cloudflareKeyGenerator,
  message: { error: "Too many OTP requests" },
})

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.id || cloudflareKeyGenerator(req),
  message: { error: "Upload limit reached" },
})

import type { Request, Response } from "express"
import rateLimit, { ipKeyGenerator } from "express-rate-limit"

function cloudflareKeyGenerator(req: Request): string {
  const ip = (req.headers["cf-connecting-ip"] as string) ||
    (req.headers["x-forwarded-for"] as string) ||
    req.ip ||
    "unknown"
  return ipKeyGenerator(ip)
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
  max: 10, // 10 req / 15 min
  keyGenerator: cloudflareKeyGenerator,
  message: { error: "Too many auth attempts" },
})

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5, // 5 req / hour
  keyGenerator: cloudflareKeyGenerator,
  message: { error: "Too many registration attempts" },
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
  keyGenerator: (req: Request, res: Response) => req.user?.id || cloudflareKeyGenerator(req),
  message: { error: "Upload limit reached" },
})

export const postingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 listings per hour per user
  keyGenerator: (req: Request, res: Response) => req.user?.id || cloudflareKeyGenerator(req),
  message: { error: "Too many listings posted. Please wait before posting again." },
})

export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 contact attempts per hour per user/IP
  keyGenerator: (req: Request, res: Response) => req.user?.id || cloudflareKeyGenerator(req),
  message: { error: "Too many contact attempts. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
})

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  keyGenerator: cloudflareKeyGenerator,
  message: { error: "Too many password reset attempts. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
})


import type { Request, Response, RequestHandler } from "express"
import rateLimit, { ipKeyGenerator } from "express-rate-limit"

import { redis } from "../config/redis"

const LOGIN_FAIL_TTL_SECONDS = 15 * 60
const MAX_FAILS_BEFORE_BLOCK = 20

function getClientIp(req: Request): string {
  return (
    (req.headers["cf-connecting-ip"] as string) ||
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
    req.ip ||
    "unknown"
  )
}

function cloudflareKeyGenerator(req: Request): string {
  return ipKeyGenerator(getClientIp(req))
}

function userOrIpKeyGenerator(req: Request): string {
  return req.user?.id || cloudflareKeyGenerator(req)
}

const abuseLimitMessage = {
  error: true,
  message: "Rate limit exceeded. Please try again later.",
}

/** Called by loginUser on a failed password attempt (F1.5) */
export async function recordLoginFailure(ip: string): Promise<void> {
  if (process.env.NODE_ENV === "development") return

  try {
    const key = `loginFail:${ip}`
    const attempts = await redis.incr(key)
    const ttl = await redis.ttl(key)
    if (ttl === -1) await redis.expire(key, LOGIN_FAIL_TTL_SECONDS)
    if (attempts >= MAX_FAILS_BEFORE_BLOCK) {
      console.log(`[SECURITY] IP login blocked: ${ip} at ${new Date().toISOString()} (${attempts} failed attempts)`)
    }
  } catch (error) {
    console.warn("[SECURITY] Failed to record login failure:", error)
  }
}

/** Called by loginUser on success to clear failure record */
export async function clearLoginFailures(ip: string): Promise<void> {
  try {
    await redis.del(`loginFail:${ip}`)
  } catch (error) {
    console.warn("[SECURITY] Failed to clear login failures:", error)
  }
}

/** Middleware that rejects blocked IPs before rate limiter runs (F1.5) */
export const ipBlockMiddleware: RequestHandler = async (req, res, next) => {
  if (process.env.NODE_ENV === "development") return next()

  try {
    const ip = getClientIp(req)
    const attempts = Number(await redis.get(`loginFail:${ip}`) || 0)
    if (attempts >= MAX_FAILS_BEFORE_BLOCK) {
      return res.status(429).json({
        error: "IP_BLOCKED",
        message: "Too many failed login attempts. Your IP has been temporarily blocked.",
      })
    }
    next()
  } catch (error) {
    console.warn("[SECURITY] Failed to check login block:", error)
    next()
  }
}

/** Export helper so login controller can extract IP (F1.5) */
export { getClientIp }

// F1.1 — Login rate limit: 5 attempts per 15 minutes per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: cloudflareKeyGenerator,
  message: {
    error: "TOO_MANY_ATTEMPTS",
    message: "Too many login attempts. Try again in 15 minutes.",
  },
})

// Legacy alias kept so other imports don't break
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: cloudflareKeyGenerator,
  message: { error: "Too many auth attempts" },
})

// F1.2 — OTP rate limit: 3 attempts per 10 minutes per IP
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: cloudflareKeyGenerator,
  message: {
    error: "OTP_RATE_LIMIT",
    message: "Too many attempts. Try again in 10 minutes.",
  },
})

export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: cloudflareKeyGenerator,
  message: abuseLimitMessage,
})

// F1.3 — Global API rate limit: 100 req/min per IP
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: cloudflareKeyGenerator,
  message: {
    error: "RATE_LIMIT",
    message: "Too many requests. Please slow down.",
  },
})

// F1.3 — Higher limit for read-heavy public listing routes: 300 req/min
export const publicListingsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: cloudflareKeyGenerator,
  message: {
    error: "RATE_LIMIT",
    message: "Too many requests. Please slow down.",
  },
})

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: cloudflareKeyGenerator,
  message: { error: "Too many registration attempts" },
})

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req: Request, _res: Response) => req.user?.id || cloudflareKeyGenerator(req),
  message: { error: "Upload limit reached" },
})

export const postingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req: Request, _res: Response) => req.user?.id || cloudflareKeyGenerator(req),
  message: { error: "Too many listings posted. Please wait before posting again." },
})

export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req: Request, _res: Response) => req.user?.id || cloudflareKeyGenerator(req),
  message: { error: "Too many contact attempts. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
})

export const conversationCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKeyGenerator,
  message: abuseLimitMessage,
})

export const messageSendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKeyGenerator,
  message: abuseLimitMessage,
})

export const paymentSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKeyGenerator,
  message: abuseLimitMessage,
})

export const khqrGenerateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKeyGenerator,
  message: abuseLimitMessage,
})

export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKeyGenerator,
  message: abuseLimitMessage,
})

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: cloudflareKeyGenerator,
  message: { error: "Too many password reset attempts. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
})

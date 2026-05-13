import type { Request, Response, RequestHandler } from "express"
import rateLimit, { ipKeyGenerator } from "express-rate-limit"

// In-memory store for tracking failed login attempts for IP auto-block (F1.5)
// Key: IP address, Value: { count, firstFailAt, blockedUntil? }
const loginFailStore = new Map<string, { count: number; firstFailAt: number; blockedUntil?: number }>()

const FAIL_WINDOW_MS = 60 * 60 * 1000    // 1 hour
const MAX_FAILS_BEFORE_BLOCK = 20
const BLOCK_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

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

/** Called by loginUser on a failed password attempt (F1.5) */
export function recordLoginFailure(ip: string): void {
  if (process.env.NODE_ENV === "development") return

  const now = Date.now()
  const entry = loginFailStore.get(ip)

  if (!entry) {
    loginFailStore.set(ip, { count: 1, firstFailAt: now })
    return
  }

  // Reset window if older than FAIL_WINDOW_MS
  if (now - entry.firstFailAt > FAIL_WINDOW_MS) {
    loginFailStore.set(ip, { count: 1, firstFailAt: now })
    return
  }

  entry.count += 1

  if (entry.count >= MAX_FAILS_BEFORE_BLOCK && !entry.blockedUntil) {
    entry.blockedUntil = now + BLOCK_DURATION_MS
    console.log(`[SECURITY] IP auto-blocked: ${ip} at ${new Date().toISOString()} (${entry.count} failed attempts)`)
  }
}

/** Called by loginUser on success to clear failure record */
export function clearLoginFailures(ip: string): void {
  loginFailStore.delete(ip)
}

/** Middleware that rejects blocked IPs before rate limiter runs (F1.5) */
export const ipBlockMiddleware: RequestHandler = (req, res, next) => {
  if (process.env.NODE_ENV === "development") return next()

  const ip = getClientIp(req)
  const entry = loginFailStore.get(ip)
  if (entry?.blockedUntil && entry.blockedUntil > Date.now()) {
    return res.status(429).json({
      error: "IP_BLOCKED",
      message: "Too many failed login attempts. Your IP has been blocked for 24 hours.",
    })
  }
  next()
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

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: cloudflareKeyGenerator,
  message: { error: "Too many password reset attempts. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
})


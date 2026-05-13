import crypto from "crypto"
import cookieParser from "cookie-parser"
import cors from "cors"
import express, { ErrorRequestHandler } from "express"
import passport from "passport"
import helmet from "helmet"
import morgan from "morgan"

import { env } from "./config/env"
import { redis } from "./config/redis"
import { prisma } from "./lib/prisma"
import adminRouter from "./modules/admin/router"
import authRouter from "./modules/auth/router"
import listingsRouter from "./modules/listings/router"
import kycRouter from "./modules/kyc/router"
import conversationsRouter from "./modules/messages/router"
import notificationsRouter from "./modules/messages/notifications.router"
import searchRouter from "./modules/search/router"
import sellersRouter from "./modules/sellers/router"
import usersRouter from "./modules/users/router"
import paymentsRouter from "./modules/payments/router"
import merchantRouter from "./modules/merchant/router"
import sitemapRouter from "./modules/sitemap/router"
import storefrontRouter from "./modules/storefront/router"
import statsRouter from "./modules/stats/router"
import { apiLimiter, publicListingsLimiter } from "./middleware/rateLimiter"
import { setCsrfCookie, verifyCsrfToken } from "./middleware/csrf"
import prerenderMiddleware from "./middleware/prerender"
import path from "path"
import fs from "fs"

export const app = express()
app.set("trust proxy", 1)

// F2.5 — Helmet with full security header suite
const IS_PROD = env.nodeEnv === "production"
app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: IS_PROD ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        // Allow inline scripts only via nonce — nonce middleware sets res.locals.cspNonce
        // GSAP CDN used by frontend (loaded client-side, not server-side)
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://media.bayonhub.com", "https://*.r2.cloudflarestorage.com"],
      connectSrc: ["'self'", env.frontendUrl],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: IS_PROD ? [] : null,
    },
  } : false,  // Disabled in dev for easier debugging
  // HTTP Strict Transport Security — 2 years, includeSubDomains
  hsts: IS_PROD ? {
    maxAge: 63_072_000, // 2 years in seconds
    includeSubDomains: true,
    preload: true,
  } : false,
  // Prevent MIME-type sniffing
  noSniff: true,
  // Don't expose Express in X-Powered-By
  hidePoweredBy: true,
  // Deny framing globally
  frameguard: { action: "deny" },
  // Referrer policy
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  // XSS filter (legacy browsers)
  xssFilter: true,
}))
app.use(prerenderMiddleware)

if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
      res.redirect(301, `https://${req.headers.host}${req.url}`)
      return
    }
    next()
  })
}

// F2.4 — CORS: strict whitelist — bayonhub.com + localhost only
const CORS_WHITELIST = new Set(
  [
    env.frontendUrl,                                  // e.g. https://bayonhub.com
    env.frontendUrl.endsWith("/")
      ? env.frontendUrl.slice(0, -1)
      : env.frontendUrl,
    IS_PROD ? null : "http://localhost:5173",          // Vite dev server
    IS_PROD ? null : "http://localhost:4173",          // Vite preview
    IS_PROD ? null : "http://127.0.0.1:5173",
  ].filter((v): v is string => v !== null && v.length > 0)
)

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no origin) e.g. webhooks, cron jobs
      if (!origin) return callback(null, true)
      if (CORS_WHITELIST.has(origin)) return callback(null, true)
      // Block everything else
      callback(new Error(`CORS: Origin ${origin} not allowed`))
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-XSRF-TOKEN"],
  }),
)
app.use(cookieParser())
app.use(passport.initialize())
app.use(setCsrfCookie)
app.use(verifyCsrfToken)
app.use("/api/payments/khqr/webhook", express.raw({ type: "application/json", limit: "10kb" }))
app.use((req, res, next) => {
  if (req.path === "/api/payments/khqr/webhook") {
    next()
    return
  }
  express.json({ limit: "10kb" })(req, res, next)
})

app.use((req, _res, next) => {
  req.headers["x-request-id"] =
    (req.headers["x-request-id"] as string) || crypto.randomUUID()
  next()
})

if (env.nodeEnv === "development") {
  app.use(morgan("dev"))
} else {
  app.use(morgan("combined", {
    skip: (_req, res) => res.statusCode < 400,
    stream: {
      write: (message: string) => console.log("[HTTP]", message.trim()),
    },
  }))
}

if (env.nodeEnv !== "production") {
  app.use("/uploads", express.static("public/uploads"))
}

// F1.3 — Exempt public listing read routes: 300 req/min (before global limiter)
app.use("/api/listings/featured", publicListingsLimiter)
app.get("/api/listings", publicListingsLimiter)
// Global API rate limit: 100 req/min
app.use("/api/", apiLimiter)
app.use("/api/auth", authRouter)
app.use("/api/listings", listingsRouter)
app.use("/api/kyc", kycRouter)
app.use("/api/search", searchRouter)
app.use("/api/users", usersRouter)
app.use("/api/sellers", sellersRouter)
app.use("/api/conversations", conversationsRouter)
app.use("/api/notifications", notificationsRouter)
app.use("/api", sitemapRouter)
app.use("/api/admin", adminRouter)
app.use("/api/payments", paymentsRouter)
app.use("/api/v1/merchant", merchantRouter)
app.use("/api/storefront", storefrontRouter)
app.use("/api", statsRouter)
app.use("/", sitemapRouter)

app.get("/health", async (_req, res) => {
  const startTime = Date.now()

  const dbStatus = await prisma.$queryRaw`SELECT 1`
    .then(() => "ok" as const)
    .catch((err: Error) => { console.error("[Health] DB error:", err.message); return "error" as const })

  const redisStatus = redis.status === "ready" ? "ok" as const :
    redis.status === "connecting" ? "connecting" as const : "error" as const

  const r2Status = process.env.R2_ACCOUNT_ID ? "configured" as const : "not_configured" as const
  const twilioStatus = process.env.TWILIO_ACCOUNT_SID
    ? (process.env.TWILIO_PHONE_NUMBER === "+855963131281" ? "misconfigured" as const : "configured" as const)
    : "not_configured" as const

  const overall = dbStatus === "ok" && redisStatus === "ok" ? "ok" as const : "degraded" as const

  res.status(overall === "ok" ? 200 : 503).json({
    status: overall,
    timestamp: new Date().toISOString(),
    responseMs: Date.now() - startTime,
    services: {
      database: dbStatus,
      redis: redisStatus,
      r2: r2Status,
      twilio: twilioStatus,
    },
    version: process.env.npm_package_version || "1.0.0",
  })
})

// Handle SPA routing in production
if (env.nodeEnv === "production") {
  const distPath = path.join(__dirname, "../../bayonhub-app/dist")
  app.use(express.static(distPath))
  
  app.get("*splat", (req, res, next) => {
    // Only serve index.html for non-API routes
    if (!req.path.startsWith("/api/")) {
      const indexPath = path.join(distPath, "index.html")
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath)
      }
    }
    next()
  })
}

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" })
})

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const uploadLimitStatus = err.code === "LIMIT_FILE_SIZE" ? 413 : undefined
  const uploadValidationStatus =
    typeof err.message === "string" && err.message.startsWith("File type ") ? 400 : undefined
  const status = uploadLimitStatus || uploadValidationStatus || err.status || err.statusCode || 500
  if (status === 500 && process.env.NODE_ENV === "production") {
    res.status(500).json({
      error: "SERVER_ERROR",
      message: "Something went wrong. Please try again.",
    })
    return
  }
  res.status(status).json({
    error: err.error || err.publicError || "ERROR",
    message: err.message || "An error occurred",
  })
}

app.use(errorHandler)

export default app

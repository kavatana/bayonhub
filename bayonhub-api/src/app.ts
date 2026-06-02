import crypto from "crypto"
import cookieParser from "cookie-parser"
import cors from "cors"
import express, { ErrorRequestHandler, Request } from "express"
import passport from "passport"
import helmet from "helmet"
import morgan from "morgan"

import { env } from "./config/env"
import { redis } from "./config/redis"
import { prisma } from "./lib/prisma"
import { testR2Connection } from "./lib/s3"
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
// CSRF Disabled for Cross-Origin SPA Bearer Auth
import prerenderMiddleware from "./middleware/prerender"
import path from "path"
import fs from "fs"

export const app = express()
app.set("trust proxy", 1)

const getReqId = (req: Request): string => {
  const requestId = (req as Request & { id?: string }).id ?? req.headers["x-request-id"] ?? ""
  return Array.isArray(requestId) ? requestId[0] || "" : String(requestId)
}

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
    env.frontendUrlWww,
    env.frontendUrlWww?.endsWith("/")
      ? env.frontendUrlWww.slice(0, -1)
      : env.frontendUrlWww,
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
// app.use(setCsrfCookie)
// app.use(verifyCsrfToken)
const ABA_WEBHOOK_PATHS = new Set(["/api/payments/aba-webhook", "/api/payments/khqr/webhook"])
app.use("/api/payments/aba-webhook", express.raw({ type: "*/*", limit: "10kb" }))
app.use("/api/payments/khqr/webhook", express.raw({ type: "*/*", limit: "10kb" }))
app.use((req, res, next) => {
  if (ABA_WEBHOOK_PATHS.has(req.path)) {
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

app.use((req, res, next) => {
  res.setHeader("X-Request-Id", getReqId(req))
  next()
})

app.use(morgan((tokens, req, res) => JSON.stringify({
  level: "http",
  requestId: getReqId(req as Request),
  method: tokens.method(req, res),
  path: tokens.url(req, res),
  status: Number(tokens.status(req, res)),
  ms: tokens["response-time"](req, res),
})))

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

const healthHandler = async (_req: Request, res: express.Response) => {
  const startTime = Date.now()

  const dbStatus = await prisma.$queryRaw`SELECT 1`
    .then(() => "ok" as const)
    .catch(() => "error" as const)

  const redisStatus = await redis.ping()
    .then(() => "ok" as const)
    .catch(() => "error" as const)

  const r2Status = await testR2Connection()
    .then((ok) => ok ? "ok" as const : "error" as const)
    .catch(() => "error" as const)

  const overall = dbStatus === "ok" && redisStatus === "ok" && r2Status === "ok" ? "ok" as const : "degraded" as const

  res.status(overall === "ok" ? 200 : 503).json({
    status: overall,
    db: dbStatus,
    redis: redisStatus,
    r2: r2Status,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    responseMs: Date.now() - startTime,
    version: process.env.npm_package_version || "1.0.0",
    csrfToken: res.locals.csrfToken,
  })
}

app.get("/health", healthHandler)
app.get("/api/health", healthHandler)

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

const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const uploadLimitStatus = err.code === "LIMIT_FILE_SIZE" ? 413 : undefined
  const uploadValidationStatus =
    typeof err.message === "string" && err.message.startsWith("File type ") ? 400 : undefined
  const status = uploadLimitStatus || uploadValidationStatus || err.status || err.statusCode || 500
  if (status === 500) {
    console.error(JSON.stringify({
      level: "error",
      requestId: getReqId(req),
      method: req.method,
      path: req.path,
      error: err.message,
      stack: err.stack,
    }))
  }
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

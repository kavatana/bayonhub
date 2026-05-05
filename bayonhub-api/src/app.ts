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
import messagesRouter from "./modules/messages/router"
import searchRouter from "./modules/search/router"
import sellersRouter from "./modules/sellers/router"
import usersRouter from "./modules/users/router"
import paymentsRouter from "./modules/payments/router"
import merchantRouter from "./modules/merchant/router"
import sitemapRouter from "./modules/sitemap/router"
import storefrontRouter from "./modules/storefront/router"
import statsRouter from "./modules/stats/router"
import { apiLimiter } from "./middleware/rateLimiter"
import { setCsrfCookie, verifyCsrfToken } from "./middleware/csrf"
import prerenderMiddleware from "./middleware/prerender"
import path from "path"
import fs from "fs"

export const app = express()
app.set("trust proxy", 1)

app.use(helmet({
  contentSecurityPolicy: false, // Prerender.io and some of our Three.js assets need flexibility
}))
app.use(prerenderMiddleware)
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        env.frontendUrl,
        env.frontendUrl.replace("https://", "https://www."),
        "http://localhost:5173",
        "http://localhost:4173",
      ].filter(Boolean)

      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        console.warn("[CORS] Blocked origin:", origin)
        callback(new Error(`CORS: Origin ${origin} not allowed`))
      }
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
app.use(express.json({ limit: "10kb" }))

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

app.use("/api/", apiLimiter)
app.use("/api/auth", authRouter)
app.use("/api/listings", listingsRouter)
app.use("/api/kyc", kycRouter)
app.use("/api/search", searchRouter)
app.use("/api/users", usersRouter)
app.use("/api/sellers", sellersRouter)
app.use("/api/messages", messagesRouter)
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
  const status = err.status || err.statusCode || 500
  const message =
    env.nodeEnv === "production" && status === 500
      ? "Internal server error"
      : err.message
  res.status(status).json({ error: message, code: err.code })
}

app.use(errorHandler)

export default app

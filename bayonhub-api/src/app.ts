import cookieParser from "cookie-parser"
import cors from "cors"
import express, { ErrorRequestHandler } from "express"
import helmet from "helmet"
import morgan from "morgan"

import { env } from "./config/env"
import { redis } from "./config/redis"
import { prisma } from "./lib/prisma"
import adminRouter from "./modules/admin/router"
import authRouter from "./modules/auth/router"
import listingsRouter from "./modules/listings/router"
import messagesRouter from "./modules/messages/router"
import searchRouter from "./modules/search/router"
import sellersRouter from "./modules/sellers/router"
import usersRouter from "./modules/users/router"
import paymentsRouter from "./modules/payments/router"
import { apiLimiter } from "./middleware/rateLimiter"

export const app = express()

app.use(helmet())
app.use(
  cors({
    origin: env.nodeEnv === "production" ? env.frontendUrl : ["http://localhost:5173", env.frontendUrl],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-XSRF-TOKEN"],
  }),
)
app.use(cookieParser())
app.use(express.json({ limit: "10kb" }))

if (env.nodeEnv === "development") app.use(morgan("dev"))

if (env.nodeEnv !== "production") {
  app.use("/uploads", express.static("public/uploads"))
}

app.use("/api/", apiLimiter)
app.use("/api/auth", authRouter)
app.use("/api/listings", listingsRouter)
app.use("/api/search", searchRouter)
app.use("/api/users", usersRouter)
app.use("/api/sellers", sellersRouter)
app.use("/api/messages", messagesRouter)
app.use("/api/admin", adminRouter)
app.use("/api/payments", paymentsRouter)

app.get("/health", async (_req, res) => {
  const dbStatus = await prisma.$queryRaw`SELECT 1`
    .then(() => "ok" as const)
    .catch(() => "error" as const)
  const redisStatus = redis.status === "ready" ? "ok" : "error"
  const status = dbStatus === "ok" && redisStatus === "ok" ? "ok" : "degraded"

  res.status(status === "ok" ? 200 : 503).json({
    status,
    ts: Date.now(),
    db: dbStatus,
    redis: redisStatus,
  })
})

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

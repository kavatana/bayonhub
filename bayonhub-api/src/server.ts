import http from "http"
import { Server as SocketServer } from "socket.io"

import { app } from "./app"
import { redis } from "./config/redis"
import { env } from "./config/env"
import { prisma } from "./lib/prisma"
import { registerSocketHandlers } from "./modules/messages/socket"
import { startScheduler, stopScheduler, type SchedulerHandles } from "./lib/scheduler"
import { testR2Connection } from "./lib/s3"
import { startListingExpiryJob, stopListingExpiryJob } from "./jobs/listingExpiry"

const PORT = parseInt(process.env.PORT || "4000")
const server = http.createServer(app)
const socketCorsOrigins = [
  env.frontendUrl,
  env.frontendUrl.endsWith("/") ? env.frontendUrl.slice(0, -1) : env.frontendUrl,
  env.frontendUrlWww,
  env.frontendUrlWww?.endsWith("/") ? env.frontendUrlWww.slice(0, -1) : env.frontendUrlWww,
  env.nodeEnv === "production" ? null : "http://localhost:5173",
  env.nodeEnv === "production" ? null : "http://localhost:4173",
  env.nodeEnv === "production" ? null : "http://127.0.0.1:5173",
].filter((origin): origin is string => Boolean(origin))
let schedulerHandles: SchedulerHandles | null = null
let shuttingDown = false

export const io = new SocketServer(server, {
  cors: {
    origin: socketCorsOrigins,
    credentials: true,
  },
})

registerSocketHandlers(io)

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return
  shuttingDown = true
  console.error(JSON.stringify({ level: "info", event: "shutdown", signal }))
  try {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => err ? reject(err) : resolve()),
    )
    stopScheduler(schedulerHandles)
    stopListingExpiryJob()
    await new Promise<void>((resolve) => io.close(() => resolve()))
    await prisma.$disconnect()
    if (redis.status !== "end") {
      await redis.quit().catch(() => undefined)
    }
    process.exit(0)
  } catch (error) {
    console.error(JSON.stringify({ level: "error", event: "shutdown_failed", error: String(error) }))
    process.exit(1)
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"))
process.on("SIGINT", () => void shutdown("SIGINT"))
process.on("unhandledRejection", (reason) => {
  console.error(JSON.stringify({ level: "error", event: "unhandledRejection", reason: String(reason) }))
})
process.on("uncaughtException", (err: Error) => {
  console.error(JSON.stringify({ level: "fatal", event: "uncaughtException", message: err.message, stack: err.stack }))
  process.exit(1)
})

async function start(): Promise<void> {
  await redis
    .connect()
    .catch(() =>
      console.warn("[Redis] Could not connect - OTP features will be unavailable"),
    )

  server.listen(PORT, async () => {
    console.info(`[Server] BayonHub API running on http://localhost:${PORT}`)
    if (!process.env.ADMIN_IP_ALLOWLIST) {
      console.warn("[admin] ADMIN_IP_ALLOWLIST is not set - admin routes accessible from any IP")
    }
    schedulerHandles = startScheduler()
    startListingExpiryJob()

    const r2Ok = await testR2Connection()
    if (!r2Ok && process.env.NODE_ENV === "production") {
      console.error("[R2] WARNING: Image uploads will fail in production")
    }

    if (
      process.env.NODE_ENV === "production" &&
      process.env.TWILIO_PHONE_NUMBER &&
      process.env.TWILIO_ACCOUNT_SID
    ) {
      console.warn("=".repeat(50))
      console.warn("[Twilio] PHONE_NUMBER configured:", process.env.TWILIO_PHONE_NUMBER)
      console.warn("[Twilio] Ensure this is a Twilio number, NOT your personal number")
      console.warn("=".repeat(50))
    }
  })
}

void start()

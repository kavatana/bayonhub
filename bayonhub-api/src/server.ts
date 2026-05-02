import http from "http"
import { Server as SocketServer } from "socket.io"

import { app } from "./app"
import { redis } from "./config/redis"
import { registerSocketHandlers } from "./modules/messages/socket"
import { startScheduler } from "./lib/scheduler"
import { testR2Connection } from "./lib/s3"

const PORT = parseInt(process.env.PORT || "4000")
const server = http.createServer(app)

export const io = new SocketServer(server, {
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
})

registerSocketHandlers(io)

async function start(): Promise<void> {
  await redis
    .connect()
    .catch(() =>
      console.warn("[Redis] Could not connect - OTP features will be unavailable"),
    )

  server.listen(PORT, async () => {
    console.info(`[Server] BayonHub API running on http://localhost:${PORT}`)
    startScheduler()

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

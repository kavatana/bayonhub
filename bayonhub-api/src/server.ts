import http from "http"
import { Server as SocketServer } from "socket.io"

import { app } from "./app"
import { redis } from "./config/redis"
import { registerSocketHandlers } from "./modules/messages/socket"
import { startScheduler } from "./lib/scheduler"

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

  server.listen(PORT, () => {
    console.info(`[Server] BayonHub API running on http://localhost:${PORT}`)
    startScheduler()
    
    if (process.env.NODE_ENV === "production" && !process.env.R2_ACCOUNT_ID) {
      console.error("=".repeat(60))
      console.error("FATAL: R2 not configured. Images will be lost on every deploy.")
      console.error("Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY")
      console.error("=".repeat(60))
    }
  })
}

void start()

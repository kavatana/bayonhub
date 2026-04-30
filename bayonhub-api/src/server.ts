import http from "http"
import { Server as SocketServer } from "socket.io"

import { app } from "./app"
import { redis } from "./config/redis"
import { registerSocketHandlers } from "./modules/messages/socket"

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
  })
}

void start()

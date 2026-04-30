import Redis from "ioredis"

export const redis = new Redis(process.env.REDIS_URL!, {
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  maxRetriesPerRequest: 3,
})

redis.on("error", (err) => console.warn("[Redis] Error:", err.message))
redis.on("connect", () => console.info("[Redis] Connected"))

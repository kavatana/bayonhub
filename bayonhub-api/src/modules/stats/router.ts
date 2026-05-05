// bayonhub-api/src/modules/stats/router.ts
import { Router } from "express"
import { prisma } from "../../lib/prisma"
import { redis } from "../../config/redis"
import { ListingStatus, VerificationTier } from "@prisma/client"

const router = Router()
const CACHE_KEY = "stats:platform"
const CACHE_TTL = 300 // 5 minutes

router.get("/stats", async (_req, res) => {
  try {
    const cached = await redis.get(CACHE_KEY).catch(() => null)
    if (cached) {
      res.setHeader("X-Stats-Cache", "HIT")
      return res.json(JSON.parse(cached))
    }

    const [totalListings, verifiedSellers, weeklyListings] = await Promise.all([
      prisma.listing.count({ where: { status: ListingStatus.ACTIVE } }),
      prisma.user.count({
        where: {
          verificationTier: { not: VerificationTier.NONE },
          isActive: true,
        },
      }),
      prisma.listing.count({
        where: {
          status: ListingStatus.ACTIVE,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ])

    const stats = { totalListings, verifiedSellers, weeklyListings, provincesCovered: 25 }
    await redis.set(CACHE_KEY, JSON.stringify(stats), "EX", CACHE_TTL).catch(() => null)

    res.setHeader("X-Stats-Cache", "MISS")
    res.json(stats)
  } catch (error) {
    console.error("[Stats] Error fetching stats:", error)
    res.json({ totalListings: 0, verifiedSellers: 0, weeklyListings: 0, provincesCovered: 25 })
  }
})

export default router

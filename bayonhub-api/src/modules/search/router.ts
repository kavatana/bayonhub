import { Router } from "express"

import { redis } from "../../config/redis"
import { prisma } from "../../lib/prisma"

const router = Router()

router.get("/suggestions", async (req, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : ""
    if (q.length < 2) {
      res.status(200).json([])
      return
    }

    const cacheKey = `search:suggest:${q.toLowerCase()}`
    const cached = await redis.get(cacheKey).catch(() => null)
    if (cached) {
      res.status(200).json(JSON.parse(cached))
      return
    }

    const matches = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM "Listing"
      WHERE (
        search_vector @@ websearch_to_tsquery('english', ${q})
        OR title % ${q}
        OR title ILIKE ${`%${q}%`}
      )
      AND status = 'ACTIVE'
      ORDER BY 
        ts_rank(search_vector, websearch_to_tsquery('english', ${q})) DESC,
        similarity(title, ${q}) DESC,
        "createdAt" DESC
      LIMIT 5
    `
    const ids = matches.map((match) => match.id)
    const listings =
      ids.length === 0
        ? []
        : await prisma.listing.findMany({
            where: { id: { in: ids } },
            select: {
              id: true,
              title: true,
              titleKm: true,
              categorySlug: true,
              images: { take: 1, orderBy: { order: "asc" } },
            },
          })
    const byId = new Map(listings.map((listing) => [listing.id, listing]))
    const suggestions = ids.map((id) => byId.get(id)).filter(Boolean)

    await redis.set(cacheKey, JSON.stringify(suggestions), "EX", 60).catch(() => null)
    res.status(200).json(suggestions)
  } catch (error) {
    next(error)
  }
})

export default router

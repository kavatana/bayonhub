import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const productionLike =
  process.env.NODE_ENV === "production" ||
  /railway|bayonhub\.com/i.test(process.env.DATABASE_URL || "")

type QueryPlanRow = { "QUERY PLAN": string }

const queries = [
  {
    name: "Homepage listing feed",
    sql: `SELECT id FROM "Listing" WHERE status = 'ACTIVE' AND "deletedAt" IS NULL ORDER BY promoted DESC, "createdAt" DESC LIMIT 20`,
  },
  {
    name: "Category listing feed",
    sql: `SELECT id FROM "Listing" WHERE status = 'ACTIVE' AND "deletedAt" IS NULL AND "categorySlug" = 'vehicles' ORDER BY "createdAt" DESC LIMIT 20`,
  },
  {
    name: "Province listing feed",
    sql: `SELECT id FROM "Listing" WHERE status = 'ACTIVE' AND "deletedAt" IS NULL AND province = 'Phnom Penh' ORDER BY "createdAt" DESC LIMIT 20`,
  },
  {
    name: "Search query",
    sql: `SELECT id FROM "Listing" WHERE status = 'ACTIVE' AND "deletedAt" IS NULL AND (title ILIKE '%phone%' OR description ILIKE '%phone%') ORDER BY "createdAt" DESC LIMIT 20`,
  },
  {
    name: "Seller listings",
    sql: `SELECT id FROM "Listing" WHERE "sellerId" = (SELECT id FROM "User" LIMIT 1) AND "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 20`,
  },
]

function executionMs(plan: string) {
  const match = plan.match(/Execution Time: ([0-9.]+) ms/)
  return match ? Number(match[1]) : null
}

function indexUsage(plan: string) {
  return /Index Scan|Bitmap Index Scan|Index Only Scan/i.test(plan) ? "INDEX" : "NO_INDEX"
}

async function main() {
  if (productionLike && process.env.ALLOW_PROD_EXPLAIN !== "true") {
    console.warn("SKIPPED perf check - production-like DATABASE_URL requires ALLOW_PROD_EXPLAIN=true")
    return
  }

  for (const query of queries) {
    const rows = await prisma.$queryRawUnsafe<QueryPlanRow[]>(`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${query.sql}`)
    const plan = rows.map((row) => row["QUERY PLAN"]).join("\n")
    const ms = executionMs(plan)
    const speed = ms != null && ms > 200 ? "SLOW" : "PASS"
    console.log(`${speed} ${query.name} - ${ms ?? "unknown"} ms - ${indexUsage(plan)}`)
  }
}

main()
  .catch((error) => {
    console.error("FAIL perf check", error instanceof Error ? error.message : "unexpected error")
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

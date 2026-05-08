// bayonhub-api/src/jobs/listingExpiry.ts
import cron from "node-cron"
import { prisma } from "../lib/prisma"
import { ListingStatus } from "@prisma/client"
import { notifyUser } from "../modules/messages/notifications.service"

async function runExpiryAndReminderJob(now: Date) {
  // 1. Archive listings where expiresAt has passed and they are still ACTIVE
  const { count: archivedCount } = await prisma.listing.updateMany({
    where: {
      status: ListingStatus.ACTIVE,
      expiresAt: { lte: now },
      deletedAt: null,
    },
    data: {
      status: ListingStatus.EXPIRED,
      archivedAt: now,
    },
  })

  if (archivedCount > 0) {
    console.info(`[Cron] Archived ${archivedCount} expired listings`)
  }

  // 2. Find listings expiring in the 3-day reminder window.
  const reminderStart = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
  const reminderEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const expiringSoon = await prisma.listing.findMany({
    where: {
      status: ListingStatus.ACTIVE,
      expiresAt: {
        gte: reminderStart,
        lte: reminderEnd,
      },
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      expiresAt: true,
      seller: { select: { id: true, telegramChatId: true } },
    },
  })

  if (expiringSoon.length > 0) {
    for (const listing of expiringSoon) {
      const body = `${listing.title} expires in 3 days. Relist to keep it active.`
      const recentReminder = await prisma.notification.findFirst({
        where: {
          userId: listing.seller.id,
          type: "expiry",
          body,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        select: { id: true },
      })
      if (recentReminder) continue
      await notifyUser({
        userId: listing.seller.id,
        type: "expiry",
        title: "Your listing expires soon",
        body,
        link: "/my-listings",
        telegramChatId: listing.seller.telegramChatId,
      })
    }
    console.info(`[Cron] Queued ${expiringSoon.length} listing expiry reminders`)
  }
}

async function runDailyDigestJob(now: Date) {
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const sellerViews = await prisma.listingView.groupBy({
    by: ["listingId"],
    where: { createdAt: { gte: yesterday, lt: now } },
    _count: { _all: true },
  })
  if (sellerViews.length === 0) return

  const listings = await prisma.listing.findMany({
    where: { id: { in: sellerViews.map((view) => view.listingId) }, status: ListingStatus.ACTIVE },
    select: {
      id: true,
      sellerId: true,
      seller: { select: { id: true, lastSeen: true, telegramChatId: true } },
    },
  })
  const viewsByListing = new Map(sellerViews.map((view) => [view.listingId, view._count._all]))
  const viewsBySeller = new Map<string, { views: number; lastSeen: Date | null; telegramChatId: string | null }>()
  for (const listing of listings) {
    const current = viewsBySeller.get(listing.sellerId) || {
      views: 0,
      lastSeen: listing.seller.lastSeen,
      telegramChatId: listing.seller.telegramChatId,
    }
    current.views += viewsByListing.get(listing.id) || 0
    viewsBySeller.set(listing.sellerId, current)
  }

  for (const [sellerId, summary] of viewsBySeller.entries()) {
    if (summary.views <= 0) continue
    if (summary.lastSeen && summary.lastSeen > yesterday) continue
    const existingDigest = await prisma.notification.findFirst({
      where: {
        userId: sellerId,
        type: "digest",
        createdAt: { gte: yesterday },
      },
      select: { id: true },
    })
    if (existingDigest) continue
    await notifyUser({
      userId: sellerId,
      type: "digest",
      title: `Your listings got ${summary.views} views yesterday`,
      body: "Keep your listings fresh to attract more buyers.",
      link: "/my-listings",
      telegramChatId: summary.telegramChatId,
    })
  }
}

export function startListingExpiryJob(): void {
  // Run daily at 01:00 Asia/Phnom_Penh (UTC+7 = 18:00 UTC previous day)
  cron.schedule(
    "0 18 * * *",
    async () => {
      const now = new Date()
      console.info("[Cron] Running listing expiry job at", now.toISOString())

      try {
        await runExpiryAndReminderJob(now)
      } catch (error) {
        console.error("[Cron] Listing expiry job failed:", error)
      }
    },
    { timezone: "UTC" },
  )

  console.info("[Cron] Listing expiry job scheduled (daily 01:00 ICT)")

  // Run daily digest at 08:00 Asia/Phnom_Penh (UTC+7 = 01:00 UTC).
  cron.schedule(
    "0 1 * * *",
    async () => {
      const now = new Date()
      console.info("[Cron] Running daily digest job at", now.toISOString())
      try {
        await runDailyDigestJob(now)
      } catch (error) {
        console.error("[Cron] Daily digest job failed:", error)
      }
    },
    { timezone: "UTC" },
  )

  console.info("[Cron] Daily digest job scheduled (daily 08:00 ICT)")
}

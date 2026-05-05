// bayonhub-api/src/jobs/listingExpiry.ts
import cron from "node-cron"
import { prisma } from "../lib/prisma"
import { ListingStatus } from "@prisma/client"

const RENEWAL_REMINDER_DAYS = 3

export function startListingExpiryJob(): void {
  // Run daily at 01:00 Asia/Phnom_Penh (UTC+7 = 18:00 UTC previous day)
  cron.schedule(
    "0 18 * * *",
    async () => {
      const now = new Date()
      console.info("[Cron] Running listing expiry job at", now.toISOString())

      try {
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

        // 2. Find listings expiring within RENEWAL_REMINDER_DAYS days for notification
        const reminderThreshold = new Date(
          now.getTime() + RENEWAL_REMINDER_DAYS * 24 * 60 * 60 * 1000,
        )
        const expiringSoon = await prisma.listing.findMany({
          where: {
            status: ListingStatus.ACTIVE,
            expiresAt: {
              gte: now,
              lte: reminderThreshold,
            },
            deletedAt: null,
          },
          select: {
            id: true,
            title: true,
            expiresAt: true,
            seller: { select: { id: true, phone: true, email: true, name: true } },
          },
        })

        if (expiringSoon.length > 0) {
          console.info(
            `[Cron] ${expiringSoon.length} listings expiring within ${RENEWAL_REMINDER_DAYS} days — queued for renewal reminders`,
          )
          // TODO: integrate with SMS/email notification service once Twilio is connected
          // expiringSoon.forEach(listing => sendRenewalReminder(listing))
        }
      } catch (error) {
        console.error("[Cron] Listing expiry job failed:", error)
      }
    },
    { timezone: "UTC" },
  )

  console.info("[Cron] Listing expiry job scheduled (daily 01:00 ICT)")
}

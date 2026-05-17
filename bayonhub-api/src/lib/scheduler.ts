import cron from "node-cron"
import { KYCStatus, ListingStatus, PaymentStatus } from "@prisma/client"
import { prisma } from "./prisma"
import { deleteFromR2 } from "./s3"
import { notifyUser } from "../modules/messages/notifications.service"

export type SchedulerHandles = {
  listingExpiry: ReturnType<typeof cron.schedule>
  paymentExpiry: NodeJS.Timeout
  refreshTokenCleanup: NodeJS.Timeout
  promotionCleanup: NodeJS.Timeout
  plusSubscriptionNotifications: ReturnType<typeof cron.schedule>
  kycRetentionCleanup: ReturnType<typeof cron.schedule>
}

export function startScheduler(): SchedulerHandles {
  console.info("[Scheduler] Starting background tasks...")

  const listingExpiry = cron.schedule("*/30 * * * *", async () => {
    try {
      const result = await prisma.listing.updateMany({
        where: {
          status: ListingStatus.ACTIVE,
          expiresAt: { lt: new Date() },
        },
        data: { status: ListingStatus.EXPIRED },
      })
      if (result.count > 0) {
        console.info(`[Scheduler] Expired ${result.count} listings`)
      }
    } catch (err) {
      console.error("[Scheduler] Expiry job failed:", err)
    }
  })
  
  // Every 5 minutes: Expire old pending payments
  const paymentExpiry = setInterval(async () => {
    try {
      const expiredResult = await prisma.payment.updateMany({
        where: {
          status: PaymentStatus.PENDING,
          expiresAt: { lt: new Date() }
        },
        data: { status: PaymentStatus.EXPIRED }
      })
      if (expiredResult.count > 0) {
        console.info(`[Scheduler] Expired ${expiredResult.count} pending payments`)
      }
    } catch (error) {
      console.error("[Scheduler] Payment expiry task failed:", error)
    }
  }, 5 * 60 * 1000)

  // Every 24 hours: Delete expired refresh tokens
  const refreshTokenCleanup = setInterval(async () => {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      })
      if (result.count > 0) {
        console.info(`[Scheduler] Deleted ${result.count} expired refresh tokens`)
      }
    } catch (error) {
      console.error("[Scheduler] Refresh token cleanup task failed:", error)
    }
  }, 24 * 60 * 60 * 1000)

  // Every 12 hours: Deactivate expired promotions
  // We run this more frequently than 24h to catch expirations closer to their actual time
  const promotionCleanup = setInterval(async () => {
    try {
      const now = new Date()
      const expiredListings = await prisma.listing.findMany({
        where: {
          promoted: true,
          promotedUntil: { lt: now }
        },
        select: { id: true }
      })
      
      if (expiredListings.length > 0) {
        const ids = expiredListings.map(l => l.id)
        await prisma.listing.updateMany({
          where: { id: { in: ids } },
          data: { promoted: false, promotedUntil: null }
        })
        console.info(`[Scheduler] Deactivated ${ids.length} expired promotions`)
      }
    } catch (error) {
      console.error("[Scheduler] Promotion cleanup task failed:", error)
    }
  }, 12 * 60 * 60 * 1000)

  const plusSubscriptionNotifications = cron.schedule("0 2 * * *", async () => {
    try {
      const now = new Date()
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      const expiringSoon = await prisma.user.findMany({
        where: {
          plusUntil: { gte: now, lte: threeDaysFromNow },
          plusExpiringNotifiedAt: null,
        },
        select: { id: true, plusUntil: true, telegramChatId: true },
      })
      for (const user of expiringSoon) {
        if (!user.plusUntil) continue
        await notifyUser({
          userId: user.id,
          title: "Your Plus subscription expires soon",
          body: `Expires on ${user.plusUntil.toLocaleDateString()}`,
          type: "PLUS_EXPIRING_SOON",
          link: "/upgrade",
          telegramChatId: user.telegramChatId,
        })
        await prisma.user.update({
          where: { id: user.id },
          data: { plusExpiringNotifiedAt: now },
        })
      }

      const expired = await prisma.user.findMany({
        where: {
          plusUntil: { lt: now },
          plusExpiredNotifiedAt: null,
        },
        select: { id: true, telegramChatId: true },
      })
      for (const user of expired) {
        await notifyUser({
          userId: user.id,
          title: "Your Plus subscription has expired",
          body: "Renew to restore your Plus features.",
          type: "PLUS_EXPIRED",
          link: "/upgrade",
          telegramChatId: user.telegramChatId,
        })
        await prisma.user.update({
          where: { id: user.id },
          data: { plusExpiredNotifiedAt: now },
        })
      }
    } catch (error) {
      console.error("[Scheduler] Plus subscription notification task failed:", error)
    }
  }, { timezone: "UTC" })

  // KYC RETENTION POLICY:
  // Rejected docs: retained 30 days then R2 objects deleted
  // Approved docs: retained until account deletion
  // Resubmitted: old docs deleted after new upload succeeds
  const kycRetentionCleanup = cron.schedule("30 2 * * *", async () => {
    try {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const applications = await prisma.kYCApplication.findMany({
        where: {
          status: KYCStatus.REJECTED,
          updatedAt: { lt: cutoff },
        },
        select: { id: true, idFrontKey: true, idBackKey: true, selfieKey: true },
      })
      let deleted = 0
      let errors = 0
      for (const application of applications) {
        try {
          await Promise.all(
            [application.idFrontKey, application.idBackKey, application.selfieKey]
              .filter((key): key is string => Boolean(key))
              .map((key) => deleteFromR2(key)),
          )
          await prisma.kYCApplication.delete({ where: { id: application.id } })
          deleted += 1
        } catch (error) {
          errors += 1
          console.error({ event: "kyc_cleanup_error", applicationId: application.id, error })
        }
      }
      console.info(JSON.stringify({ event: "kyc_cleanup", deleted, errors }))
    } catch (error) {
      console.error("[Scheduler] KYC cleanup task failed:", error)
    }
  }, { timezone: "UTC" })

  return {
    listingExpiry,
    paymentExpiry,
    refreshTokenCleanup,
    promotionCleanup,
    plusSubscriptionNotifications,
    kycRetentionCleanup,
  }
}

export function stopScheduler(handles?: SchedulerHandles | null): void {
  if (!handles) return
  handles.listingExpiry.stop()
  clearInterval(handles.paymentExpiry)
  clearInterval(handles.refreshTokenCleanup)
  clearInterval(handles.promotionCleanup)
  handles.plusSubscriptionNotifications.stop()
  handles.kycRetentionCleanup.stop()
}

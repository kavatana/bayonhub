import { PaymentStatus } from "@prisma/client"
import { prisma } from "./prisma"

export function startScheduler() {
  console.info("[Scheduler] Starting background tasks...")
  
  // Every 5 minutes: Expire old pending payments
  setInterval(async () => {
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

  // Every 12 hours: Deactivate expired promotions
  // We run this more frequently than 24h to catch expirations closer to their actual time
  setInterval(async () => {
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
}

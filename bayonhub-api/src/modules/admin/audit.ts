/**
 * F4.4 — Admin Audit Log
 *
 * logAdminAction() records every sensitive admin operation to the database.
 * All writes are fire-and-forget (errors are swallowed so they never block
 * the actual admin action). If AdminAuditLog is not in the Prisma schema yet,
 * logs are written to console.warn as a fallback until the migration runs.
 *
 * Call this AFTER the action has succeeded so failed operations are not logged
 * as completed.
 */
import { prisma } from "../../lib/prisma"

export type AdminAuditAction =
  | "payment.approve"
  | "payment.reject"
  | "plus.gift"
  | "plus.revoke"
  | "verification.approve"
  | "verification.reject"
  | "kyc.approve"
  | "kyc.reject"
  | "listing.delete"
  | "listing.status_change"
  | "user.ban"
  | "user.warn"
  | "user.unban"
  | "user.role_change"
  | "report.resolve"
  | "appeal.resolve"

export interface AdminAuditEntry {
  adminId: string
  action: AdminAuditAction
  targetId?: string      // e.g. userId, listingId, paymentId
  targetType?: string    // e.g. "user", "listing", "payment"
  note?: string          // reason / review note / extra context
  meta?: Record<string, unknown>  // arbitrary JSON payload
}

export async function logAdminAction(entry: AdminAuditEntry): Promise<void> {
  try {
    // Attempt to write to the AdminAuditLog table (requires Prisma migration).
    // If the model doesn't exist yet, fall through to the console fallback.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = (prisma as any).adminAuditLog
    if (model && typeof model.create === "function") {
      await model.create({
        data: {
          adminId: entry.adminId,
          action: entry.action,
          targetId: entry.targetId ?? null,
          targetType: entry.targetType ?? null,
          note: entry.note ?? null,
          meta: entry.meta ?? undefined,
        },
      })
      return
    }
  } catch {
    // Table not yet migrated — fall through to console fallback
  }

  // Fallback: structured console log so logs are still captured by log aggregators
  console.info("[ADMIN_AUDIT]", JSON.stringify({
    timestamp: new Date().toISOString(),
    adminId: entry.adminId,
    action: entry.action,
    targetId: entry.targetId,
    targetType: entry.targetType,
    note: entry.note,
    meta: entry.meta,
  }))
}

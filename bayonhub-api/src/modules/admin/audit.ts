/**
 * F4.4 — Admin Audit Log
 *
 * logAdminAction() records every sensitive admin operation to the database.
 * All writes are fire-and-forget (errors are swallowed so they never block
 * the actual admin action). If the database write fails, logs are written to
 * console as a fallback.
 *
 * Call this AFTER the action has succeeded so failed operations are not logged
 * as completed.
 */
import { prisma } from "../../lib/prisma"

export type AdminAuditAction =
  | "payment.approve"
  | "payment.reject"
  | "payment.refund"
  | "plus.gift"
  | "plus.revoke"
  | "verification.approve"
  | "verification.reject"
  | "kyc.approve"
  | "kyc.reject"
  | "kyc.needs_resubmit"
  | "listing.delete"
  | "listing.status_change"
  | "listing.bulk_action"
  | "listing.image_review"
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
    const meta = {
      ...(entry.meta ?? {}),
      ...(entry.note ? { note: entry.note } : {}),
    }
    await prisma.adminAuditLog.create({
      data: {
        adminId: entry.adminId,
        action: entry.action,
        targetId: entry.targetId ?? null,
        targetType: entry.targetType ?? null,
        meta: Object.keys(meta).length ? meta : undefined,
      },
    })
    return
  } catch {
    // Fall through to console fallback
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

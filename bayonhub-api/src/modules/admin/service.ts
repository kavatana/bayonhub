import { randomUUID } from "crypto"
import bcrypt from "bcryptjs"
import { KYCStatus, ListingStatus, PaymentStatus, Prisma, ReportStatus, Role, VerificationTier } from "@prisma/client"

import { env } from "../../config/env"
import { prisma } from "../../lib/prisma"
import { processAndUpload } from "../../lib/s3"
import { generateUniqueSlug } from "../../lib/slug"
import { sendTelegramMessage } from "../../lib/telegram"
import { SAFE_USER_SELECT } from "../auth/service"
import { createNotification } from "../messages/notifications.service"

export interface ImportListing {
  title: string
  titleKm?: string
  description: string
  price: number
  currency: "USD" | "KHR"
  categorySlug: string
  subcategorySlug?: string
  province: string
  district?: string
  condition: string
  images: string[]
  sellerName: string
  sellerPhone: string
  facets?: Record<string, unknown>
}

function todayStart(): Date {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function daysAgoStart(days: number): Date {
  const date = todayStart()
  date.setDate(date.getDate() - (days - 1))
  return date
}

function toListingStatus(value: string): ListingStatus {
  const normalized = value.trim().toUpperCase()
  if (normalized === "ACTIVE" || normalized === "APPROVE" || normalized === "APPROVED") return ListingStatus.ACTIVE
  if (normalized === "REJECTED" || normalized === "REJECT") return ListingStatus.REJECTED
  if (normalized === "DELETED" || normalized === "DELETE") return ListingStatus.DELETED
  if (normalized === "FLAGGED") return ListingStatus.FLAGGED
  if (normalized === "HIDDEN") return ListingStatus.HIDDEN
  if (Object.values(ListingStatus).includes(normalized as ListingStatus)) return normalized as ListingStatus
  throw new Error("Invalid listing status")
}

function periodDays(period?: string): number {
  if (period === "30d") return 30
  if (period === "90d") return 90
  return 7
}

function createHttpError(status: number, message: string): Error & { status: number } {
  const error = new Error(message) as Error & { status: number }
  error.status = status
  return error
}

function addMonths(base: Date, months: number) {
  const date = new Date(base)
  date.setMonth(date.getMonth() + months)
  return date
}

function isPlusActive(user: { isLifetimePlus?: boolean | null; plusUntil?: Date | null }) {
  return Boolean(user.isLifetimePlus || (user.plusUntil && user.plusUntil > new Date()))
}

function normalizePaymentStatus(status?: string): PaymentStatus | undefined {
  const upper = status?.trim().toUpperCase()
  if (!upper) return undefined
  if (upper === PaymentStatus.PENDING || upper === PaymentStatus.APPROVED || upper === PaymentStatus.REJECTED) {
    return upper
  }
  return undefined
}

function dayKey(date: Date | string): string {
  return new Date(date).toISOString().slice(0, 10)
}

function denseDailySeries(
  start: Date,
  days: number,
  rows: { day: Date | string; count: number | bigint }[],
) {
  const counts = new Map(rows.map((row) => [dayKey(row.day), Number(row.count)]))
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const day = dayKey(date)
    return { day, count: counts.get(day) || 0 }
  })
}

async function hardDeleteListingById(id: string) {
  await prisma.$transaction([
    prisma.listingPromotion.deleteMany({ where: { listingId: id } }),
    prisma.payment.updateMany({ where: { listingId: id }, data: { listingId: null } }),
    prisma.lead.deleteMany({ where: { listingId: id } }),
    prisma.report.deleteMany({ where: { listingId: id } }),
    prisma.listing.delete({ where: { id } }),
  ])
  return { success: true }
}

export async function getDashboard() {
  const start = todayStart()
  const [
    totalUsers,
    newUsersToday,
    totalListings,
    activeListings,
    newListingsToday,
    totalReports,
    pendingReports,
    activeRefreshTokens,
    topCategories,
    recentReports,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: start } } }),
    prisma.listing.count(),
    prisma.listing.count({ where: { status: ListingStatus.ACTIVE } }),
    prisma.listing.count({ where: { createdAt: { gte: start } } }),
    prisma.report.count(),
    prisma.report.count({ where: { status: ReportStatus.PENDING } }),
    prisma.refreshToken.findMany({
      where: { createdAt: { gte: start } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.listing.groupBy({
      by: ["categorySlug"],
      where: { status: ListingStatus.ACTIVE },
      _count: { categorySlug: true },
      orderBy: { _count: { categorySlug: "desc" } },
      take: 8,
    }),
    prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        listing: { select: { id: true, title: true, slug: true, status: true, price: true, currency: true } },
        reporter: { select: SAFE_USER_SELECT },
      },
    }),
  ])

  return {
    stats: {
      totalUsers,
      newUsersToday,
      totalListings,
      activeListings,
      newListingsToday,
      totalReports,
      pendingReports,
      dau: activeRefreshTokens.length,
    },
    topCategories: topCategories.map((item) => ({
      categoryId: item.categorySlug,
      count: item._count.categorySlug,
    })),
    recentReports,
  }
}

export async function getAdminPayments(filters: { status?: string; page?: number; limit?: number }) {
  const page = Math.max(1, filters.page || 1)
  const limit = Math.min(Math.max(1, filters.limit || 20), 50)
  const status = normalizePaymentStatus(filters.status)
  const where: Prisma.PaymentWhereInput = {
    screenshotUrl: { not: null },
    ...(status ? { status } : {}),
  }
  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: SAFE_USER_SELECT },
      },
    }),
    prisma.payment.count({ where }),
  ])
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  }
}

export async function approvePayment(id: string, adminId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { user: { select: SAFE_USER_SELECT } },
  })
  if (!payment) throw createHttpError(404, "Payment not found")
  if (!payment.screenshotUrl) throw createHttpError(400, "Payment is not a Plus receipt submission")
  if (payment.status !== PaymentStatus.PENDING) throw createHttpError(409, "Payment already reviewed")

  const now = new Date()
  const currentPlusUntil = payment.user.plusUntil && payment.user.plusUntil > now ? payment.user.plusUntil : now
  const plusUntil = addMonths(currentPlusUntil, 1)
  const updated = await prisma.$transaction(async (tx) => {
    const reviewedPayment = await tx.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.APPROVED,
        reviewedBy: adminId,
        reviewedAt: now,
        paidAt: now,
      },
      include: { user: { select: SAFE_USER_SELECT } },
    })
    await tx.user.update({
      where: { id: payment.userId },
      data: { plusUntil },
    })
    await tx.notification.create({
      data: {
        userId: payment.userId,
        type: "plus_activated",
        title: "You're now a Plus member!",
        body: `Your Plus membership is active until ${plusUntil.toISOString().slice(0, 10)}.`,
        link: "/account",
      },
    })
    return reviewedPayment
  })

  await sendTelegramMessage(
    payment.user.telegramChatId,
    `✅ You're now BayonHub Plus! Active until ${plusUntil.toISOString().slice(0, 10)}.`,
    `${env.frontendUrl}/account`,
  )
  return { payment: updated, plusUntil }
}

export async function rejectPayment(id: string, adminId: string, reviewNote: string) {
  if (!reviewNote.trim()) throw createHttpError(400, "reviewNote is required")
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { user: { select: SAFE_USER_SELECT } },
  })
  if (!payment) throw createHttpError(404, "Payment not found")
  if (!payment.screenshotUrl) throw createHttpError(400, "Payment is not a Plus receipt submission")
  if (payment.status !== PaymentStatus.PENDING) throw createHttpError(409, "Payment already reviewed")

  const updated = await prisma.payment.update({
    where: { id },
    data: {
      status: PaymentStatus.REJECTED,
      reviewNote: reviewNote.trim(),
      reviewedBy: adminId,
      reviewedAt: new Date(),
    },
    include: { user: { select: SAFE_USER_SELECT } },
  })
  await createNotification({
    userId: payment.userId,
    type: "plus_rejected",
    title: "Payment not confirmed",
    body: `We couldn't confirm your payment. Reason: ${reviewNote.trim()}. Please resubmit.`,
    link: "/upgrade",
  })
  await sendTelegramMessage(
    payment.user.telegramChatId,
    `Payment not confirmed.\nReason: ${reviewNote.trim()}\nPlease resubmit your Plus payment receipt.`,
    `${env.frontendUrl}/upgrade`,
  )
  return { payment: updated }
}

export async function getAdminListingsPage(filters: {
  page?: number
  limit?: number
  status?: string
  category?: string
  flagged?: string
  search?: string
}) {
  const page = Math.max(1, filters.page || 1)
  const limit = Math.min(Math.max(1, filters.limit || 20), 50)
  const where: Prisma.ListingWhereInput = {}
  if (filters.status) where.status = toListingStatus(filters.status)
  if (filters.category) where.categorySlug = filters.category
  if (filters.flagged === "true" || filters.flagged === "1") {
    where.OR = [
      { status: ListingStatus.FLAGGED },
      { reports: { some: { status: ReportStatus.PENDING } } },
    ]
  }
  if (filters.search) {
    where.title = { contains: filters.search, mode: "insensitive" }
  }

  const [data, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        images: { take: 1, orderBy: { order: "asc" } },
        seller: { select: SAFE_USER_SELECT },
        _count: { select: { reports: true } },
      },
    }),
    prisma.listing.count({ where }),
  ])

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  }
}

export async function updateAdminListing(id: string, status: string) {
  return prisma.listing.update({
    where: { id },
    data: { status: toListingStatus(status) },
    include: { images: { take: 1, orderBy: { order: "asc" } }, seller: { select: SAFE_USER_SELECT } },
  })
}

export async function hardDeleteListing(id: string) {
  return hardDeleteListingById(id)
}

export async function bulkListingAction(ids: string[], action: string) {
  const uniqueIds = [...new Set(ids.filter(Boolean))]
  if (!uniqueIds.length) return { success: true, updated: 0 }
  if (action === "delete") {
    for (const id of uniqueIds) {
      await hardDeleteListingById(id)
    }
    return { success: true, updated: uniqueIds.length }
  }
  const status = action === "approve" ? ListingStatus.ACTIVE : ListingStatus.DELETED
  const result = await prisma.listing.updateMany({
    where: { id: { in: uniqueIds } },
    data: { status },
  })
  return { success: true, updated: result.count }
}

export async function getReportsPage(filters: { page?: number; limit?: number; status?: string }) {
  const page = Math.max(1, filters.page || 1)
  const limit = Math.min(Math.max(1, filters.limit || 20), 50)
  const where: Prisma.ReportWhereInput = {}
  if (filters.status && Object.values(ReportStatus).includes(filters.status as ReportStatus)) {
    where.status = filters.status as ReportStatus
  }
  const [data, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        listing: {
          include: {
            images: { take: 1, orderBy: { order: "asc" } },
            seller: { select: SAFE_USER_SELECT },
          },
        },
        reporter: { select: SAFE_USER_SELECT },
      },
    }),
    prisma.report.count({ where }),
  ])
  return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) }
}

export async function resolveReport(id: string, action: string) {
  const report = await prisma.report.findUnique({
    where: { id },
    include: { listing: { select: { id: true, sellerId: true } } },
  })
  if (!report) throw new Error("Report not found")
  if (action === "dismiss") {
    return updateReport(id, { status: ReportStatus.DISMISSED })
  }
  if (action === "hide_listing") {
    return updateReport(id, { status: ReportStatus.RESOLVED, listingStatus: ListingStatus.HIDDEN })
  }
  if (action === "ban_user") {
    await banUser(report.listing.sellerId, "Report resolution", null)
    return updateReport(id, { status: ReportStatus.RESOLVED, listingStatus: ListingStatus.HIDDEN })
  }
  throw new Error("Invalid report action")
}

export async function getUsersPage(filters: { page?: number; limit?: number; search?: string }) {
  const page = Math.max(1, filters.page || 1)
  const limit = Math.min(Math.max(1, filters.limit || 20), 50)
  const where: Prisma.UserWhereInput = filters.search
    ? {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { phone: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
        ],
      }
    : {}
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        ...SAFE_USER_SELECT,
        _count: { select: { listings: true, reports: true } },
      },
    }),
    prisma.user.count({ where }),
  ])
  return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) }
}

export async function searchGiftUsers(query?: string) {
  const search = query?.trim()
  if (!search || search.length < 2) return { data: [] }
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: SAFE_USER_SELECT,
  })
  return {
    data: users.map((user) => ({
      ...user,
      isPlusActive: isPlusActive(user),
    })),
  }
}

export async function giftPlus(adminId: string, data: { userId?: string; giftType?: string; note?: string }) {
  const userId = data.userId?.trim()
  const giftType = data.giftType?.trim()
  if (!userId) throw createHttpError(400, "userId is required")
  if (giftType !== "lifetime" && giftType !== "1month") throw createHttpError(400, "Invalid giftType")

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: SAFE_USER_SELECT,
  })
  if (!user) throw createHttpError(404, "User not found")

  const now = new Date()
  const plusUntil = giftType === "1month"
    ? addMonths(user.plusUntil && user.plusUntil > now ? user.plusUntil : now, 1)
    : null

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: giftType === "lifetime"
        ? { isLifetimePlus: true, plusUntil: null }
        : { plusUntil },
      select: SAFE_USER_SELECT,
    })
    const gift = await tx.plusGift.create({
      data: {
        userId,
        giftedBy: adminId,
        giftType,
        note: data.note?.trim() || null,
      },
    })
    await tx.notification.create({
      data: {
        userId,
        type: "plus_gift",
        title: "You've received a Plus gift from BayonHub!",
        body: giftType === "lifetime" ? "Your Plus membership is active for life." : "Your Plus membership was extended by 1 month.",
        link: "/account",
      },
    })
    return { user: { ...updatedUser, isPlusActive: isPlusActive(updatedUser) }, gift }
  })

  return result
}

export async function revokePlus(userId: string, note?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: SAFE_USER_SELECT })
  if (!user) throw createHttpError(404, "User not found")
  const activeGift = await prisma.plusGift.findFirst({
    where: { userId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  })
  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { isLifetimePlus: false, plusUntil: null },
      select: SAFE_USER_SELECT,
    })
    if (activeGift) {
      await tx.plusGift.update({
        where: { id: activeGift.id },
        data: { revokedAt: new Date(), note: note?.trim() || undefined },
      })
    }
    await tx.notification.create({
      data: {
        userId,
        type: "plus_updated",
        title: "Your Plus membership has been updated.",
        body: "Your Plus membership status was updated by BayonHub.",
        link: "/account",
      },
    })
    return { user: { ...updatedUser, isPlusActive: isPlusActive(updatedUser) } }
  })
  return result
}

export async function getGiftPlusLog(filters: { page?: number; limit?: number }) {
  const page = Math.max(1, filters.page || 1)
  const limit = Math.min(Math.max(1, filters.limit || 20), 50)
  const [data, total] = await Promise.all([
    prisma.plusGift.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: SAFE_USER_SELECT } },
    }),
    prisma.plusGift.count(),
  ])
  const adminIds = [...new Set(data.map((gift) => gift.giftedBy))]
  const admins = adminIds.length
    ? await prisma.user.findMany({
        where: { id: { in: adminIds } },
        select: { id: true, name: true, phone: true, email: true },
      })
    : []
  const adminById = new Map(admins.map((admin) => [admin.id, admin]))
  return {
    data: data.map((gift) => ({
      ...gift,
      status: gift.revokedAt ? "revoked" : "active",
      giftedByUser: adminById.get(gift.giftedBy) || null,
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  }
}

export async function getUserDetail(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...SAFE_USER_SELECT,
      listings: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { images: { take: 1, orderBy: { order: "asc" } } },
      },
      reports: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { listing: { select: { id: true, title: true, status: true } } },
      },
      buyerConversations: { select: { id: true, updatedAt: true }, take: 10, orderBy: { updatedAt: "desc" } },
      sellerConversations: { select: { id: true, updatedAt: true }, take: 10, orderBy: { updatedAt: "desc" } },
      _count: { select: { listings: true, reports: true, leads: true } },
    },
  })
  if (!user) throw new Error("User not found")
  return {
    profile: user,
    listings: user.listings,
    reports: user.reports,
    activity: {
      listingCount: user._count.listings,
      reportCount: user._count.reports,
      leadCount: user._count.leads,
      recentConversationCount: user.buyerConversations.length + user.sellerConversations.length,
    },
  }
}

export async function banUser(id: string, reason: string, duration?: number | null) {
  const bannedUntil = duration && duration > 0
    ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
    : null
  const user = await prisma.user.update({
    where: { id },
    data: { banReason: reason, bannedUntil },
    select: SAFE_USER_SELECT,
  })
  await prisma.listing.updateMany({
    where: { sellerId: id, status: ListingStatus.ACTIVE },
    data: { status: ListingStatus.HIDDEN },
  })
  return { user }
}

export async function warnUser(id: string, reason: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: SAFE_USER_SELECT })
  if (!user) throw new Error("User not found")
  return { success: true, warning: { userId: id, reason, createdAt: new Date().toISOString() } }
}

export async function unbanUser(id: string) {
  const user = await prisma.user.update({
    where: { id },
    data: { banReason: null, bannedUntil: null },
    select: SAFE_USER_SELECT,
  })
  await prisma.listing.updateMany({
    where: { sellerId: id, status: ListingStatus.HIDDEN },
    data: { status: ListingStatus.ACTIVE },
  })
  return { user }
}

export async function getBannedUsers() {
  const now = new Date()
  const users = await prisma.user.findMany({
    where: {
      banReason: { not: null },
      OR: [{ bannedUntil: null }, { bannedUntil: { gt: now } }],
    },
    orderBy: { updatedAt: "desc" },
    select: SAFE_USER_SELECT,
  })
  return { data: users }
}

export async function getAnalytics(period?: string) {
  const days = periodDays(period)
  const start = daysAgoStart(days)
  const [dauRows, listingRows, userRows, topCategories, topListings, reports, listings] = await Promise.all([
    prisma.$queryRaw<{ day: Date; count: number }[]>`
      SELECT DATE("createdAt") AS day, COUNT(DISTINCT "userId")::int AS count
      FROM "RefreshToken"
      WHERE "createdAt" >= ${start}
      GROUP BY DATE("createdAt")
      ORDER BY day ASC
    `,
    prisma.$queryRaw<{ day: Date; count: number }[]>`
      SELECT DATE("createdAt") AS day, COUNT(*)::int AS count
      FROM "Listing"
      WHERE "createdAt" >= ${start}
      GROUP BY DATE("createdAt")
      ORDER BY day ASC
    `,
    prisma.$queryRaw<{ day: Date; count: number }[]>`
      SELECT DATE("createdAt") AS day, COUNT(*)::int AS count
      FROM "User"
      WHERE "createdAt" >= ${start}
      GROUP BY DATE("createdAt")
      ORDER BY day ASC
    `,
    prisma.listing.groupBy({
      by: ["categorySlug"],
      where: { createdAt: { gte: start } },
      _count: { categorySlug: true },
      orderBy: { _count: { categorySlug: "desc" } },
      take: 8,
    }),
    prisma.listing.findMany({
      where: { createdAt: { gte: start } },
      orderBy: { viewCount: "desc" },
      take: 5,
      include: { images: { take: 1, orderBy: { order: "asc" } }, seller: { select: SAFE_USER_SELECT } },
    }),
    prisma.report.count({ where: { createdAt: { gte: start } } }),
    prisma.listing.count({ where: { createdAt: { gte: start } } }),
  ])

  return {
    dau: denseDailySeries(start, days, dauRows),
    newListings: denseDailySeries(start, days, listingRows),
    newUsers: denseDailySeries(start, days, userRows),
    topCategories: topCategories.map((item) => ({ categoryId: item.categorySlug, count: item._count.categorySlug })),
    topListings,
    reportRate: listings > 0 ? reports / listings : 0,
  }
}

export async function getFeaturedListings() {
  const data = await prisma.featuredListing.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      listing: { include: { images: { take: 1, orderBy: { order: "asc" } }, seller: { select: SAFE_USER_SELECT } } },
      admin: { select: SAFE_USER_SELECT },
    },
  })
  return { data }
}

export async function addFeaturedListing(listingId: string, adminId: string) {
  const featured = await prisma.featuredListing.upsert({
    where: { listingId },
    update: { adminId },
    create: { listingId, adminId },
    include: { listing: { include: { images: { take: 1, orderBy: { order: "asc" } } } } },
  })
  return { featured }
}

export async function removeFeaturedListing(id: string) {
  await prisma.featuredListing.deleteMany({
    where: { OR: [{ id }, { listingId: id }] },
  })
  return { success: true }
}

export async function getAppeals() {
  const data = await prisma.appeal.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    include: { user: { select: SAFE_USER_SELECT } },
  })
  return { data }
}

export async function resolveAppeal(id: string, action: string, adminNote?: string) {
  const status = action === "approve" ? "approved" : "rejected"
  const appeal = await prisma.appeal.update({
    where: { id },
    data: { status, adminNote: adminNote || null },
    include: { user: { select: SAFE_USER_SELECT } },
  })
  if (status === "approved") {
    await unbanUser(appeal.userId)
  }
  return { appeal }
}

export async function getVerificationRequests() {
  const data = await prisma.verificationRequest.findMany({
    where: { status: "pending" },
    orderBy: { submittedAt: "asc" },
    include: { user: { select: SAFE_USER_SELECT } },
  })
  return { data }
}

export async function resolveVerificationRequest(id: string, action: string, adminNote?: string) {
  if (action !== "approve" && action !== "reject") throw new Error("Invalid verification action")
  const status = action === "approve" ? "approved" : "rejected"
  const request = await prisma.verificationRequest.update({
    where: { id },
    data: {
      status,
      adminNote: adminNote || null,
      reviewedAt: new Date(),
      user: action === "approve"
        ? {
            update: {
              isVerifiedSeller: true,
              verificationTier: VerificationTier.IDENTITY,
              idVerifiedAt: new Date(),
            },
          }
        : undefined,
    },
    include: { user: { select: SAFE_USER_SELECT } },
  })
  return { request }
}

export async function getReports(cursor?: string, limit = 20) {
  const take = Math.min(limit, 50)
  const reports = await prisma.report.findMany({
    where: { status: ReportStatus.PENDING },
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: { id: true, title: true, slug: true, status: true, price: true, currency: true },
      },
      reporter: {
        select: { id: true, name: true, phone: true, avatarUrl: true },
      },
    },
  })
  const nextCursor = reports.length === take ? reports[reports.length - 1]?.id || null : null
  return { reports, nextCursor }
}

export async function updateReport(
  id: string,
  data: { status: ReportStatus; listingStatus?: ListingStatus },
) {
  const report = await prisma.report.update({
    where: { id },
    data: {
      status: data.status,
      resolvedAt: new Date(),
      listing: data.listingStatus ? { update: { status: data.listingStatus } } : undefined,
    },
    include: { listing: true, reporter: { select: SAFE_USER_SELECT } },
  })
  return report
}

export async function getAdminListings(cursor?: string, limit = 20) {
  const take = Math.min(limit, 50)
  const listings = await prisma.listing.findMany({
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      images: { take: 1, orderBy: { order: "asc" } },
      seller: { select: SAFE_USER_SELECT },
    },
  })
  const nextCursor = listings.length === take ? listings[listings.length - 1]?.id || null : null
  return { listings, nextCursor }
}

export async function updateListingStatus(id: string, status: ListingStatus) {
  return prisma.listing.update({ where: { id }, data: { status } })
}

export async function getUsers(cursor?: string, limit = 20) {
  const take = Math.min(limit, 50)
  const users = await prisma.user.findMany({
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    select: SAFE_USER_SELECT,
  })
  const nextCursor = users.length === take ? users[users.length - 1]?.id || null : null
  return { users, nextCursor }
}

export async function updateUserRole(id: string, role: Role) {
  return prisma.user.update({ where: { id }, data: { role }, select: SAFE_USER_SELECT })
}

export async function updateUserVerification(id: string, verificationTier: VerificationTier) {
  return prisma.user.update({
    where: { id },
    data: {
      verificationTier,
      phoneVerified:
        verificationTier === VerificationTier.PHONE || verificationTier === VerificationTier.IDENTITY
          ? true
          : undefined,
      isVerifiedSeller: verificationTier === VerificationTier.IDENTITY ? true : undefined,
      phoneVerifiedAt:
        verificationTier === VerificationTier.PHONE || verificationTier === VerificationTier.IDENTITY
          ? new Date()
          : null,
      idVerifiedAt: verificationTier === VerificationTier.IDENTITY ? new Date() : null,
    },
    select: SAFE_USER_SELECT,
  })
}

export async function getStats() {
  const start = todayStart()
  const [
    totalListings,
    totalUsers,
    totalLeads,
    totalReports,
    activeListings,
    newTodayListings,
    newTodayUsers,
  ] = await Promise.all([
    prisma.listing.count(),
    prisma.user.count(),
    prisma.lead.count(),
    prisma.report.count(),
    prisma.listing.count({ where: { status: ListingStatus.ACTIVE } }),
    prisma.listing.count({ where: { createdAt: { gte: start } } }),
    prisma.user.count({ where: { createdAt: { gte: start } } }),
  ])
  return {
    totalListings,
    totalUsers,
    totalLeads,
    totalReports,
    activeListings,
    newTodayListings,
    newTodayUsers,
    newToday: newTodayListings,
  }
}

export async function getPendingKycApplications() {
  return prisma.kYCApplication.findMany({
    where: { status: KYCStatus.PENDING },
    orderBy: { submittedAt: "asc" },
    include: { user: { select: SAFE_USER_SELECT } },
  })
}

export async function updateKycApplication(id: string, reviewerId: string, status: KYCStatus, note?: string) {
  const application = await prisma.kYCApplication.update({
    where: { id },
    data: {
      status,
      reviewNote: note || null,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      user:
        status === KYCStatus.APPROVED
          ? {
              update: {
                verificationTier: VerificationTier.IDENTITY,
                idVerifiedAt: new Date(),
                phoneVerifiedAt: new Date(),
              },
            }
          : undefined,
    },
    include: { user: { select: SAFE_USER_SELECT } },
  })
  return application
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Image download failed: ${url}`)
  return Buffer.from(await response.arrayBuffer())
}

function requireImportString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} is required`)
  }
  return value.trim()
}

function validateImportListing(input: ImportListing): ImportListing {
  const currency = input.currency === "KHR" ? "KHR" : "USD"
  return {
    title: requireImportString(input.title, "title"),
    titleKm: input.titleKm,
    description: requireImportString(input.description, "description"),
    price: Number(input.price),
    currency,
    categorySlug: requireImportString(input.categorySlug, "categorySlug"),
    subcategorySlug: input.subcategorySlug,
    province: requireImportString(input.province, "province"),
    district: input.district,
    condition: requireImportString(input.condition, "condition"),
    images: Array.isArray(input.images) ? input.images.filter(Boolean).slice(0, 8) : [],
    sellerName: requireImportString(input.sellerName, "sellerName"),
    sellerPhone: requireImportString(input.sellerPhone, "sellerPhone"),
    facets: input.facets,
  }
}

export async function importListings(inputs: ImportListing[]) {
  if (!Array.isArray(inputs)) throw new Error("listings must be an array")
  if (inputs.length > 100) throw new Error("Maximum 100 listings per request")

  let imported = 0
  let skipped = 0
  const errors: { index: number; title?: string; error: string }[] = []

  for (const [index, rawInput] of inputs.entries()) {
    try {
      const input = validateImportListing(rawInput)
      const existingSeller = await prisma.user.findUnique({ where: { phone: input.sellerPhone } })
      const seller =
        existingSeller ||
        (await prisma.user.create({
          data: {
            phone: input.sellerPhone,
            passwordHash: await bcrypt.hash(randomUUID(), 12),
            name: input.sellerName,
            role: Role.SELLER,
            verificationTier: VerificationTier.PHONE,
            phoneVerified: true,
            phoneVerifiedAt: new Date(),
          },
        }))

      const existing = await prisma.listing.findFirst({
        where: { title: input.title, sellerId: seller.id },
        select: { id: true },
      })
      if (existing) {
        skipped += 1
        continue
      }

      const uploadedImages = await Promise.all(
        input.images.map(async (url) => {
          const buffer = await downloadImage(url)
          return processAndUpload(buffer, `listings/${randomUUID()}.webp`)
        }),
      )
      const slug = await generateUniqueSlug(input.title)

      await prisma.listing.create({
        data: {
          title: input.title,
          titleKm: input.titleKm || null,
          description: input.description,
          price: input.price,
          currency: input.currency,
          categorySlug: input.categorySlug,
          subcategorySlug: input.subcategorySlug || null,
          province: input.province,
          district: input.district || null,
          condition: input.condition,
          status: ListingStatus.ACTIVE,
          slug,
          sellerId: seller.id,
          facets: input.facets ? (input.facets as Prisma.InputJsonValue) : Prisma.JsonNull,
          images: {
            create: uploadedImages.map((image, imageIndex) => ({
              url: image.url,
              thumbUrl: image.thumbUrl,
              order: imageIndex,
            })),
          },
        },
      })
      imported += 1
    } catch (error) {
      errors.push({
        index,
        title: rawInput?.title,
        error: error instanceof Error ? error.message : "Import failed",
      })
    }
  }

  return { imported, failed: errors.length, skipped, errors }
}

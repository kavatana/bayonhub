import { ListingStatus, ReportStatus, Role, VerificationTier } from "@prisma/client"

import { prisma } from "../../lib/prisma"
import { SAFE_USER_SELECT } from "../auth/service"

function todayStart(): Date {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
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
        select: { id: true, title: true, slug: true, status: true },
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
  }
}

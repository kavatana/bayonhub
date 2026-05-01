import { LeadType, ListingStatus } from "@prisma/client"

import { prisma } from "../../lib/prisma"

function createHttpError(status: number, message: string): Error & { status: number } {
  const error = new Error(message) as Error & { status: number }
  error.status = status
  return error
}

export async function getSellerAnalytics(userId: string) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [totalListings, activeListings, allListings, leadsThisWeek, leadsByTypeRaw] = await Promise.all([
    prisma.listing.count({ where: { sellerId: userId } }),
    prisma.listing.count({ where: { sellerId: userId, status: ListingStatus.ACTIVE } }),
    prisma.listing.findMany({
      where: { sellerId: userId },
      select: {
        id: true,
        title: true,
        viewCount: true,
        contactCount: true,
        promoted: true,
        createdAt: true,
        _count: { select: { leads: true } },
      },
    }),
    prisma.lead.count({
      where: {
        listing: { sellerId: userId },
        createdAt: { gte: weekAgo },
      },
    }),
    prisma.lead.groupBy({
      by: ["type"],
      where: { listing: { sellerId: userId } },
      _count: { type: true },
    }),
  ])

  const totalViews = allListings.reduce((sum, l) => sum + l.viewCount, 0)
  const totalLeads = allListings.reduce((sum, l) => sum + l.contactCount, 0)

  const viewsThisWeek = await prisma.listing
    .aggregate({
      where: {
        sellerId: userId,
        updatedAt: { gte: weekAgo },
      },
      _sum: { viewCount: true },
    })
    .then((result) => result._sum.viewCount ?? 0)

  const topListings = [...allListings]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5)
    .map((l) => ({
      id: l.id,
      title: l.title,
      viewCount: l.viewCount,
      contactCount: l.contactCount,
      promoted: l.promoted,
    }))

  const leadsByType: Record<string, number> = {
    CALL: 0,
    WHATSAPP: 0,
    TELEGRAM: 0,
    CHAT: 0,
    OFFER: 0,
  }
  for (const row of leadsByTypeRaw) {
    const key = row.type as LeadType
    leadsByType[key] = row._count.type
  }

  return {
    totalListings,
    activeListings,
    totalViews,
    totalLeads,
    leadsThisWeek,
    viewsThisWeek,
    topListings,
    leadsByType,
  }
}

export async function getSellerProfile(id: string) {
  const seller = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      bio: true,
      verificationTier: true,
      createdAt: true,
      phoneVerifiedAt: true,
      _count: {
        select: {
          listings: { where: { status: ListingStatus.ACTIVE } },
        },
      },
    },
  })
  if (!seller) throw createHttpError(404, "Seller not found")
  return seller
}

export async function getSellerListings(id: string, cursor?: string, limit = 20) {
  const take = Math.min(limit, 50)
  const listings = await prisma.listing.findMany({
    where: { sellerId: id, status: ListingStatus.ACTIVE },
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      images: { take: 1, orderBy: { order: "asc" } },
    },
  })
  const nextCursor = listings.length === take ? listings[listings.length - 1]?.id || null : null
  return { listings, nextCursor }
}

export async function getMerchantProfile(userId: string) {
  return prisma.merchantProfile.findUnique({
    where: { userId },
  })
}

export async function upsertMerchantProfile(userId: string, data: any) {
  return prisma.merchantProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  })
}

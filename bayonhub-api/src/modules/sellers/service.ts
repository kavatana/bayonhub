import { ListingStatus } from "@prisma/client"

import { prisma } from "../../lib/prisma"

function createHttpError(status: number, message: string): Error & { status: number } {
  const error = new Error(message) as Error & { status: number }
  error.status = status
  return error
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

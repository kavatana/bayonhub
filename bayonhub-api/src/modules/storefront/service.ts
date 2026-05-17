import { PrismaClient } from "@prisma/client"

import { isUserPlus } from "../users/service"

const prisma = new PrismaClient()

function withStorefrontBadges(storefront: {
  id: string
  name: string
  avatarUrl?: string | null
  verificationTier?: string | null
  isVerifiedSeller?: boolean | null
  plusUntil?: Date | null
  isLifetimePlus?: boolean | null
  listings?: Record<string, unknown>[]
  [key: string]: unknown
}) {
  return {
    ...storefront,
    isPlusMember: true,
    listings: (storefront.listings || []).map((listing) => ({
      ...listing,
      isPlusMember: true,
      seller: {
        id: storefront.id,
        name: storefront.name,
        avatarUrl: storefront.avatarUrl,
        verificationTier: storefront.verificationTier,
        isVerifiedSeller: storefront.isVerifiedSeller,
        plusUntil: storefront.plusUntil,
        isLifetimePlus: storefront.isLifetimePlus,
        isPlusMember: true,
      },
    })),
  }
}

function createPlusRequiredError(): Error & { status: number; publicError: string; code: string } {
  const error = new Error("Storefront is a Plus feature.") as Error & {
    status: number
    publicError: string
    code: string
  }
  error.status = 403
  error.publicError = "PLUS_REQUIRED"
  error.code = "PLUS_REQUIRED"
  return error
}

export const getStorefrontBySlug = async (slug: string) => {
  const storefront = await prisma.user.findUnique({
    where: { slug },
    include: {
      merchantProfile: true,
      listings: {
        where: { status: "ACTIVE", deletedAt: null },
        include: {
          images: {
            orderBy: { order: "asc" },
            take: 1
          }
        },
        orderBy: { createdAt: "desc" }
      },
      reviewsReceived: {
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      },
      _count: { select: { sellerConversations: true, sellerFollowers: true } }
    }
  })
  if (!storefront) return null
  if (!(await isUserPlus(storefront.id))) throw createPlusRequiredError()
  return withStorefrontBadges(storefront)
}

export const getStorefrontById = async (id: string) => {
  const storefront = await prisma.user.findUnique({
    where: { id },
    include: {
      merchantProfile: true,
      listings: {
        where: { status: "ACTIVE", deletedAt: null },
        include: {
          images: {
            orderBy: { order: "asc" },
            take: 1
          }
        },
        orderBy: { createdAt: "desc" }
      },
      reviewsReceived: {
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      },
      _count: { select: { sellerConversations: true, sellerFollowers: true } }
    }
  })
  if (!storefront) return null
  if (!(await isUserPlus(storefront.id))) throw createPlusRequiredError()
  return withStorefrontBadges(storefront)
}

export const createReview = async (data: {
  rating: number
  comment?: string
  reviewerId: string
  sellerId: string
  listingId?: string
}) => {
  return prisma.review.create({
    data,
    include: {
      reviewer: {
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      }
    }
  })
}

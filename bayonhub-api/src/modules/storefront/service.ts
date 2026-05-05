import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const getStorefrontBySlug = async (slug: string) => {
  return prisma.user.findUnique({
    where: { slug },
    include: {
      merchantProfile: true,
      listings: {
        where: { status: "ACTIVE" },
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
      }
    }
  })
}

export const getStorefrontById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    include: {
      merchantProfile: true,
      listings: {
        where: { status: "ACTIVE" },
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
      }
    }
  })
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

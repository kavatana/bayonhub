import bcrypt from "bcryptjs"

import { prisma } from "../../lib/prisma"
import { SAFE_USER_SELECT } from "../auth/service"

function createHttpError(status: number, message: string): Error & { status: number } {
  const error = new Error(message) as Error & { status: number }
  error.status = status
  return error
}

export async function getSavedListings(userId: string, cursor?: string, limit = 20) {
  const take = Math.min(limit, 50)
  const savedListings = await prisma.savedListing.findMany({
    where: { userId },
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        include: {
          images: { take: 1, orderBy: { order: "asc" } },
          seller: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              verificationTier: true,
              createdAt: true,
              phoneVerifiedAt: true,
            },
          },
        },
      },
    },
  })
  const nextCursor =
    savedListings.length === take ? savedListings[savedListings.length - 1]?.id || null : null
  return { savedListings, nextCursor }
}

export async function updateProfile(
  userId: string,
  data: { name?: string; bio?: string; avatarUrl?: string; language?: string },
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      bio: data.bio,
      avatarUrl: data.avatarUrl,
      language: data.language,
    },
    select: SAFE_USER_SELECT,
  })
}

export async function updatePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw createHttpError(404, "User not found")

  const matches = await bcrypt.compare(oldPassword, user.passwordHash)
  if (!matches) throw createHttpError(400, "Current password is incorrect")

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  })
  return { success: true }
}
